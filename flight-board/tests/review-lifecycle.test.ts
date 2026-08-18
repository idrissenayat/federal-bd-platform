import assert from "node:assert/strict";
import test from "node:test";
import { schnorr } from "@noble/curves/secp256k1.js";
import { canonicalJson, sha256Hex } from "../lib/dispatch-lifecycle";
import { buildReviewIdentity, createSignedReviewEvent, reviewManifestSha256, validateReviewAssignmentPayload, verifyReviewerBinding, type ReviewAssignmentPayload } from "../lib/review-lifecycle";

const oid = "0f83de8248771d35292ee57b56186493b5b71b1a";
const paths = [
  "steer/TEAM-COMMUNICATION.md",
  "steer/agents/agent-roles.md",
  "steer/briefs/0028-stale-post-write-feedback.md",
  "steer/operating-system/DECISION-LOG.md",
  "steer/reviews/0028-scout-second-rework-evidence.md",
];

async function assignment(): Promise<ReviewAssignmentPayload> {
  const targetBase = {
    target_git_object_format: "sha1" as const,
    target_git_commit_oid: oid,
    target_artifacts: paths.map((path, index) => ({
      path,
      url: `https://github.com/idrissenayat/federal-bd-platform/blob/${oid}/${path}`,
      size_bytes: 100 + index,
      sha256: String(index + 1).padStart(64, "0"),
    })),
  };
  return {
    schema: "steer-review-assignment/v1",
    work_item_stable_id: 28,
    work_item_key: "STR-028",
    workspace_pod_id: "steer-flight-team",
    workflow: "STEER",
    primary_claim_lineage_id: "str-028-scout-root-claim",
    primary_owner_role: "Discovery Agent",
    primary_owner_member_id: "agent-scout",
    review_stage: "PRE_GATE_1_BRIEF",
    target: {
      ...targetBase,
      target_commit_object_sha256: "a".repeat(64),
      target_artifact_manifest_sha256: await reviewManifestSha256(targetBase),
    },
    prior_binding_digests: ["b".repeat(64)],
    reviewer_role: "Independent Critic",
    reviewer_member_id: "agent-critic",
    output_contract: ["Severity-sorted advisory findings capped at three."],
    prohibitions: ["No human gate ruling.", "No primary claim."],
    authorizing_actor_id: "member-tech",
    authorizing_event_id: "c".repeat(64),
    item_revision: "2026-08-18T14:00:00.000Z",
  };
}

test("review assignment identity uses the exact canonical target and replays deterministically", async () => {
  const payload = await assignment();
  const first = await buildReviewIdentity(payload);
  const replay = await buildReviewIdentity(structuredClone(payload));
  assert.deepEqual(replay, first);
  const changed = structuredClone(payload);
  changed.target.target_artifacts[0].sha256 = "d".repeat(64);
  changed.target.target_artifact_manifest_sha256 = await reviewManifestSha256(changed.target);
  assert.notEqual((await buildReviewIdentity(changed)).reviewAssignmentId, first.reviewAssignmentId);
});

test("review assignment rejects moving URLs, unsorted artifacts, and manifest mismatches", async () => {
  const moving = await assignment();
  moving.target.target_artifacts[0].url = moving.target.target_artifacts[0].url.replace(oid, "main");
  await assert.rejects(validateReviewAssignmentPayload(moving), /REVIEW_TARGET_URL_INVALID/);
  const unsorted = await assignment();
  unsorted.target.target_artifacts.reverse();
  unsorted.target.target_artifact_manifest_sha256 = await reviewManifestSha256(unsorted.target);
  await assert.rejects(validateReviewAssignmentPayload(unsorted), /REVIEW_TARGET_ARTIFACT_ORDER_INVALID/);
  const mismatch = await assignment();
  mismatch.target.target_artifact_manifest_sha256 = "e".repeat(64);
  await assert.rejects(validateReviewAssignmentPayload(mismatch), /REVIEW_TARGET_MANIFEST_MISMATCH/);
});

test("review events are append-only hash chained and reviewer bindings use the enrolled key", async () => {
  const payload = await assignment();
  const { reviewAssignmentId } = await buildReviewIdentity(payload);
  const serviceSecret = "0".repeat(63) + "7";
  const ready = await createSignedReviewEvent({ assignmentId: reviewAssignmentId, eventVersion: 0, previousEventSha256: null, eventType: "REVIEW_TARGET_READY", occurredAt: "2026-08-18T14:00:00.000Z", targetManifestSha256: payload.target.target_artifact_manifest_sha256, actorId: "member-tech", serviceKeyId: "review-service", serviceKeyVersion: 1, servicePrivateKey: serviceSecret });
  const requested = await createSignedReviewEvent({ assignmentId: reviewAssignmentId, eventVersion: 1, previousEventSha256: ready.eventSha256, eventType: "REVIEW_REQUESTED", occurredAt: "2026-08-18T14:01:00.000Z", targetManifestSha256: payload.target.target_artifact_manifest_sha256, actorId: "review-service", serviceKeyId: "review-service", serviceKeyVersion: 1, servicePrivateKey: serviceSecret });
  assert.equal(requested.payload.expected_event_version, 0);
  assert.equal(requested.payload.previous_event_sha256, ready.eventSha256);
  assert.notEqual(requested.eventSha256, ready.eventSha256);

  const reviewerSecret = new Uint8Array(32); reviewerSecret[31] = 11;
  const publicKey = Array.from(schnorr.getPublicKey(reviewerSecret), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const acknowledgement = { schema: "steer-review-acknowledgement/v1", review_assignment_id: reviewAssignmentId, target_artifact_manifest_sha256: payload.target.target_artifact_manifest_sha256, source_request_event_sha256: requested.eventSha256, predecessor_event_sha256: requested.eventSha256, acknowledged_at: "2026-08-18T14:02:00.000Z" };
  const digest = await sha256Hex(canonicalJson(acknowledgement));
  const signature = Array.from(schnorr.sign(Uint8Array.from(digest.match(/.{2}/g)!.map((part) => Number.parseInt(part, 16))), reviewerSecret), (byte) => byte.toString(16).padStart(2, "0")).join("");
  assert.equal(await verifyReviewerBinding(acknowledgement, signature, publicKey), true);
  assert.equal(await verifyReviewerBinding({ ...acknowledgement, predecessor_event_sha256: ready.eventSha256 }, signature, publicKey), false);
});
