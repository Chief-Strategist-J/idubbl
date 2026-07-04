# MongoDB at 10M-User Scale — Queries 51–100 (Advanced/Critical)

Continuation of `mongodb-10m-scale-queries.md`. Same philosophy, same "why at 10M" discipline — this batch covers the layer most teams discover only after an incident: security boundaries, schema evolution, live resharding, and consistency guarantees under real concurrent load.

---

## K. Field-Level Security & Multi-Tenant Isolation (51–55)

### 51. Tenant-scoped view — defense-in-depth against a missing `tenantId` filter bug
```js
db.createView("myOrdersView", "orders", [
  { $match: { $expr: { $eq: ["$tenantId", "$$USER_TENANT_ID"] } } }
]);
// Application connects via a role bound to this view, with $$USER_TENANT_ID
// injected via a per-connection variable or a role-scoped $match
```
**Why correct at scale**: application-layer tenant filtering (forgetting `tenantId` in one of hundreds of query call sites) is the single most common multi-tenant data leak. A view (or better, `$expr` + role-based row-level filtering via a proxy) makes tenant isolation a database-enforced invariant, not a code-review-enforced one — at 10M users across many engineers touching the codebase, this is the difference between "one bug" and "one bug that leaks tenant B's invoices to tenant A."

### 52. Field-level redaction for sensitive fields based on caller role
```js
db.orders.aggregate([
  { $match: { tenantId } },
  { $redact: {
      $cond: {
        if: { $eq: [callerRole, "finance"] },
        then: "$$DESCEND",
        else: "$$PRUNE" // removes entire sub-document if not finance
      }
  }}
]);
```
**Why correct**: `$redact` operates server-side per-document, so sensitive nested fields (e.g., payment method details) never leave the database for unauthorized roles — cheaper and safer than filtering in application code after the full document has already been fetched and transmitted.

### 53. Client-Side Field Level Encryption (CSFLE) / Queryable Encryption for regulated fields (PII, payment data)
```js
const encryptedFieldsMap = {
  fields: [
    { path: "ssn", bsonType: "string", queries: { queryType: "equality" } },
    { path: "cardNumber", bsonType: "string" }
  ]
};
const encClient = new MongoClient(uri, { autoEncryption: { keyVaultNamespace, kmsProviders, encryptedFieldsMap } });
await encClient.db("app").collection("customers").insertOne({ tenantId, ssn: "123-45-6789" }); // encrypted transparently
```
**Why must-know at scale**: at 10M users you will hold regulated PII. Queryable Encryption lets you run equality queries on encrypted fields *without decrypting server-side* — the data is unreadable even to a DBA with cluster access or in a backup snapshot. This isn't a "nice to have" — it's often a compliance requirement (PCI-DSS, GDPR-adjacent) once you're at real user-count scale, and retrofitting it after launch means a full data migration.

### 54. Row-level access audit via a mandatory `accessedBy` write on every sensitive read (compliance trail)
```js
async function readSensitive(tenantId, recordId, callerId) {
  const doc = await db.sensitiveRecords.findOne({ tenantId, recordId });
  await db.accessLog.insertOne({ tenantId, recordId, callerId, action: "read", at: new Date() });
  return doc;
}
```
**Why correct at scale**: for regulated data, "who looked at this" is often a legal requirement, and it must be tamper-evident. Write this to an append-only collection with restricted delete permissions (or a capped collection) — not as an afterthought log line, but as a first-class write in the same code path as the read, so it can't be silently skipped.

### 55. Preventing cross-tenant `$lookup` leakage (the subtle bug in joined queries)
```js
// WRONG: no tenantId filter inside the $lookup sub-pipeline — can join across tenants if IDs collide
// RIGHT:
{ $lookup: {
    from: "customers",
    let: { custId: "$customerId", tid: "$tenantId" },
    pipeline: [{ $match: { $expr: { $and: [
        { $eq: ["$tenantId", "$$tid"] }, { $eq: ["$customerId", "$$custId"] }
    ]}}}],
    as: "customer"
}}
```
**Why critical at scale**: if `customerId` is only unique *within* a tenant (not globally), a `$lookup` without a tenant guard in its sub-pipeline can match another tenant's customer with a colliding ID — a real, subtle data-leak vector that only manifests once you have enough tenants for ID collisions to become statistically likely.

---

## L. Schema Validation & Evolution (56–60)

### 56. `$jsonSchema` validation enforced at the collection level (last line of defense against bad writes)
```js
db.runCommand({
  collMod: "orders",
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["tenantId", "orderId", "status"],
    properties: {
      tenantId: { bsonType: "string" },
      status: { enum: ["draft","confirmed","shipped","cancelled"] },
      amount: { bsonType: "number", minimum: 0 }
    }
  }},
  validationLevel: "moderate" // only validates new/modified docs, not existing ones
});
```
**Why correct at scale**: application-layer validation can be bypassed by a bug, a script, a different service writing to the same collection, or a manual `mongosh` fix during an incident. `validationLevel: "moderate"` is deliberate — it lets you add a schema constraint to a live 10M-document collection without needing every historical document to already conform, while still protecting all *new* writes.

### 57. Schema versioning field for safe rolling migrations (avoid a blocking, all-at-once migration on a live 10M-doc collection)
```js
// Old docs: no schemaVersion field (implicitly v1). New writes:
{ tenantId, orderId, schemaVersion: 2, shippingAddress: { line1, city, ... } } // v2 nests address
// Read path handles both:
function normalizeOrder(doc) {
  if (!doc.schemaVersion || doc.schemaVersion === 1) return migrateV1ToV2(doc);
  return doc;
}
```
**Why correct at scale**: a blocking `updateMany` migration across 10M documents locks up write capacity and index churn for the migration's duration. Versioned documents let old and new shapes coexist, migrated lazily on read (or backfilled slowly via a low-priority background job using the range-partitioned pattern from #31) — zero downtime, zero throughput cliff.

### 58. Backward-compatible field rename via dual-write, not `$rename` in bulk
```js
// Phase 1: write both old and new field names
{ $set: { customerName: name, "customer.name": name } }
// Phase 2 (after all readers migrated to new field): stop writing old field
// Phase 3 (after confidence period): bulk cleanup of old field
db.orders.updateMany({ tenantId }, { $unset: { customerName: "" } });
```
**Why correct at scale**: a single bulk `$rename` across 10M docs is fast for the DB but forces every reader (services, dashboards, exports) to be updated atomically at the same instant — unrealistic in a real deployed system with multiple consumers. Dual-write with a phased rollout is the pattern that actually works when you can't coordinate a simultaneous cutover across every consumer.

### 59. Validating documents against a NEW schema before enforcing it (dry-run check across the collection)
```js
db.orders.aggregate([
  { $match: { tenantId } },
  { $match: { $nor: [{ $jsonSchema: newSchemaCandidate }] } }, // find docs that WOULD fail
  { $count: "nonConformingDocs" }
]);
```
**Why must-know at scale**: before flipping `validationLevel: "strict"` on a 10M-document collection, you need to know how many existing documents would suddenly start failing validation on their next update. This dry-run query tells you the blast radius before you commit — skipping this step is how a "safety" change becomes an incident.

### 60. Safe collection-level schema tightening rollout (warn-only before enforce)
```js
db.runCommand({ collMod: "orders", validator: {...}, validationAction: "warn" }); // logs violations, doesn't reject
// monitor logs for a period, THEN:
db.runCommand({ collMod: "orders", validator: {...}, validationAction: "error" });
```
**Why correct at scale**: `validationAction: "warn"` gives you a production-safe canary period to discover schema violations happening in real traffic (from a service you forgot about, an old client version still deployed) before you start actively rejecting writes — critical when you don't have perfect visibility into every writer touching a collection at 10M-user scale.

---

## M. Advanced Indexing (61–66)

### 61. Wildcard index for dynamic/user-defined attribute schemas
```js
db.products.createIndex({ "attributes.$**": 1 }); // indexes all sub-fields under "attributes"
db.products.find({ tenantId, "attributes.color": "red", "attributes.size": "L" });
```
**Why correct at scale**: multi-tenant SaaS often has per-tenant custom fields (product attributes, CRM custom fields) that can't be predicted at schema-design time. A wildcard index lets you query arbitrary nested keys without creating a new index per possible field — the alternative (no index) means a collection scan for every custom-attribute query, which doesn't survive 10M documents.

### 62. Partial index for soft-deleted documents (keep index small, exclude the majority-tombstoned rows)
```js
db.orders.createIndex(
  { tenantId: 1, status: 1, updatedAt: -1 },
  { partialFilterExpression: { deletedAt: { $exists: false } } }
);
```
**Why correct at scale**: if soft-deleted documents accumulate (common — you rarely hard-delete transactional records), a normal index still indexes them, bloating index size and cache footprint for rows nobody queries. A partial index scoped to `deletedAt: {$exists:false}` keeps the index proportional to the *active* dataset, not the all-time historical one — directly protects your working-set budget (constraint #1) as the collection ages.

### 63. Collation-aware index for case-insensitive/locale-correct sorting at scale
```js
db.customers.createIndex({ tenantId: 1, name: 1 }, { collation: { locale: "en", strength: 2 } });
db.customers.find({ tenantId }).collation({ locale: "en", strength: 2 }).sort({ name: 1 });
```
**Why correct at scale**: without collation, `"Apple" < "banana"` sorts by byte value (capitals before lowercase), which is wrong for user-facing alphabetical lists. Collation must match between the index and the query — a mismatched collation means Mongo can't use the index for sorting and falls back to an in-memory sort, which fails outright past the 100MB sort limit on large result sets.

### 64. Hidden index — test removing an index without actually dropping it (safe rollback)
```js
db.orders.updateIndex({ tenantId: 1, oldField: 1 }, { hidden: true }); // via db.collection.hideIndex()
// monitor query performance for a period — if nothing regresses, THEN drop it for real
db.orders.dropIndex({ tenantId: 1, oldField: 1 });
```
**Why must-know at scale**: dropping an index on a 10M-document collection you *think* is unused, only to discover a rarely-hit-but-critical query needed it, is expensive to undo (rebuilding a large index takes real time and I/O). Hiding first gives you a safe, instantly-reversible test — the query planner stops considering it, but the index still exists on disk for one command to restore visibility.

### 65. Compound index prefix reuse — one index serving multiple query shapes (index-count discipline)
```js
db.orders.createIndex({ tenantId: 1, status: 1, createdAt: -1 });
// This ONE index also serves: {tenantId} alone, and {tenantId, status} alone — via prefix matching
// It does NOT serve: {tenantId, createdAt} alone (skips the status prefix) — that needs its own index
```
**Why must-know at scale**: given constraint #2 (every index is a write-cost tax), deliberately designing compound indexes so one index's *prefix* serves multiple query shapes is how you keep index count bounded as query patterns grow — at 10M-user write volume, avoiding redundant single-field indexes that are already covered by a compound index's prefix is a direct throughput win.

### 66. Index intersection avoidance — verify Mongo isn't relying on slow index intersection instead of one good compound index
```js
db.orders.find({ tenantId, status: "paid", region: "APAC" }).explain("executionStats");
// Check "winningPlan" — if it shows AND_SORTED / index intersection instead of a single IXSCAN,
// you're missing a compound index for this exact query shape
db.orders.createIndex({ tenantId: 1, status: 1, region: 1 });
```
**Why critical at scale**: index intersection (combining two separate single-field indexes at query time) is a fallback plan, not an optimization — it's meaningfully slower than one purpose-built compound index at high document counts. At 10M docs, relying on intersection instead of adding the right compound index is a common silent performance gap that `explain` catches immediately but "the query works" testing never reveals.

---

## N. Time-Series & Append-Heavy Optimizations (67–70)

### 67. Native time-series collection (MongoDB 5.0+) for metrics/event data — purpose-built storage engine mode
```js
db.createCollection("metrics", {
  timeseries: { timeField: "timestamp", metaField: "tenantId", granularity: "minutes" }
});
db.metrics.insertMany([{ tenantId, timestamp: new Date(), cpuPct: 42.1 }, ...]);
```
**Why correct at scale**: time-series collections use a columnar-like internal storage format that compresses far better than regular documents for repetitive metric data, and automatically bucket documents internally — at 10M-user metric-emission volume, this can be an order-of-magnitude storage and query-speed improvement over hand-rolled bucketing (§ prior doc's bucket pattern), though the manual bucket pattern is still correct for non-metric unbounded arrays like payment history where you need custom bucket-fill logic.

### 68. Time-series-optimized aggregation with automatic bucket pruning
```js
db.metrics.aggregate([
  { $match: { tenantId, timestamp: { $gte: startTime, $lt: endTime } } },
  { $group: { _id: { $dateTrunc: { date: "$timestamp", unit: "hour" } }, avgCpu: { $avg: "$cpuPct" } } }
]);
```
**Why correct at scale**: time-series collections let the query planner prune entire internal buckets outside the time range before even reading documents — at 10M-user metric volume spanning months, this means a one-day query touches only the relevant buckets, not a scan proportional to total collection history.

### 69. Rolling top-N per tenant without unbounded sort (bounded heap-style aggregation)
```js
db.orders.aggregate([
  { $match: { tenantId, createdAt: { $gte: last30Days } } },
  { $sort: { amount: -1 } },
  { $limit: 10 } // Mongo optimizes sort+limit into a bounded top-N heap, not a full sort
]);
```
**Why correct at scale**: when `$sort` is immediately followed by `$limit`, Mongo's query planner uses a bounded in-memory heap of size N instead of sorting the entire matched set — critical at 10M-document scale where a full sort could exceed the 100MB memory limit and force `allowDiskUse`, while the heap-optimized version never needs it if the matched set per tenant is reasonably bounded.

### 70. Append-only write with pre-sized document to avoid in-place move (padding factor avoidance in WiredTiger)
```js
// If a field will grow later (e.g., a status-history array with a known typical max size),
// consider whether it belongs in a separate bucketed doc (§ prior doc pattern #2/#3) instead
// of growing in-place, since WiredTiger documents that outgrow their allocated space get
// rewritten (not resized in place), causing extra I/O and fragmentation at write time.
```
**Why must-know at scale**: this is a "know when NOT to write a query this way" entry — repeatedly `$push`-growing a field on an already-large document at 10M-document write volume causes document relocation overhead accumulating across the whole collection. It's the storage-engine-level reason the bucket pattern (from the first doc) isn't just an API nicety — it avoids a real physical write-amplification cost.

---

## O. Geo & Search (71–73)

### 71. Geospatial query for location-based multi-tenant lookup (e.g., installation team routing)
```js
db.installations.createIndex({ location: "2dsphere" });
db.installations.find({
  tenantId,
  location: { $near: { $geometry: { type: "Point", coordinates: [lng, lat] }, $maxDistance: 5000 } }
});
```
**Why correct at scale**: `2dsphere` indexes make proximity queries O(log n) via an internal geohash-based tree structure — without it, finding "installations within 5km" over 10M records is a full scan computing distance for every document, which is untenable at that volume.

### 72. Compound geo + tenant + status query (geo field should NOT be first in a compound index)
```js
db.installations.createIndex({ tenantId: 1, status: 1, location: "2dsphere" });
db.installations.find({ tenantId, status: "pending", location: { $near: {...} } });
```
**Why correct**: geo indexes have specific compounding rules — equality fields (`tenantId`, `status`) should precede the geo field in the compound index so Mongo narrows to the tenant/status subset first, then does the geo-proximity search only within that narrowed set, rather than geo-searching the whole collection and filtering after.

### 73. Full-text search with weighted fields and language-aware stemming
```js
db.products.createIndex(
  { tenantId: 1, name: "text", description: "text" },
  { weights: { name: 10, description: 1 }, default_language: "english" }
);
db.products.find(
  { tenantId, $text: { $search: "wireless keyboard" } },
  { score: { $meta: "textScore" } }
).sort({ score: { $meta: "textScore" } });
```
**Why correct at scale, and its real limit**: Mongo's `$text` search is fine for basic in-app search at 10M-document scale, but it's not a substitute for Elasticsearch/Atlas Search once you need fuzzy matching, faceted search, or relevance tuning beyond field weights — know this is a "good enough for basic search" tool, not a full search-engine replacement, and plan the migration point before you're forced into it under load.

---

## P. Advanced Aggregation Patterns (74–78)

### 74. `$unionWith` to query across sharded/partitioned collections (e.g., current + archived orders) in one pipeline
```js
db.orders.aggregate([
  { $match: { tenantId, createdAt: { $gte: startDate } } },
  { $unionWith: { coll: "ordersArchive", pipeline: [{ $match: { tenantId, createdAt: { $gte: startDate } } }] } }
]);
```
**Why correct at scale**: once you've archived cold data out of the hot collection (§ prior doc #45), reporting queries that need to span both hot and cold data can use `$unionWith` instead of two separate app-level queries + manual merge — pushes the merge work server-side, and each branch still uses its own collection's indexes independently.

### 75. `$function` for custom logic in aggregation (use sparingly — it's JS execution, not native ops)
```js
db.orders.aggregate([
  { $match: { tenantId } },
  { $addFields: { riskScore: {
      $function: { body: function(amount, history) { /* custom scoring logic */ return score; },
                   args: ["$amount", "$customerHistory"], lang: "js" }
  }}}
]);
```
**Why this needs a caution flag at scale**: `$function` runs in a JS engine per-document — meaningfully slower than native aggregation operators, and at 10M-document scale this can turn a fast pipeline into a slow one. Use it only when the logic genuinely can't be expressed with native operators (`$switch`, `$cond`, `$let`), and always benchmark against the native-operator alternative first.

### 76. `$out` for point-in-time snapshot materialization (nightly reporting snapshot, replaces entire target collection)
```js
db.orders.aggregate([
  { $match: { createdAt: { $lt: endOfLastNight } } },
  { $group: { _id: "$tenantId", totalRevenue: { $sum: "$amount" } } },
  { $out: "nightlyRevenueSnapshot" } // fully replaces the target collection atomically
]);
```
**Why correct, and different from `$merge` (§ prior doc #17)**: `$out` atomically replaces the *entire* target collection in one operation — correct for full nightly snapshots where you want a clean, consistent point-in-time view with no stale rows from a prior run. `$merge` is for incremental upsert-style rollups. Picking the wrong one either leaves stale rows behind ($merge when you needed $out) or wastefully recomputes everything ($out when you needed incremental $merge).

### 77. `$setWindowFields` for running totals / rank-within-tenant without a self-join
```js
db.orders.aggregate([
  { $match: { tenantId } },
  { $setWindowFields: {
      partitionBy: "$customerId", sortBy: { createdAt: 1 },
      output: { runningTotal: { $sum: "$amount", window: { documents: ["unbounded", "current"] } } }
  }}
]);
```
**Why correct at scale**: before `$setWindowFields` (5.0+), running totals required either app-side computation after fetching all rows (memory-bound at scale) or a self-referential `$lookup` (slow). This computes it server-side in a single pass over each partition — necessary for per-customer running-balance or rank displays at 10M-row scale.

### 78. Aggregation-based data quality check (find orphaned references — a critical periodic integrity query)
```js
db.orders.aggregate([
  { $match: { tenantId } },
  { $lookup: { from: "customers", localField: "customerId", foreignField: "customerId", as: "c" } },
  { $match: { c: { $size: 0 } } }, // orders referencing a customer that no longer exists
  { $limit: 100 }
]);
```
**Why must-know at scale**: without foreign-key enforcement (Mongo has none natively), reference integrity can silently drift — a customer hard-deleted without cascading, leaving orphaned orders. At 10M-document scale, this must be a scheduled integrity-check query (run against a read replica, not primary), not something you discover when a dashboard throws a null-pointer error in production.

---

## Q. Resharding & Chunk Management (79–83)

### 79. Live resharding a collection with the wrong shard key (MongoDB 5.0+ `reshardCollection`)
```js
db.adminCommand({
  reshardCollection: "app.orders",
  key: { tenantId: 1, orderId: 1 },
  numInitialChunks: 512
});
```
**Why this is critical, must-know territory**: choosing a bad shard key used to mean a full manual migration (dump, transform, reload into a new collection). `reshardCollection` does it live, but it's resource-intensive (duplicates the collection's data temporarily during the resharding window) — you must plan capacity for roughly 2x the collection's storage footprint during the operation, and it can take hours-to-days at 10M-document collection sizes. This is the single most consequential operational query in this entire list because getting the *original* shard key wrong is the costliest mistake to fix.

### 80. Monitoring resharding progress (must run continuously during a live reshard)
```js
db.adminCommand({ reshardCollection: "app.orders", ...})
// then poll:
db.currentOp({ "desc": "ReshardingRecipientService" });
db.adminCommand({ $listClusterCatalog: 1 }); // check new shard key distribution as it progresses
```
**Why must-know**: at 10M+ document scale, a reshard is a multi-hour operation; you need visibility into progress and the ability to detect if it's stalled (often due to a hot shard unable to keep pace with the change-stream-based data copy) before deciding whether to let it continue or abort.

### 81. Manual chunk split for a chunk that's grown too large for balancer auto-split to handle smoothly
```js
sh.splitAt("app.orders", { tenantId: "t_bigTenant", orderId: MinKey });
sh.splitFind("app.orders", { tenantId: "t_bigTenant" });
```
**Why critical at scale**: a single whale tenant's chunk can become a "jumbo chunk" (exceeds normal chunk size limits) if the shard key doesn't distribute their writes internally — jumbo chunks can't be auto-split or migrated by the balancer, permanently pinning that data (and its write load) to one shard. Manual intervention via `splitAt`/`splitFind` (or better, fixing the shard key to include a higher-cardinality second field) is the only fix once you hit this.

### 82. Detecting and cleaning orphaned documents after chunk migration (a real, if rare, consistency risk)
```js
db.adminCommand({ cleanupOrphaned: "app.orders", startingFromKey: { tenantId: MinKey } });
```
**Why must-know at scale**: chunk migrations between shards can, under certain failure/interruption scenarios, leave orphaned document copies on the source shard (data present in an internal query but not owned by that shard's current chunk range). At 10M-document scale with routine balancer activity, periodic orphan cleanup is real operational hygiene, not a hypothetical edge case.

### 83. Force a specific shard for a new tenant at creation time (proactive zone placement, cheaper than reactive reshard)
```js
sh.addTagRange("app.orders",
  { tenantId: "t_newEnterpriseClient", orderId: MinKey },
  { tenantId: "t_newEnterpriseClient", orderId: MaxKey },
  "dedicatedShardTag"
);
```
**Why correct proactive practice at scale**: assigning a zone tag *at tenant onboarding*, before any data exists, is dramatically cheaper than discovering 6 months later that a tenant grew into a whale and needs isolation — at that point you're doing a live migration of existing chunks, not a zero-cost placement decision.

---

## R. Advanced Concurrency / Queue Patterns (84–87)

### 84. Atomic job-queue dequeue (race-free, no two workers grab the same job) using `findOneAndUpdate`
```js
const job = await db.jobs.findOneAndUpdate(
  { tenantId, status: "pending" },
  { $set: { status: "processing", claimedBy: workerId, claimedAt: new Date() } },
  { sort: { priority: -1, createdAt: 1 }, returnDocument: "after" }
);
```
**Why correct at scale**: `findOneAndUpdate` is atomic at the single-document level — even with hundreds of concurrent worker processes at 10M-job-volume throughput, exactly one worker can transition a given job from `pending` to `processing`. A naive `find` + separate `update` has a race window where two workers can both read `pending` before either writes `processing`.

### 85. Stuck-job reclaim (visibility timeout pattern, for workers that crash mid-processing)
```js
await db.jobs.updateMany(
  { status: "processing", claimedAt: { $lt: new Date(Date.now() - 300000) } }, // stuck > 5 min
  { $set: { status: "pending" }, $unset: { claimedBy: "", claimedAt: "" } }
);
```
**Why must-know at scale**: at 10M-user job volume, worker crashes mid-processing are routine, not exceptional. Without a reclaim sweep, crashed jobs sit forever in `processing` state — a slow, silent throughput leak that compounds daily. Run this as a scheduled Temporal activity, not an afterthought cron.

### 86. Priority-fair dequeue avoiding starvation (weighted round-robin across tenants sharing a job queue)
```js
const job = await db.jobs.findOneAndUpdate(
  { status: "pending", tenantId: { $in: eligibleTenantsForThisRound } },
  { $set: { status: "processing", claimedBy: workerId } },
  { sort: { createdAt: 1 } }
);
// eligibleTenantsForThisRound rotates per worker tick, computed from a separate round-robin cursor
```
**Why critical at scale**: a naive shared job queue at 10M-user scale lets one high-volume tenant's jobs monopolize workers, starving smaller tenants — a fairness bug that looks fine in testing (one tenant) and becomes a support escalation in production (multi-tenant contention). This is the multi-tenant analog of the whale-tenant shard problem, applied to compute/queue capacity instead of storage.

### 87. Distributed rate limiting via atomic sliding-window counter (per-tenant API throttling at scale)
```js
const windowStart = new Date(Date.now() - 60000);
const result = await db.rateLimits.findOneAndUpdate(
  { tenantId, window: currentMinuteBucket },
  { $inc: { count: 1 }, $setOnInsert: { tenantId, window: currentMinuteBucket, expiresAt: new Date(Date.now()+120000) } },
  { upsert: true, returnDocument: "after" }
);
if (result.count > tenantRateLimit) throw new RateLimitExceededError();
db.rateLimits.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto-cleanup old windows
```
**Why correct at scale**: `$inc` + `upsert` is atomic, so concurrent requests from the same tenant in the same window correctly increment without a race — combined with a TTL index for automatic bucket cleanup, this is a self-maintaining rate limiter with zero separate cleanup job, correct even under the exact high-concurrency conditions rate limiting exists to handle.

---

## S. Consistency Guarantees Deep Dive (88–91)

### 88. `readConcern: "linearizable"` for the rare case where you need an absolute, cluster-wide "did this really commit" read
```js
db.orders.findOne(
  { tenantId, orderId },
  { readConcern: { level: "linearizable" }, maxTimeMS: 5000 }
);
```
**Why must-know, and why it's rare**: linearizable reads guarantee you see the absolute latest majority-committed state, cluster-wide, at real latency cost (must confirm with a majority of replica set members synchronously). At 10M-user scale, reserve this for genuinely critical single-document reads (e.g., "has this payment definitely been recorded before we tell the user it succeeded") — using it broadly would tax your entire read throughput for a guarantee most reads don't need.

### 89. `readConcern: "majority"` + `writeConcern: "majority"` combo for durable, non-rollback-able financial writes
```js
await db.payments.insertOne(
  { tenantId, paymentId, amount, status: "completed" },
  { writeConcern: { w: "majority", j: true } }
);
const confirmed = await db.payments.findOne({ tenantId, paymentId }, { readConcern: { level: "majority" } });
```
**Why correct at scale**: `w: "majority", j: true` (journaled) means the write survives a primary failover without rollback — critical for financial state where a rolled-back "successful payment" write would be a real money-accounting bug. This costs write latency (waiting for replica ack + disk journal flush), so use it selectively for money-moving writes, not universally for all 500M/day writes — that would be an unnecessary latency tax on non-critical data.

### 90. Causal consistency propagation across microservices (not just within one app's sessions)
```js
// Service A performs a write, extracts the operationTime/clusterTime
const result = await db.orders.insertOne(doc);
const clusterTime = client.clusterTime;
await publishEvent({ orderId, clusterTime }); // propagate alongside the event
// Service B, on receiving the event, opens a session advanced to at least that clusterTime
const session = client.startSession();
session.advanceClusterTime(receivedClusterTime);
const order = await db.orders.findOne({ orderId }, { session }); // guaranteed to see Service A's write
```
**Why must-know at scale**: at 10M-user scale you have multiple services reading/writing the same data via events (Kafka). Without explicit `clusterTime` propagation, Service B reading from a secondary might not yet see Service A's write that triggered the event it just consumed — a distributed causal-consistency gap that #27 (single-app sessions) doesn't cover once you're truly multi-service.

### 91. Detecting replication lag-induced staleness proactively before it causes a user-visible bug
```js
db.serverStatus().repl.lastHeartbeatMessage;
rs.status().members.forEach(m => print(m.name, m.optimeDate));
// Alert if any secondary's optimeDate lags primary's by more than your product's tolerance
```
**Why must-know at scale**: this is the operational counterpart to #90 — you need continuous, automated lag monitoring so you catch a degrading secondary *before* it causes a "why did the dashboard show stale data" incident, not after a customer reports it. At 10M-user read volume routed partly to secondaries, this metric belongs on the same dashboard as query latency, not a one-off manual check.

---

## T. GridFS, Soft Delete & Audit (92–95)

### 92. GridFS for large file storage (attachments, generated PDFs/invoices) beyond the 16MB document limit
```js
const bucket = new GridFSBucket(db, { bucketName: "invoiceAttachments" });
const uploadStream = bucket.openUploadStream(`${tenantId}/${invoiceId}.pdf`, { metadata: { tenantId, invoiceId } });
fs.createReadStream(localPath).pipe(uploadStream);
// Query by metadata:
db.invoiceAttachments.files.find({ "metadata.tenantId": tenantId, "metadata.invoiceId": invoiceId });
```
**Why correct at scale**: any binary file over ~16MB (or even smaller ones you don't want bloating your primary working set) belongs in GridFS, which chunks files across a separate `.chunks` collection — keeps your transactional collections (orders, invoices) lean and RAM-friendly (constraint #1) while still keeping files queryable by tenant/metadata alongside the rest of your data model.

### 93. Soft delete with partial unique index (allow re-creating a "deleted" unique key, e.g., re-registering a deleted email)
```js
db.users.createIndex(
  { tenantId: 1, email: 1 },
  { unique: true, partialFilterExpression: { deletedAt: { $exists: false } } }
);
// Soft delete:
await db.users.updateOne({ tenantId, userId }, { $set: { deletedAt: new Date() } });
// New user can now reuse that email — index only enforces uniqueness among non-deleted docs
```
**Why correct at scale**: a plain unique index blocks legitimate re-registration after a soft-deleted account (a real, common support ticket at 10M-user scale: "I deleted my account, why can't I sign up again with the same email"). The partial filter scopes uniqueness to active documents only, solving this without giving up the uniqueness guarantee for live data.

### 94. Full audit trail via change stream pre/post images (MongoDB 6.0+) — exact before/after state, not just "something changed"
```js
db.runCommand({ collMod: "orders", changeStreamPreAndPostImages: { enabled: true } });
const changeStream = db.orders.watch([], { fullDocument: "required", fullDocumentBeforeChange: "required" });
changeStream.on("change", (change) => {
  auditLog.write({ before: change.fullDocumentBeforeChange, after: change.fullDocument, at: new Date() });
});
```
**Why must-know at scale, and better than manual audit-log writes**: this captures the exact prior state server-side, guaranteed consistent with the actual change — vs. a manual "read-before-update-then-log" app pattern, which has a race window (someone else could modify the document between your read and your update) and doubles your read load. At 10M-user compliance-sensitive data, this is the correct primitive, not a workaround.

### 95. Restoring a document from its pre-image (point-in-time undo, using the audit trail from #94)
```js
const priorState = await db.auditLog.findOne(
  { tenantId, "after._id": corruptedId }, { sort: { at: -1 } }
);
await db.orders.replaceOne({ _id: corruptedId }, priorState.before);
```
**Why this matters at scale**: at 10M-user volume, "someone's script corrupted a batch of documents" is a when-not-if operational event. Having pre-images captured via #94 turns a "restore from last night's backup, lose today's other legitimate writes" incident into a surgical per-document undo — a materially different incident severity.

---

## U. Query Plan Cache & Performance Edge Cases (96–98)

### 96. Inspecting and clearing the query plan cache after a data distribution shift
```js
db.orders.getPlanCache().list(); // see cached plans and their selectivity assumptions
db.orders.getPlanCache().clear(); // force replanning after e.g. a large data migration changed selectivity
```
**Why must-know at scale**: Mongo caches which index it picked for a given query shape based on historical selectivity. If your data distribution shifts significantly (e.g., a status that used to be rare becomes common after a business change), a stale cached plan can pick the wrong index — clearing the cache forces re-evaluation. This is a real, if infrequent, cause of "this query was fast yesterday and slow today with no code change."

### 97. Forcing an index via `hint()` when the planner's automatic choice is measurably wrong for your access pattern
```js
db.orders.find({ tenantId, status: "pending", region: "APAC" })
  .hint({ tenantId: 1, status: 1 }); // override planner's choice if it's picking a worse index
```
**Why must-know, and why it's a last resort**: `hint()` should be rare — reach for it only after `explain()` (§ prior doc #22) shows the planner genuinely picking a worse plan than a specific known-good index, usually because of a data-distribution edge case the planner's heuristics don't handle well. Overusing `hint()` as a default is a maintenance trap — it hardcodes an assumption that can go stale as data shape changes.

### 98. Detecting query plan flip-flopping under concurrent load (a subtle p99 tail-latency cause)
```js
db.setParameter({ internalQueryCacheMaxEntriesPerCollection: 5000 }); // increase if many distinct query shapes
db.orders.aggregate([{ $indexStats: {} }, { $match: { "accesses.ops": { $gt: 0 } } }]);
```
**Why must-know at scale**: at 10M-user traffic with many distinct query shapes (different filter combinations from different UI screens), the plan cache can thrash if it's too small for your actual shape diversity — causing intermittent replanning overhead that shows up as unexplained p99 latency spikes rather than a consistent slowdown. This is a genuinely advanced, easy-to-miss cause of "latency is fine on average but has weird tail spikes."

---

## V. Cross-Cutting Critical Patterns (99–100)

### 99. Combining everything: a production-grade tenant-scoped state-machine transition (optimistic lock + audit + fan-out in one flow)
```js
async function transitionOrder(tenantId, orderId, fromStatus, toStatus, actorId) {
  const result = await db.orders.findOneAndUpdate(
    { tenantId, orderId, status: fromStatus },              // guard: correct current state
    { $set: { status: toStatus, updatedAt: new Date() },
      $inc: { version: 1 },
      $push: { statusHistory: { from: fromStatus, to: toStatus, actorId, at: new Date() } } },
    { returnDocument: "after" }
  );
  if (!result) throw new ConflictError(`Order not in expected state ${fromStatus}`);
  // change stream (§32-35) picks this up and fans out to quoteRef caches, dashboards, notifications
  return result;
}
```
**Why this is the synthesis query**: this single operation encodes optimistic concurrency (guard on `fromStatus`), auditability (`statusHistory` embedded — bounded because state transitions per order are naturally bounded, unlike payments), and sets up async fan-out via change streams — without a transaction, without a separate lock document, and atomic at the single-document level. This is what "correct at 10M-user scale" actually looks like in one real business operation: every guarantee earned through document-boundary design, not bolted on via heavier mechanisms.

### 100. The pre-production checklist query set (run these against production-scale data before every schema/query change ships)
```js
// 1. Does the new query use the shard key? (§39)
db.orders.find(newQueryShape).explain("executionStats");
// 2. Is it covered or index-scanning efficiently? (totalDocsExamined ≈ nReturned)
// 3. Does it add a new index? What's the write-amplification cost? (§48, §65)
db.orders.aggregate([{ $indexStats: {} }]);
// 4. Does it touch unbounded arrays or growing embedded fields? (§70, working-set check §49)
db.orders.stats();
// 5. If it's a bulk operation, is it ordered:false and idempotent? (§1, §10)
```
**Why this is the correct closing entry**: every failure mode across all 100 queries traces back to one of these five checks. At 10M-user scale, the discipline isn't memorizing more queries — it's running this checklist against realistic data volume *before* shipping, every time, so the next schema decision is judged against the same philosophy that generated everything above it: document boundary = write-contention + read-locality + consistency boundary, decided deliberately, not by default.
