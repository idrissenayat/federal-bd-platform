import type { ValueHypothesis } from "./work-economics";

export type ValueProposalItem = {
  key: string;
  title: string;
  description: string;
  priority: string;
  work_type: string;
  evidence_url: string | null;
  github_url: string | null;
};

type ProposalDefaults = {
  primaryType: string;
  beneficiary: string;
  outcomeMetric: string;
  target: string;
  unit: string;
};

function addDays(now: Date, days: number) {
  const result = new Date(now);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

function proposalDefaults(item: ValueProposalItem): ProposalDefaults {
  const text = `${item.title} ${item.description}`;
  if (/governed agent|agent (?:run|execution)|agents? (?:claim|execute)/i.test(text)) {
    return {
      primaryType: "platform capability or reuse",
      beneficiary: "Product Leads and delivery owners assigning and reviewing governed agent work",
      outcomeMetric: "Authorized agent runs reaching a terminal or awaiting-human-review state with complete evidence",
      target: "At least 90% evidence-complete terminal or review-ready; 100% one durable run identity and assigned-worker authentication",
      unit: "percentage of authorized dispatches",
    };
  }
  if (item.work_type === "Defect correction") return {
    primaryType: "user/customer outcome",
    beneficiary: "Users and operators affected by the reported defect",
    outcomeMetric: "Affected workflows completed without recurrence of the reported defect",
    target: "At least 95% successful affected workflows with zero unresolved critical recurrence",
    unit: "percentage of affected workflows",
  };
  if (item.work_type === "Research / discovery") return {
    primaryType: "learning or option value",
    beneficiary: "Product and technical decision-makers using the resulting evidence",
    outcomeMetric: "Named decision questions answered with reviewable evidence",
    target: "100% of named decision questions answered or explicitly marked inconclusive",
    unit: "percentage of named decision questions",
  };
  if (item.work_type === "Operations / infrastructure") return {
    primaryType: "risk, security, compliance, or reliability improvement",
    beneficiary: "Platform operators and delivery teams relying on the service",
    outcomeMetric: "Governed operations completed successfully with reviewable evidence",
    target: "At least 95% successful governed operations with zero unauthorized changes",
    unit: "percentage of governed operations",
  };
  if (item.work_type === "Governance / process") return {
    primaryType: "risk, security, compliance, or reliability improvement",
    beneficiary: "POD contributors and accountable human decision authorities",
    outcomeMetric: "Eligible work transitions completed through the required governed path",
    target: "100% of eligible transitions retain named authority and exact evidence",
    unit: "percentage of eligible work transitions",
  };
  if (item.work_type === "Product feature") return {
    primaryType: "user/customer outcome",
    beneficiary: "People using and sponsoring the delivered product capability",
    outcomeMetric: "Eligible user journeys completed successfully with the new capability",
    target: "At least 90% successful eligible user journeys without a critical regression",
    unit: "percentage of eligible user journeys",
  };
  return {
    primaryType: "platform capability or reuse",
    beneficiary: "Delivery teams and Product Leads who depend on this platform capability",
    outcomeMetric: "Eligible work items completed with reviewable evidence using the capability",
    target: "At least 90% of eligible work items complete with reviewable evidence",
    unit: "percentage of eligible work items",
  };
}

export function buildValueHypothesisProposal(
  item: ValueProposalItem,
  outcomeOwnerId: string,
  nowIso = new Date().toISOString(),
): ValueHypothesis {
  const parsed = new Date(nowIso);
  const now = Number.isFinite(parsed.getTime()) ? parsed : new Date();
  const createdAt = now.toISOString();
  const defaults = proposalDefaults(item);
  const evidence = item.evidence_url ?? item.github_url ?? "";
  const highPriority = item.priority === "Now";

  return {
    primaryType: defaults.primaryType,
    beneficiary: defaults.beneficiary,
    outcomeMetric: defaults.outcomeMetric,
    baseline: `No verified ${item.key} outcome baseline exists yet; measure every eligible observation in the first frozen cohort`,
    target: defaults.target,
    unit: defaults.unit,
    observationDate: addDays(now, 30),
    outcomeOwner: "Product Lead / Observe-Learn owner",
    outcomeOwnerId,
    impact: highPriority ? "High" : "Medium",
    timeCriticality: highPriority ? "High" : "Medium",
    strategicAlignment: item.work_type === "Unclassified" ? "Medium" : "High",
    confidence: "low",
    evidence,
    evidenceStatus: "unverified",
    evidenceRevision: "",
    evidenceSha256: "",
    evidenceVerifiedAt: "",
    valueMode: "non-monetary",
    assumptions: "This is an AI-prepared, falsifiable hypothesis—not observed value. The named human may edit it before acceptance. Freeze the eligible cohort and report missing telemetry or competing explanations.",
    currency: "",
    period: "First 10–20 eligible observations or 30 days, whichever comes first; extend until at least 10 observations",
    advisory: {
      source: "AI",
      recommendation: `Review and accept or edit this proposed value hypothesis for ${item.key}; no required field starts blank.`,
      confidence: "low",
      drivers: [item.work_type, item.priority, item.title],
      evidence: evidence ? [evidence] : [],
      omissions: ["No verified outcome baseline is attached yet.", "The proposal must be tested against observed outcomes after delivery."],
      createdAt,
    },
    acceptanceState: "proposed",
    acceptedBy: "",
    acceptedAt: "",
  };
}
