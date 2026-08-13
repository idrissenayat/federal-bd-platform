type D1Result<T = Record<string, unknown>> = {
  results?: T[];
  meta?: { last_row_id?: number };
};

type Statement = {
  bind(...values: unknown[]): Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
};

type Database = {
  prepare(sql: string): Statement;
  batch(statements: Statement[]): Promise<unknown[]>;
};

type Env = { DB: Database };

type User = { id: string; email: string | null; name: string };

const phases = ["Sense", "Frame", "Engineer", "Evaluate", "Release", "Observe", "Learn"];
const priorities = ["Now", "Next", "Later"];
const workflows = ["STEER", "Control", "Setup / excluded", "Unassigned"];
const states = ["queued", "active", "blocked", "complete"];

type Finding = {
  severity: "blocker" | "should-fix" | "note";
  title: string;
  detail: string;
  action: string;
};

type EvidenceRead = { text: string | null; scope: string };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function userFrom(request: Request): User | null {
  const id = request.headers.get("oai-authenticated-user-id");
  if (!id) return null;
  const email = request.headers.get("oai-authenticated-user-email");
  const encodedName = request.headers.get("oai-authenticated-user-full-name");
  const encoding = request.headers.get("oai-authenticated-user-full-name-encoding");
  const decodedName = encodedName && encoding === "percent-encoded-utf-8"
    ? decodeURIComponent(encodedName)
    : null;
  return { id, email, name: decodedName ?? email?.split("@")[0] ?? "Contributor" };
}

async function ensureSchema(db: Database) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS members (
      id text PRIMARY KEY NOT NULL,
      display_name text NOT NULL,
      email text,
      kind text NOT NULL,
      role text NOT NULL,
      authority text NOT NULL,
      status text DEFAULT 'available' NOT NULL,
      accent text DEFAULT 'aqua' NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_members_kind ON members (kind)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS work_items (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      key text NOT NULL UNIQUE,
      title text NOT NULL,
      description text NOT NULL,
      phase text NOT NULL,
      priority text NOT NULL,
      workflow text NOT NULL,
      state text NOT NULL,
      gate text NOT NULL,
      decision_status text NOT NULL,
      decision_authority text NOT NULL,
      assignee_id text,
      next_action text NOT NULL,
      evidence_url text,
      github_url text,
      created_by text NOT NULL,
      created_at text NOT NULL,
      updated_at text NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_work_items_phase_state ON work_items (phase, state)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_work_items_decision_status ON work_items (decision_status)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_work_items_assignee ON work_items (assignee_id)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS activity (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      item_id integer NOT NULL,
      actor_id text NOT NULL,
      action text NOT NULL,
      detail text NOT NULL,
      created_at text NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_activity_item_created ON activity (item_id, created_at)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS decisions (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      item_id integer NOT NULL,
      gate text NOT NULL,
      decision text NOT NULL,
      reasoning text NOT NULL,
      actor_id text NOT NULL,
      actor_email text,
      created_at text NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_decisions_item_created ON decisions (item_id, created_at)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS agent_reviews (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      item_id integer NOT NULL,
      agent_id text NOT NULL,
      review_mode text NOT NULL,
      recommendation text NOT NULL,
      confidence text NOT NULL,
      summary text NOT NULL,
      findings_json text NOT NULL,
      dependencies_json text NOT NULL,
      impacts_json text NOT NULL,
      actions_json text NOT NULL,
      derived_tags_json text NOT NULL,
      evidence_scope text NOT NULL,
      reviewed_item_updated_at text NOT NULL,
      requested_by text NOT NULL,
      created_at text NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_agent_reviews_item_created ON agent_reviews (item_id, created_at)"),
  ]);
  await db.prepare("PRAGMA optimize").run();
}

async function ensureCurrentUser(db: Database, user: User) {
  await db.prepare(
    `INSERT INTO members (id, display_name, email, kind, role, authority, status, accent)
     VALUES (?, ?, ?, 'human', 'Contributor', 'May own work; gates require the named authority', 'available', 'aqua')
     ON CONFLICT(id) DO UPDATE SET display_name = excluded.display_name, email = excluded.email`,
  ).bind(user.id, user.name, user.email).run();
  const owners = await db.prepare("SELECT COUNT(*) AS count FROM members WHERE role LIKE '%Product Lead%'").first<{ count: number }>();
  if ((owners?.count ?? 0) === 0) {
    await db.prepare("UPDATE members SET role = 'Product Lead · interim Tech Lead', authority = 'Gates 1–3 for solo calibration sessions' WHERE id = ?")
      .bind(user.id).run();
  }
}

async function ensureSeedData(db: Database, user: User) {
  const count = await db.prepare("SELECT COUNT(*) AS count FROM work_items").first<{ count: number }>();
  if ((count?.count ?? 0) > 0) return;
  const now = new Date().toISOString();

  await db.batch([
    db.prepare(`INSERT INTO members (id, display_name, email, kind, role, authority, status, accent)
      VALUES (?, ?, ?, 'human', 'Product Lead · interim Tech Lead', 'Gates 1–3 for solo calibration sessions', 'available', 'aqua')
      ON CONFLICT(id) DO UPDATE SET role = excluded.role, authority = excluded.authority`).bind(user.id, user.name, user.email),
    db.prepare("INSERT OR IGNORE INTO members (id, display_name, kind, role, authority, status, accent) VALUES ('human-security', 'Open seat', 'human', 'Security Owner', 'Required on #security Gate 3 rulings', 'open', 'amber')"),
    db.prepare("INSERT OR IGNORE INTO members (id, display_name, kind, role, authority, status, accent) VALUES ('agent-scout', 'Scout', 'agent', 'Discovery Agent', 'Finds and preserves signals; cannot approve gates', 'enrolled', 'blue')"),
    db.prepare("INSERT OR IGNORE INTO members (id, display_name, kind, role, authority, status, accent) VALUES ('agent-architect', 'Architect', 'agent', 'Architecture Agent', 'Prepares design evidence; cannot approve gates', 'enrolled', 'violet')"),
    db.prepare("INSERT OR IGNORE INTO members (id, display_name, kind, role, authority, status, accent) VALUES ('agent-builder', 'Builder', 'agent', 'Implementation Agent', 'Builds only after Gates 1 and 2', 'enrolled', 'green')"),
    db.prepare("INSERT OR IGNORE INTO members (id, display_name, kind, role, authority, status, accent) VALUES ('agent-test', 'Test Agent', 'agent', 'Verification Agent', 'Runs exams and records evidence; cannot release', 'enrolled', 'amber')"),
    db.prepare("INSERT OR IGNORE INTO members (id, display_name, kind, role, authority, status, accent) VALUES ('agent-critic', 'Critic', 'agent', 'Independent Critic', 'Challenges claims in fresh context; advisory only', 'enrolled', 'coral')"),
    db.prepare("INSERT OR IGNORE INTO members (id, display_name, kind, role, authority, status, accent) VALUES ('agent-docs', 'Docs Agent', 'agent', 'Documentation Agent', 'Maintains evidence and contributor guidance', 'enrolled', 'blue')"),
    db.prepare("INSERT OR IGNORE INTO members (id, display_name, kind, role, authority, status, accent) VALUES ('agent-ops', 'Ops Agent', 'agent', 'Operations Agent', 'Operates environments within approved boundaries', 'enrolled', 'green')"),
  ]);

  const seeds = [
    ["STR-002", "Execute feasibility tracer 0002", "Prove one setup item can travel through all seven STEER phases with complete, auditable evidence.", "Frame", "Now", "Setup / excluded", "active", "Gate 2 pending", "Needed now", "Interim Tech Lead", user.id, "Review Exam 0002 and record the separate Gate 2 ruling.", "https://github.com/idrissenayat/federal-bd-platform/blob/main/steer/exams/0002-source-health-tracer.md", "https://github.com/idrissenayat/federal-bd-platform/issues/2"],
    ["STR-010", "Complete Block Buzz agent operations", "Activate persistent hosted agent workers on the official Block Buzz relay.", "Engineer", "Next", "Setup / excluded", "blocked", "No gate (setup)", "Waiting", "Human owner", "agent-ops", "Assign approved runtimes and add provider credentials directly in Railway.", "https://github.com/idrissenayat/federal-bd-platform/pull/11", "https://github.com/idrissenayat/federal-bd-platform/issues/10"],
    ["STR-003", "Freeze comparative cohort and allocation", "Create the fair STEER-versus-Control comparison before seeing item difficulty.", "Sense", "Next", "Unassigned", "queued", "Gate 1 pending", "Waiting", "Product Lead", user.id, "Freeze candidate cards and workflow assignments after tracer calibration.", null, "https://github.com/idrissenayat/federal-bd-platform/issues/3"],
    ["STR-004", "Opportunity intelligence vertical slice", "Preserve an official federal opportunity and produce a sourced advisory recommendation.", "Sense", "Later", "Unassigned", "queued", "Gate 1 pending", "Waiting", "Product Lead", null, "Wait for cohort allocation; do not choose treatment after work begins.", "https://github.com/idrissenayat/federal-bd-platform/blob/main/steer/briefs/0003-opportunity-intelligence.md", "https://github.com/idrissenayat/federal-bd-platform/issues/4"],
    ["STR-012", "Enable protected main and PR-only delivery", "Protect the shared repository with required checks and auditable delivery.", "Learn", "Later", "Setup / excluded", "complete", "No gate (setup)", "Decided", "Not required", user.id, "Complete — direct pushes are rejected and changes flow through pull requests.", null, "https://github.com/idrissenayat/federal-bd-platform/issues/12"],
    ["STR-014", "Build the STEER work-management app", "Create the daily operating surface for humans and agents using the STEER framework.", "Engineer", "Now", "Setup / excluded", "active", "No gate (setup)", "Not required", "Human owner", user.id, "Review the operational app and specify changes before merging PR #15.", "https://github.com/idrissenayat/federal-bd-platform/pull/15", "https://github.com/idrissenayat/federal-bd-platform/issues/14"],
  ];

  for (const seed of seeds) {
    await db.prepare(
      `INSERT INTO work_items
       (key, title, description, phase, priority, workflow, state, gate, decision_status,
        decision_authority, assignee_id, next_action, evidence_url, github_url, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(...seed, user.id, now, now).run();
  }

  const seededItems = await db.prepare("SELECT id, key, phase FROM work_items ORDER BY id").all<{ id: number; key: string; phase: string }>();
  const activityStatements = (seededItems.results ?? []).map((item) =>
    db.prepare("INSERT INTO activity (item_id, actor_id, action, detail, created_at) VALUES (?, ?, 'created', ?, ?)")
      .bind(item.id, user.id, `${item.key} entered ${item.phase}`, now),
  );
  if (activityStatements.length) await db.batch(activityStatements);
}

async function bootstrap(db: Database, user: User) {
  await ensureSchema(db);
  await ensureCurrentUser(db, user);
  await ensureSeedData(db, user);
  const [items, members, activity, decisions, reviews] = await Promise.all([
    db.prepare(
      `SELECT w.*, m.display_name AS assignee_name, m.kind AS assignee_kind
       FROM work_items w LEFT JOIN members m ON m.id = w.assignee_id
       ORDER BY CASE w.priority WHEN 'Now' THEN 0 WHEN 'Next' THEN 1 ELSE 2 END, w.updated_at DESC`,
    ).all(),
    db.prepare("SELECT * FROM members ORDER BY kind DESC, display_name").all(),
    db.prepare(
      `SELECT a.*, w.key AS item_key, w.title AS item_title, m.display_name AS actor_name
       FROM activity a JOIN work_items w ON w.id = a.item_id
       LEFT JOIN members m ON m.id = a.actor_id ORDER BY a.created_at DESC LIMIT 80`,
    ).all(),
    db.prepare(
      `SELECT d.*, w.key AS item_key, w.title AS item_title
       FROM decisions d JOIN work_items w ON w.id = d.item_id ORDER BY d.created_at DESC`,
    ).all(),
    db.prepare(
      `SELECT r.*, w.key AS item_key, w.title AS item_title
       FROM agent_reviews r JOIN work_items w ON w.id = r.item_id ORDER BY r.created_at DESC`,
    ).all(),
  ]);
  const parsedReviews = (reviews.results ?? []).map((review) => ({
    ...review,
    findings: JSON.parse(String((review as Record<string, unknown>).findings_json ?? "[]")),
    dependencies: JSON.parse(String((review as Record<string, unknown>).dependencies_json ?? "[]")),
    impacts: JSON.parse(String((review as Record<string, unknown>).impacts_json ?? "[]")),
    actions: JSON.parse(String((review as Record<string, unknown>).actions_json ?? "[]")),
    derived_tags: JSON.parse(String((review as Record<string, unknown>).derived_tags_json ?? "[]")),
  }));
  return {
    user,
    items: items.results ?? [],
    members: members.results ?? [],
    activity: activity.results ?? [],
    decisions: decisions.results ?? [],
    reviews: parsedReviews,
  };
}

async function createItem(request: Request, db: Database, user: User) {
  const body = await request.json() as Record<string, unknown>;
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const phase = String(body.phase ?? "Sense");
  const priority = String(body.priority ?? "Next");
  const workflow = String(body.workflow ?? "Unassigned");
  const assigneeId = body.assigneeId ? String(body.assigneeId) : null;
  if (title.length < 3 || description.length < 10) return json({ error: "Add a clear title and description." }, 400);
  if (!phases.includes(phase) || !priorities.includes(priority) || !workflows.includes(workflow)) return json({ error: "Invalid workflow fields." }, 400);
  const next = await db.prepare("SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM work_items").first<{ next_id: number }>();
  const key = `STR-${String(next?.next_id ?? Date.now()).padStart(3, "0")}`;
  const now = new Date().toISOString();
  const result = await db.prepare(
    `INSERT INTO work_items
     (key, title, description, phase, priority, workflow, state, gate, decision_status,
      decision_authority, assignee_id, next_action, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'queued', 'Gate 1 pending', 'Waiting', 'Product Lead', ?, ?, ?, ?, ?)`,
  ).bind(key, title, description, phase, priority, workflow, assigneeId, String(body.nextAction ?? "Frame the intended outcome and prepare Gate 1 evidence."), user.id, now, now).run();
  const itemId = result.meta?.last_row_id;
  if (itemId) {
    await db.prepare("INSERT INTO activity (item_id, actor_id, action, detail, created_at) VALUES (?, ?, 'created', ?, ?)")
      .bind(itemId, user.id, `${key} created in ${phase}`, now).run();
  }
  return json({ ok: true, key }, 201);
}

async function updateItem(request: Request, db: Database, user: User, itemId: number) {
  const current = await db.prepare("SELECT * FROM work_items WHERE id = ?").bind(itemId).first<Record<string, unknown>>();
  if (!current) return json({ error: "Work item not found." }, 404);
  const body = await request.json() as Record<string, unknown>;
  const allowed: Record<string, { column: string; values?: string[] }> = {
    phase: { column: "phase", values: phases },
    priority: { column: "priority", values: priorities },
    workflow: { column: "workflow", values: workflows },
    state: { column: "state", values: states },
    decisionStatus: { column: "decision_status", values: ["Waiting", "Needed now", "Decided", "Not required"] },
    assigneeId: { column: "assignee_id" },
    nextAction: { column: "next_action" },
    evidenceUrl: { column: "evidence_url" },
    githubUrl: { column: "github_url" },
    title: { column: "title" },
    description: { column: "description" },
  };
  const entries = Object.entries(body).filter(([key]) => key in allowed);
  if (!entries.length) return json({ error: "No supported changes supplied." }, 400);
  const sets: string[] = [];
  const values: unknown[] = [];
  const changes: string[] = [];
  for (const [key, rawValue] of entries) {
    const rule = allowed[key];
    const value = rawValue === null ? null : String(rawValue).trim();
    if (rule.values && (!value || !rule.values.includes(value))) return json({ error: `Invalid ${key}.` }, 400);
    sets.push(`${rule.column} = ?`);
    values.push(value);
    changes.push(`${key} → ${value || "unassigned"}`);
  }
  const now = new Date().toISOString();
  sets.push("updated_at = ?");
  values.push(now, itemId);
  await db.prepare(`UPDATE work_items SET ${sets.join(", ")} WHERE id = ?`).bind(...values).run();
  await db.prepare("INSERT INTO activity (item_id, actor_id, action, detail, created_at) VALUES (?, ?, 'updated', ?, ?)")
    .bind(itemId, user.id, changes.join(" · "), now).run();
  return json({ ok: true });
}

function deriveTags(text: string) {
  const rules: Array<[string, RegExp]> = [
    ["#security", /\b(auth|authori[sz]ation|credential|secret|token|api key|security|session)\b/i],
    ["#privacy", /\b(privacy|personal data|pii|email address|retention|delete user)\b/i],
    ["#a11y", /\b(accessibility|a11y|keyboard|screen reader|wcag|contrast)\b/i],
    ["#reliability", /\b(reliability|rollback|telemetry|monitor|timeout|latency|availability|deploy|release)\b/i],
    ["#legal", /\b(legal|license|compliance|claim|copyright)\b/i],
    ["#design-system", /\b(design system|interface|user experience|\bui\b|\bux\b)\b/i],
    ["#money", /\b(payment|price|pricing|cost|budget|charge|money)\b/i],
  ];
  return rules.filter(([, pattern]) => pattern.test(text)).map(([tag]) => tag);
}

async function readEvidence(urlValue: unknown): Promise<EvidenceRead> {
  if (!urlValue) return { text: null, scope: "Work item fields only; no evidence link was attached." };
  try {
    const source = new URL(String(urlValue));
    let target = source;
    if (source.hostname === "github.com") {
      const parts = source.pathname.split("/").filter(Boolean);
      const blobIndex = parts.indexOf("blob");
      if (blobIndex !== 2 || parts.length < 5) {
        return { text: null, scope: "Work item fields and evidence-link presence; the linked GitHub page is not a raw artifact." };
      }
      target = new URL(`https://raw.githubusercontent.com/${parts[0]}/${parts[1]}/${parts.slice(3).join("/")}`);
    } else if (source.hostname !== "raw.githubusercontent.com") {
      return { text: null, scope: "Work item fields and evidence-link presence; external artifact reading is restricted to approved GitHub text links." };
    }
    const response = await fetch(target, { headers: { accept: "text/plain" }, signal: AbortSignal.timeout(7000) });
    if (!response.ok) return { text: null, scope: `Work item fields and evidence-link presence; the artifact returned HTTP ${response.status}.` };
    const text = (await response.text()).slice(0, 60000);
    return { text, scope: "Work item fields plus the linked public GitHub text artifact (maximum 60,000 characters)." };
  } catch {
    return { text: null, scope: "Work item fields and evidence-link presence; the artifact could not be read automatically." };
  }
}

async function runCriticReview(db: Database, user: User, itemId: number) {
  const item = await db.prepare("SELECT * FROM work_items WHERE id = ?").bind(itemId).first<Record<string, unknown>>();
  if (!item) return json({ error: "Work item not found." }, 404);

  const evidence = await readEvidence(item.evidence_url);
  const joinedText = [item.title, item.description, item.next_action, evidence.text].filter(Boolean).join("\n");
  const tags = deriveTags(joinedText);
  const findings: Finding[] = [];
  const dependencies: string[] = [];
  const impacts: string[] = [];
  const actions: string[] = [];
  const addFinding = (finding: Finding) => {
    if (!findings.some((existing) => existing.title === finding.title)) findings.push(finding);
  };

  if (item.state === "blocked") {
    addFinding({ severity: "blocker", title: "Work is already blocked", detail: String(item.next_action), action: "Resolve or explicitly rule on the blocker before advancing the gate." });
    dependencies.push(`Blocker resolution: ${String(item.next_action)}`);
  }
  if (!item.evidence_url) {
    addFinding({
      severity: item.decision_status === "Needed now" ? "blocker" : "should-fix",
      title: "Decision evidence is missing",
      detail: "The human cannot verify the recommendation against a durable artifact.",
      action: "Attach the exact brief, exam, build, or observation artifact required by this gate.",
    });
  } else if (!evidence.text) {
    addFinding({ severity: "should-fix", title: "Artifact needs direct human inspection", detail: evidence.scope, action: "Open the evidence link and verify the exact revision before ruling." });
  }
  if (!item.assignee_id) {
    addFinding({ severity: "should-fix", title: "No accountable owner", detail: "The item has no human or agent assigned to resolve findings and execute the next action.", action: "Assign an owner before the item advances." });
  }
  if (item.workflow === "Unassigned") {
    addFinding({ severity: "should-fix", title: "Workflow treatment is undecided", detail: "STEER, Control, and Setup work have different controls and measurement implications.", action: "Assign the treatment before delivery work begins." });
  }

  const gate = String(item.gate ?? "");
  const evidenceText = evidence.text?.toLowerCase() ?? "";
  if (gate === "Gate 1 pending" && evidence.text) {
    const required = ["expected outcome", "what \"done and correct\" means", "out of scope", "risks", "design intent"];
    const missing = required.filter((section) => !evidenceText.includes(section));
    if (missing.length) addFinding({ severity: "should-fix", title: "Intent brief coverage is incomplete", detail: `The linked artifact does not clearly expose: ${missing.join(", ")}.`, action: "Clarify these sections before approving Gate 1." });
    impacts.push("Approval authorizes exam design against this intent; ambiguity will propagate into tests and implementation.");
  }
  if (gate === "Gate 2 pending") {
    const required = ["acceptance tests", "edge cases", "non-functional checks", "outcome instrumentation", "guardrails in force"];
    const missing = evidence.text ? required.filter((section) => !evidenceText.includes(section)) : required;
    if (missing.length) addFinding({ severity: evidence.text ? "should-fix" : "blocker", title: "Exam coverage needs confirmation", detail: `The review could not verify: ${missing.join(", ")}.`, action: "Confirm each required section expresses what correct means before approving Gate 2." });
    else addFinding({ severity: "note", title: "Core Gate 2 sections are present", detail: "The exam exposes acceptance tests, attacks, non-functional checks, instrumentation, and named guardrails.", action: "Read for quality and omissions; presence alone does not prove sufficiency." });
    impacts.push("Gate 2 approval freezes the exam and permits Builder implementation. Later exam changes require Tech Lead authorization.");
  }
  if (gate === "Gate 3 pending") {
    const hasVerification = /\b(pass|passed|verified|green|successful)\b/i.test(evidence.text ?? "");
    if (!hasVerification) addFinding({ severity: "blocker", title: "Verified-build evidence is not visible", detail: "Gate 3 needs a verified build, Critic findings, checks, rollout observation, and a rollback path.", action: "Attach the exact verified commit and required check evidence before release approval." });
    impacts.push("Approval authorizes release to users and must include every tagged domain owner plus the independent-perspective rule.");
  }

  const defaultClosed = tags.filter((tag) => ["#security", "#privacy", "#money"].includes(tag));
  if (defaultClosed.length) {
    addFinding({ severity: "should-fix", title: "Default-closed controls apply", detail: `${defaultClosed.join(", ")} signals require conservative review, named authority, and the mandated cooling-off before Gate 3.`, action: "Confirm the specialist guardrails and cooling-off evidence are planned." });
    dependencies.push(`Default-closed controls for ${defaultClosed.join(", ")}`);
  }
  if (tags.length) dependencies.push(`Derived domain coverage: ${tags.join(", ")}`);
  if (gate.includes("pending")) dependencies.push(`Authenticated ${String(item.decision_authority)} ruling for ${gate}`);
  if (item.evidence_url) dependencies.push("Exact evidence revision must remain resolvable and match the ruling.");
  if (/block buzz|railway/i.test(joinedText)) dependencies.push("External agent-operations availability in Block Buzz / Railway.");
  if (item.workflow === "Setup / excluded") impacts.push("This item is excluded from the STEER-versus-Control outcome comparison; keep its effort out of experiment results.");
  if (item.state === "blocked") impacts.push("Downstream work should not advance while the item remains blocked.");

  const severityRank = { blocker: 0, "should-fix": 1, note: 2 } as const;
  findings.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
  const cappedFindings = findings.slice(0, 3);
  for (const finding of cappedFindings) if (finding.severity !== "note") actions.push(finding.action);
  if (item.evidence_url) actions.push("Open the linked evidence and verify the exact revision, not only this summary.");
  if (gate.includes("pending")) actions.push(`Record the ${gate} ruling with concise evidence-based reasoning.`);
  const uniqueActions = [...new Set(actions)].slice(0, 4);

  const blockers = cappedFindings.filter((finding) => finding.severity === "blocker").length;
  const shouldFix = cappedFindings.filter((finding) => finding.severity === "should-fix").length;
  const recommendation = blockers ? "Resolve blockers before ruling" : shouldFix ? "Review with changes in mind" : "Ready for human review";
  const summary = blockers
    ? `The Critic found ${blockers} blocking condition${blockers === 1 ? "" : "s"}. Do not advance until the named action is resolved or explicitly ruled on.`
    : shouldFix
      ? `No automatic hard stop was found, but ${shouldFix} material concern${shouldFix === 1 ? "" : "s"} should shape the human review.`
      : "No material control gap was visible in the reviewed scope. The human must still inspect the evidence and make the gate decision.";
  const now = new Date().toISOString();
  const reviewMode = evidence.text ? "structured_artifact_review" : "structured_workspace_review";
  const confidence = evidence.text ? "Medium" : "Low";

  const result = await db.prepare(
    `INSERT INTO agent_reviews
     (item_id, agent_id, review_mode, recommendation, confidence, summary, findings_json,
      dependencies_json, impacts_json, actions_json, derived_tags_json, evidence_scope,
      reviewed_item_updated_at, requested_by, created_at)
     VALUES (?, 'agent-critic', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    itemId,
    reviewMode,
    recommendation,
    confidence,
    summary,
    JSON.stringify(cappedFindings),
    JSON.stringify([...new Set(dependencies)].slice(0, 5)),
    JSON.stringify([...new Set(impacts)].slice(0, 4)),
    JSON.stringify(uniqueActions),
    JSON.stringify(tags),
    evidence.scope,
    String(item.updated_at),
    user.id,
    now,
  ).run();
  await db.prepare("INSERT INTO activity (item_id, actor_id, action, detail, created_at) VALUES (?, 'agent-critic', 'agent_review', ?, ?)")
    .bind(itemId, `${recommendation} · ${cappedFindings.length} significant finding${cappedFindings.length === 1 ? "" : "s"}`, now).run();
  return json({ ok: true, reviewId: result.meta?.last_row_id, recommendation }, 201);
}

async function decide(request: Request, db: Database, user: User, itemId: number) {
  const current = await db.prepare("SELECT * FROM work_items WHERE id = ?").bind(itemId).first<Record<string, unknown>>();
  if (!current) return json({ error: "Work item not found." }, 404);
  const body = await request.json() as Record<string, unknown>;
  const decision = String(body.decision ?? "");
  const reasoning = String(body.reasoning ?? "").trim();
  if (!["APPROVED", "CHANGES_REQUESTED"].includes(decision) || reasoning.length < 12) {
    return json({ error: "Select a ruling and provide meaningful reasoning." }, 400);
  }
  const gate = String(current.gate ?? "Gate pending");
  const member = await db.prepare("SELECT kind, role FROM members WHERE id = ?").bind(user.id).first<{ kind: string; role: string }>();
  const role = member?.role ?? "";
  const authorized = member?.kind === "human" && (
    (gate === "Gate 1 pending" && role.includes("Product Lead")) ||
    (gate === "Gate 2 pending" && role.includes("Tech Lead")) ||
    (gate === "Gate 3 pending" && role.includes("Product Lead") && role.includes("Tech Lead"))
  );
  if (!authorized) return json({ error: `Your recorded role is not the named authority for ${gate}.` }, 403);
  const now = new Date().toISOString();
  await db.prepare(
    "INSERT INTO decisions (item_id, gate, decision, reasoning, actor_id, actor_email, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).bind(itemId, gate, decision, reasoning, user.id, user.email, now).run();

  let nextGate = gate;
  let nextPhase = String(current.phase);
  let nextStatus = "Needed now";
  let nextState = decision === "APPROVED" ? String(current.state) : "blocked";
  if (decision === "APPROVED") {
    nextStatus = "Decided";
    if (gate === "Gate 1 pending") { nextGate = "Gate 2 pending"; nextStatus = "Waiting"; }
    if (gate === "Gate 2 pending") { nextGate = "Gate 2 passed"; nextPhase = "Engineer"; nextState = "active"; }
    if (gate === "Gate 3 pending") { nextGate = "Gate 3 passed"; nextPhase = "Release"; nextState = "active"; }
  }
  await db.prepare(
    "UPDATE work_items SET gate = ?, phase = ?, decision_status = ?, state = ?, updated_at = ? WHERE id = ?",
  ).bind(nextGate, nextPhase, nextStatus, nextState, now, itemId).run();
  await db.prepare("INSERT INTO activity (item_id, actor_id, action, detail, created_at) VALUES (?, ?, 'decision', ?, ?)")
    .bind(itemId, user.id, `${gate}: ${decision} — ${reasoning}`, now).run();
  return json({ ok: true });
}

export async function handleApi(request: Request, env: Env): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) return null;
  if (!env.DB) return json({ error: "Persistent database binding is unavailable." }, 503);
  const user = userFrom(request);
  if (!user) return json({ error: "Authentication required." }, 401);

  try {
    await ensureSchema(env.DB);
    await ensureCurrentUser(env.DB, user);
    if (request.method === "GET" && url.pathname === "/api/bootstrap") return json(await bootstrap(env.DB, user));
    if (request.method === "POST" && url.pathname === "/api/items") return createItem(request, env.DB, user);
    const itemMatch = url.pathname.match(/^\/api\/items\/(\d+)$/);
    if (request.method === "PATCH" && itemMatch) return updateItem(request, env.DB, user, Number(itemMatch[1]));
    const reviewMatch = url.pathname.match(/^\/api\/items\/(\d+)\/reviews$/);
    if (request.method === "POST" && reviewMatch) return runCriticReview(env.DB, user, Number(reviewMatch[1]));
    const decisionMatch = url.pathname.match(/^\/api\/items\/(\d+)\/decisions$/);
    if (request.method === "POST" && decisionMatch) return decide(request, env.DB, user, Number(decisionMatch[1]));
    return json({ error: "Not found." }, 404);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected error." }, 500);
  }
}
