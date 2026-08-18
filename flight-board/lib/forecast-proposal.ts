import type { DeliveryForecast, ServiceLevelDistribution } from "./work-economics";

export type ForecastProposalItem = {
  key: string;
  title: string;
  description: string;
  phase: string;
  gate: string;
  state: string;
  work_type: string;
  next_action: string;
  evidence_url: string | null;
  github_url: string | null;
  blocked_since: string | null;
};

type PhaseDefaults = {
  sizeBand: DeliveryForecast["sizeBand"];
  humanRole: string;
  humanMin: number;
  humanMax: number;
  earliestHours: number;
  likelyHours: number;
  latestHours: number;
};

const phaseDefaults: Record<string, PhaseDefaults> = {
  Sense: { sizeBand: "S", humanRole: "Product Lead", humanMin: 5, humanMax: 20, earliestHours: 1, likelyHours: 4, latestHours: 12 },
  Frame: { sizeBand: "S", humanRole: "Tech Lead", humanMin: 10, humanMax: 30, earliestHours: 2, likelyHours: 8, latestHours: 24 },
  Engineer: { sizeBand: "M", humanRole: "Delivery roles", humanMin: 10, humanMax: 45, earliestHours: 4, likelyHours: 12, latestHours: 36 },
  Evaluate: { sizeBand: "S", humanRole: "Test", humanMin: 10, humanMax: 30, earliestHours: 2, likelyHours: 8, latestHours: 24 },
  Release: { sizeBand: "S", humanRole: "Platform / Ops", humanMin: 5, humanMax: 20, earliestHours: 1, likelyHours: 4, latestHours: 12 },
  Observe: { sizeBand: "S", humanRole: "Observe / Learn", humanMin: 5, humanMax: 20, earliestHours: 4, likelyHours: 24, latestHours: 72 },
  Learn: { sizeBand: "S", humanRole: "Observe / Learn", humanMin: 10, humanMax: 30, earliestHours: 2, likelyHours: 8, latestHours: 24 },
};

function addHours(now: Date, hours: number) {
  const date = new Date(now.getTime() + hours * 60 * 60 * 1_000);
  date.setUTCMinutes(Math.ceil(date.getUTCMinutes() / 15) * 15, 0, 0);
  return date.toISOString();
}

function milestoneFor(item: ForecastProposalItem) {
  if (/Gate 1 pending/i.test(item.gate)) return "Intent Brief and fresh Critic evidence ready";
  if (/Gate 2 pending/i.test(item.gate)) return "Exam and fresh Critic evidence ready";
  if (/Gate 2 passed/i.test(item.gate) && item.phase === "Engineer") return "Implementation evidence ready for independent test";
  if (item.phase === "Evaluate") return "Independent verification and Gate 3 packet ready";
  if (item.phase === "Release") return "Release evidence and rollback check ready";
  return item.next_action.trim() || `${item.phase} milestone ready`;
}

function phaseExitFor(item: ForecastProposalItem) {
  if (/Gate 1 pending/i.test(item.gate)) return "Gate 1 ready for Product Lead review";
  if (/Gate 2 pending/i.test(item.gate)) return "Gate 2 ready for Tech Lead review";
  if (item.phase === "Engineer") return "Moving to Evaluate / independent test";
  if (item.phase === "Evaluate") return "Gate 3 evidence ready for named human review";
  if (item.phase === "Release") return "Release verification ready";
  return `${item.phase} phase exit ready`;
}

export function buildForecastProposal(
  item: ForecastProposalItem,
  serviceLevel: ServiceLevelDistribution | null,
  deliveryOwnerId: string,
  timezone: string,
  nowIso = new Date().toISOString(),
  previous: DeliveryForecast | null = null,
): DeliveryForecast {
  const now = new Date(nowIso);
  const safeNow = Number.isFinite(now.getTime()) ? now : new Date();
  const defaults = phaseDefaults[item.phase] ?? phaseDefaults.Engineer;
  const comparable = Boolean(serviceLevel && serviceLevel.sampleSize >= 5);
  const earliestHours = comparable ? Math.max(0.25, serviceLevel!.lowHours) : defaults.earliestHours;
  const likelyHours = comparable ? Math.max(earliestHours, serviceLevel!.medianHours) : defaults.likelyHours;
  const latestHours = comparable ? Math.max(likelyHours, serviceLevel!.highHours) : defaults.latestHours;
  const createdAt = safeNow.toISOString();
  const nextMilestone = milestoneFor(item);
  const evidence = [item.evidence_url, item.github_url].filter((value): value is string => Boolean(value));
  const omissions = comparable
    ? ["Provider price and runtime load may change before execution."]
    : ["Fewer than five completed same-POD, same-work-type observations are available.", "Provider price and runtime load are not yet authoritative."];
  const blocked = item.state === "blocked";

  return {
    sizeBand: previous?.sizeBand ?? defaults.sizeBand,
    humanEffortRanges: previous?.humanEffortRanges.length
      ? previous.humanEffortRanges
      : [{ role: defaults.humanRole, minMinutes: defaults.humanMin, maxMinutes: defaults.humanMax }],
    agentCostRanges: previous?.agentCostRanges.length
      ? previous.agentCostRanges
      : [{ provider: "Assigned agent runtime", minCost: 0, maxCost: 5, currency: "USD", expectedAttempts: 1 }],
    complexity: previous?.complexity ?? 3,
    uncertainty: previous?.uncertainty ?? (comparable ? 2 : 4),
    coordination: previous?.coordination ?? 3,
    basis: comparable
      ? `STEER Forecast Agent proposal from ${serviceLevel!.sampleSize} completed ${item.work_type} items in this POD; observed median ${serviceLevel!.medianHours} hours and P${serviceLevel!.percentile} range ${serviceLevel!.lowHours}–${serviceLevel!.highHours} hours.`
      : `STEER Forecast Agent expert-judgment proposal for ${item.phase} / ${item.work_type}; intentionally low confidence until a same-POD, same-work-type cohort exists.`,
    basisKind: comparable ? "comparable history" : "expert judgment",
    comparableItems: comparable ? `${serviceLevel!.sampleSize} completed same-POD ${item.work_type} items` : "No qualifying comparable cohort yet",
    serviceLevel: comparable ? {
      podId: serviceLevel!.podId,
      workType: serviceLevel!.workType,
      sampleSize: serviceLevel!.sampleSize,
      percentile: serviceLevel!.percentile,
      lowHours: serviceLevel!.lowHours,
      highHours: serviceLevel!.highHours,
    } : null,
    timezone: timezone || "UTC",
    earliestCompletion: addHours(safeNow, earliestHours),
    likelyCompletion: addHours(safeNow, likelyHours),
    latestCompletion: addHours(safeNow, latestHours),
    confidence: comparable ? "medium" : "low",
    nextMilestone,
    nextMilestoneAt: addHours(safeNow, likelyHours),
    phaseExit: phaseExitFor(item),
    phaseExitAt: addHours(safeNow, latestHours),
    agentWorkCompletedAt: null,
    humanDecisionTargetAt: /pending/i.test(item.gate) ? addHours(safeNow, latestHours + 4) : null,
    blockedSince: blocked ? item.blocked_since ?? createdAt : null,
    unblockOwner: blocked ? "Named delivery owner" : "",
    unblockAction: blocked ? item.next_action : "",
    cannotForecastUntil: blocked ? `Cannot forecast until: ${item.next_action}` : "",
    freshnessHours: 24,
    acceptedBy: "",
    acceptedAt: "",
    updatedAt: createdAt,
    changeReason: previous?.reforecastRequiredReason
      ? `STEER Forecast Agent proposed a reforecast after: ${previous.reforecastRequiredReason}`
      : "STEER Forecast Agent prepared the initial editable proposal; named human owner review is still required.",
    advisory: {
      source: "AI",
      recommendation: `Review and accept or edit the proposed ${defaults.sizeBand} forecast: likely ${likelyHours} hours, range ${earliestHours}–${latestHours} hours, with ${comparable ? "medium" : "low"} confidence.`,
      confidence: comparable ? "medium" : "low",
      drivers: [item.phase, item.work_type, nextMilestone, comparable ? `${serviceLevel!.sampleSize} comparable items` : "expert judgment"],
      evidence,
      omissions,
      createdAt,
    },
    acceptanceState: "proposed",
    deliveryOwnerId,
  };
}
