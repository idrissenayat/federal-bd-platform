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

test("successful decisions apply the authoritative response before the ruling workspace closes", () => {
  const start = page.indexOf("async function recordDecision");
  const refresh = page.indexOf("applySnapshot(result.snapshot);", start);
  const close = page.indexOf("closeDecisionWorkspace();", start);
  assert.ok(refresh >= 0 && close > refresh);
  assert.match(page, /ruling recorded from the authoritative response/);
});

test("drawer mutations use authoritative snapshots and action-local feedback", () => {
  assert.match(page, /applyAuthoritativeSnapshot/);
  assert.match(page, /mergeBootstrapPreservingNewerItems/);
  assert.match(page, /InlineActionFeedback/);
  assert.match(page, /NextActionEditor/);
  assert.match(page, /Your input is preserved/);
  assert.match(css, /\.inline-action-feedback/);
});

test("dispatch copy failure does not invite a duplicate authorization", () => {
  assert.match(page, /The handoff was authorized once, but the message could not be copied/);
  assert.match(page, /Do not authorize it again/);
});
