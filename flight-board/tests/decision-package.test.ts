import assert from "node:assert/strict";
import test from "node:test";
import { applyDecisionProofState, buildDecisionEvent, createUuidV7, decisionDigest, safeDecisionExport, validateDecisionIntent, type DecisionIntentPayload } from "../lib/decision-package";

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
    submitted_at: "2026-08-18T23:00:00Z",
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

test("proof and countersignature states stay ineffective until every proof exists", () => {
  assert.equal(applyDecisionProofState("PENDING_PROOF", "ISSUER_VERIFIED", 2, 0), "PENDING_COUNTERSIGNATURE");
  assert.equal(applyDecisionProofState("PENDING_COUNTERSIGNATURE", "COUNTERSIGNATURE_VERIFIED", 2, 1), "PENDING_COUNTERSIGNATURE");
  assert.equal(applyDecisionProofState("PENDING_COUNTERSIGNATURE", "COUNTERSIGNATURE_VERIFIED", 2, 2), "EFFECTIVE");
  assert.equal(applyDecisionProofState("PENDING_PROOF", "ISSUER_FAILED", 0, 0), "PROOF_FAILED");
});

test("pending exports cannot be mistaken for approval and events are chained", async () => {
  const payload = intent();
  const first = await buildDecisionEvent({ intent_id: payload.intent_id, sequence: 1, previous_event_sha256: null, event_type: "INTENT_RECORDED", resulting_state: "PENDING_PROOF", actor_id: payload.submitter_principal, occurred_at: payload.submitted_at, payload: { package_id: payload.package_id } });
  assert.equal(first.event_sha256, await decisionDigest(first.event));
  const exported = safeDecisionExport(payload, "PENDING_PROOF", first.event_sha256);
  assert.equal(exported.effective, false);
  assert.match(exported.notice, /no Gate or RAT effect/);
});
