import assert from "node:assert/strict";
import test from "node:test";
import { decisionTransition } from "../worker/api";

test("turns a Gate 1 approval into an actionable Gate 2 Exam handoff", () => {
  const transition = decisionTransition({
    gate: "Gate 1 pending",
    phase: "Sense",
    state: "blocked",
    decision_authority: "Product Lead",
    assignee_id: "agent-scout",
    next_action: "Draft the Intent Brief and present Gate 1.",
    rework_instructions: null,
  }, "APPROVED");

  assert.deepEqual(transition, {
    gate: "Gate 2 pending",
    phase: "Frame",
    decisionStatus: "Waiting",
    state: "active",
    decisionAuthority: "Interim Tech Lead",
    assigneeId: "agent-architect",
    nextAction: "Design a falsifiable Gate 2 Exam from the approved Intent Brief, attach the exact Exam revision, run a fresh Critic review, and present Gate 2 to the Interim Tech Lead. Do not implement before Gate 2 passes.",
    reworkInstructions: null,
  });
});

test("keeps a requested Gate 1 revision with the evidence owner", () => {
  const transition = decisionTransition({
    gate: "Gate 1 pending",
    phase: "Sense",
    state: "active",
    decision_authority: "Product Lead",
    assignee_id: "agent-scout",
    next_action: "Draft the Intent Brief and present Gate 1.",
    rework_instructions: null,
  }, "CHANGES_REQUESTED", "Required change: Clarify the success criteria.");

  assert.equal(transition.gate, "Gate 1 pending");
  assert.equal(transition.phase, "Sense");
  assert.equal(transition.decisionStatus, "Changes requested");
  assert.equal(transition.state, "blocked");
  assert.equal(transition.decisionAuthority, "Product Lead");
  assert.equal(transition.assigneeId, "agent-scout");
  assert.equal(transition.nextAction, "Clarify the success criteria.");
  assert.equal(transition.reworkInstructions, "Required change: Clarify the success criteria.");
});

test("turns a Gate 2 approval into a Builder implementation handoff", () => {
  const transition = decisionTransition({
    gate: "Gate 2 pending", phase: "Frame", state: "blocked", decision_authority: "Interim Tech Lead",
    assignee_id: "agent-architect", next_action: "Design the Exam.", rework_instructions: null,
  }, "APPROVED");

  assert.equal(transition.gate, "Gate 2 passed");
  assert.equal(transition.phase, "Engineer");
  assert.equal(transition.assigneeId, "agent-builder");
  assert.match(transition.nextAction, /Implement the exact approved Gate 2 Exam/);
});
