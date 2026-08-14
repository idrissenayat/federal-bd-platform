import type { ActualEconomics, DeliveryForecast, RealizedOutcome, ValueHypothesis } from "./work-economics";

export type WorkEconomicsSection = "valueHypothesis" | "deliveryForecast" | "actualEconomics" | "realizedOutcome";

type ValidationResult = { error: string | null; value: Record<string, unknown> | null };

const confidence = new Set(["low", "medium", "high"]);
const acceptanceStates = new Set(["no proposal", "proposed", "human accepted", "human edited"]);
const allowedAggregateRoles = new Set([
  "Product Lead", "Tech Lead", "Delivery", "Delivery roles", "Product Designer", "Platform / Ops",
  "Security", "Privacy / Legal", "Observe / Learn", "Builder", "Test", "Critic", "Documentation", "Operations", "Architecture",
]);
const personKey = /person|employee|email|individual|ranking|rank|score|compensation|utilization|productivity/i;
const emailValue = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

function ownKeys(value: Record<string, unknown>, allowed: readonly string[], path: string) {
  const unexpected = Object.keys(value).find((key) => !allowed.includes(key));
  return unexpected ? `${path}.${unexpected} is not an allowed field.` : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function present(value: unknown) {
  return typeof value === "string" ? value.trim().length > 0 : value !== null && value !== undefined;
}

function nonNegative(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function validIso(value: unknown) {
  return typeof value === "string" && value.length > 0 && Number.isFinite(new Date(value).getTime());
}

function validEvidenceUrl(value: unknown) {
  try {
    const parsed = new URL(String(value));
    return ["https:", "http:"].includes(parsed.protocol) && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function privacyBoundary(value: unknown, path = "record"): string | null {
  if (typeof value === "string") {
    if (emailValue.test(value)) return `${path} contains an email address; Work Economics stores role/POD aggregates only.`;
    return null;
  }
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const error = privacyBoundary(value[index], `${path}[${index}]`);
      if (error) return error;
    }
    return null;
  }
  if (isRecord(value)) {
    for (const [key, nested] of Object.entries(value)) {
      if (personKey.test(key)) return `${path}.${key} is a person-level or ranking field and is not permitted.`;
      const error = privacyBoundary(nested, `${path}.${key}`);
      if (error) return error;
    }
  }
  return null;
}

function validateStringArray(value: unknown, path: string) {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) return `${path} must be a string array.`;
  return null;
}

function validateAdvisory(value: unknown, path: string) {
  if (value === null) return null;
  if (!isRecord(value)) return `${path} must be null or a structured AI advisory.`;
  const keyError = ownKeys(value, ["source", "recommendation", "confidence", "drivers", "evidence", "omissions", "createdAt"], path);
  if (keyError) return keyError;
  if (value.source !== "AI" || !present(value.recommendation) || !confidence.has(String(value.confidence)) || !validIso(value.createdAt)) return `${path} must identify AI source, recommendation, confidence, and creation time.`;
  return validateStringArray(value.drivers, `${path}.drivers`) || validateStringArray(value.evidence, `${path}.evidence`) || validateStringArray(value.omissions, `${path}.omissions`);
}

function requireFields(value: Record<string, unknown>, fields: string[], label: string) {
  const missing = fields.filter((key) => !present(value[key]));
  return missing.length ? `Complete the ${label}: ${missing.join(", ")}.` : null;
}

function validateValue(value: Record<string, unknown>): string | null {
  const keys = ["primaryType", "beneficiary", "outcomeMetric", "baseline", "target", "unit", "observationDate", "outcomeOwner", "outcomeOwnerId", "impact", "timeCriticality", "strategicAlignment", "confidence", "evidence", "evidenceStatus", "evidenceRevision", "evidenceSha256", "evidenceVerifiedAt", "valueMode", "assumptions", "currency", "period", "advisory", "acceptanceState", "acceptedBy", "acceptedAt"];
  const keyError = ownKeys(value, keys, "valueHypothesis");
  if (keyError) return keyError;
  const missing = requireFields(value, ["primaryType", "beneficiary", "outcomeMetric", "baseline", "target", "unit", "observationDate", "outcomeOwner", "outcomeOwnerId", "impact", "timeCriticality", "strategicAlignment", "confidence", "evidence", "evidenceStatus", "evidenceRevision", "evidenceSha256", "evidenceVerifiedAt", "valueMode", "assumptions"], "value hypothesis");
  if (missing) return missing;
  const valueTypes = ["revenue or mission enablement", "user/customer outcome", "time or operating-cost reduction", "risk, security, compliance, or reliability improvement", "learning or option value", "platform capability or reuse"];
  if (!valueTypes.includes(String(value.primaryType))) return "Choose a supported primary value type.";
  if (![value.impact, value.timeCriticality, value.strategicAlignment].every((band) => ["Low", "Medium", "High"].includes(String(band)))) return "Impact, time criticality, and strategic alignment must use Low, Medium, or High.";
  if (!confidence.has(String(value.confidence))) return "Value confidence must be low, medium, or high.";
  if (!validEvidenceUrl(value.evidence) || value.evidenceStatus !== "verified" || !/^[a-f0-9]{40}$/i.test(String(value.evidenceRevision)) || !/^[a-f0-9]{64}$/i.test(String(value.evidenceSha256)) || !validIso(value.evidenceVerifiedAt)) return "Value evidence must carry a server-verified URL, immutable revision, fingerprint, and verification time.";
  if (!validIso(value.observationDate)) return "Observation date must be a valid date.";
  if (!acceptanceStates.has(String(value.acceptanceState))) return "Choose a valid human acceptance state.";
  if (!["monetary", "non-monetary"].includes(String(value.valueMode))) return "Value mode must explicitly be monetary or non-monetary.";
  const monetaryLanguage = /\b(?:usd|u\.?s\.?\s*dollars?|dollars?|currency|revenue|cost(?:s| savings?)?|savings?|money)\b/i;
  if (value.valueMode !== "monetary" && monetaryLanguage.test(`${String(value.unit)} ${String(value.outcomeMetric)} ${String(value.primaryType)}`)) {
    return "Monetary value language requires valueMode monetary plus currency, period, and visible assumptions.";
  }
  const monetary = value.valueMode === "monetary";
  if (monetary && (!present(value.currency) || !present(value.period) || !present(value.assumptions))) return "Monetary value requires currency, period, and visible assumptions.";
  return validateAdvisory(value.advisory ?? null, "valueHypothesis.advisory");
}

function validateDelivery(value: Record<string, unknown>): string | null {
  const keys = ["sizeBand", "humanEffortRanges", "agentCostRanges", "complexity", "uncertainty", "coordination", "basis", "basisKind", "comparableItems", "serviceLevel", "timezone", "earliestCompletion", "likelyCompletion", "latestCompletion", "confidence", "nextMilestone", "nextMilestoneAt", "phaseExit", "phaseExitAt", "agentWorkCompletedAt", "humanDecisionTargetAt", "blockedSince", "unblockOwner", "unblockAction", "cannotForecastUntil", "freshnessHours", "acceptedBy", "acceptedAt", "updatedAt", "changeReason", "reforecastRequiredReason", "reforecastRequiredAt", "advisory", "acceptanceState", "deliveryOwnerId"];
  const keyError = ownKeys(value, keys, "deliveryForecast");
  if (keyError) return keyError;
  const missing = requireFields(value, ["sizeBand", "humanEffortRanges", "agentCostRanges", "basis", "basisKind", "timezone", "earliestCompletion", "likelyCompletion", "latestCompletion", "confidence", "nextMilestone", "nextMilestoneAt", "phaseExit", "phaseExitAt", "changeReason", "acceptanceState", "deliveryOwnerId"], "delivery forecast");
  if (missing) return missing;
  if (!Array.isArray(value.humanEffortRanges) || value.humanEffortRanges.length === 0) return "At least one role-level human effort range is required.";
  for (const [index, entry] of value.humanEffortRanges.entries()) {
    if (!isRecord(entry)) return `humanEffortRanges[${index}] must be an object.`;
    const error = ownKeys(entry, ["role", "minMinutes", "maxMinutes"], `humanEffortRanges[${index}]`);
    if (error) return error;
    if (!allowedAggregateRoles.has(String(entry.role))) return `humanEffortRanges[${index}].role must be an approved aggregate role.`;
    if (!nonNegative(entry.minMinutes) || !nonNegative(entry.maxMinutes) || Number(entry.minMinutes) > Number(entry.maxMinutes)) return `humanEffortRanges[${index}] must contain a valid min/max range.`;
  }
  if (!Array.isArray(value.agentCostRanges) || value.agentCostRanges.length === 0) return "At least one provider-level agent cost range is required.";
  for (const [index, entry] of value.agentCostRanges.entries()) {
    if (!isRecord(entry)) return `agentCostRanges[${index}] must be an object.`;
    const error = ownKeys(entry, ["provider", "minCost", "maxCost", "currency", "expectedAttempts"], `agentCostRanges[${index}]`);
    if (error) return error;
    if (![entry.provider, entry.currency].every(present) || !nonNegative(entry.minCost) || !nonNegative(entry.maxCost) || !nonNegative(entry.expectedAttempts) || !Number.isInteger(entry.expectedAttempts) || Number(entry.minCost) > Number(entry.maxCost)) return `agentCostRanges[${index}] must contain provider, currency, integer attempts, and a valid min/max range.`;
  }
  if (!["XS", "S", "M", "L", "XL"].includes(String(value.sizeBand))) return "Size band must be XS, S, M, L, or XL.";
  if (![value.complexity, value.uncertainty, value.coordination].every((band) => [1, 2, 3, 4, 5].includes(Number(band)))) return "Complexity, uncertainty, and coordination must each use the 1–5 rubric.";
  const dates = [value.earliestCompletion, value.likelyCompletion, value.latestCompletion].map((entry) => validIso(entry) ? new Date(String(entry)).getTime() : Number.NaN);
  if (!dates.every(Number.isFinite) || dates[0] > dates[1] || dates[1] > dates[2]) return "Completion timestamps must form a valid earliest–likely–latest range.";
  if (!validIso(value.nextMilestoneAt) || !validIso(value.phaseExitAt)) return "Milestone and phase-exit targets must be valid timestamps.";
  if (!confidence.has(String(value.confidence))) return "Forecast confidence must be low, medium, or high.";
  if (value.basisKind === "expert judgment" && value.confidence !== "low") return "Expert-judgment forecasts must use low confidence until a comparable cohort exists.";
  if (value.basisKind === "comparable history") {
    if (!isRecord(value.serviceLevel)) return "Comparable-history forecasts require a same-POD/work-type service-level distribution.";
    const error = ownKeys(value.serviceLevel, ["podId", "workType", "sampleSize", "percentile", "lowHours", "highHours"], "deliveryForecast.serviceLevel");
    if (error) return error;
    if (![value.serviceLevel.podId, value.serviceLevel.workType].every(present) || !nonNegative(value.serviceLevel.sampleSize) || Number(value.serviceLevel.sampleSize) < 5 || !nonNegative(value.serviceLevel.percentile) || !nonNegative(value.serviceLevel.lowHours) || !nonNegative(value.serviceLevel.highHours)) return "Comparable history requires at least five same-POD/work-type observations and a visible distribution.";
  } else if (value.basisKind !== "expert judgment") return "Basis kind must be expert judgment or comparable history.";
  if (value.blockedSince && (!present(value.unblockOwner) || !present(value.unblockAction) || (!present(value.cannotForecastUntil) && !validIso(value.latestCompletion)))) return "Blocked forecasts require unblock owner/action and a revised window or explicit cannot-forecast dependency.";
  if (!acceptanceStates.has(String(value.acceptanceState))) return "Choose a valid human acceptance state.";
  return validateAdvisory(value.advisory ?? null, "deliveryForecast.advisory");
}

function validateActual(value: Record<string, unknown>): string | null {
  const keys = ["humanRoleTotals", "agentTelemetry", "durationFacts", "reworkEvents", "defectEvents", "rollbackEvents", "telemetrySource", "completeness", "completionAt", "likelyVarianceMinutes", "correctedBy", "correctedAt", "correctionReason", "advisory", "acceptanceState"];
  const keyError = ownKeys(value, keys, "actualEconomics");
  if (keyError) return keyError;
  if (!Array.isArray(value.humanRoleTotals) || !Array.isArray(value.agentTelemetry) || !isRecord(value.durationFacts) || !Array.isArray(value.reworkEvents) || !Array.isArray(value.defectEvents) || !Array.isArray(value.rollbackEvents)) return "Actuals require queryable role totals, provider telemetry, durations, rework, defects, and rollbacks.";
  for (const [index, entry] of value.humanRoleTotals.entries()) {
    if (!isRecord(entry)) return `humanRoleTotals[${index}] must be an object.`;
    const error = ownKeys(entry, ["role", "activeMinutes"], `humanRoleTotals[${index}]`);
    if (error) return error;
    if (!allowedAggregateRoles.has(String(entry.role)) || !nonNegative(entry.activeMinutes)) return `humanRoleTotals[${index}] must use an approved aggregate role and non-negative minutes.`;
  }
  const telemetryIds = new Set<string>();
  for (const [index, entry] of value.agentTelemetry.entries()) {
    if (!isRecord(entry)) return `agentTelemetry[${index}] must be an object.`;
    const error = ownKeys(entry, ["eventId", "provider", "model", "attempts", "inputTokens", "outputTokens", "meteredCost", "currency", "executionMinutes", "source", "completeness", "observedAt", "ingestionState", "conflictReason"], `agentTelemetry[${index}]`);
    if (error) return error;
    if (!present(entry.eventId) || telemetryIds.has(String(entry.eventId))) return `agentTelemetry[${index}] requires a unique eventId.`;
    telemetryIds.add(String(entry.eventId));
    if (![entry.provider, entry.model, entry.source, entry.currency].every(present) || !validIso(entry.observedAt)) return `agentTelemetry[${index}] requires provider, model, currency, source, and observation time.`;
    if (!nonNegative(entry.attempts) || !Number.isInteger(entry.attempts) || !nonNegative(entry.executionMinutes)) return `agentTelemetry[${index}] attempts must be a non-negative integer and duration must be non-negative.`;
    for (const key of ["inputTokens", "outputTokens"] as const) if (entry[key] !== null && (!nonNegative(entry[key]) || !Number.isInteger(entry[key]))) return `agentTelemetry[${index}].${key} must be missing or a non-negative integer.`;
    if (entry.meteredCost !== null && !nonNegative(entry.meteredCost)) return `agentTelemetry[${index}].meteredCost must be missing or non-negative.`;
    if (!["complete", "partial", "missing"].includes(String(entry.completeness)) || !["accepted", "late", "conflict"].includes(String(entry.ingestionState))) return `agentTelemetry[${index}] has an invalid completeness or ingestion state.`;
    if (entry.ingestionState === "conflict" && !present(entry.conflictReason)) return `agentTelemetry[${index}] conflicts require a reason and must not overwrite accepted facts.`;
  }
  const durationError = ownKeys(value.durationFacts, ["agentExecutionMinutes", "queueMinutes", "blockedMinutes", "gateWaitMinutes", "cycleMinutes"], "actualEconomics.durationFacts");
  if (durationError) return durationError;
  if (Object.values(value.durationFacts).some((entry) => !nonNegative(entry))) return "Duration facts must be non-negative and keep work, queue, blocker, and gate waits separate.";
  for (const [name, entries, allowed] of [["reworkEvents", value.reworkEvents, ["originatingPhase", "minutes", "reason"]], ["defectEvents", value.defectEvents, ["severity", "count"]], ["rollbackEvents", value.rollbackEvents, ["reason", "occurredAt"]]] as const) {
    for (const [index, entry] of entries.entries()) {
      if (!isRecord(entry)) return `${name}[${index}] must be an object.`;
      const error = ownKeys(entry, allowed, `${name}[${index}]`);
      if (error) return error;
      if (name === "reworkEvents" && (![entry.originatingPhase, entry.reason].every(present) || !nonNegative(entry.minutes))) return `${name}[${index}] requires phase, non-negative minutes, and reason.`;
      if (name === "defectEvents" && (!present(entry.severity) || !nonNegative(entry.count) || !Number.isInteger(entry.count))) return `${name}[${index}] requires severity and a non-negative integer count.`;
      if (name === "rollbackEvents" && (!present(entry.reason) || !validIso(entry.occurredAt))) return `${name}[${index}] requires reason and a valid timestamp.`;
    }
  }
  if (!present(value.telemetrySource) || !["complete", "partial", "missing"].includes(String(value.completeness)) || !present(value.correctionReason)) return "Actuals require provenance, completeness, and an audit reason.";
  if (value.completionAt !== null && !validIso(value.completionAt)) return "Completion time must be null or an authoritative timestamp.";
  if (value.likelyVarianceMinutes !== null && (typeof value.likelyVarianceMinutes !== "number" || !Number.isFinite(value.likelyVarianceMinutes))) return "Completion variance must be null or a server-derived number.";
  if (!acceptanceStates.has(String(value.acceptanceState))) return "Actual correction requires a valid human acceptance state.";
  const advisoryError = validateAdvisory(value.advisory ?? null, "actualEconomics.advisory");
  if (advisoryError) return advisoryError;
  return null;
}

function validateOutcome(value: Record<string, unknown>): string | null {
  const keys = ["status", "observedMetric", "observedResult", "unit", "observationDate", "verifier", "evidence", "evidenceRevision", "evidenceSha256", "evidenceVerifiedAt", "confidence", "causalLimitations", "verifiedAt", "outcomeOwnerId", "advisory", "acceptanceState"];
  const keyError = ownKeys(value, keys, "realizedOutcome");
  if (keyError) return keyError;
  const allowed = ["not due", "pending evidence", "verified positive", "verified neutral", "verified negative", "inconclusive"];
  if (!allowed.includes(String(value.status))) return "Choose an exact outcome status.";
  if (!present(value.outcomeOwnerId) || !acceptanceStates.has(String(value.acceptanceState))) return "Outcome owner and human acceptance state are required.";
  if (present(value.observationDate) && !validIso(value.observationDate)) return "Outcome requires a valid observation date.";
  if (present(value.evidence) && !validEvidenceUrl(value.evidence)) return "Outcome evidence must be a valid HTTP(S) URL.";
  if (String(value.status).startsWith("verified") || value.status === "inconclusive") {
    const missing = requireFields(value, ["observedMetric", "observedResult", "unit", "observationDate", "evidence", "evidenceRevision", "evidenceSha256", "evidenceVerifiedAt", "confidence", "causalLimitations"], "verified outcome");
    if (missing) return missing;
    if (!validIso(value.observationDate) || !validEvidenceUrl(value.evidence) || !/^[a-f0-9]{40}$/i.test(String(value.evidenceRevision)) || !/^[a-f0-9]{64}$/i.test(String(value.evidenceSha256)) || !validIso(value.evidenceVerifiedAt) || !confidence.has(String(value.confidence))) return "Verified outcomes require a valid observation date, immutable server-verified evidence fingerprint, and confidence band.";
  }
  return validateAdvisory(value.advisory ?? null, "realizedOutcome.advisory");
}

export function validateAndNormalizeWorkEconomics(section: WorkEconomicsSection, input: unknown): ValidationResult {
  if (!isRecord(input)) return { error: "Supply a structured Work Economics record.", value: null };
  const privacyError = privacyBoundary(input);
  if (privacyError) return { error: privacyError, value: null };
  const error = section === "valueHypothesis" ? validateValue(input)
    : section === "deliveryForecast" ? validateDelivery(input)
      : section === "actualEconomics" ? validateActual(input)
        : section === "realizedOutcome" ? validateOutcome(input)
          : "Choose a valid Work Economics section.";
  return { error, value: error ? null : input };
}

export function humanAcceptanceState(advisory: unknown, requested: unknown) {
  if (!advisory) return "no proposal" as const;
  return requested === "human edited" ? "human edited" as const : "human accepted" as const;
}

export type AcceptedRecords = ValueHypothesis | DeliveryForecast | ActualEconomics | RealizedOutcome;
