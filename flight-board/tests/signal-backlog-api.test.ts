import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { handleApi } from "../worker/api";

class D1Statement {
  constructor(private readonly db: DatabaseSync, private readonly sql: string, private readonly values: unknown[] = []) {}
  bind(...values: unknown[]) { return new D1Statement(this.db, this.sql, values); }
  async first<T>() { return (this.db.prepare(this.sql).get(...this.values as never[]) as T | undefined) ?? null; }
  async all<T>() { return { results: this.db.prepare(this.sql).all(...this.values as never[]) as T[] }; }
  runSync<T>() {
    if (/^\s*(?:SELECT|PRAGMA|EXPLAIN|WITH)\b/iu.test(this.sql)) return { results: this.db.prepare(this.sql).all(...this.values as never[]) as T[], meta: { changes: 0 } };
    const result = this.db.prepare(this.sql).run(...this.values as never[]);
    return { results: [] as T[], meta: { last_row_id: Number(result.lastInsertRowid), changes: Number(result.changes) } };
  }
  async run<T>() { return this.runSync<T>(); }
}

class D1Database {
  readonly sqlite = new DatabaseSync(":memory:");
  readonly batchSizes: number[] = [];
  prepare(sql: string) { return new D1Statement(this.sqlite, sql); }
  async batch(statements: D1Statement[]) {
    this.batchSizes.push(statements.length);
    this.sqlite.exec("BEGIN IMMEDIATE");
    try { const results = statements.map((statement) => statement.runSync()); this.sqlite.exec("COMMIT"); return results; }
    catch (error) { this.sqlite.exec("ROLLBACK"); throw error; }
  }
}

function request(path: string, actor = "signal-backlog-owner") {
  return new Request(`https://steer.test${path}`, { headers: { "oai-authenticated-user-id": actor, "oai-authenticated-user-email": `${actor}@example.test` } });
}

function signalId(index: number) {
  return `0198abcd-0000-7000-8000-${index.toString(16).padStart(12, "0")}`;
}

async function seed() {
  const db = new D1Database();
  const bootstrap = await handleApi(request("/api/bootstrap"), { DB: db });
  assert.equal(bootstrap?.status, 200, await bootstrap?.clone().text());
  const podId = String(db.sqlite.prepare("SELECT pod_id FROM members WHERE id = ?").get("signal-backlog-owner")!.pod_id);
  const states = ["CAPTURED", "PROCESSING", "READY", "STALE", "SAFE_FAILURE"];
  for (let index = 1; index <= 31; index += 1) {
    const id = signalId(index);
    const state = states[(index - 1) % states.length];
    const createdAt = index <= 5 ? "2026-08-19T12:00:00.000Z" : new Date(Date.UTC(2026, 7, 19, 11, 60 - index)).toISOString();
    const original = index === 17 ? "Literal 100%_complete signal with emoji 🚀" : `Public signal backlog fixture number ${index}`;
    db.sqlite.prepare(`INSERT INTO signals
      (signal_id,pod_id,submitter_id,original_text,original_sha256,idempotency_key,lifecycle_state,
       current_proposal_version,terminal_disposition_at,retention_delete_after,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,1,?, ?,?,?)`).run(
        id, podId, "signal-backlog-owner", original, index.toString(16).padStart(64, "0"), `signal-backlog-${index.toString().padStart(3, "0")}`,
        state, ["READY", "STALE", "SAFE_FAILURE"].includes(state) ? createdAt : null,
        ["READY", "STALE", "SAFE_FAILURE"].includes(state) ? "2026-11-17T12:00:00.000Z" : "9999-12-31T23:59:59.999Z", createdAt, createdAt,
      );
    if (state === "SAFE_FAILURE") {
      db.sqlite.prepare(`INSERT INTO signal_generation_attempts
        (attempt_id,signal_id,attempt_number,target_proposal_version,provider,model,prompt_version,state,
         implementation_revision,started_at,completed_at,error_code,input_sha256)
        VALUES (?,?,1,1,'OpenAI','gpt-5.6-luna','signal-proposal-v1','FAILED','issue78-test',?,?, 'PROVIDER_TIMEOUT',?)`)
        .run(`${id}:attempt`, id, createdAt, createdAt, "a".repeat(64));
    }
  }
  return { db, podId };
}

type ListResponse = {
  counts: { total: number; new: number; screening: number; ready_for_review: number; needs_attention: number };
  items: Array<{ signal_id: string; presentation_group: string; attention_reason: string | null; created_at: string }>;
  page: { has_more: boolean; next_cursor: string | null; returned: number };
};

async function get(db: D1Database, path: string, actor = "signal-backlog-owner") {
  const response = await handleApi(request(path, actor), { DB: db });
  return { response: response!, body: await response!.clone().json() as ListResponse & { code?: string } };
}

test("SB-02/SB-03 returns the complete stable 31-signal register exactly once", async () => {
  const { db } = await seed();
  const workBefore = Number(db.sqlite.prepare("SELECT COUNT(*) count FROM work_items").get()!.count);
  const found: string[] = [];
  let cursor: string | null = null;
  let firstCounts: ListResponse["counts"] | null = null;
  do {
    const path = `/api/signals?limit=7&group=ALL${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
    const { response, body } = await get(db, path);
    assert.equal(response.status, 200, await response.clone().text());
    firstCounts ??= body.counts;
    assert.deepEqual(body.counts, firstCounts);
    found.push(...body.items.map((item) => item.signal_id));
    cursor = body.page.next_cursor;
  } while (cursor);
  assert.equal(found.length, 31);
  assert.equal(new Set(found).size, 31);
  assert.deepEqual(firstCounts, { total: 31, new: 7, screening: 6, ready_for_review: 6, needs_attention: 12 });
  assert.deepEqual(found.slice(0, 5), [5, 4, 3, 2, 1].map(signalId));
  assert.equal(Number(db.sqlite.prepare("SELECT COUNT(*) count FROM work_items").get()!.count), workBefore);
  assert.match(String(db.sqlite.prepare("SELECT sql FROM sqlite_master WHERE type='index' AND name='idx_signals_pod_created_id'").get()!.sql), /created_at DESC.*signal_id DESC/u);
});

test("SB-05/SB-06 filters using server counts and closed lifecycle mapping", async () => {
  const { db } = await seed();
  db.batchSizes.length = 0;
  const ready = await get(db, "/api/signals?limit=25&group=READY_FOR_REVIEW");
  assert.equal(ready.response.status, 200);
  assert.equal(ready.body.items.length, 6);
  assert.equal(ready.body.items.every((item) => item.presentation_group === "READY_FOR_REVIEW"), true);
  const attention = await get(db, "/api/signals?limit=25&group=NEEDS_ATTENTION");
  assert.equal(attention.body.items.length, 12);
  assert.equal(attention.body.items.filter((item) => item.attention_reason === "PROVIDER_TIMEOUT").length, 6);
  assert.equal(attention.body.items.filter((item) => item.attention_reason === "SOURCE_CHANGED").length, 6);
  assert.deepEqual(db.batchSizes, [2, 4, 2, 4], "each read uses one D1 read batch and one bounded telemetry batch");
});

test("SB-07/SB-08 treats search literally and rejects malformed requests without echo", async () => {
  const { db } = await seed();
  const literal = await get(db, "/api/signals?limit=25&group=ALL&q=%25_");
  assert.equal(literal.response.status, 200);
  assert.deepEqual(literal.body.items.map((item) => item.signal_id), [signalId(17)]);
  const invalid = [
    ["/api/signals?limit=51", "INVALID_SIGNAL_PAGE_LIMIT"],
    ["/api/signals?group=READY", "INVALID_SIGNAL_GROUP"],
    ["/api/signals?q=", "INVALID_SIGNAL_QUERY"],
    ["/api/signals?other=secret-search", "INVALID_SIGNAL_LIST_PARAMETER"],
    ["/api/signals?cursor=not-a-cursor", "INVALID_SIGNAL_CURSOR"],
  ] as const;
  for (const [path, code] of invalid) {
    const { response, body } = await get(db, path);
    assert.equal(response.status, 400);
    assert.equal(body.code, code);
    assert.doesNotMatch(await response.clone().text(), /secret-search/u);
  }
});

test("SB-09 derives POD scope and rejects an unenrolled identity", async () => {
  const { db } = await seed();
  await handleApi(request("/api/bootstrap", "other-signal-member"), { DB: db });
  db.sqlite.prepare("UPDATE members SET pod_id = 'other-pod' WHERE id = 'other-signal-member'").run();
  const other = await get(db, "/api/signals?limit=25&group=ALL", "other-signal-member");
  assert.equal(other.response.status, 200);
  assert.equal(other.body.counts.total, 0);
  db.sqlite.prepare("UPDATE members SET status = 'open' WHERE id = 'other-signal-member'").run();
  const denied = await get(db, "/api/signals?limit=25&group=ALL", "other-signal-member");
  assert.equal(denied.response.status, 403);
  assert.equal(denied.body.code, "SIGNAL_BACKLOG_ACCESS_DENIED");
});
