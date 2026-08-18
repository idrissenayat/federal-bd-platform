import { canonicalJson, sha256Hex } from "./dispatch-lifecycle";

export type DecisionPackageState =
  | "PENDING_PROOF"
  | "PENDING_COUNTERSIGNATURE"
  | "PROOF_FAILED"
  | "COUNTERSIGNATURE_FAILED"
  | "EFFECTIVE"
  | "SUPERSEDED";

export type DecisionTarget = {
  repository_uri: string;
  commit: string;
  path: string;
  body_sha256: string;
};

export type PreparedDecisionPackage = {
  schema: "steer-decision-package/v1";
  package_id: string;
  item_key: string;
  decision_kind: string;
  target: DecisionTarget;
  recommendation: "APPROVED" | "CHANGES_REQUESTED" | "RATIFY" | "REVISE";
  summary: string;
  proposed_reasoning: string;
  evidence: Array<{ url: string; revision: string; sha256: string }>;
  risks: string[];
  missing: string[];
  required_role: string;
  consequence: string;
  preparation: {
    principal_id: string;
    model: string;
    config_version: string;
    evidence_set_sha256: string;
  };
  prepared_at: string;
};

export type DecisionIntentPayload = {
  schema: "steer-decision-intent/v1";
  intent_id: string;
  receipt_id: string;
  package_id: string;
  item_key: string;
  decision_kind: string;
  decision: string;
  final_reasoning: string;
  draft_sha256: string;
  evidence_set_sha256: string;
  target: DecisionTarget;
  submitter_principal: string;
  submitter_role: string;
  submitted_at: string;
  idempotency_key: string;
  sequence: number;
};

const HEX40 = /^[0-9a-f]{40}$/;
const HEX64 = /^[0-9a-f]{64}$/;
const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function createUuidV7(now = Date.now()) {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let timestamp = Math.max(0, Math.min(now, 281_474_976_710_655));
  for (let index = 5; index >= 0; index -= 1) {
    bytes[index] = timestamp % 256;
    timestamp = Math.floor(timestamp / 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function validateDecisionTarget(target: DecisionTarget) {
  if (target.repository_uri !== "https://github.com/idrissenayat/federal-bd-platform") return "The repository is outside the governed scope.";
  if (!HEX40.test(target.commit)) return "The target commit must be an exact lowercase Git SHA.";
  if (!target.path.startsWith("steer/") || target.path.includes("..")) return "The target path is outside the governed evidence tree.";
  if (!HEX64.test(target.body_sha256)) return "The target body digest must be a lowercase SHA-256.";
  return null;
}

export function validateDecisionIntent(input: DecisionIntentPayload) {
  if (!UUID_V7.test(input.intent_id) || !UUID_V7.test(input.receipt_id) || !UUID_V7.test(input.idempotency_key)) return "Decision identities must be UUIDv7.";
  if (input.sequence !== 1) return "A new decision intent must begin at sequence 1.";
  if (input.final_reasoning.trim().length < 12) return "Human reasoning must contain at least 12 characters.";
  if (!HEX64.test(input.draft_sha256) || !HEX64.test(input.evidence_set_sha256)) return "The advisory and evidence digests are invalid.";
  return validateDecisionTarget(input.target);
}

export function applyDecisionProofState(current: DecisionPackageState, event: "ISSUER_VERIFIED" | "ISSUER_FAILED" | "COUNTERSIGNATURE_VERIFIED" | "COUNTERSIGNATURE_FAILED" | "SUPERSEDE", required: number, accepted: number): DecisionPackageState {
  if (["EFFECTIVE", "SUPERSEDED"].includes(current)) throw new Error("The decision state is terminal.");
  if (event === "SUPERSEDE") return "SUPERSEDED";
  if (event === "ISSUER_FAILED") return "PROOF_FAILED";
  if (event === "COUNTERSIGNATURE_FAILED") return "COUNTERSIGNATURE_FAILED";
  if (event === "ISSUER_VERIFIED") return required === 0 ? "EFFECTIVE" : "PENDING_COUNTERSIGNATURE";
  if (current !== "PENDING_COUNTERSIGNATURE") throw new Error("A countersignature cannot precede issuer verification.");
  return accepted >= required ? "EFFECTIVE" : "PENDING_COUNTERSIGNATURE";
}

export async function decisionDigest(value: unknown) {
  return sha256Hex(canonicalJson(value));
}

export async function buildDecisionEvent(input: {
  intent_id: string;
  sequence: number;
  previous_event_sha256: string | null;
  event_type: string;
  resulting_state: DecisionPackageState;
  actor_id: string;
  occurred_at: string;
  payload: Record<string, unknown>;
}) {
  const event = { schema: "steer-decision-event/v1", ...input };
  return { event, event_sha256: await decisionDigest(event) };
}

export function safeDecisionExport(intent: DecisionIntentPayload, state: DecisionPackageState, eventSha256: string) {
  return {
    schema: "steer-gate-receipt-export/v1",
    intent,
    state,
    effective: state === "EFFECTIVE",
    latest_event_sha256: eventSha256,
    notice: state === "EFFECTIVE" ? "Verified effective human ruling." : "Pending record only. This receipt has no Gate or RAT effect.",
  };
}
