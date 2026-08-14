import assert from "node:assert/strict";
import test from "node:test";
import { evaluateAgentDispatch } from "../worker/authorization";

const readyItem = {
  key: "STR-014",
  title: "Build the STEER work-management app",
  workflow: "Setup / excluded",
  state: "active",
  gate: "No gate (setup)",
  decision_status: "Not required",
  assignee_id: "agent-builder",
  assignee_name: "Builder",
  assignee_kind: "agent",
  next_action: "Implement the authorized work-control contract and verify the build.",
  evidence_url: "https://github.com/example/repository/pull/15",
  github_url: "https://github.com/example/repository/issues/14",
  delivery_owner_id: "human-tech-lead",
};

const acceptedForecast = JSON.stringify({
  earliestCompletion: "2026-08-15T14:00:00.000Z",
  likelyCompletion: "2026-08-15T18:00:00.000Z",
  latestCompletion: "2026-08-16T18:00:00.000Z",
  nextMilestone: "Builder evidence attached",
  nextMilestoneAt: "2026-08-15T16:00:00.000Z",
  phaseExit: "Move to Evaluate",
  phaseExitAt: "2026-08-15T18:00:00.000Z",
  basis: "Approved Exam and Builder plan",
  confidence: "medium",
  acceptedBy: "human-tech-lead",
  deliveryOwnerId: "human-tech-lead",
  acceptedAt: "2026-08-14T14:00:00.000Z",
});

test("authorizes an active, evidence-backed agent handoff", () => {
  const result = evaluateAgentDispatch(readyItem);
  assert.equal(result.authorized, true);
  assert.match(result.handoff_message ?? "", /\[STR-014\].*Authorized Flight Board handoff/);
});

test("blocks a Buzz-style mention without a Flight Board assignment", () => {
  const result = evaluateAgentDispatch({ ...readyItem, assignee_id: null, assignee_name: null, assignee_kind: null });
  assert.equal(result.authorized, false);
  assert.ok(result.missing.includes("Agent explicitly assigned"));
  assert.equal(result.handoff_message, null);
});

test("blocks execution while a human gate is pending", () => {
  const result = evaluateAgentDispatch({ ...readyItem, gate: "Gate 2 pending", decision_status: "Needed now" });
  assert.equal(result.authorized, false);
  assert.ok(result.missing.includes("Human holds are clear"));
});

test("allows evidence preparation while the next gate is waiting", () => {
  const result = evaluateAgentDispatch({ ...readyItem, gate: "Gate 2 pending", decision_status: "Waiting" });
  assert.equal(result.authorized, true);
  assert.ok(!result.missing.includes("Human holds are clear"));
});

test("blocks queued work even when every other field is complete", () => {
  const result = evaluateAgentDispatch({ ...readyItem, state: "queued" });
  assert.equal(result.authorized, false);
  assert.ok(result.missing.includes("Execution state is active"));
});

test("blocks a STEER handoff until the delivery owner accepts a forecast", () => {
  const result = evaluateAgentDispatch({ ...readyItem, workflow: "STEER" });
  assert.equal(result.authorized, false);
  assert.ok(result.missing.includes("Owner forecast accepted"));
});

test("authorizes a STEER handoff with an accepted, current forecast", () => {
  const result = evaluateAgentDispatch({ ...readyItem, workflow: "STEER", delivery_forecast_json: acceptedForecast });
  assert.equal(result.authorized, true);
  assert.match(result.handoff_message ?? "", /Owner forecast: accepted in STEER Work Economics/);
});

test("blocks a STEER handoff when a material change requires reforecasting", () => {
  const result = evaluateAgentDispatch({
    ...readyItem,
    workflow: "STEER",
    delivery_forecast_json: JSON.stringify({ ...JSON.parse(acceptedForecast), reforecastRequiredReason: "Scope changed" }),
  });
  assert.equal(result.authorized, false);
  assert.ok(result.missing.includes("Owner forecast accepted"));
});

test("blocks dispatch when the forecast accepter is not the named delivery owner", () => {
  const result = evaluateAgentDispatch({
    ...readyItem,
    workflow: "STEER",
    delivery_forecast_json: JSON.stringify({ ...JSON.parse(acceptedForecast), acceptedBy: "human-other", deliveryOwnerId: "human-other" }),
  });
  assert.equal(result.authorized, false);
  assert.ok(result.missing.includes("Owner forecast accepted"));
});

test("rework is an authorized execution state after the human starts it", () => {
  const result = evaluateAgentDispatch({ ...readyItem, decision_status: "Rework" });
  assert.equal(result.authorized, true);
});
