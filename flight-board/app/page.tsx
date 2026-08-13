"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

const phases = ["Sense", "Frame", "Engineer", "Evaluate", "Release", "Observe", "Learn"] as const;
const priorities = ["Now", "Next", "Later"] as const;
const workflows = ["STEER", "Control", "Setup / excluded", "Unassigned"] as const;
const states = ["queued", "active", "blocked", "complete"] as const;
const githubRoot = "https://github.com/idrissenayat/federal-bd-platform";
const buzzUrl = "wss://blockbuzzmain-production-5bcb.up.railway.app";

type View = "overview" | "board" | "backlog" | "decisions" | "team";

type WorkItem = {
  id: number;
  key: string;
  title: string;
  description: string;
  phase: string;
  priority: string;
  workflow: string;
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
  updated_at: string;
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
  reviewed_item_updated_at: string;
  created_at: string;
};

type Bootstrap = {
  user: { id: string; email: string | null; name: string };
  items: WorkItem[];
  members: Member[];
  activity: Activity[];
  decisions: Decision[];
  reviews: AgentReview[];
};

const navigation: { id: View; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "◫" },
  { id: "board", label: "Flight Board", icon: "▥" },
  { id: "backlog", label: "Backlog", icon: "≡" },
  { id: "decisions", label: "Human Decisions", icon: "◆" },
  { id: "team", label: "Team & Agents", icon: "◎" },
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

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

async function api(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await response.json() as { error?: string };
  if (!response.ok) throw new Error(data.error ?? "The request could not be completed.");
  return data;
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

export default function Home() {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [view, setView] = useState<View>("overview");
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
  const [mobileNav, setMobileNav] = useState(false);

  async function load() {
    try {
      const payload = await api("/api/bootstrap") as Bootstrap;
      setData(payload);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The workspace could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    api("/api/bootstrap")
      .then((payload) => {
        if (!active) return;
        setData(payload as Bootstrap);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "The workspace could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!data || !term) return data?.items ?? [];
    return data.items.filter((item) => [item.key, item.title, item.description, item.assignee_name, item.phase, item.workflow].some((value) => value?.toLowerCase().includes(term)));
  }, [data, search]);

  const selected = data?.items.find((item) => item.id === selectedId) ?? null;
  const itemActivity = data?.activity.filter((event) => event.item_id === selectedId) ?? [];
  const selectedReview = data?.reviews.find((review) => review.item_id === selectedId) ?? null;
  const freshSelectedReview = selected && selectedReview?.reviewed_item_updated_at === selected.updated_at ? selectedReview : null;
  const changeRequestDraft = freshSelectedReview ? buildChangeRequestDraft(freshSelectedReview) : "";
  const decisionItems = data?.items.filter((item) => item.decision_status === "Needed now") ?? [];
  const blockedItems = data?.items.filter((item) => item.state === "blocked") ?? [];
  const activeItems = data?.items.filter((item) => item.state === "active") ?? [];

  async function updateItem(id: number, changes: Record<string, unknown>) {
    setSaving(true);
    try {
      await api(`/api/items/${id}`, { method: "PATCH", body: JSON.stringify(changes) });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The item could not be updated.");
    } finally {
      setSaving(false);
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
    try {
      await api(`/api/items/${selected.id}/decisions`, {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      closeDecisionWorkspace();
      await load();
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
          <a href={buzzUrl} title="Block Buzz relay"><span>◌</span> Block Buzz</a>
        </div>

        <div className="authority-card">
          <span>Human authority rule</span>
          <p>Agents prepare evidence. Only the named human records a gate ruling.</p>
        </div>

        <div className="user-card">
          <Avatar name={data.user.name} />
          <div><strong>{data.user.name}</strong><span>{data.user.email ?? "Authenticated contributor"}</span></div>
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

        {error && <div className="error-banner"><span>{error}</span><button onClick={() => setError(null)}>Dismiss</button></div>}

        <div className="content-area">
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
          {view === "team" && <Team members={data.members} items={data.items} />}
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

              {selected.decision_status === "Needed now" && (
                <div className="decision-callout">
                  <div><span>◆ Human ruling required</span><strong>{selected.gate}</strong><p>Authority: {selected.decision_authority}</p></div>
                  <button onClick={() => openDecisionWorkspace(selected)}>Review decision</button>
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
                  <label>Decision readiness<select value={selected.decision_status} disabled={saving} onChange={(event) => void updateItem(selected.id, { decisionStatus: event.target.value })}>{["Waiting", "Needed now", "Decided", "Not required"].map((status) => <option key={status}>{status}</option>)}</select></label>
                  <label className="span-two">Assignee<select value={selected.assignee_id ?? ""} disabled={saving} onChange={(event) => void updateItem(selected.id, { assigneeId: event.target.value || null })}><option value="">Unassigned</option>{data.members.map((member) => <option key={member.id} value={member.id}>{member.display_name} · {member.role}</option>)}</select></label>
                </div>
              </section>

              <section className="detail-section next-section">
                <div><h3>Next action</h3><span>Keep this executable and unambiguous.</span></div>
                <textarea defaultValue={selected.next_action} onBlur={(event) => { if (event.target.value !== selected.next_action) void updateItem(selected.id, { nextAction: event.target.value }); }} />
              </section>

              <section className="detail-section">
                <h3>Evidence & engineering record</h3>
                <div className="evidence-links">
                  {selected.evidence_url ? <a href={selected.evidence_url} target="_blank" rel="noreferrer"><span>▤</span><div><strong>Evidence artifact</strong><small>{selected.evidence_url}</small></div><b>↗</b></a> : <div className="missing-evidence">No evidence link attached yet.</div>}
                  {selected.github_url && <a href={selected.github_url} target="_blank" rel="noreferrer"><span>⌂</span><div><strong>GitHub record</strong><small>Authoritative engineering trail</small></div><b>↗</b></a>}
                </div>
              </section>

              <section className="detail-section activity-section">
                <h3>Activity</h3>
                {itemActivity.length ? itemActivity.map((event) => <div className="activity-row" key={event.id}><Avatar name={event.actor_name} /><div><p><strong>{event.actor_name ?? "Contributor"}</strong> {event.detail}</p><span>{formatDate(event.created_at)}</span></div></div>) : <p className="muted">No activity recorded.</p>}
              </section>
            </div>
          </aside>
        </div>
      )}

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
              <label>Assignee<select name="assigneeId" defaultValue=""><option value="">Unassigned</option>{data.members.map((member) => <option value={member.id} key={member.id}>{member.display_name}</option>)}</select></label>
            </div>
            <label>Next action<input name="nextAction" placeholder="Frame the intended outcome and prepare Gate 1 evidence." /></label>
            <footer><button type="button" className="secondary-button" onClick={() => setCreateOpen(false)}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? "Creating…" : "Create in backlog"}</button></footer>
          </form>
        </div>
      )}

      {decisionOpen && selected && (
        <div className="modal-scrim decision-scrim">
          <form className="modal-card decision-modal" onSubmit={recordDecision}>
            <header><div><span>◆ Authenticated human ruling</span><h2>{selected.gate}</h2></div><button type="button" onClick={closeDecisionWorkspace}>×</button></header>
            <div className="decision-item-summary"><span>{selected.key}</span><strong>{selected.title}</strong><p>{selected.description}</p></div>
            <AgentReviewBrief compact item={selected} review={selectedReview} reviewing={reviewingIds.includes(selected.id)} onReview={() => void requestAgentReview(selected.id)} />
            <div className="authority-warning"><strong>You are acting as {selected.decision_authority}.</strong><p>This ruling is attributed to {data.user.email ?? data.user.name}. Agents cannot submit this form without an authenticated human identity.</p></div>
            <fieldset><legend>Ruling</legend><label className="radio-card"><input aria-label="Approve this gate" type="radio" name="decision" value="APPROVED" required checked={decisionChoice === "APPROVED"} onChange={() => { setDecisionChoice("APPROVED"); setDecisionReasoning((current) => current === changeRequestDraft ? "" : current); }} /><span><strong>Approve</strong><small>Evidence is sufficient for this gate. Advance the work.</small></span></label><label className="radio-card"><input aria-label="Request changes for this gate" type="radio" name="decision" value="CHANGES_REQUESTED" required checked={decisionChoice === "CHANGES_REQUESTED"} onChange={() => { setDecisionChoice("CHANGES_REQUESTED"); if (!decisionReasoning.trim() && changeRequestDraft) setDecisionReasoning(changeRequestDraft); }} /><span><strong>Request changes</strong><small>Keep the gate pending and block work until the named gaps are resolved.</small></span></label></fieldset>
            {decisionChoice === "CHANGES_REQUESTED" && changeRequestDraft && <section className="ai-reasoning-draft"><header><div><span>◇ Critic-drafted instructions</span><strong>Ready for your reasoning</strong></div><button type="button" disabled={decisionReasoning === changeRequestDraft} onClick={() => setDecisionReasoning(changeRequestDraft)}>{decisionReasoning === changeRequestDraft ? "Draft applied" : decisionReasoning.trim() ? "Restore AI draft" : "Use AI draft"}</button></header><p>Editable advice from the current review. You remain the author and decision authority.</p><pre>{changeRequestDraft}</pre></section>}
            {decisionChoice === "CHANGES_REQUESTED" && !changeRequestDraft && reviewingIds.includes(selected.id) && <div className="draft-waiting"><span>◇</span><p><strong>Critic is preparing proposed instructions.</strong> You can write now or apply the draft when the review finishes.</p></div>}
            <label><span className="reasoning-label-row"><span>Reasoning</span>{changeRequestDraft && decisionReasoning === changeRequestDraft && <em>AI draft applied · editable</em>}</span><textarea name="reasoning" required minLength={12} value={decisionReasoning} onChange={(event) => setDecisionReasoning(event.target.value)} placeholder="State why this evidence is or is not sufficient. This becomes part of the audit trail." /></label>
            <footer><button type="button" className="secondary-button" onClick={closeDecisionWorkspace}>Cancel</button><button className="decision-button" disabled={saving}>{saving ? "Recording…" : "Record human ruling"}</button></footer>
          </form>
        </div>
      )}
    </div>
  );
}

function PageHeading({ eyebrow, title, copy, actions }: { eyebrow: string; title: string; copy: string; actions?: React.ReactNode }) {
  return <div className="page-heading"><div><span>{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div>{actions && <div className="heading-actions">{actions}</div>}</div>;
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
          {focus.length ? focus.map((item, index) => <button className="focus-item" key={item.id} onClick={() => onOpen(item)}><span className="focus-rank">{String(index + 1).padStart(2, "0")}</span><div className="focus-main"><div><span>{item.key}</span><StatusPill value={item.phase} /></div><h3>{item.title}</h3><p>{item.next_action}</p><footer><span><Avatar name={item.assignee_name} kind={item.assignee_kind ?? "human"} /> {item.assignee_name ?? "Unassigned"}</span><StatusPill value={item.gate} kind="gate" /></footer></div><b>→</b></button>) : <Empty title="No item is marked Now" copy="Promote one backlog item when the team is ready to focus." />}
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
    <div className="kanban-board">{phases.map((phase, phaseIndex) => { const phaseItems = items.filter((item) => item.phase === phase && item.state !== "complete"); return <section className="kanban-column" key={phase}><header><div><span className={`phase-dot phase-${phase.toLowerCase()}`} /><strong>{phase}</strong></div><b>{phaseItems.length}</b></header><p className="column-cue">{phaseCues[phase]}</p><div className="kanban-cards">{phaseItems.map((item) => <article className={`kanban-card state-${item.state}`} key={item.id}><button className="card-open" onClick={() => onOpen(item)}><div className="card-topline"><span>{item.key}</span><StatusPill value={item.priority} /></div><h3>{item.title}</h3><p>{item.next_action}</p><div className="card-tags"><StatusPill value={item.workflow} /><StatusPill value={item.gate} kind="gate" /></div><footer><span><Avatar name={item.assignee_name} kind={item.assignee_kind ?? "human"} /> {item.assignee_name ?? "Unassigned"}</span>{item.decision_status === "Needed now" && <b title="Human decision required">◆</b>}</footer></button><div className="card-move"><button disabled={saving || phaseIndex === 0} aria-label={`Move ${item.key} backward`} onClick={() => void onMove(item.id, { phase: phases[phaseIndex - 1] })}>←</button><span>{item.state}</span><button disabled={saving || phaseIndex === phases.length - 1} aria-label={`Move ${item.key} forward`} onClick={() => void onMove(item.id, { phase: phases[phaseIndex + 1] })}>→</button></div></article>)}{phaseItems.length === 0 && <div className="column-empty">Clear airspace</div>}</div></section>; })}</div>
  </>;
}

function Backlog({ items, onOpen, onCreate }: { items: WorkItem[]; onOpen: (item: WorkItem) => void; onCreate: () => void }) {
  const open = items.filter((item) => item.state !== "complete");
  return <>
    <PageHeading eyebrow="Demand and ownership" title="Backlog" copy="Every item needs a value signal, explicit treatment, named owner, and smallest executable next action." actions={<button className="primary-button compact" onClick={onCreate}>＋ Create work item</button>} />
    <section className="panel backlog-panel">
      <header className="table-toolbar"><div><strong>{open.length} open items</strong><span>{open.filter((item) => item.workflow === "Unassigned").length} require workflow allocation</span></div><div><StatusPill value={`${open.filter((item) => item.priority === "Now").length} Now`} kind="now" /><StatusPill value={`${open.filter((item) => item.state === "blocked").length} Blocked`} kind="blocked" /></div></header>
      <div className="backlog-table"><div className="table-head"><span>Work item</span><span>Phase</span><span>Priority</span><span>Workflow</span><span>Owner</span><span>Gate</span></div>{items.map((item) => <button className={`table-row state-${item.state}`} key={item.id} onClick={() => onOpen(item)}><span className="title-cell"><b>{item.key}</b><div><strong>{item.title}</strong><small>{item.next_action}</small></div></span><span><StatusPill value={item.phase} /></span><span><StatusPill value={item.priority} /></span><span><StatusPill value={item.workflow} /></span><span className="owner-cell"><Avatar name={item.assignee_name} kind={item.assignee_kind ?? "human"} /> {item.assignee_name ?? "Unassigned"}</span><span><StatusPill value={item.gate} kind="gate" /></span></button>)}</div>
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
        return <article className="decision-card" key={item.id}><div className="decision-diamond">◆</div><div className="decision-card-body"><div><span>{item.key} · {item.phase}</span><StatusPill value={item.gate} kind="gate" /></div><h3>{item.title}</h3><p>{item.description}</p><div className={`decision-agent-strip ${review && !stale ? "has-review" : "needs-review"}`}><span>◇</span><div><b>{reviewing ? "Critic Agent is reviewing now…" : review ? review.recommendation : "Critic review starts automatically"}</b><small>{reviewing ? "Reading the work item and linked evidence. This card refreshes when the brief is ready." : review ? stale ? "Work changed — opening this ruling refreshes the Critic brief." : review.findings[0]?.title ?? "No significant finding" : "Open the ruling workspace; no separate review step is required."}</small></div></div><dl><div><dt>Authority</dt><dd>{item.decision_authority}</dd></div><div><dt>Evidence</dt><dd>{item.evidence_url ? "Attached and ready to inspect" : "Evidence link missing"}</dd></div><div><dt>Next if approved</dt><dd>{item.gate === "Gate 2 pending" ? "Builder may begin implementation" : "Advance to the next STEER control"}</dd></div></dl><button onClick={() => onOpen(item)}>{reviewing ? "Open while Critic reviews →" : "Open AI-assisted ruling →"}</button></div></article>;
      }) : <Empty title="Decision inbox is clear" copy="A ruling appears only when the work is ready and a named human authority is required." />}</section>
      <section className="panel decision-history"><header><div><span className="panel-eyebrow">Authenticated record</span><h2>Decision history</h2></div></header>{decisions.length ? decisions.map((decision) => <div className="history-decision" key={decision.id}><span className={decision.decision === "APPROVED" ? "approved" : "changes"}>{decision.decision === "APPROVED" ? "✓" : "!"}</span><div><p><strong>{decision.item_key}</strong> · {decision.gate}</p><b>{decision.decision.replace("_", " ")}</b><blockquote>{decision.reasoning}</blockquote><small>{decision.actor_email ?? "Authenticated contributor"} · {formatDate(decision.created_at)}</small></div></div>) : <Empty title="No rulings recorded in this app yet" copy="The GitHub Gate 1 ruling remains linked from its evidence artifact." />}</section>
    </div>
  </>;
}

function Team({ members, items }: { members: Member[]; items: WorkItem[] }) {
  const humans = members.filter((member) => member.kind === "human");
  const agents = members.filter((member) => member.kind === "agent");
  return <>
    <PageHeading eyebrow="People, agents, and authority" title="Team" copy="Make ownership easy to see and impossible to confuse. Agent capability never silently becomes human authority." actions={<a className="text-button" href={buzzUrl}>Open Block Buzz relay →</a>} />
    <section className="team-section"><header><div><span className="panel-eyebrow">Human contributors</span><h2>Decision and product authority</h2></div><StatusPill value={`${humans.length} people / seats`} kind="human" /></header><div className="member-grid">{humans.map((member) => <article className="member-card" key={member.id}><div className="member-card-top"><Avatar name={member.display_name} kind={member.kind} accent={member.accent} /><StatusPill value={member.status} /></div><h3>{member.display_name}</h3><span>{member.role}</span><p>{member.authority}</p><footer><b>{items.filter((item) => item.assignee_id === member.id && item.state !== "complete").length}</b><span>open items</span></footer></article>)}</div></section>
    <section className="team-section agent-section"><header><div><span className="panel-eyebrow">Agent fleet</span><h2>Specialized delivery roles</h2></div><StatusPill value={`${agents.length} enrolled`} kind="agent" /></header><div className="member-grid">{agents.map((member) => <article className="member-card agent-card" key={member.id}><div className="member-card-top"><Avatar name={member.display_name} kind={member.kind} accent={member.accent} /><StatusPill value={member.status} /></div><h3>{member.display_name}</h3><span>{member.role}</span><p>{member.authority}</p><footer><b>{items.filter((item) => item.assignee_id === member.id && item.state !== "complete").length}</b><span>assigned items</span><em>Cannot approve gates</em></footer></article>)}</div></section>
  </>;
}
