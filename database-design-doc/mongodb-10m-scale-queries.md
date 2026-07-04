# MongoDB at 10M-User Scale — 50 Critical Queries

**Governing philosophy (repeat this before every query decision):**
A document's boundary is simultaneously a *write-contention* boundary, a *read-locality* boundary, and a *consistency* boundary. Every query below either respects that boundary or exists specifically to manage the cost of crossing it (fan-out, transaction, or bulk batching). At 10M users, the failure modes are never "wrong syntax" — they're: unbounded working sets, index write amplification, shard hot spots, and silent race conditions. Every "why correct at scale" note maps back to one of these four.

---

## A. Bulk Upsert Patterns (1–8)

### 1. Standard idempotent bulk upsert (the base pattern)
```js
const ops = records.map(r => ({
  updateOne: {
    filter: { tenantId, entityId: r.id },
    update: {
      $set: { ...r.fields, updatedAt: new Date() },
      $setOnInsert: { tenantId, entityId: r.id, createdAt: new Date() }
    },
    upsert: true
  }
}));
await db.entities.bulkWrite(ops, { ordered: false });
```
**Why correct at 10M**: `ordered:false` lets `mongos` route each op to its target shard independently and execute in parallel — an ordered batch serializes across shards (one op waits for the previous to fully ack before the next starts), which turns a 10K-doc batch into 10K sequential round-trips instead of `10K / shard_count` parallel ones.

### 2. Bulk upsert with array append (bucket pattern write)
```js
const ops = events.map(e => ({
  updateOne: {
    filter: { tenantId, bucketKey: e.bucketKey, count: { $lt: 150 } },
    update: { $push: { items: e.payload }, $inc: { count: 1 } },
    upsert: false // bucket must exist — rollover handled by #3
  }
}));
await db.buckets.bulkWrite(ops, { ordered: false });
```
**Why correct**: guarding with `count: { $lt: 150 }` in the filter prevents unbounded array growth *at the query layer*, not just app logic — if two workers race, only one succeeds per bucket-fill, the other naturally falls through to rollover (#3). This is a correctness guarantee, not a convention.

### 3. Bucket rollover (create next bucket only when current is full)
```js
await db.buckets.updateOne(
  { tenantId, entityId, bucketSeq: currentSeq + 1 },
  { $setOnInsert: { tenantId, entityId, bucketSeq: currentSeq + 1, items: [], count: 0, createdAt: new Date() } },
  { upsert: true }
);
```
**Why correct**: pure `$setOnInsert` upsert with no `$set` means concurrent rollover attempts are idempotent — whoever wins the race creates it, everyone else's upsert becomes a no-op match against the already-created doc. No duplicate-bucket race is possible.

### 4. Bulk upsert with conditional update (only overwrite if incoming is newer — last-write-wins by event time, not by arrival time)
```js
const ops = updates.map(u => ({
  updateOne: {
    filter: { tenantId, entityId: u.id, eventTime: { $lt: u.eventTime } },
    update: { $set: { ...u.fields, eventTime: u.eventTime } },
    upsert: true
  }
}));
await db.state.bulkWrite(ops, { ordered: false });
```
**Why correct at scale**: out-of-order delivery is *guaranteed* at 10M-user ingest volume (Kafka partitions, retries, network reordering). This filter makes the write a no-op if a newer event already landed — correctness by query construction, not by hoping messages arrive in order.

### 5. Bulk insert with `insertMany` + `ordered:false` for pure append-only logs
```js
await db.auditLog.insertMany(logBatch, { ordered: false });
```
**Why correct**: for append-only data (no upsert semantics needed), skip `updateOne` overhead entirely — `insertMany` avoids the extra filter-match step per document. `ordered:false` means one duplicate-key or validation failure in the batch doesn't abort the rest.

### 6. Retryable-writes-safe bulk upsert (network blip resilience)
```js
// connection string: mongodb+srv://...&retryWrites=true&w=majority
await db.orders.bulkWrite(ops, { ordered: false });
```
**Why correct**: at 10M-user scale, transient network partitions between app and mongos are a when-not-if. `retryWrites=true` makes the driver safely retry the *exact same* operation once on a retryable error, using the write's built-in idempotency token — critical difference from app-level retry, which could double-apply a non-idempotent `$inc` if not careful.

### 7. Bulk upsert with `$max` / `$min` for watermark fields (avoid rollback of a monotonic field)
```js
const ops = statusUpdates.map(s => ({
  updateOne: {
    filter: { tenantId, orderId: s.orderId },
    update: { $max: { lastSeenSeq: s.seq }, $set: { lastPayload: s.payload } },
    upsert: true
  }
}));
await db.orders.bulkWrite(ops, { ordered: false });
```
**Why correct**: `$max` is atomic and race-safe for monotonic counters/sequence numbers — no read-modify-write needed, and it's impossible for an out-of-order arrival to regress the watermark, even under concurrent writers on the same shard.

### 8. Bulk upsert avoiding the `$set`/`$setOnInsert` field-conflict error
```js
// WRONG — tenantId in both $set and $setOnInsert throws "conflict" error
// RIGHT — immutable fields ONLY in $setOnInsert, mutable fields ONLY in $set
{
  filter: { tenantId, entityId },
  update: {
    $set: { status, updatedAt: new Date() },              // mutable
    $setOnInsert: { tenantId, entityId, createdAt: new Date() } // immutable, insert-only
  },
  upsert: true
}
```
**Why this matters at scale**: this bug is silent in dev (low volume, rarely hits the conflict path) and explodes in a 10K-op bulk batch in prod because `ordered:false` will still throw per-op errors you have to parse out of the `BulkWriteResult`. Get the field partition right once, template it everywhere.

---

## B. Idempotency & Deduplication (9–12)

### 9. Idempotency key enforced at the index layer (not app logic)
```js
db.payments.createIndex({ tenantId: 1, idempotencyKey: 1 }, { unique: true });

try {
  await db.payments.insertOne({ tenantId, idempotencyKey, amount, createdAt: new Date() });
} catch (e) {
  if (e.code === 11000) return await db.payments.findOne({ tenantId, idempotencyKey }); // already processed
}
```
**Why correct at scale**: app-level "check then insert" has a race window; a unique index makes the database the arbiter — at 10M concurrent requests, two retries of the *same* payment request racing each other will have exactly one winner, guaranteed by WiredTiger's index uniqueness constraint, not by your application's timing luck.

### 10. Deduplicating a bulk batch before write (reduce index churn upstream)
```js
const seen = new Map();
for (const r of batch) seen.set(`${r.tenantId}:${r.entityId}`, r); // last-in-wins locally
const deduped = [...seen.values()];
await db.entities.bulkWrite(deduped.map(toUpsertOp), { ordered: false });
```
**Why correct at scale**: if your ingest batch has 3 updates for the same entity (common with Kafka at-least-once + retries), sending all 3 to Mongo means 3 B-tree touches, 3 oplog entries, 3 change-stream events downstream. Dedup client-side to 1 write, keep only the semantically-latest — this is a throughput optimization that compounds at 500M writes/day.

### 11. Exactly-once *effect* using a processed-events ledger (for non-idempotent operations like `$inc`)
```js
const session = client.startSession();
await session.withTransaction(async () => {
  const alreadyProcessed = await db.processedEvents.findOne({ tenantId, eventId }, { session });
  if (alreadyProcessed) return;
  await db.wallets.updateOne({ tenantId, userId }, { $inc: { balance: amount } }, { session });
  await db.processedEvents.insertOne({ tenantId, eventId, processedAt: new Date() }, { session });
});
```
**Why correct at scale**: `$inc` is NOT naturally idempotent (replay = double-charge). At 10M users you will get replayed events (retries, dual-delivery). The transaction couples the balance mutation and the "mark processed" record atomically — without it, a crash between the two steps creates a permanent double-apply or a permanent skip.

### 12. Upsert-based dedup for streaming aggregation (count unique users per day without a `$group` over raw events)
```js
await db.dailyActiveUsers.updateOne(
  { tenantId, day: dayBucket, userId },
  { $setOnInsert: { tenantId, day: dayBucket, userId, firstSeenAt: new Date() } },
  { upsert: true }
);
// separately, a scheduled job does: db.dailyActiveUsers.countDocuments({ tenantId, day: dayBucket })
```
**Why correct at scale**: computing DAU via `distinct` or `$group` over a 10M-user event stream at query time is a full collection scan every time you want the number. Writing one upsert per (user, day) turns "count unique" into an indexed `countDocuments` — O(log n) index lookup instead of O(events/day) scan.

---

## C. Aggregation Pipelines for Reporting at Scale (13–22)

### 13. Tenant-scoped aggregation — `$match` on shard key MUST be the first stage
```js
db.orders.aggregate([
  { $match: { tenantId, createdAt: { $gte: startDate, $lt: endDate } } },
  { $group: { _id: "$status", total: { $sum: "$amount" }, count: { $sum: 1 } } }
]);
```
**Why correct at scale**: if `$match` on the shard key is the *first* stage, `mongos` can target only the shard(s) holding that tenant's data (targeted aggregation). If you `$match` on a non-shard-key field first, or put `$match` after a `$lookup`/`$unwind`, the query becomes scatter-gather across *every* shard — at 10M users spread across, say, 20 shards, that's a 20x unnecessary fan-out for data that lives on 1-2 shards.

### 14. Faceted aggregation — compute multiple metrics in one pass (avoid N separate collection scans)
```js
db.orders.aggregate([
  { $match: { tenantId, createdAt: { $gte: startDate } } },
  { $facet: {
      byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
      byMonth: [{ $group: { _id: { $month: "$createdAt" }, revenue: { $sum: "$amount" } } }],
      topCustomers: [{ $sortByCount: "$customerId" }, { $limit: 10 }]
  }}
]);
```
**Why correct**: one collection scan produces three reports instead of three separate scans of the same (potentially large) matched set — at scale, I/O is the expensive resource, not CPU; `$facet` shares the I/O across all branches.

### 15. `$lookup` — ONLY when the foreign collection is small or indexed on the join key, and NEVER unsharded-across-shards without `let`/pipeline form
```js
db.orders.aggregate([
  { $match: { tenantId, orderId } },
  { $lookup: {
      from: "customers",
      let: { custId: "$customerId" },
      pipeline: [
        { $match: { $expr: { $and: [{ $eq: ["$tenantId", tenantId] }, { $eq: ["$customerId", "$$custId"] }] } } }
      ],
      as: "customer"
  }}
]);
```
**Why correct at scale**: the pipeline form of `$lookup` lets you push `tenantId` equality into the sub-pipeline so it uses `customers`' own `{tenantId:1, customerId:1}` index rather than scanning. The naive `localField/foreignField` form without `let` cannot leverage compound indexes as effectively and is a common silent scan-inducer.

### 16. Avoiding `$lookup` entirely at read time — precomputed rollup collection updated via change stream
```js
// Written by a background worker, NOT computed at query time:
db.tenantDailyRollup.updateOne(
  { tenantId, day },
  { $inc: { orderCount: 1, revenue: order.amount } },
  { upsert: true }
);
// Dashboard reads:
db.tenantDailyRollup.find({ tenantId, day: { $gte: startDay } });
```
**Why correct at 10M users**: a dashboard hit 10,000 times/hour computing `$group` over raw orders every time is 10,000 collection scans/hour. Precomputing via incremental `$inc` upserts (triggered off the write path or a change stream) turns every dashboard read into an O(1) point lookup, regardless of how many raw orders exist underneath.

### 17. `$merge` for materialized view refresh (batch rollup, not real-time)
```js
db.orders.aggregate([
  { $match: { tenantId, createdAt: { $gte: startOfMonth } } },
  { $group: { _id: { tenantId: "$tenantId", customerId: "$customerId" }, total: { $sum: "$amount" } } },
  { $merge: { into: "customerMonthlySpend", whenMatched: "replace", whenNotMatched: "insert" } }
]);
```
**Why correct**: `$merge` writes the aggregation result directly into a target collection server-side — no round-trip of results back to the app just to re-insert them. Run this as a scheduled Temporal job, not on the request path; it's for nightly/hourly rollups where a few minutes of staleness is acceptable, freeing dashboard reads from ever touching raw transactional data.

### 18. Cursor-batched aggregation for huge result sets (never `.toArray()` blindly at 10M scale)
```js
const cursor = db.events.aggregate(pipeline, { allowDiskUse: true, batchSize: 1000 });
for await (const doc of cursor) {
  // process one at a time — bounded memory regardless of result set size
}
```
**Why correct at scale**: `allowDiskUse:true` lets `$sort`/`$group` spill to disk instead of erroring at the 100MB in-memory stage limit — necessary once you're aggregating across millions of docs. Streaming via cursor instead of `.toArray()` keeps app-server memory bounded regardless of result size.

### 19. `$bucket` for histogram-style analytics without pulling raw data to app layer
```js
db.orders.aggregate([
  { $match: { tenantId } },
  { $bucket: {
      groupBy: "$amount",
      boundaries: [0, 1000, 5000, 20000, 100000],
      default: "100000+",
      output: { count: { $sum: 1 }, avgAmount: { $avg: "$amount" } }
  }}
]);
```
**Why correct**: computes the entire distribution server-side in one pass — the alternative (pulling all order amounts to app memory to bucket them) doesn't scale past a few thousand docs, let alone a 10M-user tenant's order history.

### 20. `$graphLookup` for approval-chain / hierarchy traversal (bounded depth, use with caution)
```js
db.approvals.aggregate([
  { $match: { tenantId, poId } },
  { $graphLookup: {
      from: "approvals", startWith: "$parentApprovalId", connectFromField: "parentApprovalId",
      connectToField: "_id", as: "chain", maxDepth: 10, restrictSearchWithMatch: { tenantId }
  }}
]);
```
**Why correct — and where it stops being correct**: `maxDepth` and `restrictSearchWithMatch` are not optional at 10M-user scale — without them, `$graphLookup` can traverse unbounded and unfiltered across tenants, one of the few aggregation stages that can accidentally cross tenant boundaries if you forget the tenant filter inside it. For anything beyond bounded 5-10 level chains, prefer the materialized-path pattern (§ prior message) over `$graphLookup`.

### 21. Index-covered aggregation (projection-only, no document fetch)
```js
db.orders.createIndex({ tenantId: 1, status: 1, amount: 1 });
db.orders.aggregate([
  { $match: { tenantId, status: "paid" } },
  { $group: { _id: null, total: { $sum: "$amount" } } }
], { hint: { tenantId: 1, status: 1, amount: 1 } });
```
**Why correct at scale**: if every field touched (`tenantId`, `status`, `amount`) is in the index, WiredTiger answers entirely from the index B-tree — zero document fetches. At 10M orders, "covered" vs "not covered" is the difference between an index-only scan and a full random-I/O document read per matched row.

### 22. `explain("executionStats")` as a mandatory pre-production gate, not a debugging afterthought
```js
db.orders.find({ tenantId, status: "pending" }).explain("executionStats");
// Check: totalDocsExamined ≈ nReturned (good), totalDocsExamined >> nReturned (missing/wrong index)
```
**Why this is a "query" you must know**: at 10M-user scale, a query that examines 500K docs to return 50 is invisible in dev (small dataset, feels instant) and catastrophic in prod (500K random I/Os per request, at request-volume concurrency). Run `explain` against production-scale data before shipping any new query shape — this isn't optional tooling, it's the only way to catch the gap between "works" and "works at scale."

---

## D. Transactions & Multi-Document Atomicity (23–27)

### 23. Multi-document transaction — only when true cross-entity atomicity is required
```js
const session = client.startSession();
try {
  await session.withTransaction(async () => {
    await db.orders.updateOne({ tenantId, orderId }, { $set: { status: "confirmed" } }, { session });
    await db.inventory.updateOne({ tenantId, sku }, { $inc: { reserved: qty } }, { session });
  }, { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });
} finally {
  await session.endSession();
}
```
**Why correct — and why to use sparingly at scale**: transactions across shards require two-phase commit coordination, which adds real latency (typically single-digit-to-tens of ms extra) and holds locks longer. At 10M-user write volume, reserve this for genuinely-must-be-atomic pairs (order confirm + inventory decrement); do NOT wrap high-frequency, non-critical writes (like analytics counters) in transactions — that's a self-inflicted throughput ceiling.

### 24. Transaction retry loop (transactions CAN abort under contention — you must handle `TransientTransactionError`)
```js
async function runTxnWithRetry(fn) {
  while (true) {
    const session = client.startSession();
    try {
      const result = await session.withTransaction(fn);
      return result;
    } catch (e) {
      if (e.hasErrorLabel("TransientTransactionError")) continue; // retry
      throw e;
    } finally {
      await session.endSession();
    }
  }
}
```
**Why this must be in every transaction path at scale**: at 10M concurrent users, write conflicts on hot documents (e.g., a popular inventory SKU) will cause transaction aborts *by design* — WiredTiger's optimistic concurrency means contention surfaces as abort-and-retry, not blocking. Skipping this retry wrapper means random, load-dependent failures in production that don't reproduce in low-concurrency testing.

### 25. Avoiding transactions via single-document atomic compensation (preferred over #23 where possible)
```js
// Instead of a 2-doc transaction, encode both state changes in ONE document via array/embedded sub-state
await db.orders.updateOne(
  { tenantId, orderId, status: "pending" }, // guard: only if still pending
  { $set: { status: "confirmed", "inventoryHold.reserved": true, "inventoryHold.qty": qty } }
);
```
**Why this is often the better answer at scale**: single-document updates are always atomic in Mongo with zero transaction overhead. If you can restructure the problem so the two things needing atomicity live in one document, you get the correctness of #23 without the cross-shard coordination cost. Reach for transactions only after confirming the data genuinely can't be co-located.

### 26. Compensating-action pattern (saga) for cross-service atomicity where transactions don't reach (e.g., across Mongo + Kafka + external payment gateway)
```js
await db.sagaLog.insertOne({ tenantId, sagaId, step: "reserve_inventory", status: "started", createdAt: new Date() });
try {
  await reserveInventory(sku, qty);
  await db.sagaLog.updateOne({ tenantId, sagaId, step: "reserve_inventory" }, { $set: { status: "done" } });
} catch (e) {
  await db.sagaLog.updateOne({ tenantId, sagaId, step: "reserve_inventory" }, { $set: { status: "failed" } });
  await compensateReservation(sku, qty); // explicit rollback
}
```
**Why correct at scale**: Mongo transactions can't span external systems (payment gateways, Kafka). At 10M-user scale, cross-system consistency has to be modeled as an explicit saga with a durable log and compensating actions — this is precisely what your Temporal workers are for; the `sagaLog` collection is the audit trail Temporal's workflow history effectively also gives you, so in practice this often IS a Temporal workflow, not raw application code.

### 27. Read-your-own-write guarantee within a session (causal consistency without full transactions)
```js
const session = client.startSession({ causalConsistency: true });
await db.orders.updateOne({ tenantId, orderId }, { $set: { status: "shipped" } }, { session });
const order = await db.orders.findOne({ tenantId, orderId }, { session }); // guaranteed to see the write above
```
**Why correct at scale**: with `secondaryPreferred` reads (common for scaling read throughput at 10M users), a naive read right after a write might hit a secondary that hasn't replicated yet. `causalConsistency` sessions guarantee the read reflects at least the session's own prior writes, without paying for a full `w:"majority"` + `primary`-read tax on every single read in the app.

---

## E. Pagination & Cursor Patterns (28–31)

### 28. Range-based (keyset) pagination — NEVER `.skip()` at scale
```js
// Page 1
db.orders.find({ tenantId }).sort({ _id: -1 }).limit(50);
// Page 2 — use the last _id from page 1, not skip(50)
db.orders.find({ tenantId, _id: { $lt: lastSeenId } }).sort({ _id: -1 }).limit(50);
```
**Why correct at scale**: `.skip(N)` makes Mongo walk and discard N documents before returning results — cost grows linearly with page depth. At 10M-user datasets, `.skip(100000)` is a genuinely slow query. Keyset pagination is O(log n) regardless of page depth because it's a pure indexed range lookup, not a walk-and-discard.

### 29. Stable pagination under concurrent writes (compound sort key to break ties)
```js
db.orders.find({ tenantId, $or: [
  { createdAt: { $lt: lastCreatedAt } },
  { createdAt: lastCreatedAt, _id: { $lt: lastId } }
]}).sort({ createdAt: -1, _id: -1 }).limit(50);
db.orders.createIndex({ tenantId: 1, createdAt: -1, _id: -1 });
```
**Why correct**: sorting on `createdAt` alone with concurrent inserts at the same timestamp (very possible at 10M-user write rates, millisecond collisions) can duplicate or skip rows across pages. The `_id` tiebreaker (globally unique, monotonic) guarantees a strict total order, so pagination is stable even under heavy concurrent writes.

### 30. Cursor-based export using `.batchSize()` tuned to avoid cursor timeout at scale
```js
const cursor = db.events.find({ tenantId }).batchSize(500);
while (await cursor.hasNext()) {
  const doc = await cursor.next();
  // process — keep each batch's processing time well under the 10-min idle cursor timeout
}
```
**Why correct at scale**: default batch size can be too small (many round-trips) or the processing-per-batch can be too slow (cursor idles out server-side). At 10M-doc exports, tune `batchSize` against your per-doc processing time so you never idle past the server's cursor timeout — a silent failure mode that looks like "randomly incomplete exports."

### 31. Parallel range-partitioned scan for bulk export/migration jobs
```js
// Precompute _id boundaries via $bucketAuto once, then run N parallel workers on disjoint ranges
const ranges = await db.orders.aggregate([{ $bucketAuto: { groupBy: "$_id", buckets: 8 } }]).toArray();
// worker i: db.orders.find({ _id: { $gte: ranges[i].min, $lt: ranges[i].max } })
```
**Why correct at scale**: a single-cursor sequential scan over 10M+ docs for a migration/export job is I/O-bound and slow; partitioning into disjoint `_id` ranges lets you run N workers in parallel, each hitting a different part of the index/shards concurrently — this is the standard pattern for backfills at this scale (and maps directly onto Temporal's parallel activity execution).

---

## F. Change Streams & Fan-Out Consistency (32–35)

### 32. Resumable change stream (crash-safe, using `resumeToken` persistence)
```js
let resumeToken = await loadLastResumeToken(); // from your own durable store
const changeStream = db.collection("quotes").watch([], { resumeAfter: resumeToken, fullDocument: "updateLookup" });
changeStream.on("change", async (change) => {
  await processChange(change);
  await saveResumeToken(change._id); // persist AFTER successful processing
});
```
**Why correct at scale**: at 10M-user write volume, your change-stream consumer WILL restart (deploys, crashes, scaling events). Without persisting and resuming from `resumeToken`, you either replay everything from the oplog window start (if still available) or silently miss events. This is the single most common cause of "cache went stale and nobody noticed" bugs.

### 33. Change stream with `$match` filter pushed server-side (avoid processing irrelevant events)
```js
const pipeline = [{ $match: { operationType: { $in: ["insert","update"] }, "fullDocument.tenantId": { $in: highPriorityTenants } } }];
db.collection("orders").watch(pipeline);
```
**Why correct at scale**: filtering in the pipeline means the server only ships matching events over the wire — at 10M-user total event volume, an unfiltered change stream forces your consumer to receive and discard the vast majority of events just to find the ones it cares about, wasting network and consumer CPU.

### 34. Oplog window monitoring (prevent silent resume-token invalidation)
```js
db.adminCommand({ collStats: "oplog.rs" }); // check oplog size + time window
// Alert if: (current time - oldest oplog entry time) < your max consumer downtime tolerance
```
**Why this is a critical, must-know operational query at scale**: if your change-stream consumer is down longer than the oplog retention window, the `resumeToken` becomes invalid and you silently lose events — no error, just a gap. At 10M-user write rates, the oplog churns fast (high write volume = short time window for a fixed oplog size). You must size the oplog against your worst-case consumer downtime, and monitor it exactly like this.

### 35. Fan-out with `$merge` + change stream hybrid for near-real-time rollups
```js
changeStream.on("change", async (change) => {
  const { tenantId, amount, status } = change.fullDocument;
  await db.tenantRollup.updateOne(
    { tenantId, day: dayBucket(change.fullDocument.createdAt) },
    { $inc: { orderCount: 1, revenue: status === "paid" ? amount : 0 } },
    { upsert: true }
  );
});
```
**Why correct at scale**: this converts a query-time aggregation cost into a write-time incremental cost, amortized over the write rate rather than paid on every dashboard read — the correct trade at 10M users where reads (dashboards, many users looking) vastly outnumber the writes that produced the data.

---

## G. Concurrency Control (36–38)

### 36. Optimistic locking via version field (already shown, formalized as the general pattern)
```js
async function updateWithOptimisticLock(filter, updateFields, expectedVersion) {
  const result = await db.entities.updateOne(
    { ...filter, version: expectedVersion },
    { $set: { ...updateFields, updatedAt: new Date() }, $inc: { version: 1 } }
  );
  if (result.matchedCount === 0) throw new ConflictError("stale version — reread and retry");
  return result;
}
```
**Why correct at scale**: pessimistic locking (explicit lock documents) creates contention queues under 10M-user concurrency — everyone waits their turn. Optimistic locking lets everyone attempt concurrently and only the actual conflicting writers retry, which is the correct trade when conflicts are rare relative to total write volume (true for most per-user/per-order state).

### 37. `findOneAndUpdate` as an atomic compare-and-swap for distributed locks / leader election
```js
const lock = await db.locks.findOneAndUpdate(
  { _id: `job:${jobName}`, lockedUntil: { $lt: new Date() } },
  { $set: { lockedUntil: new Date(Date.now() + 30000), owner: workerId } },
  { upsert: true, returnDocument: "after" }
);
if (lock.owner !== workerId) { /* did not acquire lock */ }
```
**Why correct at scale**: at 10M-user scale you'll run multiple worker instances (Temporal workers, cron jobs) that must not double-process the same job. `findOneAndUpdate` is a single atomic document operation — no separate "check lock, then acquire" race window, unlike a naive `find` + `update`.

### 38. Preventing lost updates on array modification (positional operator with `arrayFilters`, atomic per-element)
```js
await db.quotes.updateOne(
  { tenantId, quoteId, "lineItems.itemId": itemId },
  { $set: { "lineItems.$[elem].qty": newQty, "lineItems.$[elem].updatedAt": new Date() } },
  { arrayFilters: [{ "elem.itemId": itemId }] }
);
```
**Why correct at scale**: rewriting the entire `lineItems` array from the app (read-modify-write) creates a race window where two concurrent edits to *different* line items can clobber each other. `arrayFilters` targets and mutates only the matched sub-document atomically at the server, so concurrent edits to different items never conflict.

---

## H. Sharding-Aware Query Patterns (39–43)

### 39. Targeted query — shard key in every filter, no exceptions
```js
// Correct: hits 1 shard (or the zone-pinned shard for this tenant)
db.orders.find({ tenantId, orderId });
// WRONG at scale: missing tenantId — becomes scatter-gather across ALL shards
db.orders.find({ orderId }); // NEVER do this in a sharded, multi-tenant collection
```
**Why this is the single most important rule at 10M-user scale**: every query missing the shard key prefix is a full-cluster fan-out. At 20+ shards, that's 20x the necessary work for a query that should've hit one shard. Enforce this at the data-access-layer level (wrap your DAO so `tenantId` is a required parameter, not optional) — don't rely on developer discipline alone.

### 40. Scatter-gather query explicitly acknowledged and minimized (cross-tenant admin queries — rare, must be deliberate)
```js
db.orders.find({ status: "flagged_for_review" }).hint({ status: 1 }); // separate global index, used sparingly
```
**Why this needs its own entry**: some queries genuinely must cross tenants (platform-admin views). At 10M-user scale, these must be rare, rate-limited, and ideally served from a read-replica or a dedicated reporting cluster — never on the same shards serving live tenant traffic, or an admin report can degrade p99 for every paying tenant.

### 41. Zone-aware read for whale tenants (read preference tagging matched to zone sharding)
```js
db.orders.find({ tenantId: "t_enterprise1" }).readPref("secondaryPreferred", [{ zone: "bigTenants" }]);
```
**Why correct at scale**: if you've zone-sharded whale tenants onto dedicated shards (as covered earlier), pairing that with tag-aware read preferences ensures reads for that tenant are served by replicas *physically holding* their zone's data — avoiding an unnecessary network hop to a replica set member that doesn't even have the relevant chunks locally in cache.

### 42. `sh.status()` / balancer window check — an operational query you must run before assuming shard distribution is healthy
```js
sh.status();  // check chunk distribution per shard
db.adminCommand({ balancerStatus: 1 });
```
**Why must-know at scale**: chunk imbalance (one shard holding disproportionately more chunks/data) silently degrades performance on that shard while others sit idle. At 10M users, you must periodically verify the balancer is running and chunks are evenly distributed — an imbalanced cluster looks identical to "Mongo is slow" from the app's perspective, but the actual fix is operational, not a query rewrite.

### 43. `$currentOp` to detect shard-level lock contention/long-running ops in production
```js
db.adminCommand({ currentOp: 1, "active": true, "secs_running": { $gt: 5 } });
```
**Why must-know at scale**: at 10M-user concurrency, a single slow unindexed query (someone shipped a bad query) can hold resources long enough to cascade into visible latency for unrelated tenants on the same shard. This is your first diagnostic query when p99 spikes — find the long-running op, `db.killOp()` it if it's runaway, then fix the root query.

---

## I. Archival / TTL / Cold Data Management (44–46)

### 44. TTL index for automatic expiry (sessions, temp tokens, ephemeral state)
```js
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// document just needs: { expiresAt: new Date(Date.now() + 3600000) }
```
**Why correct at scale**: at 10M active users, session/token collections grow unboundedly if not expired — TTL indexes offload cleanup to a background Mongo process (runs every 60s) instead of you writing and scheduling a manual delete job, and it does so without a full collection scan (it uses the TTL index directly).

### 45. Manual archival with bulk delete after cold-copy (for data that needs longer retention than TTL allows, but shouldn't stay in the hot collection)
```js
const cutoff = new Date(Date.now() - 90 * 86400000);
const cursor = db.events.find({ tenantId, createdAt: { $lt: cutoff } }).batchSize(500);
// stream to cold storage (S3/ClickHouse) first, THEN:
await db.events.deleteMany({ tenantId, createdAt: { $lt: cutoff } });
```
**Why correct at scale**: `deleteMany` on a huge matched set can be a long-running, lock-heavy operation. Batch it (delete in chunks with `limit`-style batches via repeated smaller `deleteMany` calls scoped by an additional narrowing filter) rather than one giant delete, to avoid a multi-minute operation that blocks other writers on the same shard's chunks. Always confirm cold-copy succeeded before deleting — this is a two-phase operation, not one query.

### 46. Capped collection for fixed-size rolling logs (alternative to TTL, when you want guaranteed max size, not max age)
```js
db.createCollection("recentActivity", { capped: true, size: 5368709120, max: 1000000 });
```
**Why correct for specific use cases at scale**: capped collections guarantee bounded disk usage regardless of write rate — useful for "last N activity events" type data where you care about a size ceiling, not a time window. Note: no deletes allowed except via natural rollover, so this is purpose-built for append-only rolling logs, not general-purpose data.

---

## J. Production Diagnostics (Must-Know Operational Queries) (47–50)

### 47. Slow query log analysis via `system.profile`
```js
db.setProfilingLevel(1, { slowms: 100 }); // log queries over 100ms
db.system.profile.find({ millis: { $gt: 100 } }).sort({ ts: -1 }).limit(20);
```
**Why must-know at scale**: at 10M-user traffic, you cannot manually watch every query — the profiler is your systematic way to catch regressions (a new deploy introduced an unindexed query) before they become a production incident. Run this continuously in staging against production-scale data, and periodically in prod at a sampled rate.

### 48. Index usage stats — find unused indexes (write-cost with no read benefit)
```js
db.orders.aggregate([{ $indexStats: {} }]);
// look for indexes with near-zero "accesses.ops" — candidates for removal
```
**Why must-know at scale**: every index you don't need is pure write-amplification tax (constraint #2 from the philosophy section) with zero benefit. At 10M-user write volume, periodically auditing and removing dead indexes is a direct throughput win — this is maintenance, not a one-time setup task.

### 49. Collection/index size and working-set estimation
```js
db.orders.stats(); // dataSize, storageSize, indexSizes
db.serverStatus().wiredTiger.cache; // "bytes currently in the cache" vs "maximum bytes configured"
```
**Why must-know at scale**: this is the direct, measurable check on constraint #1 (working set vs RAM) — if `bytes currently in cache` is consistently pinned at the configured max with high eviction rates, your working set has outgrown RAM and you need either more RAM, a schema change (less embedding, archive cold data), or more shards. This number should be on your production dashboard, not something you check reactively after an incident.

### 50. Replica lag check (critical when using `secondaryPreferred` reads at scale)
```js
rs.printSecondaryReplicationInfo();
// or: db.serverStatus().repl — check "syncSourceHost" and lag in seconds
```
**Why must-know at scale**: at 10M-user read volume routed to secondaries for scaling, replication lag directly determines how stale a "read-your-recent-data" experience can get. If lag exceeds your product's tolerance (e.g., a dashboard showing an order as "pending" 5 seconds after it was confirmed), you need either causal-consistency sessions (see #27) for the specific read-after-write paths, or to reduce lag via write concern tuning / hardware — but you can't know which fix applies without measuring this first.

---

## Closing note on how to use this doc

Each section maps to one of the four scale-breaking failure modes from the philosophy:
- **A, B** (bulk/idempotency) → throughput and correctness under retry/replay, the two guarantees that break first at 10M-user ingest volume.
- **C** (aggregation) → read-path cost control, specifically avoiding the "works in dev, scatter-gathers in prod" trap.
- **D** (transactions) → correctness under concurrency, applied surgically (not as a default).
- **E, F, G** (pagination, change streams, concurrency) → the mechanics of staying consistent and responsive as data and concurrent access both grow unboundedly.
- **H** (sharding) → distribution correctness, the one category where a wrong choice is expensive to fix later (shard key changes are structural surgery, not a migration script).
- **I, J** (archival, diagnostics) → the ongoing operational discipline that keeps everything above still true six months from now, after data has grown 10x.

If you want, I can go deeper on any single section — e.g., work through the actual `$graphLookup` vs materialized-path trade-off with your specific PO-approval depth, or size the oplog math for your quote→order fan-out consumer given your expected write rate.
