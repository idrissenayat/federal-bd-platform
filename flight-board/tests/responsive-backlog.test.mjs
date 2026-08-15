import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const api = await readFile(new URL("../worker/api.ts", import.meta.url), "utf8");

test("keeps the full Product Backlog table inside a viewport-width scroll region", () => {
  assert.match(page, /className="backlog-table-scroll" role="region" aria-label="Scrollable Product Backlog table"/);
  assert.match(css, /\.backlog-table-scroll \{[^}]*max-width: 100%;[^}]*overflow-x: auto;/);
  assert.match(css, /\.backlog-table \{ min-width: 1270px; \}/);
});

test("explains the horizontal gesture on small screens", () => {
  assert.match(page, /Swipe horizontally to see dates, Owner and Gate/);
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*\.backlog-scroll-hint \{[^}]*display: flex;/);
});

test("uses separate Created and Closed columns", () => {
  assert.match(page, /<span>Work item<\/span><span>Created<\/span><span>Closed<\/span><span>State<\/span>/);
  assert.match(page, /<time className="date-cell" dateTime=\{item\.created_at\}>\{formatCreatedDate\(item\.created_at\)\}<\/time>/);
  assert.match(css, /\.date-cell \{[^}]*white-space: nowrap;/);
});

test("shows an audited closed date only for completed work", () => {
  assert.match(page, /item\.closed_at \? <time dateTime=\{item\.closed_at\}>\{formatCreatedDate\(item\.closed_at\)\}<\/time> : "—"/);
  assert.match(api, /a\.action = 'updated' AND a\.detail = 'state → complete'/);
});

test("provides created or closed date-range filters", () => {
  assert.match(page, /aria-label="Date field"/);
  assert.match(page, /aria-label="From date"[^>]*type="date"/);
  assert.match(page, /aria-label="To date"[^>]*type="date"/);
  assert.match(page, />Apply dates<\/button>/);
});

test("moves navigation above the workspace before it crowds the table", () => {
  assert.match(css, /@media \(max-width: 1180px\)[\s\S]*\.main-workspace \{ margin-left: 0; width: 100%; \}/);
});
