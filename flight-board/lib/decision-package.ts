import { canonicalJson, sha256Hex } from "./dispatch-lifecycle";
import { ed25519 } from "@noble/curves/ed25519.js";

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
  decision_session_id: string;
  submitted_at: string;
  effective_not_before: string;
  operating_mode: "SOLO_CALIBRATION" | "TEAM";
  signer_policy_version: number;
  required_countersignatures: number;
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
  if (!UUID_V7.test(input.intent_id) || !UUID_V7.test(input.receipt_id) || !UUID_V7.test(input.idempotency_key) || !UUID_V7.test(input.decision_session_id)) return "Decision identities must be UUIDv7.";
  if (input.sequence !== 1) return "A new decision intent must begin at sequence 1.";
  if (!Number.isInteger(input.signer_policy_version) || input.signer_policy_version < 1) return "A positive signer policy version is required.";
  if (!["SOLO_CALIBRATION", "TEAM"].includes(input.operating_mode)) return "A recognized signer operating mode is required.";
  if (!Number.isInteger(input.required_countersignatures) || input.required_countersignatures < 0) return "The countersignature requirement is invalid.";
  if (input.operating_mode === "SOLO_CALIBRATION" && input.required_countersignatures !== 0) return "Solo calibration must require zero additional countersigners.";
  if (input.operating_mode === "TEAM" && input.required_countersignatures < 2) return "Team mode requires at least two distinct countersigners.";
  const submittedAt = Date.parse(input.submitted_at);
  const effectiveNotBefore = Date.parse(input.effective_not_before);
  if (!Number.isFinite(submittedAt) || !Number.isFinite(effectiveNotBefore) || effectiveNotBefore < submittedAt + 24 * 60 * 60 * 1000) return "Default-closed decisions require at least 24 hours of cooling.";
  if (input.final_reasoning.trim().length < 12) return "Human reasoning must contain at least 12 characters.";
  if (!HEX64.test(input.draft_sha256) || !HEX64.test(input.evidence_set_sha256)) return "The advisory and evidence digests are invalid.";
  return validateDecisionTarget(input.target);
}

export function applyDecisionProofState(current: DecisionPackageState, event: "ISSUER_VERIFIED" | "ISSUER_FAILED" | "COUNTERSIGNATURE_VERIFIED" | "COUNTERSIGNATURE_FAILED" | "SUPERSEDE", required: number, accepted: number): DecisionPackageState {
  void required;
  void accepted;
  if (["EFFECTIVE", "SUPERSEDED"].includes(current)) throw new Error("The decision state is terminal.");
  if (event === "SUPERSEDE") return "SUPERSEDED";
  if (event === "ISSUER_FAILED") return "PROOF_FAILED";
  if (event === "COUNTERSIGNATURE_FAILED") return "COUNTERSIGNATURE_FAILED";
  if (event === "ISSUER_VERIFIED") return "PENDING_COUNTERSIGNATURE";
  if (current !== "PENDING_COUNTERSIGNATURE") throw new Error("A countersignature cannot precede issuer verification.");
  return "PENDING_COUNTERSIGNATURE";
}

export function decisionFinalizationError(input: {
  state: DecisionPackageState;
  requiredCountersignatures: number;
  acceptedCountersignatures: number;
  effectiveNotBefore: string;
  now: string;
}) {
  if (input.state !== "PENDING_COUNTERSIGNATURE") return "The intent is not awaiting finalization.";
  if (input.acceptedCountersignatures < input.requiredCountersignatures) return "Required countersignatures are incomplete.";
  const effectiveNotBefore = Date.parse(input.effectiveNotBefore);
  const now = Date.parse(input.now);
  if (!Number.isFinite(effectiveNotBefore) || !Number.isFinite(now) || now < effectiveNotBefore) return "The 24-hour cooling period has not elapsed.";
  return null;
}

export async function decisionDigest(value: unknown) {
  return sha256Hex(canonicalJson(value));
}

function hexBytes(value: string) {
  if (!/^[0-9a-f]+$/.test(value) || value.length % 2 !== 0) throw new Error("Expected lowercase hexadecimal bytes.");
  return Uint8Array.from(value.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? []);
}

function bytesHex(value: Uint8Array) {
  return Array.from(value, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function u64be(value: number) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error("Canonical byte lengths must be non-negative safe integers.");
  const bytes = new Uint8Array(8);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, Math.floor(value / 4_294_967_296));
  view.setUint32(4, value >>> 0);
  return bytes;
}

function concatBytes(...parts: Uint8Array[]) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.length; }
  return result;
}

export function gateReceiptSignedBytes(header: Record<string, unknown>, payload: Record<string, unknown>) {
  const encoder = new TextEncoder();
  const domain = encoder.encode("STEER_GATE_RECEIPT_V1\0");
  const headerBytes = encoder.encode(canonicalJson(header));
  const payloadBytes = encoder.encode(canonicalJson(payload));
  return concatBytes(domain, u64be(headerBytes.length), headerBytes, u64be(payloadBytes.length), payloadBytes);
}

export function decisionIssuerPublicKey(privateKeyHex: string) {
  if (!/^[0-9a-f]{64}$/.test(privateKeyHex)) throw new Error("The decision issuer private key must be 32-byte lowercase hex.");
  return bytesHex(ed25519.getPublicKey(hexBytes(privateKeyHex)));
}

export async function createDecisionIssuerEnvelope(input: {
  intent: DecisionIntentPayload;
  privateKeyHex: string;
  keyId: string;
  issuerPrincipal: string;
  issuedAt: string;
}) {
  const intentSha256 = await decisionDigest(input.intent);
  const payload = {
    schema: "steer.gate-receipt.payload.v1", receipt_id: input.intent.receipt_id,
    intent_id: input.intent.intent_id, package_id: input.intent.package_id,
    intent_sha256: intentSha256, idempotency_key: input.intent.idempotency_key,
    item_key: input.intent.item_key, decision_kind: input.intent.decision_kind,
    decision: input.intent.decision, final_reasoning_sha256: await sha256Hex(input.intent.final_reasoning),
    draft_sha256: input.intent.draft_sha256, evidence_set_sha256: input.intent.evidence_set_sha256,
    target: input.intent.target, submitter_principal: input.intent.submitter_principal,
    submitter_role: input.intent.submitter_role, decision_session_id: input.intent.decision_session_id,
    submitted_at: input.intent.submitted_at,
    effective_not_before: input.intent.effective_not_before, operating_mode: input.intent.operating_mode,
    signer_policy_version: input.intent.signer_policy_version, required_countersignatures: input.intent.required_countersignatures,
    sequence: input.intent.sequence,
  };
  const payloadSha256 = await decisionDigest(payload);
  const header = {
    schema: "steer.gate-receipt.signature.v1", algorithm: "Ed25519",
    canonicalization: "RFC8785-JCS", media_type: "application/steer.gate-receipt+json;profile=v1",
    payload_sha256: payloadSha256, issuer_principal: input.issuerPrincipal,
    issuer_key_id: input.keyId, purpose: "issuer-attestation", audience: "STEER Work Management",
    issued_at: input.issuedAt,
  };
  const signedBytes = gateReceiptSignedBytes(header, payload);
  const signature = bytesHex(ed25519.sign(signedBytes, hexBytes(input.privateKeyHex)));
  return { schema: "steer.gate-receipt.envelope.v1", header, payload, signature };
}

export async function verifyDecisionIssuerEnvelope(envelope: Awaited<ReturnType<typeof createDecisionIssuerEnvelope>>, publicKeyHex: string) {
  if (!/^[0-9a-f]{64}$/.test(publicKeyHex) || !/^[0-9a-f]{128}$/.test(envelope.signature)) return false;
  if (envelope.header.payload_sha256 !== await decisionDigest(envelope.payload)) return false;
  return ed25519.verify(hexBytes(envelope.signature), gateReceiptSignedBytes(envelope.header, envelope.payload), hexBytes(publicKeyHex));
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
