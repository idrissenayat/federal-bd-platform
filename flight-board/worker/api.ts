import { evaluateAgentDispatch } from "./authorization";

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

type Env = { DB: Database; GITHUB_TOKEN?: string };

type User = { id: string; email: string | null; name: string };

const phases = ["Sense", "Frame", "Engineer", "Evaluate", "Release", "Observe", "Learn"];
const priorities = ["Now", "Next", "Later"];
const workflows = ["STEER", "Control", "Setup / excluded", "Unassigned"];
const states = ["queued", "active", "blocked", "complete"];
const decisionStatuses = ["Waiting", "Needed now", "Changes requested", "Rework", "Resubmitted", "Decided", "Not required"];
const buzzRelayHttpUrl = "https://blockbuzzmain-production-5bcb.up.railway.app";
const buzzRelayWsUrl = "wss://blockbuzzmain-production-5bcb.up.railway.app";
const allowedGitHubRepository = "idrissenayat/federal-bd-platform";

type PullRequestReference = { owner: string; repo: string; repository: string; number: number };

type GitHubFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  blob_url?: string;
};

type GitHubCheck = {
  name: string;
  status: string;
  conclusion: string | null;
  url: string | null;
};

type Finding = {
  severity: "blocker" | "should-fix" | "note";
  title: string;
  detail: string;
  action: string;
};

type EvidenceRead = {
  text: string | null;
  scope: string;
  sourceUrl: string | null;
  revision: string | null;
  sha256: string | null;
};

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

async function ensureColumn(db: Database, table: string, column: string, definition: string) {
  const columns = await db.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
  if (!(columns.results ?? []).some((candidate) => candidate.name === column)) {
    await db.prepare(`ALTER TABLE ${table} ADD COLUMN ${definition}`).run();
  }
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
      rework_instructions text,
      blocked_since text,
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
      review_id integer,
      evidence_url text,
      evidence_revision text,
      evidence_sha256 text,
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
      evidence_url text,
      evidence_revision text,
      evidence_sha256 text,
      reviewed_item_updated_at text NOT NULL,
      requested_by text NOT NULL,
      created_at text NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_agent_reviews_item_created ON agent_reviews (item_id, created_at)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS notifications (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      dedupe_key text NOT NULL UNIQUE,
      item_id integer NOT NULL,
      member_id text,
      recipient_role text NOT NULL,
      kind text NOT NULL,
      title text NOT NULL,
      body text NOT NULL,
      channel text DEFAULT 'Block Buzz' NOT NULL,
      status text DEFAULT 'queued' NOT NULL,
      created_at text NOT NULL,
      read_at text
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_notifications_role_created ON notifications (recipient_role, created_at)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_notifications_member_status ON notifications (member_id, status)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS code_reviews (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      item_id integer NOT NULL,
      repository text NOT NULL,
      pull_number integer NOT NULL,
      head_sha text NOT NULL,
      action text NOT NULL,
      reasoning text NOT NULL,
      actor_id text NOT NULL,
      actor_email text,
      github_delivery text NOT NULL,
      github_url text,
      created_at text NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_code_reviews_item_created ON code_reviews (item_id, created_at)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_code_reviews_pr_head ON code_reviews (repository, pull_number, head_sha)"),
  ]);
  await ensureColumn(db, "work_items", "rework_instructions", "rework_instructions text");
  await ensureColumn(db, "work_items", "blocked_since", "blocked_since text");
  await ensureColumn(db, "decisions", "review_id", "review_id integer");
  await ensureColumn(db, "decisions", "evidence_url", "evidence_url text");
  await ensureColumn(db, "decisions", "evidence_revision", "evidence_revision text");
  await ensureColumn(db, "decisions", "evidence_sha256", "evidence_sha256 text");
  await ensureColumn(db, "agent_reviews", "evidence_url", "evidence_url text");
  await ensureColumn(db, "agent_reviews", "evidence_revision", "evidence_revision text");
  await ensureColumn(db, "agent_reviews", "evidence_sha256", "evidence_sha256 text");
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

async function ensureHumanSeats(db: Database) {
  await db.batch([
    db.prepare("INSERT OR IGNORE INTO members (id, display_name, kind, role, authority, status, accent) VALUES ('human-design', 'Open seat', 'human', 'Product Designer', 'Design intent, accessibility, and independent Gate 3 review', 'open', 'violet')"),
    db.prepare("INSERT OR IGNORE INTO members (id, display_name, kind, role, authority, status, accent) VALUES ('human-platform', 'Open seat', 'human', 'Platform / Ops Lead', 'Environment, delivery rails, rollback, telemetry, and agent operations', 'open', 'green')"),
    db.prepare("INSERT OR IGNORE INTO members (id, display_name, kind, role, authority, status, accent) VALUES ('human-security', 'Open seat', 'human', 'Security Owner', 'Required on #security Gate 3 rulings', 'open', 'amber')"),
  ]);
}

function roleContexts(role: string) {
  const contexts: string[] = [];
  if (role.includes("Product Lead")) contexts.push("product");
  if (role.includes("Tech Lead")) contexts.push("tech");
  if (role.includes("Product Designer")) contexts.push("design");
  if (role.includes("Platform") || role.includes("Ops Lead")) contexts.push("platform");
  if (role.includes("Security")) contexts.push("security");
  return contexts.length ? contexts : ["contributor"];
}

async function backfillReworkState(db: Database) {
  const now = new Date().toISOString();
  await db.prepare(
    `UPDATE work_items
     SET blocked_since = COALESCE(blocked_since, (
       SELECT d.created_at FROM decisions d
       WHERE d.item_id = work_items.id AND d.decision = 'CHANGES_REQUESTED'
       ORDER BY d.id DESC LIMIT 1
     ), created_at)
     WHERE state = 'blocked'`,
  ).run();
  await db.prepare("UPDATE work_items SET blocked_since = NULL WHERE state != 'blocked' AND blocked_since IS NOT NULL").run();
  await db.prepare(
    `UPDATE work_items
     SET decision_status = 'Changes requested',
         rework_instructions = COALESCE(rework_instructions, (
           SELECT d.reasoning FROM decisions d
           WHERE d.item_id = work_items.id ORDER BY d.id DESC LIMIT 1
         )),
         next_action = 'Complete the requested changes in the linked evidence and resubmit for a fresh Critic review.',
         blocked_since = COALESCE(blocked_since, ?),
         updated_at = ?
     WHERE state = 'blocked'
       AND decision_status IN ('Waiting', 'Needed now')
       AND (SELECT d.decision FROM decisions d WHERE d.item_id = work_items.id ORDER BY d.id DESC LIMIT 1) = 'CHANGES_REQUESTED'`,
  ).bind(now, now).run();
  await db.prepare(
    `INSERT OR IGNORE INTO notifications
     (dedupe_key, item_id, member_id, recipient_role, kind, title, body, channel, status, created_at)
     SELECT 'decision-' || d.id || '-changes', d.item_id, w.assignee_id,
            COALESCE(m.role, 'Evidence owner'), 'rework_requested',
            w.key || ' returned for changes', d.reasoning, 'Block Buzz', 'queued', d.created_at
     FROM decisions d
     JOIN work_items w ON w.id = d.item_id
     LEFT JOIN members m ON m.id = w.assignee_id
     WHERE d.decision = 'CHANGES_REQUESTED'`,
  ).run();
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
  await ensureHumanSeats(db);
  await ensureSeedData(db, user);
  await backfillReworkState(db);
  const [items, members, activity, decisions, reviews, notifications, currentMember] = await Promise.all([
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
    db.prepare(
      `SELECT n.*, w.key AS item_key, w.title AS item_title, m.display_name AS member_name
       FROM notifications n JOIN work_items w ON w.id = n.item_id
       LEFT JOIN members m ON m.id = n.member_id ORDER BY n.created_at DESC LIMIT 80`,
    ).all(),
    db.prepare("SELECT role, authority FROM members WHERE id = ?").bind(user.id).first<{ role: string; authority: string }>(),
  ]);
  const parsedReviews = (reviews.results ?? []).map((review) => ({
    ...review,
    findings: JSON.parse(String((review as Record<string, unknown>).findings_json ?? "[]")),
    dependencies: JSON.parse(String((review as Record<string, unknown>).dependencies_json ?? "[]")),
    impacts: JSON.parse(String((review as Record<string, unknown>).impacts_json ?? "[]")),
    actions: JSON.parse(String((review as Record<string, unknown>).actions_json ?? "[]")),
    derived_tags: JSON.parse(String((review as Record<string, unknown>).derived_tags_json ?? "[]")),
  }));
  const authorizedItems = (items.results ?? []).map((item) => ({
    ...item,
    dispatch_authorization: evaluateAgentDispatch(item as Record<string, unknown>),
  }));
  return {
    generated_at: new Date().toISOString(),
    user: { ...user, role: currentMember?.role ?? "Contributor", authority: currentMember?.authority ?? "May own work", role_contexts: roleContexts(currentMember?.role ?? "Contributor") },
    items: authorizedItems,
    members: members.results ?? [],
    activity: activity.results ?? [],
    decisions: decisions.results ?? [],
    reviews: parsedReviews,
    notifications: notifications.results ?? [],
  };
}

async function authorizeAgentDispatch(db: Database, user: User, itemId: number) {
  const item = await db.prepare(
    `SELECT w.*, m.display_name AS assignee_name, m.kind AS assignee_kind, m.role AS assignee_role
     FROM work_items w LEFT JOIN members m ON m.id = w.assignee_id WHERE w.id = ?`,
  ).bind(itemId).first<Record<string, unknown>>();
  if (!item) return json({ error: "Work item not found." }, 404);

  const authorization = evaluateAgentDispatch(item);
  if (!authorization.authorized || !authorization.handoff_message) {
    return json({ error: authorization.summary, authorization }, 409);
  }

  const now = new Date().toISOString();
  await db.batch([
    db.prepare("INSERT INTO activity (item_id, actor_id, action, detail, created_at) VALUES (?, ?, 'dispatch_authorized', ?, ?)")
      .bind(itemId, user.id, `authorized agent handoff to ${String(item.assignee_name)} in ${authorization.channel}`, now),
    db.prepare(
      `INSERT OR IGNORE INTO notifications
       (dedupe_key, item_id, member_id, recipient_role, kind, title, body, channel, status, created_at)
       VALUES (?, ?, ?, ?, 'agent_handoff', ?, ?, 'Block Buzz', 'queued', ?)`,
    ).bind(
      `dispatch-${itemId}-${now}`,
      itemId,
      String(item.assignee_id),
      String(item.assignee_role ?? "Assigned agent"),
      `${String(item.key)} authorized for agent handoff`,
      authorization.handoff_message,
      now,
    ),
  ]);
  return json({ ok: true, authorization, message: authorization.handoff_message });
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
    decisionStatus: { column: "decision_status", values: decisionStatuses },
    assigneeId: { column: "assignee_id" },
    nextAction: { column: "next_action" },
    reworkInstructions: { column: "rework_instructions" },
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
  const requestedState = body.state ? String(body.state) : null;
  if (requestedState) {
    sets.push("blocked_since = ?");
    values.push(requestedState === "blocked" ? current.blocked_since ?? now : null);
  }
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
  if (!urlValue) return { text: null, scope: "Work item fields only; no evidence link was attached.", sourceUrl: null, revision: null, sha256: null };
  try {
    const source = new URL(String(urlValue));
    let target = source;
    let revision: string | null = null;
    if (source.hostname === "github.com") {
      const parts = source.pathname.split("/").filter(Boolean);
      const blobIndex = parts.indexOf("blob");
      if (blobIndex !== 2 || parts.length < 5) {
        return { text: null, scope: "Work item fields and evidence-link presence; the linked GitHub page is not a raw artifact.", sourceUrl: source.toString(), revision: null, sha256: null };
      }
      const requestedRef = parts[3];
      revision = requestedRef;
      if (!/^[0-9a-f]{40}$/i.test(requestedRef)) {
        const revisionResponse = await fetch(`https://api.github.com/repos/${parts[0]}/${parts[1]}/commits/${encodeURIComponent(requestedRef)}`, {
          headers: { accept: "application/vnd.github+json", "user-agent": "steer-flight-board" },
          signal: AbortSignal.timeout(7000),
        });
        if (revisionResponse.ok) {
          const payload = await revisionResponse.json() as { sha?: string };
          if (payload.sha && /^[0-9a-f]{40}$/i.test(payload.sha)) revision = payload.sha;
        }
      }
      target = new URL(`https://raw.githubusercontent.com/${parts[0]}/${parts[1]}/${revision}/${parts.slice(4).join("/")}`);
    } else if (source.hostname !== "raw.githubusercontent.com") {
      return { text: null, scope: "Work item fields and evidence-link presence; external artifact reading is restricted to approved GitHub text links.", sourceUrl: source.toString(), revision: null, sha256: null };
    } else {
      const parts = source.pathname.split("/").filter(Boolean);
      revision = parts[2] ?? null;
    }
    const response = await fetch(target, { headers: { accept: "text/plain" }, signal: AbortSignal.timeout(7000) });
    if (!response.ok) return { text: null, scope: `Work item fields and evidence-link presence; the artifact returned HTTP ${response.status}.`, sourceUrl: source.toString(), revision, sha256: null };
    const text = (await response.text()).slice(0, 60000);
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    const sha256 = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
    const revisionLabel = revision && /^[0-9a-f]{40}$/i.test(revision) ? revision.slice(0, 12) : revision;
    return { text, scope: `Work item fields plus the exact linked public GitHub artifact${revisionLabel ? ` at revision ${revisionLabel}` : ""} (maximum 60,000 characters).`, sourceUrl: source.toString(), revision, sha256 };
  } catch {
    return { text: null, scope: "Work item fields and evidence-link presence; the artifact could not be read automatically.", sourceUrl: String(urlValue), revision: null, sha256: null };
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

  if (item.state === "blocked" && !["Changes requested", "Rework", "Resubmitted"].includes(String(item.decision_status))) {
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
  if (gate.includes("pending") && ["Needed now", "Resubmitted"].includes(String(item.decision_status))) dependencies.push(`Authenticated ${String(item.decision_authority)} ruling for ${gate}`);
  if (item.evidence_url) dependencies.push("Exact evidence revision must remain resolvable and match the ruling.");
  if (/block buzz|railway/i.test(joinedText)) dependencies.push("External agent-operations availability in Block Buzz / Railway.");
  if (item.workflow === "Setup / excluded") impacts.push("This item is excluded from the STEER-versus-Control outcome comparison; keep its effort out of experiment results.");
  if (item.state === "blocked") impacts.push("Downstream work should not advance while the item remains blocked.");

  const severityRank = { blocker: 0, "should-fix": 1, note: 2 } as const;
  findings.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
  const cappedFindings = findings.slice(0, 3);
  for (const finding of cappedFindings) if (finding.severity !== "note") actions.push(finding.action);
  if (item.evidence_url) actions.push("Open the linked evidence and verify the exact revision, not only this summary.");
  if (gate.includes("pending") && ["Needed now", "Resubmitted"].includes(String(item.decision_status))) actions.push(`Record the ${gate} ruling with concise evidence-based reasoning.`);
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
      evidence_url, evidence_revision, evidence_sha256, reviewed_item_updated_at, requested_by, created_at)
     VALUES (?, 'agent-critic', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    evidence.sourceUrl,
    evidence.revision,
    evidence.sha256,
    String(item.updated_at),
    user.id,
    now,
  ).run();
  await db.prepare("INSERT INTO activity (item_id, actor_id, action, detail, created_at) VALUES (?, 'agent-critic', 'agent_review', ?, ?)")
    .bind(itemId, `${recommendation} · ${cappedFindings.length} significant finding${cappedFindings.length === 1 ? "" : "s"}`, now).run();
  return json({ ok: true, reviewId: result.meta?.last_row_id, recommendation }, 201);
}

function reworkAssigneeForGate(gate: string) {
  if (gate === "Gate 1 pending") return "agent-scout";
  if (gate === "Gate 2 pending") return "agent-test";
  if (gate === "Gate 3 pending") return "agent-builder";
  return null;
}

function firstRequiredChange(reasoning: string) {
  const line = reasoning.split("\n").map((value) => value.trim()).find((value) => value.toLowerCase().startsWith("required change:"));
  return line?.slice("required change:".length).trim() || "Complete the requested changes in the linked evidence and resubmit for a fresh Critic review.";
}

async function decide(request: Request, db: Database, user: User, itemId: number) {
  const current = await db.prepare("SELECT * FROM work_items WHERE id = ?").bind(itemId).first<Record<string, unknown>>();
  if (!current) return json({ error: "Work item not found." }, 404);
  const body = await request.json() as Record<string, unknown>;
  const decision = String(body.decision ?? "");
  const reasoning = String(body.reasoning ?? "").trim();
  const reviewId = Number(body.reviewId ?? 0);
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
  const review = await db.prepare(
    "SELECT id, reviewed_item_updated_at, evidence_url, evidence_revision, evidence_sha256 FROM agent_reviews WHERE id = ? AND item_id = ?",
  ).bind(reviewId, itemId).first<{ id: number; reviewed_item_updated_at: string; evidence_url: string | null; evidence_revision: string | null; evidence_sha256: string | null }>();
  if (!review || review.reviewed_item_updated_at !== String(current.updated_at)) {
    return json({ error: "Run a fresh Critic review before recording this ruling." }, 409);
  }
  if (!review.evidence_sha256) {
    return json({ error: "The linked evidence could not be bound to an exact content revision. Attach a resolvable public GitHub text artifact and review again." }, 409);
  }
  const now = new Date().toISOString();
  const decisionResult = await db.prepare(
    `INSERT INTO decisions
     (item_id, gate, decision, reasoning, actor_id, actor_email, review_id,
      evidence_url, evidence_revision, evidence_sha256, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(itemId, gate, decision, reasoning, user.id, user.email, review.id, review.evidence_url, review.evidence_revision, review.evidence_sha256, now).run();

  let nextGate = gate;
  let nextPhase = String(current.phase);
  let nextStatus = decision === "APPROVED" ? "Decided" : "Changes requested";
  let nextState = decision === "APPROVED" ? "active" : "blocked";
  let nextAssignee = current.assignee_id;
  let reworkInstructions: string | null = null;
  let nextAction = String(current.next_action);
  if (decision === "APPROVED") {
    if (gate === "Gate 1 pending") { nextGate = "Gate 2 pending"; nextStatus = "Waiting"; }
    if (gate === "Gate 2 pending") { nextGate = "Gate 2 passed"; nextPhase = "Engineer"; nextState = "active"; }
    if (gate === "Gate 3 pending") { nextGate = "Gate 3 passed"; nextPhase = "Release"; nextState = "active"; }
  } else {
    nextAssignee = reworkAssigneeForGate(gate) ?? current.assignee_id;
    reworkInstructions = reasoning;
    nextAction = firstRequiredChange(reasoning);
  }
  const blockedSince = nextState === "blocked" ? current.blocked_since ?? now : null;
  await db.prepare(
    "UPDATE work_items SET gate = ?, phase = ?, decision_status = ?, state = ?, assignee_id = ?, next_action = ?, rework_instructions = ?, blocked_since = ?, updated_at = ? WHERE id = ?",
  ).bind(nextGate, nextPhase, nextStatus, nextState, nextAssignee, nextAction, reworkInstructions, blockedSince, now, itemId).run();
  await db.prepare("INSERT INTO activity (item_id, actor_id, action, detail, created_at) VALUES (?, ?, 'decision', ?, ?)")
    .bind(itemId, user.id, `${gate}: ${decision} — ${reasoning}`, now).run();
  if (decision === "CHANGES_REQUESTED") {
    const recipient = nextAssignee
      ? await db.prepare("SELECT role FROM members WHERE id = ?").bind(nextAssignee).first<{ role: string }>()
      : null;
    await db.prepare(
      `INSERT OR IGNORE INTO notifications
       (dedupe_key, item_id, member_id, recipient_role, kind, title, body, channel, status, created_at)
       VALUES (?, ?, ?, ?, 'rework_requested', ?, ?, 'Block Buzz', 'queued', ?)`,
    ).bind(
      `decision-${decisionResult.meta?.last_row_id ?? now}-changes`, itemId, nextAssignee,
      recipient?.role ?? "Evidence owner", `${String(current.key)} returned for changes`, reasoning, now,
    ).run();
  }
  return json({ ok: true });
}

async function transitionItem(request: Request, db: Database, user: User, itemId: number) {
  const current = await db.prepare("SELECT * FROM work_items WHERE id = ?").bind(itemId).first<Record<string, unknown>>();
  if (!current) return json({ error: "Work item not found." }, 404);
  const body = await request.json() as Record<string, unknown>;
  const action = String(body.action ?? "");
  const status = String(current.decision_status);
  const now = new Date().toISOString();

  if (action === "START_REWORK") {
    if (status !== "Changes requested") return json({ error: "This item is not waiting to begin rework." }, 409);
    await db.prepare("UPDATE work_items SET decision_status = 'Rework', state = 'active', blocked_since = NULL, updated_at = ? WHERE id = ?").bind(now, itemId).run();
    await db.prepare("INSERT INTO activity (item_id, actor_id, action, detail, created_at) VALUES (?, ?, 'workflow', 'Rework started from the recorded change request.', ?)").bind(itemId, user.id, now).run();
    return json({ ok: true, status: "Rework" });
  }

  if (action === "RESUBMIT") {
    if (!["Changes requested", "Rework"].includes(status)) return json({ error: "Only returned work can be resubmitted." }, 409);
    if (!current.evidence_url) return json({ error: "Attach the updated evidence before resubmitting." }, 409);
    const evidence = await readEvidence(current.evidence_url);
    if (!evidence.sha256) return json({ error: "The updated evidence could not be resolved and fingerprinted." }, 409);
    const priorDecision = await db.prepare(
      "SELECT evidence_sha256 FROM decisions WHERE item_id = ? AND decision = 'CHANGES_REQUESTED' ORDER BY id DESC LIMIT 1",
    ).bind(itemId).first<{ evidence_sha256: string | null }>();
    if (priorDecision?.evidence_sha256 && priorDecision.evidence_sha256 === evidence.sha256) {
      return json({ error: "The evidence content has not changed since the change request. Update the artifact before resubmitting." }, 409);
    }
    await db.prepare("UPDATE work_items SET decision_status = 'Resubmitted', state = 'blocked', blocked_since = ?, updated_at = ? WHERE id = ?").bind(now, now, itemId).run();
    await db.prepare("INSERT INTO activity (item_id, actor_id, action, detail, created_at) VALUES (?, ?, 'workflow', 'Updated evidence resubmitted for a fresh Critic review and human ruling.', ?)").bind(itemId, user.id, now).run();
    await db.prepare(
      `INSERT OR IGNORE INTO notifications
       (dedupe_key, item_id, member_id, recipient_role, kind, title, body, channel, status, created_at)
       VALUES (?, ?, NULL, ?, 'decision_ready', ?, ?, 'Block Buzz', 'queued', ?)`,
    ).bind(
      `resubmit-${itemId}-${now}`, itemId, String(current.decision_authority),
      `${String(current.key)} is ready for another ruling`,
      "Updated evidence was resubmitted. Review the fresh Critic brief and exact evidence revision before deciding.", now,
    ).run();
    return json({ ok: true, status: "Resubmitted" });
  }

  return json({ error: "Unknown workflow transition." }, 400);
}

async function markNotificationRead(db: Database, user: User, notificationId: number) {
  const now = new Date().toISOString();
  await db.prepare("UPDATE notifications SET status = 'read', read_at = ? WHERE id = ?").bind(now, notificationId).run();
  return json({ ok: true, actor: user.id });
}

async function getBuzzStatus() {
  try {
    const [healthResponse, relayResponse] = await Promise.all([
      fetch(`${buzzRelayHttpUrl}/health`, { headers: { accept: "text/plain" }, signal: AbortSignal.timeout(5000) }),
      fetch(buzzRelayHttpUrl, { headers: { accept: "application/nostr+json, application/json" }, signal: AbortSignal.timeout(5000) }),
    ]);
    const health = healthResponse.ok ? (await healthResponse.text()).trim().toLowerCase() : "";
    const relay = relayResponse.ok ? await relayResponse.json() as { version?: string; limitation?: { auth_required?: boolean } } : null;
    return json({
      online: health === "ok" && relayResponse.ok,
      relay: buzzRelayWsUrl,
      version: relay?.version ?? null,
      auth_required: relay?.limitation?.auth_required ?? true,
      checked_at: new Date().toISOString(),
    });
  } catch {
    return json({ online: false, relay: buzzRelayWsUrl, version: null, auth_required: true, checked_at: new Date().toISOString() });
  }
}

export function pullRequestFromItem(item: Record<string, unknown>): PullRequestReference | null {
  for (const value of [item.evidence_url, item.github_url]) {
    if (!value) continue;
    try {
      const url = new URL(String(value));
      const parts = url.pathname.split("/").filter(Boolean);
      if (url.hostname !== "github.com" || parts[2] !== "pull" || !/^\d+$/.test(parts[3] ?? "")) continue;
      const repository = `${parts[0]}/${parts[1]}`;
      if (repository.toLowerCase() !== allowedGitHubRepository.toLowerCase()) return null;
      return { owner: parts[0], repo: parts[1], repository, number: Number(parts[3]) };
    } catch {
      continue;
    }
  }
  return null;
}

function githubHeaders(env: Env) {
  const headers: Record<string, string> = {
    accept: "application/vnd.github+json",
    "user-agent": "steer-flight-board",
    "x-github-api-version": "2022-11-28",
  };
  if (env.GITHUB_TOKEN) headers.authorization = `Bearer ${env.GITHUB_TOKEN}`;
  return headers;
}

async function githubJson<T>(env: Env, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: { ...githubHeaders(env), ...(init?.headers ?? {}) },
    signal: AbortSignal.timeout(10000),
  });
  const payload = await response.json().catch(() => ({})) as T & { message?: string };
  if (!response.ok) throw new Error(payload.message ?? `GitHub returned HTTP ${response.status}.`);
  return payload;
}

export function codeReviewBrief(
  pull: { draft: boolean; mergeable: boolean | null; additions: number; deletions: number; changed_files: number },
  files: GitHubFile[],
  checks: { all_green: boolean; failed: number; pending: number; total: number },
) {
  const findings: Finding[] = [];
  const dependencies: string[] = [];
  const impacts: string[] = [];
  const actions: string[] = [];
  const filenames = files.map((file) => file.filename.toLowerCase());
  const codeFiles = filenames.filter((name) => /\.(ts|tsx|js|jsx|py|go|rs|java|rb|php|cs)$/.test(name));
  const testFiles = filenames.filter((name) => /(^|\/)(test|tests|spec|specs)(\/|\.)|\.(test|spec)\./.test(name));
  const sensitiveFiles = files.filter((file) => /(auth|authori[sz]|secret|credential|token|worker\/api|migration|schema|workflow|deploy|railway|\.github\/workflows)/i.test(file.filename));

  if (pull.draft) findings.push({ severity: "blocker", title: "Pull request is still a draft", detail: "The author has not marked this revision ready for human review.", action: "Ask the author to mark the pull request ready before accepting or merging it." });
  if (checks.failed) findings.push({ severity: "blocker", title: `${checks.failed} required check${checks.failed === 1 ? " is" : "s are"} failing`, detail: "A failing verification signal makes this revision unsafe to merge.", action: "Open the failed check, correct the cause, and wait for a green rerun." });
  else if (checks.pending) findings.push({ severity: "blocker", title: `${checks.pending} check${checks.pending === 1 ? " is" : "s are"} still running`, detail: "The review cannot establish a verified revision until every reported check finishes.", action: "Wait for checks to finish, then refresh this review." });
  else if (!checks.total) findings.push({ severity: "blocker", title: "No verification checks were reported", detail: "The platform cannot confirm that this exact commit passed automated verification.", action: "Configure or run the required checks before accepting the revision." });
  if (pull.mergeable === false) findings.push({ severity: "blocker", title: "GitHub reports a merge conflict", detail: "The branch cannot be merged cleanly into its target.", action: "Resolve the conflict, push the updated branch, and review the new commit." });
  if (sensitiveFiles.length) {
    findings.push({ severity: "should-fix", title: "High-impact controls changed", detail: `${sensitiveFiles.slice(0, 4).map((file) => file.filename).join(", ")}${sensitiveFiles.length > 4 ? ` and ${sensitiveFiles.length - 4} more` : ""} affect runtime, authorization, data, delivery, or workflow behavior.`, action: "Inspect these files first and confirm authorization, rollback, migration, and operational effects." });
    dependencies.push("Named human review of runtime, authorization, data, and delivery-control changes.");
    impacts.push("A defect in these files could change who may act, how durable records are stored, or how the shared service is deployed.");
  }
  if (codeFiles.length && !testFiles.length) findings.push({ severity: "should-fix", title: "Code changed without an obvious test-file update", detail: "Existing tests may cover the change, but the file list does not make that relationship visible.", action: "Confirm the changed behavior is exercised by an existing test or add focused coverage." });
  if ((pull.additions + pull.deletions) > 800 || pull.changed_files > 30) findings.push({ severity: "should-fix", title: "Review scope is large", detail: `${pull.changed_files} files and ${pull.additions + pull.deletions} changed lines increase the chance of an overlooked dependency.`, action: "Review by concern and consider splitting unrelated changes before merge." });
  if (filenames.some((name) => /(package-lock|pnpm-lock|yarn\.lock|requirements|poetry\.lock|go\.sum)/.test(name))) {
    dependencies.push("Third-party dependency and supply-chain review.");
    impacts.push("Dependency updates can alter build output and introduce transitive risk without visible application-code changes.");
  }
  dependencies.push("The decision remains bound to the exact displayed head commit; any new push requires a fresh review.");
  if (!checks.all_green) impacts.push("Merge remains disabled until the exact displayed commit has a complete green check set.");

  const ranked = findings.sort((a, b) => ({ blocker: 0, "should-fix": 1, note: 2 }[a.severity] - { blocker: 0, "should-fix": 1, note: 2 }[b.severity])).slice(0, 4);
  for (const finding of ranked) actions.push(finding.action);
  if (!ranked.length) actions.push("Read the summary and changed files, confirm the change matches the work item, then record your acceptance.");
  const blockers = ranked.filter((finding) => finding.severity === "blocker").length;
  const concerns = ranked.filter((finding) => finding.severity === "should-fix").length;
  const recommendation = blockers ? "Do not merge yet" : concerns ? "Review highlighted concerns" : "Ready for human acceptance";
  const summary = blockers
    ? `${blockers} blocking condition${blockers === 1 ? "" : "s"} must be resolved before merge.`
    : concerns
      ? `${concerns} material concern${concerns === 1 ? "" : "s"} deserves explicit human judgment before acceptance.`
      : "Checks are green and no material risk signal was visible in the available pull-request metadata. Human inspection is still required.";
  const proposedChangeInstructions = ranked.filter((finding) => finding.severity !== "note").map((finding, index) => `${index + 1}. ${finding.title}\nRequired change: ${finding.action}\nReason: ${finding.detail}`).join("\n\n");
  return { recommendation, summary, findings: ranked, dependencies: [...new Set(dependencies)].slice(0, 5), impacts: [...new Set(impacts)].slice(0, 4), actions: [...new Set(actions)].slice(0, 5), proposed_change_instructions: proposedChangeInstructions };
}

async function loadCodeReview(db: Database, env: Env, itemId: number) {
  const item = await db.prepare("SELECT * FROM work_items WHERE id = ?").bind(itemId).first<Record<string, unknown>>();
  if (!item) return json({ error: "Work item not found." }, 404);
  const reference = pullRequestFromItem(item);
  if (!reference) return json({ error: `Attach a pull request from ${allowedGitHubRepository} to this work item's evidence or engineering record.` }, 409);
  const basePath = `/repos/${reference.owner}/${reference.repo}`;
  const pull = await githubJson<{
    number: number; title: string; body: string | null; html_url: string; state: string; draft: boolean; mergeable: boolean | null;
    mergeable_state?: string; additions: number; deletions: number; changed_files: number; commits: number; updated_at: string;
    user: { login: string }; base: { ref: string }; head: { ref: string; sha: string };
  }>(env, `${basePath}/pulls/${reference.number}`);
  const [files, checkRuns, combinedStatus, history] = await Promise.all([
    githubJson<GitHubFile[]>(env, `${basePath}/pulls/${reference.number}/files?per_page=100`),
    githubJson<{ check_runs: Array<{ name: string; status: string; conclusion: string | null; html_url: string | null }> }>(env, `${basePath}/commits/${pull.head.sha}/check-runs?per_page=100`).catch(() => ({ check_runs: [] })),
    githubJson<{ statuses: Array<{ context: string; state: string; target_url: string | null }> }>(env, `${basePath}/commits/${pull.head.sha}/status`).catch(() => ({ statuses: [] })),
    db.prepare("SELECT * FROM code_reviews WHERE item_id = ? AND repository = ? AND pull_number = ? ORDER BY created_at DESC LIMIT 20").bind(itemId, reference.repository, reference.number).all(),
  ]);
  const checks: GitHubCheck[] = [
    ...checkRuns.check_runs.map((check) => ({ name: check.name, status: check.status, conclusion: check.conclusion, url: check.html_url })),
    ...combinedStatus.statuses.map((status) => ({ name: status.context, status: status.state === "pending" ? "in_progress" : "completed", conclusion: status.state === "success" ? "success" : status.state === "pending" ? null : status.state, url: status.target_url })),
  ];
  const uniqueChecks = [...new Map(checks.map((check) => [check.name, check])).values()];
  const failureConclusions = new Set(["failure", "cancelled", "timed_out", "action_required", "startup_failure", "stale", "error"]);
  const failed = uniqueChecks.filter((check) => check.conclusion && failureConclusions.has(check.conclusion)).length;
  const pending = uniqueChecks.filter((check) => check.status !== "completed" || check.conclusion === null).length;
  const checkSummary = { total: uniqueChecks.length, failed, pending, successful: uniqueChecks.filter((check) => ["success", "neutral", "skipped"].includes(check.conclusion ?? "")).length, all_green: uniqueChecks.length > 0 && failed === 0 && pending === 0 };
  const latest = (history.results ?? [])[0] as Record<string, unknown> | undefined;
  const acceptedHead = latest?.head_sha === pull.head.sha && latest?.action === "ACCEPT";
  const canMerge = pull.state === "open" && !pull.draft && pull.mergeable !== false && checkSummary.all_green && acceptedHead;
  return json({
    connection: { read: true, write: Boolean(env.GITHUB_TOKEN), repository: reference.repository, message: env.GITHUB_TOKEN ? "GitHub actions are connected." : "Review is available. A repository credential is still required for GitHub write and merge actions." },
    pull_request: { number: pull.number, title: pull.title, body: pull.body, url: pull.html_url, state: pull.state, draft: pull.draft, mergeable: pull.mergeable, mergeable_state: pull.mergeable_state ?? "unknown", author: pull.user.login, base_ref: pull.base.ref, head_ref: pull.head.ref, head_sha: pull.head.sha, additions: pull.additions, deletions: pull.deletions, changed_files: pull.changed_files, commits: pull.commits, updated_at: pull.updated_at },
    checks: { ...checkSummary, items: uniqueChecks },
    files: files.map((file) => ({ ...file, patch: file.patch?.slice(0, 12000) ?? null })),
    ai_review: codeReviewBrief(pull, files, checkSummary),
    history: history.results ?? [],
    controls: { accepted_head: acceptedHead, can_merge: canMerge, merge_confirmation: `MERGE ${String(item.key)}`, exact_head_required: true },
  });
}

async function deliverGitHubReview(env: Env, reference: PullRequestReference, action: "ACCEPT" | "REQUEST_CHANGES", headSha: string, reasoning: string) {
  const reviewEvent = action === "ACCEPT" ? "APPROVE" : "REQUEST_CHANGES";
  const path = `/repos/${reference.owner}/${reference.repo}/pulls/${reference.number}/reviews`;
  try {
    const review = await githubJson<{ html_url?: string }>(env, path, { method: "POST", body: JSON.stringify({ body: reasoning, event: reviewEvent, commit_id: headSha }) });
    return { delivery: "formal_review", url: review.html_url ?? `https://github.com/${reference.repository}/pull/${reference.number}` };
  } catch (error) {
    const heading = action === "ACCEPT" ? "STEER human acceptance" : "STEER changes requested";
    const comment = await githubJson<{ html_url?: string }>(env, `/repos/${reference.owner}/${reference.repo}/issues/${reference.number}/comments`, { method: "POST", body: JSON.stringify({ body: `## ${heading}\n\n${reasoning}\n\nReviewed in STEER Work Management against commit \`${headSha}\`.` }) });
    return { delivery: `comment_fallback:${error instanceof Error ? error.message : "formal review unavailable"}`, url: comment.html_url ?? `https://github.com/${reference.repository}/pull/${reference.number}` };
  }
}

async function actOnCodeReview(request: Request, db: Database, env: Env, user: User, itemId: number) {
  if (!env.GITHUB_TOKEN) return json({ error: "GitHub write actions are not connected yet. Add the repository credential to the hosted STEER environment first." }, 503);
  const item = await db.prepare("SELECT * FROM work_items WHERE id = ?").bind(itemId).first<Record<string, unknown>>();
  if (!item) return json({ error: "Work item not found." }, 404);
  const reference = pullRequestFromItem(item);
  if (!reference) return json({ error: "This work item is not linked to an approved pull request." }, 409);
  const member = await db.prepare("SELECT kind, role FROM members WHERE id = ?").bind(user.id).first<{ kind: string; role: string }>();
  if (member?.kind !== "human") return json({ error: "Only an authenticated human member may review or merge code." }, 403);
  const body = await request.json() as Record<string, unknown>;
  const action = String(body.action ?? "");
  const reasoning = String(body.reasoning ?? "").trim();
  const suppliedHead = String(body.headSha ?? "");
  if (!['ACCEPT', 'REQUEST_CHANGES', 'MERGE'].includes(action)) return json({ error: "Choose accept, request changes, or merge." }, 400);
  if (reasoning.length < 12) return json({ error: "Add concise reasoning so the engineering record preserves why." }, 400);
  const basePath = `/repos/${reference.owner}/${reference.repo}`;
  const pull = await githubJson<{ state: string; draft: boolean; mergeable: boolean | null; head: { sha: string } }>(env, `${basePath}/pulls/${reference.number}`);
  if (pull.head.sha !== suppliedHead) return json({ error: "The pull request changed after you opened it. Refresh and review the new commit before acting." }, 409);
  if (pull.state !== "open") return json({ error: "This pull request is no longer open." }, 409);
  const now = new Date().toISOString();
  let delivery: { delivery: string; url: string };
  if (action === "MERGE") {
    const allowedRole = ["Product Lead", "Tech Lead", "Platform", "Ops Lead"].some((role) => member.role.includes(role));
    if (!allowedRole) return json({ error: "Your STEER role may review code but is not authorized to merge shared work." }, 403);
    if (String(body.confirmation ?? "") !== `MERGE ${String(item.key)}`) return json({ error: `Type MERGE ${String(item.key)} to confirm this consequential action.` }, 400);
    const latest = await db.prepare("SELECT action, head_sha FROM code_reviews WHERE item_id = ? AND repository = ? AND pull_number = ? ORDER BY created_at DESC LIMIT 1").bind(itemId, reference.repository, reference.number).first<{ action: string; head_sha: string }>();
    if (latest?.action !== "ACCEPT" || latest.head_sha !== pull.head.sha) return json({ error: "Record human acceptance for this exact commit before merging it." }, 409);
    const status = await githubJson<{ statuses: Array<{ state: string }> }>(env, `${basePath}/commits/${pull.head.sha}/status`).catch(() => ({ statuses: [] }));
    const runs = await githubJson<{ check_runs: Array<{ status: string; conclusion: string | null }> }>(env, `${basePath}/commits/${pull.head.sha}/check-runs?per_page=100`).catch(() => ({ check_runs: [] }));
    const reported = status.statuses.length + runs.check_runs.length;
    const green = reported > 0 && status.statuses.every((check) => check.state === "success") && runs.check_runs.every((check) => check.status === "completed" && ["success", "neutral", "skipped"].includes(check.conclusion ?? ""));
    if (!green) return json({ error: "All checks for this exact commit must be complete and green before merge." }, 409);
    if (pull.draft || pull.mergeable === false) return json({ error: "The pull request is draft or not currently mergeable." }, 409);
    const merged = await githubJson<{ merged: boolean; message: string; sha?: string }>(env, `${basePath}/pulls/${reference.number}/merge`, { method: "PUT", body: JSON.stringify({ sha: pull.head.sha, merge_method: "squash", commit_title: `${String(item.key)}: ${String(item.title)}` }) });
    if (!merged.merged) return json({ error: merged.message || "GitHub did not merge the pull request." }, 409);
    delivery = { delivery: "merged", url: `https://github.com/${reference.repository}/pull/${reference.number}` };
  } else {
    delivery = await deliverGitHubReview(env, reference, action as "ACCEPT" | "REQUEST_CHANGES", pull.head.sha, reasoning);
  }
  await db.batch([
    db.prepare(`INSERT INTO code_reviews (item_id, repository, pull_number, head_sha, action, reasoning, actor_id, actor_email, github_delivery, github_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(itemId, reference.repository, reference.number, pull.head.sha, action, reasoning, user.id, user.email, delivery.delivery, delivery.url, now),
    db.prepare("INSERT INTO activity (item_id, actor_id, action, detail, created_at) VALUES (?, ?, 'code_review', ?, ?)")
      .bind(itemId, user.id, `PR #${reference.number}: ${action.replace('_', ' ')} for commit ${pull.head.sha.slice(0, 12)} — ${reasoning}`, now),
  ]);
  if (action === "REQUEST_CHANGES") {
    await db.prepare("UPDATE work_items SET state = 'blocked', next_action = ?, rework_instructions = ?, blocked_since = ?, updated_at = ? WHERE id = ?")
      .bind(firstRequiredChange(reasoning), reasoning, now, now, itemId).run();
    if (item.assignee_id) {
      const recipient = await db.prepare("SELECT role FROM members WHERE id = ?").bind(item.assignee_id).first<{ role: string }>();
      await db.prepare(`INSERT OR IGNORE INTO notifications (dedupe_key, item_id, member_id, recipient_role, kind, title, body, channel, status, created_at) VALUES (?, ?, ?, ?, 'code_changes_requested', ?, ?, 'Block Buzz', 'queued', ?)`)
        .bind(`code-review-${itemId}-${pull.head.sha}-changes`, itemId, item.assignee_id, recipient?.role ?? "Work owner", `${String(item.key)} code changes requested`, reasoning, now).run();
    }
  } else if (action === "ACCEPT") {
    await db.prepare("UPDATE work_items SET state = 'active', next_action = 'Human acceptance is recorded for the exact pull-request commit. Complete the separate merge confirmation when ready.', rework_instructions = NULL, blocked_since = NULL, updated_at = ? WHERE id = ?").bind(now, itemId).run();
  } else if (action === "MERGE") {
    await db.prepare("UPDATE work_items SET next_action = 'Pull request merged. Verify the deployment or operational outcome, then close this work item.', updated_at = ? WHERE id = ?").bind(now, itemId).run();
  }
  return json({ ok: true, action, delivery: delivery.delivery, url: delivery.url }, 201);
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
    if (request.method === "GET" && url.pathname === "/api/buzz-status") return getBuzzStatus();
    if (request.method === "GET" && url.pathname === "/api/bootstrap") return json(await bootstrap(env.DB, user));
    if (request.method === "POST" && url.pathname === "/api/items") return createItem(request, env.DB, user);
    const itemMatch = url.pathname.match(/^\/api\/items\/(\d+)$/);
    if (request.method === "PATCH" && itemMatch) return updateItem(request, env.DB, user, Number(itemMatch[1]));
    const reviewMatch = url.pathname.match(/^\/api\/items\/(\d+)\/reviews$/);
    if (request.method === "POST" && reviewMatch) return runCriticReview(env.DB, user, Number(reviewMatch[1]));
    const dispatchMatch = url.pathname.match(/^\/api\/items\/(\d+)\/dispatch$/);
    if (request.method === "POST" && dispatchMatch) return authorizeAgentDispatch(env.DB, user, Number(dispatchMatch[1]));
    const codeReviewMatch = url.pathname.match(/^\/api\/items\/(\d+)\/code-review$/);
    if (request.method === "GET" && codeReviewMatch) return loadCodeReview(env.DB, env, Number(codeReviewMatch[1]));
    if (request.method === "POST" && codeReviewMatch) return actOnCodeReview(request, env.DB, env, user, Number(codeReviewMatch[1]));
    const workflowMatch = url.pathname.match(/^\/api\/items\/(\d+)\/workflow$/);
    if (request.method === "POST" && workflowMatch) return transitionItem(request, env.DB, user, Number(workflowMatch[1]));
    const decisionMatch = url.pathname.match(/^\/api\/items\/(\d+)\/decisions$/);
    if (request.method === "POST" && decisionMatch) return decide(request, env.DB, user, Number(decisionMatch[1]));
    const notificationMatch = url.pathname.match(/^\/api\/notifications\/(\d+)\/read$/);
    if (request.method === "POST" && notificationMatch) return markNotificationRead(env.DB, user, Number(notificationMatch[1]));
    return json({ error: "Not found." }, 404);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected error." }, 500);
  }
}
