import assert from "node:assert/strict";
import test from "node:test";
import { buildDispatchIdentity, exactGitEvidence, validateDispatchRoute } from "../lib/dispatch-control";

const input = {
  podId: "pod-a", itemId: 28, itemKey: "STR-028", workflow: "STEER",
  agentMemberId: "agent-builder", agentKeyId: "builder-key", agentKeyVersion: 1,
  agentPublicKey: "e".repeat(64), agentPublicKeyFingerprint: "a".repeat(64), authorizationRevision: "2026-08-17T16:00:00.000Z",
  authorizationAuditEventId: "decision-28", evidenceUrl: `https://github.com/idrissenayat/federal-bd-platform/blob/${"b".repeat(40)}/steer/exams/0028.md`,
  evidenceRevision: "b".repeat(40), evidenceSha256: "c".repeat(64), forecastAuditEventId: "forecast-28",
  channelId: "10ac2fb4-f7fc-4dbc-bb73-8c545f31a470", routingConfigurationVersion: 1,
  relayUrl: "https://relay.example", membershipVersion: 1,
  nextAction: "Implement the exact approved Exam and stop before release.",
};

test("dispatch identity is deterministic and changes on an authorization binding", async () => {
  const first = await buildDispatchIdentity(input);
  const replay = await buildDispatchIdentity({ ...input });
  const changed = await buildDispatchIdentity({ ...input, evidenceSha256: "d".repeat(64) });
  assert.equal(first.intentId, replay.intentId);
  assert.equal(first.lineageId, replay.lineageId);
  assert.notEqual(first.intentId, changed.intentId);
  assert.equal(first.lineageId, changed.lineageId);
});

test("routing fails closed on missing configuration, POD mismatch, and missing membership", () => {
  assert.equal(validateDispatchRoute(null, "pod-a", "agent-builder").code, "ROUTE_CONFIG_MISSING");
  const route = { podId: "pod-a", configurationVersion: 1, channelId: "channel", channelName: "#steer-team", relayUrl: "https://relay.example", membershipVersion: 1, agentMemberId: "agent-builder", agentIsMember: true, channelKnown: true, channelNameMatches: true, relayBindingMatches: true, workspaceBindingMatches: true, competingSource: false };
  assert.equal(validateDispatchRoute(route, "pod-b", "agent-builder").code, "ROUTE_WORKSPACE_MISMATCH");
  assert.equal(validateDispatchRoute({ ...route, channelKnown: false }, "pod-a", "agent-builder").code, "ROUTE_CHANNEL_UNKNOWN");
  assert.equal(validateDispatchRoute({ ...route, channelNameMatches: false }, "pod-a", "agent-builder").code, "ROUTE_CHANNEL_IDENTITY_MISMATCH");
  assert.equal(validateDispatchRoute({ ...route, relayBindingMatches: false }, "pod-a", "agent-builder").code, "ROUTE_RELAY_WORKSPACE_MISMATCH");
  assert.equal(validateDispatchRoute({ ...route, agentIsMember: false }, "pod-a", "agent-builder").code, "ROUTE_AGENT_NOT_ENROLLED");
  assert.equal(validateDispatchRoute({ ...route, competingSource: true }, "pod-a", "agent-builder").code, "ROUTE_COMPETING_SOURCE");
  assert.equal(validateDispatchRoute(route, "pod-a", "agent-builder").ok, true);
});

test("only immutable GitHub blob evidence is accepted", () => {
  assert.equal(exactGitEvidence("https://github.com/idrissenayat/federal-bd-platform/issues/56"), null);
  assert.equal(exactGitEvidence("https://github.com/idrissenayat/federal-bd-platform/blob/main/README.md"), null);
  assert.equal(exactGitEvidence(input.evidenceUrl)?.revision, "b".repeat(40));
});
