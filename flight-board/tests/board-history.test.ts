import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPhaseTimeline,
  completionTime,
  isRecentlyCompleted,
  laneItems,
  matchesBoardSearch,
  olderCompletedCount,
  type BoardActivityRecord,
  type BoardItemRecord,
} from "../app/board-history";

const now = new Date("2026-08-17T20:00:00.000Z");

function item(overrides: Partial<BoardItemRecord> = {}): BoardItemRecord {
  return {
    id: 1,
    key: "STR-002",
    title: "Completed tracer",
    description: "Evidence-backed setup item",
    phase: "Learn",
    priority: "Now",
    workflow: "Setup / excluded",
    state: "complete",
    assignee_name: "Test Agent",
    created_at: "2026-08-10T12:00:00.000Z",
    closed_at: "2026-08-17T12:00:00.000Z",
    ...overrides,
  };
}

function event(overrides: Partial<BoardActivityRecord> = {}): BoardActivityRecord {
  return {
    id: 1,
    item_id: 1,
    action: "updated",
    detail: "state → complete",
    created_at: "2026-08-17T12:00:00.000Z",
    ...overrides,
  };
}

test("includes the exact seven-day cutoff and excludes an older completion", () => {
  assert.equal(isRecentlyCompleted(item({ closed_at: "2026-08-10T20:00:00.000Z" }), [], now), true);
  assert.equal(isRecentlyCompleted(item({ closed_at: "2026-08-10T19:59:59.999Z" }), [], now), false);
  assert.equal(isRecentlyCompleted(item({ closed_at: "2026-08-17T20:00:00.001Z" }), [], now), false);
});

test("uses the latest authoritative complete-state activity when closed_at is unavailable", () => {
  const activity = [
    event({ id: 2, created_at: "2026-08-16T12:00:00.000Z" }),
    event({ id: 3, detail: "priority → Now", created_at: "2026-08-17T12:00:00.000Z" }),
    event({ id: 1, created_at: "2026-08-15T12:00:00.000Z" }),
  ];
  assert.equal(completionTime(item({ closed_at: null }), activity, now), "2026-08-16T12:00:00.000Z");
});

test("does not fabricate recent completion for invalid, missing, or future timestamps", () => {
  assert.equal(isRecentlyCompleted(item({ closed_at: "invalid" }), [], now), false);
  assert.equal(isRecentlyCompleted(item({ closed_at: null }), [], now), false);
  assert.equal(isRecentlyCompleted(item({ closed_at: "2026-08-18T12:00:00.000Z" }), [], now), false);
});

test("keeps active WIP separate from visible completed history", () => {
  const items = [
    item({ id: 1, state: "active", closed_at: null }),
    item({ id: 2, closed_at: "2026-08-17T10:00:00.000Z" }),
    item({ id: 3, closed_at: "2026-07-01T10:00:00.000Z" }),
  ];
  const recent = laneItems(items, [], "Learn", false, now);
  assert.equal(recent.active.length, 1);
  assert.deepEqual(recent.completed.map((candidate) => candidate.id), [2]);
  assert.equal(olderCompletedCount(items, [], now), 1);
  assert.deepEqual(laneItems(items, [], "Learn", true, now).completed.map((candidate) => candidate.id), [2, 3]);
});

test("applies the same case-insensitive search to active and completed items", () => {
  assert.equal(matchesBoardSearch(item({ state: "active" }), "completed TRACER"), true);
  assert.equal(matchesBoardSearch(item(), "str-002"), true);
  assert.equal(matchesBoardSearch(item(), "engineer"), false);
  assert.equal(matchesBoardSearch(item(), "   "), true);
});

test("orders observed phases by evidence time, collapses duplicates, and labels missing phases", () => {
  const activity = [
    event({ id: 9, action: "updated", detail: "phase → Learn", created_at: "2026-08-17T18:00:00.000Z" }),
    event({ id: 6, action: "updated", detail: "phase → Engineer", created_at: "2026-08-13T12:00:00.000Z" }),
    event({ id: 4, action: "updated", detail: "phase → Frame", created_at: "2026-08-12T12:00:00.000Z" }),
    event({ id: 5, action: "updated", detail: "phase → Frame", created_at: "2026-08-12T13:00:00.000Z" }),
    event({ id: 2, action: "created", detail: "STR-002 created in Sense", created_at: "2026-08-10T12:00:00.000Z" }),
    event({ id: 7, action: "updated", detail: "phase → Unknown", created_at: "2026-08-14T12:00:00.000Z" }),
  ];
  const timeline = buildPhaseTimeline(item({ closed_at: null }), activity, now);
  assert.deepEqual(timeline.entries.slice(0, 4).map((entry) => entry.phase), ["Sense", "Frame", "Engineer", "Learn"]);
  assert.equal(timeline.entries.find((entry) => entry.phase === "Frame")?.enteredAt, "2026-08-12T12:00:00.000Z");
  assert.equal(timeline.entries.find((entry) => entry.phase === "Release")?.status, "Not recorded");
  assert.equal(timeline.entries.find((entry) => entry.phase === "Learn")?.isCurrent, true);
  assert.equal(timeline.completionTime, null);
});
