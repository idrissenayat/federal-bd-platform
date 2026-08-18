import assert from "node:assert/strict";
import test from "node:test";
import { applyDecisionProofState, buildDecisionEvent, createDecisionIssuerEnvelope, createUuidV7, decisionDigest, decisionFinalizationError, decisionIssuerPublicKey, gateReceiptSignedBytes, safeDecisionExport, validateDecisionIntent, verifyDecisionIssuerEnvelope, type DecisionIntentPayload } from "../lib/decision-package";

function intent(): DecisionIntentPayload {
  return {
    schema: "steer-decision-intent/v1",
    intent_id: createUuidV7(1_700_000_000_000),
    receipt_id: createUuidV7(1_700_000_000_001),
    package_id: createUuidV7(1_700_000_000_002),
    item_key: "STR-024",
    decision_kind: "Gate 2",
    decision: "APPROVED",
    final_reasoning: "Exact evidence reviewed by the authenticated human.",
    draft_sha256: "a".repeat(64),
    evidence_set_sha256: "b".repeat(64),
    target: { repository_uri: "https://github.com/idrissenayat/federal-bd-platform", commit: "c".repeat(40), path: "steer/exams/0024-governed-agent-execution.md", body_sha256: "d".repeat(64) },
    submitter_principal: "human-1",
    submitter_role: "Interim Tech Lead",
    decision_session_id: createUuidV7(1_700_000_000_004),
    submitted_at: "2026-08-18T23:00:00Z",
    effective_not_before: "2026-08-19T23:00:00Z",
    operating_mode: "SOLO_CALIBRATION",
    signer_policy_version: 1,
    required_countersignatures: 0,
    idempotency_key: createUuidV7(1_700_000_000_003),
    sequence: 1,
  };
}

test("new decision intents are UUIDv7-bound and exact-target validated", () => {
  const payload = intent();
  assert.equal(validateDecisionIntent(payload), null);
  assert.match(payload.intent_id, /-7/);
  assert.match(validateDecisionIntent({ ...payload, target: { ...payload.target, commit: "main" } }) ?? "", /exact lowercase Git SHA/);
});

test("proof and countersignature events stay ineffective until explicit finalization", () => {
  assert.equal(applyDecisionProofState("PENDING_PROOF", "ISSUER_VERIFIED", 2, 0), "PENDING_COUNTERSIGNATURE");
  assert.equal(applyDecisionProofState("PENDING_COUNTERSIGNATURE", "COUNTERSIGNATURE_VERIFIED", 2, 1), "PENDING_COUNTERSIGNATURE");
  assert.equal(applyDecisionProofState("PENDING_COUNTERSIGNATURE", "COUNTERSIGNATURE_VERIFIED", 2, 2), "PENDING_COUNTERSIGNATURE");
  assert.equal(applyDecisionProofState("PENDING_PROOF", "ISSUER_VERIFIED", 0, 0), "PENDING_COUNTERSIGNATURE");
  assert.equal(applyDecisionProofState("PENDING_PROOF", "ISSUER_FAILED", 0, 0), "PROOF_FAILED");
});

test("solo finalization still requires issuer proof and the full cooling period", () => {
  assert.match(decisionFinalizationError({ state: "PENDING_PROOF", requiredCountersignatures: 0, acceptedCountersignatures: 0, effectiveNotBefore: "2026-08-19T23:00:00Z", now: "2026-08-20T00:00:00Z" }) ?? "", /not awaiting/);
  assert.match(decisionFinalizationError({ state: "PENDING_COUNTERSIGNATURE", requiredCountersignatures: 0, acceptedCountersignatures: 0, effectiveNotBefore: "2026-08-19T23:00:00Z", now: "2026-08-19T22:59:59Z" }) ?? "", /cooling period/);
  assert.equal(decisionFinalizationError({ state: "PENDING_COUNTERSIGNATURE", requiredCountersignatures: 0, acceptedCountersignatures: 0, effectiveNotBefore: "2026-08-19T23:00:00Z", now: "2026-08-19T23:00:00Z" }), null);
  assert.match(decisionFinalizationError({ state: "PENDING_COUNTERSIGNATURE", requiredCountersignatures: 2, acceptedCountersignatures: 1, effectiveNotBefore: "2026-08-19T23:00:00Z", now: "2026-08-20T00:00:00Z" }) ?? "", /incomplete/);
});

test("solo and team signer-count policies are validated independently", () => {
  const solo = intent();
  assert.equal(validateDecisionIntent(solo), null);
  assert.match(validateDecisionIntent({ ...solo, required_countersignatures: 1 }) ?? "", /zero additional/);
  assert.match(validateDecisionIntent({ ...solo, operating_mode: "TEAM", required_countersignatures: 1 }) ?? "", /at least two/);
  assert.match(validateDecisionIntent({ ...solo, effective_not_before: "2026-08-19T22:59:59Z" }) ?? "", /24 hours/);
});

test("pending exports cannot be mistaken for approval and events are chained", async () => {
  const payload = intent();
  const first = await buildDecisionEvent({ intent_id: payload.intent_id, sequence: 1, previous_event_sha256: null, event_type: "INTENT_RECORDED", resulting_state: "PENDING_PROOF", actor_id: payload.submitter_principal, occurred_at: payload.submitted_at, payload: { package_id: payload.package_id } });
  assert.equal(first.event_sha256, await decisionDigest(first.event));
  const exported = safeDecisionExport(payload, "PENDING_PROOF", first.event_sha256);
  assert.equal(exported.effective, false);
  assert.match(exported.notice, /no Gate or RAT effect/);
});

test("issuer proof signs exact domain-separated canonical receipt bytes", async () => {
  const privateKey = "1".repeat(64);
  const envelope = await createDecisionIssuerEnvelope({ intent: intent(), privateKeyHex: privateKey, keyId: "steer-decision-issuer", issuerPrincipal: "decision-proof-service", issuedAt: "2026-08-18T23:10:00Z" });
  assert.equal(await verifyDecisionIssuerEnvelope(envelope, decisionIssuerPublicKey(privateKey)), true);
  assert.equal(new TextDecoder().decode(gateReceiptSignedBytes(envelope.header, envelope.payload)).startsWith("STEER_GATE_RECEIPT_V1\0"), true);
  const transplanted = { ...envelope, payload: { ...envelope.payload, item_key: "STR-999" } };
  assert.equal(await verifyDecisionIssuerEnvelope(transplanted, decisionIssuerPublicKey(privateKey)), false);
});

test("issuer proof binds the digest and every authority-bearing intent field", async () => {
  const privateKey = "1".repeat(64);
  const original = intent();
  const changed = { ...original, draft_sha256: "f".repeat(64), evidence_set_sha256: "e".repeat(64), idempotency_key: createUuidV7(1_700_000_000_099) };
  const first = await createDecisionIssuerEnvelope({ intent: original, privateKeyHex: privateKey, keyId: "steer-decision-issuer", issuerPrincipal: "decision-proof-service", issuedAt: "2026-08-18T23:10:00Z" });
  const second = await createDecisionIssuerEnvelope({ intent: changed, privateKeyHex: privateKey, keyId: "steer-decision-issuer", issuerPrincipal: "decision-proof-service", issuedAt: "2026-08-18T23:10:00Z" });
  assert.equal(first.payload.intent_sha256, await decisionDigest(original));
  assert.equal(second.payload.intent_sha256, await decisionDigest(changed));
  assert.notEqual(first.payload.intent_sha256, second.payload.intent_sha256);
  assert.notEqual(first.signature, second.signature);
});
