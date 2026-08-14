export type DispatchCheck = {
  id: "record" | "workflow" | "assignee" | "state" | "scope" | "evidence" | "gate";
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

const decisionHoldStatuses = new Set(["Needed now", "Changes requested", "Rework", "Resubmitted"]);

function value(input: unknown) {
  return String(input ?? "").trim();
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
  const gateClear = !decisionHoldStatuses.has(decisionStatus) && (!gatePending || decisionStatus === "Decided");

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
      id: "gate",
      label: "Human holds are clear",
      met: gateClear,
      detail: gateClear ? `${gate || "No gate"} does not require a human ruling before this handoff.` : `${gate || "A gate"} is still waiting on an authenticated human ruling.`,
    },
  ];

  const missing = checks.filter((check) => !check.met).map((check) => check.label);
  const authorized = missing.length === 0;
  const channel = "#project-federal-bd-pilot";
  const handoffMessage = authorized
    ? `[${key}] ${title} — Authorized Flight Board handoff to ${assigneeName}. State: In Progress. Next action: ${nextAction} Evidence: ${evidenceUrl} Engineering record: ${githubUrl} Buzz coordinates this handoff; scope, status, decisions, and evidence remain authoritative in the Flight Board and GitHub.`
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
