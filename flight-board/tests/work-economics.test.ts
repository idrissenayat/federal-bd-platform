import assert from "node:assert/strict";
import test from "node:test";
import { buildPullForecast, evaluateForecast, materialForecastChange, type DeliveryForecast, type WorkEconomicsRecord } from "../lib/work-economics";
import { validateWorkEconomics, workEconomicsAuthorized } from "../worker/api";

const now = "2026-08-14T16:00:00.000Z";
const forecast: DeliveryForecast = {
  sizeBand: "M", humanRole: "Delivery roles", humanMinutesMin: 30, humanMinutesMax: 90,
  agentCostMin: 1, agentCostMax: 5, currency: "USD", expectedAttempts: 2,
  complexity: 3, uncertainty: 3, coordination: 2, basis: "Expert judgment; no comparable cohort yet",
  comparableItems: "None yet", timezone: "America/New_York",
  earliestCompletion: "2026-08-14T17:00:00.000Z", likelyCompletion: "2026-08-14T18:00:00.000Z", latestCompletion: "2026-08-14T20:00:00.000Z",
  confidence: "low", nextMilestone: "Move to Evaluate / QA", nextMilestoneAt: "2026-08-14T17:30:00.000Z",
  phaseExit: "Evaluate", phaseExitAt: "2026-08-14T18:00:00.000Z", freshnessHours: 24,
  acceptedBy: "tech@example.com", acceptedAt: "2026-08-14T15:00:00.000Z", updatedAt: "2026-08-14T15:00:00.000Z", changeReason: "Initial owner forecast",
};

function economics(deliveryForecast: DeliveryForecast | null): WorkEconomicsRecord {
  return { valueHypothesis: null, deliveryForecast, actualEconomics: null, realizedOutcome: null, forecast: evaluateForecast(deliveryForecast, { state: "active", decision_status: "Decided" }, now) };
}

test("an accepted range produces an on-track forecast with a separate milestone", () => {
  const result = evaluateForecast(forecast, { state: "active", decision_status: "Decided" }, now);
  assert.equal(result.state, "on track");
  assert.equal(result.nextMilestone, "Move to Evaluate / QA");
  assert.match(result.likelyWindow, /Aug 14/);
});

test("missing, stale, and materially changed forecasts never remain green", () => {
  assert.equal(evaluateForecast(null, { state: "active" }, now).state, "unknown");
  assert.equal(evaluateForecast({ ...forecast, updatedAt: "2026-08-12T15:00:00.000Z" }, { state: "active" }, now).state, "at risk");
  const changed = evaluateForecast({ ...forecast, reforecastRequiredReason: "owner changed" }, { state: "active" }, now);
  assert.equal(changed.state, "at risk");
  assert.match(changed.reason, /owner changed/);
});

test("blocked and human-gate waiting time is distinguishable from agent execution", () => {
  assert.match(evaluateForecast(forecast, { state: "blocked", decision_status: "Decided" }, now).reason, /blocked/i);
  assert.match(evaluateForecast(forecast, { state: "active", decision_status: "Needed now" }, now).reason, /human gate/i);
});

test("pull forecast exposes missing owners and never invents a date", () => {
  const result = buildPullForecast([
    { key: "STR-017", state: "active", assignee_name: "Builder", work_economics: economics(forecast) },
    { key: "STR-018", state: "active", assignee_name: "Ops Agent", work_economics: economics(null) },
  ], 2, now);
  assert.equal(result.status, "incomplete");
  assert.equal(result.itemKey, "STR-017");
  assert.deepEqual(result.missingOwners, ["Ops Agent"]);
  assert.equal(result.confidence, "low");
});

test("pull forecast reports immediate capacity below the WIP limit", () => {
  const result = buildPullForecast([{ key: "STR-017", state: "active", assignee_name: "Builder", work_economics: economics(forecast) }], 2, now);
  assert.equal(result.status, "available");
  assert.match(result.headline, /available now/);
});

test("material workflow changes require a reforecast", () => {
  assert.equal(materialForecastChange(["title"]), null);
  assert.match(materialForecastChange(["assigneeId", "phase"]) ?? "", /owner changed, phase changed/);
});

test("server-side authority excludes agents and preserves named human roles", () => {
  assert.equal(workEconomicsAuthorized("deliveryForecast", "agent", "Implementation Agent"), false);
  assert.equal(workEconomicsAuthorized("valueHypothesis", "human", "Product Lead · interim Tech Lead"), true);
  assert.equal(workEconomicsAuthorized("actualEconomics", "human", "Contributor"), false);
  assert.equal(workEconomicsAuthorized("actualEconomics", "human", "Platform / Ops Lead"), true);
});

test("validation rejects person-level scoring and invalid completion ranges", () => {
  assert.match(validateWorkEconomics("actualEconomics", { employeeScore: 5 }) ?? "", /not permitted/);
  const invalid = validateWorkEconomics("deliveryForecast", { ...forecast, earliestCompletion: forecast.latestCompletion, latestCompletion: forecast.earliestCompletion });
  assert.match(invalid ?? "", /earliest–likely–latest/);
});

test("verified outcomes are stamped by the server rather than trusting a client verifier", () => {
  const error = validateWorkEconomics("realizedOutcome", {
    status: "verified positive", observedMetric: "Cycle time", observedResult: "20", unit: "minutes", observationDate: "2026-08-20",
    evidence: "https://example.com/evidence", confidence: "medium", causalLimitations: "Small initial sample",
  });
  assert.equal(error, null);
});

test("available agent telemetry requires provider provenance", () => {
  const error = validateWorkEconomics("actualEconomics", {
    humanRole: "Delivery roles", humanActiveMinutes: 10, attempts: 1, agentExecutionMinutes: 4, queueMinutes: 0,
    blockedMinutes: 0, gateWaitMinutes: 0, cycleMinutes: 14, reworkMinutes: 0, defects: 0, rollbacks: 0,
    telemetrySource: "provider export", completeness: "complete", correctionReason: "Initial actuals",
  });
  assert.match(error ?? "", /provider and model/);
});
