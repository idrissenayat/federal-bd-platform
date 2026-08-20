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
    const result = this.db.prepare(this.sql).run(...this.values as never[]);
    return { results: [] as T[], meta: { last_row_id: Number(result.lastInsertRowid), changes: Number(result.changes) } };
  }
  async run<T>() { return this.runSync<T>(); }
}

class D1Database {
  readonly sqlite = new DatabaseSync(":memory:");
  prepare(sql: string) { return new D1Statement(this.sqlite, sql); }
  async batch(statements: D1Statement[]) {
    this.sqlite.exec("BEGIN IMMEDIATE");
    try {
      const results = statements.map((statement) => statement.runSync());
      this.sqlite.exec("COMMIT");
      return results;
    } catch (error) {
      this.sqlite.exec("ROLLBACK");
      throw error;
    }
  }
}

function request(path = "/api/bootstrap") {
  return new Request(`https://steer.test${path}`, {
    headers: {
      "oai-authenticated-user-id": "fixture-partition-owner",
      "oai-authenticated-user-email": "fixture-partition-owner@example.test",
    },
  });
}

type Bootstrap = {
  deployment_environment: string;
  items: Array<{ id: number; key: string; verification_classification: { is_fixture: boolean } }>;
  verification_fixtures: Array<{ id: number; key: string; verification_classification: { is_fixture: boolean } }>;
  activity: Array<{ item_id: number }>;
  verification_activity: Array<{ item_id: number }>;
  decisions: Array<{ item_id: number }>;
  verification_decisions: Array<{ item_id: number }>;
  members: Array<{ id: string }>;
  verification_members: Array<{ id: string }>;
};

async function bootstrap(db: D1Database, environment: "staging" | "production") {
  const response = await handleApi(request(), { DB: db, STEER_DEPLOYMENT_ENV: environment });
  assert.equal(response?.status, 200, await response?.clone().text());
  return await response!.json() as Bootstrap;
}

test("FI-05 bootstrap partitions exact governed fixtures and their related records without rewriting storage", async () => {
  const db = new D1Database();
  await bootstrap(db, "production");
  const podId = String(db.sqlite.prepare("SELECT pod_id FROM members WHERE id = ?").get("fixture-partition-owner")!.pod_id);
  const now = "2026-08-20T14:00:00.000Z";
  const fixtureMemberId = "rr74-builder-abcdef1234567890";
  db.sqlite.prepare(`INSERT INTO members
    (id, display_name, kind, role, authority, status, accent, pod_id)
    VALUES (?, 'Issue 74 Builder', 'agent', 'Builder', 'Staging fixture only', 'enrolled', 'coral', ?)`).run(fixtureMemberId, podId);

  const insertItem = db.sqlite.prepare(`INSERT INTO work_items
    (key, title, description, phase, priority, workflow, state, gate, decision_status,
     decision_authority, assignee_id, next_action, github_url, pod_id, created_by, created_at, updated_at)
    VALUES (?, ?, 'Partition integration evidence', 'Evaluate', 'Now', 'Setup / excluded', 'active',
      'Gate 3 pending', 'Needed now', 'Product Lead', ?, 'Preserve the exact record.', ?, ?, ?, ?, ?)`);
  const fixtureId = Number(insertItem.run(
    "RR74-ABCDEF123456", "Issue 74 exact hosted fixture", fixtureMemberId,
    "https://staging.test/issue-74/rr74-v38-run/RR74-CLASS-OPEN", podId,
    "fixture-partition-owner", now, now,
  ).lastInsertRowid);
  const ordinaryId = Number(insertItem.run(
    "STR-977", "Ordinary excluded work", fixtureMemberId,
    "https://github.com/idrissenayat/federal-bd-platform/issues/77", podId,
    "fixture-partition-owner", now, now,
  ).lastInsertRowid);

  const related = [fixtureId, ordinaryId];
  for (const itemId of related) {
    db.sqlite.prepare("INSERT INTO activity (item_id, actor_id, action, detail, created_at) VALUES (?, ?, 'updated', 'partition test', ?)")
      .run(itemId, "fixture-partition-owner", now);
    db.sqlite.prepare(`INSERT INTO decisions
      (item_id, gate, decision, reasoning, actor_id, created_at)
      VALUES (?, 'Gate 3 pending', 'APPROVED', 'Partition test', ?, ?)`).run(itemId, "fixture-partition-owner", now);
  }

  const rowCountBefore = Number(db.sqlite.prepare("SELECT COUNT(*) AS count FROM work_items").get()!.count);
  const staging = await bootstrap(db, "staging");
  assert.equal(staging.deployment_environment, "staging");
  assert.equal(staging.verification_fixtures.some((item) => item.id === fixtureId && item.verification_classification.is_fixture), true);
  assert.equal(staging.items.some((item) => item.id === fixtureId), false);
  assert.equal(staging.items.some((item) => item.id === ordinaryId && !item.verification_classification.is_fixture), true);
  assert.equal(staging.verification_activity.length, 0);
  assert.equal(staging.activity.some((record) => record.item_id === fixtureId), false);
  assert.equal(staging.activity.some((record) => record.item_id === ordinaryId), true);
  assert.equal(staging.verification_decisions.length, 0);
  assert.equal(staging.decisions.some((record) => record.item_id === fixtureId), false);
  assert.equal(staging.decisions.some((record) => record.item_id === ordinaryId), true);
  assert.equal(staging.verification_members.some((member) => member.id === fixtureMemberId), true);
  assert.equal(staging.members.some((member) => member.id === fixtureMemberId), false);
  assert.equal(Number(db.sqlite.prepare("SELECT COUNT(*) AS count FROM work_items").get()!.count), rowCountBefore);

  const fixtureEvidenceResponse = await handleApi(request(`/api/items/${fixtureId}/verification-evidence`), { DB: db, STEER_DEPLOYMENT_ENV: "staging" });
  assert.equal(fixtureEvidenceResponse?.status, 200, await fixtureEvidenceResponse?.clone().text());
  const fixtureEvidence = await fixtureEvidenceResponse!.json() as { activity: Array<{ item_id: number }>; decisions: Array<{ item_id: number }> };
  assert.equal(fixtureEvidence.activity.every((record) => record.item_id === fixtureId), true);
  assert.equal(fixtureEvidence.decisions.every((record) => record.item_id === fixtureId), true);
  assert.equal(fixtureEvidence.activity.length, 1);
  assert.equal(fixtureEvidence.decisions.length, 1);

  const production = await bootstrap(db, "production");
  assert.equal(production.verification_fixtures.length, 0);
  assert.equal(production.items.some((item) => item.id === fixtureId && !item.verification_classification.is_fixture), true);
  assert.equal(production.verification_activity.length, 0);
  assert.equal(production.verification_decisions.length, 0);
  assert.equal(production.verification_members.length, 0);
  assert.equal(production.members.some((member) => member.id === fixtureMemberId), true);
  const productionEvidenceResponse = await handleApi(request(`/api/items/${fixtureId}/verification-evidence`), { DB: db, STEER_DEPLOYMENT_ENV: "production" });
  assert.equal(productionEvidenceResponse?.status, 409);
});
