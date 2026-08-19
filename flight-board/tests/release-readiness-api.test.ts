import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { decisionIssuerPublicKey } from "../lib/decision-package";
import { RELEASE_READINESS_POLICY_V1, releaseReadinessDigest } from "../lib/release-readiness";
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

test("Gate 3 readiness snapshot is canonical, idempotent, immutable, and drift-sensitive", async () => {
  const db = new D1Database();
  assert.equal((await handleApi(humanRequest("/api/bootstrap"), { DB: db }))?.status, 200);
  const now = "2026-08-19T20:00:00.000Z";
  const inserted = db.sqlite.prepare(`INSERT INTO work_items
    (key, title, description, phase, priority, workflow, work_type, state, gate, decision_status,
     decision_authority, next_action, evidence_url, pod_id, created_by, created_at, updated_at)
    VALUES ('STR-974', 'Risk readiness fixture', 'Verify the bounded release readiness authority.', 'Evaluate',
      'Now', 'STEER', 'Technical', 'active', 'Gate 3 pending', 'Needed now', 'Product Lead',
      'Freeze exact readiness.', ?, 'steer-flight-team', 'human-1', ?, ?)`)
    .run(`https://github.com/idrissenayat/federal-bd-platform/blob/${"c".repeat(40)}/steer/evidence/0974.md`, now, now);
  const itemId = Number(inserted.lastInsertRowid);
  const assignmentId = "a".repeat(64);
  db.sqlite.prepare(`INSERT INTO review_assignments
    (assignment_id, idempotency_key, item_id, pod_id, review_stage, reviewer_member_id,
     primary_claim_lineage_id, item_revision, target_manifest_sha256, assignment_json,
     current_state, current_event_version, current_event_sha256, authorizing_actor_id,
     authorizing_event_id, created_at, terminal_at)
    VALUES (?, ?, ?, 'steer-flight-team', 'GATE_3', 'agent-critic', ?, ?, ?, '{}',
      'COMPLETED', 2, ?, 'human-1', ?, ?, ?)`)
    .run(assignmentId, "b".repeat(64), itemId, "lineage-974", now, "d".repeat(64), "e".repeat(64), "event-974", now, now);
  const implementationCommit = "c".repeat(40);
  const evidenceSha256 = "9".repeat(64);
  db.sqlite.prepare(`INSERT INTO agent_reviews
    (item_id, agent_id, review_mode, recommendation, confidence, summary, findings_json,
     dependencies_json, impacts_json, actions_json, derived_tags_json, evidence_scope,
     evidence_url, evidence_revision, evidence_sha256, reviewed_item_updated_at, requested_by,
     created_at, review_assignment_id)
    VALUES (?, 'agent-critic', 'signed_assignment_review', 'PASS', 'high', 'Exact candidate passes.',
      '[]', '[]', '[]', '[]', '["NONE"]', 'Exact Gate 3 candidate', ?, ?, ?, ?, 'human-1', ?, ?)`)
    .run(itemId, `https://github.com/idrissenayat/federal-bd-platform/blob/${implementationCommit}/steer/evidence/0974.md`, implementationCommit, evidenceSha256, now, now, assignmentId);
  const policySha256 = await releaseReadinessDigest(RELEASE_READINESS_POLICY_V1);
  db.sqlite.prepare(`INSERT INTO decision_readiness_policies
    (pod_id, policy_version, policy_json, policy_sha256, status, activated_by, activation_reason,
     ruling_url, ruling_sha256, created_at)
    VALUES ('steer-flight-team', 1, ?, ?, 'ACTIVE', 'human-1', 'ISSUE_74_GATE_2_POLICY_APPROVED',
      'https://example.test/ruling', ?, ?)`)
    .run(JSON.stringify(RELEASE_READINESS_POLICY_V1), policySha256, "f".repeat(64), now);
  const privateKey = "1".repeat(64);
  const serviceToken = "readiness-verification-service-token-000000000000";
  db.sqlite.prepare(`INSERT INTO decision_issuer_signers
    (pod_id, key_id, key_version, public_key, status, activated_by, activation_reason, created_at)
    VALUES ('steer-flight-team', 'readiness-test-key', 1, ?, 'ACTIVE', 'human-1', 'Exact test signer', ?)`)
    .run(decisionIssuerPublicKey(privateKey), now);
  const verification = await handleApi(new Request("https://steer.test/api/staging-verification-receipts", {
    method: "POST", headers: { authorization: `Bearer ${serviceToken}`, "content-type": "application/json" },
    body: JSON.stringify({ item_id: itemId, environment: "staging", source_revision: implementationCommit,
      build_sha256: "3".repeat(64), migration_set_sha256: "4".repeat(64), runtime_policy_sha256: "5".repeat(64),
      case_ledger_sha256: "7".repeat(64), completed_at: now }),
  }), { DB: db, DECISION_SERVICE_TOKEN: serviceToken, DECISION_SERVICE_PRIVATE_KEY: privateKey, DECISION_SERVICE_KEY_ID: "readiness-test-key", DECISION_SERVICE_KEY_VERSION: "1", STEER_DEPLOYMENT_ENV: "staging" });
  assert.equal(verification?.status, 201, await verification?.clone().text());
  const verificationIdentity = await verification?.json() as { receipt_id: string; receipt_sha256: string };
  const packet = {
    brief_commit: "1".repeat(40), brief_sha256: "1".repeat(64),
    exam_commit: "2".repeat(40), exam_sha256: "2".repeat(64),
    implementation_commit: implementationCommit, build_sha256: "3".repeat(64),
    migration_set_sha256: "4".repeat(64), runtime_policy_sha256: "5".repeat(64),
    verification_receipt_id: verificationIdentity.receipt_id, verification_receipt_sha256: verificationIdentity.receipt_sha256,
    declared_risk_codes: ["NONE"],
    operating_mode: "SOLO_CALIBRATION", satisfaction_path: "TIME",
  };
  const created = await handleApi(humanRequest(`/api/items/${itemId}/release-readiness`, "POST", packet), { DB: db });
  assert.equal(created?.status, 201, await created?.clone().text());
  const body = await created?.json() as { status: string; snapshot_sha256: string; snapshot: { tier: string; effective_not_before: string } };
  assert.equal(body.status, "READY");
  assert.equal(body.snapshot.tier, "DEFAULT_OPEN");
  assert.equal(body.snapshot.effective_not_before, now);
  const replay = await handleApi(humanRequest(`/api/items/${itemId}/release-readiness`, "POST", packet), { DB: db });
  assert.equal(replay?.status, 200);
  assert.equal((await replay?.json() as { replay: boolean }).replay, true);
  assert.throws(() => db.sqlite.prepare("UPDATE decision_readiness_snapshots SET effective_not_before = '2000-01-01T00:00:00Z' WHERE item_id = ?").run(itemId), /snapshot authority is immutable/);
  db.sqlite.prepare("UPDATE work_items SET title = 'Changed candidate', updated_at = '2026-08-19T20:01:00.000Z' WHERE id = ?").run(itemId);
  const drifted = await handleApi(humanRequest(`/api/items/${itemId}/release-readiness`), { DB: db });
  assert.equal(drifted?.status, 200);
  assert.equal((await drifted?.json() as { status: string; reason: string }).status, "INVALIDATED");
});

test("hosted readiness cases are staging-only, signed, immutable, and replay-safe", async () => {
  const db = new D1Database();
  await handleApi(humanRequest("/api/bootstrap"), { DB: db });
  const privateKey = "2".repeat(64);
  const serviceToken = "hosted-readiness-service-token-000000000000000";
  db.sqlite.prepare(`INSERT INTO decision_issuer_signers
    (pod_id, key_id, key_version, public_key, status, activated_by, activation_reason, created_at)
    VALUES ('steer-flight-team', 'hosted-readiness-key', 1, ?, 'ACTIVE', 'human-1', 'Exact hosted case signer', '2026-08-19T20:00:00.000Z')`)
    .run(decisionIssuerPublicKey(privateKey));
  const input = {
    run_id: "rr74-local-run",
    case_id: "RR74-CLASS-OPEN",
    declared_risk_codes: ["NONE"],
    derived_risk_codes: ["NONE"],
    operating_mode: "SOLO_CALIBRATION",
    satisfaction_path: "TIME",
    verification_completed_at: "2026-08-19T20:00:00.000Z",
    server_now: "2026-08-19T20:00:00.000Z",
    signatures: [],
    drift_field: "NONE",
  };
  const request = () => new Request("https://steer.test/api/staging-release-readiness-cases", {
    method: "POST",
    headers: { authorization: `Bearer ${serviceToken}`, "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const env = { DB: db, DECISION_SERVICE_TOKEN: serviceToken, DECISION_SERVICE_PRIVATE_KEY: privateKey, DECISION_SERVICE_KEY_ID: "hosted-readiness-key", DECISION_SERVICE_KEY_VERSION: "1", STEER_DEPLOYMENT_ENV: "staging" };
  const created = await handleApi(request(), env);
  assert.equal(created?.status, 201, await created?.clone().text());
  const result = await created?.json() as { response: { result: { status: string }; classification: { tier: string } }; response_sha256: string; service_signature: string; replay: boolean };
  assert.equal(result.response.classification.tier, "DEFAULT_OPEN");
  assert.equal(result.response.result.status, "READY");
  assert.match(result.response_sha256, /^[0-9a-f]{64}$/);
  assert.match(result.service_signature, /^[0-9a-f]{128}$/);
  assert.equal(result.replay, false);
  const replay = await handleApi(request(), env);
  assert.equal(replay?.status, 200);
  assert.equal((await replay?.json() as { replay: boolean }).replay, true);
  assert.throws(() => db.sqlite.prepare("UPDATE staging_readiness_case_results SET response_sha256 = ? WHERE run_id = ?").run("f".repeat(64), input.run_id), /case results are immutable/);
  const production = await handleApi(request(), { ...env, STEER_DEPLOYMENT_ENV: "production" });
  assert.equal(production?.status, 409);
});
