import assert from "node:assert/strict";
import test from "node:test";
import { backlogItemsForScope } from "../app/page";

const items = [
  { key: "STR-001", state: "active" },
  { key: "STR-002", state: "blocked" },
  { key: "STR-003", state: "complete" },
];

test("shows the complete work register by default", () => {
  assert.deepEqual(backlogItemsForScope(items, "all").map((item) => item.key), ["STR-001", "STR-002", "STR-003"]);
});

test("filters open and closed work without discarding either history", () => {
  assert.deepEqual(backlogItemsForScope(items, "open").map((item) => item.key), ["STR-001", "STR-002"]);
  assert.deepEqual(backlogItemsForScope(items, "closed").map((item) => item.key), ["STR-003"]);
});
