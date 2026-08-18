export type Confidence = "low" | "medium" | "high";
export type ForecastState = "on track" | "at risk" | "late" | "unknown";

export const WORK_TYPES = [
  "Product feature",
  "Platform capability",
  "Defect correction",
  "Research / discovery",
  "Operations / infrastructure",
  "Governance / process",
  "Unclassified",
] as const;
export type WorkType = typeof WORK_TYPES[number];

export type AiAdvisory = {
  source: "AI";
  recommendation: string;
  confidence: Confidence;
  drivers: string[];
  evidence: string[];
  omissions: string[];
  createdAt: string;
};

export type HumanAcceptanceState = "no proposal" | "proposed" | "human accepted" | "human edited";

export type ValueHypothesis = {
  primaryType: string;
  beneficiary: string;
  outcomeMetric: string;
  baseline: string;
  target: string;
  unit: string;
  observationDate: string;
  outcomeOwner: string;
  outcomeOwnerId: string;
  impact: string;
  timeCriticality: string;
  strategicAlignment: string;
  confidence: Confidence;
  evidence: string;
  evidenceStatus: "verified" | "unverified";
  evidenceRevision: string;
  evidenceSha256: string;
  evidenceVerifiedAt: string;
  valueMode: "monetary" | "non-monetary";
  assumptions: string;
  currency?: string;
  period?: string;
  advisory: AiAdvisory | null;
  acceptanceState: HumanAcceptanceState;
  acceptedBy: string;
  acceptedAt: string;
};

export type HumanEffortRange = { role: string; minMinutes: number; maxMinutes: number };
export type AgentCostRange = { provider: string; minCost: number; maxCost: number; currency: string; expectedAttempts: number };

export type DeliveryForecast = {
  sizeBand: "XS" | "S" | "M" | "L" | "XL";
  humanEffortRanges: HumanEffortRange[];
  agentCostRanges: AgentCostRange[];
  complexity: number;
  uncertainty: number;
  coordination: number;
  basis: string;
  basisKind: "expert judgment" | "comparable history";
  comparableItems: string;
  serviceLevel: { podId: string; workType: string; sampleSize: number; percentile: number; lowHours: number; highHours: number } | null;
  timezone: string;
  earliestCompletion: string;
  likelyCompletion: string;
  latestCompletion: string;
  confidence: Confidence;
  nextMilestone: string;
  nextMilestoneAt: string;
  phaseExit: string;
  phaseExitAt: string;
  agentWorkCompletedAt: string | null;
  humanDecisionTargetAt: string | null;
  blockedSince: string | null;
  unblockOwner: string;
  unblockAction: string;
  cannotForecastUntil: string;
  freshnessHours: number;
  acceptedBy: string;
  acceptedAt: string;
  updatedAt: string;
  changeReason: string;
  advisory: AiAdvisory | null;
  acceptanceState: HumanAcceptanceState;
  deliveryOwnerId: string;
  reforecastRequiredReason?: string;
  reforecastRequiredAt?: string;
};

export type ActualEconomics = {
  humanRoleTotals: Array<{ role: string; activeMinutes: number }>;
  agentTelemetry: Array<{
    eventId: string;
    provider: string;
    model: string;
    attempts: number;
    inputTokens: number | null;
    outputTokens: number | null;
    meteredCost: number | null;
    currency: string;
    executionMinutes: number;
    source: string;
    completeness: "complete" | "partial" | "missing";
    observedAt: string;
    ingestionState: "accepted" | "late" | "conflict";
    conflictReason: string;
  }>;
  durationFacts: {
    agentExecutionMinutes: number;
    queueMinutes: number;
    blockedMinutes: number;
    gateWaitMinutes: number;
    cycleMinutes: number;
  };
  reworkEvents: Array<{ originatingPhase: string; minutes: number; reason: string }>;
  defectEvents: Array<{ severity: string; count: number }>;
  rollbackEvents: Array<{ reason: string; occurredAt: string }>;
  telemetrySource: string;
  completeness: "complete" | "partial" | "missing";
  completionAt: string | null;
  likelyVarianceMinutes: number | null;
  correctedBy: string;
  correctedAt: string;
  correctionReason: string;
  advisory: AiAdvisory | null;
  acceptanceState: HumanAcceptanceState;
};

export type RealizedOutcome = {
  status: "not due" | "pending evidence" | "verified positive" | "verified neutral" | "verified negative" | "inconclusive";
  observedMetric: string;
  observedResult: string;
  unit: string;
  observationDate: string;
  verifier: string;
  evidence: string;
  evidenceRevision: string;
  evidenceSha256: string;
  evidenceVerifiedAt: string;
  confidence: Confidence;
  causalLimitations: string;
  verifiedAt: string;
  outcomeOwnerId: string;
  advisory: AiAdvisory | null;
  acceptanceState: HumanAcceptanceState;
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
  contributors: Array<{ itemKey: string; owner: string; earliest: string | null; likely: string | null; latest: string | null; nextMilestone: string; nextMilestoneAt: string | null; updatedAt: string | null; confidence: Confidence | "unknown"; state: ForecastState }>;
};

export type ServiceLevelDistribution = { podId: string; workType: string; sampleSize: number; percentile: number; lowHours: number; medianHours: number; highHours: number };

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
    reason = forecast.agentWorkCompletedAt && forecast.humanDecisionTargetAt
      ? `Agent work completed ${shortDateTime(forecast.agentWorkCompletedAt)}; human decision target ${shortDateTime(forecast.humanDecisionTargetAt)} remains separate from overall completion.`
      : "Human gate wait is missing an agent-complete timestamp or human decision target; the named owner must update both before this can be on track.";
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
  const contributors = inFlight.map((item) => ({
    itemKey: item.key,
    owner: item.assignee_name?.trim() || `${item.key} owner`,
    earliest: item.work_economics.deliveryForecast?.earliestCompletion ?? null,
    likely: item.work_economics.deliveryForecast?.likelyCompletion ?? null,
    latest: item.work_economics.deliveryForecast?.latestCompletion ?? null,
    nextMilestone: item.work_economics.forecast.nextMilestone,
    nextMilestoneAt: item.work_economics.forecast.nextMilestoneAt || null,
    updatedAt: item.work_economics.forecast.lastUpdatedAt,
    confidence: item.work_economics.forecast.confidence,
    state: item.work_economics.forecast.state,
  }));
  if (inFlight.length < wipLimit) {
    return { status: "available", headline: `${wipLimit - inFlight.length} WIP slot${wipLimit - inFlight.length === 1 ? "" : "s"} available now`, detail: "Pull the highest-priority ready item only after confirming role capacity.", itemKey: null, earliest: nowIso, likely: nowIso, latest: nowIso, confidence: "high", missingOwners: [], updatedAt: nowIso, contributors };
  }
  const missing = inFlight.filter((item) => item.work_economics.forecast.state === "unknown" || !item.work_economics.deliveryForecast);
  const candidates = inFlight
    .filter((item) => item.work_economics.deliveryForecast && item.work_economics.forecast.state !== "unknown")
    .sort((a, b) => (time(a.work_economics.deliveryForecast?.likelyCompletion) ?? Number.POSITIVE_INFINITY) - (time(b.work_economics.deliveryForecast?.likelyCompletion) ?? Number.POSITIVE_INFINITY));
  const candidate = candidates[0];
  const missingOwners = [...new Set(missing.map((item) => item.assignee_name?.trim() || `${item.key} owner`))];
  if (!candidate) {
    return { status: "incomplete", headline: "Next WIP slot cannot be forecast", detail: `Forecasts are missing for ${missing.map((item) => item.key).join(", ") || "active work"}.`, itemKey: null, earliest: null, likely: null, latest: null, confidence: "unknown", missingOwners, updatedAt: null, contributors };
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
    contributors,
  };
}

export function materialForecastChange(keys: string[]) {
  const labels: Record<string, string> = { title: "scope title changed", description: "scope description changed", phase: "phase changed", state: "state or blocker changed", assigneeId: "owner changed", nextAction: "expected milestone changed", evidenceUrl: "dependency or test evidence changed", priority: "priority changed", workflow: "workflow changed", workType: "work type changed", gate: "gate decision changed", testResult: "test result changed", dependency: "dependency changed", blocker: "blocker changed" };
  const changes = keys.filter((key) => key in labels).map((key) => labels[key]);
  return changes.length ? changes.join(", ") : null;
}

export function completionVarianceMinutes(forecast: DeliveryForecast | null, completedAt: string) {
  const likely = time(forecast?.likelyCompletion);
  const completed = time(completedAt);
  return likely === null || completed === null ? null : Math.round((completed - likely) / 60_000);
}

export function buildServiceLevelDistributions(items: Array<{ pod_id?: unknown; work_type?: unknown; work_economics: WorkEconomicsRecord }>): ServiceLevelDistribution[] {
  const cohorts = new Map<string, number[]>();
  for (const item of items) {
    const cycleMinutes = item.work_economics.actualEconomics?.durationFacts.cycleMinutes;
    if (typeof cycleMinutes !== "number" || !Number.isFinite(cycleMinutes) || cycleMinutes < 0 || !item.work_economics.actualEconomics?.completionAt) continue;
    const podId = String(item.pod_id ?? "steer-flight-team");
    const workType = String(item.work_type ?? "Unclassified");
    if (!WORK_TYPES.includes(workType as WorkType) || workType === "Unclassified") continue;
    const key = `${podId}\u0000${workType}`;
    cohorts.set(key, [...(cohorts.get(key) ?? []), cycleMinutes / 60]);
  }
  const quantile = (sorted: number[], fraction: number) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1))];
  return [...cohorts.entries()].filter(([, values]) => values.length >= 5).map(([key, values]) => {
    const [podId, workType] = key.split("\u0000");
    const sorted = [...values].sort((a, b) => a - b);
    return { podId, workType, sampleSize: sorted.length, percentile: 85, lowHours: quantile(sorted, 0.15), medianHours: quantile(sorted, 0.5), highHours: quantile(sorted, 0.85) };
  });
}

export function serializeSection(section: string, value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${section} must be an object.`);
  return JSON.stringify(value);
}
