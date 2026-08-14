import assert from "node:assert/strict";
import test from "node:test";
import { itemVisibleInMyWork } from "../app/page";

const assignedEngineerItem = {
  id: 10,
  key: "STR-010",
  title: "Complete Block Buzz agent operations",
  description: "Activate persistent hosted agent workers.",
  phase: "Engineer",
  priority: "Now",
  workflow: "Setup / excluded",
  state: "active",
  gate: "No gate (setup)",
  decision_status: "Not required",
  decision_authority: "Human owner",
  assignee_id: "human-idriss",
  assignee_name: "Idriss Enayat",
  assignee_kind: "human",
  next_action: "Review the linked pull request.",
  evidence_url: "https://github.com/idrissenayat/federal-bd-platform/pull/11",
  github_url: "https://github.com/idrissenayat/federal-bd-platform/issues/10",
  rework_instructions: null,
  blocked_since: null,
  updated_at: "2026-08-14T14:00:00.000Z",
  dispatch_authorization: { authorized: false, status: "Blocked", summary: "Human work", checks: [], missing: [], channel: "Block Buzz", handoff_message: null },
};

test("direct ownership stays visible across role cockpits", () => {
  assert.equal(itemVisibleInMyWork(assignedEngineerItem, "human-idriss", "product", []), true);
});

test("completed work stays out of My Work even when directly assigned", () => {
  assert.equal(itemVisibleInMyWork({ ...assignedEngineerItem, state: "complete" }, "human-idriss", "product", []), false);
});

test("unassigned technical work still follows the selected role", () => {
  const unassigned = { ...assignedEngineerItem, assignee_id: null };
  assert.equal(itemVisibleInMyWork(unassigned, "human-idriss", "product", []), false);
  assert.equal(itemVisibleInMyWork(unassigned, "human-idriss", "tech", []), true);
});
