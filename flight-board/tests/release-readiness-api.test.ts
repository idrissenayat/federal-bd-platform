import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { createUuidV7, decisionIssuerPublicKey } from "../lib/decision-package";
import { canonicalJson, dispatchPublicKey, sha256Hex, signSchnorrBinding } from "../lib/dispatch-lifecycle";
import { RELEASE_READINESS_POLICY_V1, releaseReadinessDigest } from "../lib/release-readiness";
import { createSignedReviewEvent, reviewManifestSha256, type ReviewAssignmentPayload } from "../lib/review-lifecycle";
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

test("Gate 3 readiness traverses the real snapshot, session, intent, proof, and finalization lifecycle", async (context) => {
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
  const privateKey = "1".repeat(64);
  const reviewerPrivateKey = "2".repeat(64);
  const reviewServiceKeyId = "review-service-test";
  const reviewerKeyId = "critic-test-key";
  db.sqlite.prepare(`UPDATE members SET agent_key_id = ?, agent_key_version = 1, agent_public_key = ? WHERE id = 'agent-critic'`)
    .run(reviewerKeyId, dispatchPublicKey(reviewerPrivateKey));
  db.sqlite.prepare(`UPDATE members SET agent_key_id = 'test-verifier', agent_key_version = 1, agent_public_key = ? WHERE id = 'agent-test'`)
    .run(dispatchPublicKey(reviewerPrivateKey));
  const implementationCommit = "c".repeat(40);
  const implementationText = "# Exact implementation evidence\n";
  const implementationArtifactSha256 = await sha256Hex(implementationText);
  const targetWithoutManifest = {
    target_git_object_format: "sha1" as const,
    target_git_commit_oid: implementationCommit,
    target_commit_object_sha256: "9".repeat(64),
    target_artifacts: [{ path: "steer/evidence/0974.md", url: `https://github.com/idrissenayat/federal-bd-platform/blob/${implementationCommit}/steer/evidence/0974.md`, size_bytes: Buffer.byteLength(implementationText), sha256: implementationArtifactSha256 }],
  };
  const targetManifestSha256 = await reviewManifestSha256(targetWithoutManifest);
  const target = { ...targetWithoutManifest, target_artifact_manifest_sha256: targetManifestSha256 };
  const verificationReceipt = { schema: "steer-target-verification/v1" as const, target, verified_at: now,
    verification_method: "git-cat-file-and-sha256-bytes" as const, verifier_member_id: "agent-test", verifier_key_id: "test-verifier", verifier_key_version: 1 };
  const assignmentPayload: ReviewAssignmentPayload = {
    schema: "steer-review-assignment/v1", work_item_stable_id: itemId, work_item_key: "STR-974",
    workspace_pod_id: "steer-flight-team", workflow: "STEER", primary_claim_lineage_id: "lineage-974",
    primary_owner_role: "Implementation Agent", primary_owner_member_id: "agent-builder", review_stage: "GATE_3_BUILD",
    target, target_verification: { receipt: verificationReceipt, signature: (await signSchnorrBinding(verificationReceipt, reviewerPrivateKey)).signature },
    prior_binding_digests: [], reviewer_role: "Independent Critic", reviewer_member_id: "agent-critic",
    output_contract: ["Exact bounded review."], prohibitions: ["No release authority."], authorizing_actor_id: "human-1",
    authorizing_event_id: "b".repeat(64), item_revision: now,
  };
  const assignmentId = await sha256Hex(canonicalJson(assignmentPayload));
  db.sqlite.prepare(`INSERT INTO review_assignments
    (assignment_id, idempotency_key, item_id, pod_id, review_stage, reviewer_member_id,
     primary_claim_lineage_id, item_revision, target_manifest_sha256, assignment_json,
     current_state, current_event_version, current_event_sha256, authorizing_actor_id,
     authorizing_event_id, created_at, terminal_at)
    VALUES (?, ?, ?, 'steer-flight-team', 'GATE_3_BUILD', 'agent-critic', ?, ?, ?, ?,
      'RESULT_RECORDED', 4, ?, 'human-1', ?, ?, ?)`)
    .run(assignmentId, "d".repeat(64), itemId, "lineage-974", now, targetManifestSha256, JSON.stringify(assignmentPayload),
      "0".repeat(64), "b".repeat(64), now, now);
  const result = { recommendation: "PASS", confidence: "high", summary: "Exact candidate passes.", findings: [],
    dependencies: [], impacts: [], actions: [], derived_tags: ["NONE"], evidence_scope: "Exact Gate 3 candidate", completed_at: now };
  const eventInputs = [
    { eventType: "REVIEW_TARGET_READY" as const, typedPayload: { target_verification_receipt_sha256: "a".repeat(64) }, actorId: "human-1" },
    { eventType: "REVIEW_ASSIGNED" as const, typedPayload: { review_idempotency_key: "d".repeat(64) }, actorId: "human-1" },
    { eventType: "REVIEW_REQUESTED" as const, typedPayload: { canonical_route: "review-assignment-store" }, actorId: "human-1" },
    { eventType: "REVIEW_ACKNOWLEDGED" as const, typedPayload: {} as Record<string, unknown>, actorId: "agent-critic" },
    { eventType: "REVIEW_RESULT_RECORDED" as const, typedPayload: {} as Record<string, unknown>, actorId: "agent-critic" },
  ];
  let priorEventSha: string | null = null;
  for (let index = 0; index < eventInputs.length; index += 1) {
    if (index === 3) eventInputs[index].typedPayload = { schema: "steer-review-acknowledgement/v1", review_assignment_id: assignmentId,
      target_artifact_manifest_sha256: targetManifestSha256, source_request_event_sha256: priorEventSha, predecessor_event_sha256: priorEventSha, acknowledged_at: now };
    if (index === 4) eventInputs[index].typedPayload = { schema: "steer-review-result/v1", review_assignment_id: assignmentId,
      target_artifact_manifest_sha256: targetManifestSha256, predecessor_event_sha256: priorEventSha,
      result_sha256: await sha256Hex(canonicalJson(result)), result };
    const reviewerSignature = index >= 3 ? (await signSchnorrBinding(eventInputs[index].typedPayload, reviewerPrivateKey)).signature : undefined;
    const event = await createSignedReviewEvent({ assignmentId, eventVersion: index, previousEventSha256: priorEventSha,
      eventType: eventInputs[index].eventType, occurredAt: now, targetManifestSha256, actorId: eventInputs[index].actorId,
      typedPayload: eventInputs[index].typedPayload, serviceKeyId: reviewServiceKeyId, serviceKeyVersion: 1,
      servicePrivateKey: privateKey, reviewerKeyId: index >= 3 ? reviewerKeyId : undefined,
      reviewerKeyVersion: index >= 3 ? 1 : undefined, reviewerSignature });
    db.sqlite.prepare(`INSERT INTO review_events
      (assignment_id,event_version,expected_event_version,event_type,payload_json,previous_event_sha256,event_sha256,
       service_key_id,service_key_version,service_signature,reviewer_key_id,reviewer_key_version,reviewer_signature,actor_id,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(assignmentId, index, index - 1, eventInputs[index].eventType,
        canonicalJson(event.envelope), priorEventSha, event.eventSha256, reviewServiceKeyId, 1, event.envelope.service_signature,
        index >= 3 ? reviewerKeyId : null, index >= 3 ? 1 : null, reviewerSignature ?? null, eventInputs[index].actorId, now);
    priorEventSha = event.eventSha256;
  }
  db.sqlite.prepare("UPDATE review_assignments SET current_event_sha256 = ? WHERE assignment_id = ?").run(priorEventSha, assignmentId);
  db.sqlite.prepare(`INSERT INTO agent_reviews
    (item_id, agent_id, review_mode, recommendation, confidence, summary, findings_json,
     dependencies_json, impacts_json, actions_json, derived_tags_json, evidence_scope,
     evidence_url, evidence_revision, evidence_sha256, reviewed_item_updated_at, requested_by,
     created_at, review_assignment_id)
    VALUES (?, 'agent-critic', 'signed_assignment_review', 'PASS', 'high', 'Exact candidate passes.',
      '[]', '[]', '[]', '[]', '["NONE"]', 'Exact Gate 3 candidate', ?, ?, ?, ?, 'human-1', ?, ?)`)
    .run(itemId, target.target_artifacts[0].url, implementationCommit, targetManifestSha256, now, now, assignmentId);
  const policySha256 = await releaseReadinessDigest(RELEASE_READINESS_POLICY_V1);
  db.sqlite.prepare(`INSERT INTO decision_readiness_policies
    (pod_id, policy_version, policy_json, policy_sha256, status, activated_by, activation_reason,
     ruling_url, ruling_sha256, created_at)
    VALUES ('steer-flight-team', 1, ?, ?, 'ACTIVE', 'human-1', 'ISSUE_74_GATE_2_POLICY_APPROVED',
      'https://example.test/ruling', ?, ?)`)
    .run(JSON.stringify(RELEASE_READINESS_POLICY_V1), policySha256, "f".repeat(64), now);
  db.sqlite.prepare(`INSERT INTO decision_signer_policies
    (pod_id, policy_version, operating_mode, required_countersignatures, cooling_hours, status,
     activated_by, activation_reason, ruling_url, ruling_sha256, created_at)
    VALUES ('steer-flight-team', 1, 'SOLO_CALIBRATION', 0, 24, 'ACTIVE', 'human-1',
      'Exact test policy', 'https://example.test/ruling', ?, ?)`).run("f".repeat(64), now);
  const serviceToken = "readiness-verification-service-token-000000000000";
  const humanEnv = { DB: db, REVIEW_SERVICE_PRIVATE_KEY: privateKey, REVIEW_SERVICE_KEY_ID: reviewServiceKeyId,
    REVIEW_SERVICE_KEY_VERSION: "1", STEER_DEPLOYMENT_ENV: "staging" };
  const briefText = "# Exact approved Brief\n";
  const examText = "# Exact approved Exam\n";
  const briefSha256 = await sha256Hex(briefText);
  const examSha256 = await sha256Hex(examText);
  db.sqlite.prepare(`INSERT INTO decisions
    (item_id, gate, decision, reasoning, actor_id, evidence_url, evidence_revision, evidence_sha256, created_at)
    VALUES (?, 'Gate 1 pending', 'APPROVED', 'Exact Brief approved.', 'human-1', ?, ?, ?, ?),
           (?, 'Gate 2 pending', 'APPROVED', 'Exact Exam approved.', 'human-1', ?, ?, ?, ?)`).run(
      itemId, `https://github.com/idrissenayat/federal-bd-platform/blob/${"1".repeat(40)}/steer/briefs/0974.md`, "1".repeat(40), briefSha256, now,
      itemId, `https://github.com/idrissenayat/federal-bd-platform/blob/${"2".repeat(40)}/steer/exams/0974.md`, "2".repeat(40), examSha256, now,
    );
  const priorIntentId = createUuidV7(1_700_000_000_000);
  const priorSessionId = createUuidV7(1_700_000_000_001);
  db.sqlite.prepare(`INSERT INTO decision_intents
    (intent_id, receipt_id, package_id, item_id, pod_id, idempotency_key, intent_json, intent_sha256,
     current_state, current_sequence, current_event_sha256, required_countersignatures, accepted_countersignatures,
     submitter_id, submitter_role, effective_not_before, decision_session_id, signer_policy_version,
     readiness_snapshot_sha256, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'steer-flight-team', ?, ?, ?, 'EFFECTIVE', 3, ?, 0, 0,
      'human-1', 'Product Lead / Interim Tech Lead', ?, ?, 1, '', ?, ?)`).run(
      priorIntentId, createUuidV7(1_700_000_000_002), createUuidV7(1_700_000_000_003), itemId,
      createUuidV7(1_700_000_000_004), JSON.stringify({ decision_session_id: priorSessionId }), "8".repeat(64), "7".repeat(64),
      now, priorSessionId, now, now,
    );
  db.sqlite.prepare("UPDATE decisions SET decision_intent_id = ? WHERE item_id = ? AND gate = 'Gate 2 pending'").run(priorIntentId, itemId);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => new Response(String(input).includes("/steer/briefs/") ? briefText : String(input).includes("/steer/exams/") ? examText : implementationText, { status: 200 });
  context.after(() => { globalThis.fetch = originalFetch; });
  db.sqlite.prepare(`INSERT INTO decision_issuer_signers
    (pod_id, key_id, key_version, public_key, status, activated_by, activation_reason, created_at)
    VALUES ('steer-flight-team', 'readiness-test-key', 1, ?, 'ACTIVE', 'human-1', 'Exact test signer', ?)`)
    .run(decisionIssuerPublicKey(privateKey), now);
  const verification = await handleApi(new Request("https://steer.test/api/staging-verification-receipts", {
    method: "POST", headers: { authorization: `Bearer ${serviceToken}`, "content-type": "application/json" },
    body: JSON.stringify({ item_id: itemId, environment: "staging",
      brief_path: "steer/briefs/0974.md", brief_commit: "1".repeat(40), brief_sha256: briefSha256,
      exam_path: "steer/exams/0974.md", exam_commit: "2".repeat(40), exam_sha256: examSha256,
      source_revision: implementationCommit,
      build_sha256: "3".repeat(64), migration_set_sha256: "4".repeat(64), runtime_policy_sha256: "5".repeat(64),
      case_ledger_sha256: "7".repeat(64), candidate_builder_id: "agent-builder", intended_submitter_id: "human-1", completed_at: now }),
  }), { DB: db, DECISION_SERVICE_TOKEN: serviceToken, DECISION_SERVICE_PRIVATE_KEY: privateKey, DECISION_SERVICE_KEY_ID: "readiness-test-key", DECISION_SERVICE_KEY_VERSION: "1", STEER_DEPLOYMENT_ENV: "staging" });
  assert.equal(verification?.status, 201, await verification?.clone().text());
  const verificationIdentity = await verification?.json() as { receipt_id: string; receipt_sha256: string };
  const packet = {
    brief_path: "steer/briefs/0974.md", brief_commit: "1".repeat(40), brief_sha256: briefSha256,
    exam_path: "steer/exams/0974.md", exam_commit: "2".repeat(40), exam_sha256: examSha256,
    implementation_commit: implementationCommit, build_sha256: "3".repeat(64),
    migration_set_sha256: "4".repeat(64), runtime_policy_sha256: "5".repeat(64),
    verification_receipt_id: verificationIdentity.receipt_id, verification_receipt_sha256: verificationIdentity.receipt_sha256,
    declared_risk_codes: ["NONE"],
    operating_mode: "SOLO_CALIBRATION", satisfaction_path: "TIME",
  };
  const concurrentSnapshots = await Promise.all(Array.from({ length: 100 }, () => handleApi(humanRequest(`/api/items/${itemId}/release-readiness`, "POST", packet), humanEnv)));
  assert.equal(concurrentSnapshots.filter((response) => response?.status === 201).length, 1);
  assert.equal(concurrentSnapshots.filter((response) => response?.status === 200).length, 99);
  const created = concurrentSnapshots.find((response) => response?.status === 201)!;
  const body = await created?.json() as { status: string; snapshot_sha256: string; snapshot: { tier: string; effective_not_before: string } };
  assert.equal(body.status, "READY");
  assert.equal(body.snapshot.tier, "DEFAULT_OPEN");
  assert.equal(body.snapshot.effective_not_before, now);
  const replay = await handleApi(humanRequest(`/api/items/${itemId}/release-readiness`, "POST", packet), humanEnv);
  assert.equal(replay?.status, 200);
  assert.equal((await replay?.json() as { replay: boolean }).replay, true);
  assert.throws(() => db.sqlite.prepare("UPDATE decision_readiness_snapshots SET effective_not_before = '2000-01-01T00:00:00Z' WHERE item_id = ?").run(itemId), /snapshot authority is immutable/);
  const prepared = await handleApi(humanRequest(`/api/items/${itemId}/decision-packages`, "POST"), humanEnv);
  assert.equal(prepared?.status, 201, await prepared?.clone().text());
  const packageId = ((await prepared?.json()) as { package: { package_id: string } }).package.package_id;
  const session = await handleApi(humanRequest(`/api/items/${itemId}/decision-sessions`, "POST", { reason: "Fresh exact-candidate release decision session." }), humanEnv);
  assert.equal(session?.status, 201, await session?.clone().text());
  const sessionId = ((await session?.json()) as { session_id: string }).session_id;
  const intentRequest = {
    package_id: packageId, decision: "APPROVED", final_reasoning: "The exact verified candidate is ready for release.",
    decision_session_id: sessionId, idempotency_key: createUuidV7(),
  };
  const concurrentIntents = await Promise.all(Array.from({ length: 100 }, () => handleApi(humanRequest(`/api/items/${itemId}/decision-intents`, "POST", intentRequest), humanEnv)));
  assert.equal(concurrentIntents.filter((response) => response?.status === 201).length, 1);
  assert.equal(concurrentIntents.filter((response) => response?.status === 200).length, 99);
  const intentResponse = concurrentIntents.find((response) => response?.status === 201)!;
  const intent = (await intentResponse?.json()) as { intent: { intent_id: string; readiness_authority: Record<string, unknown> } };
  assert.equal(intent.intent.readiness_authority.snapshot_sha256, body.snapshot_sha256);
  const serviceEnv = { ...humanEnv, DECISION_SERVICE_TOKEN: serviceToken, DECISION_SERVICE_PRIVATE_KEY: privateKey,
    DECISION_SERVICE_KEY_ID: "readiness-test-key", DECISION_SERVICE_KEY_VERSION: "1" };
  const proofRequest = () => new Request(`https://steer.test/api/decision-intents/${intent.intent.intent_id}/issuer-proof`, { method: "POST", headers: { authorization: `Bearer ${serviceToken}` } });
  const concurrentProofs = await Promise.all(Array.from({ length: 100 }, () => handleApi(proofRequest(), serviceEnv)));
  assert.equal(concurrentProofs.filter((response) => response?.status === 201).length, 1);
  assert.equal(concurrentProofs.filter((response) => response?.status === 200).length, 99);
  const finalizeRequest = () => new Request(`https://steer.test/api/decision-intents/${intent.intent.intent_id}/finalize`, { method: "POST", headers: { authorization: `Bearer ${serviceToken}` } });
  const concurrentFinalizations = await Promise.all(Array.from({ length: 100 }, () => handleApi(finalizeRequest(), serviceEnv)));
  assert.equal(concurrentFinalizations.filter((response) => response?.status === 201).length, 1,
    await concurrentFinalizations[0]?.clone().text());
  assert.equal(concurrentFinalizations.filter((response) => response?.status === 200).length, 99);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS count FROM decisions WHERE decision_intent_id = ?").get(intent.intent.intent_id)?.count, 1);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS count FROM decision_readiness_snapshots WHERE item_id = ?").get(itemId)?.count, 1);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS count FROM decision_issuer_envelopes WHERE intent_id = ?").get(intent.intent.intent_id)?.count, 1);
  assert.throws(() => db.sqlite.prepare(`INSERT INTO decision_readiness_snapshots
    (snapshot_id, item_id, pod_id, snapshot_json, snapshot_sha256, evidence_set_sha256, critic_review_id,
     tier, satisfaction_path, effective_not_before, current_state, created_by, created_at)
    VALUES (?, ?, 'steer-flight-team', '{}', ?, ?, 1, 'DEFAULT_OPEN', 'TIME', ?, 'ACTIVE', 'human-1', ?)`)
    .run("f".repeat(64), itemId, "e".repeat(64), "d".repeat(64), now, now), /complete readiness authority manifest/);
  assert.throws(() => db.sqlite.prepare(`INSERT INTO decision_proof_events
    (intent_id, sequence, event_type, resulting_state, previous_event_sha256, event_json, event_sha256, actor_id, created_at)
    VALUES (?, 99, 'TAMPER', 'EFFECTIVE', ?, '{}', ?, 'tamper', ?)`)
    .run(intent.intent.intent_id, "1".repeat(64), "2".repeat(64), now), /proof event readiness authority mismatch/);
  const legacyCountBeforeRollback = db.sqlite.prepare("SELECT COUNT(*) AS count FROM decisions WHERE decision_intent_id IS NULL OR decision_intent_id IN (SELECT intent_id FROM decision_intents WHERE readiness_snapshot_sha256 = '')").get()?.count;
  const rollbackGuard = readFileSync(new URL("../drizzle/rollback/0023_release_readiness_code_rollback_guard.sql", import.meta.url), "utf8");
  db.sqlite.exec(rollbackGuard);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS count FROM decisions WHERE decision_intent_id IS NULL OR decision_intent_id IN (SELECT intent_id FROM decision_intents WHERE readiness_snapshot_sha256 = '')").get()?.count, legacyCountBeforeRollback);
  assert.equal(db.sqlite.prepare(`SELECT COUNT(*) AS count FROM decisions d JOIN decision_intents i ON i.intent_id = d.decision_intent_id
    WHERE i.readiness_snapshot_sha256 != '' AND i.current_state != 'EFFECTIVE'`).get()?.count, 0);
  db.sqlite.prepare("UPDATE work_items SET title = 'Changed candidate', updated_at = '2026-08-19T20:01:00.000Z' WHERE id = ?").run(itemId);
  const historical = await handleApi(humanRequest(`/api/items/${itemId}/release-readiness`), humanEnv);
  assert.equal(historical?.status, 200);
  assert.equal((await historical?.json() as { status: string; reason: string }).reason, "EFFECTIVE_HISTORY_IMMUTABLE");
});

test("synthetic hosted readiness evaluation is retired", async () => {
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
  const env = {
    DB: db, DECISION_SERVICE_TOKEN: serviceToken, DECISION_SERVICE_PRIVATE_KEY: privateKey,
    DECISION_SERVICE_KEY_ID: "hosted-readiness-key", DECISION_SERVICE_KEY_VERSION: "1", STEER_DEPLOYMENT_ENV: "staging",
    STEER_SOURCE_REVISION: "b".repeat(40), STEER_BUILD_SHA256: "c".repeat(64), STEER_MIGRATION_SET_SHA256: "d".repeat(64),
    STEER_RUNTIME_POLICY_SHA256: await releaseReadinessDigest(RELEASE_READINESS_POLICY_V1),
  };
  const retired = await handleApi(request(), env);
  assert.equal(retired?.status, 410);
  assert.match(await retired!.text(), /real snapshot, session, intent, proof, and finalization endpoints/);
});

test("staging fixture creates only signed real-lifecycle prerequisites and exposes raw projections", async (context) => {
  const db = new D1Database();
  await handleApi(humanRequest("/api/bootstrap"), { DB: db });
  const privateKey = "3".repeat(64);
  const serviceToken = "issue74-fixture-service-token-000000000000000";
  const targetText = "# Exact issue 74 fixture target\n";
  const targetSha256 = await sha256Hex(targetText);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(targetText, { status: 200 });
  context.after(() => { globalThis.fetch = originalFetch; });
  const serviceEnv = { DB: db, STEER_DEPLOYMENT_ENV: "staging", STEER_SOURCE_REVISION: "c".repeat(40),
    DECISION_SERVICE_TOKEN: serviceToken, DECISION_SERVICE_PRIVATE_KEY: privateKey, DECISION_SERVICE_KEY_ID: "fixture-decision", DECISION_SERVICE_KEY_VERSION: "1",
    REVIEW_SERVICE_PRIVATE_KEY: "4".repeat(64), REVIEW_SERVICE_KEY_ID: "fixture-review", REVIEW_SERVICE_KEY_VERSION: "1" };
  const fixture = await handleApi(new Request("https://steer.test/api/staging-release-readiness-fixtures", { method: "POST",
    headers: { authorization: `Bearer ${serviceToken}`, "content-type": "application/json" }, body: JSON.stringify({ action: "CREATE",
      run_id: "rr74-local-fixture", case_id: "RR74-LOCAL-FIXTURE", intended_submitter_id: "CURRENT_PRODUCT_LEAD", derived_risk_codes: ["NONE"],
      operating_mode: "SOLO_CALIBRATION", target_path: "steer/evidence/0074-real-lifecycle-case-contract.md", target_sha256: targetSha256,
      target_commit_object_sha256: "d".repeat(64) }) }), serviceEnv);
  assert.equal(fixture?.status, 201, await fixture?.clone().text());
  const fixtureBody = await fixture?.json() as { item_id: number; intended_submitter_id: string };
  const itemId = Number(fixtureBody.item_id);
  assert.equal(fixtureBody.intended_submitter_id, "human-1");
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS count FROM review_events e JOIN review_assignments a ON a.assignment_id=e.assignment_id WHERE a.item_id=?").get(itemId)?.count, 5);
  assert.equal(db.sqlite.prepare("SELECT current_state FROM review_assignments WHERE item_id=?").get(itemId)?.current_state, "RESULT_RECORDED");
  const humanReadiness = await handleApi(new Request("https://steer.test/api/staging-release-readiness-fixtures", { method: "POST",
    headers: { authorization: `Bearer ${serviceToken}`, "content-type": "application/json" }, body: JSON.stringify({ action: "HUMAN", item_id: itemId, operation: "READINESS" }) }), serviceEnv);
  assert.equal(humanReadiness?.status, 200, await humanReadiness?.clone().text());
  assert.equal((await humanReadiness?.json() as { status: string }).status, "NOT_READY");
  const projection = await handleApi(new Request("https://steer.test/api/staging-release-readiness-fixtures", { method: "POST",
    headers: { authorization: `Bearer ${serviceToken}`, "content-type": "application/json" }, body: JSON.stringify({ action: "PROJECT", item_id: itemId }) }), serviceEnv);
  assert.equal(projection?.status, 200, await projection?.clone().text());
  assert.match(String((await projection?.json() as { projection_sha256: string }).projection_sha256), /^[0-9a-f]{64}$/);
});
