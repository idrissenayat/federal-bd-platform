import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const api = await readFile(new URL("../worker/api.ts", import.meta.url), "utf8");

test("keeps the full Product Backlog table inside a viewport-width scroll region", () => {
  assert.match(page, /className="backlog-table-scroll" role="region" aria-label="Scrollable Product Backlog table"/);
  assert.match(css, /\.backlog-table-scroll \{[^}]*max-width: 100%;[^}]*overflow-x: auto;/);
  assert.match(css, /\.backlog-table \{ min-width: 1030px; \}/);
});

test("explains the horizontal gesture on small screens", () => {
  assert.match(page, /Swipe horizontally to see Owner and Gate/);
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*\.backlog-scroll-hint \{[^}]*display: flex;/);
});

test("keeps each creation date with the visible work-item identity", () => {
  assert.match(page, /<time className="created-date" dateTime=\{item\.created_at\}>Added \{formatCreatedDate\(item\.created_at\)\}<\/time>/);
  assert.match(css, /\.created-date \{[^}]*white-space: nowrap;/);
});

test("shows an audited closed date only for completed work", () => {
  assert.match(page, /item\.state === "complete" && \(item\.closed_at \? <time className="closed-date" dateTime=\{item\.closed_at\}>Closed \{formatCreatedDate\(item\.closed_at\)\}<\/time>/);
  assert.match(api, /a\.action = 'updated' AND a\.detail = 'state → complete'/);
  assert.match(css, /\.closed-date \{[^}]*white-space: nowrap;/);
});

test("moves navigation above the workspace before it crowds the table", () => {
  assert.match(css, /@media \(max-width: 1180px\)[\s\S]*\.main-workspace \{ margin-left: 0; width: 100%; \}/);
});
