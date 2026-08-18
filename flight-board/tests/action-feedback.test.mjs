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

test("paired feedback telemetry uses one bounded batch request", () => {
  assert.match(page, /function emitTelemetryBatch\(observations: TelemetryObservation\[\]\)/);
  assert.match(page, /observations: observations\.map/);
  assert.match(page, /emitTelemetryBatch\(\[\s*\{ metric_name: histogram[\s\S]*\{ metric_name: outcomeMetric/);
});

test("narrow drawers contain governed forms and long audit evidence", () => {
  assert.match(css, /\.item-drawer \{ overflow-x: hidden; \}/);
  assert.match(css, /\.drawer-body, \.detail-section, \.field-grid, \.field-grid label,[^}]*min-width: 0;/s);
  assert.match(css, /\.field-grid input, \.field-grid select,[^}]*max-width: 100%; width: 100%;/s);
  assert.match(css, /\.economics-form-grid input[^}]*max-width: 100%; width: 100%;/s);
  assert.match(css, /\.dispatch-checks > div \{ grid-template-columns: 23px minmax\(0, 1fr\); \}/);
  assert.match(css, /\.dispatch-checks small[^}]*overflow-wrap: anywhere;/s);
  assert.match(css, /\.activity-row \{ grid-template-columns: 24px minmax\(0, 1fr\); \}/);
  assert.match(css, /\.activity-row p[^}]*overflow-wrap: anywhere;/s);
  assert.match(css, /\.record-advisory small[^}]*overflow-wrap: anywhere;/s);
});

test("dispatch copy failure does not invite a duplicate authorization", () => {
  assert.match(page, /The handoff was authorized once, but the message could not be copied/);
  assert.match(page, /Do not authorize it again/);
});

test("AT-04 preserves action-local truth across reload failure and missing authoritative items", () => {
  assert.match(page, /setReloadError\(message\)/);
  assert.match(page, /aria-label="Workspace refresh failed"/);
  assert.match(page, /drawer still shows the last authoritative action result/);
  assert.match(page, /retry the refresh without repeating the action/);
  assert.match(page, /selectedId !== null && !selected/);
  assert.match(page, /aria-label="Authoritative work item unavailable"/);
  assert.match(page, /No durable value was fabricated/);
});

test("AT-17 exposes transport, blocked, pending, empty, and reload outcomes without banner-only feedback", () => {
  assert.match(page, /failureOutcome\(caught\)/);
  assert.match(page, /"transport"/);
  assert.match(page, /"blocked" : "error"/);
  assert.match(page, /scope, state: "pending"/);
  assert.match(page, /role=\{feedback\.state === "error" \? "alert" : "status"\}/);
  assert.match(page, /tabIndex=\{feedback\.state === "error" \? -1 : undefined\}/);
  assert.match(page, /Workspace unavailable/);
  assert.match(page, /Work item unavailable/);
});

test("named human can activate the exact STR-028 policy from an accessible authenticated control", () => {
  assert.match(page, /Activate the approved STR-028 privacy policy/);
  assert.match(page, /expected_policy_version: data\?\.privacy_policy\?\.policy_version/);
  assert.match(page, /STR-028_PROVIDER_RECOVERY_RULING_APPROVED/);
  assert.match(page, /Privacy policy version \$\{result\.policy_version\} is active/);
});

test("signed Critic requests require an explicit immutable target packet", () => {
  assert.match(page, /Attach the exact immutable target/);
  assert.match(page, /Exact review target packet JSON/);
  assert.match(page, /const packet = JSON\.parse\(packetJson\)/);
  assert.match(page, /const target = packet\.target \?\? packet/);
  assert.doesNotMatch(page, /\/reviews`, \{ method: "POST", body: "\{\}" \}/);
  assert.doesNotMatch(page, /reviewNeedsRefresh\(item\)[\s\S]{0,120}requestAgentReview\(item\.id\)/);
});
