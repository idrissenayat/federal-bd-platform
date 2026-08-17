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

test("completed work exposes a read-only economics audit instead of editable records", () => {
  assert.match(page, /function CompletedEconomicsAudit/);
  assert.match(page, /Completed work cannot be edited from this drawer/);
  assert.match(page, /selected\.state === "complete" \? <CompletedEconomicsAudit/);
  assert.match(page, /: <WorkEconomicsPanel/);
});

test("initial delivery forecast is prefilled by the Forecast Agent for one-click human acceptance", () => {
  assert.match(page, /Forecast Agent completed the first draft/);
  assert.match(page, /Review & accept AI forecast/);
  assert.match(page, /buildForecastProposal/);
  assert.doesNotMatch(page, /Unknown · assigned delivery owner must accept a range/);
});

test("initial value hypothesis is prefilled by the Value Agent for editable human acceptance", () => {
  assert.match(page, /buildValueHypothesisProposal/);
  assert.match(page, /AI proposal ready · human review only/);
  assert.match(page, /Accept AI-prepared value hypothesis/);
  assert.match(page, /defaultValue=\{proposedValue\.beneficiary\}/);
  assert.doesNotMatch(page, /defaultValue=\{value\?\.beneficiary \?\? ""\}/);
});

test("shows governed forecast range, milestone, confidence, and freshness", () => {
  for (const field of ["Earliest completion", "Likely completion", "Latest completion", "Next milestone", "Confidence", "Freshness hours", "Forecast updated", "Human gate target"]) {
    assert.match(page, new RegExp(field));
  }
  assert.match(page, /function ForecastSummary/);
  assert.ok((page.match(/<ForecastSummary/g) ?? []).length >= 6);
});

test("compact work lists show one action-focused forecast line", () => {
  assert.match(page, /if \(compact\) return <div className="economics-summary economics-summary-compact"/);
  assert.match(page, /className="forecast-focus"/);
  assert.match(page, /<b>Next<\/b>/);
  assert.match(page, /Needs forecast/);
  assert.doesNotMatch(css, /economics-summary-compact span\s*\{[^}]*background:\s*#fff7e6/);
});

test("work-economics UI is responsive and does not rely on color alone", () => {
  assert.match(css, /\.work-economics/);
  assert.match(css, /\.economics-summary, \.economics-form-grid \{ grid-template-columns: 1fr; \}/);
  assert.match(css, /@media \(max-width: 680px\)/);
  assert.match(css, /grid-template-columns:\s*1fr/);
  assert.match(page, /forecast\.state/);
  assert.match(page, /forecast\.reason/);
  assert.match(page, /AI is advisory; a named human accepts/);
  assert.ok((page.match(/<RecordAdvisory advisory=/g) ?? []).length === 4);
  assert.match(page, /Each governed record below shows its own AI proposal and human acceptance state/);
  assert.match(page, /Human ruling:/);
  assert.match(page, /Value treatment/);
  assert.match(page, /AI proposal ruling/);
  assert.match(page, /Accept unchanged/);
  assert.match(page, /Accept with human edits/);
  assert.match(page, /Additional role\/provider rows remain preserved and queryable/);
  assert.match(page, /Conflicting telemetry/);
  assert.match(page, /Partial provider data/);
  assert.match(page, /Contributing WIP items and ranges/);
  assert.match(page, /Last forecast update:/);
  assert.match(page, /Target:/);
  assert.match(page, /entry\.nextMilestone/);
  assert.match(page, /entry\.updatedAt/);
  assert.match(page, /Work type/);
  assert.match(page, /item\.work_type/);
  assert.match(css, /economics-summary-compact \.forecast-focus span[^}]*font-size:\s*12px/);
  assert.match(css, /economics-record form > button[^}]*color:\s*#39232d/);
});
