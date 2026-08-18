import { canonicalJson, sha256Hex, signSchnorrBinding, verifySchnorrBinding } from "./dispatch-lifecycle";

export const REVIEW_STAGES = ["PRE_GATE_1_BRIEF", "GATE_2_EXAM", "GATE_3_BUILD"] as const;
export type ReviewStage = typeof REVIEW_STAGES[number];

export type ReviewArtifact = { path: string; url: string; size_bytes: number; sha256: string };
export type ReviewTarget = {
  target_git_object_format: "sha1" | "sha256";
  target_git_commit_oid: string;
  target_commit_object_sha256: string;
  target_artifacts: ReviewArtifact[];
  target_artifact_manifest_sha256: string;
};

export type TargetVerificationReceipt = {
  schema: "steer-target-verification/v1";
  target: ReviewTarget;
  verified_at: string;
  verification_method: "git-cat-file-and-sha256-bytes";
  verifier_member_id: string;
  verifier_key_id: string;
  verifier_key_version: number;
};

export type TargetVerificationEnvelope = {
  receipt: TargetVerificationReceipt;
  signature: string;
};

export type ReviewAssignmentPayload = {
  schema: "steer-review-assignment/v1";
  work_item_stable_id: number;
  work_item_key: string;
  workspace_pod_id: string;
  workflow: string;
  primary_claim_lineage_id: string;
  primary_owner_role: string;
  primary_owner_member_id: string;
  review_stage: ReviewStage;
  target: ReviewTarget;
  target_verification: TargetVerificationEnvelope;
  prior_binding_digests: string[];
  reviewer_role: "Independent Critic";
  reviewer_member_id: string;
  output_contract: string[];
  prohibitions: string[];
  authorizing_actor_id: string;
  authorizing_event_id: string;
  item_revision: string;
};

const hex64 = /^[0-9a-f]{64}$/;
const gitSha1 = /^[0-9a-f]{40}$/;
const safeToken = /^[A-Za-z0-9][A-Za-z0-9._:/-]{2,255}$/;

export async function reviewManifestSha256(target: Omit<ReviewTarget, "target_artifact_manifest_sha256">) {
  return sha256Hex(canonicalJson({
    schema: "steer-review-artifact-manifest/v1",
    target_git_object_format: target.target_git_object_format,
    target_git_commit_oid: target.target_git_commit_oid,
    target_commit_object_sha256: target.target_commit_object_sha256,
    artifacts: target.target_artifacts,
  }));
}

export async function validateReviewAssignmentPayload(payload: ReviewAssignmentPayload) {
  if (payload.schema !== "steer-review-assignment/v1") throw new Error("REVIEW_ASSIGNMENT_SCHEMA_INVALID");
  if (!Number.isSafeInteger(payload.work_item_stable_id) || payload.work_item_stable_id < 1) throw new Error("REVIEW_ITEM_INVALID");
  if (!safeToken.test(payload.work_item_key) || !safeToken.test(payload.workspace_pod_id) || !safeToken.test(payload.primary_claim_lineage_id)) throw new Error("REVIEW_PRIMARY_BINDING_INVALID");
  if (!REVIEW_STAGES.includes(payload.review_stage)) throw new Error("REVIEW_STAGE_INVALID");
  if (payload.reviewer_role !== "Independent Critic" || !safeToken.test(payload.reviewer_member_id)) throw new Error("REVIEWER_INVALID");
  if (!safeToken.test(payload.authorizing_actor_id) || !hex64.test(payload.authorizing_event_id)) throw new Error("REVIEW_AUTHORIZER_INVALID");
  if (!payload.item_revision || payload.item_revision.length > 100) throw new Error("REVIEW_ITEM_REVISION_INVALID");
  if (!payload.primary_owner_role || !safeToken.test(payload.primary_owner_member_id) || !payload.workflow) throw new Error("REVIEW_PRIMARY_BINDING_INVALID");
  if (!Array.isArray(payload.prior_binding_digests) || payload.prior_binding_digests.some((digest) => !hex64.test(digest))) throw new Error("REVIEW_PRIOR_BINDING_INVALID");
  if (!payload.output_contract.length || payload.output_contract.length > 12 || payload.output_contract.some((entry) => !entry || entry.length > 500)) throw new Error("REVIEW_OUTPUT_CONTRACT_INVALID");
  if (!payload.prohibitions.length || payload.prohibitions.length > 12 || payload.prohibitions.some((entry) => !entry || entry.length > 500)) throw new Error("REVIEW_PROHIBITIONS_INVALID");
  const target = payload.target;
  const expectedOid = target.target_git_object_format === "sha1" ? gitSha1 : hex64;
  if (!expectedOid.test(target.target_git_commit_oid) || !hex64.test(target.target_commit_object_sha256)) throw new Error("REVIEW_TARGET_COMMIT_INVALID");
  if (!target.target_artifacts.length || target.target_artifacts.length > 20) throw new Error("REVIEW_TARGET_ARTIFACTS_INVALID");
  const paths = target.target_artifacts.map((artifact) => artifact.path);
  if (paths.some((path, index) => !path || path !== [...paths].sort()[index])) throw new Error("REVIEW_TARGET_ARTIFACT_ORDER_INVALID");
  if (new Set(paths).size !== paths.length) throw new Error("REVIEW_TARGET_ARTIFACT_DUPLICATE");
  for (const artifact of target.target_artifacts) {
    if (!Number.isSafeInteger(artifact.size_bytes) || artifact.size_bytes < 0 || !hex64.test(artifact.sha256)) throw new Error("REVIEW_TARGET_ARTIFACT_INVALID");
    let url: URL;
    try { url = new URL(artifact.url); } catch { throw new Error("REVIEW_TARGET_URL_INVALID"); }
    const parts = url.pathname.split("/").filter(Boolean);
    if (url.protocol !== "https:" || url.hostname !== "github.com" || parts[0] !== "idrissenayat" || parts[1] !== "federal-bd-platform" || parts[2] !== "blob" || parts[3] !== target.target_git_commit_oid || parts.slice(4).join("/") !== artifact.path) throw new Error("REVIEW_TARGET_URL_INVALID");
  }
  const manifest = await reviewManifestSha256(target);
  if (manifest !== target.target_artifact_manifest_sha256) throw new Error("REVIEW_TARGET_MANIFEST_MISMATCH");
  const verification = payload.target_verification;
  if (!verification || verification.receipt?.schema !== "steer-target-verification/v1" || !/^[0-9a-f]{128}$/.test(verification.signature ?? "")) throw new Error("REVIEW_TARGET_VERIFICATION_INVALID");
  const receipt = verification.receipt;
  if (canonicalJson(receipt.target) !== canonicalJson(target)) throw new Error("REVIEW_TARGET_VERIFICATION_MISMATCH");
  if (receipt.verification_method !== "git-cat-file-and-sha256-bytes" || !Number.isFinite(Date.parse(receipt.verified_at))) throw new Error("REVIEW_TARGET_VERIFICATION_INVALID");
  if (!safeToken.test(receipt.verifier_member_id) || !safeToken.test(receipt.verifier_key_id) || !Number.isSafeInteger(receipt.verifier_key_version) || receipt.verifier_key_version < 1) throw new Error("REVIEW_TARGET_VERIFIER_INVALID");
}

export async function buildReviewIdentity(payload: ReviewAssignmentPayload) {
  await validateReviewAssignmentPayload(payload);
  const reviewAssignmentId = await sha256Hex(canonicalJson(payload));
  const reviewIdempotencyKey = await sha256Hex(canonicalJson({ schema: "steer-review-idempotency/v1", review_assignment_id: reviewAssignmentId }));
  return { reviewAssignmentId, reviewIdempotencyKey };
}

export async function createSignedReviewEvent(input: {
  assignmentId: string;
  eventVersion: number;
  previousEventSha256: string | null;
  eventType: "REVIEW_TARGET_READY" | "REVIEW_ASSIGNED" | "REVIEW_REQUESTED" | "REVIEW_ACKNOWLEDGED" | "REVIEW_RESULT_RECORDED" | "REVIEW_SUPERSEDED";
  occurredAt: string;
  targetManifestSha256: string;
  actorId: string;
  typedPayload?: Record<string, unknown>;
  serviceKeyId: string;
  serviceKeyVersion: number;
  servicePrivateKey: string;
  reviewerKeyId?: string;
  reviewerKeyVersion?: number;
  reviewerSignature?: string;
}) {
  const payload = {
    schema: "steer-review-event/v1",
    review_assignment_id: input.assignmentId,
    event_version: input.eventVersion,
    expected_event_version: input.eventVersion - 1,
    previous_event_sha256: input.previousEventSha256,
    event_type: input.eventType,
    occurred_at: input.occurredAt,
    target_artifact_manifest_sha256: input.targetManifestSha256,
    actor_id: input.actorId,
    typed_payload_sha256: await sha256Hex(canonicalJson(input.typedPayload ?? {})),
    payload: input.typedPayload ?? {},
  };
  const signed = await signSchnorrBinding(payload, input.servicePrivateKey);
  const envelope = {
    payload,
    service_key_id: input.serviceKeyId,
    service_key_version: input.serviceKeyVersion,
    service_signature: signed.signature,
    ...(input.reviewerKeyId ? { reviewer_key_id: input.reviewerKeyId } : {}),
    ...(input.reviewerKeyVersion ? { reviewer_key_version: input.reviewerKeyVersion } : {}),
    ...(input.reviewerSignature ? { reviewer_signature: input.reviewerSignature } : {}),
  };
  return { payload, envelope, eventSha256: await sha256Hex(canonicalJson(envelope)) };
}

export async function verifyReviewerBinding(payload: unknown, signature: string, publicKey: string) {
  return verifySchnorrBinding(payload, signature, publicKey);
}
