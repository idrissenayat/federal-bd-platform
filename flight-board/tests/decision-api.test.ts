import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { createDecisionIssuerEnvelope, createUuidV7, decisionDigest, decisionIssuerPublicKey, type DecisionIntentPayload } from "../lib/decision-package";
import { sha256Hex } from "../lib/dispatch-lifecycle";
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

function humanRequest(path: string, method = "GET", body?: unknown) {
  return new Request(`https://steer.test${path}`, {
    method,
    headers: { "oai-authenticated-user-id": "human-1", "oai-authenticated-user-email": "human-1@example.test", ...(body === undefined ? {} : { "content-type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function serviceRequest(path: string, token: string) {
  return new Request(`https://steer.test${path}`, { method: "POST", headers: { authorization: `Bearer ${token}` } });
}

test("cooled solo finalization advances Gate 2 exactly once and replays without duplicate projections", async (context) => {
  context.mock.timers.enable({ apis: ["Date"], now: new Date("2026-08-16T20:00:00.000Z") });
  const db = new D1Database();
  const initialized = await handleApi(humanRequest("/api/bootstrap"), { DB: db });
  assert.equal(initialized?.status, 200);
  db.sqlite.prepare("UPDATE members SET role = 'Product Lead · interim Tech Lead', pod_id = 'pod-a' WHERE id = 'human-1'").run();

  const evidenceText = "# Exact Gate 2 evidence\n\nVerified implementation evidence.\n";
  const evidenceSha256 = await sha256Hex(evidenceText);
  const commit = "c".repeat(40);
  const path = "steer/evidence/0027-connected-finalization-fixture.md";
  const evidenceUrl = `https://github.com/idrissenayat/federal-bd-platform/blob/${commit}/${path}`;
  const itemUpdatedAt = "2026-08-18T20:00:00.000Z";
  const insertedItem = db.sqlite.prepare(`INSERT INTO work_items
    (key, title, description, phase, priority, workflow, work_type, state, gate, decision_status,
     decision_authority, next_action, evidence_url, pod_id, created_by, created_at, updated_at)
    VALUES ('STR-901', 'Connected decision finalization', 'Exercise exact atomic effect', 'Frame',
      'Now', 'STEER', 'Technical', 'blocked', 'Gate 2 pending', 'Needed now', 'Interim Tech Lead',
      'Record the exact governed ruling.', ?, 'pod-a', 'human-1', ?, ?)`)
    .run(evidenceUrl, itemUpdatedAt, itemUpdatedAt);
  const itemId = Number(insertedItem.lastInsertRowid);
  const review = db.sqlite.prepare(`INSERT INTO agent_reviews
    (item_id, agent_id, review_mode, recommendation, confidence, summary, findings_json,
     dependencies_json, impacts_json, actions_json, derived_tags_json, evidence_scope,
     evidence_url, evidence_revision, evidence_sha256, reviewed_item_updated_at, requested_by, created_at)
    VALUES (?, 'agent-critic', 'GATE_2_BUILD', 'APPROVED', 'high', 'Exact target passes.',
      '[]', '[]', '[]', '[]', '[]', 'Exact fixture', ?, ?, ?, ?, 'human-1', ?)`)
    .run(itemId, evidenceUrl, commit, evidenceSha256, itemUpdatedAt, itemUpdatedAt);
  assert.ok(Number(review.lastInsertRowid) > 0);
  const startedSession = await handleApi(humanRequest(`/api/items/${itemId}/decision-sessions`, "POST", { reason: "Fresh session after rereading the exact evidence." }), { DB: db });
  assert.equal(startedSession?.status, 201, await startedSession?.clone().text());
  const decisionSessionId = (await startedSession?.json() as { session_id: string }).session_id;
  db.sqlite.prepare(`INSERT INTO decision_signer_policies
    (pod_id, policy_version, operating_mode, required_countersignatures, cooling_hours,
     status, activated_by, activation_reason, ruling_url, ruling_sha256, created_at)
    VALUES ('pod-a', 1, 'SOLO_CALIBRATION', 0, 24, 'ACTIVE', 'human-1',
      'Approved connected test policy', ?, ?, ?)`)
    .run(evidenceUrl, evidenceSha256, itemUpdatedAt);

  const intent: DecisionIntentPayload = {
    schema: "steer-decision-intent/v1",
    intent_id: createUuidV7(1_700_000_000_000), receipt_id: createUuidV7(1_700_000_000_001),
    package_id: createUuidV7(1_700_000_000_002), item_key: "STR-901", decision_kind: "Gate 2 pending",
    decision: "APPROVED", final_reasoning: "The exact reviewed Gate 2 evidence is sufficient.",
    draft_sha256: "a".repeat(64), evidence_set_sha256: "b".repeat(64),
    target: { repository_uri: "https://github.com/idrissenayat/federal-bd-platform", commit, path, body_sha256: evidenceSha256 },
    submitter_principal: "human-1", submitter_role: "Product Lead · interim Tech Lead",
    decision_session_id: decisionSessionId,
    submitted_at: "2026-08-16T20:00:00.000Z", effective_not_before: "2026-08-17T20:00:00.000Z",
    operating_mode: "SOLO_CALIBRATION", signer_policy_version: 1, required_countersignatures: 0,
    idempotency_key: createUuidV7(1_700_000_000_003), sequence: 1,
  };
  const intentSha256 = await decisionDigest(intent);
  const priorEventSha256 = "e".repeat(64);
  db.sqlite.prepare(`INSERT INTO decision_intents
    (intent_id, receipt_id, package_id, item_id, pod_id, idempotency_key, intent_json, intent_sha256,
     current_state, current_sequence, current_event_sha256, required_countersignatures,
     accepted_countersignatures, submitter_id, submitter_role, decision_session_id, effective_not_before,
     signer_policy_version, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'pod-a', ?, ?, ?, 'PENDING_COUNTERSIGNATURE', 2, ?, 0, 0,
      'human-1', ?, ?, ?, 1, ?, ?)`)
    .run(intent.intent_id, intent.receipt_id, intent.package_id, itemId, intent.idempotency_key,
      JSON.stringify(intent), intentSha256, priorEventSha256, intent.submitter_role,
      intent.decision_session_id, intent.effective_not_before, intent.submitted_at, intent.submitted_at);
  assert.throws(() => db.sqlite.prepare("UPDATE decision_intents SET required_countersignatures = 2 WHERE intent_id = ?").run(intent.intent_id), /decision intent .*authority is immutable/);
  assert.throws(() => db.sqlite.prepare("UPDATE decision_intents SET effective_not_before = '2000-01-01T00:00:00Z' WHERE intent_id = ?").run(intent.intent_id), /decision intent .*authority is immutable/);
  assert.throws(() => db.sqlite.prepare("UPDATE decision_intents SET signer_policy_version = 2 WHERE intent_id = ?").run(intent.intent_id), /decision intent .*authority is immutable/);
  assert.throws(() => db.sqlite.prepare("UPDATE decision_sessions SET decision_kind = 'Gate 1 pending' WHERE session_id = ?").run(intent.decision_session_id), /decision sessions are immutable/);

  const privateKey = "1".repeat(64);
  const keyId = "connected-decision-issuer";
  const envelope = await createDecisionIssuerEnvelope({ intent, privateKeyHex: privateKey, keyId, issuerPrincipal: "steer-decision-proof-service", issuedAt: "2026-08-16T20:05:00Z" });
  db.sqlite.prepare(`INSERT INTO decision_issuer_signers
    (pod_id, key_id, key_version, public_key, status, activated_by, activation_reason, created_at)
    VALUES ('pod-a', ?, 1, ?, 'ACTIVE', 'human-1', 'Connected issuer test', ?)`)
    .run(keyId, decisionIssuerPublicKey(privateKey), intent.submitted_at);
  db.sqlite.prepare(`INSERT INTO decision_issuer_envelopes
    (intent_id, key_id, key_version, envelope_json, envelope_sha256, created_at)
    VALUES (?, ?, 1, ?, ?, ?)`)
    .run(intent.intent_id, keyId, JSON.stringify(envelope), await decisionDigest(envelope), intent.submitted_at);

  context.mock.method(globalThis, "fetch", async () => new Response(evidenceText, { status: 200 }));
  context.mock.timers.setTime(new Date("2026-08-18T20:00:00.000Z").getTime());
  const token = "connected-decision-service-token-000000000000000";
  const env = { DB: db, DECISION_SERVICE_TOKEN: token };
  db.sqlite.prepare("UPDATE members SET status = 'inactive' WHERE id = 'human-1'").run();
  const rejected = await handleApi(serviceRequest(`/api/decision-intents/${intent.intent_id}/finalize`, token), env);
  assert.equal(rejected?.status, 409);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS count FROM decisions WHERE decision_intent_id = ?").get(intent.intent_id)?.count, 0);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS count FROM decision_proof_events WHERE intent_id = ? AND event_type = 'FINALIZATION_AUTHORITY_REJECTED'").get(intent.intent_id)?.count, 1);
  db.sqlite.prepare("UPDATE members SET status = 'available' WHERE id = 'human-1'").run();
  const first = await handleApi(serviceRequest(`/api/decision-intents/${intent.intent_id}/finalize`, token), env);
  assert.equal(first?.status, 201, await first?.clone().text());
  assert.equal((await first?.json() as { effective: boolean }).effective, true);
  assert.equal(db.sqlite.prepare("SELECT gate FROM work_items WHERE id = ?").get(itemId)?.gate, "Gate 2 passed");
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS count FROM decisions WHERE decision_intent_id = ?").get(intent.intent_id)?.count, 1);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS count FROM decision_proof_events WHERE intent_id = ? AND event_type = 'DECISION_EFFECTIVE'").get(intent.intent_id)?.count, 1);

  const replay = await handleApi(serviceRequest(`/api/decision-intents/${intent.intent_id}/finalize`, token), env);
  assert.equal(replay?.status, 200);
  assert.equal((await replay?.json() as { replay: boolean }).replay, true);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS count FROM decisions WHERE decision_intent_id = ?").get(intent.intent_id)?.count, 1);
});
