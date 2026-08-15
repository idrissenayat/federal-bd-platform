import assert from "node:assert/strict";
import test from "node:test";
import { backlogItemsForDateRange, backlogItemsForScope, formatCreatedDate } from "../app/page";

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

test("formats durable creation timestamps as readable backlog dates", () => {
  assert.equal(formatCreatedDate("2026-08-14T16:00:00.000Z"), "Aug 14, 2026");
  assert.equal(formatCreatedDate("not-a-date"), "Date unavailable");
});

test("filters the backlog by created or closed date range", () => {
  const dated = [
    { key: "STR-001", created_at: "2026-08-13T16:00:00.000Z", closed_at: null },
    { key: "STR-002", created_at: "2026-08-14T16:00:00.000Z", closed_at: "2026-08-15T16:00:00.000Z" },
  ];
  assert.deepEqual(backlogItemsForDateRange(dated, "created_at", "2026-08-14", "2026-08-14").map((item) => item.key), ["STR-002"]);
  assert.deepEqual(backlogItemsForDateRange(dated, "closed_at", "2026-08-15", "").map((item) => item.key), ["STR-002"]);
  assert.deepEqual(backlogItemsForDateRange(dated, "closed_at", "", "").map((item) => item.key), ["STR-001", "STR-002"]);
});
