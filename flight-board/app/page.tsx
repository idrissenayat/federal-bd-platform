"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { buildApprovalReasoningDraft, recommendGateDecision } from "./decision-reasoning";
import { WORK_TYPES } from "../lib/work-economics";
import { buildForecastProposal } from "../lib/forecast-proposal";
import { buildValueHypothesisProposal } from "../lib/value-hypothesis-proposal";
import { acceptedValueHypothesisReady } from "../lib/work-economics-validation";
import { applyAuthoritativeSnapshot, mergeBootstrapPreservingNewerItems, type AuthoritativeItemSnapshot } from "../lib/post-write";
import type {
  ActualEconomics,
  AiAdvisory,
  DeliveryForecast,
  PullForecast,
  RealizedOutcome,
  ServiceLevelDistribution,
  ValueHypothesis,
  WorkEconomicsRecord,
} from "../lib/work-economics";

const phases = ["Sense", "Frame", "Engineer", "Evaluate", "Release", "Observe", "Learn"] as const;
const priorities = ["Now", "Next", "Later"] as const;
const workflows = ["STEER", "Control", "Setup / excluded", "Unassigned"] as const;
const states = ["queued", "active", "blocked", "complete"] as const;
const githubRoot = "https://github.com/idrissenayat/federal-bd-platform";
const buzzRelayUrl = "wss://blockbuzzmain-production-5bcb.up.railway.app";
const buzzDownloadUrl = "https://buzz.xyz";

type View = "my-work" | "overview" | "board" | "backlog" | "decisions" | "team";
type RoleContext = "product" | "tech" | "design" | "platform" | "security" | "contributor";

type WorkItem = {
  id: number;
  key: string;
  title: string;
  description: string;
  phase: string;
  priority: string;
  workflow: string;
  work_type: string;
  state: string;
  gate: string;
  decision_status: string;
  decision_authority: string;
  assignee_id: string | null;
  assignee_name: string | null;
  assignee_kind: string | null;
  next_action: string;
  evidence_url: string | null;
  github_url: string | null;
  rework_instructions: string | null;
  blocked_since: string | null;
  pod_id: string;
  created_at: string;
  closed_at: string | null;
  updated_at: string;
  work_economics: WorkEconomicsRecord;
  dispatch_authorization: AgentDispatchAuthorization;
  dispatch_intent_id?: string | null;
  dispatch_state?: string | null;
  dispatch_event_version?: number | null;
  dispatch_authorization_revision?: string | null;
  dispatch_updated_at?: string | null;
};

type WorkEconomicsEvent = {
  id: number;
  item_id: number;
  item_key: string;
  section: string;
  action: string;
  actor_name: string | null;
  actor_role: string;
  reason: string;
  created_at: string;
};

type DispatchCheck = {
  id: string;
  label: string;
  met: boolean;
  detail: string;
};

type AgentDispatchAuthorization = {
  authorized: boolean;
  status: "Authorized" | "Blocked";
  summary: string;
  checks: DispatchCheck[];
  missing: string[];
  channel: string;
  handoff_message: string | null;
};

type Member = {
  id: string;
  display_name: string;
  email: string | null;
  kind: "human" | "agent";
  role: string;
  authority: string;
  status: string;
  accent: string;
};

type Activity = {
  id: number;
  item_id: number;
  item_key: string;
  item_title: string;
  actor_name: string | null;
  action: string;
  detail: string;
  created_at: string;
};

type Decision = {
  id: number;
  item_id: number;
  item_key: string;
  item_title: string;
  gate: string;
  decision: string;
  reasoning: string;
  actor_email: string | null;
  review_id: number | null;
  evidence_url: string | null;
  evidence_revision: string | null;
  evidence_sha256: string | null;
  created_at: string;
};

type AgentFinding = {
  severity: "blocker" | "should-fix" | "note";
  title: string;
  detail: string;
  action: string;
};

type AgentReview = {
  id: number;
  item_id: number;
  item_key: string;
  item_title: string;
  agent_id: string;
  review_mode: string;
  recommendation: string;
  confidence: string;
  summary: string;
  findings: AgentFinding[];
  dependencies: string[];
  impacts: string[];
  actions: string[];
  derived_tags: string[];
  evidence_scope: string;
  evidence_url: string | null;
  evidence_revision: string | null;
  evidence_sha256: string | null;
  reviewed_item_updated_at: string;
  created_at: string;
};

type Notification = {
  id: number;
  item_id: number;
  item_key: string;
  item_title: string;
  member_id: string | null;
  member_name: string | null;
  recipient_role: string;
  kind: string;
  title: string;
  body: string;
  channel: string;
  status: string;
  created_at: string;
};

type Bootstrap = {
  generated_at: string;
  user: { id: string; email: string | null; name: string; role: string; authority: string; role_contexts: RoleContext[] };
  items: WorkItem[];
  members: Member[];
  activity: Activity[];
  decisions: Decision[];
  reviews: AgentReview[];
  notifications: Notification[];
  work_economics_events: WorkEconomicsEvent[];
  pull_forecast: PullForecast;
  service_level_distributions: ServiceLevelDistribution[];
};

type ItemMutationSnapshot = AuthoritativeItemSnapshot<WorkItem, Activity, WorkEconomicsEvent>;
type ItemMutationResult = { ok: true; snapshot: ItemMutationSnapshot; message?: string; idempotent_replay?: boolean };
type ActionScope = "controls" | "economics" | "dispatch" | "next-action";
type ActionFeedback = { id: number; scope: ActionScope; state: "pending" | "success" | "error"; message: string };

type BuzzStatus = {
  online: boolean;
  relay: string;
  version: string | null;
  auth_required: boolean;
  checked_at: string;
};

type CodeReviewFinding = AgentFinding;

type CodeDecisionOption = { status: string; tone: string; reason: string };
type CodeDecisionGuidance = {
  recommended_action: "ACCEPT" | "REQUEST_CHANGES" | "MERGE" | "WAIT";
  headline: string;
  summary: string;
  actions: { accept: CodeDecisionOption; request_changes: CodeDecisionOption; merge: CodeDecisionOption };
};

type CodeReviewData = {
  connection: { read: boolean; write: boolean; repository: string; message: string };
  pull_request: {
    number: number; title: string; body: string | null; url: string; state: string; draft: boolean; mergeable: boolean | null; mergeable_state: string;
    author: string; base_ref: string; head_ref: string; head_sha: string; additions: number; deletions: number; changed_files: number; commits: number; updated_at: string;
  };
  checks: { total: number; failed: number; pending: number; successful: number; all_green: boolean; items: Array<{ name: string; status: string; conclusion: string | null; url: string | null }> };
  files: Array<{ filename: string; status: string; additions: number; deletions: number; changes: number; patch: string | null; blob_url?: string }>;
  ai_review: { recommendation: string; summary: string; findings: CodeReviewFinding[]; dependencies: string[]; impacts: string[]; actions: string[]; proposed_change_instructions: string; proposed_acceptance_reasoning?: string };
  decision_guidance?: CodeDecisionGuidance;
  history: Array<{ id: number; head_sha: string; action: string; reasoning: string; actor_email: string | null; github_delivery: string; github_url: string | null; created_at: string }>;
  controls: { accepted_head: boolean; can_merge: boolean; merge_confirmation: string; exact_head_required: boolean };
};

const navigation: { id: View; label: string; icon: string }[] = [
  { id: "my-work", label: "My Work", icon: "✦" },
  { id: "overview", label: "Overview", icon: "◫" },
  { id: "board", label: "Flight Board", icon: "▥" },
  { id: "backlog", label: "Backlog", icon: "≡" },
  { id: "decisions", label: "Human Decisions", icon: "◆" },
  { id: "team", label: "Team & Agents", icon: "◎" },
];

const roleCockpits: Array<{ id: RoleContext; label: string; short: string; copy: string }> = [
  { id: "product", label: "Product Lead", short: "Product", copy: "Prioritize signals, protect outcomes, and make Gates 1 and 3 deliberate." },
  { id: "tech", label: "Tech Lead", short: "Technology", copy: "Own exams, architecture judgment, Gate 2, and returned technical work." },
  { id: "design", label: "Product Designer", short: "Design", copy: "Protect design intent, accessibility, and the independent release perspective." },
  { id: "platform", label: "Platform / Ops Lead", short: "Platform", copy: "Keep environments, delivery rails, telemetry, rollback, and agents healthy." },
  { id: "security", label: "Security Owner", short: "Security", copy: "Review default-closed security work and provide the required specialist judgment." },
];

const phaseCues: Record<string, string> = {
  Sense: "Find worthy signals",
  Frame: "Make intent testable",
  Engineer: "Build the evidence",
  Evaluate: "Challenge the result",
  Release: "Make the human call",
  Observe: "Watch real behavior",
  Learn: "Improve the system",
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently" : new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

export function formatCreatedDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function linkedPullRequest(item: WorkItem) {
  return [item.evidence_url, item.github_url].some((value) => value && /^https:\/\/github\.com\/idrissenayat\/federal-bd-platform\/pull\/\d+\/?(?:[?#].*)?$/i.test(value));
}

function acceptanceReasoningDraft(data: CodeReviewData) {
  const supplied = data.ai_review.proposed_acceptance_reasoning?.trim();
  if (supplied) return supplied;
  const blockers = data.ai_review.findings.filter((finding) => finding.severity === "blocker");
  if (blockers.length) return `AI does not recommend acceptance while ${blockers.length} blocking condition${blockers.length === 1 ? " remains" : "s remain"}. If you override this recommendation, replace this text with the evidence and authority for that exception.`;
  const concerns = data.ai_review.findings.filter((finding) => finding.severity === "should-fix").map((finding) => finding.title);
  return [
    "All reported checks are complete and green, and the available review shows no blocking condition for this revision.",
    concerns.length ? `I reviewed the highlighted concern${concerns.length === 1 ? "" : "s"} (${concerns.join("; ")}) against the work-item outcome and find the documented controls and follow-up boundaries acceptable.` : "I reviewed the changed files against the work-item outcome and found no material concern that requires rework.",
    "This acceptance applies only to the exact displayed commit. It does not authorize merge, and any new push requires a fresh review.",
  ].join(" ");
}

function fallbackDecisionGuidance(data: CodeReviewData): CodeDecisionGuidance {
  const blockers = data.ai_review.findings.filter((finding) => finding.severity === "blocker").length;
  const accept: CodeDecisionOption = blockers
    ? { status: "Not recommended", tone: "blocked", reason: `Resolve ${blockers} blocking condition${blockers === 1 ? "" : "s"} before accepting this revision.` }
    : { status: "Recommended now", tone: "recommended", reason: "No blocking condition remains. Confirm the highlighted concerns, then record acceptance for this exact commit." };
  const requestChanges: CodeDecisionOption = blockers
    ? { status: "Recommended now", tone: "recommended", reason: "Send the AI-proposed instructions and require a fresh revision." }
    : { status: "Not recommended", tone: "neutral", reason: "No blocking defect was found. Use this only if your file review identifies a specific required change." };
  const merge: CodeDecisionOption = data.controls.can_merge
    ? { status: "Recommended next", tone: "recommended", reason: "Acceptance is recorded and every reported check is green." }
    : { status: "Not ready", tone: "neutral", reason: data.controls.accepted_head ? "Resolve the remaining merge condition first." : "Record human acceptance for this exact commit first." };
  const recommendedAction = data.controls.can_merge ? "MERGE" : blockers ? "REQUEST_CHANGES" : data.checks.all_green ? "ACCEPT" : "WAIT";
  const headline = recommendedAction === "MERGE" ? "Merge the accepted revision" : recommendedAction === "REQUEST_CHANGES" ? "Request changes before acceptance" : recommendedAction === "ACCEPT" ? "Accept this exact revision" : "Wait for the required signals";
  return { recommended_action: recommendedAction, headline, summary: recommendedAction === "MERGE" ? merge.reason : recommendedAction === "REQUEST_CHANGES" ? requestChanges.reason : recommendedAction === "ACCEPT" ? accept.reason : merge.reason, actions: { accept, request_changes: requestChanges, merge } };
}

function decisionGuidance(data: CodeReviewData) {
  return data.decision_guidance ?? fallbackDecisionGuidance(data);
}

function reasoningDraftForAction(data: CodeReviewData, action: "ACCEPT" | "REQUEST_CHANGES" | "MERGE") {
  if (action === "ACCEPT") return acceptanceReasoningDraft(data);
  if (action === "REQUEST_CHANGES") return data.ai_review.proposed_change_instructions || "Describe the specific change required, why it blocks this revision, and what evidence must accompany the next review.";
  return "Human acceptance is recorded for this exact commit, every reported check is green, and the accepted revision is ready for the separate confirmed merge action.";
}

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

async function api(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await response.text();
  let data: { error?: string };
  try {
    data = JSON.parse(body) as { error?: string };
  } catch {
    throw new ApiRequestError(response.ok
      ? "The service returned an unreadable response. Refresh and try again."
      : `The service is temporarily unavailable (HTTP ${response.status}). Refresh and try again.`, response.status);
  }
  if (!response.ok) throw new ApiRequestError(data.error ?? "The request could not be completed.", response.status);
  return data;
}

class ApiRequestError extends Error {
  readonly responseReceivedAt = feedbackClock();
  constructor(message: string, readonly status: number) { super(message); }
}

function feedbackClock() { return performance.now(); }

type TelemetryObservation = { metric_name: string; label_name?: string; label_value?: string; value: number; case_id?: string };

function emitTelemetry(observation: TelemetryObservation) {
  void fetch("/api/telemetry", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ label_name: "", label_value: "", ...observation }),
    keepalive: true,
  }).catch(() => undefined);
}

function emitFeedbackAfterPaint(receivedAt: number, histogram: string, outcomeMetric: string, outcome: string) {
  requestAnimationFrame(() => {
    emitTelemetry({ metric_name: histogram, value: Math.max(0, Math.round(performance.now() - receivedAt)) });
    emitTelemetry({ metric_name: outcomeMetric, label_name: "outcome", label_value: outcome, value: 1 });
  });
}

function failureOutcome(error: unknown) {
  return error instanceof ApiRequestError ? error.status === 409 ? "conflict" : error.status >= 400 && error.status < 500 ? "validation" : "transport" : "transport";
}

function StatusPill({ value, kind }: { value: string; kind?: string }) {
  const token = (kind ?? value).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return <span className={`status-pill token-${token}`}>{value}</span>;
}

function Avatar({ name, kind = "human", accent = "aqua" }: { name: string | null; kind?: string; accent?: string }) {
  return <span className={`member-avatar avatar-${kind} accent-${accent}`}>{kind === "agent" ? "◇" : initials(name)}</span>;
}

function Empty({ title, copy }: { title: string; copy: string }) {
  return <div className="empty-panel"><span>✓</span><h3>{title}</h3><p>{copy}</p></div>;
}

function InlineActionFeedback({ feedback }: { feedback: ActionFeedback | null }) {
  const region = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (feedback?.state === "error") region.current?.focus();
  }, [feedback?.id, feedback?.state]);
  if (!feedback) return null;
  const title = feedback.state === "pending" ? "Saving…" : feedback.state === "success" ? "Saved" : "Action not completed";
  return <div
    ref={region}
    className={`inline-action-feedback inline-action-${feedback.state}`}
    role={feedback.state === "error" ? "alert" : "status"}
    aria-live={feedback.state === "error" ? "assertive" : "polite"}
    tabIndex={feedback.state === "error" ? -1 : undefined}
  ><strong>{title}</strong><span>{feedback.message}</span></div>;
}

function NextActionEditor({ item, saving, feedback, onSave }: {
  item: WorkItem;
  saving: boolean;
  feedback: ActionFeedback | null;
  onSave: (value: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState(item.next_action);
  async function save() {
    const value = draft.trim();
    if (value !== item.next_action) await onSave(value);
  }
  return <section className="detail-section next-section">
    <div><h3>Next action</h3><span>Keep this executable and unambiguous.</span></div>
    <textarea value={draft} disabled={saving} onChange={(event) => setDraft(event.target.value)} onBlur={() => void save()} aria-describedby={`next-action-feedback-${item.id}`} />
    <div id={`next-action-feedback-${item.id}`}><InlineActionFeedback feedback={feedback} /></div>
  </section>;
}

function datetimeLocal(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

function isoFromForm(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

function numeric(form: FormData, name: string, fallback = 0) {
  const parsed = Number(form.get(name));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function RecordAdvisory({ advisory, acceptanceState }: { advisory: AiAdvisory | null | undefined; acceptanceState: string | undefined }) {
  return <div className="record-advisory" role="status">
    <strong>◇ AI proposal · advisory only</strong>
    {advisory ? <>
      <p>{advisory.recommendation}</p>
      <small>Confidence: {advisory.confidence} · Drivers: {advisory.drivers.join(", ") || "none recorded"} · Evidence: {advisory.evidence.join(", ") || "none recorded"} · Omissions: {advisory.omissions.join(", ") || "none recorded"}</small>
      <small>Human ruling: {acceptanceState ?? "proposed"}. The named owner may accept unchanged or edit the record before acceptance.</small>
    </> : <p>No AI proposal exists for this record. A named human remains responsible for the evidence, edits, and acceptance.</p>}
  </div>;
}

function ForecastSummary({ item, compact = false }: { item: WorkItem; compact?: boolean }) {
  const economics = item.work_economics;
  const forecast = economics.forecast;
  const value = economics.valueHypothesis;
  const outcome = economics.realizedOutcome;
  const humanRange = economics.deliveryForecast?.humanEffortRanges.reduce((total, range) => ({ min: total.min + range.minMinutes, max: total.max + range.maxMinutes }), { min: 0, max: 0 });
  const nextMilestone = forecast.nextMilestoneAt
    ? `${forecast.nextMilestone} · ${formatDate(forecast.nextMilestoneAt)}`
    : "Forecast needed";
  const compactLabel = [
    `Next milestone: ${nextMilestone}`,
    `Forecast status: ${forecast.state}`,
    `Confidence: ${forecast.confidence}`,
    `Likely completion: ${forecast.likelyWindow}`,
    `Last forecast update: ${forecast.lastUpdatedAt ? formatDate(forecast.lastUpdatedAt) : "unknown"}`,
    `Value hypothesis: ${value ? `${value.primaryType}, ${value.confidence}` : "unknown"}`,
    `Effort forecast: ${humanRange ? `${humanRange.min} to ${humanRange.max} role minutes` : "unknown"}`,
    `Outcome: ${outcome?.status ?? "not yet due"}`,
  ].join(". ");

  if (compact) return <div className="economics-summary economics-summary-compact" aria-label={compactLabel}>
    <div className="forecast-focus">
      <b>Next</b>
      <span>{nextMilestone}</span>
      <small>{forecast.state === "unknown" ? "Needs forecast" : `${forecast.state} · ${forecast.confidence} confidence`}</small>
    </div>
  </div>;

  return <div className={`economics-summary ${compact ? "economics-summary-compact" : ""}`} aria-label={`Work Economics for ${item.key}`}>
    <span><b>Value hypothesis</b>{value ? `${value.primaryType} · ${value.confidence}` : "Unknown · Product Lead must provide it"}</span>
    <span><b>Effort forecast</b>{humanRange ? `${humanRange.min}–${humanRange.max} role minutes` : "Unknown · delivery owner must provide it"}</span>
    <span><b>Completion window</b>{forecast.state === "unknown" ? "Unknown · owner update required" : `${forecast.likelyWindow} · ${forecast.state} · ${forecast.confidence}`}</span>
    <span><b>Next milestone / time</b>{forecast.nextMilestoneAt ? `${forecast.nextMilestone} · ${formatDate(forecast.nextMilestoneAt)}` : "Unknown · delivery owner must update"}</span>
    {economics.deliveryForecast?.humanDecisionTargetAt && <span><b>Human gate target</b>{`${formatDate(economics.deliveryForecast.humanDecisionTargetAt)} · agent work ${economics.deliveryForecast.agentWorkCompletedAt ? `completed ${formatDate(economics.deliveryForecast.agentWorkCompletedAt)}` : "completion not recorded"}`}</span>}
    <span><b>Forecast updated</b>{forecast.lastUpdatedAt ? formatDate(forecast.lastUpdatedAt) : "Unknown · delivery owner must update"}</span>
    <span><b>Outcome</b>{outcome?.status ?? "Not yet due"}</span>
  </div>;
}

type EconomicsSection = "valueHypothesis" | "deliveryForecast" | "actualEconomics" | "realizedOutcome";

export function WorkEconomicsPanel({ item, events, members, serviceLevels, currentUserId, saving, onSave }: {
  item: WorkItem;
  events: WorkEconomicsEvent[];
  members: Member[];
  serviceLevels: ServiceLevelDistribution[];
  currentUserId: string;
  saving: boolean;
  onSave: (section: EconomicsSection, value: Record<string, unknown>, reason: string) => Promise<void>;
}) {
  const economics = item.work_economics;
  const value = economics.valueHypothesis;
  const forecast = economics.deliveryForecast;
  const actual = economics.actualEconomics;
  const outcome = economics.realizedOutcome;
  const applicableServiceLevel = serviceLevels.find((entry) => entry.podId === item.pod_id && entry.workType === item.work_type) ?? null;
  const proposedValue = useMemo(() => value ?? buildValueHypothesisProposal(item, currentUserId), [currentUserId, item, value]);
  const proposedForecast = useMemo(() => {
    if (forecast && !forecast.reforecastRequiredReason) return null;
    return buildForecastProposal(
      item,
      applicableServiceLevel,
      currentUserId,
      Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      new Date().toISOString(),
      forecast,
    );
  }, [applicableServiceLevel, currentUserId, forecast, item]);
  const draftForecast = proposedForecast ?? forecast;

  function submitValue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const record: ValueHypothesis = {
      primaryType: String(form.get("primaryType") ?? ""), beneficiary: String(form.get("beneficiary") ?? ""), outcomeMetric: String(form.get("outcomeMetric") ?? ""),
      baseline: String(form.get("baseline") ?? ""), target: String(form.get("target") ?? ""), unit: String(form.get("unit") ?? ""), observationDate: String(form.get("observationDate") ?? ""),
      outcomeOwner: String(form.get("outcomeOwner") ?? ""), impact: String(form.get("impact") ?? ""), timeCriticality: String(form.get("timeCriticality") ?? ""),
      outcomeOwnerId: String(form.get("outcomeOwnerId") ?? currentUserId), strategicAlignment: String(form.get("strategicAlignment") ?? ""), confidence: String(form.get("confidence") ?? "low") as ValueHypothesis["confidence"], evidence: String(form.get("evidence") ?? ""), evidenceStatus: "unverified", evidenceRevision: "", evidenceSha256: "", evidenceVerifiedAt: "", valueMode: String(form.get("valueMode") ?? "non-monetary") as ValueHypothesis["valueMode"], assumptions: String(form.get("assumptions") ?? ""), currency: String(form.get("currency") ?? ""), period: String(form.get("period") ?? ""), advisory: proposedValue.advisory, acceptanceState: proposedValue.advisory ? String(form.get("acceptanceState") ?? "human accepted") as ValueHypothesis["acceptanceState"] : "no proposal", acceptedBy: value?.acceptedBy ?? "", acceptedAt: value?.acceptedAt ?? "",
    };
    void onSave("valueHypothesis", record, String(form.get("auditReason") ?? "Value hypothesis accepted by Product Lead"));
  }

  function submitForecast(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const record: DeliveryForecast = {
      sizeBand: String(form.get("sizeBand") ?? "M") as DeliveryForecast["sizeBand"], humanEffortRanges: [{ role: String(form.get("humanRole") ?? "Delivery roles"), minMinutes: numeric(form, "humanMinutesMin"), maxMinutes: numeric(form, "humanMinutesMax") }, ...(draftForecast?.humanEffortRanges.slice(1) ?? [])],
      agentCostRanges: [{ provider: String(form.get("provider") ?? "Assigned agent runtime"), minCost: numeric(form, "agentCostMin"), maxCost: numeric(form, "agentCostMax"), currency: String(form.get("currency") ?? "USD"), expectedAttempts: numeric(form, "expectedAttempts", 1) }, ...(draftForecast?.agentCostRanges.slice(1) ?? [])], complexity: numeric(form, "complexity", 3), uncertainty: numeric(form, "uncertainty", 3), coordination: numeric(form, "coordination", 3),
      basis: String(form.get("basis") ?? ""), basisKind: String(form.get("basisKind") ?? "expert judgment") as DeliveryForecast["basisKind"], comparableItems: String(form.get("comparableItems") ?? ""), serviceLevel: String(form.get("basisKind")) === "comparable history" && applicableServiceLevel ? { podId: applicableServiceLevel.podId, workType: applicableServiceLevel.workType, sampleSize: applicableServiceLevel.sampleSize, percentile: applicableServiceLevel.percentile, lowHours: applicableServiceLevel.lowHours, highHours: applicableServiceLevel.highHours } : null, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      earliestCompletion: isoFromForm(form.get("earliestCompletion")), likelyCompletion: isoFromForm(form.get("likelyCompletion")), latestCompletion: isoFromForm(form.get("latestCompletion")),
      confidence: String(form.get("confidence") ?? "low") as DeliveryForecast["confidence"], nextMilestone: String(form.get("nextMilestone") ?? ""), nextMilestoneAt: isoFromForm(form.get("nextMilestoneAt")),
      phaseExit: String(form.get("phaseExit") ?? ""), phaseExitAt: isoFromForm(form.get("phaseExitAt")), agentWorkCompletedAt: isoFromForm(form.get("agentWorkCompletedAt")) || null, humanDecisionTargetAt: isoFromForm(form.get("humanDecisionTargetAt")) || null, blockedSince: item.blocked_since, unblockOwner: String(form.get("unblockOwner") ?? ""), unblockAction: String(form.get("unblockAction") ?? ""), cannotForecastUntil: String(form.get("cannotForecastUntil") ?? ""), freshnessHours: numeric(form, "freshnessHours", 24), acceptedBy: forecast?.acceptedBy ?? "", acceptedAt: forecast?.acceptedAt ?? "", updatedAt: forecast?.updatedAt ?? "", changeReason: String(form.get("changeReason") ?? ""), advisory: draftForecast?.advisory ?? null, acceptanceState: draftForecast?.advisory ? String(form.get("acceptanceState") ?? "human accepted") as DeliveryForecast["acceptanceState"] : "no proposal", deliveryOwnerId: currentUserId,
    };
    void onSave("deliveryForecast", record, record.changeReason);
  }

  function submitActual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const tokenValue = (name: string) => String(form.get(name) ?? "").trim() ? numeric(form, name) : null;
    const record: ActualEconomics = {
      humanRoleTotals: [{ role: String(form.get("humanRole") ?? "Delivery roles"), activeMinutes: numeric(form, "humanActiveMinutes") }, ...(actual?.humanRoleTotals.slice(1) ?? [])], agentTelemetry: String(form.get("completeness")) === "missing" ? [] : [{ eventId: String(form.get("eventId") ?? "").trim() || crypto.randomUUID(), provider: String(form.get("provider") ?? ""), model: String(form.get("model") ?? ""), attempts: numeric(form, "attempts"), inputTokens: tokenValue("inputTokens"), outputTokens: tokenValue("outputTokens"), meteredCost: tokenValue("meteredCost"), currency: String(form.get("currency") ?? "USD"), executionMinutes: numeric(form, "agentExecutionMinutes"), source: String(form.get("telemetrySource") ?? ""), completeness: String(form.get("completeness") ?? "missing") as "complete" | "partial" | "missing", observedAt: actualAgent?.observedAt ?? new Date().toISOString(), ingestionState: String(form.get("ingestionState") ?? "accepted") as "accepted" | "late" | "conflict", conflictReason: String(form.get("conflictReason") ?? "") }, ...(actual?.agentTelemetry.slice(1) ?? [])],
      durationFacts: { agentExecutionMinutes: numeric(form, "agentExecutionMinutes"), queueMinutes: numeric(form, "queueMinutes"), blockedMinutes: numeric(form, "blockedMinutes"), gateWaitMinutes: numeric(form, "gateWaitMinutes"), cycleMinutes: numeric(form, "cycleMinutes") }, reworkEvents: numeric(form, "reworkMinutes") ? [{ originatingPhase: item.phase, minutes: numeric(form, "reworkMinutes"), reason: String(form.get("correctionReason") ?? "Recorded rework") }] : [], defectEvents: numeric(form, "defects") ? [{ severity: "unspecified", count: numeric(form, "defects") }] : [], rollbackEvents: numeric(form, "rollbacks") ? [{ reason: "Audited rollback event", occurredAt: new Date().toISOString() }] : [],
      telemetrySource: String(form.get("telemetrySource") ?? ""), completeness: String(form.get("completeness") ?? "missing") as ActualEconomics["completeness"], completionAt: null, likelyVarianceMinutes: null, correctedBy: actual?.correctedBy ?? "", correctedAt: actual?.correctedAt ?? "", correctionReason: String(form.get("correctionReason") ?? ""), advisory: actual?.advisory ?? null, acceptanceState: actual?.advisory ? String(form.get("acceptanceState") ?? "human accepted") as ActualEconomics["acceptanceState"] : "no proposal",
    };
    void onSave("actualEconomics", record, record.correctionReason);
  }

  function submitOutcome(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const record: RealizedOutcome = {
      status: String(form.get("status") ?? "not due") as RealizedOutcome["status"], observedMetric: String(form.get("observedMetric") ?? ""), observedResult: String(form.get("observedResult") ?? ""), unit: String(form.get("unit") ?? ""), observationDate: String(form.get("observationDate") ?? ""),
      verifier: outcome?.verifier ?? "", evidence: String(form.get("evidence") ?? ""), evidenceRevision: "", evidenceSha256: "", evidenceVerifiedAt: "", confidence: String(form.get("confidence") ?? "low") as RealizedOutcome["confidence"], causalLimitations: String(form.get("causalLimitations") ?? ""), verifiedAt: outcome?.verifiedAt ?? "", outcomeOwnerId: outcome?.outcomeOwnerId ?? currentUserId, advisory: outcome?.advisory ?? null, acceptanceState: outcome?.advisory ? String(form.get("acceptanceState") ?? "human accepted") as RealizedOutcome["acceptanceState"] : "no proposal",
    };
    void onSave("realizedOutcome", record, String(form.get("auditReason") ?? `Outcome status recorded as ${record.status}`));
  }

  const forecastHuman = draftForecast?.humanEffortRanges[0];
  const forecastAgent = draftForecast?.agentCostRanges[0];
  const actualHuman = actual?.humanRoleTotals[0];
  const actualAgent = actual?.agentTelemetry[0];
  const durations = actual?.durationFacts;
  return <section className="work-economics" aria-labelledby={`economics-${item.id}`}>
    <header><div><span>Decision brief · governed records</span><h3 id={`economics-${item.id}`}>Work Economics</h3></div><StatusPill value={economics.forecast.state} kind={economics.forecast.state} /></header>
    <p className="economics-intro">Why might this matter? What do we expect it to take? What did it take? What changed? Effort, cost, elapsed time, and value stay separate.</p>
    <div className="economics-authority" role="status"><strong>◇ AI is advisory; a named human accepts every authoritative record.</strong><p>Each governed record below shows its own AI proposal and human acceptance state. Advice never becomes authoritative without the named human owner.</p></div>
    <ForecastSummary item={item} />
    <div className={`forecast-callout forecast-${economics.forecast.state.replace(" ", "-")}`}><strong>{economics.forecast.state === "unknown" ? "Owner forecast required" : `${economics.forecast.state} · ${economics.forecast.confidence} confidence`}</strong><p>{economics.forecast.reason}</p>{economics.forecast.nextMilestoneAt && <small>Next: {economics.forecast.nextMilestone} · {formatDate(economics.forecast.nextMilestoneAt)} · Updated {economics.forecast.lastUpdatedAt ? formatDate(economics.forecast.lastUpdatedAt) : "unknown"}</small>}</div>

    <details id={`value-hypothesis-${item.id}`} className="economics-record" open={!value}><summary><span>01</span><div><strong>Value hypothesis</strong><small>{value ? `${value.outcomeMetric}: ${value.baseline} → ${value.target} ${value.unit}` : "AI proposal ready · human review only"}</small></div><b>{proposedValue.confidence}</b></summary><form key={value?.acceptedAt ?? proposedValue.advisory?.createdAt} onSubmit={submitValue}>
      <RecordAdvisory advisory={proposedValue.advisory} acceptanceState={value?.acceptanceState ?? proposedValue.acceptanceState} />
      <div className="economics-form-grid economics-governance-row"><label>Value treatment<select name="valueMode" defaultValue={proposedValue.valueMode}><option value="non-monetary">Non-monetary native unit</option><option value="monetary">Monetary · currency and period required</option></select></label></div>
      <div className="economics-form-grid"><label>Primary value type<select name="primaryType" defaultValue={proposedValue.primaryType}>{["revenue or mission enablement", "user/customer outcome", "time or operating-cost reduction", "risk, security, compliance, or reliability improvement", "learning or option value", "platform capability or reuse"].map((option) => <option key={option}>{option}</option>)}</select></label><label>Beneficiary<input name="beneficiary" defaultValue={proposedValue.beneficiary} required /></label><label>Outcome metric<input name="outcomeMetric" defaultValue={proposedValue.outcomeMetric} required /></label><label>Baseline<input name="baseline" defaultValue={proposedValue.baseline} required /></label><label>Target<input name="target" defaultValue={proposedValue.target} required /></label><label>Native unit<input name="unit" defaultValue={proposedValue.unit} required /></label><label>Observation date<input name="observationDate" type="date" defaultValue={proposedValue.observationDate.slice(0, 10)} required /></label><label>Outcome owner label<input name="outcomeOwner" defaultValue={proposedValue.outcomeOwner} required /></label><label>Named outcome owner<select name="outcomeOwnerId" defaultValue={proposedValue.outcomeOwnerId}>{members.filter((member) => member.kind === "human").map((member) => <option key={member.id} value={member.id}>{member.display_name} · {member.role}</option>)}</select></label><label>Impact<select name="impact" defaultValue={proposedValue.impact}>{["Low", "Medium", "High"].map((option) => <option key={option}>{option}</option>)}</select></label><label>Time criticality<select name="timeCriticality" defaultValue={proposedValue.timeCriticality}>{["Low", "Medium", "High"].map((option) => <option key={option}>{option}</option>)}</select></label><label>Strategic alignment<select name="strategicAlignment" defaultValue={proposedValue.strategicAlignment}>{["Low", "Medium", "High"].map((option) => <option key={option}>{option}</option>)}</select></label><label>Confidence<select name="confidence" defaultValue={proposedValue.confidence}>{["low", "medium", "high"].map((option) => <option key={option}>{option}</option>)}</select></label><label>Currency if monetary<input name="currency" defaultValue={proposedValue.currency ?? ""} /></label><label>Measurement period<input name="period" defaultValue={proposedValue.period ?? ""} /></label>{proposedValue.advisory && <label>AI proposal ruling<select name="acceptanceState" defaultValue={value?.acceptanceState === "human edited" ? "human edited" : "human accepted"}><option value="human accepted">Accept unchanged</option><option value="human edited">Accept with human edits</option></select></label>}<label className="span-two">Evidence URL · human verifies before acceptance<input name="evidence" type="url" defaultValue={proposedValue.evidence} required /></label><label className="span-two">Visible assumptions / limitations<textarea name="assumptions" defaultValue={proposedValue.assumptions} required /></label><label className="span-two">Audit reason<input name="auditReason" defaultValue="Product Lead reviewed the AI-prepared value hypothesis and exact evidence before acceptance." required /></label></div><button disabled={saving}>{saving ? "Saving…" : value ? "Save audited correction" : "Accept AI-prepared value hypothesis"}</button>
    </form></details>

    <details className="economics-record" open={!forecast || economics.forecast.state !== "on track"}><summary><span>02</span><div><strong>Delivery forecast</strong><small>{forecast ? `${forecast.sizeBand} · ${economics.forecast.likelyWindow}` : "AI proposal ready · human review only"}</small></div><b>{economics.forecast.state}</b></summary><form onSubmit={submitForecast}>
      <RecordAdvisory advisory={draftForecast?.advisory} acceptanceState={forecast?.acceptanceState ?? "proposed"} />
      {!forecast && <div className="system-guidance forecast-agent-ready" role="status"><strong>Forecast Agent completed the first draft</strong><p>The completion range, effort, cost, confidence, milestone, and reasoning below are prefilled. Review the summary, edit only if needed, then accept.</p></div>}
      <div className="system-guidance" role="status"><strong>{applicableServiceLevel ? `Same-POD ${item.work_type} service level · n=${applicableServiceLevel.sampleSize}` : item.work_type === "Unclassified" ? "Classify the work type before using comparable history" : "Comparable history is not yet sufficient"}</strong><p>{applicableServiceLevel ? `Observed cycle distribution: ${applicableServiceLevel.lowHours}–${applicableServiceLevel.highHours} hours, median ${applicableServiceLevel.medianHours} hours, P${applicableServiceLevel.percentile}. Workflow treatment (${item.workflow}) is not used as the work type. The owner must still accept or edit the forecast.` : "Use expert judgment with low confidence. The platform will show a same-POD/work-type distribution only after five completed observations of this explicit work type."}</p></div>
      {(forecast?.humanEffortRanges.length ?? 0) > 1 || (forecast?.agentCostRanges.length ?? 0) > 1 ? <div className="system-guidance" role="status"><strong>Multiple aggregate contributors are recorded</strong><p>This form edits the primary row. Additional role/provider rows remain preserved and queryable.</p></div> : null}
      <div className="economics-form-grid"><label>Size band<select name="sizeBand" defaultValue={draftForecast?.sizeBand ?? "M"}>{["XS", "S", "M", "L", "XL"].map((option) => <option key={option}>{option}</option>)}</select></label><label>Human role aggregate<select name="humanRole" defaultValue={forecastHuman?.role ?? "Delivery roles"}>{["Product Lead", "Tech Lead", "Delivery", "Delivery roles", "Product Designer", "Platform / Ops", "Security", "Privacy / Legal", "Observe / Learn", "Builder", "Test", "Critic", "Documentation", "Operations", "Architecture"].map((role) => <option key={role}>{role}</option>)}</select></label><label>Human minutes min<input name="humanMinutesMin" type="number" min="0" defaultValue={forecastHuman?.minMinutes ?? 0} required /></label><label>Human minutes max<input name="humanMinutesMax" type="number" min="0" defaultValue={forecastHuman?.maxMinutes ?? 0} required /></label><label>Provider<input name="provider" defaultValue={forecastAgent?.provider ?? "Assigned agent runtime"} required /></label><label>Agent cost min<input name="agentCostMin" type="number" min="0" step="0.01" defaultValue={forecastAgent?.minCost ?? 0} required /></label><label>Agent cost max<input name="agentCostMax" type="number" min="0" step="0.01" defaultValue={forecastAgent?.maxCost ?? 0} required /></label><label>Currency<input name="currency" defaultValue={forecastAgent?.currency ?? "USD"} required /></label><label>Expected attempts<input name="expectedAttempts" type="number" min="0" defaultValue={forecastAgent?.expectedAttempts ?? 1} required /></label>{(["complexity", "uncertainty", "coordination"] as const).map((name) => <label key={name}>{name[0].toUpperCase() + name.slice(1)} 1–5<input name={name} type="number" min="1" max="5" defaultValue={draftForecast?.[name] ?? 3} required /></label>)}<label>Basis kind<select name="basisKind" defaultValue={draftForecast?.basisKind ?? "expert judgment"}><option>expert judgment</option><option>comparable history</option></select></label><label>Confidence<select name="confidence" defaultValue={draftForecast?.confidence ?? "low"}>{["low", "medium", "high"].map((option) => <option key={option}>{option}</option>)}</select></label>{draftForecast?.advisory && <label>AI proposal ruling<select name="acceptanceState" defaultValue={forecast?.acceptanceState === "human edited" ? "human edited" : "human accepted"}><option value="human accepted">Accept unchanged</option><option value="human edited">Accept with human edits</option></select></label>}<label className="span-two">Basis / evidence<input name="basis" defaultValue={draftForecast?.basis ?? "Expert judgment; insufficient same-POD comparable history"} required /></label><label className="span-two">Comparable items<input name="comparableItems" defaultValue={draftForecast?.comparableItems ?? "None yet"} /></label><label>Earliest completion<input name="earliestCompletion" type="datetime-local" defaultValue={datetimeLocal(draftForecast?.earliestCompletion)} required /></label><label>Likely completion<input name="likelyCompletion" type="datetime-local" defaultValue={datetimeLocal(draftForecast?.likelyCompletion)} required /></label><label>Latest completion<input name="latestCompletion" type="datetime-local" defaultValue={datetimeLocal(draftForecast?.latestCompletion)} required /></label><label>Freshness hours<input name="freshnessHours" type="number" min="1" max="168" defaultValue={draftForecast?.freshnessHours ?? 24} required /></label><label>Next milestone<input name="nextMilestone" defaultValue={draftForecast?.nextMilestone ?? ""} required /></label><label>Milestone target<input name="nextMilestoneAt" type="datetime-local" defaultValue={datetimeLocal(draftForecast?.nextMilestoneAt)} required /></label><label>Phase exit<input name="phaseExit" defaultValue={draftForecast?.phaseExit ?? "Moving to Evaluate / QA"} required /></label><label>Phase-exit target<input name="phaseExitAt" type="datetime-local" defaultValue={datetimeLocal(draftForecast?.phaseExitAt)} required /></label><label>Agent work completed<input name="agentWorkCompletedAt" type="datetime-local" defaultValue={datetimeLocal(draftForecast?.agentWorkCompletedAt)} /></label><label>Human decision target<input name="humanDecisionTargetAt" type="datetime-local" defaultValue={datetimeLocal(draftForecast?.humanDecisionTargetAt)} /></label>{item.state === "blocked" && <><label>Unblock owner<input name="unblockOwner" defaultValue={draftForecast?.unblockOwner ?? "Named delivery owner"} required /></label><label>Unblock action<input name="unblockAction" defaultValue={draftForecast?.unblockAction ?? item.next_action} required /></label><label className="span-two">Cannot forecast until dependency<input name="cannotForecastUntil" defaultValue={draftForecast?.cannotForecastUntil ?? `Cannot forecast until: ${item.next_action}`} required /></label></>}<label className="span-two">Forecast / reforecast reason<input name="changeReason" defaultValue={draftForecast?.changeReason ?? "Initial owner forecast accepted before execution"} required /></label></div><button disabled={saving}>{saving ? "Saving…" : forecast ? "Review & accept AI reforecast" : "Review & accept AI forecast"}</button>
    </form></details>

    <details className="economics-record"><summary><span>03</span><div><strong>Actual delivery economics</strong><small>{actual ? `${actual.humanRoleTotals.reduce((sum, entry) => sum + entry.activeMinutes, 0)} role-aggregated human min · ${actual.completeness} provider telemetry` : "Unavailable · Platform / Ops must ingest telemetry or record an audited correction"}</small></div><b>{actual?.completeness ?? "unknown"}</b></summary><form onSubmit={submitActual}>
      <RecordAdvisory advisory={actual?.advisory} acceptanceState={actual?.acceptanceState} />
      {actual?.advisory && <div className="economics-form-grid economics-governance-row"><label>AI proposal ruling<select name="acceptanceState" defaultValue={actual.acceptanceState === "human edited" ? "human edited" : "human accepted"}><option value="human accepted">Accept unchanged</option><option value="human edited">Accept with human edits</option></select></label></div>}
      {actual?.agentTelemetry.some((event) => event.ingestionState === "conflict") && <div className="system-guidance" role="alert"><strong>Conflicting telemetry</strong><p>Platform / Ops must compare the provider source and event ID, preserve both audit versions, and record the correction reason. Conflicts never overwrite accepted facts silently.</p></div>}
      {actual?.completeness === "partial" && <div className="system-guidance" role="status"><strong>Partial provider data</strong><p>Platform / Ops owns the follow-up. Keep missing tokens or cost as unavailable and attach the provider source before marking complete.</p></div>}
      <div className="economics-form-grid"><label>Aggregated role<select name="humanRole" defaultValue={actualHuman?.role ?? "Delivery roles"}>{["Product Lead", "Tech Lead", "Delivery", "Delivery roles", "Product Designer", "Platform / Ops", "Security", "Privacy / Legal", "Observe / Learn", "Builder", "Test", "Critic", "Documentation", "Operations", "Architecture"].map((role) => <option key={role}>{role}</option>)}</select></label><label>Human active minutes<input name="humanActiveMinutes" type="number" min="0" defaultValue={actualHuman?.activeMinutes ?? 0} required /></label><label>Telemetry event ID<input name="eventId" defaultValue={actualAgent?.eventId ?? ""} placeholder="Provider event ID" /></label><label>Provider<input name="provider" defaultValue={actualAgent?.provider ?? ""} /></label><label>Model<input name="model" defaultValue={actualAgent?.model ?? ""} /></label><label>Attempts<input name="attempts" type="number" min="0" defaultValue={actualAgent?.attempts ?? 0} required /></label><label>Input tokens<input name="inputTokens" type="number" min="0" defaultValue={actualAgent?.inputTokens ?? ""} /></label><label>Output tokens<input name="outputTokens" type="number" min="0" defaultValue={actualAgent?.outputTokens ?? ""} /></label><label>Metered cost<input name="meteredCost" type="number" min="0" step="0.01" defaultValue={actualAgent?.meteredCost ?? ""} /></label><label>Currency<input name="currency" defaultValue={actualAgent?.currency ?? "USD"} /></label>{(["agentExecutionMinutes", "queueMinutes", "blockedMinutes", "gateWaitMinutes", "cycleMinutes"] as const).map((name) => <label key={name}>{name.replace(/([A-Z])/g, " $1")}<input name={name} type="number" min="0" defaultValue={durations?.[name] ?? 0} required /></label>)}<label>Rework minutes<input name="reworkMinutes" type="number" min="0" defaultValue={actual?.reworkEvents.reduce((sum, entry) => sum + entry.minutes, 0) ?? 0} required /></label><label>Defects<input name="defects" type="number" min="0" defaultValue={actual?.defectEvents.reduce((sum, entry) => sum + entry.count, 0) ?? 0} required /></label><label>Rollbacks<input name="rollbacks" type="number" min="0" defaultValue={actual?.rollbackEvents.length ?? 0} required /></label><label>Telemetry completeness<select name="completeness" defaultValue={actual?.completeness ?? "missing"}>{["complete", "partial", "missing"].map((option) => <option key={option}>{option}</option>)}</select></label><label>Ingestion state<select name="ingestionState" defaultValue={actualAgent?.ingestionState ?? "accepted"}>{["accepted", "late", "conflict"].map((option) => <option key={option}>{option}</option>)}</select></label><label className="span-two">Conflict reason<input name="conflictReason" defaultValue={actualAgent?.conflictReason ?? ""} /></label><label className="span-two">Telemetry source<input name="telemetrySource" defaultValue={actual?.telemetrySource ?? "Provider telemetry unavailable; audited human entry"} required /></label><label className="span-two">Correction reason<input name="correctionReason" defaultValue={actual?.correctionReason ?? "Record role-aggregated actuals; no person-level timing retained"} required /></label></div><button disabled={saving}>{saving ? "Saving…" : actual ? "Save audited correction" : "Record actuals"}</button>
    </form></details>

    <details className="economics-record"><summary><span>04</span><div><strong>Realized outcome</strong><small>{outcome ? `${outcome.status}${outcome.observedResult ? ` · ${outcome.observedResult} ${outcome.unit}` : ""}` : "Not due · completion is not value realization"}</small></div><b>{outcome?.confidence ?? "unknown"}</b></summary><form onSubmit={submitOutcome}>
      <RecordAdvisory advisory={outcome?.advisory} acceptanceState={outcome?.acceptanceState} />
      <div className="economics-form-grid"><label>Outcome status<select name="status" defaultValue={outcome?.status ?? "not due"}>{["not due", "pending evidence", "verified positive", "verified neutral", "verified negative", "inconclusive"].map((option) => <option key={option}>{option}</option>)}</select></label><label>Observation date<input name="observationDate" type="date" defaultValue={outcome?.observationDate ?? ""} /></label><label>Observed metric<input name="observedMetric" defaultValue={outcome?.observedMetric ?? ""} /></label><label>Observed result<input name="observedResult" defaultValue={outcome?.observedResult ?? ""} /></label><label>Native unit<input name="unit" defaultValue={outcome?.unit ?? ""} /></label><label>Confidence<select name="confidence" defaultValue={outcome?.confidence ?? "low"}>{["low", "medium", "high"].map((option) => <option key={option}>{option}</option>)}</select></label>{outcome?.advisory && <label>AI proposal ruling<select name="acceptanceState" defaultValue={outcome.acceptanceState === "human edited" ? "human edited" : "human accepted"}><option value="human accepted">Accept unchanged</option><option value="human edited">Accept with human edits</option></select></label>}<label className="span-two">Evidence<input name="evidence" type="url" defaultValue={outcome?.evidence ?? ""} /></label><label className="span-two">Causal limitations / competing explanations<textarea name="causalLimitations" defaultValue={outcome?.causalLimitations ?? ""} /></label><label className="span-two">Audit reason<input name="auditReason" defaultValue={`Outcome status recorded as ${outcome?.status ?? "not due"}; completion is not treated as realized value.`} required /></label></div><button disabled={saving}>{saving ? "Saving…" : "Record human-verified outcome"}</button>
    </form></details>

    <div className="economics-audit"><strong>Audit history</strong>{events.length ? events.slice(0, 8).map((event) => <div key={event.id}><span>{formatDate(event.created_at)}</span><p><b>{event.section}</b> {event.action} by {event.actor_name ?? event.actor_role}: {event.reason}</p></div>) : <p>No Work Economics record has been accepted yet.</p>}</div>
  </section>;
}

function AgentDispatchControl({ item, dispatching, copied, onDispatch }: { item: WorkItem; dispatching: boolean; copied: boolean; onDispatch: () => void }) {
  const authorization = item.dispatch_authorization;
  const currentReceipt = Boolean(item.dispatch_intent_id) && item.dispatch_authorization_revision === item.updated_at;
  const dispatchState = item.dispatch_state ? item.dispatch_state.replaceAll("_", " ") : null;
  return <section className={`dispatch-control ${authorization.authorized ? "dispatch-authorized" : "dispatch-blocked"}`}>
    <header>
      <div><span>Agent work authorization</span><h3>{authorization.authorized ? "Ready for a controlled Buzz handoff" : "Buzz cannot start this work"}</h3></div>
      <StatusPill value={authorization.status} kind={authorization.authorized ? "ready" : "blocked"} />
    </header>
    <p>{authorization.summary}</p>
    <div className="dispatch-checks">
      {authorization.checks.map((check) => <div className={check.met ? "met" : "missing"} key={check.id}><span>{check.met ? "✓" : "!"}</span><div><strong>{check.label}</strong><small>{check.detail}</small></div></div>)}
    </div>
    <div className="dispatch-rule"><strong>One rule</strong><p>The Flight Board authorizes and assigns. Buzz coordinates the conversation. GitHub proves the implementation.</p></div>
    {item.dispatch_intent_id && <div className="dispatch-lifecycle" role="status" aria-live="polite" aria-label="Durable dispatch status">
      <span>Durable handoff</span>
      <strong>{dispatchState} · event v{item.dispatch_event_version ?? 0}</strong>
      <small>Receipt {item.dispatch_intent_id.slice(0, 12)} · updated {item.dispatch_updated_at ? formatDate(item.dispatch_updated_at) : "not recorded"}</small>
    </div>}
    <footer>
      <span>{authorization.authorized ? `Handoff destination: ${authorization.channel}` : "Resolve the missing controls above in this work item."}</span>
      <button type="button" disabled={!authorization.authorized || dispatching || currentReceipt} onClick={onDispatch}>{dispatching ? "Authorizing…" : currentReceipt ? "Receipt already recorded" : copied ? "Handoff copied ✓" : "Authorize & copy Buzz handoff"}</button>
    </footer>
  </section>;
}

function AgentReviewBrief({ item, review, reviewing, onReview, compact = false }: { item: WorkItem; review: AgentReview | null; reviewing: boolean; onReview: () => void; compact?: boolean }) {
  const stale = review ? review.reviewed_item_updated_at !== item.updated_at : false;
  if (!review) {
    return <section className={`agent-review agent-review-empty ${compact ? "agent-review-compact" : ""}`}>
      <div className="agent-review-heading"><span className="critic-mark">◇</span><div><span>AI review brief</span><strong>Get a fresh Critic perspective</strong></div></div>
      <p>The Critic Agent will surface up to three significant findings, dependencies, impact, and the fastest safe next actions. Its advice never replaces the human ruling.</p>
      <button type="button" className="agent-review-button" disabled={reviewing} onClick={onReview}>{reviewing ? "Critic is reviewing…" : "Run Critic review"}</button>
    </section>;
  }

  return <section className={`agent-review ${compact ? "agent-review-compact" : ""}`}>
    <header className="agent-review-header">
      <div className="agent-review-heading"><span className="critic-mark">◇</span><div><span>AI review brief · advisory</span><strong>Critic Agent</strong></div></div>
      <StatusPill value={review.recommendation} kind={review.recommendation.includes("blocker") ? "blocked" : review.recommendation.includes("changes") ? "review" : "ready"} />
    </header>
    {stale && <div className="review-stale">Work changed after this review. Refresh before relying on it.</div>}
    <div className="review-verdict"><span>{review.recommendation}</span><p>{review.summary}</p></div>
    {!compact && <>
      <div className="review-findings">
        <h4>Significant findings</h4>
        {review.findings.length ? review.findings.map((finding, index) => <article className={`finding finding-${finding.severity}`} key={`${finding.title}-${index}`}><span>{finding.severity === "blocker" ? "!" : finding.severity === "should-fix" ? "△" : "i"}</span><div><div><b>{finding.title}</b><em>{finding.severity.replace("-", " ")}</em></div><p>{finding.detail}</p><small>Action: {finding.action}</small></div></article>) : <p className="review-clear">No significant finding was visible in the reviewed scope.</p>}
      </div>
      <div className="review-two-column">
        <div><h4>Dependencies</h4>{review.dependencies.length ? <ul>{review.dependencies.map((value) => <li key={value}>{value}</li>)}</ul> : <p>None identified.</p>}</div>
        <div><h4>Downstream impact</h4>{review.impacts.length ? <ul>{review.impacts.map((value) => <li key={value}>{value}</li>)}</ul> : <p>No material impact identified.</p>}</div>
      </div>
      <div className="review-actions"><h4>What to do now</h4><ol>{review.actions.map((value) => <li key={value}>{value}</li>)}</ol></div>
    </>}
    {compact && review.findings[0] && <div className={`compact-finding finding-${review.findings[0].severity}`}><b>{review.findings[0].title}</b><span>{review.findings[0].action}</span></div>}
    <footer><div><span>{review.confidence} confidence · {formatDate(review.created_at)}</span><small>{review.evidence_scope}</small></div><button type="button" disabled={reviewing} onClick={onReview}>{reviewing ? "Reviewing…" : stale ? "Refresh review" : "Run again"}</button></footer>
  </section>;
}

function buildChangeRequestDraft(review: AgentReview) {
  const consequentialFindings = review.findings.filter((finding) => finding.severity !== "note");
  if (!consequentialFindings.length) return "";

  const instructions = consequentialFindings.map((finding, index) => [
    `${index + 1}. ${finding.title}`,
    `Required change: ${finding.action}`,
    `Reason: ${finding.detail}`,
  ].join("\n")).join("\n\n");
  const dependencies = review.dependencies.slice(0, 3).map((dependency) => `- ${dependency}`).join("\n");

  return [
    "Changes requested based on the current Critic Agent review:",
    instructions,
    dependencies ? `Dependencies to resolve:\n${dependencies}` : "",
    "Please update the work item and linked evidence, then return it for a fresh Critic review.",
  ].filter(Boolean).join("\n\n");
}

function CodeReviewWorkspace({ item, data, loading, saving, error, action, reasoning, confirmation, onAction, onReasoning, onConfirmation, onClose, onRefresh, onSubmit }: {
  item: WorkItem;
  data: CodeReviewData | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  action: "ACCEPT" | "REQUEST_CHANGES" | "MERGE";
  reasoning: string;
  confirmation: string;
  onAction: (action: "ACCEPT" | "REQUEST_CHANGES" | "MERGE") => void;
  onReasoning: (value: string) => void;
  onConfirmation: (value: string) => void;
  onClose: () => void;
  onRefresh: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const pull = data?.pull_request;
  const guidance = data ? decisionGuidance(data) : null;
  const acceptanceDraft = data ? acceptanceReasoningDraft(data) : "";
  return <div className="code-review-scrim">
    <section className="code-review-workspace" role="dialog" aria-modal="true" aria-labelledby="code-review-title">
      <header className="code-review-topbar">
        <div><span>STEER code review · {item.key}</span><h2 id="code-review-title">{pull ? `PR #${pull.number} · ${pull.title}` : "Loading pull request…"}</h2></div>
        <div><button type="button" className="secondary-button" disabled={loading} onClick={onRefresh}>{loading ? "Refreshing…" : "Refresh"}</button><button type="button" aria-label="Close code review" onClick={onClose}>×</button></div>
      </header>
      {error && <div className="code-review-error"><span>!</span><div><strong>Action needs attention</strong><p>{error}</p></div></div>}
      {loading && !data ? <div className="code-review-loading"><span>◇</span><strong>Preparing the exact review revision</strong><p>Reading the pull request, checks, and changed files…</p></div> : data && pull ? <div className="code-review-content">
        <section className="pr-summary-card">
          <div className="pr-identity"><div><span>{data.connection.repository} · {pull.head_ref} → {pull.base_ref}</span><strong>{pull.title}</strong><p>{pull.body || "No pull-request summary was provided."}</p></div><StatusPill value={pull.draft ? "Draft" : pull.state} kind={pull.draft ? "review" : "ready"} /></div>
          <dl><div><dt>Exact commit</dt><dd><code>{pull.head_sha.slice(0, 12)}</code></dd></div><div><dt>Files</dt><dd>{pull.changed_files}</dd></div><div><dt>Change</dt><dd><b className="addition">+{pull.additions}</b> <b className="deletion">−{pull.deletions}</b></dd></div><div><dt>Author</dt><dd>@{pull.author}</dd></div></dl>
          <div className={`github-connection ${data.connection.write ? "connected" : "needs-setup"}`}><span>{data.connection.write ? "✓" : "!"}</span><div><strong>{data.connection.write ? "GitHub actions connected" : "GitHub review is read-only"}</strong><p>{data.connection.message}</p></div></div>
        </section>

        <section className="code-review-grid">
          <article className="code-ai-brief">
            <header><div><span>◇ AI risk brief · advisory</span><h3>{data.ai_review.recommendation}</h3></div><StatusPill value={data.ai_review.findings.some((finding) => finding.severity === "blocker") ? "Action needed" : "Human review"} kind={data.ai_review.findings.some((finding) => finding.severity === "blocker") ? "blocked" : "review"} /></header>
            <p className="code-ai-summary">{data.ai_review.summary}</p>
            <div className="code-findings">{data.ai_review.findings.length ? data.ai_review.findings.map((finding, index) => <div className={`code-finding finding-${finding.severity}`} key={`${finding.title}-${index}`}><span>{finding.severity === "blocker" ? "!" : "△"}</span><div><strong>{finding.title}</strong><p>{finding.detail}</p><small>Next: {finding.action}</small></div></div>) : <div className="code-clear"><span>✓</span><div><strong>No material risk signal found</strong><p>Inspect the changed files and confirm the work-item outcome before accepting.</p></div></div>}</div>
            <div className="code-context-columns"><div><h4>Dependencies</h4><ul>{data.ai_review.dependencies.map((value) => <li key={value}>{value}</li>)}</ul></div><div><h4>Impact</h4><ul>{data.ai_review.impacts.length ? data.ai_review.impacts.map((value) => <li key={value}>{value}</li>) : <li>No additional downstream impact identified.</li>}</ul></div></div>
          </article>

          <aside className={`check-panel ${data.checks.all_green ? "checks-green" : "checks-blocked"}`}>
            <header><div><span>Verification</span><h3>{data.checks.all_green ? "All checks are green" : "Merge is blocked"}</h3></div><b>{data.checks.successful}/{data.checks.total}</b></header>
            <div>{data.checks.items.length ? data.checks.items.map((check) => <div className="check-row" key={check.name}><span>{check.conclusion === "success" || check.conclusion === "neutral" || check.conclusion === "skipped" ? "✓" : check.status !== "completed" ? "…" : "!"}</span><div><strong>{check.name}</strong><small>{check.conclusion ?? check.status}</small></div></div>) : <p>No checks were reported for this commit.</p>}</div>
            <footer><strong>{data.controls.accepted_head ? "✓ Human acceptance recorded" : "Human acceptance still required"}</strong><small>{data.controls.can_merge ? "This exact commit is eligible for confirmed merge." : "Resolve the signals above before merge."}</small></footer>
          </aside>
        </section>

        <section className="changed-files-panel">
          <header><div><span>Changed files</span><h3>Inspect what will change</h3></div><b>{data.files.length} file{data.files.length === 1 ? "" : "s"}</b></header>
          <div className="changed-files-list">{data.files.map((file) => <details key={file.filename}><summary><span className={`file-status status-${file.status}`}>{file.status}</span><strong>{file.filename}</strong><small><b className="addition">+{file.additions}</b> <b className="deletion">−{file.deletions}</b></small></summary>{file.patch ? <pre>{file.patch}</pre> : <p>GitHub did not provide an inline patch for this file.</p>}</details>)}</div>
        </section>

        <form className="code-decision-panel" onSubmit={onSubmit}>
          <header><div><span>Authenticated human action</span><h3>Record what should happen next</h3></div><code>{pull.head_sha.slice(0, 12)}</code></header>
          {guidance && <div className={`code-action-recommendation recommendation-${guidance.recommended_action.toLowerCase().replace("_", "-")}`}><span>◇ AI recommendation · advisory</span><strong>{guidance.headline}</strong><p>{guidance.summary} The authenticated human remains responsible for the decision.</p></div>}
          <div className="code-action-options">
            <label htmlFor="code-action-accept" className={action === "ACCEPT" ? "selected" : ""}><input id="code-action-accept" aria-label="Accept this exact revision" type="radio" name="codeAction" value="ACCEPT" checked={action === "ACCEPT"} onChange={() => { onAction("ACCEPT"); onReasoning(reasoningDraftForAction(data, "ACCEPT")); }} /><span><em className={`ai-action-status tone-${guidance?.actions.accept.tone ?? "neutral"}`}>◇ AI · {guidance?.actions.accept.status ?? "Review"}</em><strong>Accept revision</strong><small>{guidance?.actions.accept.reason ?? "Record human acceptance for this exact commit. Merge remains separate."}</small></span></label>
            <label htmlFor="code-action-changes" className={action === "REQUEST_CHANGES" ? "selected" : ""}><input id="code-action-changes" aria-label="Request changes to this revision" type="radio" name="codeAction" value="REQUEST_CHANGES" checked={action === "REQUEST_CHANGES"} onChange={() => { onAction("REQUEST_CHANGES"); onReasoning(reasoningDraftForAction(data, "REQUEST_CHANGES")); }} /><span><em className={`ai-action-status tone-${guidance?.actions.request_changes.tone ?? "neutral"}`}>◇ AI · {guidance?.actions.request_changes.status ?? "Review"}</em><strong>Request changes</strong><small>{guidance?.actions.request_changes.reason ?? "Send actionable instructions and require a fresh review after the next push."}</small></span></label>
            <label htmlFor="code-action-merge" className={action === "MERGE" ? "selected" : ""}><input id="code-action-merge" aria-label="Merge this accepted revision" type="radio" name="codeAction" value="MERGE" checked={action === "MERGE"} disabled={!data.controls.can_merge} onChange={() => { onAction("MERGE"); onReasoning(reasoningDraftForAction(data, "MERGE")); }} /><span><em className={`ai-action-status tone-${guidance?.actions.merge.tone ?? "neutral"}`}>◇ AI · {guidance?.actions.merge.status ?? "Review"}</em><strong>Merge accepted revision</strong><small>{guidance?.actions.merge.reason ?? (data.controls.can_merge ? "Available after acceptance and green checks." : "Locked until this exact commit is accepted and green.")}</small></span></label>
          </div>
          {action === "ACCEPT" && acceptanceDraft && <div className="code-ai-draft acceptance-draft"><span>◇ AI-proposed acceptance reasoning · editable</span><pre>{acceptanceDraft}</pre><button type="button" onClick={() => onReasoning(acceptanceDraft)}>Restore AI draft</button></div>}
          {action === "REQUEST_CHANGES" && data.ai_review.proposed_change_instructions && <div className="code-ai-draft"><span>◇ AI-proposed instructions · editable</span><pre>{data.ai_review.proposed_change_instructions}</pre><button type="button" onClick={() => onReasoning(data.ai_review.proposed_change_instructions)}>Use this draft</button></div>}
          <label className="code-reasoning">Reasoning<textarea required minLength={12} value={reasoning} onChange={(event) => onReasoning(event.target.value)} placeholder={action === "ACCEPT" ? "Explain why this exact revision is acceptable." : action === "MERGE" ? "Explain why the accepted revision is ready to merge." : "Give specific, executable change instructions."} /></label>
          {action === "MERGE" && <label className="merge-confirmation">Final confirmation<span>Type <code>{data.controls.merge_confirmation}</code></span><input required value={confirmation} onChange={(event) => onConfirmation(event.target.value)} placeholder={data.controls.merge_confirmation} /></label>}
          <footer><div><strong>Human authority stays explicit.</strong><span>Accepting never merges. A new commit invalidates this review.</span></div><button type="submit" disabled={saving || !data.connection.write || (action === "MERGE" && confirmation !== data.controls.merge_confirmation)}>{saving ? "Recording…" : action === "ACCEPT" ? "Record acceptance" : action === "REQUEST_CHANGES" ? "Submit change request" : "Confirm & merge"}</button></footer>
        </form>

        {data.history.length > 0 && <section className="code-review-history"><header><span>Audit trail</span><h3>Prior actions for this pull request</h3></header>{data.history.map((entry) => <article key={entry.id}><span>{entry.action === "ACCEPT" ? "✓" : entry.action === "MERGE" ? "↗" : "!"}</span><div><strong>{entry.action.replace("_", " ")} · {entry.head_sha.slice(0, 12)}</strong><p>{entry.reasoning}</p><small>{entry.actor_email ?? "Authenticated human"} · {formatDate(entry.created_at)} · {entry.github_delivery}</small></div></article>)}</section>}
      </div> : null}
    </section>
  </div>;
}

export default function Home() {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [view, setView] = useState<View>("my-work");
  const [actingRole, setActingRole] = useState<RoleContext>("product");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reviewingIds, setReviewingIds] = useState<number[]>([]);
  const [decisionChoice, setDecisionChoice] = useState("");
  const [decisionReasoning, setDecisionReasoning] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [buzzOpen, setBuzzOpen] = useState(false);
  const [buzzStatus, setBuzzStatus] = useState<BuzzStatus | null>(null);
  const [buzzChecking, setBuzzChecking] = useState(false);
  const [buzzCopied, setBuzzCopied] = useState(false);
  const [dispatchingId, setDispatchingId] = useState<number | null>(null);
  const [copiedHandoffId, setCopiedHandoffId] = useState<number | null>(null);
  const [codeReviewOpen, setCodeReviewOpen] = useState(false);
  const [codeReviewData, setCodeReviewData] = useState<CodeReviewData | null>(null);
  const [codeReviewLoading, setCodeReviewLoading] = useState(false);
  const [codeReviewError, setCodeReviewError] = useState<string | null>(null);
  const [codeAction, setCodeAction] = useState<"ACCEPT" | "REQUEST_CHANGES" | "MERGE">("ACCEPT");
  const [codeReasoning, setCodeReasoning] = useState("");
  const [mergeConfirmation, setMergeConfirmation] = useState("");
  const [itemFeedback, setItemFeedback] = useState<Record<number, ActionFeedback>>({});
  const loadSequence = useRef(0);
  const mutationSequence = useRef(0);
  const latestMutation = useRef(new Map<number, number>());

  async function load(options: { quiet?: boolean } = {}) {
    const sequence = ++loadSequence.current;
    try {
      const payload = await api("/api/bootstrap") as Bootstrap;
      if (sequence !== loadSequence.current) return false;
      setData((current) => current ? mergeBootstrapPreservingNewerItems(current, payload) : payload);
      if (!options.quiet) setError(null);
      return true;
    } catch (caught) {
      if (sequence === loadSequence.current && !options.quiet) setError(caught instanceof Error ? caught.message : "The workspace could not be loaded.");
      return false;
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    const sequence = ++loadSequence.current;
    api("/api/bootstrap")
      .then((payload) => {
        if (!active || sequence !== loadSequence.current) return;
        setData((current) => current ? mergeBootstrapPreservingNewerItems(current, payload as Bootstrap) : payload as Bootstrap);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (active && sequence === loadSequence.current) setError(caught instanceof Error ? caught.message : "The workspace could not be loaded.");
      })
      .finally(() => {
        if (active && sequence === loadSequence.current) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!data || !term) return data?.items ?? [];
    return data.items.filter((item) => [item.key, item.title, item.description, item.assignee_name, item.phase, item.workflow, item.work_type].some((value) => value?.toLowerCase().includes(term)));
  }, [data, search]);

  const selected = data?.items.find((item) => item.id === selectedId) ?? null;
  const itemActivity = data?.activity.filter((event) => event.item_id === selectedId) ?? [];
  const itemEconomicsEvents = data?.work_economics_events.filter((event) => event.item_id === selectedId) ?? [];
  const selectedReview = data?.reviews.find((review) => review.item_id === selectedId) ?? null;
  const freshSelectedReview = selected && selectedReview?.reviewed_item_updated_at === selected.updated_at ? selectedReview : null;
  const changeRequestDraft = freshSelectedReview ? buildChangeRequestDraft(freshSelectedReview) : "";
  const approvalReasoningDraft = selected && freshSelectedReview ? buildApprovalReasoningDraft(selected, freshSelectedReview) : "";
  const gateRecommendation = freshSelectedReview ? recommendGateDecision(freshSelectedReview) : null;
  const gateOneValueReady = selected?.gate !== "Gate 1 pending" || acceptedValueHypothesisReady(selected.work_economics.valueHypothesis);
  const approvalPrerequisiteMissing = decisionChoice === "APPROVED" && !gateOneValueReady;
  const activeDecisionDraft = decisionChoice === "APPROVED" ? approvalReasoningDraft : decisionChoice === "CHANGES_REQUESTED" ? changeRequestDraft : "";
  const decisionItems = data?.items.filter((item) => ["Needed now", "Resubmitted"].includes(item.decision_status)) ?? [];
  const blockedItems = data?.items.filter((item) => item.state === "blocked") ?? [];
  const activeItems = data?.items.filter((item) => item.state === "active") ?? [];

  function beginItemAction(id: number, scope: ActionScope, message: string) {
    const actionId = ++mutationSequence.current;
    latestMutation.current.set(id, actionId);
    setItemFeedback((current) => ({ ...current, [id]: { id: actionId, scope, state: "pending", message } }));
    setError(null);
    return actionId;
  }

  function finishItemAction(id: number, actionId: number, scope: ActionScope, state: "success" | "error", message: string) {
    if (latestMutation.current.get(id) !== actionId) return false;
    setItemFeedback((current) => ({ ...current, [id]: { id: actionId, scope, state, message } }));
    return true;
  }

  function applySnapshot(snapshot: ItemMutationSnapshot) {
    setData((current) => current ? applyAuthoritativeSnapshot(current, snapshot) : current);
  }

  async function updateItem(id: number, changes: Record<string, unknown>, scope: ActionScope = "controls", successMessage = "The authoritative work item was saved.") {
    const actionId = beginItemAction(id, scope, "Waiting for the authoritative server response.");
    setSaving(true);
    try {
      const result = await api(`/api/items/${id}`, { method: "PATCH", body: JSON.stringify(changes) }) as ItemMutationResult;
      const responseReceivedAt = feedbackClock();
      if (latestMutation.current.get(id) !== actionId) return;
      applySnapshot(result.snapshot);
      finishItemAction(id, actionId, scope, "success", successMessage);
      emitFeedbackAfterPaint(responseReceivedAt, "steer_work_item_save_feedback_latency_ms", "steer_work_item_save_outcome_total", "success");
      void load({ quiet: true });
    } catch (caught) {
      finishItemAction(id, actionId, scope, "error", caught instanceof Error ? caught.message : "The item could not be updated. Your input is preserved for correction or retry.");
      emitFeedbackAfterPaint(caught instanceof ApiRequestError ? caught.responseReceivedAt : feedbackClock(), "steer_work_item_save_feedback_latency_ms", "steer_work_item_save_outcome_total", failureOutcome(caught));
    } finally {
      if (latestMutation.current.get(id) === actionId) setSaving(false);
    }
  }

  async function updateWorkEconomics(id: number, section: EconomicsSection, value: Record<string, unknown>, reason: string) {
    const actionId = beginItemAction(id, "economics", "Saving the governed record.");
    setSaving(true);
    setNotice(null);
    try {
      const result = await api(`/api/items/${id}/work-economics`, { method: "PATCH", body: JSON.stringify({ section, value, reason }) }) as ItemMutationResult;
      const responseReceivedAt = feedbackClock();
      if (latestMutation.current.get(id) !== actionId) return;
      applySnapshot(result.snapshot);
      finishItemAction(id, actionId, "economics", "success", section === "valueHypothesis"
        ? "Value hypothesis accepted from the authoritative response. Gate 1 can now be reviewed."
        : "The governed record was saved from the authoritative response.");
      emitFeedbackAfterPaint(responseReceivedAt, "steer_work_item_save_feedback_latency_ms", "steer_work_item_save_outcome_total", "success");
      void load({ quiet: true });
    } catch (caught) {
      finishItemAction(id, actionId, "economics", "error", caught instanceof Error ? caught.message : "The Work Economics record could not be updated. Your input is preserved.");
      emitFeedbackAfterPaint(caught instanceof ApiRequestError ? caught.responseReceivedAt : feedbackClock(), "steer_work_item_save_feedback_latency_ms", "steer_work_item_save_outcome_total", failureOutcome(caught));
    } finally {
      if (latestMutation.current.get(id) === actionId) setSaving(false);
    }
  }

  async function createItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await api("/api/items", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      setCreateOpen(false);
      await load();
      setView("backlog");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The item could not be created.");
    } finally {
      setSaving(false);
    }
  }

  async function recordDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const result = await api(`/api/items/${selected.id}/decisions`, {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(form.entries())),
      }) as ItemMutationResult;
      applySnapshot(result.snapshot);
      closeDecisionWorkspace();
      setNotice(`${selected.gate} ruling recorded from the authoritative response. The work item is refreshed.`);
      void load({ quiet: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The ruling could not be recorded.");
    } finally {
      setSaving(false);
    }
  }

  async function requestAgentReview(itemId: number) {
    setReviewingIds((current) => current.includes(itemId) ? current : [...current, itemId]);
    try {
      await api(`/api/items/${itemId}/reviews`, { method: "POST", body: "{}" });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The Critic Agent could not complete the review.");
    } finally {
      setReviewingIds((current) => current.filter((id) => id !== itemId));
    }
  }

  async function transitionWorkflow(item: WorkItem, action: "START_REWORK" | "RESUBMIT") {
    setSaving(true);
    try {
      await api(`/api/items/${item.id}/workflow`, { method: "POST", body: JSON.stringify({ action }) });
      if (action === "RESUBMIT") {
        setReviewingIds((current) => current.includes(item.id) ? current : [...current, item.id]);
        await api(`/api/items/${item.id}/reviews`, { method: "POST", body: "{}" });
      }
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The workflow transition could not be completed.");
    } finally {
      setSaving(false);
      setReviewingIds((current) => current.filter((id) => id !== item.id));
    }
  }

  async function markNotificationRead(notificationId: number) {
    try {
      await api(`/api/notifications/${notificationId}/read`, { method: "POST", body: "{}" });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The notification could not be updated.");
    }
  }

  async function loadCodeReview(item: WorkItem, initializeDecision = false) {
    setCodeReviewLoading(true);
    try {
      const payload = await api(`/api/items/${item.id}/code-review`) as CodeReviewData;
      setCodeReviewData(payload);
      if (initializeDecision) {
        const recommended = decisionGuidance(payload).recommended_action;
        const initialAction = recommended === "REQUEST_CHANGES" ? "REQUEST_CHANGES" : recommended === "MERGE" ? "MERGE" : "ACCEPT";
        setCodeAction(initialAction);
        setCodeReasoning(reasoningDraftForAction(payload, initialAction));
      } else {
        setCodeReasoning((current) => current.trim() ? current : reasoningDraftForAction(payload, codeAction));
      }
      setCodeReviewError(null);
      setError(null);
      return payload;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "The pull-request review could not be loaded.";
      setCodeReviewError(message);
      setError(message);
    } finally {
      setCodeReviewLoading(false);
    }
  }

  function openCodeReview(item: WorkItem) {
    setSelectedId(item.id);
    setCodeReviewOpen(true);
    setCodeReviewData(null);
    setCodeReviewError(null);
    setCodeAction("ACCEPT");
    setCodeReasoning("");
    setMergeConfirmation("");
    void loadCodeReview(item, true);
  }

  function closeCodeReview() {
    setCodeReviewOpen(false);
    setCodeReviewData(null);
    setCodeReviewError(null);
    setMergeConfirmation("");
  }

  async function submitCodeReviewAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !codeReviewData) return;
    setSaving(true);
    try {
      await api(`/api/items/${selected.id}/code-review`, {
        method: "POST",
        body: JSON.stringify({ action: codeAction, reasoning: codeReasoning, confirmation: mergeConfirmation, headSha: codeReviewData.pull_request.head_sha }),
      });
      await Promise.all([load(), loadCodeReview(selected)]);
      setCodeAction(codeAction === "ACCEPT" ? "MERGE" : "ACCEPT");
      setCodeReasoning("");
      setMergeConfirmation("");
      setCodeReviewError(null);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "The code-review action could not be completed.";
      setCodeReviewError(message);
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  function reviewNeedsRefresh(item: WorkItem) {
    const review = data?.reviews.find((candidate) => candidate.item_id === item.id);
    return !review || review.reviewed_item_updated_at !== item.updated_at;
  }

  function openDecisionWorkspace(item: WorkItem) {
    setSelectedId(item.id);
    setDecisionChoice("");
    setDecisionReasoning("");
    setDecisionOpen(true);
    if (reviewNeedsRefresh(item) && !reviewingIds.includes(item.id)) void requestAgentReview(item.id);
  }

  function closeDecisionWorkspace() {
    setDecisionOpen(false);
    setDecisionChoice("");
    setDecisionReasoning("");
  }

  function reviewGateOneValuePrerequisite() {
    if (!selected) return;
    const itemId = selected.id;
    closeDecisionWorkspace();
    requestAnimationFrame(() => {
      document.getElementById(`value-hypothesis-${itemId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function navigateTo(nextView: View) {
    setView(nextView);
    setMobileNav(false);
    if (nextView === "decisions") {
      for (const item of decisionItems) {
        if (reviewNeedsRefresh(item) && !reviewingIds.includes(item.id)) void requestAgentReview(item.id);
      }
    }
  }

  function openItem(item: WorkItem) {
    setSelectedId(item.id);
    setDecisionOpen(false);
  }

  async function openBuzzWorkspace() {
    setBuzzOpen(true);
    setBuzzCopied(false);
    setBuzzChecking(true);
    try {
      const status = await api("/api/buzz-status") as BuzzStatus;
      setBuzzStatus(status);
    } catch {
      setBuzzStatus({ online: false, relay: buzzRelayUrl, version: null, auth_required: true, checked_at: new Date().toISOString() });
    } finally {
      setBuzzChecking(false);
    }
  }

  async function copyBuzzRelay() {
    try {
      await navigator.clipboard.writeText(buzzRelayUrl);
      setBuzzCopied(true);
    } catch {
      setBuzzCopied(false);
    }
  }

  async function authorizeBuzzHandoff(item: WorkItem) {
    const actionId = beginItemAction(item.id, "dispatch", "Authorizing one durable handoff.");
    setDispatchingId(item.id);
    try {
      const result = await api(`/api/items/${item.id}/dispatch`, { method: "POST", body: "{}" }) as ItemMutationResult;
      const responseReceivedAt = feedbackClock();
      if (!result.message) throw new Error("The authorized handoff message was not returned.");
      if (latestMutation.current.get(item.id) !== actionId) return;
      applySnapshot(result.snapshot);
      try {
        await navigator.clipboard.writeText(result.message);
      } catch {
        finishItemAction(item.id, actionId, "dispatch", "error", "The handoff was authorized once, but the message could not be copied. Do not authorize it again; use the recorded activity and outbox entry.");
        emitFeedbackAfterPaint(responseReceivedAt, "steer_agent_handoff_feedback_latency_ms", "steer_agent_handoff_outcome_total", result.idempotent_replay ? "duplicate_suppressed" : "queued");
        void load({ quiet: true });
        return;
      }
      setCopiedHandoffId(item.id);
      finishItemAction(item.id, actionId, "dispatch", "success", "One handoff was authorized and copied. The drawer now shows the authoritative state.");
      emitFeedbackAfterPaint(responseReceivedAt, "steer_agent_handoff_feedback_latency_ms", "steer_agent_handoff_outcome_total", result.idempotent_replay ? "duplicate_suppressed" : "queued");
      void load({ quiet: true });
    } catch (caught) {
      finishItemAction(item.id, actionId, "dispatch", "error", caught instanceof Error ? caught.message : "The agent handoff could not be authorized. No retry was started.");
      emitFeedbackAfterPaint(caught instanceof ApiRequestError ? caught.responseReceivedAt : feedbackClock(), "steer_agent_handoff_feedback_latency_ms", "steer_agent_handoff_outcome_total", caught instanceof ApiRequestError && caught.status === 409 ? "blocked" : "error");
    } finally {
      setDispatchingId(null);
    }
  }

  if (loading) {
    return <div className="app-loading"><span className="loading-mark"><i /><i /><i /></span><strong>Preparing your STEER workspace</strong><p>Loading work, evidence, and team authority…</p></div>;
  }

  if (!data) {
    return <div className="app-loading error-screen"><span>!</span><strong>Workspace unavailable</strong><p>{error}</p><button onClick={() => { setLoading(true); void load(); }}>Try again</button></div>;
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="product-brand">
          <span className="brand-mark"><i /><i /><i /></span>
          <div><strong>STEER</strong><span>Work Management</span></div>
        </div>

        <div className="workspace-switcher">
          <span className="workspace-avatar">FB</span>
          <div><strong>Federal BD Pilot</strong><span>Setup / calibration</span></div>
          <b>⌄</b>
        </div>

        <nav className="side-nav" aria-label="Workspace navigation">
          <span className="nav-label">Workspace</span>
          {navigation.map((item) => (
            <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => navigateTo(item.id)}>
              <span aria-hidden="true">{item.icon}</span>{item.label}
              {item.id === "decisions" && decisionItems.length > 0 && <b>{decisionItems.length}</b>}
            </button>
          ))}
        </nav>

        <div className="side-links">
          <span className="nav-label">Connected records</span>
          <a href="https://github.com/users/idrissenayat/projects/1/views/2" target="_blank" rel="noreferrer"><span>↗</span> GitHub Project</a>
          <a href={githubRoot} target="_blank" rel="noreferrer"><span>⌂</span> Repository</a>
          <button type="button" onClick={() => void openBuzzWorkspace()} title="Connect to the team Block Buzz workspace"><span>◌</span> Block Buzz</button>
        </div>

        <div className="authority-card">
          <span>Human authority rule</span>
          <p>Agents prepare evidence. Only the named human records a gate ruling.</p>
        </div>

        <div className="user-card">
          <Avatar name={data.user.name} />
          <div><strong>{data.user.name}</strong><span>{data.user.role}</span></div>
          <i className="online-dot" />
        </div>
      </aside>

      <main className="main-workspace">
        <header className="app-topbar">
          <button className="mobile-menu" aria-label="Open navigation" onClick={() => setMobileNav((value) => !value)}>☰</button>
          <div className="global-search">
            <span aria-hidden="true">⌕</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search work, evidence, people…" aria-label="Search work" />
            <kbd>/</kbd>
          </div>
          <div className="top-actions">
            <a href={`${githubRoot}/issues/14`} target="_blank" rel="noreferrer" title="Open current GitHub issue">Evidence ↗</a>
            <button className="create-button" onClick={() => setCreateOpen(true)}><span>＋</span> Create work item</button>
          </div>
        </header>

        {error && <div className="action-feedback action-feedback-error" role="alert" aria-live="assertive"><div><strong>Action not completed</strong><span>{error}</span></div><button onClick={() => setError(null)}>Dismiss</button></div>}
        {notice && <div className="action-feedback action-feedback-success" role="status" aria-live="polite"><div><strong>Saved</strong><span>{notice}</span></div><button onClick={() => setNotice(null)}>Dismiss</button></div>}

        <div className="content-area">
          {view === "my-work" && (
            <MyWork
              user={data.user}
              generatedAt={data.generated_at}
              actingRole={actingRole}
              onRoleChange={setActingRole}
              items={filteredItems}
              activity={data.activity}
              pullForecast={data.pull_forecast}
              reviews={data.reviews}
              notifications={data.notifications}
              members={data.members}
              saving={saving}
              onOpen={openItem}
              onDecision={openDecisionWorkspace}
              onTransition={transitionWorkflow}
              onReadNotification={markNotificationRead}
            />
          )}
          {view === "overview" && (
            <Overview
              items={filteredItems}
              activity={data.activity}
              decisions={decisionItems}
              blocked={blockedItems}
              active={activeItems}
              onOpen={openItem}
              onNavigate={navigateTo}
            />
          )}
          {view === "board" && <FlightBoard items={filteredItems} onOpen={openItem} onMove={updateItem} saving={saving} />}
          {view === "backlog" && <Backlog items={filteredItems} onOpen={openItem} onCreate={() => setCreateOpen(true)} />}
          {view === "decisions" && <DecisionInbox items={decisionItems} decisions={data.decisions} reviews={data.reviews} reviewingIds={reviewingIds} onOpen={openDecisionWorkspace} />}
          {view === "team" && <Team members={data.members} items={data.items} onOpenBuzz={() => void openBuzzWorkspace()} />}
        </div>
      </main>

      {selected && (
        <div className="drawer-scrim">
          <aside className="item-drawer" aria-label={`${selected.key} details`}>
            <header className="drawer-header">
              <div><span>{selected.key}</span><StatusPill value={selected.workflow} /></div>
              <button aria-label="Close item" onClick={() => setSelectedId(null)}>×</button>
            </header>
            <div className="drawer-body">
              <h2>{selected.title}</h2>
              <p className="drawer-description">{selected.description}</p>

              {["Needed now", "Resubmitted"].includes(selected.decision_status) && (
                <div className="decision-callout">
                  <div><span>◆ {selected.decision_status === "Resubmitted" ? "Rework resubmitted" : "Human ruling required"}</span><strong>{selected.gate}</strong><p>Authority: {selected.decision_authority}</p></div>
                  <button onClick={() => openDecisionWorkspace(selected)}>Review decision</button>
                </div>
              )}

              {["Changes requested", "Rework"].includes(selected.decision_status) && (
                <div className="rework-callout">
                  <div className="rework-callout-heading"><span>↺ {selected.decision_status}</span><StatusPill value={selected.assignee_name ?? "Unassigned"} kind="agent" /></div>
                  <strong>Return path is explicit</strong>
                  <p>{selected.rework_instructions ?? "Complete the recorded change request and update the linked evidence."}</p>
                  <div><small>{selected.decision_status === "Changes requested" ? "Begin only when the owner is ready to work the evidence." : "Resubmit only after the evidence link points to the updated artifact."}</small><button disabled={saving} onClick={() => void transitionWorkflow(selected, selected.decision_status === "Changes requested" ? "START_REWORK" : "RESUBMIT")}>{saving ? "Updating…" : selected.decision_status === "Changes requested" ? "Start rework" : "Resubmit evidence"}</button></div>
                </div>
              )}

              <AgentReviewBrief item={selected} review={selectedReview} reviewing={reviewingIds.includes(selected.id)} onReview={() => void requestAgentReview(selected.id)} />

              <section className="detail-section">
                <h3>Work controls</h3>
                <div className="field-grid">
                  <label>Phase<select value={selected.phase} disabled={saving} onChange={(event) => void updateItem(selected.id, { phase: event.target.value })}>{phases.map((phase) => <option key={phase}>{phase}</option>)}</select></label>
                  <label>State<select value={selected.state} disabled={saving} onChange={(event) => void updateItem(selected.id, { state: event.target.value })}>{states.map((state) => <option key={state}>{state}</option>)}</select></label>
                  <label>Priority<select value={selected.priority} disabled={saving} onChange={(event) => void updateItem(selected.id, { priority: event.target.value })}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
                  <label>Workflow<select value={selected.workflow} disabled={saving} onChange={(event) => void updateItem(selected.id, { workflow: event.target.value })}>{workflows.map((workflow) => <option key={workflow}>{workflow}</option>)}</select></label>
                  <label>Work type<select value={selected.work_type} disabled={saving} onChange={(event) => void updateItem(selected.id, { workType: event.target.value })}>{WORK_TYPES.map((workType) => <option key={workType}>{workType}</option>)}</select></label>
                  <label>Decision readiness<select value={selected.decision_status} disabled={saving} onChange={(event) => void updateItem(selected.id, { decisionStatus: event.target.value })}>{["Waiting", "Needed now", "Changes requested", "Rework", "Resubmitted", "Decided", "Not required"].map((status) => <option key={status}>{status}</option>)}</select></label>
                  <label className="span-two">Assignee<select value={selected.assignee_id ?? ""} disabled={saving} onChange={(event) => void updateItem(selected.id, { assigneeId: event.target.value || null })}><option value="">Unassigned</option>{data.members.map((member) => <option key={member.id} value={member.id}>{member.display_name} · {member.role}</option>)}</select></label>
                  <label className="span-two">Evidence URL<input key={`evidence-${selected.id}`} defaultValue={selected.evidence_url ?? ""} disabled={saving} placeholder="https://github.com/organization/repository/blob/revision/path.md" onBlur={(event) => { const value = event.target.value.trim(); if (value !== (selected.evidence_url ?? "")) void updateItem(selected.id, { evidenceUrl: value || null }); }} /></label>
                  <label className="span-two">Engineering record<input key={`github-${selected.id}`} defaultValue={selected.github_url ?? ""} disabled={saving} placeholder="https://github.com/idrissenayat/federal-bd-platform/issues/31" onBlur={(event) => { const value = event.target.value.trim(); if (value !== (selected.github_url ?? "")) void updateItem(selected.id, { githubUrl: value || null }); }} /></label>
                </div>
                <InlineActionFeedback feedback={itemFeedback[selected.id]?.scope === "controls" ? itemFeedback[selected.id] : null} />
              </section>

              <WorkEconomicsPanel
                item={selected}
                events={itemEconomicsEvents}
                members={data.members}
                serviceLevels={data.service_level_distributions}
                currentUserId={data.user.id}
                saving={saving}
                onSave={(section, value, reason) => updateWorkEconomics(selected.id, section, value, reason)}
              />
              <InlineActionFeedback feedback={itemFeedback[selected.id]?.scope === "economics" ? itemFeedback[selected.id] : null} />

              <AgentDispatchControl item={selected} dispatching={dispatchingId === selected.id} copied={copiedHandoffId === selected.id} onDispatch={() => void authorizeBuzzHandoff(selected)} />
              <InlineActionFeedback feedback={itemFeedback[selected.id]?.scope === "dispatch" ? itemFeedback[selected.id] : null} />

              <NextActionEditor
                key={`${selected.id}-${selected.updated_at}`}
                item={selected}
                saving={saving}
                feedback={itemFeedback[selected.id]?.scope === "next-action" ? itemFeedback[selected.id] : null}
                onSave={(value) => updateItem(selected.id, { nextAction: value }, "next-action", "Next action saved from the authoritative response.")}
              />

              <section className="detail-section">
                <h3>Evidence & engineering record</h3>
                {linkedPullRequest(selected) && <button type="button" className="open-code-review" onClick={() => openCodeReview(selected)}><span>⌘</span><div><strong>Review pull request inside STEER</strong><small>Summary, checks, changed files, AI risk brief, human action, and confirmed merge</small></div><b>Open →</b></button>}
                <div className="evidence-links">
                  {selected.evidence_url ? <a href={selected.evidence_url} target="_blank" rel="noreferrer"><span>▤</span><div><strong>Evidence artifact</strong><small>{selected.evidence_url}</small></div><b>↗</b></a> : <div className="missing-evidence">No evidence link attached yet.</div>}
                  {selected.github_url && <a href={selected.github_url} target="_blank" rel="noreferrer"><span>⌂</span><div><strong>GitHub record</strong><small>Authoritative engineering trail</small></div><b>↗</b></a>}
                </div>
                {selectedReview?.evidence_sha256 && <div className="evidence-binding"><span>✓ Evidence bound</span><strong>{selectedReview.evidence_revision ? `Revision ${selectedReview.evidence_revision.slice(0, 12)}` : `SHA-256 ${selectedReview.evidence_sha256.slice(0, 12)}`}</strong><small>The Critic reviewed this exact content, not a moving branch label.</small></div>}
              </section>

              <section className="detail-section activity-section">
                <h3>Activity</h3>
                {itemActivity.length ? itemActivity.map((event) => <div className="activity-row" key={event.id}><Avatar name={event.actor_name} /><div><p><strong>{event.actor_name ?? "Contributor"}</strong> {event.detail}</p><span>{formatDate(event.created_at)}</span></div></div>) : <p className="muted">No activity recorded.</p>}
              </section>
            </div>
          </aside>
        </div>
      )}

      {selected && codeReviewOpen && <CodeReviewWorkspace
        item={selected}
        data={codeReviewData}
        loading={codeReviewLoading}
        saving={saving}
        error={codeReviewError}
        action={codeAction}
        reasoning={codeReasoning}
        confirmation={mergeConfirmation}
        onAction={setCodeAction}
        onReasoning={setCodeReasoning}
        onConfirmation={setMergeConfirmation}
        onClose={closeCodeReview}
        onRefresh={() => void loadCodeReview(selected)}
        onSubmit={submitCodeReviewAction}
      />}

      {createOpen && (
        <div className="modal-scrim">
          <form className="modal-card create-modal" onSubmit={createItem}>
            <header><div><span>New work item</span><h2>Bring a signal into STEER</h2></div><button type="button" onClick={() => setCreateOpen(false)}>×</button></header>
            <p className="modal-intro">Create a durable item with enough context to enter Sense. Gate 1 will remain pending until a human Product Lead rules.</p>
            <label>Title<input name="title" required minLength={3} placeholder="What outcome needs attention?" /></label>
            <label>Description<textarea name="description" required minLength={10} placeholder="Why this matters and what would be different if it succeeds" /></label>
            <div className="form-grid">
              <label>Initial phase<select name="phase" defaultValue="Sense">{phases.map((phase) => <option key={phase}>{phase}</option>)}</select></label>
              <label>Priority<select name="priority" defaultValue="Next">{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
              <label>Workflow<select name="workflow" defaultValue="Unassigned">{workflows.map((workflow) => <option key={workflow}>{workflow}</option>)}</select></label>
              <label>Work type<select name="workType" defaultValue="Unclassified">{WORK_TYPES.map((workType) => <option key={workType}>{workType}</option>)}</select></label>
              <label>Assignee<select name="assigneeId" defaultValue=""><option value="">Unassigned</option>{data.members.map((member) => <option value={member.id} key={member.id}>{member.display_name}</option>)}</select></label>
            </div>
            <label>Next action<input name="nextAction" placeholder="Frame the intended outcome and prepare Gate 1 evidence." /></label>
            <label>Engineering record<input name="githubUrl" type="url" placeholder="https://github.com/idrissenayat/federal-bd-platform/issues/31" /></label>
            <footer><button type="button" className="secondary-button" onClick={() => setCreateOpen(false)}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? "Creating…" : "Create in backlog"}</button></footer>
          </form>
        </div>
      )}

      {decisionOpen && selected && (
        <div className="modal-scrim decision-scrim">
          <form className="modal-card decision-modal" onSubmit={recordDecision}>
            <input type="hidden" name="reviewId" value={freshSelectedReview?.id ?? ""} />
            <header><div><span>◆ Authenticated human ruling</span><h2>{selected.gate}</h2></div><button type="button" onClick={closeDecisionWorkspace}>×</button></header>
            <div className="decision-item-summary"><span>{selected.key}</span><strong>{selected.title}</strong><p>{selected.description}</p></div>
            <AgentReviewBrief compact item={selected} review={selectedReview} reviewing={reviewingIds.includes(selected.id)} onReview={() => void requestAgentReview(selected.id)} />
            {gateRecommendation && <section className={`gate-ai-recommendation recommendation-${gateRecommendation.action === "APPROVED" && gateOneValueReady ? "approve" : "changes"}`}><header><span>◇ AI recommendation</span><strong>{gateRecommendation.action === "APPROVED" && !gateOneValueReady ? "Complete one prerequisite" : gateRecommendation.label}</strong></header><p>{gateRecommendation.action === "APPROVED" && !gateOneValueReady ? "The evidence supports approval, but Gate 1 remains locked until you accept the AI-prepared Value Hypothesis. Nothing needs to be written from scratch." : gateRecommendation.reason}</p><small>Advisory only. You must select a ruling, review or edit its reasoning, and record it yourself.</small></section>}
            {freshSelectedReview?.evidence_sha256 ? <div className="decision-evidence-bound"><span>✓ Exact evidence captured</span><strong>{freshSelectedReview.evidence_revision ? freshSelectedReview.evidence_revision.slice(0, 12) : freshSelectedReview.evidence_sha256.slice(0, 12)}</strong><small>This ruling will retain the Critic review and content fingerprint.</small></div> : <div className="review-stale">A fresh review with resolvable evidence is required before this ruling can be recorded.</div>}
            {!gateOneValueReady && <section className="decision-prerequisite" role="alert"><div><span>Required before Gate 1 approval</span><strong>Accept the AI-prepared Value Hypothesis</strong><p>The proposal is already filled. Review it, accept it unchanged or edit it, then return here. The app will confirm the save and refresh this item.</p></div><button type="button" onClick={reviewGateOneValuePrerequisite}>Review prepared proposal</button></section>}
            <div className="authority-warning"><strong>You are acting as {selected.decision_authority}.</strong><p>This ruling is attributed to {data.user.email ?? data.user.name}. Agents cannot submit this form without an authenticated human identity.</p></div>
            <fieldset><legend>Ruling</legend><label className={`radio-card ${gateRecommendation?.action === "APPROVED" && gateOneValueReady ? "ai-recommended" : ""}`}><input aria-label="Approve this gate" type="radio" name="decision" value="APPROVED" required checked={decisionChoice === "APPROVED"} onChange={() => { setDecisionChoice("APPROVED"); setDecisionReasoning(approvalReasoningDraft); }} /><span>{gateRecommendation?.action === "APPROVED" && gateOneValueReady && <em>◇ AI recommends</em>}<strong>Approve</strong><small>{gateOneValueReady ? "Evidence is sufficient for this gate. Advance the work." : "Available after the prepared Value Hypothesis is accepted."}</small></span></label><label className={`radio-card ${gateRecommendation?.action === "CHANGES_REQUESTED" ? "ai-recommended" : ""}`}><input aria-label="Request changes for this gate" type="radio" name="decision" value="CHANGES_REQUESTED" required checked={decisionChoice === "CHANGES_REQUESTED"} onChange={() => { setDecisionChoice("CHANGES_REQUESTED"); setDecisionReasoning(changeRequestDraft); }} /><span>{gateRecommendation?.action === "CHANGES_REQUESTED" && <em>◇ AI recommends</em>}<strong>Request changes</strong><small>Keep the gate pending and block work until the named gaps are resolved.</small></span></label></fieldset>
            {decisionChoice === "APPROVED" && approvalReasoningDraft && <section className="ai-reasoning-draft"><header><div><span>◇ Critic-drafted approval reasoning</span><strong>Ready for your review</strong></div><button type="button" disabled={decisionReasoning === approvalReasoningDraft} onClick={() => setDecisionReasoning(approvalReasoningDraft)}>{decisionReasoning === approvalReasoningDraft ? "Draft applied" : "Restore AI draft"}</button></header><p>AI prepared this from the exact Critic review. Edit it as needed; recording the ruling remains your decision.</p><pre>{approvalReasoningDraft}</pre></section>}
            {decisionChoice === "CHANGES_REQUESTED" && changeRequestDraft && <section className="ai-reasoning-draft"><header><div><span>◇ Critic-drafted instructions</span><strong>Ready for your reasoning</strong></div><button type="button" disabled={decisionReasoning === changeRequestDraft} onClick={() => setDecisionReasoning(changeRequestDraft)}>{decisionReasoning === changeRequestDraft ? "Draft applied" : decisionReasoning.trim() ? "Restore AI draft" : "Use AI draft"}</button></header><p>Editable advice from the current review. You remain the author and decision authority.</p><pre>{changeRequestDraft}</pre></section>}
            {decisionChoice === "CHANGES_REQUESTED" && !changeRequestDraft && reviewingIds.includes(selected.id) && <div className="draft-waiting"><span>◇</span><p><strong>Critic is preparing proposed instructions.</strong> You can write now or apply the draft when the review finishes.</p></div>}
            <label><span className="reasoning-label-row"><span>Reasoning</span>{activeDecisionDraft && decisionReasoning === activeDecisionDraft && <em>AI draft applied · editable</em>}</span><textarea name="reasoning" required minLength={12} value={decisionReasoning} onChange={(event) => setDecisionReasoning(event.target.value)} placeholder="State why this evidence is or is not sufficient. This becomes part of the audit trail." /></label>
            <footer><button type="button" className="secondary-button" onClick={closeDecisionWorkspace}>Cancel</button><button className="decision-button" disabled={saving || !freshSelectedReview?.evidence_sha256 || approvalPrerequisiteMissing}>{saving ? "Recording…" : approvalPrerequisiteMissing ? "Complete prerequisite first" : "Record human ruling"}</button></footer>
          </form>
        </div>
      )}

      {buzzOpen && (
        <div className="modal-scrim buzz-scrim">
          <section className="modal-card buzz-modal" role="dialog" aria-modal="true" aria-labelledby="buzz-title">
            <header><div><span>Block Buzz team communication</span><h2 id="buzz-title">Connect to the STEER team workspace</h2></div><button type="button" aria-label="Close Buzz connection guide" onClick={() => setBuzzOpen(false)}>×</button></header>
            <div className={`buzz-health ${buzzChecking ? "checking" : buzzStatus?.online ? "online" : "offline"}`}>
              <i />
              <div><strong>{buzzChecking ? "Checking the team relay…" : buzzStatus?.online ? "Team relay is online" : "Team relay could not be reached"}</strong><span>{buzzStatus?.online ? `Buzz Relay ${buzzStatus.version ?? ""} is accepting connections.` : "Retry in a moment or notify the Platform / Ops Lead."}</span></div>
              {!buzzChecking && <button type="button" onClick={() => void openBuzzWorkspace()}>Check again</button>}
            </div>
            <p className="modal-intro">Buzz is a desktop workspace, while the address below is its secure relay. The previous link failed because a browser cannot open a WebSocket relay as a webpage.</p>
            <div className="buzz-work-rule"><span>Work-control rule</span><strong>Never assign or reprioritize an agent in Buzz.</strong><p>Open the work item here, satisfy its authorization checklist, and use its generated handoff. A mention is a notification—not permission to start.</p></div>
            <ol className="buzz-steps">
              <li><b>Install or open Buzz.</b><span>Use the official macOS, Windows, or Linux app.</span></li>
              <li><b>Add an existing community or relay.</b><span>In Buzz, choose the option to connect to a relay you already have.</span></li>
              <li><b>Paste the STEER team relay.</b><span>Use the exact address below; the workspace is invite-only.</span></li>
              <li><b>Join the team channels.</b><span>Ask the community owner for an invitation if Buzz says your identity is not yet authorized.</span></li>
            </ol>
            <div className="buzz-relay-field"><span className="buzz-relay-label">STEER team relay</span><div><input readOnly value={buzzRelayUrl} aria-label="STEER team Buzz relay URL" /><button type="button" onClick={() => void copyBuzzRelay()}>{buzzCopied ? "Copied ✓" : "Copy relay"}</button></div><small>{buzzStatus?.auth_required !== false ? "Authenticated, invite-only workspace" : "Workspace access is managed in Buzz"} · never share your private key</small></div>
            <footer><button type="button" className="secondary-button" onClick={() => setBuzzOpen(false)}>Close</button><a className="primary-button buzz-download" href={buzzDownloadUrl} target="_blank" rel="noreferrer">Open / download Buzz ↗</a></footer>
          </section>
        </div>
      )}
    </div>
  );
}

function PageHeading({ eyebrow, title, copy, actions }: { eyebrow: string; title: string; copy: string; actions?: React.ReactNode }) {
  return <div className="page-heading"><div><span>{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div>{actions && <div className="heading-actions">{actions}</div>}</div>;
}

type RoleRoutableItem = Pick<WorkItem, "id" | "state" | "assignee_id" | "decision_authority" | "gate" | "phase" | "title" | "description">;

function itemMatchesRole(item: RoleRoutableItem, role: RoleContext, reviews: AgentReview[]) {
  const review = reviews.find((candidate) => candidate.item_id === item.id);
  const tags = review?.derived_tags ?? [];
  if (role === "product") return item.decision_authority.includes("Product Lead") || item.gate === "Gate 1 pending" || ["Sense", "Learn"].includes(item.phase);
  if (role === "tech") return item.decision_authority.includes("Tech Lead") || item.gate === "Gate 2 pending" || ["Engineer", "Evaluate"].includes(item.phase);
  if (role === "design") return tags.some((tag) => ["#a11y", "#design-system"].includes(tag)) || ["Frame", "Evaluate"].includes(item.phase);
  if (role === "platform") return item.assignee_id === "agent-ops" || /platform|environment|block buzz|deploy|rollback|telemetry|pipeline|protected main/i.test(`${item.title} ${item.description}`) || ["Release", "Observe"].includes(item.phase);
  if (role === "security") return tags.includes("#security") || item.decision_authority.includes("Security");
  return Boolean(item.assignee_id);
}

export function itemVisibleInMyWork(item: RoleRoutableItem, userId: string, role: RoleContext, reviews: AgentReview[]) {
  if (item.state === "complete") return false;
  return item.assignee_id === userId || itemMatchesRole(item, role, reviews);
}

export type BacklogScope = "all" | "open" | "closed";
export type BacklogDateField = "created_at" | "closed_at";

export function backlogItemsForScope<T extends { state: string }>(items: T[], scope: BacklogScope) {
  if (scope === "open") return items.filter((item) => item.state !== "complete");
  if (scope === "closed") return items.filter((item) => item.state === "complete");
  return items;
}

function localDateKey(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function backlogItemsForDateRange<T extends { created_at: string; closed_at: string | null }>(items: T[], field: BacklogDateField, from: string, to: string) {
  if (!from && !to) return items;
  return items.filter((item) => {
    const date = localDateKey(item[field]);
    if (!date) return false;
    return (!from || date >= from) && (!to || date <= to);
  });
}

function RoleWorkCard({ item, canAct, saving, onOpen, onDecision, onTransition }: { item: WorkItem; canAct: boolean; saving: boolean; onOpen: (item: WorkItem) => void; onDecision: (item: WorkItem) => void; onTransition: (item: WorkItem, action: "START_REWORK" | "RESUBMIT") => Promise<void> }) {
  const needsDecision = ["Needed now", "Resubmitted"].includes(item.decision_status);
  const returned = item.decision_status === "Changes requested";
  const inRework = item.decision_status === "Rework";
  const action = !canAct ? "Inspect work" : needsDecision ? "Review ruling" : returned ? "Start rework" : inRework ? "Resubmit evidence" : "Open work";
  function act() {
    if (!canAct) return onOpen(item);
    if (needsDecision) return onDecision(item);
    if (returned) return void onTransition(item, "START_REWORK");
    if (inRework) return void onTransition(item, "RESUBMIT");
    onOpen(item);
  }
  return <article className={`role-work-card state-${item.state}`}><header><span>{item.key} · {item.phase}</span><StatusPill value={item.decision_status} /></header><h3>{item.title}</h3><p>{["Changes requested", "Rework"].includes(item.decision_status) ? item.rework_instructions ?? item.next_action : item.next_action}</p><ForecastSummary item={item} compact /><footer><span><Avatar name={item.assignee_name} kind={item.assignee_kind ?? "human"} /> {item.assignee_name ?? "Unassigned"}</span><button disabled={saving} onClick={act}>{action} →</button></footer></article>;
}

function ageLabel(value: string | null, referenceTime: number) {
  if (!value) return "Not tracked";
  const elapsed = referenceTime - new Date(value).getTime();
  if (!Number.isFinite(elapsed) || elapsed < 0) return "Just now";
  const hours = Math.floor(elapsed / 3_600_000);
  if (hours < 1) return `${Math.max(1, Math.floor(elapsed / 60_000))}m`;
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function FlowPulse({ items, activity, generatedAt, pullForecast, onOpen }: { items: WorkItem[]; activity: Activity[]; generatedAt: string; pullForecast: PullForecast; onOpen: (item: WorkItem) => void }) {
  const wipLimit = 2;
  const referenceTime = new Date(generatedAt).getTime();
  const inFlight = items.filter((item) => ["active", "blocked"].includes(item.state));
  const humanWaiting = items.filter((item) => ["Needed now", "Resubmitted"].includes(item.decision_status));
  const agentWaiting = items.filter((item) => item.assignee_kind === "agent" && item.state !== "complete" && !humanWaiting.some((candidate) => candidate.id === item.id));
  const blockers = items.filter((item) => item.state === "blocked").sort((a, b) => new Date(a.blocked_since ?? a.updated_at).getTime() - new Date(b.blocked_since ?? b.updated_at).getTime());
  const recentThreshold = referenceTime - 24 * 60 * 60 * 1000;
  const movedRecently = new Set(activity.filter((event) => new Date(event.created_at).getTime() >= recentThreshold && ["decision", "workflow", "updated", "created"].includes(event.action)).map((event) => event.item_id)).size;
  const nextItem = humanWaiting[0]
    ?? items.find((item) => ["Changes requested", "Rework"].includes(item.decision_status))
    ?? items.find((item) => item.state === "active" && item.assignee_kind === "agent")
    ?? items.find((item) => item.state === "active")
    ?? items.find((item) => item.state === "queued")
    ?? null;
  const nextOwner = nextItem
    ? ["Needed now", "Resubmitted"].includes(nextItem.decision_status)
      ? nextItem.decision_authority
      : nextItem.assignee_name ?? "Product Lead"
    : "No owner needed";
  const nextEvent = nextItem
    ? ["Needed now", "Resubmitted"].includes(nextItem.decision_status)
      ? `Record the ${nextItem.gate} ruling`
      : nextItem.decision_status === "Changes requested"
        ? "Start the recorded rework"
        : nextItem.decision_status === "Rework"
          ? "Update and resubmit the evidence"
          : nextItem.next_action
    : "All tracked work is complete";
  const pullAllowed = inFlight.length < wipLimit;

  return <section className={`flow-pulse ${pullAllowed ? "flow-open" : "flow-full"}`} aria-label="Team flow pulse">
    <header><div><span>Live team flow</span><h2>Are we moving forward?</h2></div><div className="pulse-state"><i />{movedRecently ? `${movedRecently} item${movedRecently === 1 ? "" : "s"} moved in 24h` : "No movement in 24h"}</div></header>
    <div className="flow-metrics">
      <div className={inFlight.length > wipLimit ? "metric-alert" : ""}><span>WIP</span><strong>{inFlight.length}<small> / {wipLimit}</small></strong><em>{inFlight.length > wipLimit ? `${inFlight.length - wipLimit} over limit` : `${wipLimit - inFlight.length} slot${wipLimit - inFlight.length === 1 ? "" : "s"} open`}</em></div>
      <div><span>Moved recently</span><strong>{movedRecently}</strong><em>Unique items · 24h</em></div>
      <div><span>Waiting on human</span><strong>{humanWaiting.length}</strong><em>{humanWaiting.length ? humanWaiting[0].decision_authority : "No ruling queued"}</em></div>
      <div><span>Waiting on agents</span><strong>{agentWaiting.length}</strong><em>{agentWaiting.length ? "Owned agent work" : "No agent handoff"}</em></div>
      <div className={blockers.length ? "metric-warn" : ""}><span>Oldest blocker</span><strong>{blockers.length ? ageLabel(blockers[0].blocked_since ?? blockers[0].updated_at, referenceTime) : "—"}</strong><em>{blockers[0]?.key ?? "No blockers"}</em></div>
    </div>
    <div className="flow-next"><div><span>Next expected event</span><strong>{nextEvent}</strong><small>{nextItem ? `${nextItem.key} · Owner: ${nextOwner}` : nextOwner}</small>{nextItem && <><small>Target: {nextItem.work_economics.forecast.nextMilestoneAt ? formatDate(nextItem.work_economics.forecast.nextMilestoneAt) : "unknown · owner update required"}</small><small>Likely window: {nextItem.work_economics.forecast.likelyWindow} · Confidence: {nextItem.work_economics.forecast.confidence}</small><small>Last forecast update: {nextItem.work_economics.forecast.lastUpdatedAt ? formatDate(nextItem.work_economics.forecast.lastUpdatedAt) : "unknown · owner update required"}</small></>}</div>{nextItem && <button onClick={() => onOpen(nextItem)}>Open {nextItem.key} →</button>}<aside className={`pull-forecast pull-${pullForecast.status}`}><span>{pullForecast.headline}</span><p>{pullForecast.detail}</p>{pullForecast.missingOwners.length > 0 && <small>Forecast updates needed from: {pullForecast.missingOwners.join(", ")}</small>}<details><summary>Contributing WIP items and ranges</summary>{pullForecast.contributors.length ? pullForecast.contributors.map((entry) => <small key={entry.itemKey}>{entry.itemKey} · {entry.owner} · Next: {entry.nextMilestone} · Target: {entry.nextMilestoneAt ? formatDate(entry.nextMilestoneAt) : "unknown"} · {entry.earliest && entry.latest ? `${formatDate(entry.earliest)} – ${formatDate(entry.latest)}` : "unknown range"} · {entry.state}/{entry.confidence} · Last forecast update: {entry.updatedAt ? formatDate(entry.updatedAt) : "unknown"}</small>) : <small>No active contributors; capacity is available now.</small>}</details></aside></div>
  </section>;
}

function MyWork({ user, generatedAt, pullForecast, actingRole, onRoleChange, items, activity, reviews, notifications, members, saving, onOpen, onDecision, onTransition, onReadNotification }: { user: Bootstrap["user"]; generatedAt: string; pullForecast: PullForecast; actingRole: RoleContext; onRoleChange: (role: RoleContext) => void; items: WorkItem[]; activity: Activity[]; reviews: AgentReview[]; notifications: Notification[]; members: Member[]; saving: boolean; onOpen: (item: WorkItem) => void; onDecision: (item: WorkItem) => void; onTransition: (item: WorkItem, action: "START_REWORK" | "RESUBMIT") => Promise<void>; onReadNotification: (id: number) => Promise<void> }) {
  const role = roleCockpits.find((candidate) => candidate.id === actingRole) ?? roleCockpits[0];
  const canAct = user.role_contexts.includes(actingRole);
  const relevant = items.filter((item) => itemVisibleInMyWork(item, user.id, actingRole, reviews));
  const rulings = relevant.filter((item) => ["Needed now", "Resubmitted"].includes(item.decision_status));
  const returns = relevant.filter((item) => ["Changes requested", "Rework"].includes(item.decision_status));
  const moving = relevant.filter((item) => ["active", "blocked"].includes(item.state) && !["Needed now", "Resubmitted", "Changes requested", "Rework"].includes(item.decision_status));
  const readyToPull = relevant.filter((item) => item.state === "queued");
  const teamWip = items.filter((item) => ["active", "blocked"].includes(item.state)).length;
  const relatedIds = new Set(relevant.map((item) => item.id));
  const roleNotifications = notifications.filter((notification) => relatedIds.has(notification.item_id) || notification.recipient_role.toLowerCase().includes(role.short.toLowerCase())).slice(0, 6);
  const seat = members.find((member) => member.kind === "human" && (member.role.includes(role.label) || role.id === "platform" && member.role.includes("Platform")));

  return <>
    <PageHeading eyebrow="Role cockpit" title={`${role.label} workspace`} copy={role.copy} actions={<div className={`role-authority ${canAct ? "held" : "view-only"}`}><span>{canAct ? "Acting authority" : "View only"}</span><strong>{canAct ? user.name : seat?.display_name ?? "Open seat"}</strong></div>} />
    <div className="role-switcher" role="tablist" aria-label="Human role workspaces">{roleCockpits.map((candidate) => <button role="tab" aria-selected={actingRole === candidate.id} className={actingRole === candidate.id ? "active" : ""} key={candidate.id} onClick={() => onRoleChange(candidate.id)}><span>{candidate.short}</span><small>{user.role_contexts.includes(candidate.id) ? "Your role" : "Shared view"}</small></button>)}</div>

    <FlowPulse items={items} activity={activity} generatedAt={generatedAt} pullForecast={pullForecast} onOpen={onOpen} />

    <section className="role-today">
      <div><span className="panel-eyebrow">Start here</span><h2>{rulings.length ? `${rulings.length} ruling${rulings.length === 1 ? "" : "s"} need judgment` : returns.length ? `${returns.length} returned item${returns.length === 1 ? "" : "s"} need movement` : "No urgent role action"}</h2><p>{canAct ? "Work the first consequential queue, then stop. STEER protects attention by making ownership and the next move explicit." : `You can inspect this cockpit, but ${seat?.display_name === "Open seat" || !seat ? "this role is not yet staffed" : seat.display_name + " holds this authority"}.`}</p></div>
      <div className="role-metrics"><div><strong>{rulings.length}</strong><span>Rulings</span></div><div><strong>{returns.length}</strong><span>Rework</span></div><div><strong>{relevant.filter((item) => item.state === "blocked").length}</strong><span>Blocked</span></div><div><strong>{roleNotifications.filter((item) => item.status !== "read").length}</strong><span>Signals</span></div></div>
    </section>

    <div className="role-queue-grid">
      <section className="panel role-queue"><header><div><span className="panel-eyebrow">Human judgment</span><h2>Ready for your ruling</h2></div><b>{rulings.length}</b></header>{rulings.length ? rulings.map((item) => <RoleWorkCard key={item.id} item={item} canAct={canAct} saving={saving} onOpen={onOpen} onDecision={onDecision} onTransition={onTransition} />) : <Empty title="No ruling is waiting" copy="Resubmitted work appears here after a fresh Critic review." />}</section>
      <section className="panel role-queue"><header><div><span className="panel-eyebrow">Return loop</span><h2>Changes and rework</h2></div><b>{returns.length}</b></header>{returns.length ? returns.map((item) => <RoleWorkCard key={item.id} item={item} canAct={canAct} saving={saving} onOpen={onOpen} onDecision={onDecision} onTransition={onTransition} />) : <Empty title="No returned work" copy="A change request creates an owned, traceable handoff here." />}</section>
    </div>

    <div className="role-lower-grid">
      <section className="panel role-in-motion"><header><div><span className="panel-eyebrow">Role portfolio</span><h2>Running versus ready</h2></div><b>{moving.length + readyToPull.length}</b></header>{moving.length > 0 && <div className="portfolio-group-label"><span>In motion</span><b>{moving.length}</b></div>}{moving.slice(0, 5).map((item) => <button key={item.id} onClick={() => onOpen(item)}><span>{item.key}</span><div><strong>{item.title}</strong><small>{item.next_action}</small><ForecastSummary item={item} compact /></div><StatusPill value={item.state} /></button>)}{readyToPull.length > 0 && <div className="portfolio-group-label ready"><span>Ready to pull</span><b>{readyToPull.length}</b><em>{teamWip >= 2 ? "WIP full" : "Capacity available"}</em></div>}{readyToPull.slice(0, 5).map((item) => <button key={item.id} onClick={() => onOpen(item)}><span>{item.key}</span><div><strong>{item.title}</strong><small>{item.next_action}</small><ForecastSummary item={item} compact /></div><StatusPill value={teamWip >= 2 ? "Paused" : item.priority} kind={teamWip >= 2 ? "blocked" : item.priority} /></button>)}{!moving.length && !readyToPull.length && <Empty title="No role portfolio work" copy="Relevant running or pull-ready work appears here." />}</section>
      <section className="panel notification-center"><header><div><span className="panel-eyebrow">Block Buzz outbox</span><h2>Role notifications</h2></div><b>{roleNotifications.filter((item) => item.status !== "read").length}</b></header>{roleNotifications.length ? roleNotifications.map((notification) => <article key={notification.id} className={notification.status === "read" ? "read" : ""}><span>◌</span><div><strong>{notification.title}</strong><p>{notification.body}</p><small>{notification.channel} · {notification.status} · {formatDate(notification.created_at)}</small></div>{notification.status !== "read" && <button onClick={() => void onReadNotification(notification.id)}>Mark read</button>}</article>) : <Empty title="No role signals yet" copy="Rework and resubmission events will create a durable Block Buzz-ready notification." />}</section>
    </div>
  </>;
}

function Overview({ items, activity, decisions, blocked, active, onOpen, onNavigate }: { items: WorkItem[]; activity: Activity[]; decisions: WorkItem[]; blocked: WorkItem[]; active: WorkItem[]; onOpen: (item: WorkItem) => void; onNavigate: (view: View) => void }) {
  const focus = items.filter((item) => item.priority === "Now" && item.state !== "complete");
  return <>
    <PageHeading eyebrow="Human control tower" title="Good morning. Here is where to act." copy="Start with an explicit next action. The full backlog can wait until the current decision and blocker are understood." actions={<button className="text-button" onClick={() => onNavigate("board")}>Open full Flight Board →</button>} />

    <section className="metric-grid" aria-label="Workspace health">
      <button onClick={() => onNavigate("board")}><span className="metric-icon aqua">▥</span><div><strong>{active.length}</strong><span>Active work</span></div><small>Across {new Set(active.map((item) => item.phase)).size} phases</small></button>
      <button onClick={() => onNavigate("decisions")}><span className="metric-icon amber">◆</span><div><strong>{decisions.length}</strong><span>Human decisions</span></div><small>{decisions.length ? "Needs named authority" : "Inbox is clear"}</small></button>
      <button onClick={() => onNavigate("board")}><span className="metric-icon coral">!</span><div><strong>{blocked.length}</strong><span>Blocked items</span></div><small>{blocked.length ? "Action required" : "No blockers"}</small></button>
      <button onClick={() => onNavigate("backlog")}><span className="metric-icon blue">≡</span><div><strong>{items.filter((item) => item.state !== "complete").length}</strong><span>Open backlog</span></div><small>{items.filter((item) => item.workflow === "Unassigned").length} unassigned workflow</small></button>
    </section>

    <div className="overview-grid">
      <section className="panel focus-work-panel">
        <header><div><span className="panel-eyebrow">Current focus</span><h2>Do these next</h2></div><b>{focus.length}</b></header>
        <div className="focus-list">
          {focus.length ? focus.map((item, index) => <button className="focus-item" key={item.id} onClick={() => onOpen(item)}><span className="focus-rank">{String(index + 1).padStart(2, "0")}</span><div className="focus-main"><div><span>{item.key}</span><StatusPill value={item.phase} /></div><h3>{item.title}</h3><p>{item.next_action}</p><ForecastSummary item={item} compact /><footer><span><Avatar name={item.assignee_name} kind={item.assignee_kind ?? "human"} /> {item.assignee_name ?? "Unassigned"}</span><StatusPill value={item.gate} kind="gate" /></footer></div><b>→</b></button>) : <Empty title="No item is marked Now" copy="Promote one backlog item when the team is ready to focus." />}
        </div>
      </section>

      <section className="panel activity-panel">
        <header><div><span className="panel-eyebrow">Live audit trail</span><h2>Recent activity</h2></div></header>
        <div className="activity-feed">{activity.slice(0, 7).map((event) => <div className="feed-event" key={event.id}><span className={`event-symbol event-${event.action}`}>{event.action === "decision" ? "◆" : event.action === "created" ? "+" : "↗"}</span><div><p><strong>{event.actor_name ?? "Contributor"}</strong> · <b>{event.item_key}</b></p><span>{event.detail}</span><small>{formatDate(event.created_at)}</small></div></div>)}</div>
      </section>
    </div>

    <section className="panel phase-health-panel">
      <header><div><span className="panel-eyebrow">Flow health</span><h2>Seven-phase flight path</h2></div><span className="authority-legend">◆ Human gate</span></header>
      <div className="phase-health">{phases.map((phase, index) => { const phaseItems = items.filter((item) => item.phase === phase); const blockedCount = phaseItems.filter((item) => item.state === "blocked").length; return <button key={phase} onClick={() => onNavigate("board")}><div className="health-node"><span>{String(index + 1).padStart(2, "0")}</span><b>{phaseItems.length}</b></div><strong>{phase}</strong><small>{phaseCues[phase]}</small>{blockedCount > 0 && <em>{blockedCount} blocked</em>}{["Frame", "Release"].includes(phase) && <i>◆</i>}</button>; })}</div>
    </section>
  </>;
}

function FlightBoard({ items, onOpen, onMove, saving }: { items: WorkItem[]; onOpen: (item: WorkItem) => void; onMove: (id: number, changes: Record<string, unknown>) => Promise<void>; saving: boolean }) {
  return <>
    <PageHeading eyebrow="Seven-phase workflow" title="Flight Board" copy="Move evidence through STEER without losing the why. Human gates stay visible and cannot be crossed by an agent ruling." actions={<div className="board-legend"><span><i className="dot active" /> Active</span><span><i className="dot blocked" /> Blocked</span><span>◆ Human gate</span></div>} />
    <div className="kanban-board">{phases.map((phase, phaseIndex) => { const phaseItems = items.filter((item) => item.phase === phase && item.state !== "complete"); return <section className="kanban-column" key={phase}><header><div><span className={`phase-dot phase-${phase.toLowerCase()}`} /><strong>{phase}</strong></div><b>{phaseItems.length}</b></header><p className="column-cue">{phaseCues[phase]}</p><div className="kanban-cards">{phaseItems.map((item) => <article className={`kanban-card state-${item.state}`} key={item.id}><button className="card-open" onClick={() => onOpen(item)}><div className="card-topline"><span>{item.key}</span><StatusPill value={item.priority} /></div><h3>{item.title}</h3><p>{item.next_action}</p><ForecastSummary item={item} compact /><div className="card-tags"><StatusPill value={item.workflow} /><StatusPill value={item.gate} kind="gate" /></div><footer><span><Avatar name={item.assignee_name} kind={item.assignee_kind ?? "human"} /> {item.assignee_name ?? "Unassigned"}</span>{item.decision_status === "Needed now" && <b title="Human decision required">◆</b>}</footer></button><div className="card-move"><button disabled={saving || phaseIndex === 0} aria-label={`Move ${item.key} backward`} onClick={() => void onMove(item.id, { phase: phases[phaseIndex - 1] })}>←</button><span>{item.state}</span><button disabled={saving || phaseIndex === phases.length - 1} aria-label={`Move ${item.key} forward`} onClick={() => void onMove(item.id, { phase: phases[phaseIndex + 1] })}>→</button></div></article>)}{phaseItems.length === 0 && <div className="column-empty">Clear airspace</div>}</div></section>; })}</div>
  </>;
}

function Backlog({ items, onOpen, onCreate }: { items: WorkItem[]; onOpen: (item: WorkItem) => void; onCreate: () => void }) {
  const [scope, setScope] = useState<BacklogScope>("all");
  const [dateField, setDateField] = useState<BacklogDateField>("created_at");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const open = items.filter((item) => item.state !== "complete");
  const closed = items.filter((item) => item.state === "complete");
  const visibleItems = backlogItemsForDateRange(backlogItemsForScope(items, scope), dateField, dateFrom, dateTo);
  return <>
    <PageHeading eyebrow="Complete work register" title="Product backlog" copy="See every work item from capture through closure. New demand enters here, stays traceable, and can be filtered without losing delivery history." actions={<button className="primary-button compact" onClick={onCreate}>＋ Add to backlog</button>} />
    <section className="panel backlog-panel">
      <header className="table-toolbar">
        <div className="backlog-summary"><strong>{items.length} total items</strong><span>{open.length} open · {closed.length} closed · {open.filter((item) => item.workflow === "Unassigned").length} require workflow allocation</span></div>
        <div className="backlog-toolbar-actions">
          <div className="backlog-filters" role="group" aria-label="Filter backlog by state">
            {(["all", "open", "closed"] as BacklogScope[]).map((filter) => <button className={scope === filter ? "active" : ""} aria-pressed={scope === filter} key={filter} onClick={() => setScope(filter)}>{filter === "all" ? `All ${items.length}` : filter === "open" ? `Open ${open.length}` : `Closed ${closed.length}`}</button>)}
          </div>
          <form className="backlog-date-filters" aria-label="Filter backlog by date" onSubmit={(event) => { event.preventDefault(); const values = new FormData(event.currentTarget); setDateField(String(values.get("dateField")) as BacklogDateField); setDateFrom(String(values.get("dateFrom") ?? "")); setDateTo(String(values.get("dateTo") ?? "")); }}>
            <label><span>Date</span><select aria-label="Date field" name="dateField" defaultValue={dateField}><option value="created_at">Created</option><option value="closed_at">Closed</option></select></label>
            <label><span>From</span><input aria-label="From date" name="dateFrom" type="date" defaultValue={dateFrom} /></label>
            <label><span>To</span><input aria-label="To date" name="dateTo" type="date" defaultValue={dateTo} /></label>
            <button className="apply-date-filter" type="submit">Apply dates</button>
            {(dateFrom || dateTo) && <button type="button" onClick={(event) => { event.currentTarget.form?.reset(); setDateFrom(""); setDateTo(""); }}>Clear dates</button>}
          </form>
          <StatusPill value={`${open.filter((item) => item.priority === "Now").length} Now`} kind="now" />
          <StatusPill value={`${open.filter((item) => item.state === "blocked").length} Blocked`} kind="blocked" />
        </div>
      </header>
      <span className="backlog-scroll-hint" aria-hidden="true">Swipe horizontally to see dates, Owner and Gate →</span>
      <div className="backlog-table-scroll" role="region" aria-label="Scrollable Product Backlog table">
        <div className="backlog-table">
          <div className="table-head"><span>Work item</span><span>Created</span><span>Closed</span><span>State</span><span>Phase</span><span>Priority</span><span>Workflow</span><span>Owner</span><span>Gate</span></div>
          {visibleItems.map((item) => <button className={`table-row state-${item.state}`} key={item.id} onClick={() => onOpen(item)}><span className="title-cell"><b>{item.key}</b><div><strong>{item.title}</strong><small>{item.next_action}</small></div></span><time className="date-cell" dateTime={item.created_at}>{formatCreatedDate(item.created_at)}</time><span className="date-cell">{item.closed_at ? <time dateTime={item.closed_at}>{formatCreatedDate(item.closed_at)}</time> : "—"}</span><span><StatusPill value={item.state === "complete" ? "Closed" : item.state} /></span><span><StatusPill value={item.phase} /></span><span><StatusPill value={item.priority} /></span><span><StatusPill value={item.workflow} /></span><span className="owner-cell"><Avatar name={item.assignee_name} kind={item.assignee_kind ?? "human"} /> {item.assignee_name ?? "Unassigned"}</span><span><StatusPill value={item.gate} kind="gate" /></span></button>)}
          {visibleItems.length === 0 && <div className="backlog-empty"><strong>No {scope} items</strong><span>Choose another filter or add the next work item to the backlog.</span></div>}
        </div>
      </div>
    </section>
  </>;
}

function DecisionInbox({ items, decisions, reviews, reviewingIds, onOpen }: { items: WorkItem[]; decisions: Decision[]; reviews: AgentReview[]; reviewingIds: number[]; onOpen: (item: WorkItem) => void }) {
  return <>
    <PageHeading eyebrow="Human authority" title="Decision inbox" copy="Start with the Critic Agent brief, inspect the exact evidence, then make the consequential decision in your own authenticated session." />
    <div className="decision-layout">
      <section className="decision-queue"><header><div><span className="panel-eyebrow">Requires your attention</span><h2>Pending rulings</h2></div><b>{items.length}</b></header>{items.length ? items.map((item) => {
        const review = reviews.find((candidate) => candidate.item_id === item.id);
        const stale = review ? review.reviewed_item_updated_at !== item.updated_at : false;
        const reviewing = reviewingIds.includes(item.id);
        return <article className="decision-card" key={item.id}><div className="decision-diamond">◆</div><div className="decision-card-body"><div><span>{item.key} · {item.phase}</span><StatusPill value={item.decision_status === "Resubmitted" ? "Resubmitted" : item.gate} kind="gate" /></div><h3>{item.title}</h3><p>{item.description}</p><div className={`decision-agent-strip ${review && !stale ? "has-review" : "needs-review"}`}><span>◇</span><div><b>{reviewing ? "Critic Agent is reviewing now…" : review ? review.recommendation : "Critic review starts automatically"}</b><small>{reviewing ? "Reading the work item and linked evidence. This card refreshes when the brief is ready." : review ? stale ? "Work changed — opening this ruling refreshes the Critic brief." : review.findings[0]?.title ?? "No significant finding" : "Open the ruling workspace; no separate review step is required."}</small></div></div><dl><div><dt>Authority</dt><dd>{item.decision_authority}</dd></div><div><dt>Evidence</dt><dd>{review?.evidence_sha256 && !stale ? `Bound · ${(review.evidence_revision ?? review.evidence_sha256).slice(0, 12)}` : item.evidence_url ? "Attached; exact binding pending" : "Evidence link missing"}</dd></div><div><dt>Next if approved</dt><dd>{item.gate === "Gate 2 pending" ? "Builder may begin implementation" : "Advance to the next STEER control"}</dd></div></dl><button onClick={() => onOpen(item)}>{reviewing ? "Open while Critic reviews →" : "Open AI-assisted ruling →"}</button></div></article>;
      }) : <Empty title="Decision inbox is clear" copy="A ruling appears only when the work is ready and a named human authority is required." />}</section>
      <section className="panel decision-history"><header><div><span className="panel-eyebrow">Authenticated record</span><h2>Decision history</h2></div></header>{decisions.length ? decisions.map((decision) => <div className="history-decision" key={decision.id}><span className={decision.decision === "APPROVED" ? "approved" : "changes"}>{decision.decision === "APPROVED" ? "✓" : "!"}</span><div><p><strong>{decision.item_key}</strong> · {decision.gate}</p><b>{decision.decision.replace("_", " ")}</b><blockquote>{decision.reasoning}</blockquote><small>{decision.actor_email ?? "Authenticated contributor"} · {formatDate(decision.created_at)}</small><em>{decision.evidence_sha256 ? `Evidence ${(decision.evidence_revision ?? decision.evidence_sha256).slice(0, 12)} · Critic review #${decision.review_id}` : "Legacy ruling · exact evidence revision was not captured"}</em></div></div>) : <Empty title="No rulings recorded in this app yet" copy="The GitHub Gate 1 ruling remains linked from its evidence artifact." />}</section>
    </div>
  </>;
}

function Team({ members, items, onOpenBuzz }: { members: Member[]; items: WorkItem[]; onOpenBuzz: () => void }) {
  const humans = members.filter((member) => member.kind === "human");
  const agents = members.filter((member) => member.kind === "agent");
  return <>
    <PageHeading eyebrow="People, agents, and authority" title="Team" copy="Make ownership easy to see and impossible to confuse. Agent capability never silently becomes human authority." actions={<button className="text-button" onClick={onOpenBuzz}>Connect to Block Buzz →</button>} />
    <section className="work-contract">
      <header><div><span className="panel-eyebrow">Shared operating contract</span><h2>One source of truth for each kind of work</h2></div><StatusPill value="Enforced" kind="ready" /></header>
      <div className="contract-grid">
        <article><span>01</span><strong>STEER Work Management</strong><p>Creates, prioritizes, assigns, authorizes, changes, and closes work. Human gates live here.</p><em>Controls what should happen</em></article>
        <article><span>02</span><strong>Block Buzz</strong><p>Coordinates huddles, questions, blockers, alerts, and visible handoffs linked to a work item.</p><em>Coordinates people and agents</em></article>
        <article><span>03</span><strong>GitHub</strong><p>Preserves code, pull requests, tests, reviews, versioned documents, and exact evidence.</p><em>Proves what happened</em></article>
      </div>
      <footer><b>Buzz mention ≠ assignment</b><span>Agents must refuse execution unless the Flight Board shows an authorized assignment.</span></footer>
    </section>
    <section className="team-section"><header><div><span className="panel-eyebrow">Human contributors</span><h2>Decision and product authority</h2></div><StatusPill value={`${humans.length} people / seats`} kind="human" /></header><div className="member-grid">{humans.map((member) => <article className="member-card" key={member.id}><div className="member-card-top"><Avatar name={member.display_name} kind={member.kind} accent={member.accent} /><StatusPill value={member.status} /></div><h3>{member.display_name}</h3><span>{member.role}</span><p>{member.authority}</p><footer><b>{items.filter((item) => item.assignee_id === member.id && item.state !== "complete").length}</b><span>open items</span></footer></article>)}</div></section>
    <section className="team-section agent-section"><header><div><span className="panel-eyebrow">Agent fleet</span><h2>Specialized delivery roles</h2></div><StatusPill value={`${agents.length} enrolled`} kind="agent" /></header><div className="member-grid">{agents.map((member) => <article className="member-card agent-card" key={member.id}><div className="member-card-top"><Avatar name={member.display_name} kind={member.kind} accent={member.accent} /><StatusPill value={member.status} /></div><h3>{member.display_name}</h3><span>{member.role}</span><p>{member.authority}</p><footer><b>{items.filter((item) => item.assignee_id === member.id && item.state !== "complete").length}</b><span>assigned items</span><em>Cannot approve gates</em></footer></article>)}</div></section>
  </>;
}
