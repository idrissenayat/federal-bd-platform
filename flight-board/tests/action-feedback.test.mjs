import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

test("failed actions remain visible above modal workspaces", () => {
  assert.match(page, /role="alert" aria-live="assertive"/);
  assert.match(page, /Action not completed/);
  assert.match(css, /\.action-feedback[^}]*position: fixed[^}]*z-index: 180/);
});

test("Gate 1 approval exposes and enforces the value prerequisite", () => {
  assert.match(page, /Complete one prerequisite/);
  assert.match(page, /Review prepared proposal/);
  assert.match(page, /approvalPrerequisiteMissing/);
  assert.match(page, /Complete prerequisite first/);
});

test("successful decisions refresh before the ruling workspace closes", () => {
  const start = page.indexOf("async function recordDecision");
  const refresh = page.indexOf("await load();", start);
  const close = page.indexOf("closeDecisionWorkspace();", start);
  assert.ok(refresh >= 0 && close > refresh);
  assert.match(page, /ruling recorded\. The decision inbox and work item are now refreshed/);
});
