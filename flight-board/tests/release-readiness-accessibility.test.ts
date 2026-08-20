import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import axe from "axe-core";
import { ReleaseReadinessCard } from "../app/page";

const base = {
  snapshot: {
    snapshot_id: "1".repeat(64), work_item_id: 74, implementation_commit: "a".repeat(40),
    verification_completed_at: "2026-08-19T20:00:00.000Z", tier: "DEFAULT_OPEN" as const,
    satisfaction_path: "TIME" as const, delay_hours: 0, effective_not_before: "2026-08-19T20:00:00.000Z",
    required_roles: [] as string[], classification_errors: [] as string[], candidate_builder_id: "agent-builder", intended_submitter_id: "human-1",
  },
  snapshot_sha256: "2".repeat(64), status: "READY" as const, reason: "TIME_PATH_SATISFIED",
  missing_roles: [] as string[], completed_controls: ["Exact candidate", "Signed staging verification", "Passing signed Critic", "Risk policy v1", "Time separation"],
  server_now: "2026-08-19T20:00:00.000Z",
};

const states = [
  { name: "default-open ready", readiness: base, expected: /Ready for your decision/ },
  { name: "elevated countdown", readiness: { ...base, status: "NOT_READY" as const, reason: "COOLING_PERIOD_ACTIVE", snapshot: { ...base.snapshot, tier: "ELEVATED" as const, delay_hours: 4, effective_not_before: "2026-08-20T00:00:00.000Z" }, completed_controls: base.completed_controls.slice(0, 4) }, expected: /Ready after 4h 0m/ },
  { name: "elevated missing signer", readiness: { ...base, status: "NOT_READY" as const, reason: "QUALIFIED_HUMAN_REQUIRED", snapshot: { ...base.snapshot, tier: "ELEVATED" as const, satisfaction_path: "QUALIFIED_HUMAN" as const, delay_hours: 4, required_roles: ["Security Owner"] }, missing_roles: ["Security Owner"], completed_controls: base.completed_controls.slice(0, 4) }, expected: /Independent Security Owner approval required/ },
  { name: "default-closed countdown", readiness: { ...base, status: "NOT_READY" as const, reason: "COOLING_PERIOD_ACTIVE", snapshot: { ...base.snapshot, tier: "DEFAULT_CLOSED" as const, delay_hours: 24, effective_not_before: "2026-08-20T20:00:00.000Z" }, completed_controls: base.completed_controls.slice(0, 4) }, expected: /Ready after 24h 0m/ },
  { name: "team missing roles", readiness: { ...base, status: "NOT_READY" as const, reason: "QUALIFIED_HUMAN_REQUIRED", snapshot: { ...base.snapshot, tier: "DEFAULT_CLOSED" as const, satisfaction_path: "QUALIFIED_TEAM" as const, delay_hours: 24, required_roles: ["Product Lead", "Tech Lead"] }, missing_roles: ["Product Lead", "Tech Lead"], completed_controls: base.completed_controls.slice(0, 4) }, expected: /Independent Product Lead approval required/ },
  { name: "invalidated reset", readiness: { ...base, status: "INVALIDATED" as const, reason: "AUTHORITY_DRIFT", completed_controls: [], invalidation: { code: "AUTHORITY_DRIFT", changes: [{ field: "IMPLEMENTATION", old_sha256: "3".repeat(64), new_sha256: "4".repeat(64) }] } }, expected: /Verification reset/ },
  { name: "server failure", readiness: null, error: "The server response could not be refreshed.", expected: /temporarily unavailable/ },
  { name: "effective history", readiness: base, effectiveHistory: true, expected: /Effective ruling preserved/ },
];

test("RR-19 renders all eight readiness states with one named status and no serious axe finding at 320px", async () => {
  for (const state of states) {
    const html = renderToStaticMarkup(createElement(ReleaseReadinessCard, {
      readiness: state.readiness,
      displayNow: Date.parse("2026-08-19T20:00:00.000Z"),
      error: state.error ?? null,
      effectiveHistory: state.effectiveHistory ?? false,
    }));
    const dom = new JSDOM(`<main style="width:320px;zoom:2">${html}</main>`, { runScripts: "dangerously" });
    dom.window.eval(axe.source);
    const main = dom.window.document.querySelector("main")!;
    assert.match(main.textContent ?? "", state.expected, state.name);
    assert.equal(main.querySelectorAll('[role="status"],[role="alert"]').length, 1, state.name);
    assert.match(main.textContent ?? "", /Candidate|snapshot required|No decision control|exact snapshot/, state.name);
    const results = await (dom.window as unknown as { axe: typeof axe }).axe.run(main, { rules: { "color-contrast": { enabled: false } } });
    assert.equal(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? "")).length, 0, state.name);
  }
});
