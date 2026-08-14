import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

test("renders four separate work-economics records", () => {
  for (const label of ["Value hypothesis", "Delivery forecast", "Actual delivery economics", "Realized outcome"]) {
    assert.match(page, new RegExp(label));
  }
  assert.match(page, /function WorkEconomicsPanel/);
  assert.match(page, /<WorkEconomicsPanel/);
});

test("shows governed forecast range, milestone, confidence, and freshness", () => {
  for (const field of ["Earliest completion", "Likely completion", "Latest completion", "Next milestone", "Confidence", "Freshness hours", "Forecast updated", "Human gate target"]) {
    assert.match(page, new RegExp(field));
  }
  assert.match(page, /function ForecastSummary/);
  assert.ok((page.match(/<ForecastSummary/g) ?? []).length >= 6);
});

test("work-economics UI is responsive and does not rely on color alone", () => {
  assert.match(css, /\.work-economics/);
  assert.match(css, /\.economics-summary, \.economics-form-grid \{ grid-template-columns: 1fr; \}/);
  assert.match(css, /@media \(max-width: 680px\)/);
  assert.match(css, /grid-template-columns:\s*1fr/);
  assert.match(page, /forecast\.state/);
  assert.match(page, /forecast\.reason/);
  assert.match(page, /AI is advisory; a named human accepts/);
  assert.match(page, /AI proposal ruling/);
  assert.match(page, /Accept unchanged/);
  assert.match(page, /Accept with human edits/);
  assert.match(page, /Additional role\/provider rows remain preserved and queryable/);
  assert.match(page, /Conflicting telemetry/);
  assert.match(page, /Partial provider data/);
  assert.match(page, /Contributing WIP items and ranges/);
  assert.match(css, /economics-summary-compact span[^}]*font-size:\s*12px/);
  assert.match(css, /economics-record form > button[^}]*color:\s*#39232d/);
});
