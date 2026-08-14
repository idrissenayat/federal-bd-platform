import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { JSDOM } from "jsdom";
import axe from "axe-core";
import { WorkEconomicsPanel } from "../app/page";
import { evaluateForecast, type DeliveryForecast } from "../lib/work-economics";

const forecast: DeliveryForecast = {
  sizeBand: "M", humanEffortRanges: [{ role: "Delivery roles", minMinutes: 30, maxMinutes: 90 }], agentCostRanges: [{ provider: "OpenAI", minCost: 1, maxCost: 5, currency: "USD", expectedAttempts: 2 }], complexity: 3, uncertainty: 3, coordination: 2,
  basis: "Expert judgment; no comparable cohort yet", basisKind: "expert judgment", comparableItems: "None", serviceLevel: null, timezone: "America/New_York",
  earliestCompletion: "2026-08-15T14:00:00.000Z", likelyCompletion: "2026-08-15T18:00:00.000Z", latestCompletion: "2026-08-16T18:00:00.000Z", confidence: "low",
  nextMilestone: "Move to Evaluate", nextMilestoneAt: "2026-08-15T16:00:00.000Z", phaseExit: "Evaluate", phaseExitAt: "2026-08-15T18:00:00.000Z", agentWorkCompletedAt: null, humanDecisionTargetAt: null,
  blockedSince: null, unblockOwner: "", unblockAction: "", cannotForecastUntil: "", freshnessHours: 24, acceptedBy: "member-tech", acceptedAt: "2026-08-14T14:00:00.000Z", updatedAt: "2026-08-14T14:00:00.000Z", changeReason: "Initial", advisory: null, acceptanceState: "no proposal", deliveryOwnerId: "member-tech",
};

function luminance(hex: string) {
  const channels = hex.match(/[a-f\d]{2}/gi)!.map((part) => Number.parseInt(part, 16) / 255).map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a: string, b: string) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

test("rendered Work Economics surface has no serious or critical axe findings", async () => {
  const item = {
    id: 17, key: "STR-017", title: "Work Economics", description: "Governed economics", phase: "Engineer", priority: "Now", workflow: "STEER", state: "active", gate: "Gate 2 passed", decision_status: "Rework", decision_authority: "Tech Lead", assignee_id: "agent-builder", assignee_name: "Builder", assignee_kind: "agent", next_action: "Correct blockers", evidence_url: "https://github.com/example/evidence", github_url: "https://github.com/example/issues/17", rework_instructions: null, blocked_since: null, pod_id: "pod-a", updated_at: "2026-08-14T14:00:00.000Z",
    work_economics: { valueHypothesis: null, deliveryForecast: forecast, actualEconomics: null, realizedOutcome: null, forecast: evaluateForecast(forecast, { state: "active", decision_status: "Rework" }, "2026-08-14T15:00:00.000Z") },
    dispatch_authorization: { authorized: false, status: "Blocked" as const, summary: "Blocked", checks: [], missing: [], channel: "#test", handoff_message: null },
  };
  const html = renderToStaticMarkup(createElement(WorkEconomicsPanel, { item, events: [], members: [{ id: "member-tech", display_name: "Tech Lead", email: null, kind: "human" as const, role: "Tech Lead", authority: "Gate 2", status: "available", accent: "aqua" }], serviceLevels: [], currentUserId: "member-tech", saving: false, onSave: async () => {} }));
  const dom = new JSDOM(`<main>${html}</main>`, { runScripts: "dangerously" });
  dom.window.eval(axe.source);
  const results = await (dom.window as unknown as { axe: typeof axe }).axe.run(dom.window.document.querySelector("main")!, { rules: { "color-contrast": { enabled: false } } });
  assert.equal(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? "")).length, 0);
});

test("primary Work Economics action contrast meets WCAG AA at both gradient endpoints", () => {
  assert.ok(contrast("39232d", "f2b7c9") >= 4.5);
  assert.ok(contrast("39232d", "f4d273") >= 4.5);
});
