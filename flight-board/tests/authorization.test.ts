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
};

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

test("blocks queued work even when every other field is complete", () => {
  const result = evaluateAgentDispatch({ ...readyItem, state: "queued" });
  assert.equal(result.authorized, false);
  assert.ok(result.missing.includes("Execution state is active"));
});
