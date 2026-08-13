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
  const [items, members, activity, decisions] = await Promise.all([
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
  ]);
  return { user, items: items.results ?? [], members: members.results ?? [], activity: activity.results ?? [], decisions: decisions.results ?? [] };
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
    const decisionMatch = url.pathname.match(/^\/api\/items\/(\d+)\/decisions$/);
    if (request.method === "POST" && decisionMatch) return decide(request, env.DB, user, Number(decisionMatch[1]));
    return json({ error: "Not found." }, 404);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected error." }, 500);
  }
}
