import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

test("keeps the full Product Backlog table inside a viewport-width scroll region", () => {
  assert.match(page, /className="backlog-table-scroll" role="region" aria-label="Scrollable Product Backlog table"/);
  assert.match(css, /\.backlog-table-scroll \{[^}]*max-width: 100%;[^}]*overflow-x: auto;/);
  assert.match(css, /\.backlog-table \{ min-width: 1030px; \}/);
});

test("explains the horizontal gesture on small screens", () => {
  assert.match(page, /Swipe horizontally to see Owner and Gate/);
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*\.backlog-scroll-hint \{[^}]*display: flex;/);
});

test("moves navigation above the workspace before it crowds the table", () => {
  assert.match(css, /@media \(max-width: 1180px\)[\s\S]*\.main-workspace \{ margin-left: 0; width: 100%; \}/);
});
