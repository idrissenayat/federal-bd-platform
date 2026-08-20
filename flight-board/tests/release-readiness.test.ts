import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  classifyRiskCodes,
  effectiveNotBefore,
  parseRiskCodes,
  readinessStatus,
  RELEASE_READINESS_POLICY_V1,
  releaseReadinessDigest,
  requiredRolesFor,
  validateSatisfactionPath,
  type ReleaseReadinessSnapshot,
} from "../lib/release-readiness";

const baseSnapshot: ReleaseReadinessSnapshot = {
  schema: "steer.gate-readiness-snapshot/v1",
  snapshot_id: "snapshot-1",
  work_item_id: 74,
  work_item_key: "STR-074",
  work_item_updated_at: "2026-08-19T20:00:00.000Z",
  pod_id: "pod-a",
  brief_path: "steer/briefs/0074-risk-based-gate3-readiness.md",
  brief_commit: "a".repeat(40), brief_sha256: "a".repeat(64),
  exam_path: "steer/exams/0074-risk-based-gate3-readiness.md",
  exam_commit: "b".repeat(40), exam_sha256: "b".repeat(64),
  implementation_commit: "c".repeat(40), build_sha256: "c".repeat(64),
  migration_set_sha256: "d".repeat(64), runtime_policy_sha256: "e".repeat(64),
  verification_receipt_id: "verify-1", verification_receipt_sha256: "f".repeat(64),
  verification_completed_at: "2026-08-19T20:00:00.000Z",
  critic_assignment_id: "7".repeat(64), critic_review_id: 7, critic_target_revision: "c".repeat(40), critic_recommendation: "APPROVED",
  evidence_set_sha256: "9".repeat(64),
  declared_risk_codes: ["NONE"], derived_risk_codes: ["NONE"], resolved_risk_codes: ["NONE"],
  classification_errors: [], tier: "DEFAULT_OPEN", risk_policy_version: 1, risk_policy_sha256: "8".repeat(64),
  operating_mode: "SOLO_CALIBRATION", satisfaction_path: "TIME", delay_hours: 0,
  required_roles: [], candidate_builder_id: "agent-builder", intended_submitter_id: "human-a",
  effective_not_before: "2026-08-19T20:00:00.000Z",
  created_by: "human-a", created_at: "2026-08-19T20:01:00.000Z", predecessor_snapshot_sha256: null,
};

test("risk classification is canonical and fail-closed", () => {
  assert.deepEqual(classifyRiskCodes(["NONE"], ["NONE"]), { tier: "DEFAULT_OPEN", codes: ["NONE"], errors: [], delay_hours: 0 });
  assert.equal(classifyRiskCodes(["EXTERNAL_PROVIDER"], ["EXTERNAL_PROVIDER"]).tier, "ELEVATED");
  assert.equal(classifyRiskCodes(["GOVERNANCE_CONTROL"], ["GOVERNANCE_CONTROL"]).tier, "DEFAULT_CLOSED");
  const mismatch = classifyRiskCodes(["NONE"], ["ACCESSIBILITY_UI"]);
  assert.equal(mismatch.tier, "DEFAULT_CLOSED");
  assert.deepEqual(mismatch.errors, ["DECLARED_DERIVED_RISK_MISMATCH"]);
  assert.deepEqual(parseRiskCodes(["UNKNOWN"]), { codes: [], errors: ["RISK_CODE_UNKNOWN"] });
  assert.deepEqual(parseRiskCodes([]), { codes: [], errors: ["RISK_CODES_MISSING_OR_MALFORMED"] });
  assert.deepEqual(parseRiskCodes(["NONE", "EXTERNAL_PROVIDER"]), { codes: [], errors: ["RISK_CODE_NONE_CONFLICT"] });
});

test("paths are constrained by tier and operating mode", () => {
  const open = classifyRiskCodes(["NONE"], ["NONE"]);
  const elevated = classifyRiskCodes(["EXTERNAL_PROVIDER"], ["EXTERNAL_PROVIDER"]);
  const closed = classifyRiskCodes(["GOVERNANCE_CONTROL"], ["GOVERNANCE_CONTROL"]);
  assert.equal(validateSatisfactionPath(open, "SOLO_CALIBRATION", "TIME"), null);
  assert.equal(validateSatisfactionPath(open, "SOLO_CALIBRATION", "QUALIFIED_HUMAN"), "DEFAULT_OPEN_REQUIRES_TIME_PATH");
  assert.equal(validateSatisfactionPath(elevated, "SOLO_CALIBRATION", "QUALIFIED_HUMAN"), null);
  assert.equal(validateSatisfactionPath(closed, "SOLO_CALIBRATION", "QUALIFIED_TEAM"), "DEFAULT_CLOSED_SOLO_REQUIRES_TIME_PATH");
  assert.equal(validateSatisfactionPath(closed, "TEAM", "QUALIFIED_TEAM"), null);
});

test("authoritative time boundaries are exact and do not auto-ripen an intent", () => {
  const elevated = { ...baseSnapshot, tier: "ELEVATED" as const, delay_hours: 4 as const, effective_not_before: effectiveNotBefore(baseSnapshot.verification_completed_at, 4) };
  const before = readinessStatus({ snapshot: elevated, now: "2026-08-19T23:59:59.999Z", currentCandidateSha256: elevated.evidence_set_sha256, currentCriticReviewId: 7, signatures: [] });
  const at = readinessStatus({ snapshot: elevated, now: "2026-08-20T00:00:00.000Z", currentCandidateSha256: elevated.evidence_set_sha256, currentCriticReviewId: 7, signatures: [] });
  assert.equal(before.status, "NOT_READY");
  assert.equal(at.status, "READY");
});

test("candidate or Critic drift invalidates the snapshot", () => {
  assert.equal(readinessStatus({ snapshot: baseSnapshot, now: baseSnapshot.created_at, currentCandidateSha256: "8".repeat(64), currentCriticReviewId: 7, signatures: [] }).status, "INVALIDATED");
  assert.equal(readinessStatus({ snapshot: baseSnapshot, now: baseSnapshot.created_at, currentCandidateSha256: baseSnapshot.evidence_set_sha256, currentCriticReviewId: 8, signatures: [] }).status, "INVALIDATED");
});

test("qualified human and team paths require roles and distinct humans", () => {
  const elevated = { ...baseSnapshot, tier: "ELEVATED" as const, satisfaction_path: "QUALIFIED_HUMAN" as const, required_roles: ["Security Owner"] };
  assert.equal(readinessStatus({ snapshot: elevated, now: elevated.created_at, currentCandidateSha256: elevated.evidence_set_sha256, currentCriticReviewId: 7, signatures: [] }).status, "NOT_READY");
  assert.equal(readinessStatus({ snapshot: elevated, now: elevated.created_at, currentCandidateSha256: elevated.evidence_set_sha256, currentCriticReviewId: 7, signatures: [{ member_id: "security-a", role: "Security Owner", status: "ACCEPTED" }] }).status, "READY");
  const team = { ...baseSnapshot, tier: "DEFAULT_CLOSED" as const, operating_mode: "TEAM" as const, satisfaction_path: "QUALIFIED_TEAM" as const, required_roles: ["Product Lead", "Tech Lead"] };
  assert.equal(readinessStatus({ snapshot: team, now: team.created_at, currentCandidateSha256: team.evidence_set_sha256, currentCriticReviewId: 7, signatures: [{ member_id: "human-a", role: "Product Lead", status: "ACCEPTED" }, { member_id: "human-a", role: "Tech Lead", status: "ACCEPTED" }] }).status, "NOT_READY");
  assert.equal(readinessStatus({ snapshot: team, now: team.created_at, currentCandidateSha256: team.evidence_set_sha256, currentCriticReviewId: 7, signatures: [{ member_id: "human-a", role: "Product Lead", status: "ACCEPTED" }, { member_id: "human-b", role: "Tech Lead", status: "ACCEPTED" }] }).status, "READY");
});

test("canonical digests and role derivation are stable", async () => {
  assert.equal(await releaseReadinessDigest({ b: 2, a: 1 }), await releaseReadinessDigest({ a: 1, b: 2 }));
  assert.deepEqual(requiredRolesFor(["AUTHN_AUTHZ_SESSION", "PERSONAL_DATA_NEW_USE"], "DEFAULT_CLOSED"), ["Privacy Owner", "Product Lead", "Security Owner", "Tech Lead"]);
  assert.deepEqual(requiredRolesFor(["ACCESSIBILITY_UI"], "ELEVATED"), ["Product Designer"]);
  assert.deepEqual(requiredRolesFor(["EXTERNAL_PROVIDER", "NONDESTRUCTIVE_PERSISTENCE"], "ELEVATED"), ["Platform / Ops Lead", "Security Owner"]);
  const fixture = JSON.parse(await readFile(new URL("../../steer/policies/release-readiness-v1.json", import.meta.url), "utf8"));
  assert.equal(await releaseReadinessDigest(fixture), await releaseReadinessDigest(RELEASE_READINESS_POLICY_V1));
});
