import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

test("signal intake asks only for natural language and names the non-admission boundary", () => {
  const start = page.indexOf('className="signal-intake-dialog-shell"');
  const end = page.indexOf("{decisionOpen", start);
  const intake = page.slice(start, end);
  assert.match(intake, /What did you notice, need, or want to improve\?/);
  assert.match(intake, /Public, unclassified information only/);
  assert.match(intake, /Platform AI prepares the product analysis; it does not create or approve a work item/);
  assert.doesNotMatch(intake, /name="phase"|name="priority"|name="workflow"|name="assigneeId"/);
});

test("signal workspaces expose original, classification, safe failure, provenance, and advisory status", () => {
  assert.match(page, /Original signal · preserved exactly/);
  assert.match(page, /AI analysis stopped safely/);
  assert.match(page, /Verified facts/);
  assert.match(page, /AI inferences/);
  assert.match(page, /Assumptions/);
  assert.match(page, /Unknowns/);
  assert.match(page, /How this proposal was produced/);
  assert.match(page, /This slice cannot admit work, allocate an STR key, approve a Gate, assign, or dispatch/);
});

test("signal intake and workspace contain focus, restore focus, and adapt to a narrow viewport", () => {
  assert.match(page, /handleSignalIntakeKeyDown/);
  assert.match(page, /handleSignalKeyDown/);
  assert.match(page, /cycleDrawerFocus/);
  assert.match(page, /signalReturnFocus\.current\?\.focus/);
  assert.match(page, /ref=\{signalHeadingRef\} id="signal-workspace-title" tabIndex=\{-1\}/);
  assert.match(page, /signalHeadingRef\.current\?\.focus\(\)/);
  assert.match(page, /Proposal ready for human review\. No work item has been created\./);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.signal-recommendation-grid[^}]*grid-template-columns: 1fr/);
  assert.match(css, /\.signal-primary-input textarea[^}]*width: 100%/);
});
