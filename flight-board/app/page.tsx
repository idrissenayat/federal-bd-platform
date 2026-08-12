"use client";

import { useMemo, useState } from "react";

const githubRoot = "https://github.com/idrissenayat/federal-bd-platform";
const projectRoot = "https://github.com/users/idrissenayat/projects/1";

const phases = [
  { name: "Sense", cue: "Find worthy signals" },
  { name: "Frame", cue: "Make intent testable" },
  { name: "Engineer", cue: "Build the evidence" },
  { name: "Evaluate", cue: "Challenge the result" },
  { name: "Release", cue: "Make the human call" },
  { name: "Observe", cue: "Watch real behavior" },
  { name: "Learn", cue: "Improve the system" },
] as const;

type Phase = (typeof phases)[number]["name"];
type BoardFilter = "focus" | "decision" | "blocked" | "all";

type WorkItem = {
  number: number;
  title: string;
  phase: Phase;
  priority: "Now" | "Next" | "Later" | "Done";
  gate: string;
  decision: "Needed now" | "Waiting" | "Decided" | "Not required";
  workflow: string;
  owner: string;
  state: "active" | "blocked" | "queued" | "complete";
  summary: string;
  next: string;
  issueUrl: string;
  evidenceUrl?: string;
  evidenceLabel?: string;
};

const items: WorkItem[] = [
  {
    number: 2,
    title: "Execute feasibility tracer 0002",
    phase: "Frame",
    priority: "Now",
    gate: "Gate 2 pending",
    decision: "Waiting",
    workflow: "Setup / excluded",
    owner: "Idriss · interim Tech Lead",
    state: "active",
    summary: "Prove one setup item can travel through every STEER phase with auditable evidence.",
    next: "In a new work session, review Exam 0002 and record the separate Gate 2 ruling.",
    issueUrl: `${githubRoot}/issues/2`,
    evidenceUrl: `${githubRoot}/blob/main/steer/exams/0002-source-health-tracer.md`,
    evidenceLabel: "Read Gate 2 exam",
  },
  {
    number: 10,
    title: "Complete Block Buzz agent operations",
    phase: "Engineer",
    priority: "Next",
    gate: "No gate · setup",
    decision: "Waiting",
    workflow: "Setup / excluded",
    owner: "Ops Agent + human owner",
    state: "blocked",
    summary: "Activate persistent hosted agent workers on the official Block Buzz relay.",
    next: "Assign approved runtimes and add provider credentials directly in Railway.",
    issueUrl: `${githubRoot}/issues/10`,
    evidenceUrl: `${githubRoot}/pull/11`,
    evidenceLabel: "Review onboarding evidence",
  },
  {
    number: 3,
    title: "Freeze comparative cohort and allocation",
    phase: "Sense",
    priority: "Next",
    gate: "Gate 1 pending",
    decision: "Waiting",
    workflow: "Unassigned",
    owner: "Product Lead",
    state: "queued",
    summary: "Create the fair STEER-versus-Control comparison before seeing item difficulty.",
    next: "Begin after tracer calibration; freeze candidate cards and workflow assignments.",
    issueUrl: `${githubRoot}/issues/3`,
  },
  {
    number: 4,
    title: "Opportunity intelligence vertical slice",
    phase: "Sense",
    priority: "Later",
    gate: "Gate 1 pending",
    decision: "Waiting",
    workflow: "Unassigned",
    owner: "Unassigned",
    state: "queued",
    summary: "Preserve a federal opportunity and produce a sourced advisory recommendation.",
    next: "Wait for cohort allocation; do not choose STEER or Control after work begins.",
    issueUrl: `${githubRoot}/issues/4`,
    evidenceUrl: `${githubRoot}/blob/main/steer/briefs/0003-opportunity-intelligence.md`,
    evidenceLabel: "Read intent brief",
  },
  {
    number: 12,
    title: "Enable protected main and PR-only delivery",
    phase: "Learn",
    priority: "Done",
    gate: "No gate · setup",
    decision: "Decided",
    workflow: "Setup / excluded",
    owner: "Idriss",
    state: "complete",
    summary: "Protect the shared repository with required checks and auditable delivery.",
    next: "Complete — direct pushes are rejected and changes flow through pull requests.",
    issueUrl: `${githubRoot}/issues/12`,
  },
];

const filters: { value: BoardFilter; label: string; count: number }[] = [
  { value: "focus", label: "Current focus", count: 1 },
  { value: "decision", label: "Needs my decision", count: 0 },
  { value: "blocked", label: "Blocked", count: 1 },
  { value: "all", label: "All work", count: items.length },
];

function matchesFilter(item: WorkItem, filter: BoardFilter) {
  if (filter === "focus") return item.priority === "Now";
  if (filter === "decision") return item.decision === "Needed now";
  if (filter === "blocked") return item.state === "blocked";
  return true;
}

function WorkCard({ item }: { item: WorkItem }) {
  return (
    <article className={`work-card state-${item.state}`}>
      <div className="card-kicker">
        <span className="issue-number">#{item.number}</span>
        <span className={`priority priority-${item.priority.toLowerCase()}`}>{item.priority}</span>
      </div>
      <h3>{item.title}</h3>
      <p className="card-summary">{item.summary}</p>

      <div className="card-metadata" aria-label="Task controls">
        <span className="gate-pill"><span aria-hidden="true">◆</span> {item.gate}</span>
        <span className="workflow-pill">{item.workflow}</span>
      </div>

      <div className="next-action">
        <span className="next-label">Next action</span>
        <p>{item.next}</p>
      </div>

      <div className="owner-row">
        <span className="avatar" aria-hidden="true">{item.owner.charAt(0)}</span>
        <div>
          <span>Owned by</span>
          <strong>{item.owner}</strong>
        </div>
      </div>

      <div className="card-actions">
        <a href={item.issueUrl} target="_blank" rel="noreferrer">Open task <span aria-hidden="true">↗</span></a>
        {item.evidenceUrl && (
          <a className="quiet-link" href={item.evidenceUrl} target="_blank" rel="noreferrer">
            {item.evidenceLabel} <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
    </article>
  );
}

export default function Home() {
  const [filter, setFilter] = useState<BoardFilter>("focus");
  const visibleItems = useMemo(() => items.filter((item) => matchesFilter(item, filter)), [filter]);

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="STEER Flight Board home">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span><strong>STEER</strong> Flight Board</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#how-it-works">How work moves</a>
          <a href={`${githubRoot}/blob/main/docs/README.md`} target="_blank" rel="noreferrer">Team guide</a>
          <a className="github-button" href={`${projectRoot}/views/2`} target="_blank" rel="noreferrer">
            Open GitHub board <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <span className="eyebrow">Human control tower · Pilot 01</span>
          <h1>Know where to act,<br /><em>what to own,</em> and why.</h1>
          <p>
            A clear view of STEER work for human contributors. Start with the next action;
            open GitHub only when you are ready to change the official record.
          </p>
          <div className="source-note"><span className="live-dot" /> GitHub remains the system of record</div>
        </div>

        <aside className="focus-panel" aria-labelledby="focus-heading">
          <div className="focus-heading-row">
            <div>
              <span className="panel-label">Your next move</span>
              <h2 id="focus-heading">Prepare Gate 2</h2>
            </div>
            <span className="phase-badge">Frame</span>
          </div>
          <p>Review the tracer exam in a new work session. Decide whether it can prove the intended behavior before any code is written.</p>
          <div className="focus-rule">
            <span>Human authority</span>
            <strong>Interim Tech Lead</strong>
          </div>
          <div className="focus-rule">
            <span>Implementation</span>
            <strong className="blocked-text">Blocked until approval</strong>
          </div>
          <a className="primary-action" href={`${githubRoot}/blob/main/steer/exams/0002-source-health-tracer.md`} target="_blank" rel="noreferrer">
            Read the Gate 2 exam <span aria-hidden="true">→</span>
          </a>
        </aside>
      </section>

      <section className="phase-section" aria-labelledby="flight-path-heading">
        <div className="section-title-row">
          <div>
            <span className="eyebrow dark">Current flight path</span>
            <h2 id="flight-path-heading">Seven phases. Three human gates.</h2>
          </div>
          <p>Work moves forward only when its evidence is ready. Gates never become agent approvals.</p>
        </div>
        <ol className="phase-rail">
          {phases.map((phase, index) => (
            <li key={phase.name} className={phase.name === "Frame" ? "current-phase" : ""}>
              <div className="phase-node"><span>{String(index + 1).padStart(2, "0")}</span></div>
              <strong>{phase.name}</strong>
              <small>{phase.cue}</small>
              {(phase.name === "Frame" || phase.name === "Release") && <b className="gate-marker">◆</b>}
            </li>
          ))}
        </ol>
      </section>

      <section className="board-section" aria-labelledby="board-heading">
        <div className="board-heading-row">
          <div>
            <span className="eyebrow dark">Work in flight</span>
            <h2 id="board-heading">Start with the signal, not the ticket.</h2>
          </div>
          <a className="decision-link" href={`${projectRoot}/views/3`} target="_blank" rel="noreferrer">
            Decision inbox <strong>0</strong> <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="filter-tabs" role="tablist" aria-label="Filter board tasks">
          {filters.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={filter === option.value}
              className={filter === option.value ? "active" : ""}
              onClick={() => setFilter(option.value)}
            >
              {option.label} <span>{option.count}</span>
            </button>
          ))}
        </div>

        {visibleItems.length ? (
          <div className="flight-grid">
            {phases.map((phase) => {
              const phaseItems = visibleItems.filter((item) => item.phase === phase.name);
              return (
                <section className="phase-column" key={phase.name} aria-labelledby={`phase-${phase.name}`}>
                  <header>
                    <span className={`column-dot dot-${phase.name.toLowerCase()}`} />
                    <h3 id={`phase-${phase.name}`}>{phase.name}</h3>
                    <span>{phaseItems.length}</span>
                  </header>
                  <div className="column-cards">
                    {phaseItems.map((item) => <WorkCard key={item.number} item={item} />)}
                    {!phaseItems.length && <div className="empty-column">Clear airspace</div>}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <span aria-hidden="true">✓</span>
            <h3>No human decision is waiting right now.</h3>
            <p>The board will surface a decision here only when the evidence and named authority are ready.</p>
            <button type="button" onClick={() => setFilter("focus")}>Return to current focus</button>
          </div>
        )}
      </section>

      <section className="how-section" id="how-it-works" aria-labelledby="how-heading">
        <div className="how-intro">
          <span className="eyebrow">How contributors work</span>
          <h2 id="how-heading">One visible path from question to learning.</h2>
          <p>The Flight Board explains the work. GitHub records the work. Block Buzz carries team conversation—not approvals.</p>
          <a href={`${githubRoot}/blob/main/steer/TEAM-ENVIRONMENT.md`} target="_blank" rel="noreferrer">Read the full team environment guide <span aria-hidden="true">↗</span></a>
        </div>
        <ol className="work-steps">
          <li><span>01</span><div><strong>Choose from Current focus</strong><p>Do not start from the whole backlog. Begin with the one item marked Now.</p></div></li>
          <li><span>02</span><div><strong>Read the next action</strong><p>Open the brief, exam, or evidence before taking ownership.</p></div></li>
          <li><span>03</span><div><strong>Work in GitHub</strong><p>Assign yourself, use an isolated branch, and attach evidence to the issue or pull request.</p></div></li>
          <li><span>04</span><div><strong>Stop at human gates</strong><p>Agents may prepare evidence. Only the named human authority records the ruling.</p></div></li>
        </ol>
      </section>

      <footer>
        <div><strong>STEER Flight Board</strong><span>Clarity for human contributors in an agentic delivery system.</span></div>
        <div className="footer-links">
          <a href={`${githubRoot}/issues`} target="_blank" rel="noreferrer">Issues</a>
          <a href={`${githubRoot}/pulls`} target="_blank" rel="noreferrer">Pull requests</a>
          <a href={`${githubRoot}/blob/main/steer/README.md`} target="_blank" rel="noreferrer">STEER guide</a>
        </div>
      </footer>
    </main>
  );
}
