import assert from "node:assert/strict";
import test from "node:test";
import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import axe from "axe-core";
import { SignalBacklog } from "../app/page";

type Props = ComponentProps<typeof SignalBacklog>;

const item: Props["items"][number] = {
  signal_id: "0198abcd-0000-7000-8000-000000000001",
  lifecycle_state: "READY",
  presentation_group: "READY_FOR_REVIEW",
  presentation_label: "Ready for review",
  excerpt: "A contributor noticed that role assignment is difficult to understand.",
  current_proposal_version: 1,
  attention_reason: null,
  created_at: "2026-08-19T12:00:00.000Z",
  updated_at: "2026-08-19T12:00:00.000Z",
};

const response: Props["response"] = {
  ok: true,
  generated_at: "2026-08-20T15:00:00.000Z",
  query: { group: "ALL", q: null, limit: 25, snapshot_at: "2026-08-20T15:00:00.000Z" },
  counts: { total: 31, new: 7, screening: 6, ready_for_review: 6, needs_attention: 12 },
  items: [item],
  page: { has_more: true, next_cursor: "cursor", returned: 1 },
};

const handlers = {
  onGroup: () => undefined, onSearch: () => undefined, onSubmitSearch: (event: { preventDefault(): void }) => event.preventDefault(),
  onClearSearch: () => undefined, onRefresh: () => undefined, onLoadMore: () => undefined,
  onOpen: () => undefined, onCreate: () => undefined,
};

async function scan(overrides: Partial<Props>) {
  const props = {
    response, items: [item], group: "ALL" as const, search: "", appliedSearch: "", loading: null,
    error: null, status: "Loaded 1 of 31 signals in this snapshot.", ...handlers, ...overrides,
  } as Props;
  const html = renderToStaticMarkup(createElement(SignalBacklog, props));
  const dom = new JSDOM(`<main style="width:320px;zoom:2">${html}</main>`, { runScripts: "dangerously" });
  dom.window.eval(axe.source);
  const main = dom.window.document.querySelector("main")!;
  const results = await (dom.window as unknown as { axe: typeof axe }).axe.run(main, { rules: { "color-contrast": { enabled: false } } });
  return { main, results };
}

test("SB-16 renders all eight Signal Backlog states with named accessible truth", async () => {
  const states: Array<{ name: string; overrides: Partial<Props>; expected: RegExp }> = [
    { name: "initial loading", overrides: { response: null, items: [], loading: "initial", status: "Loading the authoritative Signal Backlog." }, expected: /Loading the authoritative signal register/u },
    { name: "populated", overrides: {}, expected: /Ready for review/u },
    { name: "selected group", overrides: { group: "READY_FOR_REVIEW" }, expected: /Advisory proposal available/u },
    { name: "no match", overrides: { response: { ...response, counts: { total: 0, new: 0, screening: 0, ready_for_review: 0, needs_attention: 0 }, items: [], page: { has_more: false, next_cursor: null, returned: 0 } }, items: [], search: "missing", appliedSearch: "missing", status: "No signals match the applied search." }, expected: /No signals match this search/u },
    { name: "appended page", overrides: { response: { ...response, page: { has_more: false, next_cursor: null, returned: 6 } }, status: "Added 6 signals. The complete snapshot is now visible." }, expected: /complete snapshot is now visible/u },
    { name: "permission failure", overrides: { response: null, items: [], error: "Signal Backlog access requires an enrolled POD identity.", status: "Signal Backlog loading failed. No complete result is available." }, expected: /requires an enrolled POD identity/u },
    { name: "network retry", overrides: { error: "The service is temporarily unavailable.", status: "Refresh failed. The previously completed result remains visible and may be stale." }, expected: /prior completed result remains visible/u },
    { name: "empty POD", overrides: { response: { ...response, counts: { total: 0, new: 0, screening: 0, ready_for_review: 0, needs_attention: 0 }, items: [], page: { has_more: false, next_cursor: null, returned: 0 } }, items: [], status: "No signals have been captured in this POD." }, expected: /No signals captured yet/u },
  ];
  for (const state of states) {
    const { main, results } = await scan(state.overrides);
    assert.match(main.textContent ?? "", state.expected, state.name);
    assert.equal(main.querySelectorAll('[role="status"]').length, 1, state.name);
    assert.equal(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? "")).length, 0, state.name);
  }
});

function luminance(hex: string) {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
}

test("SB-16 status and action colors meet WCAG AA", () => {
  const pairs = [["#285c40", "#e8f4ed"], ["#72500d", "#fff3d8"], ["#673c63", "#f4e9f3"], ["#782f38", "#ffe9ec"], ["#ffffff", "#28553d"], ["#27342d", "#fffefa"]] as const;
  for (const [foreground, background] of pairs) {
    const values = [luminance(foreground), luminance(background)].sort((left, right) => right - left);
    assert.ok((values[0] + .05) / (values[1] + .05) >= 4.5, `${foreground} on ${background}`);
  }
});
