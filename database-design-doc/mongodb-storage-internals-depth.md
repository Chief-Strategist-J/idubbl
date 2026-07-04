# MongoDB Storage Internals — The Actual Mechanism Behind Every Schema Decision

This goes one layer below the cost formulas — into the literal data structures and algorithms that produce them. If the previous document told you *that* WAF/fan-out/working-set exist, this tells you the exact machinery that makes them true, so you can reason about edge cases the formulas don't cover.

---

## Part 1: What a "document write" physically is, step by step

### 1.1 The B-tree, precisely

WiredTiger stores each collection and each index as a **separate B-tree**. A B-tree is not a metaphor here — it's a literal disk structure:

- **Leaf pages** hold the actual data: for a collection B-tree, `{_id, full BSON document}` pairs, sorted by `_id` (or the clustering key). For an index B-tree, `{index key, _id or record pointer}` pairs, sorted by the index key.
- **Internal pages** hold routing entries: `{key range, pointer to child page}`.
- **Page size** is configurable but defaults to roughly 4KB (internal pages) and up to 32KB (leaf pages) *before compression* — this is a tunable (`internal_page_max`, `leaf_page_max`), not a hard constant, but these are the practical defaults you're operating under unless you've changed them.

**The depth of the tree** — and therefore the number of page reads for a point lookup — is:

```
depth ≈ log_branching_factor(N)
branching_factor ≈ leaf_page_max / average_key_size
```

For a `tenantId + _id` compound index with a ~30-byte key, branching factor is roughly `32KB / 30B ≈ 1000`. At 10M documents in one tenant's slice: `log_1000(10,000,000) ≈ 2.3` — meaning **an indexed point lookup touches roughly 2-3 pages**, almost always cached after the first access (internal pages are small in total number and stay hot). This is *why* an indexed query's cost is "flat" up to enormous N — the log base is large enough that N growing by 10x barely moves depth at all (going from 1M to 10M docs adds less than one tree level). This is the actual mechanical reason "indexed lookups scale," not a hand-wave.

**Compare to a collection scan**: no tree navigation, sequential page reads, cost = `total_data_size / page_size` pages, linear in N, no logarithm to save you. This is why "missing an index" isn't "somewhat slower" — it's the difference between a cost function with a `log` in it and one without.

### 1.2 What happens when you `updateOne` a single field — the actual sequence

1. **Transaction begins.** WiredTiger assigns your operation a transaction ID and a **read snapshot** — the set of transaction IDs whose changes are visible to you (this is what "MVCC" concretely means: every record on a page carries a list of update versions tagged with the transaction ID that created them, and your transaction walks that list to find the version visible to your snapshot).

2. **Page fetch.** The leaf page containing your document's key is located via the B-tree (§1.1's traversal), pulled into the in-memory page cache if not resident.

3. **In-memory update chain (skiplist), not immediate rewrite.** This is the part people miss: WiredTiger does **not** immediately serialize a whole new BSON document to disk on every `$set`. In memory, each page has an update structure — conceptually a **skip list of pending modifications** per record, ordered by transaction commit order. Your `$set` appends a new entry to this in-memory chain: "as of transaction T, field X = Y." Multiple concurrent updates to the *same* document create a chain of versions in memory, each visible only to transactions with a compatible snapshot.

4. **This is where "the whole document rewrites" actually happens — at reconciliation, not at update time.** Periodically (checkpoint, or when a page becomes "dirty" enough — see eviction below), WiredTiger **reconciles** the page: it takes the base on-disk version plus the entire pending-update skiplist chain, and produces a **new, complete, flattened version of the page** (which contains the whole document, not just the delta) to write to disk. This reconciled page is what actually hits disk/checkpoint.

**Why this matters for your mental model of WAF**: the "full document rewrite" cost is not paid *per update call* in real time — it's paid at **reconciliation time**, which batches multiple in-memory updates into one disk write. This means WAF as I derived it earlier (`full_doc_size / logical_change_size`) is actually an amortized-per-reconciliation number, not a strictly per-`updateOne`-call number. **If you issue 50 small updates to the same document within one checkpoint interval, they can be coalesced into a single page reconciliation** — meaning burst-writes to the same hot document are cheaper, per-write, than the naive formula suggests, because reconciliation cost is paid once for the batch, not once per update.

**But this coalescing has a ceiling**, and here's the precise mechanism that reintroduces the WAF problem even with coalescing: **checkpoints run on a timer** (default: roughly every 60 seconds) *and* whenever a page's accumulated in-memory update chain grows large enough to trigger **eviction** (see §1.3) — pages don't get to defer reconciliation indefinitely. A single hot document receiving continuous writes will still get reconciled roughly once per checkpoint interval or once per eviction trigger, whichever comes first — and *at that moment*, the full-document-size cost is paid, regardless of how many logical changes were coalesced into it. So: **coalescing reduces WAF's coefficient, it does not remove the term.** For a 2MB document being updated continuously, you still pay a ~2MB reconciliation write roughly every checkpoint interval — the earlier formula holds at the checkpoint-interval timescale, just not at the individual-API-call timescale.

### 1.3 Eviction — why working-set pollution isn't just "slower cache," it's active CPU contention

WiredTiger's cache has two watermarks (both tunable, defaults are approximately: eviction trigger around 95-97% of cache full for dirty pages, and an eviction target around 80% to evict down to):

- Below the trigger: normal operation, background eviction threads lazily evict clean/cold pages.
- **At the trigger**: **application threads themselves are conscripted into eviction work** — a thread that would otherwise be serving your query instead spends cycles evicting pages to make room. This is the precise mechanism behind "the whole instance got slower, not just the polluted collection" from the previous document — it's not a metaphor about "shared resources," it's that your read/write-serving threads are *literally executing eviction code* instead of your query, under sustained cache pressure.

**The precise trigger for working-set pollution to become a CPU problem, not just an I/O problem**: it's not merely "your data doesn't fit in RAM" — plenty of systems run with datasets larger than RAM and are fine, because *cold* data, once evicted, doesn't get re-requested. The actual failure mode is when your **access pattern re-requests pages faster than eviction can keep ahead of dirty-page accumulation** — i.e., when hot pages keep getting modified (marking them dirty again) while cold bytes riding along on the same pages prevent efficient eviction targeting. This is why a document that's 20% hot state + 80% cold history, under continuous writes to the hot part, is worse than a document that's just "large but rarely written" — it's the **combination of largeness and write frequency** that drives sustained eviction pressure, not size alone.

---

## Part 2: The oplog — precise format, and why it changes the fan-out story

### 2.1 What actually gets replicated

Since MongoDB 4.0's oplog format (`$v: 2`), update operations are recorded in the oplog using one of two forms:

- **Replacement-style**: the entire post-image document (used for `replaceOne`/full-document replace).
- **Delta-style** (`$v: 2` diff format): a compact representation of *just the changed fields/array indices*, not the whole document — this is what a `$set`/`$inc`/`$push` on a specific field typically produces.

**Why this matters for your cost model, precisely**: the delta-style oplog format means **replication bandwidth for a single-field `$set` is NOT proportional to full document size** — it's proportional to the size of the changed field, roughly. This is a real, important correction to a naive WAF story: the *disk-side* reconciliation cost (§1.2) genuinely does scale with full document size (that's real, unavoidable), but the *replication* cost across your replica set does not scale the same way for simple field updates, because the oplog transmits deltas.

**Where this correction breaks down** — and where full-document oplog cost re-enters: array operations that require **element-position shifts** (inserting into the middle of an array, or any operation the diff algorithm can't represent compactly) can force a larger diff, and in degenerate cases approach full-array-size. This is a second, oplog-specific reason `$push`-heavy unbounded arrays are worse than they first appear: not just the disk-side reconciliation WAF (§1.2), but potentially a proportionally larger oplog diff too, meaning the replication-bandwidth cost also scales with array size for these operations, even though it wouldn't for a simple scalar field update.

**The actionable precision this gives you**: a `$set` on a scalar field inside a large document is cheaper on the replication side than the naive "full document WAF" model predicts — the oplog specifically mitigates this. But `$push`/array-splice operations on a large embedded array do **not** get this mitigation as reliably — reinforcing, via a completely different mechanism (oplog diff size, not just page reconciliation), the same conclusion the bucket pattern was built to address.

---

## Part 3: Sharding — the actual protocol, not just "the balancer moves chunks"

### 3.1 Chunk migration, the real phase sequence

A `moveChunk` operation (whether triggered manually or by the balancer) runs through distinct phases, and the cost/consistency properties differ *by phase*:

1. **Clone phase**: the destination shard pulls a full copy of every document in the chunk's range from the source shard, via a snapshot read. During this phase, the **source shard continues to serve reads and writes** for that chunk normally — this is not a blocking operation yet.

2. **Catch-up (delta) phase**: while the clone was happening, the source shard's chunk kept receiving live writes. The destination now pulls the *incremental* changes that occurred during the clone (essentially a mini-oplog-tail specific to that chunk's range) and applies them, repeating until the destination is caught up to a very small lag.

3. **Commit phase — the actual atomic moment**: this is where the **config server** (the source of truth for chunk-to-shard ownership metadata) is updated in a transaction to reflect that the chunk now belongs to the destination shard. This step briefly acquires a **distributed lock** and involves the source shard flushing its last few writes to the destination before handoff. This is genuinely a short blocking window (typically well under a second for reasonably sized chunks) — writes to that specific chunk's key range can stall briefly here, but writes to *other* chunks (even on the same shards) are unaffected.

4. **Cleanup phase**: the source shard deletes its now-stale local copy of the chunk's data (this is the exact origin of "orphaned documents" from the earlier doc's §82 — if this cleanup phase is interrupted by a crash or network partition, stale copies can persist on the source shard even though ownership metadata says the destination owns the chunk).

**Why understanding these phases changes how you reason about migration cost**: the expensive, long-running part (clone + catch-up) is **non-blocking** — your cluster keeps serving traffic. The **only** genuinely blocking part is the brief config-server commit. This is why chunk migrations are described as "low impact" in normal operation — but it also tells you exactly *why* a **jumbo chunk** (one that's grown past the splittable size, commonly because a single shard-key value has too much data, e.g., a whale tenant without zone sharding) is uniquely bad: the clone phase for a jumbo chunk takes proportionally longer (more data to copy), which means the window where source and destination shards are both fielding the delta-catch-up traffic is longer, increasing the probability of the commit-phase lock contending with live traffic — a probabilistic cost, not a fixed one, that grows with chunk size.

### 3.2 The config server's actual role, and why routing cache staleness is a real, boundable risk

The config server replica set holds the **authoritative chunk-to-shard mapping**. Every `mongos` router caches this mapping locally (it doesn't query the config server on every single request — that would be a bottleneck). This cache is refreshed:

- Proactively, at intervals.
- **Reactively**, when a shard returns a `StaleShardVersion` error — meaning the `mongos` sent a request to a shard believing it owns a chunk it no longer owns (because a migration completed after the router's cache was populated). The shard detects the mismatch (it tracks its own chunk version numbers) and rejects with this specific error, prompting the router to refresh its cache and retry.

**Why this is a designed-for failure mode, not a bug**: this means a chunk migration that just completed can cause a **transient, automatically-retried error** on the very next request routed with a stale cache — this is expected, self-healing behavior, not a consistency violation, because the retry happens transparently in the driver/router layer before your application ever sees an error, *under normal operation*. It becomes an actual application-visible problem only if your driver's retry logic is disabled or misconfigured, or if migrations are happening so frequently/rapidly that the retry-and-refresh cycle can't keep pace — which is itself a signal that your balancer is working overtime because of a chunk-distribution problem (e.g., a shard key that's causing continuous rebalancing), not a sharding-layer bug per se.

---

## Part 4: Index internals — why compound index field ORDER is a proof, not a convention

### 4.1 The B-tree key-ordering proof

A compound index `{a: 1, b: 1, c: 1}` builds **one B-tree** whose keys are sorted lexicographically by the tuple `(a, b, c)` — exactly like a phone book sorted by (last name, first name, middle name). This single fact proves every ESR (Equality-Sort-Range) rule, rather than requiring you to memorize it:

- **Equality on `a`** narrows the B-tree traversal to a contiguous sub-range of the tree (all entries where `a = value`) — because the tree is sorted by `a` first, all matching entries are physically adjacent. This is a genuine tree-navigation narrowing, cost `O(log N)` to find the start of the range.

- **Within that narrowed range, entries are still sorted by `b`** (the phone-book analogy: within all "Smith"s, entries are sorted by first name). So if your next predicate is a **sort** on `b`, Mongo can read entries in the exact order the tree already stores them — **zero extra sort work**, just a sequential scan of an already-ordered sub-range.

- If instead your next predicate is a **range** on `b` (e.g., `b > 5`), you get the same narrowing benefit as equality — but then **`c`'s ordering is no longer usable for anything**, because within a range of `b` values, the tuples are sorted by `b` first and `c` only *within* each distinct `b` value — meaning `c` is not globally sorted across the whole matched range. This is the literal, provable reason range fields must come *last* in ESR: any field after a range predicate loses its sort-usability, because the range predicate breaks the contiguous-sort property the tree was providing.

**Why this matters beyond "memorize ESR"**: once you see it as a property of lexicographic tree ordering, you can derive the right index for *any* query shape yourself, including ones the ESR mnemonic doesn't explicitly cover (e.g., multiple range predicates, or a sort on a field that appears before a range field in the predicate list) — you're reasoning from the actual ordering property, not pattern-matching to a memorized acronym.

### 4.2 Selectivity and why an index can be *present* and still not help you

An index's usefulness for equality narrowing is proportional to its **selectivity**:

```
selectivity = distinct_values_in_field / total_documents
```

A `status` field with 4 possible values across 10M documents has selectivity `4/10,000,000 = 0.0000004` — meaning an equality match on `status` still narrows to roughly 2.5M documents. **This is why `{tenantId, status}` as a 2-field index is fine (tenantId already narrowed you to a few thousand-to-million docs, and status narrows further within that), but `{status}` alone as a global index across all tenants is nearly useless** — you'd still be scanning millions of matching entries even with the index technically "used." This is the precise, measurable reason "index on `tenantId` first, always" isn't a tenant-isolation convention only — it's also a raw selectivity argument: `tenantId` is typically the highest-cardinality, most-selective field you have, so it belongs first in the tree for pure performance reasons even independent of the multi-tenancy concern.

---

## Part 5: A fully worked numeric example, with every assumption stated

Let's run actual numbers through this machinery for a concrete case: an `orders` collection, 10M documents, average document 3KB (current-state fields only, bucketed history elsewhere per the bucket pattern), receiving 5,000 writes/second cluster-wide across 20 shards (250 writes/sec/shard average, ignoring skew for this pass).

**B-tree depth for the primary index** (`{tenantId:1, _id:1}`), assuming ~40-byte keys and 32KB leaf pages:
```
branching factor ≈ 32,768 / 40 ≈ 819
depth ≈ log_819(10,000,000) ≈ 2.6 → effectively 3 levels
```
A point lookup by `{tenantId, orderId}` costs **at most 3 page fetches**, almost always fewer because the top 1-2 levels (internal pages, small in total count) stay resident in cache indefinitely. This is why, at 10M documents, an indexed point query and an indexed point query at 1M documents cost essentially the same — the depth difference is under one tree level.

**Reconciliation cost per write**, assuming a 3KB document and checkpoint interval of 60 seconds, with an average order receiving roughly 1 update per minute during active processing (a reasonable assumption for a document mid-workflow):
```
WAF ≈ 3KB / (average logical change ≈ 50 bytes for a status field update) ≈ 60x
```
At 250 writes/sec/shard, each costing a ~3KB reconciled page write (batched at checkpoint boundaries per §1.2, so this is the checkpoint-interval-amortized number, not literally every single call): **the disk write bandwidth this demands per shard is bounded and modest** — roughly 250 × 3KB ≈ 750KB/sec of logical reconciliation data per shard, well within normal NVMe/SSD write bandwidth, and this number does **not** grow over time as long as document size stays bounded (which the bucket-pattern discipline guarantees).

**Compare** to the same write pattern against an *unbounded*-history version of the same document, once it's accumulated, say, 6 months of embedded history at 3KB/month:
```
document_size(6 months) ≈ 3KB (current state) + 18KB (history) = 21KB
WAF ≈ 21KB / 50 bytes ≈ 420x
```
Same write rate, same logical change — **7x more reconciliation bandwidth per shard**, and this number keeps growing every month indefinitely for orders that stay open/active long-term (exactly your longest-lived, often highest-value, customer relationships) — this is the concrete, worked version of the "WAF grows with document age" claim from the earlier document, now with actual numbers attached instead of a symbolic formula.

---

## Part 6: What this internals view corrects or sharpens from the previous, more superficial pass

1. **WAF is checkpoint-interval-amortized, not per-API-call** — bursts of updates to the same hot document within one checkpoint window are cheaper than the naive formula suggests, but the ceiling still applies once per checkpoint/eviction cycle.
2. **Oplog/replication cost for simple scalar field updates is NOT full-document-proportional** (thanks to delta-format oplog entries) — the disk-side reconciliation cost is real regardless, but don't assume your replication bandwidth is automatically 3x (replica count) your worst-case document size for every single-field update; it's closer to that for array-splice operations specifically, which is a more precise reason to bucket arrays than to worry about every embedded field equally.
3. **Working-set pollution becomes a CPU-contention problem, not just an I/O-latency problem**, specifically when write frequency to the hot portion of a document is high enough to sustain continuous eviction pressure — size alone, without write frequency, is a milder problem than size *combined with* frequent mutation.
4. **Chunk migration's expensive phase is non-blocking**; only the brief config-server commit phase can stall traffic for that specific chunk — this reframes "avoid frequent rebalancing" from "migrations are slow" to "migrations increase the probabilistic frequency of a very short, specific blocking window," which is a different (and more precise) risk model.
5. **ESR ordering is a provable consequence of B-tree key lexicographic ordering**, not a rule to memorize — this lets you derive the correct index for query shapes the mnemonic doesn't explicitly cover.

If you want to go further, the next genuinely deeper layer would be: the actual WiredTiger checkpoint algorithm (how it achieves a consistent snapshot across multiple B-trees atomically without stopping the world), or the config server's own replica-set-backed transaction mechanics for the chunk-ownership commit — both are real, documented mechanisms, and both would let you reason precisely about failure-recovery scenarios (what exactly is recoverable if a node crashes mid-checkpoint, mid-migration-commit) rather than trusting "it's durable" as an assertion.
