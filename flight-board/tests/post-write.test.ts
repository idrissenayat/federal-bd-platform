import assert from "node:assert/strict";
import test from "node:test";
import { applyAuthoritativeSnapshot, isLatestItemAction, mergeBootstrapPreservingNewerItems } from "../lib/post-write";

type Item = { id: number; updated_at: string; dispatch_updated_at?: string | null; next_action: string };
type Event = { id: number; detail: string };
type State = { generated_at: string; items: Item[]; activity: Event[]; work_economics_events: Event[]; untouched: string };

const original: State = {
  generated_at: "2026-08-17T12:00:00.000Z",
  items: [{ id: 28, updated_at: "2026-08-17T12:00:00.000Z", next_action: "old" }],
  activity: [{ id: 1, detail: "old" }],
  work_economics_events: [],
  untouched: "preserved",
};

test("applies the authoritative mutation snapshot without waiting for a bootstrap reload", () => {
  const next = applyAuthoritativeSnapshot<State, Item, Event, Event>(original, {
    generated_at: "2026-08-17T12:01:00.000Z",
    item: { id: 28, updated_at: "2026-08-17T12:01:00.000Z", next_action: "confirmed" },
    activity: [{ id: 2, detail: "nextAction → confirmed" }],
    work_economics_events: [],
  });
  assert.equal(next.items[0].next_action, "confirmed");
  assert.deepEqual(next.activity.map((event) => event.id), [2, 1]);
  assert.equal(next.untouched, "preserved");
});

test("ORDER-01 an older bootstrap response cannot overwrite a newer confirmed mutation", () => {
  const confirmed = applyAuthoritativeSnapshot<State, Item, Event, Event>(original, {
    generated_at: "2026-08-17T12:02:00.000Z",
    item: { id: 28, updated_at: "2026-08-17T12:02:00.000Z", next_action: "newest" },
    activity: [{ id: 3, detail: "newest" }],
    work_economics_events: [],
  });
  const staleBootstrap: State = {
    ...original,
    generated_at: "2026-08-17T12:01:30.000Z",
    items: [{ id: 28, updated_at: "2026-08-17T12:01:30.000Z", next_action: "stale" }],
  };
  const reconciled = mergeBootstrapPreservingNewerItems<State, Item, Event, Event>(confirmed, staleBootstrap);
  assert.equal(reconciled.items[0].next_action, "newest");
  assert.ok(reconciled.activity.some((event) => event.id === 3));
});

test("a genuinely newer bootstrap response is accepted", () => {
  const incoming: State = {
    ...original,
    generated_at: "2026-08-17T12:03:00.000Z",
    items: [{ id: 28, updated_at: "2026-08-17T12:03:00.000Z", next_action: "server newer" }],
  };
  assert.equal(mergeBootstrapPreservingNewerItems<State, Item, Event, Event>(original, incoming).items[0].next_action, "server newer");
});

test("ORDER-03 an older dispatch projection cannot overwrite a newer receipt lifecycle event", () => {
  const current: State = {
    ...original,
    items: [{ id: 28, updated_at: "2026-08-17T12:00:00.000Z", dispatch_updated_at: "2026-08-17T12:03:00.000Z", next_action: "delivered" }],
  };
  const stale: State = {
    ...original,
    generated_at: "2026-08-17T12:04:00.000Z",
    items: [{ id: 28, updated_at: "2026-08-17T12:00:00.000Z", dispatch_updated_at: "2026-08-17T12:02:00.000Z", next_action: "queued projection" }],
  };
  assert.equal(mergeBootstrapPreservingNewerItems(current, stale).items[0].next_action, "delivered");
});

test("ORDER-02 and ORDER-04 accept only the latest explicit action result", () => {
  assert.equal(isLatestItemAction(42, 41), false);
  assert.equal(isLatestItemAction(42, 42), true);
});
