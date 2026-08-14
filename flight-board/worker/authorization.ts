export type DispatchCheck = {
  id: "record" | "workflow" | "assignee" | "state" | "scope" | "evidence" | "forecast" | "gate";
  label: string;
  met: boolean;
  detail: string;
};

export type DispatchCandidate = {
  key?: unknown;
  title?: unknown;
  workflow?: unknown;
  state?: unknown;
  gate?: unknown;
  decision_status?: unknown;
  assignee_id?: unknown;
  assignee_name?: unknown;
  assignee_kind?: unknown;
  next_action?: unknown;
  evidence_url?: unknown;
  github_url?: unknown;
  delivery_forecast_json?: unknown;
  delivery_owner_id?: unknown;
};

export type AgentDispatchAuthorization = {
  authorized: boolean;
  status: "Authorized" | "Blocked";
  summary: string;
  checks: DispatchCheck[];
  missing: string[];
  channel: string;
  handoff_message: string | null;
};

const decisionHoldStatuses = new Set(["Needed now", "Changes requested", "Resubmitted"]);

function value(input: unknown) {
  return String(input ?? "").trim();
}

function acceptedForecast(input: unknown, deliveryOwnerId: string) {
  try {
    const forecast = JSON.parse(value(input)) as Record<string, unknown>;
    const dates = ["earliestCompletion", "likelyCompletion", "latestCompletion", "nextMilestoneAt", "phaseExitAt"].map((key) => new Date(String(forecast[key] ?? "")).getTime());
    return Boolean(
      forecast.acceptedAt && forecast.acceptedBy && forecast.deliveryOwnerId && forecast.nextMilestone && forecast.phaseExit && forecast.basis
      && forecast.acceptedBy === deliveryOwnerId && forecast.deliveryOwnerId === deliveryOwnerId
      && ["low", "medium", "high"].includes(String(forecast.confidence))
      && dates.every(Number.isFinite) && dates[0] <= dates[1] && dates[1] <= dates[2]
      && !forecast.reforecastRequiredReason,
    );
  } catch {
    return false;
  }
}

export function evaluateAgentDispatch(item: DispatchCandidate): AgentDispatchAuthorization {
  const key = value(item.key);
  const title = value(item.title);
  const workflow = value(item.workflow);
  const state = value(item.state);
  const gate = value(item.gate);
  const decisionStatus = value(item.decision_status);
  const assigneeId = value(item.assignee_id);
  const assigneeName = value(item.assignee_name);
  const assigneeKind = value(item.assignee_kind);
  const nextAction = value(item.next_action);
  const evidenceUrl = value(item.evidence_url);
  const githubUrl = value(item.github_url);
  const gatePending = /pending/i.test(gate);
  const gateClear = !decisionHoldStatuses.has(decisionStatus);
  const deliveryOwnerId = value(item.delivery_owner_id);
  const forecastAccepted = workflow !== "STEER" || (Boolean(deliveryOwnerId) && acceptedForecast(item.delivery_forecast_json, deliveryOwnerId));

  const checks: DispatchCheck[] = [
    {
      id: "record",
      label: "Durable work record",
      met: /^STR-\d{3,}$/.test(key) && Boolean(githubUrl),
      detail: githubUrl ? `${key} is linked to its engineering record.` : "Attach the GitHub issue or pull request that carries the durable trail.",
    },
    {
      id: "workflow",
      label: "Workflow assigned",
      met: Boolean(workflow) && workflow !== "Unassigned",
      detail: workflow && workflow !== "Unassigned" ? `${workflow} is frozen for this item.` : "Choose STEER, Control, or Setup / excluded before work begins.",
    },
    {
      id: "assignee",
      label: "Agent explicitly assigned",
      met: Boolean(assigneeId) && assigneeKind === "agent",
      detail: assigneeKind === "agent" ? `${assigneeName || assigneeId} owns this execution handoff.` : "Assign one enrolled agent in the Flight Board; a Buzz mention is not an assignment.",
    },
    {
      id: "state",
      label: "Execution state is active",
      met: state === "active",
      detail: state === "active" ? "The Flight Board has released this item into active work." : "Keep queued, blocked, or complete work out of agent execution.",
    },
    {
      id: "scope",
      label: "Executable next action",
      met: nextAction.length >= 12,
      detail: nextAction.length >= 12 ? nextAction : "Add a specific, testable next action before dispatch.",
    },
    {
      id: "evidence",
      label: "Required evidence attached",
      met: Boolean(evidenceUrl),
      detail: evidenceUrl ? "The assigned agent has a durable brief, exam, or approved setup artifact to follow." : "Attach the controlling brief, exam, or approved setup evidence.",
    },
    {
      id: "forecast",
      label: "Owner forecast accepted",
      met: forecastAccepted,
      detail: forecastAccepted
        ? workflow === "STEER" ? "The governed completion range, next milestone, confidence, and basis are accepted." : "This setup/control handoff is outside the STEER forecast gate."
        : "The named delivery owner must accept the range, confidence, basis, and next milestone after the latest material change before execution.",
    },
    {
      id: "gate",
      label: "Human holds are clear",
      met: gateClear,
      detail: gateClear
        ? gatePending && decisionStatus === "Waiting"
          ? `${gate} is waiting for evidence preparation; no human ruling is queued yet.`
          : `${gate || "No gate"} does not require a human ruling before this handoff.`
        : `${gate || "A gate"} is still waiting on an authenticated human ruling.`,
    },
  ];

  const missing = checks.filter((check) => !check.met).map((check) => check.label);
  const authorized = missing.length === 0;
  const channel = "#project-federal-bd-pilot";
  const handoffMessage = authorized
    ? `[${key}] ${title} — Authorized Flight Board handoff to ${assigneeName}. State: In Progress. Next action: ${nextAction} Owner forecast: ${workflow === "STEER" ? "accepted in STEER Work Economics" : "not required for this workflow"}. Evidence: ${evidenceUrl} Engineering record: ${githubUrl} Buzz coordinates this handoff; scope, forecast, status, decisions, and evidence remain authoritative in the Flight Board and GitHub.`
    : null;

  return {
    authorized,
    status: authorized ? "Authorized" : "Blocked",
    summary: authorized
      ? "The Flight Board authorizes this agent handoff. Buzz may now notify the assigned agent."
      : `Agent execution is blocked until ${missing.length} requirement${missing.length === 1 ? "" : "s"} ${missing.length === 1 ? "is" : "are"} resolved.`,
    checks,
    missing,
    channel,
    handoff_message: handoffMessage,
  };
}
