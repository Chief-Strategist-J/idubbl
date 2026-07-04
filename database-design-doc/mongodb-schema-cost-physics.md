# The Physics of MongoDB Schema Design
### Why nested/relational decisions are correct or wrong — derived from storage mechanics, not pattern names

---

## Part 1: Why "patterns" are the wrong unit of thought

Every MongoDB schema guide gives you pattern names — embed, reference, bucket, extended reference, polymorphic, tree. Naming a pattern doesn't tell you if it's right for *your* data. Two teams can both "use the bucket pattern" and one is correct, one is wrong, because the pattern isn't the thing that determines correctness — the underlying physical cost is.

There are exactly **three physical costs** every nested/relational decision incurs, because there are exactly three things the storage engine and the network do that you don't control directly: how it persists a mutation, how many places a value's fan-out lives, and what rides along into RAM when you touch a document. Once you can compute these three numbers for a given relationship shape, "which pattern" stops being a judgment call — it's arithmetic.

This document derives each cost from first principles (what WiredTiger and mongos actually do), then applies the three-cost model to every relationship shape you'll encounter in a real domain, with the reasoning for why each decision is correct spelled out mechanically, not by analogy.

---

## Part 2: The three cost primitives, derived

### 2.1 Write Amplification Factor (WAF) — derived from MVCC + B-tree page mechanics

**Mechanism**: WiredTiger is an MVCC storage engine using B-tree pages. A document lives inside a page as a complete BSON blob. There is no in-place field-level mutation at the storage layer — when you `$set` one field, WiredTiger:

1. Reads the full page containing the document into memory (if not cached).
2. Deserializes/locates the document within the page.
3. Constructs a **new complete version** of the document (old fields + your change) as a new BSON blob.
4. Marks the old version obsolete (visible to older transactions until checkpoint) and writes the new full document into the page (or a new page, if the page is full — causing a page split).
5. This new page version propagates through: the in-memory cache, the write-ahead log (journal), the oplog (for replication), and eventually the checkpoint to disk.

Every one of those five steps operates on **the whole document**, not the changed field. So:

```
WAF = size(full_document_after_write) / size(logical_change)
```

This is not an approximation — it is the literal ratio of bytes that move through your journal, oplog, network replication, and eventually disk, versus the bytes of information you actually intended to persist.

**Second-order effect — oplog pressure**: the oplog is a capped collection recording each write's *effect*. A full-document `$set` on a 2MB document doesn't put 2MB in the oplog (oplog entries are typically the delta operation, not the full doc, for `$set`/`$inc` etc.) — **but** array operations like `$push` on a large array, or any operation requiring document move (page split, or `$rename` triggering internal restructuring), can force a full-document oplog entry. This means WAF isn't just a primary-node disk cost — it's a **replication bandwidth cost**, multiplied by your replica count. At 3 replicas, a bad WAF doesn't cost you 1x — it costs you 3x on the network between primary and secondaries, continuously, for every such write.

**Third-order effect — the WAF/time coupling**: for any document that grows monotonically (embedded history, embedded arrays that only ever grow), WAF is not a fixed constant — it's a function of document age:

```
WAF(t) = document_size(t) / average_logical_change_size
```

Since `document_size(t)` grows over the document's lifetime, **WAF grows over time for every document individually**. This is the mechanical reason "the app got slower for our oldest data" is not a coincidence or a vague scaling story — it is the literal, derivable consequence of embedding unbounded data. No load increase is required to produce this degradation; it happens to a single, popular, long-lived document even under constant traffic.

---

### 2.2 Fan-out Cost — derived from denormalization's actual mechanism

**Mechanism**: when you copy a value from a source-of-truth document into N other documents (denormalization), you have created N+1 physical locations for that value. Any logical edit to the source value requires either:

(a) N+1 individual writes (if done synchronously/eagerly), or
(b) a background propagation job doing N writes (if done via change stream/eventually), which still costs N writes — it just moves *when* they happen, not *how many*.

```
Fan-out cost of one logical edit = N_documents_holding_copy × 1 write each
Fan-out cost per unit time = N_documents_holding_copy × edit_frequency_of_source_field
```

**Why this is a real, not theoretical, cost at scale**: N is a function of *popularity*, and popularity in real systems is not uniform — it's power-law distributed. A "typical" tag might be on 50 products (fan-out cost of a rename: trivial). Your *most popular* tag might be on 2 million products. Since you design your schema once, but the actual N your schema experiences is set by whichever value becomes most popular in practice, **you must design for the tail of the distribution, not the median.** This is the single most common reason denormalization "worked in testing" (median case, small N) and became an incident in production (someone edited the most-popular value, worst-case N).

**The compounding case — fan-out × WAF together**: if the N documents receiving the copy are themselves large (high WAF individually), the true cost is:

```
True propagation cost = N × WAF_per_document × logical_change_size
```

This is why "denormalize a small field into large documents" is a double tax: you pay fan-out (many documents to touch) *and* WAF (each touch rewrites a whole large document) simultaneously. The correct denormalization target is a field that is both **low mutation frequency** and lands in **small documents** — violating either condition multiplies the cost, violating both makes it quadratically worse.

---

### 2.3 Working-Set Pollution — derived from cache granularity

**Mechanism**: WiredTiger's cache (default ~50% of RAM minus 1GB) holds pages, and pages hold whole documents. There is no field-level caching — reading one field of a document pulls the *entire document's page* into cache. If your document is 500KB and you only ever query a 5KB "current state" slice of it, every access caches the other 495KB anyway.

```
Effective useful cache ratio = hot_bytes_actually_queried / total_bytes_in_document
Effective hot-data capacity = RAM_allocated_to_cache × effective_useful_cache_ratio
```

**Why this degrades silently**: as history/embedded arrays grow inside a document (the same unbounded-embed pattern that causes WAF growth), `total_bytes_in_document` grows while `hot_bytes_actually_queried` stays constant (you still only care about current state). The ratio — and therefore your effective usable cache — shrinks continuously. Eventually your working set (the documents actually being touched by live traffic) stops fitting in RAM, and WiredTiger starts evicting pages under memory pressure, which means **subsequent reads of the same "hot" documents now require disk I/O** — a cache-miss cost that scales with page size, i.e., with how much cold data is riding along.

**Second-order effect — eviction cascade**: WiredTiger's eviction is not perfectly LRU-per-document; under sustained cache pressure, eviction threads compete with application threads for the same internal locks, meaning a working-set-pollution problem doesn't just slow down the polluted collection — it can degrade *unrelated* collections sharing the same cache budget, because the whole instance's effective cache shrinks.

---

## Part 3: The unified decision function

Given a candidate schema shape for a relationship, compute:

```
Total_Cost = WAF(t) × write_frequency
           + Fan-out(N, edit_frequency)
           + Working_Set_Penalty(hot_ratio, RAM_budget)
```

You are not solving for zero on all three — that's impossible (pure normalization minimizes fan-out and working-set pollution but maximizes round-trip/join cost, which is a fourth, *read-side* cost: network hops). You are solving for **the design where all three costs are bounded and non-growing over time**, even if none of them is literally zero. This is the actual definition of "correct at 10M-user scale": not "fast today," but "the cost function does not have a time-dependent term that grows as your data ages or your popularity distribution sharpens."

**The single test that separates correct from incorrect designs:**

> Does any cost term in this schema have a *t* (time / growth) or *N-tail* (popularity-distribution) dependency that isn't bounded by a cap you've explicitly engineered (bucket size, fan-out target choice, path depth)?

If yes — the design will degrade as a function of your own success (more data, more users, more popular entities), regardless of how well it performs in initial testing. This is why load testing against small synthetic data cannot catch these bugs: the cost term that matters is a function of *t* and *N-tail*, neither of which exists yet in a fresh test dataset.

---

## Part 4: Applying the model — deep case studies

### Case A: Unbounded embedded array (history, logs, revisions)

**Shape**: `{ orderId, history: [ ...grows forever... ] }`

- **WAF(t)** = `doc_size(t) / entry_size`, unbounded, grows with `t`. ⚠️ Fails the test — has an explicit *t*-dependency with no cap.
- **Fan-out** = N/A (not denormalized elsewhere) — 0 by default.
- **Working-set pollution** = `hot_ratio(t) = current_state_size / (current_state_size + history_size(t))` → tends to 0 as t grows. ⚠️ Also fails the test.

**Why wrong, precisely**: two of three cost terms are unbounded functions of time. This isn't "suboptimal," it's a design that guarantees its own future failure as a mathematical certainty, not a risk.

**Fix — bucket pattern with explicit cap**:
`{ orderId, bucketSeq, count: ≤150, entries: [...] }`

- **WAF** = `bucket_max_size / entry_size` — **constant**, independent of *t*. ✅ Bounded.
- **Working-set pollution** = only the *current* (highest bucketSeq) bucket is hot; older buckets are cold and, critically, **never touched again**, so they don't compete for cache with hot data even though they still exist. ✅ Bounded by bucket size, not by total history.

**The precise reason the cap number matters**: bucket size isn't arbitrary — it's chosen to balance WAF (smaller bucket = lower WAF per write, since less gets rewritten) against per-document overhead (smaller bucket = more documents = more index entries = more per-document overhead in the index B-tree). The optimum is where `bucket_size × entry_size ≈ target page size` for your storage engine's internal page size (commonly 4-32KB compressed) — small enough that a single bucket write stays cheap, large enough that you're not creating an excessive number of tiny documents (each with its own index-entry overhead, and its own document header overhead, which stops being negligible below a few KB per document).

---

### Case B: Many-to-many with popularity-skewed fan-out (tags, categories)

**Shape** (wrong): value copied into every referencing document.

- **Fan-out** = `N_tail × edit_frequency`, where `N_tail` is dictated by your *most popular* value, not your average one. ⚠️ Fails the test — N-tail dependency with no engineered cap.

**Shape** (right): reference-only, single source of truth, no copy.

- **Fan-out** = 1 (only the source document changes). ✅ Bounded — and bounded at the *tightest possible* value, 1, regardless of how popular the value becomes.
- **Trade-off incurred**: read-side cost — every read needing the tag name now needs a second lookup. This is a real cost, but note its shape: it's **O(1) per read, does not degrade with N or t.** You've converted an unbounded write-time cost into a bounded, constant read-time cost. This is the correct trade because write-time costs compound with popularity (the exact thing you can't predict or cap at design time), while this particular read-time cost does not.

**The subtlety the "just reference it" answer misses**: if the referenced value is *read* far more often than it's *written* (true for almost all tag/category/label data — read-heavy, write-rare), you can safely cache it in application memory (not in Mongo documents) with a short TTL, since the write rate to the source is low enough that staleness windows are cheap. This gets you O(1) reads *and* O(1) fan-out simultaneously — the point being the cache lives in the read path (app-layer, ephemeral), not in the document model (durable, fan-out-prone). Conflating "cache for read performance" with "denormalize into the document" is the actual mistake underneath most bad many-to-many schemas.

---

### Case C: Trees under mutation — the condition that flips the right answer

**Materialized path** — cost of a re-parent operation on a subtree of size K:
```
Fan-out(reorg) = K_subtree_size × reorg_frequency
```

This is bounded *only if* `K × reorg_frequency` is itself bounded — i.e., only if your actual domain guarantees subtrees stay small and reorgs stay rare. **This is a claim about your domain, not about the pattern.** The pattern is not universally right or wrong — it's right exactly when this product of two domain-specific numbers stays small, and wrong the moment either number grows past what you assumed at design time (org restructures get more frequent as the company scales; subtrees get deeper as more approval levels are added).

**Closure table** — decouples structure-mutation cost from entity-mutation cost entirely:
```
Fan-out(reorg) = K_subtree_size writes to a SEPARATE, narrow edge collection
Working-set impact on entity collection = 0 (entities never touched by reorg)
```

**Why this is strictly more robust, mechanically**: it doesn't make K smaller — a reorg of the same subtree still touches the same number of logical edges. What it changes is *where* those writes land: a small, narrow, low-WAF collection instead of your primary (likely large, business-critical) entity documents. This means a structural reorg — an operationally rare, bursty event — cannot cause working-set pollution or write contention on the documents your live business traffic depends on every second. **You've isolated a bursty, unpredictable cost from your steady-state, predictable cost.** This is the actual engineering principle: not "closure table is better," but "decouple costs with different statistical shapes (bursty/rare vs. steady/constant) into different physical documents, so a spike in one cannot degrade the other."

---

### Case D: Polymorphic reference chain (multi-entity business process — quote→order→invoice→...)

**Naive normalized join chain** — cost is not a write-side cost at all, it's a **read-side latency composition problem**, which the three-cost model above doesn't directly cover, so let's derive it separately:

For a chain of M sequential `$lookup` stages across shards:
```
p99_latency(chain) ≠ sum(p99_latency(stage_i))
p99_latency(chain) is bounded below by: max_i(p99_latency(stage_i)) but tends toward
  a value CLOSER TO THE SUM under contention, because each stage's start time is
  gated by the previous stage's completion (no overlap), and queueing delay at
  each hop is itself load-dependent (M/M/1-style queueing: latency grows
  non-linearly as utilization approaches capacity)
```

**Why this matters precisely**: under low load, a 5-stage lookup chain might cost close to `5 × median_latency` — annoying but survivable. Under high load (near your cluster's saturation point), each stage's *queueing* component (not just service time) grows non-linearly, and since the stages are sequential, these queueing delays stack. This is why a lookup chain that "seemed fine in load testing at 50% capacity" can degrade catastrophically at 85% capacity in a way that a single-hop query at the same utilization does not — the mathematical shape of the degradation is different (linear-ish for one hop, super-linear compounding for a sequential chain), not just "a bit slower."

**Fix — the refChain projection**, collapsing M hops to 1:
```
p99_latency(refChain query) = p99_latency(single indexed equality match)
— independent of M (number of entities in the business chain)
— independent of load, up to the same saturation point a single query would hit
```

**The cost you accept in exchange**, precisely stated:
```
Write-side cost = fan-out(1 write to refChain projection per state change)
                   + change-stream consumer lag (bounded, monitorable via oplog window, §34 prior doc)
```

**Why this trade is correct, not just convenient**: you are converting an *unbounded-under-load, multiplicative* read-side cost into a *bounded, additive, independently-monitorable* write-side cost. The write-side cost has a ceiling you can compute and alert on (oplog window size ÷ write rate = maximum tolerable consumer downtime). The read-side cost in the naive version has no such ceiling — it degrades as a function of concurrent load in a way you cannot cap by configuration, only by refusing to serve traffic past a point.

---

## Part 5: The worksheet — apply this to any relationship before you build it

For any relationship in your domain, fill this in honestly. If you cannot answer a row, that's a signal you need to instrument/measure, not guess.

| Question | Your answer | Cost term it feeds |
|---|---|---|
| Does this field/array grow with time, unbounded? | | WAF(t) |
| What's the average logical change size vs. total document size, at doc age = 1yr? | | WAF(t) |
| Is this value copied into other documents? If so, how many (median AND worst-case/most-popular)? | | Fan-out |
| How often does the source value change? | | Fan-out |
| What fraction of this document's bytes are actually read on a typical query? | | Working-set |
| Is there a domain-level guarantee bounding subtree size / fan-out count / bucket size — or is it "however big it gets"? | | All three |
| If this is a multi-hop reference chain, how many hops does the most common cross-entity query traverse? | | Read-side latency composition |

**The rule for filling this out honestly**: for every "how big could this get" question, answer with the worst case you can imagine a real user/tenant reaching, not the current observed average. The cost model's failure mode is always underestimating the tail, because the tail is precisely the case that doesn't show up in small-scale testing and does show up the day your product has one unexpectedly popular customer, category, or viral event.

---

## Part 6: What I can and cannot tell you without your real numbers

Everything derived above is mechanism and shape of the cost function — that part is true regardless of your specific system, because it follows from how WiredTiger and mongos actually work, not from convention. What I cannot honestly give you without your real data:

- The actual bucket size that minimizes your specific WAF/overhead trade-off (depends on your entry size and page size).
- The actual N-tail for your fan-out cases (depends on your real popularity distribution — measurable via `db.collection.aggregate([{$sortByCount: "$referencedField"}])` against production data).
- The actual hot-ratio for your documents (measurable via `db.collection.stats()` for total size, and profiling actual field-access patterns from your query logs).
- Whether your specific chain-query load is anywhere near the saturation point where the super-linear queueing effect in Case D actually bites.

If you give me real numbers — document sizes, mutation frequencies, expected max fan-out for your specific entities (quote, order, PI, invoice) — I'll run the actual WAF/fan-out/working-set arithmetic against your numbers instead of illustrative ones, and tell you exactly where the cost function has an unbounded term, if it does.
