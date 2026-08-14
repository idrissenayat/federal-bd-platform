export type Confidence = "low" | "medium" | "high";
export type ForecastState = "on track" | "at risk" | "late" | "unknown";

export type ValueHypothesis = {
  primaryType: string;
  beneficiary: string;
  outcomeMetric: string;
  baseline: string;
  target: string;
  unit: string;
  observationDate: string;
  outcomeOwner: string;
  impact: string;
  timeCriticality: string;
  strategicAlignment: string;
  confidence: Confidence;
  evidence: string;
  advisory: boolean;
};

export type DeliveryForecast = {
  sizeBand: "XS" | "S" | "M" | "L" | "XL";
  humanRole: string;
  humanMinutesMin: number;
  humanMinutesMax: number;
  agentCostMin: number;
  agentCostMax: number;
  currency: string;
  expectedAttempts: number;
  complexity: number;
  uncertainty: number;
  coordination: number;
  basis: string;
  comparableItems: string;
  timezone: string;
  earliestCompletion: string;
  likelyCompletion: string;
  latestCompletion: string;
  confidence: Confidence;
  nextMilestone: string;
  nextMilestoneAt: string;
  phaseExit: string;
  phaseExitAt: string;
  freshnessHours: number;
  acceptedBy: string;
  acceptedAt: string;
  updatedAt: string;
  changeReason: string;
  reforecastRequiredReason?: string;
  reforecastRequiredAt?: string;
};

export type ActualEconomics = {
  humanRole: string;
  humanActiveMinutes: number;
  provider: string;
  model: string;
  attempts: number;
  inputTokens: number | null;
  outputTokens: number | null;
  meteredCost: number | null;
  currency: string;
  agentExecutionMinutes: number;
  queueMinutes: number;
  blockedMinutes: number;
  gateWaitMinutes: number;
  cycleMinutes: number;
  reworkMinutes: number;
  defects: number;
  rollbacks: number;
  telemetrySource: string;
  completeness: "complete" | "partial" | "missing";
  correctedBy: string;
  correctedAt: string;
  correctionReason: string;
};

export type RealizedOutcome = {
  status: "not due" | "pending evidence" | "verified positive" | "verified neutral" | "verified negative" | "inconclusive";
  observedMetric: string;
  observedResult: string;
  unit: string;
  observationDate: string;
  verifier: string;
  evidence: string;
  confidence: Confidence;
  causalLimitations: string;
  verifiedAt: string;
};

export type ForecastEvaluation = {
  state: ForecastState;
  reason: string;
  stale: boolean;
  likelyWindow: string;
  nextMilestone: string;
  nextMilestoneAt: string;
  confidence: Confidence | "unknown";
  lastUpdatedAt: string | null;
};

export type WorkEconomicsRecord = {
  valueHypothesis: ValueHypothesis | null;
  deliveryForecast: DeliveryForecast | null;
  actualEconomics: ActualEconomics | null;
  realizedOutcome: RealizedOutcome | null;
  forecast: ForecastEvaluation;
};

export type PullForecast = {
  status: "available" | "forecast" | "incomplete";
  headline: string;
  detail: string;
  itemKey: string | null;
  earliest: string | null;
  likely: string | null;
  latest: string | null;
  confidence: Confidence | "unknown";
  missingOwners: string[];
  updatedAt: string | null;
};

type ForecastableItem = {
  key: string;
  state: string;
  assignee_name?: string | null;
  work_economics: WorkEconomicsRecord;
};

function objectFromJson<T>(value: unknown): T | null {
  if (!value) return null;
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as T : null;
  } catch {
    return null;
  }
}

function time(value: string | null | undefined) {
  const parsed = value ? new Date(value).getTime() : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function shortDateTime(value: string) {
  const parsed = time(value);
  if (parsed === null) return "Unknown";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(parsed);
}

export function evaluateForecast(
  forecast: DeliveryForecast | null,
  item: { state?: unknown; decision_status?: unknown; blocked_since?: unknown },
  nowIso = new Date().toISOString(),
): ForecastEvaluation {
  if (!forecast) return { state: "unknown", reason: "Owner forecast is missing.", stale: true, likelyWindow: "Unknown", nextMilestone: "Forecast required", nextMilestoneAt: "", confidence: "unknown", lastUpdatedAt: null };
  const earliest = time(forecast.earliestCompletion);
  const likely = time(forecast.likelyCompletion);
  const latest = time(forecast.latestCompletion);
  const milestone = time(forecast.nextMilestoneAt);
  const updated = time(forecast.updatedAt);
  const now = time(nowIso) ?? Date.now();
  const rangeValid = earliest !== null && likely !== null && latest !== null && earliest <= likely && likely <= latest;
  if (!rangeValid || !forecast.nextMilestone.trim() || milestone === null || updated === null) {
    return { state: "unknown", reason: "Completion range, milestone, or update time is incomplete.", stale: true, likelyWindow: "Unknown", nextMilestone: forecast.nextMilestone || "Forecast required", nextMilestoneAt: forecast.nextMilestoneAt || "", confidence: forecast.confidence ?? "unknown", lastUpdatedAt: forecast.updatedAt || null };
  }
  const freshnessMs = Math.max(1, forecast.freshnessHours || 24) * 3_600_000;
  const stale = now - updated > freshnessMs || now > milestone;
  const state = String(item.state ?? "");
  const decision = String(item.decision_status ?? "");
  let forecastState: ForecastState = "on track";
  let reason = `Likely completion ${shortDateTime(forecast.likelyCompletion)}.`;
  if (forecast.reforecastRequiredReason) {
    forecastState = "at risk";
    reason = `Reforecast required: ${forecast.reforecastRequiredReason}`;
  } else if (state === "blocked") {
    forecastState = "at risk";
    reason = "Work is blocked; the owner must revise the completion window or name the dependency.";
  } else if (["Needed now", "Resubmitted"].includes(decision)) {
    forecastState = "at risk";
    reason = "Agent work is waiting for a human gate decision; the decision target remains separate.";
  } else if (now > latest) {
    forecastState = "late";
    reason = `Latest forecast passed ${shortDateTime(forecast.latestCompletion)}.`;
  } else if (now > likely || stale) {
    forecastState = "at risk";
    reason = stale ? "Forecast is stale or its next milestone target has passed." : `Likely completion passed ${shortDateTime(forecast.likelyCompletion)}.`;
  }
  return {
    state: forecastState,
    reason,
    stale,
    likelyWindow: `${shortDateTime(forecast.earliestCompletion)} – ${shortDateTime(forecast.latestCompletion)}`,
    nextMilestone: forecast.nextMilestone,
    nextMilestoneAt: forecast.nextMilestoneAt,
    confidence: forecast.confidence,
    lastUpdatedAt: forecast.updatedAt,
  };
}

export function workEconomicsFromRow(row: Record<string, unknown>, nowIso = new Date().toISOString()): WorkEconomicsRecord {
  const deliveryForecast = objectFromJson<DeliveryForecast>(row.delivery_forecast_json);
  return {
    valueHypothesis: objectFromJson<ValueHypothesis>(row.value_hypothesis_json),
    deliveryForecast,
    actualEconomics: objectFromJson<ActualEconomics>(row.actual_economics_json),
    realizedOutcome: objectFromJson<RealizedOutcome>(row.realized_outcome_json),
    forecast: evaluateForecast(deliveryForecast, row, nowIso),
  };
}

export function buildPullForecast(items: ForecastableItem[], wipLimit = 2, nowIso = new Date().toISOString()): PullForecast {
  const inFlight = items.filter((item) => ["active", "blocked"].includes(item.state));
  if (inFlight.length < wipLimit) {
    return { status: "available", headline: `${wipLimit - inFlight.length} WIP slot${wipLimit - inFlight.length === 1 ? "" : "s"} available now`, detail: "Pull the highest-priority ready item only after confirming role capacity.", itemKey: null, earliest: nowIso, likely: nowIso, latest: nowIso, confidence: "high", missingOwners: [], updatedAt: nowIso };
  }
  const missing = inFlight.filter((item) => item.work_economics.forecast.state === "unknown" || !item.work_economics.deliveryForecast);
  const candidates = inFlight
    .filter((item) => item.work_economics.deliveryForecast && item.work_economics.forecast.state !== "unknown")
    .sort((a, b) => (time(a.work_economics.deliveryForecast?.likelyCompletion) ?? Number.POSITIVE_INFINITY) - (time(b.work_economics.deliveryForecast?.likelyCompletion) ?? Number.POSITIVE_INFINITY));
  const candidate = candidates[0];
  const missingOwners = [...new Set(missing.map((item) => item.assignee_name?.trim() || `${item.key} owner`))];
  if (!candidate) {
    return { status: "incomplete", headline: "Next WIP slot cannot be forecast", detail: `Forecasts are missing for ${missing.map((item) => item.key).join(", ") || "active work"}.`, itemKey: null, earliest: null, likely: null, latest: null, confidence: "unknown", missingOwners, updatedAt: null };
  }
  const forecast = candidate.work_economics.deliveryForecast!;
  return {
    status: missing.length ? "incomplete" : "forecast",
    headline: `Next slot likely when ${candidate.key} completes`,
    detail: missing.length ? `Range is provisional because ${missing.map((item) => item.key).join(", ")} still need owner forecasts.` : `Earliest ${shortDateTime(forecast.earliestCompletion)} · likely ${shortDateTime(forecast.likelyCompletion)} · latest ${shortDateTime(forecast.latestCompletion)}.`,
    itemKey: candidate.key,
    earliest: forecast.earliestCompletion,
    likely: forecast.likelyCompletion,
    latest: forecast.latestCompletion,
    confidence: missing.length ? "low" : forecast.confidence,
    missingOwners,
    updatedAt: forecast.updatedAt,
  };
}

export function materialForecastChange(keys: string[]) {
  const labels: Record<string, string> = { phase: "phase changed", state: "state changed", assigneeId: "owner changed", nextAction: "next action changed", evidenceUrl: "evidence changed", priority: "priority changed", workflow: "workflow changed" };
  const changes = keys.filter((key) => key in labels).map((key) => labels[key]);
  return changes.length ? changes.join(", ") : null;
}

export function serializeSection(section: string, value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${section} must be an object.`);
  return JSON.stringify(value);
}
