import { evaluateAgentDispatch } from "./authorization";
import {
  buildPullForecast,
  buildServiceLevelDistributions,
  completionVarianceMinutes,
  materialForecastChange,
  serializeSection,
  WORK_TYPES,
  workEconomicsFromRow,
  type DeliveryForecast,
} from "../lib/work-economics";
import { acceptedValueHypothesisReady, humanAcceptanceState, validateAndNormalizeWorkEconomics, type WorkEconomicsSection } from "../lib/work-economics-validation";
import { buildDispatchIdentity, exactGitEvidence, STEER_HANDOFF_ROUTE_KEY, validateDispatchRoute, type DispatchRoute } from "../lib/dispatch-control";
import { canonicalJson, createSignedDispatchEvent, dispatchPublicKey, sha256Hex, signSchnorrBinding, type DispatchState } from "../lib/dispatch-lifecycle";
import { isStr028CaseId } from "../lib/str028-manifest";
import { buildDecisionEvent, createDecisionIssuerEnvelope, createUuidV7, decisionDigest, decisionFinalizationError, decisionIssuerPublicKey, safeDecisionExport, signAuthorityPayload, validateDecisionIntent, verifyAuthorityPayload, verifyDecisionIssuerEnvelope, type DecisionIntentPayload, type PreparedDecisionPackage } from "../lib/decision-package";
import { canonicalRiskInputs, classifyRiskCodes, effectiveNotBefore, readinessDrift, RELEASE_READINESS_POLICY_V1, releaseReadinessAuthority, releaseReadinessDigest, readinessStatus, requiredRolesFor, validateSatisfactionPath, type ReadinessDrift, type ReleaseReadinessSnapshot, type SatisfactionPath } from "../lib/release-readiness";
import { buildReviewIdentity, createSignedReviewEvent, reviewManifestSha256, validateReviewAssignmentPayload, verifyReviewerBinding, type ReviewAssignmentPayload } from "../lib/review-lifecycle";
import { classifyVerificationFixture, isIssue74VerificationMember } from "../lib/verification-fixtures";
import { buildInitialQueuedEvent, ensureDispatchServiceSigner, handleDispatchServiceApi, type DispatchServiceEnv } from "./dispatch";

type D1Result<T = Record<string, unknown>> = {
  results?: T[];
  meta?: { last_row_id?: number; changes?: number };
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

type Env = {
  DB: Database;
  GITHUB_TOKEN?: string;
  DISPATCH_ALLOW_TEST_PRIVACY_POLICY?: string;
  REVIEW_SERVICE_PRIVATE_KEY?: string;
  REVIEW_SERVICE_KEY_ID?: string;
  REVIEW_SERVICE_KEY_VERSION?: string;
  REVIEW_SERVICE_TOKEN?: string;
  DECISION_SERVICE_PRIVATE_KEY?: string;
  DECISION_SERVICE_KEY_ID?: string;
  DECISION_SERVICE_KEY_VERSION?: string;
  DECISION_SERVICE_TOKEN?: string;
  STEER_DEPLOYMENT_ENV?: string;
  STEER_SOURCE_REVISION?: string;
  STEER_BUILD_SHA256?: string;
  STEER_MIGRATION_SET_SHA256?: string;
  STEER_RUNTIME_POLICY_SHA256?: string;
} & DispatchServiceEnv;

type User = { id: string; email: string | null; name: string };

const phases = ["Sense", "Frame", "Engineer", "Evaluate", "Release", "Observe", "Learn"];
const priorities = ["Now", "Next", "Later"];
const workflows = ["STEER", "Control", "Setup / excluded", "Unassigned"];
const states = ["queued", "active", "blocked", "complete"];
const decisionStatuses = ["Waiting", "Needed now", "Changes requested", "Rework", "Resubmitted", "Decided", "Not required"];
const buzzRelayHttpUrl = "https://blockbuzzmain-production-5bcb.up.railway.app";
const buzzRelayWsUrl = "wss://blockbuzzmain-production-5bcb.up.railway.app";
const allowedGitHubRepository = "idrissenayat/federal-bd-platform";
const gateTwoExamNextAction = "Design a falsifiable Gate 2 Exam from the approved Intent Brief, attach the exact Exam revision, run a fresh Critic review, and present Gate 2 to the Interim Tech Lead. Do not implement before Gate 2 passes.";
const dispatchPrivacyInventoryRevision = "4dd787ca1eb9b9d8a841bb48cffca9502eaa8c14";
const dispatchPrivacyInventoryUrl = `https://github.com/idrissenayat/federal-bd-platform/blob/${dispatchPrivacyInventoryRevision}/steer/evidence/0028-dispatch-data-inventory.md`;
const dispatchPrivacyInventorySha256 = "c97bab72124018569f7be917a36b98cce9a064f8795c83d4ae2790bd0844919d";
const dispatchPrivacyRulingRevision = "d9dbe0b70e812f680ae23fad2ce4ffafc6e65229";
const dispatchPrivacyRulingUrl = `https://github.com/idrissenayat/federal-bd-platform/blob/${dispatchPrivacyRulingRevision}/steer/evidence/0028-gate-3-case-evidence.md`;
const dispatchPrivacyRulingSha256 = "12522b22dca4ade812288a2bf47cb6c71405e89275a0db234d20ed8decafe83d";
const dispatchPrivacyActivationReason = "STR-028_PROVIDER_RECOVERY_RULING_APPROVED";
const readinessPolicyRulingRevision = "1b8ad059a8ee2a4a94c7828bc617d4909a52813c";
const readinessPolicyRulingUrl = `https://github.com/idrissenayat/federal-bd-platform/blob/${readinessPolicyRulingRevision}/steer/exams/0074-risk-based-gate3-readiness.md`;
const readinessPolicyRulingSha256 = "a407773a621ee75421201a6bd5673024eee4d9f3d8f929cf50bf1740850709c6";
const readinessPolicyActivationReason = "ISSUE_74_GATE_2_POLICY_APPROVED";
const readinessBriefRevision = "e1644ff3421800423e90980929fa4eac3c64f1e1";
const readinessBriefPath = "steer/briefs/0074-risk-based-gate3-readiness.md";
const readinessBriefSha256 = "fbd22ba38942a4098b727d3c88ebde92b336f1879a5b73ef4cb9c9bc6d0ac6e5";
const governedEvidencePath = /^steer\/(?:briefs|exams)\/[A-Za-z0-9][A-Za-z0-9._/-]{1,198}\.md$/;

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

type MemberContext = { id: string; kind: string; role: string; status: string; pod_id: string | null };

async function memberContext(db: Database, user: User) {
  return db.prepare("SELECT id, kind, role, status, pod_id FROM members WHERE id = ?").bind(user.id).first<MemberContext>();
}

function humanDecisionAuthority(member: MemberContext | null, gate: string): member is MemberContext {
  if (!member || member.kind !== "human" || member.status !== "available") return false;
  return (gate === "Gate 1 pending" && member.role.includes("Product Lead")) ||
    (gate === "Gate 2 pending" && member.role.includes("Tech Lead")) ||
    (gate === "Gate 3 pending" && member.role.includes("Product Lead") && member.role.includes("Tech Lead"));
}

async function scopedItem(db: Database, user: User, itemId: number) {
  return db.prepare(`SELECT w.* FROM work_items w JOIN members actor ON actor.id = ? AND actor.pod_id = w.pod_id WHERE w.id = ?`)
    .bind(user.id, itemId).first<Record<string, unknown>>();
}

async function auditItemControlDenial(db: Database, user: User, itemId: number, route: string) {
  const existing = await db.prepare("SELECT id FROM work_items WHERE id = ?").bind(itemId).first<{ id: number }>();
  if (!existing) return;
  const member = await memberContext(db, user);
  await db.prepare(`INSERT INTO work_economics_events
    (item_id, section, action, actor_id, actor_role, previous_json, replacement_json, reason, created_at)
    VALUES (?, 'itemControl', 'denied', ?, ?, NULL, NULL, ?, ?)`)
    .bind(itemId, user.id, member?.role ?? "Unknown", `Denied cross-POD or unauthorized ${route} request.`, new Date().toISOString()).run();
}

async function scopedItemOrDenied(db: Database, user: User, itemId: number, route: string) {
  const item = await scopedItem(db, user, itemId);
  if (!item) await auditItemControlDenial(db, user, itemId, route);
  return item;
}

function safeEconomicsFromRow(row: Record<string, unknown>, now: string) {
  const columns: Array<[WorkEconomicsSection, string]> = [
    ["valueHypothesis", "value_hypothesis_json"], ["deliveryForecast", "delivery_forecast_json"],
    ["actualEconomics", "actual_economics_json"], ["realizedOutcome", "realized_outcome_json"],
  ];
  const safeRow = { ...row };
  for (const [section, column] of columns) {
    if (!safeRow[column]) continue;
    try {
      const parsed = JSON.parse(String(safeRow[column]));
      if (validateAndNormalizeWorkEconomics(section, parsed).error) safeRow[column] = null;
    } catch {
      safeRow[column] = null;
    }
  }
  return workEconomicsFromRow(safeRow, now);
}

function safeEconomicsEvent(event: Record<string, unknown>) {
  const section = String(event.section ?? "") as WorkEconomicsSection;
  const sanitize = (raw: unknown) => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(String(raw));
      return section in economicsColumns && !validateAndNormalizeWorkEconomics(section, parsed).error
        ? JSON.stringify(parsed)
        : JSON.stringify({ state: "unavailable", reason: "Legacy record failed the current privacy/schema boundary." });
    } catch {
      return JSON.stringify({ state: "unavailable", reason: "Record could not be parsed safely." });
    }
  };
  return { ...event, previous_json: sanitize(event.previous_json), replacement_json: sanitize(event.replacement_json) };
}

async function authoritativeItemSnapshot(db: Database, env: Env, user: User, itemId: number) {
  const generatedAt = new Date().toISOString();
  const [item, activity, economicsEvents] = await Promise.all([
    db.prepare(
      `SELECT w.*, m.display_name AS assignee_name, m.kind AS assignee_kind,
         (SELECT o.intent_id FROM dispatch_outbox o JOIN dispatch_receipts r ON r.intent_id = o.intent_id
          WHERE r.item_id = w.id ORDER BY r.created_at DESC LIMIT 1) AS dispatch_intent_id,
         (SELECT o.current_state FROM dispatch_outbox o JOIN dispatch_receipts r ON r.intent_id = o.intent_id
          WHERE r.item_id = w.id ORDER BY r.created_at DESC LIMIT 1) AS dispatch_state,
         (SELECT o.current_event_version FROM dispatch_outbox o JOIN dispatch_receipts r ON r.intent_id = o.intent_id
          WHERE r.item_id = w.id ORDER BY r.created_at DESC LIMIT 1) AS dispatch_event_version,
         (SELECT r.authorization_revision FROM dispatch_receipts r
          WHERE r.item_id = w.id ORDER BY r.created_at DESC LIMIT 1) AS dispatch_authorization_revision,
         (SELECT o.updated_at FROM dispatch_outbox o JOIN dispatch_receipts r ON r.intent_id = o.intent_id
          WHERE r.item_id = w.id ORDER BY r.created_at DESC LIMIT 1) AS dispatch_updated_at,
         (SELECT a.created_at FROM activity a
          WHERE a.item_id = w.id AND a.action = 'updated' AND a.detail = 'state → complete'
          ORDER BY a.created_at DESC, a.id DESC LIMIT 1) AS closed_at
       FROM work_items w
       JOIN members actor ON actor.id = ? AND actor.pod_id = w.pod_id
       LEFT JOIN members m ON m.id = w.assignee_id
       WHERE w.id = ?`,
    ).bind(user.id, itemId).first<Record<string, unknown>>(),
    db.prepare(
      `SELECT a.*, w.key AS item_key, w.title AS item_title, m.display_name AS actor_name
       FROM activity a JOIN work_items w ON w.id = a.item_id
       LEFT JOIN members m ON m.id = a.actor_id
       WHERE a.item_id = ? AND w.pod_id = (SELECT pod_id FROM members WHERE id = ?)
       ORDER BY a.created_at DESC, a.id DESC LIMIT 20`,
    ).bind(itemId, user.id).all<Record<string, unknown>>(),
    db.prepare(
      `SELECT e.*, w.key AS item_key, w.title AS item_title, m.display_name AS actor_name
       FROM work_economics_events e JOIN work_items w ON w.id = e.item_id
       LEFT JOIN members m ON m.id = e.actor_id
       WHERE e.item_id = ? AND w.pod_id = (SELECT pod_id FROM members WHERE id = ?)
       ORDER BY e.created_at DESC, e.id DESC LIMIT 20`,
    ).bind(itemId, user.id).all<Record<string, unknown>>(),
  ]);
  if (!item) return null;
  return {
    generated_at: generatedAt,
    item: {
      ...item,
      work_economics: safeEconomicsFromRow(item, generatedAt),
      dispatch_authorization: evaluateAgentDispatch(item),
      verification_classification: classifyVerificationFixture(item, String(env.STEER_DEPLOYMENT_ENV ?? "production")),
    },
    activity: activity.results ?? [],
    work_economics_events: (economicsEvents.results ?? []).map((event) => safeEconomicsEvent(event)),
  };
}

export function normalizeEngineeringRecordUrl(input: unknown) {
  const raw = String(input ?? "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const parts = url.pathname.split("/").filter(Boolean);
    if (
      url.protocol !== "https:" ||
      url.hostname.toLowerCase() !== "github.com" ||
      `${parts[0]}/${parts[1]}`.toLowerCase() !== allowedGitHubRepository.toLowerCase() ||
      !["issues", "pull"].includes(parts[2]) ||
      !/^\d+$/.test(parts[3] ?? "") ||
      parts.length !== 4
    ) return null;
    return `https://github.com/${allowedGitHubRepository}/${parts[2]}/${parts[3]}`;
  } catch {
    return null;
  }
}

export function engineeringRecordFromDescription(description: unknown) {
  const text = String(description ?? "");
  const linked = text.match(/https:\/\/github\.com\/idrissenayat\/federal-bd-platform\/(?:issues|pull)\/\d+\/?/i)?.[0];
  if (linked) return normalizeEngineeringRecordUrl(linked);
  const named = text.match(/\bGitHub\s+(issue|PR|pull request)\s*#\s*(\d+)\b/i);
  if (!named) return null;
  const kind = named[1].toLowerCase() === "issue" ? "issues" : "pull";
  return `https://github.com/${allowedGitHubRepository}/${kind}/${named[2]}`;
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
      work_type text DEFAULT 'Unclassified' NOT NULL,
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
    db.prepare(`CREATE TABLE IF NOT EXISTS work_economics_events (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      item_id integer NOT NULL,
      section text NOT NULL,
      action text NOT NULL,
      actor_id text NOT NULL,
      actor_role text NOT NULL,
      previous_json text,
      replacement_json text,
      reason text NOT NULL,
      created_at text NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_work_economics_item_created ON work_economics_events (item_id, created_at)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS work_economics_human_facts (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      item_id integer NOT NULL,
      record_kind text NOT NULL,
      role text NOT NULL,
      min_minutes integer,
      max_minutes integer,
      active_minutes integer,
      recorded_at text NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_work_economics_human_item_kind ON work_economics_human_facts (item_id, record_kind)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS work_economics_agent_facts (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      item_id integer NOT NULL,
      record_kind text NOT NULL,
      event_id text NOT NULL,
      provider text NOT NULL,
      model text,
      attempts integer NOT NULL,
      input_tokens integer,
      output_tokens integer,
      min_cost_micros integer,
      max_cost_micros integer,
      metered_cost_micros integer,
      currency text NOT NULL,
      execution_seconds integer,
      source text NOT NULL,
      completeness text NOT NULL,
      ingestion_state text NOT NULL,
      observed_at text NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_work_economics_agent_item_kind ON work_economics_agent_facts (item_id, record_kind)"),
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS uq_work_economics_agent_item_kind_event ON work_economics_agent_facts (item_id, record_kind, event_id)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS work_economics_delivery_events (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL, item_id integer NOT NULL, event_kind text NOT NULL,
      originating_phase text, severity text, minutes integer, count integer, reason text NOT NULL,
      occurred_at text NOT NULL, recorded_at text NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_work_economics_delivery_event_item_kind ON work_economics_delivery_events (item_id, event_kind)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS work_economics_duration_facts (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      item_id integer NOT NULL,
      fact_kind text NOT NULL,
      minutes integer NOT NULL,
      source text NOT NULL,
      recorded_at text NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_work_economics_duration_item_kind ON work_economics_duration_facts (item_id, fact_kind)"),
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
      decision_intent_id text,
      created_at text NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_decisions_item_created ON decisions (item_id, created_at)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS decision_packages (
      package_id text PRIMARY KEY NOT NULL, item_id integer NOT NULL, pod_id text NOT NULL,
      decision_kind text NOT NULL, target_json text NOT NULL, package_json text NOT NULL,
      package_sha256 text NOT NULL, evidence_set_sha256 text NOT NULL,
      preparation_principal text NOT NULL, created_at text NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_decision_packages_item_created ON decision_packages (item_id, created_at)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS decision_intents (
      intent_id text PRIMARY KEY NOT NULL, receipt_id text NOT NULL UNIQUE, package_id text NOT NULL,
      item_id integer NOT NULL, pod_id text NOT NULL, idempotency_key text NOT NULL,
      intent_json text NOT NULL, intent_sha256 text NOT NULL, current_state text NOT NULL,
      current_sequence integer NOT NULL, current_event_sha256 text NOT NULL,
      required_countersignatures integer NOT NULL DEFAULT 1, accepted_countersignatures integer NOT NULL DEFAULT 0,
      submitter_id text NOT NULL, submitter_role text NOT NULL, decision_session_id text NOT NULL UNIQUE,
      created_at text NOT NULL, updated_at text NOT NULL,
      effective_not_before text NOT NULL, signer_policy_version integer NOT NULL,
      readiness_snapshot_sha256 text NOT NULL DEFAULT '',
      UNIQUE(pod_id, idempotency_key)
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_decision_intents_item_created ON decision_intents (item_id, created_at)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS decision_sessions (
      session_id text PRIMARY KEY NOT NULL, pod_id text NOT NULL, principal_id text NOT NULL,
      item_id integer NOT NULL, decision_kind text NOT NULL, reason text NOT NULL,
      started_at text NOT NULL, expires_at text NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_decision_sessions_principal_started ON decision_sessions (principal_id, started_at)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS decision_signer_policies (
      pod_id text NOT NULL, policy_version integer NOT NULL, operating_mode text NOT NULL,
      required_countersignatures integer NOT NULL, cooling_hours integer NOT NULL,
      status text NOT NULL, activated_by text NOT NULL, activation_reason text NOT NULL,
      ruling_url text NOT NULL, ruling_sha256 text NOT NULL, created_at text NOT NULL, UNIQUE(pod_id, policy_version)
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_decision_signer_policies_active ON decision_signer_policies (pod_id, status, policy_version)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS decision_readiness_policies (
      pod_id text NOT NULL, policy_version integer NOT NULL, policy_json text NOT NULL,
      policy_sha256 text NOT NULL, status text NOT NULL, activated_by text NOT NULL,
      activation_reason text NOT NULL, ruling_url text NOT NULL, ruling_sha256 text NOT NULL,
      created_at text NOT NULL, UNIQUE(pod_id, policy_version)
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_decision_readiness_policy_active ON decision_readiness_policies (pod_id, status, policy_version)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS staging_verification_receipts (
      receipt_id text PRIMARY KEY NOT NULL, item_id integer NOT NULL, pod_id text NOT NULL,
      receipt_json text NOT NULL, receipt_sha256 text NOT NULL UNIQUE,
      source_revision text NOT NULL, build_sha256 text NOT NULL, migration_set_sha256 text NOT NULL,
      runtime_policy_sha256 text NOT NULL, completed_at text NOT NULL,
      key_id text NOT NULL, key_version integer NOT NULL, service_signature text NOT NULL, created_at text NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_staging_verification_receipts_item_created ON staging_verification_receipts (item_id, created_at)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS staging_readiness_case_results (
      run_id text NOT NULL, case_id text NOT NULL, request_json text NOT NULL,
      request_sha256 text NOT NULL, response_json text NOT NULL, response_sha256 text NOT NULL,
      service_signature text NOT NULL, created_at text NOT NULL,
      PRIMARY KEY(run_id, case_id)
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_staging_readiness_case_results_created ON staging_readiness_case_results (run_id, created_at)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS decision_readiness_snapshots (
      snapshot_id text PRIMARY KEY NOT NULL, item_id integer NOT NULL, pod_id text NOT NULL,
      snapshot_json text NOT NULL, snapshot_sha256 text NOT NULL UNIQUE, evidence_set_sha256 text NOT NULL,
      critic_review_id integer NOT NULL, tier text NOT NULL, satisfaction_path text NOT NULL,
      effective_not_before text NOT NULL, current_state text NOT NULL, invalidation_reason text,
      predecessor_snapshot_sha256 text, created_by text NOT NULL, created_at text NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_decision_readiness_snapshots_item_created ON decision_readiness_snapshots (item_id, created_at)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_decision_readiness_snapshots_pod_state ON decision_readiness_snapshots (pod_id, current_state)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS decision_readiness_events (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL, snapshot_id text NOT NULL,
      event_type text NOT NULL, event_json text NOT NULL, event_sha256 text NOT NULL UNIQUE,
      actor_id text NOT NULL, created_at text NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_decision_readiness_events_snapshot_created ON decision_readiness_events (snapshot_id, created_at)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS decision_readiness_countersignatures (
      snapshot_id text NOT NULL, member_id text NOT NULL, role text NOT NULL,
      proof_json text NOT NULL, proof_sha256 text NOT NULL, status text NOT NULL, created_at text NOT NULL,
      UNIQUE(snapshot_id, member_id)
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_decision_readiness_countersignatures_snapshot ON decision_readiness_countersignatures (snapshot_id, status)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS decision_proof_events (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL, intent_id text NOT NULL, sequence integer NOT NULL,
      event_type text NOT NULL, resulting_state text NOT NULL, previous_event_sha256 text,
      event_json text NOT NULL, event_sha256 text NOT NULL, actor_id text NOT NULL, created_at text NOT NULL,
      UNIQUE(intent_id, sequence)
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_decision_proof_events_intent_created ON decision_proof_events (intent_id, created_at)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS decision_issuer_signers (
      pod_id text NOT NULL, key_id text NOT NULL, key_version integer NOT NULL,
      public_key text NOT NULL, status text NOT NULL, activated_by text NOT NULL,
      activation_reason text NOT NULL, created_at text NOT NULL,
      UNIQUE(pod_id, key_id, key_version)
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_decision_issuer_signers_active ON decision_issuer_signers (pod_id, status)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS decision_issuer_envelopes (
      intent_id text PRIMARY KEY NOT NULL, key_id text NOT NULL, key_version integer NOT NULL,
      envelope_json text NOT NULL, envelope_sha256 text NOT NULL, created_at text NOT NULL
    )`),
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
    db.prepare(`CREATE TABLE IF NOT EXISTS review_assignments (
      assignment_id text PRIMARY KEY NOT NULL, idempotency_key text NOT NULL UNIQUE,
      item_id integer NOT NULL, pod_id text NOT NULL, review_stage text NOT NULL,
      reviewer_member_id text NOT NULL, primary_claim_lineage_id text NOT NULL,
      item_revision text NOT NULL, target_manifest_sha256 text NOT NULL,
      assignment_json text NOT NULL, current_state text NOT NULL,
      current_event_version integer NOT NULL, current_event_sha256 text NOT NULL,
      authorizing_actor_id text NOT NULL, authorizing_event_id text NOT NULL,
      created_at text NOT NULL, terminal_at text, delete_after text
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_review_assignments_item_created ON review_assignments (item_id, created_at)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS review_events (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL, assignment_id text NOT NULL,
      event_version integer NOT NULL, expected_event_version integer NOT NULL,
      event_type text NOT NULL, payload_json text NOT NULL, previous_event_sha256 text,
      event_sha256 text NOT NULL, service_key_id text NOT NULL,
      service_key_version integer NOT NULL, service_signature text NOT NULL,
      reviewer_key_id text, reviewer_key_version integer, reviewer_signature text,
      actor_id text NOT NULL, created_at text NOT NULL,
      UNIQUE(assignment_id, event_version)
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_review_events_assignment_created ON review_events (assignment_id, created_at)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS review_retention_holds (
      hold_event_id text PRIMARY KEY NOT NULL, assignment_id text NOT NULL,
      action text NOT NULL, reason_code text NOT NULL, expires_at text NOT NULL,
      actor_id text NOT NULL, created_at text NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_review_retention_holds_assignment_created ON review_retention_holds (assignment_id, created_at)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS review_retention_authorizations (
      assignment_id text PRIMARY KEY NOT NULL, authorization_nonce text NOT NULL,
      expires_at text NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS review_retention_runs (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL, cutoff_at text NOT NULL,
      eligible_count integer NOT NULL, deleted_count integer NOT NULL, created_at text NOT NULL
    )`),
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
    db.prepare(`CREATE TABLE IF NOT EXISTS workspace_routing (
      pod_id text NOT NULL, route_key text NOT NULL, configuration_version integer NOT NULL,
      channel_id text NOT NULL, channel_name text NOT NULL, relay_url text NOT NULL,
      changed_by text NOT NULL, change_reason text NOT NULL, created_at text NOT NULL,
      UNIQUE(pod_id, route_key, configuration_version)
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_workspace_routing_active ON workspace_routing (pod_id, route_key, configuration_version)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS workspace_routing_conflicts (
      pod_id text NOT NULL, route_key text NOT NULL, conflict_id text NOT NULL,
      source_kind text NOT NULL, source_reference_sha256 text NOT NULL, status text NOT NULL,
      detected_by text NOT NULL, detected_at text NOT NULL, resolved_by text, resolved_at text,
      UNIQUE(pod_id, route_key, conflict_id)
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_workspace_routing_conflict_active ON workspace_routing_conflicts (pod_id, route_key, status)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS buzz_channel_registry (
      pod_id text NOT NULL, registry_version integer NOT NULL, channel_id text NOT NULL,
      channel_name text NOT NULL, relay_url text NOT NULL, status text NOT NULL,
      changed_by text NOT NULL, change_reason text NOT NULL, created_at text NOT NULL,
      UNIQUE(pod_id, channel_id, registry_version)
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_buzz_channel_registry_active ON buzz_channel_registry (pod_id, channel_id, status)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS agent_channel_memberships (
      pod_id text NOT NULL, channel_id text NOT NULL, member_id text NOT NULL,
      membership_version integer NOT NULL, status text NOT NULL, created_at text NOT NULL,
      UNIQUE(pod_id, channel_id, member_id, membership_version)
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_agent_channel_membership_active ON agent_channel_memberships (pod_id, channel_id, member_id, status)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS dispatch_receipts (
      intent_id text PRIMARY KEY NOT NULL, lineage_id text NOT NULL, item_id integer NOT NULL,
      pod_id text NOT NULL, authorization_revision text NOT NULL, channel_id text NOT NULL,
      configuration_version integer NOT NULL, receipt_json text NOT NULL, created_at text NOT NULL,
      terminal_at text, delete_after text
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_dispatch_receipts_item_created ON dispatch_receipts (item_id, created_at)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_dispatch_receipts_lineage ON dispatch_receipts (lineage_id)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS dispatch_authorization_audits (
      audit_event_id text PRIMARY KEY NOT NULL, intent_id text NOT NULL UNIQUE, item_id integer NOT NULL,
      pod_id text NOT NULL, authorization_revision text NOT NULL, authorization_json text NOT NULL,
      actor_id text NOT NULL, created_at text NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_dispatch_authorization_item_created ON dispatch_authorization_audits (item_id, created_at)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS dispatch_outbox (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL, intent_id text NOT NULL UNIQUE,
      receipt_id text NOT NULL, member_id text NOT NULL, channel_id text NOT NULL,
      channel_name text NOT NULL, status text NOT NULL, current_state text NOT NULL DEFAULT 'QUEUED',
      current_event_version integer NOT NULL DEFAULT 0, current_event_sha256 text NOT NULL,
      attempt_number integer NOT NULL DEFAULT 0, lease_id text, lease_expires_at text,
      reservation_fence text, send_started integer NOT NULL DEFAULT 0,
      reconciliation_required integer NOT NULL DEFAULT 0, terminalization_requested integer NOT NULL DEFAULT 0,
      relay_url text NOT NULL, routing_configuration_version integer NOT NULL,
      delivered_event_id text, accepted_acknowledgement_sha256 text,
      last_error_code text, created_at text NOT NULL, updated_at text NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_dispatch_outbox_status_created ON dispatch_outbox (status, created_at)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS dispatch_events (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL, intent_id text NOT NULL,
      event_version integer NOT NULL, expected_event_version integer NOT NULL, event_type text NOT NULL, prior_state text,
      resulting_state text, payload_json text NOT NULL, previous_event_sha256 text, event_sha256 text NOT NULL,
      service_key_id text NOT NULL, service_key_version integer NOT NULL, service_signature text NOT NULL,
      agent_key_id text, agent_key_version integer, agent_signature text, acknowledgement_sha256 text,
      actor_id text NOT NULL, created_at text NOT NULL,
      UNIQUE(intent_id, event_version)
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_dispatch_events_intent_created ON dispatch_events (intent_id, created_at)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS dispatch_attempts (
      intent_id text NOT NULL, attempt_number integer NOT NULL, lease_id text NOT NULL,
      lease_expires_at text NOT NULL, reservation_fence text NOT NULL UNIQUE, status text NOT NULL,
      created_at text NOT NULL, updated_at text NOT NULL, UNIQUE(intent_id, attempt_number)
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_dispatch_attempts_intent_status ON dispatch_attempts (intent_id, status)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS dispatch_event_signers (
      pod_id text NOT NULL, registry_version integer NOT NULL, service_role text NOT NULL,
      allowed_event_types_json text NOT NULL, key_id text NOT NULL, key_version integer NOT NULL,
      public_key text NOT NULL, valid_from text NOT NULL, valid_until text, status text NOT NULL,
      changed_by text NOT NULL, change_reason text NOT NULL, created_at text NOT NULL,
      UNIQUE(pod_id, key_id, key_version)
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_dispatch_event_signers_active ON dispatch_event_signers (pod_id, service_role, status)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS relay_event_signers (
      pod_id text NOT NULL, registry_version integer NOT NULL, relay_url text NOT NULL, channel_id text NOT NULL,
      key_id text NOT NULL, key_version integer NOT NULL, public_key text NOT NULL, valid_from text NOT NULL,
      valid_until text, status text NOT NULL, changed_by text NOT NULL, change_reason text NOT NULL,
      created_at text NOT NULL, UNIQUE(pod_id, key_id, key_version)
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_relay_event_signers_active ON relay_event_signers (pod_id, relay_url, channel_id, status)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS dispatch_retention_holds (
      hold_event_id text PRIMARY KEY NOT NULL, intent_id text NOT NULL, action text NOT NULL,
      reason_code text NOT NULL, expires_at text NOT NULL, actor_id text NOT NULL, created_at text NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_dispatch_retention_holds_intent_created ON dispatch_retention_holds (intent_id, created_at)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS dispatch_retention_authorizations (
      intent_id text PRIMARY KEY NOT NULL, authorization_nonce text NOT NULL, expires_at text NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS dispatch_retention_runs (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL, cutoff_at text NOT NULL,
      eligible_count integer NOT NULL, deleted_count integer NOT NULL, created_at text NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_dispatch_retention_runs_created ON dispatch_retention_runs (created_at)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS steer_telemetry (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL, metric_name text NOT NULL,
      label_name text NOT NULL DEFAULT '', label_value text NOT NULL DEFAULT '',
      value integer NOT NULL, case_id text, observed_at text NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_steer_telemetry_metric_observed ON steer_telemetry (metric_name, observed_at)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS dispatch_privacy_policies (
      pod_id text NOT NULL, policy_version integer NOT NULL, inventory_url text NOT NULL,
      inventory_sha256 text NOT NULL, terminal_retention_days integer NOT NULL,
      provider_recovery_days integer NOT NULL, status text NOT NULL, changed_by text NOT NULL,
      change_reason text NOT NULL, created_at text NOT NULL, ruling_url text,
      ruling_sha256 text, authority_role text, authorization_event_id text,
      idempotency_key text, activation_receipt_sha256 text,
      UNIQUE(pod_id, policy_version)
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_dispatch_privacy_policy_active ON dispatch_privacy_policies (pod_id, status, policy_version)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS dispatch_security_diagnostics (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL, code text NOT NULL,
      configuration_version integer, observed_at text NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_dispatch_security_diagnostics_observed ON dispatch_security_diagnostics (observed_at)"),
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
  await ensureColumn(db, "work_items", "value_hypothesis_json", "value_hypothesis_json text");
  await ensureColumn(db, "work_items", "delivery_forecast_json", "delivery_forecast_json text");
  await ensureColumn(db, "work_items", "actual_economics_json", "actual_economics_json text");
  await ensureColumn(db, "work_items", "realized_outcome_json", "realized_outcome_json text");
  await ensureColumn(db, "members", "pod_id", "pod_id text NOT NULL DEFAULT 'steer-flight-team'");
  await ensureColumn(db, "members", "agent_key_id", "agent_key_id text");
  await ensureColumn(db, "members", "agent_key_version", "agent_key_version integer");
  await ensureColumn(db, "members", "agent_public_key", "agent_public_key text");
  await ensureColumn(db, "members", "agent_public_key_fingerprint", "agent_public_key_fingerprint text");
  await ensureColumn(db, "work_items", "pod_id", "pod_id text NOT NULL DEFAULT 'steer-flight-team'");
  await ensureColumn(db, "work_items", "work_type", "work_type text NOT NULL DEFAULT 'Unclassified'");
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_work_items_pod_work_type_state ON work_items (pod_id, work_type, state)").run();
  await ensureColumn(db, "work_items", "delivery_owner_id", "delivery_owner_id text");
  await ensureColumn(db, "work_items", "outcome_owner_id", "outcome_owner_id text");
  await ensureColumn(db, "work_economics_agent_facts", "conflict_reason", "conflict_reason text NOT NULL DEFAULT ''");
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS work_economics_events_no_update
    BEFORE UPDATE ON work_economics_events BEGIN SELECT RAISE(ABORT, 'work_economics_events are immutable'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS work_economics_events_no_delete
    BEFORE DELETE ON work_economics_events BEGIN SELECT RAISE(ABORT, 'work_economics_events are immutable'); END`).run();
  await ensureColumn(db, "decisions", "review_id", "review_id integer");
  await ensureColumn(db, "decisions", "evidence_url", "evidence_url text");
  await ensureColumn(db, "decisions", "evidence_revision", "evidence_revision text");
  await ensureColumn(db, "decisions", "evidence_sha256", "evidence_sha256 text");
  await ensureColumn(db, "decisions", "decision_intent_id", "decision_intent_id text");
  await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS uq_decisions_intent ON decisions (decision_intent_id) WHERE decision_intent_id IS NOT NULL").run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS decision_packages_no_update
    BEFORE UPDATE ON decision_packages BEGIN SELECT RAISE(ABORT, 'decision packages are immutable'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS decision_packages_no_delete
    BEFORE DELETE ON decision_packages BEGIN SELECT RAISE(ABORT, 'decision packages require governed retention'); END`).run();
  await ensureColumn(db, "decision_intents", "readiness_snapshot_sha256", "readiness_snapshot_sha256 text NOT NULL DEFAULT ''");
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS decision_intents_immutable_payload
    BEFORE UPDATE ON decision_intents WHEN
      NEW.intent_json != OLD.intent_json OR NEW.intent_sha256 != OLD.intent_sha256 OR
      NEW.submitter_id != OLD.submitter_id OR NEW.submitter_role != OLD.submitter_role OR
      NEW.decision_session_id != OLD.decision_session_id OR
      NEW.required_countersignatures != OLD.required_countersignatures OR
      NEW.effective_not_before != OLD.effective_not_before OR NEW.signer_policy_version != OLD.signer_policy_version OR
      NEW.readiness_snapshot_sha256 != OLD.readiness_snapshot_sha256 OR
      NEW.created_at != OLD.created_at
    BEGIN SELECT RAISE(ABORT, 'decision intent authority is immutable'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS decision_intents_immutable_authority_v2
    BEFORE UPDATE ON decision_intents WHEN
      NEW.submitter_role != OLD.submitter_role OR
      NEW.required_countersignatures != OLD.required_countersignatures OR
      NEW.effective_not_before != OLD.effective_not_before OR NEW.signer_policy_version != OLD.signer_policy_version
    BEGIN SELECT RAISE(ABORT, 'decision intent signer authority is immutable'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS decision_intents_readiness_immutable_v3
    BEFORE UPDATE ON decision_intents WHEN NEW.readiness_snapshot_sha256 != OLD.readiness_snapshot_sha256
    BEGIN SELECT RAISE(ABORT, 'decision intent readiness authority is immutable'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS decision_proof_events_no_update
    BEFORE UPDATE ON decision_proof_events BEGIN SELECT RAISE(ABORT, 'decision proof events are append-only'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS decision_proof_events_no_delete
    BEFORE DELETE ON decision_proof_events BEGIN SELECT RAISE(ABORT, 'decision proof events require governed retention'); END`).run();
  await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS uq_decision_effect_event ON decision_proof_events (intent_id) WHERE event_type = 'DECISION_EFFECTIVE'").run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS decision_issuer_signers_no_update
    BEFORE UPDATE ON decision_issuer_signers BEGIN SELECT RAISE(ABORT, 'decision issuer signer records are immutable'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS decision_issuer_envelopes_no_update
    BEFORE UPDATE ON decision_issuer_envelopes BEGIN SELECT RAISE(ABORT, 'decision issuer envelopes are immutable'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS decision_issuer_envelopes_no_delete
    BEFORE DELETE ON decision_issuer_envelopes BEGIN SELECT RAISE(ABORT, 'decision issuer envelopes require governed retention'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS decision_signer_policies_no_update
    BEFORE UPDATE ON decision_signer_policies BEGIN SELECT RAISE(ABORT, 'decision signer policies are immutable'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS decision_signer_policies_no_delete
    BEFORE DELETE ON decision_signer_policies BEGIN SELECT RAISE(ABORT, 'decision signer policies require governed retention'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS decision_readiness_policies_no_update
    BEFORE UPDATE ON decision_readiness_policies BEGIN SELECT RAISE(ABORT, 'decision readiness policies are immutable'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS decision_readiness_policies_no_delete
    BEFORE DELETE ON decision_readiness_policies BEGIN SELECT RAISE(ABORT, 'decision readiness policies require governed retention'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS staging_verification_receipts_no_update
    BEFORE UPDATE ON staging_verification_receipts BEGIN SELECT RAISE(ABORT, 'staging verification receipts are immutable'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS staging_verification_receipts_no_delete
    BEFORE DELETE ON staging_verification_receipts BEGIN SELECT RAISE(ABORT, 'staging verification receipts require governed retention'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS staging_readiness_case_results_no_update
    BEFORE UPDATE ON staging_readiness_case_results BEGIN SELECT RAISE(ABORT, 'staging readiness case results are immutable'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS staging_readiness_case_results_no_delete
    BEFORE DELETE ON staging_readiness_case_results BEGIN SELECT RAISE(ABORT, 'staging readiness case results require governed retention'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS decision_readiness_snapshots_authority_immutable
    BEFORE UPDATE ON decision_readiness_snapshots WHEN
      NEW.snapshot_id != OLD.snapshot_id OR NEW.item_id != OLD.item_id OR NEW.pod_id != OLD.pod_id OR
      NEW.snapshot_json != OLD.snapshot_json OR NEW.snapshot_sha256 != OLD.snapshot_sha256 OR
      NEW.evidence_set_sha256 != OLD.evidence_set_sha256 OR NEW.critic_review_id != OLD.critic_review_id OR
      NEW.tier != OLD.tier OR NEW.satisfaction_path != OLD.satisfaction_path OR
      NEW.effective_not_before != OLD.effective_not_before OR NEW.created_by != OLD.created_by OR
      COALESCE(NEW.predecessor_snapshot_sha256, '') != COALESCE(OLD.predecessor_snapshot_sha256, '') OR NEW.created_at != OLD.created_at
    BEGIN SELECT RAISE(ABORT, 'decision readiness snapshot authority is immutable'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS decision_readiness_snapshots_state_transition
    BEFORE UPDATE ON decision_readiness_snapshots WHEN
      (OLD.current_state != NEW.current_state OR COALESCE(OLD.invalidation_reason, '') != COALESCE(NEW.invalidation_reason, '')) AND NOT (
        OLD.current_state = 'ACTIVE' AND NEW.current_state = 'INVALIDATED' AND LENGTH(COALESCE(NEW.invalidation_reason, '')) > 0
      )
    BEGIN SELECT RAISE(ABORT, 'decision readiness snapshot state transition is invalid'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS decision_readiness_snapshots_no_delete
    BEFORE DELETE ON decision_readiness_snapshots BEGIN SELECT RAISE(ABORT, 'decision readiness snapshots require governed retention'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS decision_readiness_events_no_update
    BEFORE UPDATE ON decision_readiness_events BEGIN SELECT RAISE(ABORT, 'decision readiness events are append-only'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS decision_readiness_events_no_delete
    BEFORE DELETE ON decision_readiness_events BEGIN SELECT RAISE(ABORT, 'decision readiness events require governed retention'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS decision_readiness_countersignatures_no_update
    BEFORE UPDATE ON decision_readiness_countersignatures BEGIN SELECT RAISE(ABORT, 'decision readiness countersignatures are immutable'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS decision_readiness_countersignatures_no_delete
    BEFORE DELETE ON decision_readiness_countersignatures BEGIN SELECT RAISE(ABORT, 'decision readiness countersignatures require governed retention'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS decision_readiness_snapshots_manifest_v2
    BEFORE INSERT ON decision_readiness_snapshots WHEN
      json_extract(NEW.snapshot_json, '$.schema') != 'steer.gate-readiness-snapshot/v1' OR
      LENGTH(COALESCE(json_extract(NEW.snapshot_json, '$.brief_path'), '')) < 3 OR
      LENGTH(COALESCE(json_extract(NEW.snapshot_json, '$.exam_path'), '')) < 3 OR
      LENGTH(COALESCE(json_extract(NEW.snapshot_json, '$.critic_assignment_id'), '')) < 3 OR
      LENGTH(COALESCE(json_extract(NEW.snapshot_json, '$.risk_policy_sha256'), '')) != 64 OR
      LENGTH(COALESCE(json_extract(NEW.snapshot_json, '$.candidate_builder_id'), '')) < 2 OR
      LENGTH(COALESCE(json_extract(NEW.snapshot_json, '$.intended_submitter_id'), '')) < 2 OR
      json_extract(NEW.snapshot_json, '$.critic_review_id') != NEW.critic_review_id OR
      json_extract(NEW.snapshot_json, '$.evidence_set_sha256') != NEW.evidence_set_sha256 OR
      json_extract(NEW.snapshot_json, '$.tier') != NEW.tier OR
      json_extract(NEW.snapshot_json, '$.satisfaction_path') != NEW.satisfaction_path OR
      json_extract(NEW.snapshot_json, '$.effective_not_before') != NEW.effective_not_before
    BEGIN SELECT RAISE(ABORT, 'complete readiness authority manifest is required'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS decision_intents_readiness_manifest_v4
    BEFORE INSERT ON decision_intents WHEN NEW.readiness_snapshot_sha256 != '' AND (
      json_extract(NEW.intent_json, '$.readiness_snapshot_sha256') != NEW.readiness_snapshot_sha256 OR
      json_extract(NEW.intent_json, '$.readiness_authority.snapshot_sha256') != NEW.readiness_snapshot_sha256 OR
      LENGTH(COALESCE(json_extract(NEW.intent_json, '$.readiness_authority.risk_policy_sha256'), '')) != 64 OR
      LENGTH(COALESCE(json_extract(NEW.intent_json, '$.readiness_authority.candidate_builder_id'), '')) < 2 OR
      LENGTH(COALESCE(json_extract(NEW.intent_json, '$.readiness_authority.intended_submitter_id'), '')) < 2 OR
      json_extract(NEW.intent_json, '$.readiness_authority.intended_submitter_id') != NEW.submitter_id)
    BEGIN SELECT RAISE(ABORT, 'decision intent requires complete snapshot authority'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS decision_proof_events_readiness_manifest_v1
    BEFORE INSERT ON decision_proof_events WHEN
      COALESCE((SELECT readiness_snapshot_sha256 FROM decision_intents WHERE intent_id = NEW.intent_id), '') != '' AND
      COALESCE(json_extract(NEW.event_json, '$.payload.readiness_authority.snapshot_sha256'), '') !=
        (SELECT readiness_snapshot_sha256 FROM decision_intents WHERE intent_id = NEW.intent_id)
    BEGIN SELECT RAISE(ABORT, 'proof event readiness authority mismatch'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS decision_readiness_events_manifest_v1
    BEFORE INSERT ON decision_readiness_events WHEN
      COALESCE(json_extract(NEW.event_json, '$.readiness_authority.snapshot_sha256'), '') !=
        COALESCE((SELECT snapshot_sha256 FROM decision_readiness_snapshots WHERE snapshot_id = NEW.snapshot_id),
                 json_extract(NEW.event_json, '$.readiness_authority.snapshot_sha256'))
    BEGIN SELECT RAISE(ABORT, 'readiness event authority mismatch'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS staging_verification_receipts_manifest_v2
    BEFORE INSERT ON staging_verification_receipts WHEN
      json_extract(NEW.receipt_json, '$.schema') != 'steer.staging-verification-receipt/v1' OR
      LENGTH(COALESCE(json_extract(NEW.receipt_json, '$.brief_path'), '')) < 3 OR
      LENGTH(COALESCE(json_extract(NEW.receipt_json, '$.exam_path'), '')) < 3 OR
      LENGTH(COALESCE(json_extract(NEW.receipt_json, '$.candidate_builder_id'), '')) < 2 OR
      LENGTH(COALESCE(json_extract(NEW.receipt_json, '$.intended_submitter_id'), '')) < 2 OR
      json_extract(NEW.receipt_json, '$.source_revision') != NEW.source_revision OR
      json_extract(NEW.receipt_json, '$.build_sha256') != NEW.build_sha256 OR
      json_extract(NEW.receipt_json, '$.migration_set_sha256') != NEW.migration_set_sha256 OR
      json_extract(NEW.receipt_json, '$.runtime_policy_sha256') != NEW.runtime_policy_sha256
    BEGIN SELECT RAISE(ABORT, 'verification receipt requires complete candidate authority'); END`).run();
  await ensureColumn(db, "decision_intents", "effective_not_before", "effective_not_before text NOT NULL DEFAULT '9999-12-31T23:59:59Z'");
  await ensureColumn(db, "decision_intents", "signer_policy_version", "signer_policy_version integer NOT NULL DEFAULT 0");
  await ensureColumn(db, "decision_intents", "readiness_snapshot_sha256", "readiness_snapshot_sha256 text NOT NULL DEFAULT ''");
  await ensureColumn(db, "decision_intents", "decision_session_id", "decision_session_id text");
  await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS uq_decision_intents_session ON decision_intents (decision_session_id) WHERE decision_session_id IS NOT NULL").run();
  await ensureColumn(db, "decision_signer_policies", "ruling_sha256", "ruling_sha256 text NOT NULL DEFAULT ''");
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS decision_sessions_no_update
    BEFORE UPDATE ON decision_sessions BEGIN SELECT RAISE(ABORT, 'decision sessions are immutable'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS decision_sessions_no_delete
    BEFORE DELETE ON decision_sessions BEGIN SELECT RAISE(ABORT, 'decision sessions require governed retention'); END`).run();
  await ensureColumn(db, "agent_reviews", "evidence_url", "evidence_url text");
  await ensureColumn(db, "agent_reviews", "evidence_revision", "evidence_revision text");
  await ensureColumn(db, "agent_reviews", "evidence_sha256", "evidence_sha256 text");
  await ensureColumn(db, "agent_reviews", "review_assignment_id", "review_assignment_id text");
  await ensureColumn(db, "activity", "review_assignment_id", "review_assignment_id text");
  await ensureColumn(db, "notifications", "review_assignment_id", "review_assignment_id text");
  await ensureColumn(db, "dispatch_privacy_policies", "ruling_url", "ruling_url text");
  await ensureColumn(db, "dispatch_privacy_policies", "ruling_sha256", "ruling_sha256 text");
  await ensureColumn(db, "dispatch_privacy_policies", "authority_role", "authority_role text");
  await ensureColumn(db, "dispatch_privacy_policies", "authorization_event_id", "authorization_event_id text");
  await ensureColumn(db, "dispatch_privacy_policies", "idempotency_key", "idempotency_key text");
  await ensureColumn(db, "dispatch_privacy_policies", "activation_receipt_sha256", "activation_receipt_sha256 text");
  await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS uq_dispatch_privacy_policy_event ON dispatch_privacy_policies (authorization_event_id) WHERE authorization_event_id IS NOT NULL").run();
  await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS uq_dispatch_privacy_policy_idempotency ON dispatch_privacy_policies (pod_id, idempotency_key) WHERE idempotency_key IS NOT NULL").run();
  await db.prepare("DROP TRIGGER IF EXISTS review_assignments_no_update").run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS review_assignments_immutable_authority
    BEFORE UPDATE ON review_assignments WHEN
      NEW.assignment_id != OLD.assignment_id OR NEW.idempotency_key != OLD.idempotency_key OR
      NEW.item_id != OLD.item_id OR NEW.pod_id != OLD.pod_id OR NEW.review_stage != OLD.review_stage OR
      NEW.reviewer_member_id != OLD.reviewer_member_id OR NEW.primary_claim_lineage_id != OLD.primary_claim_lineage_id OR
      NEW.item_revision != OLD.item_revision OR NEW.target_manifest_sha256 != OLD.target_manifest_sha256 OR
      NEW.assignment_json != OLD.assignment_json OR NEW.authorizing_actor_id != OLD.authorizing_actor_id OR
      NEW.authorizing_event_id != OLD.authorizing_event_id OR NEW.created_at != OLD.created_at OR
      NEW.delete_after != OLD.delete_after
    BEGIN SELECT RAISE(ABORT, 'review assignment authority is immutable'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS review_assignments_no_delete
    BEFORE DELETE ON review_assignments WHEN NOT EXISTS (
      SELECT 1 FROM review_retention_authorizations a WHERE a.assignment_id = OLD.assignment_id AND unixepoch(a.expires_at) > unixepoch('now')
    ) BEGIN SELECT RAISE(ABORT, 'review assignments require the governed retention path'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS review_events_no_update
    BEFORE UPDATE ON review_events BEGIN SELECT RAISE(ABORT, 'review events are append-only'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS review_events_no_delete
    BEFORE DELETE ON review_events WHEN NOT EXISTS (
      SELECT 1 FROM review_retention_authorizations a WHERE a.assignment_id = OLD.assignment_id AND unixepoch(a.expires_at) > unixepoch('now')
    ) BEGIN SELECT RAISE(ABORT, 'review events require the governed retention path'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS review_retention_holds_no_update
    BEFORE UPDATE ON review_retention_holds BEGIN SELECT RAISE(ABORT, 'review retention hold events are immutable'); END`).run();
  await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS uq_review_events_one_ack ON review_events (assignment_id) WHERE event_type = 'REVIEW_ACKNOWLEDGED'").run();
  await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS uq_review_events_one_result ON review_events (assignment_id) WHERE event_type = 'REVIEW_RESULT_RECORDED'").run();
  await ensureColumn(db, "dispatch_events", "expected_event_version", "expected_event_version integer NOT NULL DEFAULT -1");
  await ensureColumn(db, "dispatch_events", "previous_event_sha256", "previous_event_sha256 text");
  await ensureColumn(db, "dispatch_events", "event_sha256", "event_sha256 text NOT NULL DEFAULT ''");
  await ensureColumn(db, "dispatch_events", "service_key_id", "service_key_id text NOT NULL DEFAULT ''");
  await ensureColumn(db, "dispatch_events", "service_key_version", "service_key_version integer NOT NULL DEFAULT 0");
  await ensureColumn(db, "dispatch_events", "service_signature", "service_signature text NOT NULL DEFAULT ''");
  await ensureColumn(db, "dispatch_events", "agent_key_id", "agent_key_id text");
  await ensureColumn(db, "dispatch_events", "agent_key_version", "agent_key_version integer");
  await ensureColumn(db, "dispatch_events", "agent_signature", "agent_signature text");
  await ensureColumn(db, "dispatch_events", "acknowledgement_sha256", "acknowledgement_sha256 text");
  await ensureColumn(db, "dispatch_outbox", "current_state", "current_state text NOT NULL DEFAULT 'QUEUED'");
  await ensureColumn(db, "dispatch_outbox", "current_event_version", "current_event_version integer NOT NULL DEFAULT 0");
  await ensureColumn(db, "dispatch_outbox", "current_event_sha256", "current_event_sha256 text NOT NULL DEFAULT ''");
  await ensureColumn(db, "dispatch_outbox", "lease_id", "lease_id text");
  await ensureColumn(db, "dispatch_outbox", "lease_expires_at", "lease_expires_at text");
  await ensureColumn(db, "dispatch_outbox", "reservation_fence", "reservation_fence text");
  await ensureColumn(db, "dispatch_outbox", "send_started", "send_started integer NOT NULL DEFAULT 0");
  await ensureColumn(db, "dispatch_outbox", "reconciliation_required", "reconciliation_required integer NOT NULL DEFAULT 0");
  await ensureColumn(db, "dispatch_outbox", "terminalization_requested", "terminalization_requested integer NOT NULL DEFAULT 0");
  await ensureColumn(db, "dispatch_outbox", "relay_url", "relay_url text NOT NULL DEFAULT ''");
  await ensureColumn(db, "dispatch_outbox", "routing_configuration_version", "routing_configuration_version integer NOT NULL DEFAULT 0");
  await ensureColumn(db, "dispatch_outbox", "delivered_event_id", "delivered_event_id text");
  await ensureColumn(db, "dispatch_outbox", "accepted_acknowledgement_sha256", "accepted_acknowledgement_sha256 text");
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS dispatch_receipts_no_update
    BEFORE UPDATE ON dispatch_receipts BEGIN SELECT RAISE(ABORT, 'dispatch receipts are immutable'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS dispatch_receipts_no_delete
    BEFORE DELETE ON dispatch_receipts WHEN NOT EXISTS (
      SELECT 1 FROM dispatch_retention_authorizations a WHERE a.intent_id = OLD.intent_id AND unixepoch(a.expires_at) > unixepoch('now')
    ) BEGIN SELECT RAISE(ABORT, 'dispatch receipts require the governed retention path'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS dispatch_events_no_update
    BEFORE UPDATE ON dispatch_events BEGIN SELECT RAISE(ABORT, 'dispatch events are append-only'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS dispatch_events_no_delete
    BEFORE DELETE ON dispatch_events WHEN NOT EXISTS (
      SELECT 1 FROM dispatch_retention_authorizations a WHERE a.intent_id = OLD.intent_id AND unixepoch(a.expires_at) > unixepoch('now')
    ) BEGIN SELECT RAISE(ABORT, 'dispatch events require the governed retention path'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS dispatch_authorization_audits_no_update
    BEFORE UPDATE ON dispatch_authorization_audits BEGIN SELECT RAISE(ABORT, 'dispatch authorization audits are immutable'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS dispatch_authorization_audits_no_delete
    BEFORE DELETE ON dispatch_authorization_audits WHEN NOT EXISTS (
      SELECT 1 FROM dispatch_retention_authorizations a WHERE a.intent_id = OLD.intent_id AND unixepoch(a.expires_at) > unixepoch('now')
    ) BEGIN SELECT RAISE(ABORT, 'dispatch authorization audits require the governed retention path'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS dispatch_event_signers_no_update
    BEFORE UPDATE ON dispatch_event_signers BEGIN SELECT RAISE(ABORT, 'dispatch signer registry entries are immutable'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS dispatch_event_signers_no_delete
    BEFORE DELETE ON dispatch_event_signers BEGIN SELECT RAISE(ABORT, 'dispatch signer registry entries are immutable'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS relay_event_signers_no_update
    BEFORE UPDATE ON relay_event_signers BEGIN SELECT RAISE(ABORT, 'relay signer registry entries are immutable'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS relay_event_signers_no_delete
    BEFORE DELETE ON relay_event_signers BEGIN SELECT RAISE(ABORT, 'relay signer registry entries are immutable'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS dispatch_retention_holds_no_update
    BEFORE UPDATE ON dispatch_retention_holds BEGIN SELECT RAISE(ABORT, 'dispatch retention hold events are immutable'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS dispatch_privacy_policies_no_update
    BEFORE UPDATE ON dispatch_privacy_policies BEGIN SELECT RAISE(ABORT, 'dispatch privacy policy versions are immutable'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS dispatch_privacy_policies_no_delete
    BEFORE DELETE ON dispatch_privacy_policies BEGIN SELECT RAISE(ABORT, 'dispatch privacy policy versions are immutable'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS buzz_channel_registry_no_update
    BEFORE UPDATE ON buzz_channel_registry BEGIN SELECT RAISE(ABORT, 'Buzz channel registry versions are immutable'); END`).run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS buzz_channel_registry_no_delete
    BEFORE DELETE ON buzz_channel_registry BEGIN SELECT RAISE(ABORT, 'Buzz channel registry versions are immutable'); END`).run();
  await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS uq_dispatch_events_one_acknowledged ON dispatch_events (intent_id) WHERE event_type = 'ACKNOWLEDGED'").run();
  await db.prepare("PRAGMA optimize").run();
}

const schemaReadyByDatabase = new WeakMap<object, Promise<void>>();

async function ensureSchemaReady(db: Database) {
  const databaseIdentity = db as object;
  let pending = schemaReadyByDatabase.get(databaseIdentity);
  if (!pending) {
    pending = ensureSchema(db).catch((error) => {
      schemaReadyByDatabase.delete(databaseIdentity);
      throw error;
    });
    schemaReadyByDatabase.set(databaseIdentity, pending);
  }
  await pending;
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

async function ensureInitialSteerRoute(db: Database, user: User) {
  const member = await memberContext(db, user);
  const podId = member?.pod_id ?? "steer-flight-team";
  const now = new Date().toISOString();
  await db.batch([
    db.prepare(`INSERT OR IGNORE INTO workspace_routing
      (pod_id, route_key, configuration_version, channel_id, channel_name, relay_url, changed_by, change_reason, created_at)
      VALUES (?, ?, 1, '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', '#steer-team', ?, ?, 'Authenticated human routing decision recorded in STR-028 issue #56.', ?)`)
      .bind(podId, STEER_HANDOFF_ROUTE_KEY, buzzRelayHttpUrl, user.id, now),
    db.prepare(`INSERT OR IGNORE INTO buzz_channel_registry
      (pod_id, registry_version, channel_id, channel_name, relay_url, status, changed_by, change_reason, created_at)
      VALUES (?, 1, '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', '#steer-team', ?, 'ACTIVE', ?,
       'Canonical channel identity verified by the authenticated STR-028 routing decision.', ?)`)
      .bind(podId, buzzRelayHttpUrl, user.id, now),
    db.prepare(`INSERT OR IGNORE INTO agent_channel_memberships
      (pod_id, channel_id, member_id, membership_version, status, created_at)
      SELECT ?, '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', id, 1, 'active', ?
      FROM members
      WHERE kind = 'agent' AND status = 'enrolled' AND pod_id = ?`)
      .bind(podId, now, podId),
    db.prepare("UPDATE members SET agent_key_id = 'buzz-roster-v3:builder', agent_key_version = 3, agent_public_key = '1bcd9d68ce9a04cd17bf7e96d71e237654d38eeb26dd8ea5a08ba1259a6baf12', agent_public_key_fingerprint = '6e5b2ac5e26064f99a7e7046aa0235fe8e57e5106438f8314fd6a88b4b14ac06' WHERE id = 'agent-builder'"),
    db.prepare("UPDATE members SET agent_key_id = 'buzz-roster-v3:critic', agent_key_version = 3, agent_public_key = '873eacdb79becf6b5e18f4aec79decad3c80bcce3d3c6c690e6dd773256f12c1', agent_public_key_fingerprint = '959cad86721134a6923a3bc2f951fc75781b7e11ba662d945b036322fee5b4da' WHERE id = 'agent-critic'"),
    db.prepare("UPDATE members SET agent_key_id = 'buzz-roster-v3:test', agent_key_version = 3, agent_public_key = '692f22559c40755774615c070956134867995f07f54c1f2507b905d3b9bb0a52', agent_public_key_fingerprint = '268d379101b4e095a4da7ac5ac87553a85aa3a97a3a0359d0c5812b46ae55260' WHERE id = 'agent-test'"),
    db.prepare("UPDATE members SET agent_key_id = 'buzz-roster-v3:scout', agent_key_version = 3, agent_public_key = 'f66f2459a92b793fd40bbf7f38553df37c6674bf273d85dbf85787290cc2237a', agent_public_key_fingerprint = 'd07dfbeedef6fa5bb6dfd36b8f1d1895a6b9cad8a2f3dda62842adaebebb6de1' WHERE id = 'agent-scout'"),
    db.prepare("UPDATE members SET agent_key_id = 'buzz-roster-v3:architect', agent_key_version = 3, agent_public_key = '9c764661a78b480a324c8da9a5b86cf0224ad992467c324358e88fab4b85b2ea', agent_public_key_fingerprint = 'cbd5ff3144019ebe879e9365d51021c8a208a672e9c70405dd4a9329afdec72f' WHERE id = 'agent-architect'"),
    db.prepare("UPDATE members SET agent_key_id = 'buzz-roster-v3:docs', agent_key_version = 3, agent_public_key = '2680575df454cefd26835487860724a805502f6285dfe8191251bf7d2bfcbf4d', agent_public_key_fingerprint = '27e3d8f6822c44734835431eab817c28802972aa534caa37a66945803d8d0209' WHERE id = 'agent-docs'"),
    db.prepare("UPDATE members SET agent_key_id = 'buzz-roster-v3:ops', agent_key_version = 3, agent_public_key = '8ebe6f6dfcedc9c867a1083772a4f40d83da100d663d300ecd99562ebbf05349', agent_public_key_fingerprint = '0569025819601fa9497d7e1272734cf0224abc5edc26f751eefa4be4db9a2450' WHERE id = 'agent-ops'"),
    db.prepare(`INSERT OR IGNORE INTO dispatch_privacy_policies
      (pod_id, policy_version, inventory_url, inventory_sha256, terminal_retention_days,
       provider_recovery_days, status, changed_by, change_reason, created_at)
      VALUES (?, 1, ?, ?, 90, 30, 'BLOCKED_BACKUP_RULING', ?,
       'STR-028 inventory is immutable; D1 Time Travel backup deletion requires a Privacy/Security ruling.', ?)`)
      .bind(podId, dispatchPrivacyInventoryUrl, dispatchPrivacyInventorySha256, user.id, now),
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

async function backfillApprovedGateOneHandoffs(db: Database) {
  const now = new Date().toISOString();
  await db.batch([
    db.prepare(
      `UPDATE work_items
       SET phase = 'Frame',
           decision_authority = 'Interim Tech Lead',
           assignee_id = 'agent-architect',
           next_action = ?,
           rework_instructions = NULL,
           blocked_since = NULL,
           updated_at = ?
       WHERE gate = 'Gate 2 pending'
         AND decision_status = 'Waiting'
         AND phase = 'Sense'
         AND EXISTS (
           SELECT 1 FROM decisions d
           WHERE d.item_id = work_items.id
             AND d.gate = 'Gate 1 pending'
             AND d.decision = 'APPROVED'
         )`,
    ).bind(gateTwoExamNextAction, now),
    db.prepare(
      `INSERT INTO activity (item_id, actor_id, action, detail, created_at)
       SELECT w.id, 'system', 'workflow',
              'Gate 1 approval advanced the item to Frame with an Architecture Agent handoff for Gate 2 Exam design.', ?
       FROM work_items w
       WHERE w.gate = 'Gate 2 pending'
         AND w.decision_status = 'Waiting'
         AND w.phase = 'Frame'
         AND EXISTS (
           SELECT 1 FROM decisions d
           WHERE d.item_id = w.id
             AND d.gate = 'Gate 1 pending'
             AND d.decision = 'APPROVED'
         )
         AND NOT EXISTS (
           SELECT 1 FROM activity a
           WHERE a.item_id = w.id
             AND a.action = 'workflow'
             AND a.detail = 'Gate 1 approval advanced the item to Frame with an Architecture Agent handoff for Gate 2 Exam design.'
         )`,
    ).bind(now),
  ]);
}

async function backfillExplicitEngineeringRecords(db: Database) {
  const candidates = await db.prepare(
    "SELECT id, description FROM work_items WHERE github_url IS NULL OR TRIM(github_url) = ''",
  ).all<{ id: number; description: string }>();
  const now = new Date().toISOString();
  const statements: Statement[] = [];
  for (const item of candidates.results ?? []) {
    const recordUrl = engineeringRecordFromDescription(item.description);
    if (!recordUrl) continue;
    statements.push(
      db.prepare("UPDATE work_items SET github_url = ?, updated_at = ? WHERE id = ? AND (github_url IS NULL OR TRIM(github_url) = '')")
        .bind(recordUrl, now, item.id),
      db.prepare("INSERT INTO activity (item_id, actor_id, action, detail, created_at) VALUES (?, 'system', 'workflow', ?, ?)")
        .bind(item.id, `Restored the durable engineering record from the explicit work-item description: ${recordUrl}`, now),
    );
  }
  if (statements.length) await db.batch(statements);
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

async function bootstrap(db: Database, user: User, env: Env) {
  await ensureSchemaReady(db);
  await ensureCurrentUser(db, user);
  await ensureHumanSeats(db);
  await ensureSeedData(db, user);
  await ensureInitialSteerRoute(db, user);
  await backfillReworkState(db);
  await backfillApprovedGateOneHandoffs(db);
  await backfillExplicitEngineeringRecords(db);
  const generatedAt = new Date().toISOString();
  const [items, members, activity, decisions, reviews, notifications, currentMember, economicsEvents] = await Promise.all([
    db.prepare(
      `SELECT w.*, m.display_name AS assignee_name, m.kind AS assignee_kind,
         (SELECT o.intent_id FROM dispatch_outbox o JOIN dispatch_receipts r ON r.intent_id = o.intent_id
          WHERE r.item_id = w.id ORDER BY r.created_at DESC LIMIT 1) AS dispatch_intent_id,
         (SELECT o.current_state FROM dispatch_outbox o JOIN dispatch_receipts r ON r.intent_id = o.intent_id
          WHERE r.item_id = w.id ORDER BY r.created_at DESC LIMIT 1) AS dispatch_state,
         (SELECT o.current_event_version FROM dispatch_outbox o JOIN dispatch_receipts r ON r.intent_id = o.intent_id
          WHERE r.item_id = w.id ORDER BY r.created_at DESC LIMIT 1) AS dispatch_event_version,
         (SELECT r.authorization_revision FROM dispatch_receipts r
          WHERE r.item_id = w.id ORDER BY r.created_at DESC LIMIT 1) AS dispatch_authorization_revision,
         (SELECT o.updated_at FROM dispatch_outbox o JOIN dispatch_receipts r ON r.intent_id = o.intent_id
          WHERE r.item_id = w.id ORDER BY r.created_at DESC LIMIT 1) AS dispatch_updated_at,
         (SELECT a.created_at FROM activity a
          WHERE a.item_id = w.id AND a.action = 'updated' AND a.detail = 'state → complete'
          ORDER BY a.created_at DESC, a.id DESC LIMIT 1) AS closed_at
       FROM work_items w LEFT JOIN members m ON m.id = w.assignee_id
       WHERE w.pod_id = (SELECT pod_id FROM members WHERE id = ?)
       ORDER BY CASE w.priority WHEN 'Now' THEN 0 WHEN 'Next' THEN 1 ELSE 2 END, w.updated_at DESC`,
    ).bind(user.id).all(),
    db.prepare("SELECT * FROM members WHERE pod_id = (SELECT pod_id FROM members WHERE id = ?) ORDER BY kind DESC, display_name").bind(user.id).all(),
    db.prepare(
      `SELECT a.*, w.key AS item_key, w.title AS item_title, m.display_name AS actor_name
       FROM activity a JOIN work_items w ON w.id = a.item_id
       LEFT JOIN members m ON m.id = a.actor_id
       WHERE w.pod_id = (SELECT pod_id FROM members WHERE id = ?)
       ORDER BY a.created_at DESC`,
    ).bind(user.id).all(),
    db.prepare(
      `SELECT d.*, w.key AS item_key, w.title AS item_title
       FROM decisions d JOIN work_items w ON w.id = d.item_id
       WHERE w.pod_id = (SELECT pod_id FROM members WHERE id = ?) ORDER BY d.created_at DESC`,
    ).bind(user.id).all(),
    db.prepare(
      `SELECT r.*, w.key AS item_key, w.title AS item_title
       FROM agent_reviews r JOIN work_items w ON w.id = r.item_id
       WHERE w.pod_id = (SELECT pod_id FROM members WHERE id = ?) ORDER BY r.created_at DESC`,
    ).bind(user.id).all(),
    db.prepare(
      `SELECT n.*, w.key AS item_key, w.title AS item_title, m.display_name AS member_name
       FROM notifications n JOIN work_items w ON w.id = n.item_id
       LEFT JOIN members m ON m.id = n.member_id
       WHERE w.pod_id = (SELECT pod_id FROM members WHERE id = ?)
       ORDER BY n.created_at DESC`,
    ).bind(user.id).all(),
    db.prepare("SELECT role, authority, pod_id FROM members WHERE id = ?").bind(user.id).first<{ role: string; authority: string; pod_id: string }>(),
    db.prepare(
      `SELECT e.*, w.key AS item_key, w.title AS item_title, m.display_name AS actor_name
       FROM work_economics_events e JOIN work_items w ON w.id = e.item_id
       LEFT JOIN members m ON m.id = e.actor_id
       WHERE w.pod_id = (SELECT pod_id FROM members WHERE id = ?)
       ORDER BY e.created_at DESC`,
    ).bind(user.id).all(),
  ]);
  const parsedReviews = (reviews.results ?? []).map((review) => ({
    ...review,
    findings: JSON.parse(String((review as Record<string, unknown>).findings_json ?? "[]")),
    dependencies: JSON.parse(String((review as Record<string, unknown>).dependencies_json ?? "[]")),
    impacts: JSON.parse(String((review as Record<string, unknown>).impacts_json ?? "[]")),
    actions: JSON.parse(String((review as Record<string, unknown>).actions_json ?? "[]")),
    derived_tags: JSON.parse(String((review as Record<string, unknown>).derived_tags_json ?? "[]")),
  }));
  const deploymentEnvironment = String(env.STEER_DEPLOYMENT_ENV ?? "production");
  const classifiedItems = (items.results ?? []).map((item) => ({
    ...item,
    work_economics: safeEconomicsFromRow(item as Record<string, unknown>, generatedAt),
    dispatch_authorization: evaluateAgentDispatch(item as Record<string, unknown>),
    verification_classification: classifyVerificationFixture(item as Record<string, unknown>, deploymentEnvironment),
  })) as unknown as Array<Record<string, unknown> & { id: number; key: string; state: string; assignee_name?: string | null; work_economics: ReturnType<typeof safeEconomicsFromRow>; verification_classification: ReturnType<typeof classifyVerificationFixture> }>;
  const verificationFixtureIds = new Set(classifiedItems.filter((item) => item.verification_classification.is_fixture).map((item) => Number(item.id)));
  const operationalItems = classifiedItems.filter((item) => !verificationFixtureIds.has(Number(item.id)));
  const verificationFixtures = classifiedItems.filter((item) => verificationFixtureIds.has(Number(item.id)));
  const operationalRecord = (record: Record<string, unknown>) => !verificationFixtureIds.has(Number(record.item_id));
  const verificationRecord = (record: Record<string, unknown>) => verificationFixtureIds.has(Number(record.item_id));
  const operationalMembers = (members.results ?? []).filter((member) => !isIssue74VerificationMember(member as Record<string, unknown>, deploymentEnvironment));
  const verificationMembers = (members.results ?? []).filter((member) => isIssue74VerificationMember(member as Record<string, unknown>, deploymentEnvironment));
  const operationalActivity = (activity.results ?? []).filter((record) => operationalRecord(record as Record<string, unknown>)).slice(0, 80);
  const verificationActivity = (activity.results ?? []).filter((record) => verificationRecord(record as Record<string, unknown>));
  const operationalDecisions = (decisions.results ?? []).filter((record) => operationalRecord(record as Record<string, unknown>));
  const verificationDecisions = (decisions.results ?? []).filter((record) => verificationRecord(record as Record<string, unknown>));
  const operationalReviews = parsedReviews.filter((record) => operationalRecord(record as Record<string, unknown>));
  const verificationReviews = parsedReviews.filter((record) => verificationRecord(record as Record<string, unknown>));
  const operationalNotifications = (notifications.results ?? []).filter((record) => operationalRecord(record as Record<string, unknown>)).slice(0, 80);
  const verificationNotifications = (notifications.results ?? []).filter((record) => verificationRecord(record as Record<string, unknown>));
  const parsedEconomicsEvents = (economicsEvents.results ?? []).map((event) => safeEconomicsEvent(event as Record<string, unknown>));
  const operationalEconomicsEvents = parsedEconomicsEvents.filter((record) => operationalRecord(record as Record<string, unknown>)).slice(0, 120);
  const verificationEconomicsEvents = parsedEconomicsEvents.filter((record) => verificationRecord(record as Record<string, unknown>));
  const privacyPolicy = await db.prepare(`SELECT policy_version, status, inventory_url, inventory_sha256,
      ruling_url, ruling_sha256, authorization_event_id, activation_receipt_sha256
    FROM dispatch_privacy_policies WHERE pod_id = ? ORDER BY policy_version DESC LIMIT 1`)
    .bind(currentMember?.pod_id ?? "steer-flight-team").first<Record<string, unknown>>();
  const decisionPolicy = await db.prepare(`SELECT policy_version, operating_mode, required_countersignatures,
      cooling_hours, status, ruling_url, ruling_sha256, created_at
    FROM decision_signer_policies WHERE pod_id = ? ORDER BY policy_version DESC LIMIT 1`)
    .bind(currentMember?.pod_id ?? "steer-flight-team").first<Record<string, unknown>>();
  const readinessPolicy = await db.prepare(`SELECT policy_version, policy_json, policy_sha256, status,
      ruling_url, ruling_sha256, created_at
    FROM decision_readiness_policies WHERE pod_id = ? ORDER BY policy_version DESC LIMIT 1`)
    .bind(currentMember?.pod_id ?? "steer-flight-team").first<Record<string, unknown>>();
  const readinessRows = await db.prepare(`SELECT * FROM decision_readiness_snapshots
    WHERE pod_id = ? ORDER BY created_at DESC LIMIT 80`)
    .bind(currentMember?.pod_id ?? "steer-flight-team").all<Record<string, unknown>>();
  const releaseReadiness = await Promise.all((readinessRows.results ?? []).map((row) => releaseReadinessView(db, row, env, generatedAt)));
  const configuredDecisionKeyId = String(env.DECISION_SERVICE_KEY_ID ?? "");
  const configuredDecisionKeyVersion = Number(env.DECISION_SERVICE_KEY_VERSION ?? 0);
  const configuredDecisionPrivateKey = String(env.DECISION_SERVICE_PRIVATE_KEY ?? "");
  const configuredDecisionPublicKey = /^[0-9a-f]{64}$/.test(configuredDecisionPrivateKey)
    ? decisionIssuerPublicKey(configuredDecisionPrivateKey)
    : null;
  const activeDecisionIssuer = configuredDecisionPublicKey && configuredDecisionKeyId && Number.isInteger(configuredDecisionKeyVersion) && configuredDecisionKeyVersion > 0
    ? await db.prepare(`SELECT key_id, key_version, public_key, status, created_at FROM decision_issuer_signers
      WHERE pod_id = ? AND key_id = ? AND key_version = ? ORDER BY created_at DESC LIMIT 1`)
      .bind(currentMember?.pod_id ?? "steer-flight-team", configuredDecisionKeyId, configuredDecisionKeyVersion).first<Record<string, unknown>>()
    : null;
  const decisionReceipts = await db.prepare(`SELECT i.intent_id, i.receipt_id, i.item_id, i.current_state,
      i.current_sequence, i.current_event_sha256, i.intent_json, i.created_at, i.updated_at,
      w.key AS item_key, w.title AS item_title
    FROM decision_intents i JOIN work_items w ON w.id = i.item_id
    WHERE i.pod_id = ? ORDER BY i.created_at DESC`)
    .bind(currentMember?.pod_id ?? "steer-flight-team").all<Record<string, unknown>>();
  const mappedDecisionReceipts = (decisionReceipts.results ?? []).map((receipt) => {
    const intent = JSON.parse(String(receipt.intent_json)) as DecisionIntentPayload;
    return {
      intent_id: receipt.intent_id, receipt_id: receipt.receipt_id, item_id: receipt.item_id,
      item_key: receipt.item_key, item_title: receipt.item_title, state: receipt.current_state,
      sequence: receipt.current_sequence, latest_event_sha256: receipt.current_event_sha256,
      decision_kind: intent.decision_kind, decision: intent.decision,
      operating_mode: intent.operating_mode, signer_policy_version: intent.signer_policy_version,
      required_countersignatures: intent.required_countersignatures,
      readiness_snapshot_sha256: intent.readiness_snapshot_sha256 ?? null,
      effective_not_before: intent.effective_not_before, submitted_at: intent.submitted_at,
      created_at: receipt.created_at, updated_at: receipt.updated_at,
    };
  });
  return {
    generated_at: generatedAt,
    user: { ...user, role: currentMember?.role ?? "Contributor", authority: currentMember?.authority ?? "May own work", role_contexts: roleContexts(currentMember?.role ?? "Contributor") },
    items: operationalItems,
    verification_fixtures: verificationFixtures,
    members: operationalMembers,
    verification_members: verificationMembers,
    activity: operationalActivity,
    verification_activity: verificationActivity,
    decisions: operationalDecisions,
    verification_decisions: verificationDecisions,
    reviews: operationalReviews,
    verification_reviews: verificationReviews,
    notifications: operationalNotifications,
    verification_notifications: verificationNotifications,
    work_economics_events: operationalEconomicsEvents,
    verification_work_economics_events: verificationEconomicsEvents,
    pull_forecast: buildPullForecast(operationalItems, 2, generatedAt),
    service_level_distributions: buildServiceLevelDistributions(operationalItems),
    privacy_policy: privacyPolicy ?? null,
    decision_policy: decisionPolicy ?? null,
    release_readiness_policy: readinessPolicy ? { ...readinessPolicy, policy: JSON.parse(String(readinessPolicy.policy_json)) } : null,
    decision_issuer: configuredDecisionPublicKey ? {
      configured: true,
      key_id: configuredDecisionKeyId,
      key_version: configuredDecisionKeyVersion,
      public_key: configuredDecisionPublicKey,
      status: activeDecisionIssuer?.status === "ACTIVE" && activeDecisionIssuer.public_key === configuredDecisionPublicKey ? "ACTIVE" : "INACTIVE",
    } : { configured: false, key_id: null, key_version: null, public_key: null, status: "UNAVAILABLE" },
    deployment_environment: deploymentEnvironment,
    release_readiness: releaseReadiness.filter((entry) => !verificationFixtureIds.has(Number(entry.snapshot.work_item_id))),
    verification_release_readiness: releaseReadiness.filter((entry) => verificationFixtureIds.has(Number(entry.snapshot.work_item_id))),
    decision_receipts: mappedDecisionReceipts.filter((entry) => !verificationFixtureIds.has(Number(entry.item_id))),
    verification_decision_receipts: mappedDecisionReceipts.filter((entry) => verificationFixtureIds.has(Number(entry.item_id))),
  };
}

async function authorizeAgentDispatch(db: Database, env: Env, user: User, itemId: number) {
  const actor = await memberContext(db, user);
  if (actor?.kind !== "human") return json({ error: "Only an authenticated human POD member may authorize agent dispatch." }, 403);
  const item = await db.prepare(
    `SELECT w.*, m.display_name AS assignee_name, m.kind AS assignee_kind, m.role AS assignee_role,
            m.agent_key_id, m.agent_key_version, m.agent_public_key, m.agent_public_key_fingerprint
     FROM work_items w JOIN members actor ON actor.id = ? AND actor.pod_id = w.pod_id
     LEFT JOIN members m ON m.id = w.assignee_id WHERE w.id = ?`,
  ).bind(user.id, itemId).first<Record<string, unknown>>();
  if (!item) {
    await auditItemControlDenial(db, user, itemId, "dispatch");
    return json({ error: "Work item not found in your POD." }, 404);
  }

  const authorization = evaluateAgentDispatch(item);
  if (!authorization.authorized || !authorization.handoff_message) {
    return json({ error: authorization.summary, authorization }, 409);
  }

  const now = new Date().toISOString();
  const podId = String(item.pod_id ?? "steer-flight-team");
  const assigneeId = String(item.assignee_id ?? "");
  const routeRow = await db.prepare(
    `SELECT r.*, COALESCE(m.membership_version, 0) AS membership_version,
            CASE WHEN m.status = 'active' THEN 1 ELSE 0 END AS agent_is_member,
            CASE WHEN c.channel_id IS NOT NULL AND c.status = 'ACTIVE' THEN 1 ELSE 0 END AS channel_known,
            CASE WHEN c.channel_name = r.channel_name THEN 1 ELSE 0 END AS channel_name_matches,
            CASE WHEN c.relay_url = r.relay_url THEN 1 ELSE 0 END AS relay_binding_matches,
            CASE WHEN c.pod_id = r.pod_id THEN 1 ELSE 0 END AS workspace_binding_matches,
            COALESCE(publisher.registry_version, 0) AS relay_publisher_registry_version,
            COALESCE(publisher.key_id, '') AS relay_publisher_key_id,
            COALESCE(publisher.key_version, 0) AS relay_publisher_key_version,
            COALESCE(publisher.public_key, '') AS relay_publisher_public_key,
            CASE WHEN EXISTS (
              SELECT 1 FROM workspace_routing_conflicts conflict
              WHERE conflict.pod_id = r.pod_id AND conflict.route_key = r.route_key AND conflict.status = 'ACTIVE'
            ) THEN 1 ELSE 0 END AS competing_source
     FROM workspace_routing r
     LEFT JOIN buzz_channel_registry c
       ON c.pod_id = r.pod_id AND c.channel_id = r.channel_id
      AND c.registry_version = (SELECT MAX(c2.registry_version) FROM buzz_channel_registry c2
        WHERE c2.pod_id = r.pod_id AND c2.channel_id = r.channel_id)
     LEFT JOIN agent_channel_memberships m
       ON m.pod_id = r.pod_id AND m.channel_id = r.channel_id AND m.member_id = ?
      AND m.membership_version = (SELECT MAX(m2.membership_version) FROM agent_channel_memberships m2
        WHERE m2.pod_id = r.pod_id AND m2.channel_id = r.channel_id AND m2.member_id = ?)
     LEFT JOIN relay_event_signers publisher
       ON publisher.pod_id = r.pod_id AND publisher.relay_url = r.relay_url AND publisher.channel_id = r.channel_id
      AND publisher.registry_version = (SELECT MAX(p2.registry_version) FROM relay_event_signers p2
        WHERE p2.pod_id = r.pod_id AND p2.relay_url = r.relay_url AND p2.channel_id = r.channel_id)
     WHERE r.pod_id = ? AND r.route_key = ?
     ORDER BY r.configuration_version DESC LIMIT 1`,
  ).bind(assigneeId, assigneeId, podId, STEER_HANDOFF_ROUTE_KEY).first<Record<string, unknown>>();
  const route: DispatchRoute | null = routeRow ? {
    podId: String(routeRow.pod_id),
    configurationVersion: Number(routeRow.configuration_version),
    channelId: String(routeRow.channel_id),
    channelName: String(routeRow.channel_name),
    relayUrl: String(routeRow.relay_url),
    membershipVersion: Number(routeRow.membership_version),
    agentMemberId: assigneeId,
    agentIsMember: Boolean(routeRow.agent_is_member),
    channelKnown: Boolean(routeRow.channel_known),
    channelNameMatches: Boolean(routeRow.channel_name_matches),
    relayBindingMatches: Boolean(routeRow.relay_binding_matches),
    workspaceBindingMatches: Boolean(routeRow.workspace_binding_matches),
    competingSource: Boolean(routeRow.competing_source),
  } : null;
  const routeCheck = validateDispatchRoute(route, podId, assigneeId);
  if (!route || !routeCheck.ok) {
    await db.prepare("INSERT INTO dispatch_security_diagnostics (code, configuration_version, observed_at) VALUES (?, ?, ?)")
      .bind(routeCheck.code, route?.configurationVersion ?? null, new Date().toISOString()).run();
    return json({ error: routeCheck.detail, code: routeCheck.code, authorization }, 409);
  }

  const agentKeyId = String(item.agent_key_id ?? "");
  const agentKeyVersion = Number(item.agent_key_version ?? 0);
  const agentPublicKey = String(item.agent_public_key ?? "");
  const agentPublicKeyFingerprint = String(item.agent_public_key_fingerprint ?? "");
  if (!agentKeyId || !Number.isInteger(agentKeyVersion) || agentKeyVersion < 1 || !/^[0-9a-f]{64}$/.test(agentPublicKey) || !/^[0-9a-f]{64}$/.test(agentPublicKeyFingerprint)) {
    return json({ error: "The assigned agent has no active versioned acknowledgement key enrollment.", code: "AGENT_KEY_NOT_ENROLLED", authorization }, 409);
  }

  const privacyPolicyCheck = await validateLatestPrivacyPolicy(db, podId, env.DISPATCH_ALLOW_TEST_PRIVACY_POLICY === "true");
  if (!privacyPolicyCheck.ok) return json({ error: privacyPolicyCheck.error, code: privacyPolicyCheck.code, authorization }, 409);
  const privacyPolicy = privacyPolicyCheck.policy!;
  const privacyPolicyStatus = String(privacyPolicy.status);

  const evidence = await readEvidence(item.evidence_url);
  const exactEvidence = exactGitEvidence(item.evidence_url);
  if (!exactEvidence || !evidence.sha256 || evidence.revision !== exactEvidence.revision) {
    return json({ error: "Dispatch evidence must resolve to an immutable GitHub blob revision and exact content digest.", code: "EVIDENCE_REVISION_UNRESOLVED", authorization }, 409);
  }
  let forecastAcceptedAt = "not-required";
  let forecastAuditEventId = "not-required";
  if (String(item.workflow) === "STEER") {
    try { forecastAcceptedAt = String((JSON.parse(String(item.delivery_forecast_json)) as Record<string, unknown>).acceptedAt ?? ""); } catch { forecastAcceptedAt = ""; }
    if (!forecastAcceptedAt) return json({ error: "The accepted forecast has no durable acceptance timestamp.", code: "FORECAST_AUDIT_MISSING", authorization }, 409);
    const forecastEvent = await db.prepare(`SELECT id, replacement_json FROM work_economics_events
      WHERE item_id = ? AND section = 'deliveryForecast' AND action IN ('accepted','corrected') ORDER BY id DESC LIMIT 1`)
      .bind(itemId).first<{ id: number; replacement_json: string }>();
    let eventAcceptedAt = "";
    try { eventAcceptedAt = String((JSON.parse(String(forecastEvent?.replacement_json ?? "{}")) as Record<string, unknown>).acceptedAt ?? ""); } catch { eventAcceptedAt = ""; }
    if (!forecastEvent || eventAcceptedAt !== forecastAcceptedAt) return json({ error: "The accepted forecast does not resolve to its append-only audit event.", code: "FORECAST_AUDIT_MISSING", authorization }, 409);
    forecastAuditEventId = `work-economics:${forecastEvent.id}`;
  }
  const authorizationRevision = String(item.updated_at);
  const relayPublisherRegistryVersion = Number(routeRow?.relay_publisher_registry_version ?? 0);
  const relayPublisherKeyId = String(routeRow?.relay_publisher_key_id ?? "");
  const relayPublisherKeyVersion = Number(routeRow?.relay_publisher_key_version ?? 0);
  const relayPublisherPublicKey = String(routeRow?.relay_publisher_public_key ?? "");
  const authorizationAuditEventId = `dispatch-authorize:${itemId}:${authorizationRevision}:${user.id}:${route.configurationVersion}:${route.membershipVersion}:${relayPublisherRegistryVersion}:${exactEvidence.revision}`;
  const currentNextActionDigest = await sha256Hex(String(item.next_action).trim());
  const predecessor = await db.prepare(`SELECT r.intent_id, r.lineage_id, r.receipt_json,
      o.current_state, o.current_event_version, o.current_event_sha256, o.send_started,
      o.reconciliation_required, o.lease_id, o.terminalization_requested
    FROM dispatch_receipts r JOIN dispatch_outbox o ON o.intent_id = r.intent_id
    WHERE r.item_id = ? ORDER BY o.id DESC LIMIT 1`).bind(itemId).first<Record<string, unknown>>();
  let predecessorIntentId: string | null = null;
  let predecessorTerminalState: "SUPERSEDED" | "CANCELLED" | null = null;
  let predecessorAttemptUnresolved = false;
  let predecessorClosesSameLineage = false;
  let rootAuthorizationAuditEventId = authorizationAuditEventId;
  if (predecessor) {
    const priorReceipt = JSON.parse(String(predecessor.receipt_json)) as Record<string, unknown>;
    const sameLineageAuthority = String(priorReceipt.workspace_pod_id) === podId
      && Number(priorReceipt.work_item_stable_id) === itemId
      && String(priorReceipt.work_item_key) === String(item.key)
      && String(priorReceipt.workflow) === String(item.workflow)
      && String(priorReceipt.assigned_role) === String(item.assignee_role)
      && String(priorReceipt.enrolled_agent_member_id) === assigneeId
      && String(priorReceipt.authorized_next_action_sha256) === currentNextActionDigest;
    if (sameLineageAuthority) {
      rootAuthorizationAuditEventId = String(priorReceipt.root_human_authorization_audit_event_id ?? priorReceipt.human_authorization_audit_event_id);
    }
    const predecessorIsTerminal = ["ACKNOWLEDGED", "FAILED_FINAL", "CANCELLED", "SUPERSEDED"].includes(String(predecessor.current_state));
    predecessorClosesSameLineage = predecessorIsTerminal && sameLineageAuthority;
    if (!predecessorIsTerminal) {
      predecessorAttemptUnresolved = Boolean(predecessor.send_started) || Boolean(predecessor.reconciliation_required) || Boolean(predecessor.lease_id);
      predecessorIntentId = String(predecessor.intent_id);
      predecessorTerminalState = sameLineageAuthority ? "SUPERSEDED" : "CANCELLED";
    }
  }
  const identity = await buildDispatchIdentity({
    podId, itemId, itemKey: String(item.key), workflow: String(item.workflow),
    agentMemberId: assigneeId, agentKeyId, agentKeyVersion, agentPublicKey, agentPublicKeyFingerprint,
    authorizationRevision, authorizationAuditEventId, rootAuthorizationAuditEventId, evidenceUrl: exactEvidence.url,
    evidenceRevision: exactEvidence.revision, evidenceSha256: evidence.sha256,
    forecastAuditEventId, channelId: route.channelId, routingConfigurationVersion: route.configurationVersion,
    relayUrl: route.relayUrl, membershipVersion: route.membershipVersion,
    relayPublisherRegistryVersion, relayPublisherKeyId, relayPublisherKeyVersion, relayPublisherPublicKey,
    nextAction: String(item.next_action),
  });
  const existing = await db.prepare("SELECT receipt_json FROM dispatch_receipts WHERE intent_id = ?").bind(identity.intentId).first<{ receipt_json: string }>();
  if (existing) {
    return json({ ok: true, idempotent_replay: true, receipt: JSON.parse(existing.receipt_json), authorization: { ...authorization, channel: route.channelName }, snapshot: await authoritativeItemSnapshot(db, env, user, itemId) });
  }
  if (predecessorClosesSameLineage) {
    return json({ error: "The prior terminal dispatch closes this authorization lineage; a changed objective requires a new human authorization.", code: "PREDECESSOR_LINEAGE_CLOSED", authorization }, 409);
  }
  if (predecessorAttemptUnresolved) {
    return json({ error: "Explicit reauthorization must wait until the prior send attempt and reconciliation are resolved.", code: "PREDECESSOR_ATTEMPT_UNRESOLVED", authorization }, 409);
  }

  const allowedScope = { next_action: String(item.next_action), evidence_url: exactEvidence.url };
  const prohibitedScope = { merge: true, deploy: true, release: true, human_gate_ruling: true, external_action_beyond_handoff: true };
  const handoffMessage = `[${String(item.key)}] Authorized handoff to ${String(item.assignee_name)}. Receipt: ${identity.intentId}. Channel: ${route.channelName} (${route.channelId}). Next action: ${String(item.next_action)} Evidence: ${exactEvidence.url} Prohibited: merge, deployment, release, or any human gate ruling without a separate authenticated approval.`;
  const authorizedHandoffSha256 = await sha256Hex(handoffMessage);
  const receipt = {
    schema: "steer-dispatch-receipt/v1", receipt_id: identity.intentId,
    dispatch_intent_id: identity.intentId, dispatch_claim_lineage_id: identity.lineageId,
    workspace_pod_id: podId, work_item_stable_id: itemId, work_item_key: String(item.key),
    authorization_revision: authorizationRevision, receipt_created_at: now, workflow: String(item.workflow),
    authoritative_item_state: String(item.state), assigned_role: String(item.assignee_role),
    enrolled_agent_member_id: assigneeId, enrolled_agent_key_id: agentKeyId,
    enrolled_agent_key_version: agentKeyVersion, enrolled_agent_public_key_fingerprint: agentPublicKeyFingerprint,
    allowed_scope: allowedScope, prohibited_scope: prohibitedScope,
    evidence_url: exactEvidence.url, evidence_revision: exactEvidence.revision, evidence_sha256: evidence.sha256,
    accepted_forecast_timestamp: forecastAcceptedAt, accepted_forecast_audit_event_id: forecastAuditEventId,
    human_authorization_timestamp: now, human_authorization_actor_id: user.id,
    human_authorization_audit_event_id: authorizationAuditEventId,
    root_human_authorization_audit_event_id: rootAuthorizationAuditEventId,
    predecessor_intent_id: predecessorIntentId,
    canonical_channel_id: route.channelId, canonical_channel_name: route.channelName,
    routing_configuration_version: route.configurationVersion, membership_version: route.membershipVersion,
    relay_publisher_registry_version: relayPublisherRegistryVersion,
    relay_publisher_key_id: relayPublisherKeyId,
    relay_publisher_key_version: relayPublisherKeyVersion,
    relay_publisher_public_key: relayPublisherPublicKey,
    privacy_policy_version: Number(privacyPolicy.policy_version), privacy_policy_status: privacyPolicyStatus,
    privacy_inventory_url: String(privacyPolicy.inventory_url), privacy_inventory_sha256: String(privacyPolicy.inventory_sha256),
    privacy_ruling_url: String(privacyPolicy.ruling_url ?? ""), privacy_ruling_sha256: String(privacyPolicy.ruling_sha256 ?? ""),
    privacy_policy_authorization_event_id: String(privacyPolicy.authorization_event_id ?? ""),
    privacy_policy_activation_receipt_sha256: String(privacyPolicy.activation_receipt_sha256 ?? ""),
    authorized_next_action_sha256: identity.nextActionDigest,
    authorized_handoff_sha256: authorizedHandoffSha256,
    authorized_handoff_message: handoffMessage,
    acknowledgement_policy: "exact-enrolled-agent-signature-required",
  };
  let dispatchSigner: Awaited<ReturnType<typeof ensureDispatchServiceSigner>>;
  try {
    dispatchSigner = await ensureDispatchServiceSigner(db, podId, user.id, env, now);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Dispatch signing is unavailable.", code: "DISPATCH_SIGNER_UNAVAILABLE", authorization }, 503);
  }
  const queuedEvent = await buildInitialQueuedEvent({
    intentId: identity.intentId,
    lineageId: identity.lineageId,
    occurredAt: now,
    routingConfigurationVersion: route.configurationVersion,
    evidenceRevision: exactEvidence.revision,
    signer: dispatchSigner,
  });
  const predecessorStatements: Statement[] = [];
  if (predecessorIntentId && predecessorIntentId !== identity.intentId && predecessor && predecessorTerminalState) {
    const priorReceipt = JSON.parse(String(predecessor.receipt_json)) as Record<string, unknown>;
    const predecessorEvent = await createSignedDispatchEvent({
      intentId: predecessorIntentId,
      lineageId: String(predecessor.lineage_id),
      eventVersion: Number(predecessor.current_event_version) + 1,
      previousEventSha256: String(predecessor.current_event_sha256),
      eventType: predecessorTerminalState,
      priorState: String(predecessor.current_state) as DispatchState,
      resultingState: predecessorTerminalState,
      occurredAt: now,
      authority: "work-management-authorization",
      receiptId: predecessorIntentId,
      routingConfigurationVersion: Number(priorReceipt.routing_configuration_version),
      evidenceRevision: String(priorReceipt.evidence_revision),
      payload: {
        successor_intent_id: identity.intentId,
        successor_lineage_id: identity.lineageId,
        human_reauthorization_audit_event_id: authorizationAuditEventId,
        disposition_reason: predecessorTerminalState === "SUPERSEDED" ? "same-lineage-explicit-reauthorization" : "authorization-objective-or-assignment-changed",
      },
      serviceKeyId: dispatchSigner.keyId,
      serviceKeyVersion: dispatchSigner.keyVersion,
      servicePrivateKey: dispatchSigner.privateKey,
    });
    predecessorStatements.push(
      db.prepare(`INSERT INTO dispatch_events
        (intent_id, event_version, expected_event_version, event_type, prior_state, resulting_state, payload_json,
         previous_event_sha256, event_sha256, service_key_id, service_key_version, service_signature,
         agent_key_id, agent_key_version, agent_signature, acknowledgement_sha256, actor_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, ?, ?)`)
        .bind(predecessorIntentId, predecessorEvent.payload.event_version, predecessorEvent.payload.expected_event_version,
          predecessorTerminalState, predecessorEvent.payload.prior_state, predecessorTerminalState,
          canonicalJson(predecessorEvent.envelope), predecessorEvent.payload.previous_event_sha256,
          predecessorEvent.eventSha256, dispatchSigner.keyId, dispatchSigner.keyVersion, predecessorEvent.envelope.service_signature, user.id, now),
      db.prepare(`UPDATE dispatch_outbox SET status = ?, current_state = ?,
        current_event_version = ?, current_event_sha256 = ?, lease_id = NULL, lease_expires_at = NULL,
        reservation_fence = NULL, send_started = 0, reconciliation_required = 0, updated_at = ?
        WHERE intent_id = ? AND current_event_version = ? AND current_event_sha256 = ?`)
        .bind(predecessorTerminalState, predecessorTerminalState, predecessorEvent.payload.event_version, predecessorEvent.eventSha256, now, predecessorIntentId,
          predecessorEvent.payload.expected_event_version, predecessorEvent.payload.previous_event_sha256),
    );
  }
  const authorizationAudit = {
    schema: "steer-dispatch-authorization-audit/v1",
    audit_event_id: authorizationAuditEventId,
    dispatch_intent_id: identity.intentId,
    workspace_pod_id: podId,
    work_item_stable_id: itemId,
    work_item_key: String(item.key),
    authorization_revision: authorizationRevision,
    human_actor_id: user.id,
    assigned_agent_member_id: assigneeId,
    allowed_scope: allowedScope,
    prohibited_scope: prohibitedScope,
    evidence_revision: exactEvidence.revision,
    canonical_channel_id: route.channelId,
    routing_configuration_version: route.configurationVersion,
    occurred_at: now,
  };
  try {
    await db.batch([
      ...predecessorStatements,
      db.prepare("INSERT INTO activity (item_id, actor_id, action, detail, created_at) VALUES (?, ?, 'dispatch_authorized', ?, ?)")
        .bind(itemId, user.id, `authorized agent handoff receipt ${identity.intentId} to ${String(item.assignee_name)} in ${route.channelName} (${route.channelId})`, now),
      db.prepare(`INSERT INTO dispatch_authorization_audits
      (audit_event_id, intent_id, item_id, pod_id, authorization_revision, authorization_json, actor_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(authorizationAuditEventId, identity.intentId, itemId, podId, authorizationRevision, JSON.stringify(authorizationAudit), user.id, now),
      db.prepare(`INSERT INTO dispatch_receipts
      (intent_id, lineage_id, item_id, pod_id, authorization_revision, channel_id, configuration_version, receipt_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(identity.intentId, identity.lineageId, itemId, podId, authorizationRevision, route.channelId, route.configurationVersion, JSON.stringify(receipt), now),
      db.prepare(`INSERT INTO dispatch_outbox
      (intent_id, receipt_id, member_id, channel_id, channel_name, status, current_state, current_event_version,
       current_event_sha256, attempt_number, send_started, reconciliation_required, terminalization_requested,
       relay_url, routing_configuration_version, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'QUEUED', 'QUEUED', 0, ?, 0, 0, 0, 0, ?, ?, ?, ?)`)
      .bind(identity.intentId, identity.intentId, assigneeId, route.channelId, route.channelName, queuedEvent.eventSha256, route.relayUrl, route.configurationVersion, now, now),
      db.prepare(`INSERT INTO dispatch_events
      (intent_id, event_version, expected_event_version, event_type, prior_state, resulting_state, payload_json,
       previous_event_sha256, event_sha256, service_key_id, service_key_version, service_signature,
       agent_key_id, agent_key_version, agent_signature, acknowledgement_sha256, actor_id, created_at)
      VALUES (?, 0, -1, 'QUEUED', NULL, 'QUEUED', ?, NULL, ?, ?, ?, ?, NULL, NULL, NULL, NULL, ?, ?)`)
      .bind(identity.intentId, canonicalJson(queuedEvent.envelope), queuedEvent.eventSha256, dispatchSigner.keyId, dispatchSigner.keyVersion, queuedEvent.envelope.service_signature, user.id, now),
      db.prepare(
        `INSERT OR IGNORE INTO notifications
       (dedupe_key, item_id, member_id, recipient_role, kind, title, body, channel, status, created_at)
       VALUES (?, ?, ?, ?, 'agent_handoff', ?, ?, ?, 'queued', ?)`,
      ).bind(
        `dispatch-${identity.intentId}`,
        itemId,
        String(item.assignee_id),
        String(item.assignee_role ?? "Assigned agent"),
        `${String(item.key)} authorized for agent handoff`,
        handoffMessage,
        route.channelName,
        now,
      ),
    ]);
  } catch (error) {
    const raced = await db.prepare("SELECT receipt_json FROM dispatch_receipts WHERE intent_id = ?").bind(identity.intentId).first<{ receipt_json: string }>();
    if (!raced) throw error;
    return json({ ok: true, idempotent_replay: true, receipt: JSON.parse(raced.receipt_json), authorization: { ...authorization, channel: route.channelName }, snapshot: await authoritativeItemSnapshot(db, env, user, itemId) });
  }
  return json({ ok: true, idempotent_replay: false, authorization: { ...authorization, channel: route.channelName }, receipt, message: handoffMessage, snapshot: await authoritativeItemSnapshot(db, env, user, itemId) });
}

async function manageDispatchRetentionHold(request: Request, db: Database, user: User, intentId: string) {
  const member = await memberContext(db, user);
  if (!member || member.kind !== "human" || !/(Tech Lead|Platform|Ops Lead|Security)/.test(member.role)) {
    return json({ error: "A named Tech, Platform / Ops, or Security authority must manage retention holds." }, 403);
  }
  const dispatch = await db.prepare(`SELECT r.intent_id FROM dispatch_receipts r
    JOIN members actor ON actor.id = ? AND actor.pod_id = r.pod_id WHERE r.intent_id = ?`)
    .bind(user.id, intentId).first<{ intent_id: string }>();
  if (!dispatch) return json({ error: "Dispatch intent not found in your POD." }, 404);
  const body = await request.json() as Record<string, unknown>;
  const action = String(body.action ?? "");
  const reasonCode = String(body.reason_code ?? "");
  if (!['HOLD', 'RELEASE'].includes(action) || !/^[A-Z0-9_:-]{3,64}$/.test(reasonCode)) {
    return json({ error: "Use HOLD or RELEASE with a bounded non-PII reason code." }, 400);
  }
  const now = new Date();
  const requestedExpiry = action === "HOLD" ? Date.parse(String(body.expires_at ?? "")) : now.getTime();
  if (!Number.isFinite(requestedExpiry) || requestedExpiry <= now.getTime() || requestedExpiry > now.getTime() + 365 * 24 * 60 * 60 * 1000) {
    if (action === "HOLD") return json({ error: "A hold must have an explicit future expiry no more than 365 days away." }, 400);
  }
  const holdEventId = crypto.randomUUID();
  await db.prepare(`INSERT INTO dispatch_retention_holds
    (hold_event_id, intent_id, action, reason_code, expires_at, actor_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(holdEventId, intentId, action, reasonCode, new Date(requestedExpiry).toISOString(), user.id, now.toISOString()).run();
  return json({ ok: true, hold_event_id: holdEventId, action, expires_at: new Date(requestedExpiry).toISOString() }, 201);
}

const telemetryContract: Record<string, { labelName: string; values: string[]; histogram?: boolean }> = {
  steer_work_item_save_feedback_latency_ms: { labelName: "", values: [], histogram: true },
  steer_agent_handoff_feedback_latency_ms: { labelName: "", values: [], histogram: true },
  steer_work_item_save_outcome_total: { labelName: "outcome", values: ["success", "validation", "conflict", "transport"] },
  steer_post_write_reconciliation_total: { labelName: "result", values: ["fresh", "stale_suppressed", "authoritative_reload", "error"] },
  steer_agent_handoff_outcome_total: { labelName: "outcome", values: ["queued", "delivered", "blocked", "duplicate_suppressed", "error"] },
  steer_stale_ui_recurrence_total: { labelName: "severity", values: ["critical", "noncritical"] },
  steer_duplicate_dispatch_total: { labelName: "", values: [] },
  steer_release_risk_classification_total: { labelName: "tier", values: ["DEFAULT_OPEN", "ELEVATED", "DEFAULT_CLOSED"] },
  steer_release_readiness_outcome_total: { labelName: "outcome", values: ["READY", "NOT_READY", "INVALIDATED"] },
  steer_release_readiness_invalidation_total: { labelName: "reason", values: [
    "WORK_ITEM", "BRIEF_AUTHORITY", "EXAM_AUTHORITY", "CRITIC_RESULT", "DERIVED_DOMAINS",
    "RISK_CLASSIFICATION", "RISK_POLICY", "VERIFICATION_RECEIPT", "OPERATING_MODE",
    "CANDIDATE_BUILDER", "INTENDED_SUBMITTER", "IMPLEMENTATION", "BUILD", "MIGRATION_SET",
    "RUNTIME_POLICY", "CANDIDATE_SNAPSHOT", "SUPERSEDED",
  ] },
  steer_release_readiness_boundary_rejection_total: { labelName: "tier", values: ["DEFAULT_OPEN", "ELEVATED", "DEFAULT_CLOSED"] },
  steer_release_countersignature_total: { labelName: "outcome", values: ["accepted", "rejected_authority", "rejected_role", "replay"] },
  steer_release_finalization_total: { labelName: "outcome", values: ["effective", "blocked_readiness"] },
  steer_release_hosted_case_total: { labelName: "outcome", values: ["READY", "NOT_READY", "INVALIDATED"] },
  steer_release_readiness_latency_ms: { labelName: "", values: [], histogram: true },
  steer_release_snapshot_creation_latency_ms: { labelName: "outcome", values: ["created", "replay"], histogram: true },
  steer_verification_fixture_partition_size: { labelName: "partition", values: ["operational", "verification"], histogram: true },
  steer_verification_fixture_classifier_outcome_total: { labelName: "outcome", values: ["partitioned", "mismatch"] },
  steer_verification_evidence_view_total: { labelName: "outcome", values: ["populated", "empty", "warning"] },
};

async function releaseReadinessTelemetryCaseId(db: Database, itemId?: number) {
  if (!Number.isSafeInteger(itemId) || Number(itemId) < 1) return null;
  const item = await db.prepare("SELECT github_url FROM work_items WHERE id = ?").bind(Number(itemId)).first<{ github_url: string | null }>();
  const match = /^https:\/\/staging\.test\/issue-74\/[a-z0-9][a-z0-9._:-]{2,79}\/(RR74-[A-Z0-9-]{3,50})$/.exec(String(item?.github_url ?? ""));
  return match?.[1] ?? null;
}

async function recordSystemTelemetry(db: Database, metricName: string, labelName: string, labelValue: string, value: number, itemId?: number) {
  const contract = telemetryContract[metricName];
  if (!contract || contract.labelName !== labelName || (contract.values.length ? !contract.values.includes(labelValue) : labelValue !== "")) return;
  if (!Number.isInteger(value) || value < 0 || (contract.histogram ? value > 60_000 : value !== 1)) return;
  const caseId = await releaseReadinessTelemetryCaseId(db, itemId);
  await db.prepare(`INSERT INTO steer_telemetry
    (metric_name, label_name, label_value, value, case_id, observed_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(metricName, labelName, labelValue, value, caseId, new Date().toISOString()).run();
}

async function recordBoundedTelemetry(request: Request, db: Database, env: Env) {
  const body = await request.json() as Record<string, unknown>;
  const batched = Object.keys(body).length === 1 && Array.isArray(body.observations);
  const observations = batched ? body.observations as unknown[] : [body];
  if (!observations.length || observations.length > 4 || observations.some((entry) => !entry || typeof entry !== "object" || Array.isArray(entry))) {
    return json({ error: "Telemetry accepts one through four bounded observations." }, 400);
  }
  if (batched ? Object.keys(body).some((key) => key !== "observations") : Object.keys(body).some((key) => !["metric_name", "label_name", "label_value", "value", "case_id"].includes(key))) {
    return json({ error: "Telemetry accepts only the bounded STR-028 contract fields." }, 400);
  }
  const validated: { metricName: string; labelName: string; labelValue: string; value: number; caseId: string | null }[] = [];
  for (const entry of observations) {
    const observation = entry as Record<string, unknown>;
    if (Object.keys(observation).some((key) => !["metric_name", "label_name", "label_value", "value", "case_id"].includes(key))) {
      return json({ error: "Telemetry accepts only the bounded STR-028 contract fields." }, 400);
    }
    const metricName = String(observation.metric_name ?? "");
    const contract = telemetryContract[metricName];
    const labelName = String(observation.label_name ?? "");
    const labelValue = String(observation.label_value ?? "");
    const value = Number(observation.value);
    const caseId = observation.case_id === undefined || observation.case_id === null || observation.case_id === "" ? null : String(observation.case_id);
    if (!contract || labelName !== contract.labelName || (contract.values.length ? !contract.values.includes(labelValue) : labelValue !== "")) {
      return json({ error: "Telemetry metric or label is outside the bounded allowlist." }, 400);
    }
    if (!Number.isInteger(value) || value < 0 || (contract.histogram ? value > 60_000 : value !== 1)) {
      return json({ error: contract.histogram ? "Latency must be an integer from 0 through 60000 ms." : "Counter observations must have value 1." }, 400);
    }
    if (caseId && !isStr028CaseId(caseId)) {
      return json({ error: "Only a pre-enrolled bounded matrix case ID may label telemetry." }, 400);
    }
    if (caseId && env.DISPATCH_ALLOW_TEST_PRIVACY_POLICY !== "true") {
      return json({ error: "Fixed-matrix case labels are accepted only in the explicit non-production test environment." }, 409);
    }
    validated.push({ metricName, labelName, labelValue, value, caseId });
  }
  const observedAt = new Date().toISOString();
  await db.batch(validated.map((observation) => db.prepare(`INSERT INTO steer_telemetry
    (metric_name, label_name, label_value, value, case_id, observed_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(observation.metricName, observation.labelName, observation.labelValue, observation.value, observation.caseId, observedAt)));
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}

async function createItem(request: Request, db: Database, user: User) {
  const actor = await memberContext(db, user);
  if (!actor) return json({ error: "POD membership required." }, 403);
  const body = await request.json() as Record<string, unknown>;
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const phase = String(body.phase ?? "Sense");
  const priority = String(body.priority ?? "Next");
  const workflow = String(body.workflow ?? "Unassigned");
  const workType = String(body.workType ?? "Unclassified");
  const assigneeId = body.assigneeId ? String(body.assigneeId) : null;
  const requestedGitHubUrl = String(body.githubUrl ?? "").trim();
  const githubUrl = requestedGitHubUrl ? normalizeEngineeringRecordUrl(requestedGitHubUrl) : null;
  if (title.length < 3 || description.length < 10) return json({ error: "Add a clear title and description." }, 400);
  if (!phases.includes(phase) || !priorities.includes(priority) || !workflows.includes(workflow) || !WORK_TYPES.includes(workType as typeof WORK_TYPES[number])) return json({ error: "Invalid workflow or work-type fields." }, 400);
  if (requestedGitHubUrl && !githubUrl) return json({ error: `Engineering record must be an issue or pull request from ${allowedGitHubRepository}.` }, 400);
  if (assigneeId) {
    const assignee = await db.prepare("SELECT id FROM members WHERE id = ? AND pod_id = ?").bind(assigneeId, actor.pod_id ?? "steer-flight-team").first<{ id: string }>();
    if (!assignee) return json({ error: "Assignee must be an enrolled member of this POD." }, 400);
  }
  const now = new Date().toISOString();
  let key = "";
  let result: { meta?: { last_row_id?: number } } | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const existing = await db.prepare("SELECT key FROM work_items").all<{ key: string }>();
    key = nextWorkItemKey((existing.results ?? []).map((item) => item.key));
    try {
      result = await db.prepare(
        `INSERT INTO work_items
         (key, title, description, phase, priority, workflow, work_type, state, gate, decision_status,
          decision_authority, assignee_id, next_action, github_url, pod_id, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'queued', 'Gate 1 pending', 'Waiting', 'Product Lead', ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(key, title, description, phase, priority, workflow, workType, assigneeId, String(body.nextAction ?? "Frame the intended outcome and prepare Gate 1 evidence."), githubUrl, actor.pod_id ?? "steer-flight-team", user.id, now, now).run();
      break;
    } catch (error) {
      if (!/UNIQUE constraint failed: work_items\.key/i.test(String(error)) || attempt === 2) throw error;
    }
  }
  if (!result) return json({ error: "A unique work-item key could not be reserved. Retry the request." }, 409);
  const itemId = result.meta?.last_row_id;
  if (itemId) {
    await db.prepare("INSERT INTO activity (item_id, actor_id, action, detail, created_at) VALUES (?, ?, 'created', ?, ?)")
      .bind(itemId, user.id, `${key} created in ${phase}`, now).run();
  }
  return json({ ok: true, key }, 201);
}

export function nextWorkItemKey(existingKeys: string[]) {
  const highest = existingKeys.reduce((maximum, key) => {
    const match = /^STR-(\d+)$/.exec(key);
    return match ? Math.max(maximum, Number.parseInt(match[1], 10)) : maximum;
  }, 0);
  return `STR-${String(highest + 1).padStart(3, "0")}`;
}

async function updateItem(request: Request, db: Database, env: Env, user: User, itemId: number) {
  const actor = await memberContext(db, user);
  if (actor?.kind !== "human") return json({ error: "Only an authenticated human POD member may update authoritative work state." }, 403);
  const current = await scopedItemOrDenied(db, user, itemId, "item update");
  if (!current) return json({ error: "Work item not found in your POD." }, 404);
  const body = await request.json() as Record<string, unknown>;
  const expectedRevision = String(body.expectedRevision ?? "");
  if (!expectedRevision) return json({ error: "Refresh the work item before saving; the expected revision is required.", code: "REVISION_REQUIRED" }, 400);
  if (expectedRevision !== String(current.updated_at)) {
    return json({ error: "This work item changed after you opened it. Your input was preserved; review the authoritative state before retrying.", code: "STALE_REVISION", snapshot: await authoritativeItemSnapshot(db, env, user, itemId) }, 409);
  }
  const allowed: Record<string, { column: string; values?: string[] }> = {
    phase: { column: "phase", values: phases },
    priority: { column: "priority", values: priorities },
    workflow: { column: "workflow", values: workflows },
    workType: { column: "work_type", values: [...WORK_TYPES] },
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
  if ("githubUrl" in body && body.githubUrl !== null && String(body.githubUrl).trim()) {
    const normalized = normalizeEngineeringRecordUrl(body.githubUrl);
    if (!normalized) return json({ error: `Engineering record must be an issue or pull request from ${allowedGitHubRepository}.` }, 400);
  }
  if (body.assigneeId !== undefined && body.assigneeId !== null && String(body.assigneeId).trim()) {
    const assignee = await db.prepare("SELECT id FROM members WHERE id = ? AND pod_id = ?")
      .bind(String(body.assigneeId).trim(), current.pod_id ?? "steer-flight-team").first<{ id: string }>();
    if (!assignee) return json({ error: "Assignee must be an enrolled member of this POD." }, 400);
  }
  const sets: string[] = [];
  const values: unknown[] = [];
  const changes: string[] = [];
  for (const [key, rawValue] of entries) {
    const rule = allowed[key];
    const value = key === "githubUrl" && rawValue !== null && String(rawValue).trim()
      ? normalizeEngineeringRecordUrl(rawValue)
      : rawValue === null ? null : String(rawValue).trim();
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
  values.push(now, itemId, expectedRevision);
  const mutation = await db.prepare(`UPDATE work_items SET ${sets.join(", ")} WHERE id = ? AND updated_at = ?`).bind(...values).run();
  if (Number(mutation.meta?.changes ?? 0) !== 1) {
    return json({ error: "This work item changed while the save was in progress. Your input was preserved; review the authoritative state before retrying.", code: "STALE_REVISION", snapshot: await authoritativeItemSnapshot(db, env, user, itemId) }, 409);
  }
  await db.prepare("INSERT INTO activity (item_id, actor_id, action, detail, created_at) VALUES (?, ?, 'updated', ?, ?)")
    .bind(itemId, user.id, changes.join(" · "), now).run();
  const forecastChange = materialForecastChange(entries.map(([key]) => key));
  const resultingState = requestedState ?? String(current.state ?? "");
  if (forecastChange && ["active", "blocked"].includes(resultingState) && current.delivery_forecast_json) {
    try {
      const previous = JSON.parse(String(current.delivery_forecast_json)) as DeliveryForecast;
      const replacement = {
        ...previous,
        reforecastRequiredReason: forecastChange,
        reforecastRequiredAt: now,
        ...(resultingState === "blocked" ? {
          blockedSince: String(current.blocked_since ?? now),
          unblockOwner: String(current.delivery_owner_id ?? "Named delivery owner"),
          unblockAction: String(body.nextAction ?? current.next_action ?? "Resolve the recorded blocker"),
          cannotForecastUntil: `Cannot forecast until: ${String(body.nextAction ?? current.next_action ?? "the recorded dependency is resolved")}`,
        } : {}),
      };
      const replacementJson = JSON.stringify(replacement);
      const actor = await db.prepare("SELECT role FROM members WHERE id = ?").bind(user.id).first<{ role: string }>();
      await db.batch([
        db.prepare("UPDATE work_items SET delivery_forecast_json = ?, updated_at = ? WHERE id = ?").bind(replacementJson, now, itemId),
        db.prepare(
          `INSERT INTO work_economics_events
           (item_id, section, action, actor_id, actor_role, previous_json, replacement_json, reason, created_at)
           VALUES (?, 'deliveryForecast', 'reforecast_required', ?, ?, ?, ?, ?, ?)`,
        ).bind(itemId, user.id, actor?.role ?? "Authenticated contributor", String(current.delivery_forecast_json), replacementJson, forecastChange, now),
      ]);
    } catch {
      // A malformed legacy forecast remains visible as unknown; a human can replace it through the governed editor.
    }
  }
  if (resultingState === "complete" && current.actual_economics_json) {
    try {
      const previous = JSON.parse(String(current.actual_economics_json)) as Record<string, unknown>;
      const replacement = { ...previous, completionAt: now, likelyVarianceMinutes: completionVarianceMinutes(current.delivery_forecast_json ? JSON.parse(String(current.delivery_forecast_json)) as DeliveryForecast : null, now) };
      const replacementJson = JSON.stringify(replacement);
      const actor = await db.prepare("SELECT role FROM members WHERE id = ?").bind(user.id).first<{ role: string }>();
      await db.batch([
        db.prepare("UPDATE work_items SET actual_economics_json = ? WHERE id = ?").bind(replacementJson, itemId),
        db.prepare(`INSERT INTO work_economics_events
          (item_id, section, action, actor_id, actor_role, previous_json, replacement_json, reason, created_at)
          VALUES (?, 'actualEconomics', 'completion_variance', ?, ?, ?, ?, 'Completion variance calculated against the accepted likely window.', ?)`)
          .bind(itemId, user.id, actor?.role ?? "Authenticated contributor", String(current.actual_economics_json), replacementJson, now),
      ]);
    } catch {
      // Legacy actuals remain visible as unavailable until corrected through the governed editor.
    }
  }
  return json({ ok: true, snapshot: await authoritativeItemSnapshot(db, env, user, itemId) });
}

const economicsColumns: Record<WorkEconomicsSection, string> = {
  valueHypothesis: "value_hypothesis_json",
  deliveryForecast: "delivery_forecast_json",
  actualEconomics: "actual_economics_json",
  realizedOutcome: "realized_outcome_json",
};

export function workEconomicsAuthorized(section: WorkEconomicsSection, kind: string, role: string) {
  if (kind !== "human") return false;
  if (section === "valueHypothesis") return role.includes("Product Lead");
  if (section === "deliveryForecast") return role.includes("Product Lead") || role.includes("Tech Lead") || role.includes("Delivery");
  if (section === "actualEconomics") return role.includes("Tech Lead") || role.includes("Platform") || role.includes("Ops");
  return role.includes("Product Lead") || role.includes("Tech Lead") || role.includes("Observe") || role.includes("Learn");
}

export function workEconomicsNamedAuthority(
  section: WorkEconomicsSection,
  member: { id: string; kind: string; role: string; pod_id?: string | null },
  item: { pod_id?: unknown; delivery_owner_id?: unknown; outcome_owner_id?: unknown },
) {
  if (!workEconomicsAuthorized(section, member.kind, member.role)) return false;
  if (String(member.pod_id ?? "steer-flight-team") !== String(item.pod_id ?? "steer-flight-team")) return false;
  if (section === "deliveryForecast" && item.delivery_owner_id && String(item.delivery_owner_id) !== member.id) return false;
  if (section === "realizedOutcome" && item.outcome_owner_id && String(item.outcome_owner_id) !== member.id && !/Observe|Learn/.test(member.role)) return false;
  return true;
}

export function validateWorkEconomics(section: WorkEconomicsSection, value: Record<string, unknown>) {
  return validateAndNormalizeWorkEconomics(section, value).error;
}

async function auditEconomicsDenial(db: Database, itemId: number, section: string, user: User, actorRole: string, reason: string) {
  const now = new Date().toISOString();
  await db.prepare(
    `INSERT INTO work_economics_events
     (item_id, section, action, actor_id, actor_role, previous_json, replacement_json, reason, created_at)
     VALUES (?, ?, 'denied', ?, ?, NULL, NULL, ?, ?)`,
  ).bind(itemId, section, user.id, actorRole || "Unauthorised member", reason, now).run();
}

function normalizedEconomicsStatements(db: Database, itemId: number, section: WorkEconomicsSection, value: Record<string, unknown>, now: string) {
  const statements: Statement[] = [];
  if (section === "deliveryForecast") {
    statements.push(db.prepare("DELETE FROM work_economics_human_facts WHERE item_id = ? AND record_kind = 'forecast'").bind(itemId));
    statements.push(db.prepare("DELETE FROM work_economics_agent_facts WHERE item_id = ? AND record_kind = 'forecast'").bind(itemId));
    for (const range of value.humanEffortRanges as Array<Record<string, unknown>>) {
      statements.push(db.prepare("INSERT INTO work_economics_human_facts (item_id, record_kind, role, min_minutes, max_minutes, active_minutes, recorded_at) VALUES (?, 'forecast', ?, ?, ?, NULL, ?)")
        .bind(itemId, range.role, range.minMinutes, range.maxMinutes, now));
    }
    for (const [index, range] of (value.agentCostRanges as Array<Record<string, unknown>>).entries()) {
      statements.push(db.prepare(`INSERT INTO work_economics_agent_facts
        (item_id, record_kind, event_id, provider, model, attempts, input_tokens, output_tokens, min_cost_micros, max_cost_micros, metered_cost_micros, currency, execution_seconds, source, completeness, ingestion_state, observed_at)
        VALUES (?, 'forecast', ?, ?, NULL, ?, NULL, NULL, ?, ?, NULL, ?, NULL, 'owner forecast', 'forecast', 'accepted', ?)`)
        .bind(itemId, `forecast-${index}`, range.provider, range.expectedAttempts, Math.round(Number(range.minCost) * 1_000_000), Math.round(Number(range.maxCost) * 1_000_000), range.currency, now));
    }
  }
  if (section === "actualEconomics") {
    statements.push(db.prepare("DELETE FROM work_economics_human_facts WHERE item_id = ? AND record_kind = 'actual'").bind(itemId));
    statements.push(db.prepare("DELETE FROM work_economics_agent_facts WHERE item_id = ? AND record_kind = 'actual'").bind(itemId));
    statements.push(db.prepare("DELETE FROM work_economics_duration_facts WHERE item_id = ?").bind(itemId));
    statements.push(db.prepare("DELETE FROM work_economics_delivery_events WHERE item_id = ?").bind(itemId));
    for (const total of value.humanRoleTotals as Array<Record<string, unknown>>) {
      statements.push(db.prepare("INSERT INTO work_economics_human_facts (item_id, record_kind, role, min_minutes, max_minutes, active_minutes, recorded_at) VALUES (?, 'actual', ?, NULL, NULL, ?, ?)")
        .bind(itemId, total.role, total.activeMinutes, now));
    }
    for (const event of value.agentTelemetry as Array<Record<string, unknown>>) {
      statements.push(db.prepare(`INSERT INTO work_economics_agent_facts
        (item_id, record_kind, event_id, provider, model, attempts, input_tokens, output_tokens, min_cost_micros, max_cost_micros, metered_cost_micros, currency, execution_seconds, source, completeness, ingestion_state, observed_at, conflict_reason)
        VALUES (?, 'actual', ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(itemId, event.eventId, event.provider, event.model, event.attempts, event.inputTokens, event.outputTokens, event.meteredCost === null ? null : Math.round(Number(event.meteredCost) * 1_000_000), event.currency, Math.round(Number(event.executionMinutes) * 60), event.source, event.completeness, event.ingestionState, event.observedAt, event.conflictReason));
    }
    for (const [factKind, minutes] of Object.entries(value.durationFacts as Record<string, unknown>)) {
      statements.push(db.prepare("INSERT INTO work_economics_duration_facts (item_id, fact_kind, minutes, source, recorded_at) VALUES (?, ?, ?, ?, ?)")
        .bind(itemId, factKind, minutes, value.telemetrySource, now));
    }
    for (const event of value.reworkEvents as Array<Record<string, unknown>>) statements.push(db.prepare(`INSERT INTO work_economics_delivery_events (item_id, event_kind, originating_phase, severity, minutes, count, reason, occurred_at, recorded_at) VALUES (?, 'rework', ?, NULL, ?, NULL, ?, ?, ?)`)
      .bind(itemId, event.originatingPhase, event.minutes, event.reason, now, now));
    for (const event of value.defectEvents as Array<Record<string, unknown>>) statements.push(db.prepare(`INSERT INTO work_economics_delivery_events (item_id, event_kind, originating_phase, severity, minutes, count, reason, occurred_at, recorded_at) VALUES (?, 'defect', NULL, ?, NULL, ?, 'Defect count recorded from governed actuals.', ?, ?)`)
      .bind(itemId, event.severity, event.count, now, now));
    for (const event of value.rollbackEvents as Array<Record<string, unknown>>) statements.push(db.prepare(`INSERT INTO work_economics_delivery_events (item_id, event_kind, originating_phase, severity, minutes, count, reason, occurred_at, recorded_at) VALUES (?, 'rollback', NULL, NULL, NULL, 1, ?, ?, ?)`)
      .bind(itemId, event.reason, event.occurredAt, now));
  }
  return statements;
}

async function serverVerifiedEvidence(url: unknown) {
  const evidence = await readEvidence(url);
  return evidence.text && evidence.sha256 && evidence.revision && /^[0-9a-f]{40}$/i.test(evidence.revision)
    ? { evidenceStatus: "verified", evidenceRevision: evidence.revision, evidenceSha256: evidence.sha256, evidenceVerifiedAt: new Date().toISOString() }
    : null;
}

async function authoritativeServiceLevel(db: Database, current: Record<string, unknown>) {
  const workType = String(current.work_type ?? "Unclassified");
  if (!WORK_TYPES.includes(workType as typeof WORK_TYPES[number]) || workType === "Unclassified") return null;
  const rows = await db.prepare("SELECT * FROM work_items WHERE pod_id = ? AND work_type = ? AND state = 'complete'")
    .bind(current.pod_id ?? "steer-flight-team", workType).all<Record<string, unknown>>();
  const now = new Date().toISOString();
  const records = (rows.results ?? []).map((row) => ({ ...row, work_economics: safeEconomicsFromRow(row, now) })) as unknown as Array<Record<string, unknown> & { work_economics: ReturnType<typeof safeEconomicsFromRow> }>;
  return buildServiceLevelDistributions(records).find((entry) => entry.podId === String(current.pod_id ?? "steer-flight-team") && entry.workType === workType) ?? null;
}

async function authoritativeCompletionAt(db: Database, current: Record<string, unknown>, itemId: number) {
  if (String(current.state) !== "complete") return null;
  const event = await db.prepare("SELECT created_at FROM activity WHERE item_id = ? AND detail LIKE '%state → complete%' ORDER BY id DESC LIMIT 1")
    .bind(itemId).first<{ created_at: string }>();
  return event?.created_at ?? String(current.updated_at);
}

async function updateWorkEconomics(request: Request, db: Database, env: Env, user: User, itemId: number) {
  const current = await scopedItemOrDenied(db, user, itemId, "Work Economics update");
  if (!current) return json({ error: "Permission denied. Ask the named record owner in this POD to review or edit this record." }, 403);
  const member = await db.prepare("SELECT id, kind, role, pod_id FROM members WHERE id = ?").bind(user.id).first<{ id: string; kind: string; role: string; pod_id: string | null }>();
  const body = await request.json() as { section?: unknown; value?: unknown; reason?: unknown; expectedRevision?: unknown };
  const expectedRevision = String(body.expectedRevision ?? "");
  if (!expectedRevision) return json({ error: "Refresh the work item before saving; the expected revision is required.", code: "REVISION_REQUIRED" }, 400);
  if (expectedRevision !== String(current.updated_at)) {
    return json({ error: "This governed record changed after you opened it. Your input was preserved; review the authoritative state before retrying.", code: "STALE_REVISION", snapshot: await authoritativeItemSnapshot(db, env, user, itemId) }, 409);
  }
  const section = String(body.section ?? "") as WorkEconomicsSection;
  if (!(section in economicsColumns)) return json({ error: "Choose a valid Work Economics section." }, 400);
  if (!member || !workEconomicsNamedAuthority(section, member, current)) {
    await auditEconomicsDenial(db, itemId, section, user, member?.role ?? "Unknown", "Denied: role, named-owner, or POD scope did not authorize this mutation.");
    return json({ error: "Permission denied. Ask the named record owner in this POD to review or edit this record." }, 403);
  }
  if (!body.value || typeof body.value !== "object" || Array.isArray(body.value)) return json({ error: "Supply a structured Work Economics record." }, 400);
  const value = { ...(body.value as Record<string, unknown>) };
  const now = new Date().toISOString();
  if (section === "deliveryForecast") {
    if (String(current.state) === "blocked") {
      value.blockedSince = String(current.blocked_since ?? current.updated_at ?? now);
      if (![value.unblockOwner, value.unblockAction, value.cannotForecastUntil].every((entry) => typeof entry === "string" && entry.trim().length > 0)) {
        return json({ error: "Blocked work must retain an unblock owner, unblock action, and cannot-forecast dependency before the forecast can be accepted." }, 400);
      }
    } else {
      value.blockedSince = null;
      value.unblockOwner = "";
      value.unblockAction = "";
      value.cannotForecastUntil = "";
    }
    const distribution = String(value.basisKind) === "comparable history" ? await authoritativeServiceLevel(db, current) : null;
    if (String(value.basisKind) === "comparable history" && !distribution) return json({ error: "Comparable history is unavailable until five completed same-POD/work-type observations exist." }, 409);
    value.serviceLevel = distribution ? { podId: distribution.podId, workType: distribution.workType, sampleSize: distribution.sampleSize, percentile: distribution.percentile, lowHours: distribution.lowHours, highHours: distribution.highHours } : null;
    value.deliveryOwnerId = user.id;
    value.acceptedBy = user.id;
    value.acceptedAt = now;
    value.updatedAt = now;
    value.acceptanceState = humanAcceptanceState(value.advisory, value.acceptanceState);
    value.reforecastRequiredReason = undefined;
    value.reforecastRequiredAt = undefined;
  }
  if (section === "actualEconomics") {
    const completionAt = await authoritativeCompletionAt(db, current, itemId);
    let acceptedForecast: DeliveryForecast | null = null;
    try { acceptedForecast = current.delivery_forecast_json ? JSON.parse(String(current.delivery_forecast_json)) as DeliveryForecast : null; } catch { acceptedForecast = null; }
    value.completionAt = completionAt;
    value.likelyVarianceMinutes = completionAt ? completionVarianceMinutes(acceptedForecast, completionAt) : null;
    value.correctedBy = user.id;
    value.correctedAt = now;
    value.acceptanceState = humanAcceptanceState(value.advisory, value.acceptanceState);
  }
  if (section === "realizedOutcome") {
    value.outcomeOwnerId = String(current.outcome_owner_id ?? value.outcomeOwnerId ?? user.id);
    value.acceptanceState = humanAcceptanceState(value.advisory, value.acceptanceState);
  }
  if (section === "realizedOutcome" && ["not due", "pending evidence"].includes(String(value.status))) {
    value.verifier = "";
    value.verifiedAt = "";
    value.evidenceRevision = "";
    value.evidenceSha256 = "";
    value.evidenceVerifiedAt = "";
  }
  if (section === "realizedOutcome" && !["not due", "pending evidence"].includes(String(value.status))) {
    value.verifier = user.id;
    value.verifiedAt = now;
  }
  if (section === "valueHypothesis") {
    const verified = await serverVerifiedEvidence(value.evidence);
    if (!verified) return json({ error: "Value evidence must resolve to an approved GitHub text artifact before acceptance." }, 409);
    value.evidenceStatus = verified.evidenceStatus;
    value.evidenceRevision = verified.evidenceRevision;
    value.evidenceSha256 = verified.evidenceSha256;
    value.evidenceVerifiedAt = verified.evidenceVerifiedAt;
    value.acceptedBy = user.id;
    value.acceptedAt = now;
    value.acceptanceState = humanAcceptanceState(value.advisory, value.acceptanceState);
  }
  if (section === "realizedOutcome" && !["not due", "pending evidence"].includes(String(value.status))) {
    const verified = await serverVerifiedEvidence(value.evidence);
    if (!verified) return json({ error: "Verified outcome evidence must resolve to an approved GitHub text artifact." }, 409);
    value.evidenceStatus = verified.evidenceStatus;
    value.evidenceRevision = verified.evidenceRevision;
    value.evidenceSha256 = verified.evidenceSha256;
    value.evidenceVerifiedAt = verified.evidenceVerifiedAt;
  }
  if (section === "valueHypothesis") {
    const outcomeOwner = await db.prepare("SELECT id FROM members WHERE id = ? AND pod_id = ? AND kind = 'human'")
      .bind(value.outcomeOwnerId, current.pod_id ?? "steer-flight-team").first<{ id: string }>();
    if (!outcomeOwner) return json({ error: "Outcome owner must be an enrolled human member of this POD." }, 400);
  }
  const validationError = validateWorkEconomics(section, value);
  if (validationError) return json({ error: validationError }, 400);
  const reason = String(body.reason ?? value.changeReason ?? value.correctionReason ?? "Accepted governed record").trim();
  if (reason.length < 8) return json({ error: "Add a meaningful audit reason." }, 400);
  const column = economicsColumns[section];
  const replacementJson = serializeSection(section, value);
  const previousJson = current[column] ? String(current[column]) : null;
  const ownerStatements: Statement[] = [];
  if (section === "deliveryForecast") ownerStatements.push(db.prepare("UPDATE work_items SET delivery_owner_id = ? WHERE id = ?").bind(user.id, itemId));
  if (section === "valueHypothesis") ownerStatements.push(db.prepare("UPDATE work_items SET outcome_owner_id = ? WHERE id = ?").bind(value.outcomeOwnerId, itemId));
  await db.batch([
    db.prepare(`UPDATE work_items SET ${column} = ?, updated_at = ? WHERE id = ?`).bind(replacementJson, now, itemId),
    db.prepare(
      `INSERT INTO work_economics_events
       (item_id, section, action, actor_id, actor_role, previous_json, replacement_json, reason, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(itemId, section, previousJson ? "corrected" : "accepted", user.id, member.role, previousJson, replacementJson, reason, now),
    db.prepare("INSERT INTO activity (item_id, actor_id, action, detail, created_at) VALUES (?, ?, 'work_economics', ?, ?)")
      .bind(itemId, user.id, `${section} ${previousJson ? "corrected" : "accepted"}: ${reason}`, now),
    ...ownerStatements,
    ...normalizedEconomicsStatements(db, itemId, section, value, now),
  ]);
  return json({ ok: true, snapshot: await authoritativeItemSnapshot(db, env, user, itemId) });
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

type PrivacyPolicyCheck = {
  ok: boolean;
  code?: string;
  error?: string;
  policy?: Record<string, unknown>;
};

async function validateLatestPrivacyPolicy(db: Database, podId: string, allowTestBypass = false): Promise<PrivacyPolicyCheck> {
  const policy = await db.prepare(`SELECT * FROM dispatch_privacy_policies
    WHERE pod_id = ? ORDER BY policy_version DESC LIMIT 1`).bind(podId).first<Record<string, unknown>>();
  if (!policy || Number(policy.terminal_retention_days) !== 90
    || Number(policy.provider_recovery_days) !== 30
    || String(policy.inventory_url) !== dispatchPrivacyInventoryUrl
    || String(policy.inventory_sha256) !== dispatchPrivacyInventorySha256) {
    return { ok: false, code: "PRIVACY_POLICY_MISSING", error: "The required dispatch and review privacy inventory or retention policy is missing or version-mismatched.", policy: policy ?? undefined };
  }
  const inventoryEvidence = await readEvidence(policy.inventory_url);
  if (inventoryEvidence.sha256 !== dispatchPrivacyInventorySha256 || inventoryEvidence.revision !== dispatchPrivacyInventoryRevision) {
    return { ok: false, code: "PRIVACY_INVENTORY_UNRESOLVED", error: "The immutable dispatch and review privacy inventory did not resolve to its audited digest.", policy };
  }
  const status = String(policy.status);
  if (status === "BLOCKED_BACKUP_RULING" && allowTestBypass) return { ok: true, policy };
  if (status !== "ACTIVE") {
    return { ok: false, code: "PRIVACY_BACKUP_RULING_REQUIRED", error: "Dispatch and signed review are blocked until the approved provider-recovery ruling is activated.", policy };
  }
  if (String(policy.ruling_url ?? "") !== dispatchPrivacyRulingUrl
    || String(policy.ruling_sha256 ?? "") !== dispatchPrivacyRulingSha256
    || !String(policy.authorization_event_id ?? "").match(/^[0-9a-f]{64}$/)
    || !String(policy.activation_receipt_sha256 ?? "").match(/^[0-9a-f]{64}$/)
    || !String(policy.idempotency_key ?? "").match(/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/)
    || !String(policy.authority_role ?? "")
    || String(policy.change_reason) !== dispatchPrivacyActivationReason) {
    return { ok: false, code: "PRIVACY_POLICY_ACTIVATION_INVALID", error: "The active policy is not bound to the named authority, immutable ruling, and activation receipt.", policy };
  }
  const rulingEvidence = await readEvidence(policy.ruling_url);
  if (rulingEvidence.sha256 !== dispatchPrivacyRulingSha256 || rulingEvidence.revision !== dispatchPrivacyRulingRevision) {
    return { ok: false, code: "PRIVACY_RULING_UNRESOLVED", error: "The immutable provider-recovery ruling did not resolve to its audited digest.", policy };
  }
  return { ok: true, policy };
}

function privacyPolicyAuthority(role: string) {
  return /Privacy|Security/.test(role) || (/Product Lead/.test(role) && /Tech Lead/.test(role));
}

async function activatePrivacyPolicy(request: Request, db: Database, user: User) {
  const actor = await memberContext(db, user);
  if (!actor || actor.kind !== "human" || !actor.pod_id || !privacyPolicyAuthority(actor.role)) {
    return json({ error: "A named same-POD Privacy, Security, or combined Product and Tech authority must activate this policy.", code: "PRIVACY_POLICY_AUTHORITY_INVALID" }, 403);
  }
  const contentType = request.headers.get("content-type") ?? "";
  const body = contentType.includes("application/x-www-form-urlencoded")
    ? Object.fromEntries(await request.formData())
    : await request.json().catch(() => null) as Record<string, unknown> | null;
  const allowedKeys = ["expected_policy_version", "idempotency_key", "inventory_url", "inventory_sha256", "ruling_url", "ruling_sha256", "terminal_retention_days", "provider_recovery_days", "status", "reason_code"];
  if (!body || Object.keys(body).some((key) => !allowedKeys.includes(key))) {
    return json({ error: "Policy activation accepts only the exact bounded ruling contract.", code: "PRIVACY_POLICY_REQUEST_INVALID" }, 400);
  }
  const expectedVersion = Number(body.expected_policy_version);
  const idempotencyKey = String(body.idempotency_key ?? "");
  const exactRequest = Number.isSafeInteger(expectedVersion) && expectedVersion >= 1
    && /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(idempotencyKey)
    && String(body.inventory_url ?? "") === dispatchPrivacyInventoryUrl
    && String(body.inventory_sha256 ?? "") === dispatchPrivacyInventorySha256
    && String(body.ruling_url ?? "") === dispatchPrivacyRulingUrl
    && String(body.ruling_sha256 ?? "") === dispatchPrivacyRulingSha256
    && Number(body.terminal_retention_days) === 90
    && Number(body.provider_recovery_days) === 30
    && String(body.status ?? "") === "ACTIVE"
    && String(body.reason_code ?? "") === dispatchPrivacyActivationReason;
  if (!exactRequest) {
    return json({ error: "The activation request contradicts or omits the approved immutable 90-day live / 30-day recovery ruling.", code: "PRIVACY_POLICY_RULING_MISMATCH" }, 409);
  }
  const [inventoryEvidence, rulingEvidence] = await Promise.all([
    readEvidence(dispatchPrivacyInventoryUrl), readEvidence(dispatchPrivacyRulingUrl),
  ]);
  if (inventoryEvidence.revision !== dispatchPrivacyInventoryRevision || inventoryEvidence.sha256 !== dispatchPrivacyInventorySha256
    || rulingEvidence.revision !== dispatchPrivacyRulingRevision || rulingEvidence.sha256 !== dispatchPrivacyRulingSha256) {
    return json({ error: "The immutable inventory or ruling could not be resolved to its exact audited digest.", code: "PRIVACY_POLICY_EVIDENCE_UNRESOLVED" }, 409);
  }
  const eventPayload = {
    schema: "steer-privacy-policy-activation/v1", pod_id: actor.pod_id, actor_id: user.id,
    authority_role: actor.role, expected_policy_version: expectedVersion,
    inventory_url: dispatchPrivacyInventoryUrl, inventory_sha256: dispatchPrivacyInventorySha256,
    ruling_url: dispatchPrivacyRulingUrl, ruling_sha256: dispatchPrivacyRulingSha256,
    terminal_retention_days: 90, provider_recovery_days: 30, status: "ACTIVE",
    reason_code: dispatchPrivacyActivationReason, idempotency_key: idempotencyKey,
  };
  const authorizationEventId = await sha256Hex(canonicalJson(eventPayload));
  const existing = await db.prepare(`SELECT * FROM dispatch_privacy_policies
    WHERE pod_id = ? AND idempotency_key = ? LIMIT 1`).bind(actor.pod_id, idempotencyKey).first<Record<string, unknown>>();
  if (existing) {
    if (Number(existing.policy_version) === expectedVersion + 1
      && String(existing.authorization_event_id) === authorizationEventId
      && String(existing.activation_receipt_sha256).match(/^[0-9a-f]{64}$/)) {
      return json({ ok: true, idempotent_replay: true, policy_version: Number(existing.policy_version), authorization_event_id: authorizationEventId, activation_receipt_sha256: existing.activation_receipt_sha256 });
    }
    return json({ error: "The idempotency key is already bound to a different activation.", code: "PRIVACY_POLICY_REPLAY_MISMATCH" }, 409);
  }
  const latest = await db.prepare(`SELECT policy_version FROM dispatch_privacy_policies
    WHERE pod_id = ? ORDER BY policy_version DESC LIMIT 1`).bind(actor.pod_id).first<{ policy_version: number }>();
  if (Number(latest?.policy_version ?? 0) !== expectedVersion) {
    return json({ error: "The expected policy version is stale.", code: "PRIVACY_POLICY_VERSION_STALE", current_policy_version: Number(latest?.policy_version ?? 0) }, 409);
  }
  const createdAt = new Date().toISOString();
  const policyVersion = expectedVersion + 1;
  const receipt = { ...eventPayload, schema: "steer-privacy-policy-activation-receipt/v1", policy_version: policyVersion, authorization_event_id: authorizationEventId, created_at: createdAt };
  const activationReceiptSha256 = await sha256Hex(canonicalJson(receipt));
  const inserted = await db.prepare(`INSERT INTO dispatch_privacy_policies
    (pod_id, policy_version, inventory_url, inventory_sha256, terminal_retention_days,
     provider_recovery_days, status, changed_by, change_reason, created_at, ruling_url,
     ruling_sha256, authority_role, authorization_event_id, idempotency_key, activation_receipt_sha256)
    SELECT ?, ?, ?, ?, 90, 30, 'ACTIVE', ?, ?, ?, ?, ?, ?, ?, ?, ?
    WHERE (SELECT COALESCE(MAX(policy_version), 0) FROM dispatch_privacy_policies WHERE pod_id = ?) = ?`).bind(
      actor.pod_id, policyVersion, dispatchPrivacyInventoryUrl, dispatchPrivacyInventorySha256,
      user.id, dispatchPrivacyActivationReason, createdAt, dispatchPrivacyRulingUrl,
      dispatchPrivacyRulingSha256, actor.role, authorizationEventId, idempotencyKey,
      activationReceiptSha256, actor.pod_id, expectedVersion,
    ).run();
  if (Number(inserted.meta?.changes ?? 0) !== 1) {
    const raced = await db.prepare(`SELECT * FROM dispatch_privacy_policies WHERE pod_id = ? AND idempotency_key = ?`)
      .bind(actor.pod_id, idempotencyKey).first<Record<string, unknown>>();
    if (raced && String(raced.authorization_event_id) === authorizationEventId) {
      return json({ ok: true, idempotent_replay: true, policy_version: Number(raced.policy_version), authorization_event_id: authorizationEventId, activation_receipt_sha256: raced.activation_receipt_sha256 });
    }
    return json({ error: "A newer policy version won the activation race.", code: "PRIVACY_POLICY_VERSION_STALE" }, 409);
  }
  return json({ ok: true, idempotent_replay: false, policy_version: policyVersion, authorization_event_id: authorizationEventId, activation_receipt_sha256: activationReceiptSha256, receipt }, 201);
}

function reviewSigner(env: Env) {
  const privateKey = String(env.REVIEW_SERVICE_PRIVATE_KEY ?? "");
  const keyId = String(env.REVIEW_SERVICE_KEY_ID ?? "");
  const keyVersion = Number(env.REVIEW_SERVICE_KEY_VERSION ?? "");
  if (!/^[0-9a-f]{64}$/.test(privateKey) || !/^[A-Za-z0-9._:-]{3,128}$/.test(keyId) || !Number.isSafeInteger(keyVersion) || keyVersion < 1) {
    throw new Error("REVIEW_SIGNER_UNAVAILABLE");
  }
  return { privateKey, keyId, keyVersion, publicKey: dispatchPublicKey(privateKey) };
}

async function verifyRecordedCriticResult(db: Database, env: Env, review: Record<string, unknown>) {
  const assignmentId = String(review.review_assignment_id ?? "");
  if (!hex64(assignmentId)) return false;
  const row = await db.prepare(`SELECT a.assignment_json, a.target_manifest_sha256, a.current_state,
      a.current_event_version, a.current_event_sha256,
      m.agent_key_id, m.agent_key_version, m.agent_public_key
    FROM review_assignments a
    JOIN members m ON m.id = a.reviewer_member_id AND m.pod_id = a.pod_id
    WHERE a.assignment_id = ?`).bind(assignmentId).first<Record<string, unknown>>();
  if (!row || row.current_state !== "RESULT_RECORDED" || Number(row.current_event_version) !== 4 ||
      !/^[0-9a-f]{64}$/.test(String(row.agent_public_key ?? ""))) return false;
  try {
    const assignment = JSON.parse(String(row.assignment_json)) as ReviewAssignmentPayload;
    await validateReviewAssignmentPayload(assignment);
    const verification = assignment.target_verification;
    const verifier = await db.prepare(`SELECT agent_key_id, agent_key_version, agent_public_key FROM members
      WHERE id = ? AND pod_id = ? AND kind = 'agent' AND role = 'Verification Agent' AND status = 'enrolled'`)
      .bind(verification.receipt.verifier_member_id, assignment.workspace_pod_id).first<Record<string, unknown>>();
    if (!verifier || verifier.agent_key_id !== verification.receipt.verifier_key_id ||
        Number(verifier.agent_key_version) !== verification.receipt.verifier_key_version ||
        !/^[0-9a-f]{64}$/.test(String(verifier.agent_public_key ?? "")) ||
        !(await verifyReviewerBinding(verification.receipt, verification.signature, String(verifier.agent_public_key)))) return false;
    const signer = reviewSigner(env);
    const eventRows = await db.prepare(`SELECT * FROM review_events WHERE assignment_id = ? ORDER BY event_version`)
      .bind(assignmentId).all<Record<string, unknown>>();
    const events = eventRows.results ?? [];
    const expectedTypes = ["REVIEW_TARGET_READY", "REVIEW_ASSIGNED", "REVIEW_REQUESTED", "REVIEW_ACKNOWLEDGED", "REVIEW_RESULT_RECORDED"];
    if (events.length !== expectedTypes.length) return false;
    let predecessor: string | null = null;
    type ReviewEventEnvelope = {
      payload: { review_assignment_id: string; event_version: number; expected_event_version: number; previous_event_sha256: string | null; event_type: string; target_artifact_manifest_sha256: string; typed_payload_sha256: string; payload: Record<string, unknown> };
      service_key_id: string; service_key_version: number; service_signature: string;
      reviewer_key_id?: string; reviewer_key_version?: number; reviewer_signature?: string;
    };
    let resultEnvelope: ReviewEventEnvelope | null = null;
    for (let index = 0; index < events.length; index += 1) {
      const eventRow = events[index];
      const envelope: ReviewEventEnvelope = JSON.parse(String(eventRow.payload_json));
      const typedPayload = envelope.payload?.payload;
      const reviewerBound = index >= 3;
      if (envelope.payload?.review_assignment_id !== assignmentId || envelope.payload.event_version !== index ||
          envelope.payload.expected_event_version !== index - 1 || envelope.payload.previous_event_sha256 !== predecessor ||
          envelope.payload.event_type !== expectedTypes[index] || eventRow.event_type !== expectedTypes[index] ||
          envelope.payload.target_artifact_manifest_sha256 !== row.target_manifest_sha256 ||
          envelope.payload.typed_payload_sha256 !== await sha256Hex(canonicalJson(typedPayload ?? {})) ||
          envelope.service_key_id !== signer.keyId || Number(envelope.service_key_version) !== signer.keyVersion ||
          eventRow.service_key_id !== signer.keyId || Number(eventRow.service_key_version) !== signer.keyVersion ||
          eventRow.service_signature !== envelope.service_signature ||
          !(await verifyReviewerBinding(envelope.payload, envelope.service_signature, signer.publicKey)) ||
          await sha256Hex(canonicalJson(envelope)) !== eventRow.event_sha256 ||
          (reviewerBound && (envelope.reviewer_key_id !== row.agent_key_id || Number(envelope.reviewer_key_version) !== Number(row.agent_key_version) ||
            eventRow.reviewer_key_id !== row.agent_key_id || Number(eventRow.reviewer_key_version) !== Number(row.agent_key_version) ||
            eventRow.reviewer_signature !== envelope.reviewer_signature || !envelope.reviewer_signature ||
            !(await verifyReviewerBinding(typedPayload, envelope.reviewer_signature, String(row.agent_public_key)))))) return false;
      predecessor = String(eventRow.event_sha256);
      if (index === 4) resultEnvelope = envelope;
    }
    if (!resultEnvelope || predecessor !== row.current_event_sha256) return false;
    const envelope = resultEnvelope;
    const reviewerPayload = envelope.payload?.payload as Record<string, unknown> | undefined;
    const result = reviewerPayload?.result as Record<string, unknown> | undefined;
    if (!reviewerPayload || !result || envelope.payload.review_assignment_id !== assignmentId ||
        envelope.payload.event_type !== "REVIEW_RESULT_RECORDED" ||
        envelope.payload.target_artifact_manifest_sha256 !== row.target_manifest_sha256 ||
        assignment.target.target_artifact_manifest_sha256 !== row.target_manifest_sha256 ||
        assignment.target.target_git_commit_oid !== review.evidence_revision ||
        row.target_manifest_sha256 !== review.evidence_sha256 ||
        reviewerPayload.schema !== "steer-review-result/v1" ||
        reviewerPayload.review_assignment_id !== assignmentId ||
        reviewerPayload.target_artifact_manifest_sha256 !== row.target_manifest_sha256 ||
        reviewerPayload.result_sha256 !== await sha256Hex(canonicalJson(result)) ||
        result.recommendation !== review.recommendation || result.confidence !== review.confidence ||
        result.summary !== review.summary || result.evidence_scope !== review.evidence_scope ||
        envelope.service_key_id !== signer.keyId || Number(envelope.service_key_version) !== signer.keyVersion) return false;
    return true;
  } catch {
    return false;
  }
}

function expectedReviewStage(gate: unknown) {
  if (gate === "Gate 1 pending") return "PRE_GATE_1_BRIEF";
  if (gate === "Gate 2 pending") return "GATE_2_EXAM";
  if (gate === "Gate 3 pending" || gate === "Gate 2 passed") return "GATE_3_BUILD";
  return null;
}

function reviewError(error: unknown) {
  const code = error instanceof Error && /^[A-Z0-9_]+$/.test(error.message) ? error.message : "REVIEW_REQUEST_INVALID";
  return json({ error: "The signed review request did not satisfy the exact assignment contract.", code }, code === "REVIEW_SIGNER_UNAVAILABLE" ? 503 : 409);
}

async function appendReviewEvent(db: Database, event: Awaited<ReturnType<typeof createSignedReviewEvent>>, actorId: string, createdAt: string) {
  const terminalAt = ["REVIEW_RESULT_RECORDED", "REVIEW_SUPERSEDED"].includes(event.payload.event_type) ? createdAt : null;
  await db.batch([
    db.prepare(`INSERT INTO review_events
      (assignment_id, event_version, expected_event_version, event_type, payload_json,
       previous_event_sha256, event_sha256, service_key_id, service_key_version,
       service_signature, reviewer_key_id, reviewer_key_version, reviewer_signature,
       actor_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      event.payload.review_assignment_id, event.payload.event_version, event.payload.expected_event_version,
      event.payload.event_type, canonicalJson(event.envelope), event.payload.previous_event_sha256,
      event.eventSha256, event.envelope.service_key_id, event.envelope.service_key_version,
      event.envelope.service_signature, "reviewer_key_id" in event.envelope ? event.envelope.reviewer_key_id : null,
      "reviewer_key_version" in event.envelope ? event.envelope.reviewer_key_version : null,
      "reviewer_signature" in event.envelope ? event.envelope.reviewer_signature : null,
      actorId, createdAt,
    ),
    db.prepare(`UPDATE review_assignments SET current_state = ?, current_event_version = ?,
      current_event_sha256 = ?, terminal_at = COALESCE(?, terminal_at) WHERE assignment_id = ?`)
      .bind(event.payload.event_type.replace("REVIEW_", ""), event.payload.event_version,
        event.eventSha256, terminalAt, event.payload.review_assignment_id),
  ]);
}

async function requestSignedCriticReview(request: Request, db: Database, env: Env, user: User, itemId: number) {
  const item = await scopedItemOrDenied(db, user, itemId, "signed Critic review assignment");
  if (!item) return json({ error: "Work item not found in your POD." }, 404);
  const actor = await memberContext(db, user);
  if (!actor || actor.kind !== "human") return json({ error: "Only an authenticated human Work Management actor may authorize a review assignment.", code: "REVIEW_AUTHORIZER_INVALID" }, 403);
  const body = await request.json() as { stage?: unknown; target?: unknown; target_verification?: unknown; prior_binding_digests?: unknown };
  const stage = String(body.stage ?? expectedReviewStage(item.gate) ?? "");
  if (!stage || stage !== expectedReviewStage(item.gate)) return json({ error: "The requested review stage does not match the authoritative gate state.", code: "REVIEW_STAGE_STALE" }, 409);
  const primary = item.assignee_id
    ? await db.prepare("SELECT id, role FROM members WHERE id = ? AND pod_id = ?").bind(item.assignee_id, item.pod_id).first<{ id: string; role: string }>()
    : null;
  const reviewer = await db.prepare(`SELECT id, role, agent_key_id, agent_key_version, agent_public_key
    FROM members WHERE id = 'agent-critic' AND pod_id = ? AND kind = 'agent' AND status = 'enrolled'`)
    .bind(item.pod_id).first<{ id: string; role: string; agent_key_id: string; agent_key_version: number; agent_public_key: string }>();
  if (!primary || !reviewer || !reviewer.agent_key_id || !reviewer.agent_key_version || !/^[0-9a-f]{64}$/.test(reviewer.agent_public_key)) {
    return json({ error: "The primary owner or exact enrolled Critic signing identity is unavailable.", code: "REVIEW_IDENTITY_UNAVAILABLE" }, 409);
  }
  const privacyPolicyCheck = await validateLatestPrivacyPolicy(db, String(item.pod_id), env.DISPATCH_ALLOW_TEST_PRIVACY_POLICY === "true");
  if (!privacyPolicyCheck.ok) return json({ error: privacyPolicyCheck.error, code: privacyPolicyCheck.code ?? "REVIEW_PRIVACY_POLICY_BLOCKED" }, 409);
  try {
    const target = body.target as ReviewAssignmentPayload["target"];
    const targetManifestSha256 = String(target?.target_artifact_manifest_sha256 ?? "");
    const now = new Date().toISOString();
    const primaryClaimLineageId = await sha256Hex(canonicalJson({
      schema: "steer-primary-claim-lineage/v1", workspace_pod_id: item.pod_id,
      work_item_stable_id: itemId, work_item_key: item.key, workflow: item.workflow,
      primary_owner_member_id: primary.id, primary_owner_role: primary.role,
    }));
    const authorizingEventId = await sha256Hex(canonicalJson({
      schema: "steer-review-authorization/v1", workspace_pod_id: item.pod_id,
      work_item_stable_id: itemId, item_revision: item.updated_at, review_stage: stage,
      target_artifact_manifest_sha256: targetManifestSha256, actor_id: user.id,
    }));
    const payload: ReviewAssignmentPayload = {
      schema: "steer-review-assignment/v1", work_item_stable_id: itemId,
      work_item_key: String(item.key), workspace_pod_id: String(item.pod_id),
      workflow: String(item.workflow), primary_claim_lineage_id: primaryClaimLineageId,
      primary_owner_role: primary.role, primary_owner_member_id: primary.id,
      review_stage: stage as ReviewAssignmentPayload["review_stage"], target,
      target_verification: body.target_verification as ReviewAssignmentPayload["target_verification"],
      prior_binding_digests: Array.isArray(body.prior_binding_digests) ? body.prior_binding_digests.map(String) : [],
      reviewer_role: "Independent Critic", reviewer_member_id: reviewer.id,
      output_contract: ["Severity-sorted advisory findings capped at three.", "Dependencies, downstream impacts, and fastest safe next actions.", "Exact evidence scope, revision, and content fingerprint."],
      prohibitions: ["No primary claim or implementation authority.", "No human gate ruling.", "No merge, deployment, release, or closure authority."],
      authorizing_actor_id: user.id, authorizing_event_id: authorizingEventId,
      item_revision: String(item.updated_at),
    };
    await validateReviewAssignmentPayload(payload);
    const verification = payload.target_verification;
    const verifier = await db.prepare(`SELECT id, role, agent_key_id, agent_key_version, agent_public_key
      FROM members WHERE id = ? AND pod_id = ? AND kind = 'agent' AND status = 'enrolled'`)
      .bind(verification.receipt.verifier_member_id, item.pod_id)
      .first<{ id: string; role: string; agent_key_id: string; agent_key_version: number; agent_public_key: string }>();
    if (!verifier || verifier.role !== "Verification Agent" || verifier.id === reviewer.id ||
      verifier.agent_key_id !== verification.receipt.verifier_key_id ||
      Number(verifier.agent_key_version) !== verification.receipt.verifier_key_version ||
      !/^[0-9a-f]{64}$/.test(verifier.agent_public_key) ||
      !(await verifyReviewerBinding(verification.receipt, verification.signature, verifier.agent_public_key))) {
      throw new Error("REVIEW_TARGET_VERIFICATION_SIGNATURE_INVALID");
    }
    if (Date.parse(verification.receipt.verified_at) > Date.now() + 5 * 60 * 1000) throw new Error("REVIEW_TARGET_VERIFICATION_INVALID");
    const identity = await buildReviewIdentity(payload);
    const existing = await db.prepare("SELECT assignment_json FROM review_assignments WHERE assignment_id = ?")
      .bind(identity.reviewAssignmentId).first<{ assignment_json: string }>();
    if (existing) return json({ ok: true, idempotent_replay: true, assignment: JSON.parse(existing.assignment_json) });
    const signer = reviewSigner(env);
    const targetVerificationReceiptSha256 = await sha256Hex(canonicalJson(verification));
    const ready = await createSignedReviewEvent({ assignmentId: identity.reviewAssignmentId, eventVersion: 0, previousEventSha256: null, eventType: "REVIEW_TARGET_READY", occurredAt: now, targetManifestSha256, actorId: user.id, typedPayload: { item_revision: item.updated_at, target_verification_receipt_sha256: targetVerificationReceiptSha256, verifier_member_id: verifier.id, verifier_key_id: verifier.agent_key_id, verifier_key_version: verifier.agent_key_version }, serviceKeyId: signer.keyId, serviceKeyVersion: signer.keyVersion, servicePrivateKey: signer.privateKey });
    const assigned = await createSignedReviewEvent({ assignmentId: identity.reviewAssignmentId, eventVersion: 1, previousEventSha256: ready.eventSha256, eventType: "REVIEW_ASSIGNED", occurredAt: now, targetManifestSha256, actorId: "work-management-authorization", typedPayload: { review_idempotency_key: identity.reviewIdempotencyKey, authorizing_event_id: authorizingEventId, reviewer_member_id: reviewer.id }, serviceKeyId: signer.keyId, serviceKeyVersion: signer.keyVersion, servicePrivateKey: signer.privateKey });
    const requested = await createSignedReviewEvent({ assignmentId: identity.reviewAssignmentId, eventVersion: 2, previousEventSha256: assigned.eventSha256, eventType: "REVIEW_REQUESTED", occurredAt: now, targetManifestSha256, actorId: "work-management-authorization", typedPayload: { assignment_event_sha256: assigned.eventSha256, canonical_route: "review-assignment-store" }, serviceKeyId: signer.keyId, serviceKeyVersion: signer.keyVersion, servicePrivateKey: signer.privateKey });
    const priorAssignments = await db.prepare(`SELECT a.assignment_id, a.target_manifest_sha256,
        e.event_version, e.event_sha256
      FROM review_assignments a JOIN review_events e ON e.assignment_id = a.assignment_id
       AND e.event_version = (SELECT MAX(last_event.event_version) FROM review_events last_event WHERE last_event.assignment_id = a.assignment_id)
      WHERE a.item_id = ? AND a.review_stage = ? AND a.assignment_id != ?
       AND NOT EXISTS (SELECT 1 FROM review_events terminal WHERE terminal.assignment_id = a.assignment_id
         AND terminal.event_type IN ('REVIEW_RESULT_RECORDED','REVIEW_SUPERSEDED'))`)
      .bind(itemId, stage, identity.reviewAssignmentId)
      .all<{ assignment_id: string; target_manifest_sha256: string; event_version: number; event_sha256: string }>();
    const supersededEvents = await Promise.all((priorAssignments.results ?? []).map((prior) => createSignedReviewEvent({
      assignmentId: prior.assignment_id, eventVersion: Number(prior.event_version) + 1,
      previousEventSha256: prior.event_sha256, eventType: "REVIEW_SUPERSEDED", occurredAt: now,
      targetManifestSha256: prior.target_manifest_sha256, actorId: "work-management-authorization",
      typedPayload: { successor_review_assignment_id: identity.reviewAssignmentId, reason: "new-independently-verified-target" },
      serviceKeyId: signer.keyId, serviceKeyVersion: signer.keyVersion, servicePrivateKey: signer.privateKey,
    })));
    const deleteAfter = new Date(Date.parse(now) + 90 * 24 * 60 * 60 * 1000).toISOString();
    await db.batch([
      db.prepare(`INSERT INTO review_assignments
        (assignment_id, idempotency_key, item_id, pod_id, review_stage, reviewer_member_id,
         primary_claim_lineage_id, item_revision, target_manifest_sha256, assignment_json,
         current_state, current_event_version, current_event_sha256, authorizing_actor_id,
         authorizing_event_id, created_at, delete_after)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'REQUESTED', 2, ?, ?, ?, ?, ?)`)
        .bind(identity.reviewAssignmentId, identity.reviewIdempotencyKey, itemId, item.pod_id, stage,
          reviewer.id, primaryClaimLineageId, item.updated_at, targetManifestSha256,
          canonicalJson({ ...payload, review_assignment_id: identity.reviewAssignmentId, review_idempotency_key: identity.reviewIdempotencyKey }),
          requested.eventSha256, user.id, authorizingEventId, now, deleteAfter),
      ...supersededEvents.flatMap((event) => [
        db.prepare(`INSERT INTO review_events
          (assignment_id, event_version, expected_event_version, event_type, payload_json,
           previous_event_sha256, event_sha256, service_key_id, service_key_version,
           service_signature, actor_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
          event.payload.review_assignment_id, event.payload.event_version, event.payload.expected_event_version,
          event.payload.event_type, canonicalJson(event.envelope), event.payload.previous_event_sha256,
          event.eventSha256, signer.keyId, signer.keyVersion, event.envelope.service_signature,
          event.payload.actor_id, now,
        ),
        db.prepare(`UPDATE review_assignments SET current_state = 'SUPERSEDED', current_event_version = ?,
          current_event_sha256 = ?, terminal_at = ? WHERE assignment_id = ?`)
          .bind(event.payload.event_version, event.eventSha256, now, event.payload.review_assignment_id),
      ]),
      ...[ready, assigned, requested].map((event) => db.prepare(`INSERT INTO review_events
        (assignment_id, event_version, expected_event_version, event_type, payload_json,
         previous_event_sha256, event_sha256, service_key_id, service_key_version,
         service_signature, actor_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
        identity.reviewAssignmentId, event.payload.event_version, event.payload.expected_event_version,
        event.payload.event_type, canonicalJson(event.envelope), event.payload.previous_event_sha256,
        event.eventSha256, signer.keyId, signer.keyVersion, event.envelope.service_signature,
        event.payload.actor_id, now,
      )),
      db.prepare("INSERT INTO activity (item_id, actor_id, action, detail, created_at, review_assignment_id) VALUES (?, ?, 'review_requested', ?, ?, ?)")
        .bind(itemId, user.id, `Signed ${stage} review requested from the enrolled Critic.`, now, identity.reviewAssignmentId),
      db.prepare(`INSERT OR IGNORE INTO notifications
        (dedupe_key, item_id, member_id, recipient_role, kind, title, body, channel, status, created_at, review_assignment_id)
        VALUES (?, ?, ?, 'Independent Critic', 'review_assignment', ?, ?, 'review-assignment-store', 'queued', ?, ?)`)
        .bind(`review-${identity.reviewAssignmentId}`, itemId, reviewer.id, `${String(item.key)} signed review requested`, `Exact target ${targetManifestSha256}.`, now, identity.reviewAssignmentId),
    ]);
    return json({ ok: true, idempotent_replay: false, assignment: { ...payload, review_assignment_id: identity.reviewAssignmentId, review_idempotency_key: identity.reviewIdempotencyKey }, request_event_sha256: requested.eventSha256 }, 201);
  } catch (error) { return reviewError(error); }
}

async function acknowledgeSignedReview(request: Request, db: Database, env: Env, user: User, assignmentId: string) {
  const assignment = await db.prepare(`SELECT a.*, w.updated_at, w.assignee_id, w.workflow,
      m.agent_key_id, m.agent_key_version, m.agent_public_key
    FROM review_assignments a JOIN work_items w ON w.id = a.item_id
    JOIN members actor ON actor.id = ? AND actor.pod_id = a.pod_id
    JOIN members m ON m.id = a.reviewer_member_id AND m.pod_id = a.pod_id
    WHERE a.assignment_id = ?`).bind(user.id, assignmentId).first<Record<string, unknown>>();
  if (!assignment) return json({ error: "Review assignment not found in your POD." }, 404);
  if (assignment.current_state === "SUPERSEDED") return json({ error: "This review assignment was superseded by a newer independently verified target.", code: "REVIEW_ASSIGNMENT_SUPERSEDED" }, 409);
  if (user.id !== assignment.reviewer_member_id) return json({ error: "Only the exact enrolled reviewer may acknowledge this assignment.", code: "REVIEWER_MISMATCH" }, 403);
  const existing = await db.prepare("SELECT payload_json FROM review_events WHERE assignment_id = ? AND event_type = 'REVIEW_ACKNOWLEDGED'").bind(assignmentId).first<{ payload_json: string }>();
  const requestEvent = await db.prepare("SELECT event_sha256 FROM review_events WHERE assignment_id = ? AND event_type = 'REVIEW_REQUESTED'").bind(assignmentId).first<{ event_sha256: string }>();
  const body = await request.json() as Record<string, unknown>;
  const acknowledgedAt = String(body.acknowledged_at ?? "");
  const reviewerPayload = { schema: "steer-review-acknowledgement/v1", review_assignment_id: assignmentId, target_artifact_manifest_sha256: assignment.target_manifest_sha256, source_request_event_sha256: requestEvent?.event_sha256, predecessor_event_sha256: requestEvent?.event_sha256, acknowledged_at: acknowledgedAt };
  if (!requestEvent || String(body.member_id) !== assignment.reviewer_member_id || !Number.isFinite(Date.parse(acknowledgedAt)) || String(body.key_id) !== assignment.agent_key_id || Number(body.key_version) !== Number(assignment.agent_key_version) || !(await verifyReviewerBinding(reviewerPayload, String(body.signature ?? ""), String(assignment.agent_public_key)))) {
    return json({ error: "The Critic acknowledgement signature or exact assignment binding is invalid.", code: "REVIEW_ACK_SIGNATURE_INVALID" }, 409);
  }
  if (existing) {
    const stored = JSON.parse(existing.payload_json) as { payload?: { payload?: unknown }; reviewer_signature?: string };
    if (canonicalJson(stored.payload?.payload) !== canonicalJson(reviewerPayload) || stored.reviewer_signature !== body.signature) {
      return json({ error: "A different acknowledgement already closes this assignment step.", code: "REVIEW_ACK_REPLAY_MISMATCH" }, 409);
    }
    return json({ ok: true, idempotent_replay: true, event: stored });
  }
  try {
    const signer = reviewSigner(env);
    const event = await createSignedReviewEvent({ assignmentId, eventVersion: 3, previousEventSha256: requestEvent.event_sha256, eventType: "REVIEW_ACKNOWLEDGED", occurredAt: acknowledgedAt, targetManifestSha256: String(assignment.target_manifest_sha256), actorId: user.id, typedPayload: reviewerPayload, serviceKeyId: signer.keyId, serviceKeyVersion: signer.keyVersion, servicePrivateKey: signer.privateKey, reviewerKeyId: String(assignment.agent_key_id), reviewerKeyVersion: Number(assignment.agent_key_version), reviewerSignature: String(body.signature) });
    await appendReviewEvent(db, event, user.id, acknowledgedAt);
    return json({ ok: true, idempotent_replay: false, event: event.envelope }, 201);
  } catch (error) { return reviewError(error); }
}

type SignedCriticResult = {
  recommendation: string; confidence: string; summary: string; findings: Finding[];
  dependencies: string[]; impacts: string[]; actions: string[]; derived_tags: string[];
  evidence_scope: string; completed_at: string;
};

function validSignedCriticResult(value: unknown): value is SignedCriticResult {
  if (!value || typeof value !== "object") return false;
  const result = value as SignedCriticResult;
  const allowedSeverity = new Set(["blocker", "should-fix", "note"]);
  return [result.recommendation, result.confidence, result.summary, result.evidence_scope, result.completed_at].every((entry) => typeof entry === "string" && entry.length > 0 && entry.length <= 4000)
    && Number.isFinite(Date.parse(result.completed_at))
    && Array.isArray(result.findings) && result.findings.length <= 3
    && result.findings.every((finding) => allowedSeverity.has(finding.severity) && [finding.title, finding.detail, finding.action].every((entry) => typeof entry === "string" && entry.length > 0 && entry.length <= 4000))
    && [result.dependencies, result.impacts, result.actions, result.derived_tags].every((entries) => Array.isArray(entries) && entries.length <= 12 && entries.every((entry) => typeof entry === "string" && entry.length <= 1000));
}

async function recordSignedReviewResult(request: Request, db: Database, env: Env, user: User, assignmentId: string) {
  const assignment = await db.prepare(`SELECT a.*, w.updated_at, w.assignee_id, w.workflow,
      m.agent_key_id, m.agent_key_version, m.agent_public_key
    FROM review_assignments a JOIN work_items w ON w.id = a.item_id
    JOIN members actor ON actor.id = ? AND actor.pod_id = a.pod_id
    JOIN members m ON m.id = a.reviewer_member_id AND m.pod_id = a.pod_id
    WHERE a.assignment_id = ?`).bind(user.id, assignmentId).first<Record<string, unknown>>();
  if (!assignment) return json({ error: "Review assignment not found in your POD." }, 404);
  if (assignment.current_state === "SUPERSEDED") return json({ error: "This review assignment was superseded by a newer independently verified target.", code: "REVIEW_ASSIGNMENT_SUPERSEDED" }, 409);
  if (user.id !== assignment.reviewer_member_id) return json({ error: "Only the exact enrolled reviewer may record this result.", code: "REVIEWER_MISMATCH" }, 403);
  if (String(assignment.updated_at) !== String(assignment.item_revision) || String(assignment.assignee_id) !== String((JSON.parse(String(assignment.assignment_json)) as ReviewAssignmentPayload).primary_owner_member_id) || String(assignment.workflow) !== String((JSON.parse(String(assignment.assignment_json)) as ReviewAssignmentPayload).workflow)) {
    return json({ error: "The item, owner, workflow, or primary claim binding changed after assignment.", code: "REVIEW_ASSIGNMENT_STALE" }, 409);
  }
  const acknowledgement = await db.prepare("SELECT event_sha256 FROM review_events WHERE assignment_id = ? AND event_type = 'REVIEW_ACKNOWLEDGED'").bind(assignmentId).first<{ event_sha256: string }>();
  if (!acknowledgement) return json({ error: "A signed acknowledgement must precede the review result.", code: "REVIEW_ACK_REQUIRED" }, 409);
  const existing = await db.prepare("SELECT payload_json FROM review_events WHERE assignment_id = ? AND event_type = 'REVIEW_RESULT_RECORDED'").bind(assignmentId).first<{ payload_json: string }>();
  const body = await request.json() as Record<string, unknown>;
  const result = body.result;
  if (!validSignedCriticResult(result)) return json({ error: "The Critic result does not satisfy the bounded output contract.", code: "REVIEW_RESULT_INVALID" }, 400);
  const resultSha256 = await sha256Hex(canonicalJson(result));
  const reviewerPayload = { schema: "steer-review-result/v1", review_assignment_id: assignmentId, target_artifact_manifest_sha256: assignment.target_manifest_sha256, predecessor_event_sha256: acknowledgement.event_sha256, result_sha256: resultSha256, result };
  if (String(body.member_id) !== assignment.reviewer_member_id || String(body.key_id) !== assignment.agent_key_id || Number(body.key_version) !== Number(assignment.agent_key_version) || !(await verifyReviewerBinding(reviewerPayload, String(body.signature ?? ""), String(assignment.agent_public_key)))) {
    return json({ error: "The Critic result signature or exact assignment binding is invalid.", code: "REVIEW_RESULT_SIGNATURE_INVALID" }, 409);
  }
  if (existing) {
    const stored = JSON.parse(existing.payload_json) as { payload?: { payload?: unknown }; reviewer_signature?: string };
    if (canonicalJson(stored.payload?.payload) !== canonicalJson(reviewerPayload) || stored.reviewer_signature !== body.signature) {
      return json({ error: "A different result already closes this assignment.", code: "REVIEW_RESULT_REPLAY_MISMATCH" }, 409);
    }
    return json({ ok: true, idempotent_replay: true, event: stored });
  }
  try {
    const signer = reviewSigner(env);
    const event = await createSignedReviewEvent({ assignmentId, eventVersion: 4, previousEventSha256: acknowledgement.event_sha256, eventType: "REVIEW_RESULT_RECORDED", occurredAt: result.completed_at, targetManifestSha256: String(assignment.target_manifest_sha256), actorId: user.id, typedPayload: reviewerPayload, serviceKeyId: signer.keyId, serviceKeyVersion: signer.keyVersion, servicePrivateKey: signer.privateKey, reviewerKeyId: String(assignment.agent_key_id), reviewerKeyVersion: Number(assignment.agent_key_version), reviewerSignature: String(body.signature) });
    const assignmentPayload = JSON.parse(String(assignment.assignment_json)) as ReviewAssignmentPayload;
    await db.batch([
      db.prepare(`INSERT INTO review_events
        (assignment_id, event_version, expected_event_version, event_type, payload_json,
         previous_event_sha256, event_sha256, service_key_id, service_key_version,
         service_signature, reviewer_key_id, reviewer_key_version, reviewer_signature,
         actor_id, created_at) VALUES (?, 4, 3, 'REVIEW_RESULT_RECORDED', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(assignmentId, canonicalJson(event.envelope), acknowledgement.event_sha256, event.eventSha256,
          signer.keyId, signer.keyVersion, event.envelope.service_signature, assignment.agent_key_id,
          assignment.agent_key_version, body.signature, user.id, result.completed_at),
      db.prepare(`UPDATE review_assignments SET current_state = 'RESULT_RECORDED', current_event_version = 4,
        current_event_sha256 = ?, terminal_at = ? WHERE assignment_id = ?`)
        .bind(event.eventSha256, result.completed_at, assignmentId),
      db.prepare(`INSERT INTO agent_reviews
        (item_id, agent_id, review_mode, recommendation, confidence, summary, findings_json,
         dependencies_json, impacts_json, actions_json, derived_tags_json, evidence_scope,
         evidence_url, evidence_revision, evidence_sha256, reviewed_item_updated_at, requested_by, created_at,
         review_assignment_id)
        VALUES (?, ?, 'signed_assignment_review', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(assignment.item_id, user.id, result.recommendation, result.confidence, result.summary,
          JSON.stringify(result.findings), JSON.stringify(result.dependencies), JSON.stringify(result.impacts),
          JSON.stringify(result.actions), JSON.stringify(result.derived_tags), result.evidence_scope,
          assignmentPayload.target.target_artifacts[0]?.url ?? null,
          assignmentPayload.target.target_git_commit_oid, assignment.target_manifest_sha256,
          assignment.item_revision, assignment.authorizing_actor_id, result.completed_at, assignmentId),
      db.prepare("INSERT INTO activity (item_id, actor_id, action, detail, created_at, review_assignment_id) VALUES (?, ?, 'agent_review', ?, ?, ?)")
        .bind(assignment.item_id, user.id, `${result.recommendation} · signed review recorded`, result.completed_at, assignmentId),
    ]);
    return json({ ok: true, idempotent_replay: false, review_assignment_id: assignmentId, result_sha256: resultSha256 }, 201);
  } catch (error) {
    const raced = await db.prepare("SELECT event_sha256 FROM review_events WHERE assignment_id = ? AND event_type = 'REVIEW_RESULT_RECORDED'").bind(assignmentId).first<{ event_sha256: string }>();
    if (raced) return json({ ok: true, idempotent_replay: true, review_assignment_id: assignmentId });
    return reviewError(error);
  }
}

async function manageReviewRetentionHold(request: Request, db: Database, user: User, assignmentId: string) {
  const member = await memberContext(db, user);
  if (!member || member.kind !== "human" || !/(Tech Lead|Platform|Ops Lead|Security)/.test(member.role)) {
    return json({ error: "A named Tech, Platform / Ops, or Security authority must manage review retention holds." }, 403);
  }
  const assignment = await db.prepare(`SELECT a.assignment_id FROM review_assignments a
    JOIN members actor ON actor.id = ? AND actor.pod_id = a.pod_id WHERE a.assignment_id = ?`)
    .bind(user.id, assignmentId).first<{ assignment_id: string }>();
  if (!assignment) return json({ error: "Review assignment not found in your POD." }, 404);
  const body = await request.json() as Record<string, unknown>;
  const action = String(body.action ?? "");
  const reasonCode = String(body.reason_code ?? "");
  if (!["HOLD", "RELEASE"].includes(action) || !/^[A-Z0-9_:-]{3,64}$/.test(reasonCode)) return json({ error: "Use HOLD or RELEASE with a bounded no-PII reason code." }, 400);
  const now = new Date();
  const expiry = action === "HOLD" ? Date.parse(String(body.expires_at ?? "")) : now.getTime() + 1000;
  if (!Number.isFinite(expiry) || expiry <= now.getTime() || expiry > now.getTime() + 365 * 24 * 60 * 60 * 1000) return json({ error: "A hold must have an explicit future expiry no more than 365 days away." }, 400);
  const holdEventId = crypto.randomUUID();
  await db.prepare(`INSERT INTO review_retention_holds
    (hold_event_id, assignment_id, action, reason_code, expires_at, actor_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(holdEventId, assignmentId, action, reasonCode, new Date(expiry).toISOString(), user.id, now.toISOString()).run();
  return json({ ok: true, hold_event_id: holdEventId, action, expires_at: new Date(expiry).toISOString() }, 201);
}

async function runReviewRetention(request: Request, db: Database, env: Env) {
  const expected = String(env.REVIEW_SERVICE_TOKEN ?? "");
  const provided = request.headers.get("authorization") ?? "";
  if (expected.length < 32 || provided !== `Bearer ${expected}`) return json({ error: "Review retention service authentication failed." }, 401);
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const now = new Date();
  const cutoff = body.cutoff_at ? new Date(String(body.cutoff_at)) : now;
  if (!Number.isFinite(cutoff.getTime()) || cutoff.getTime() > now.getTime() + 60_000) return json({ error: "The retention cutoff is invalid." }, 400);
  const candidates = await db.prepare(`SELECT a.assignment_id FROM review_assignments a
    JOIN review_events result ON result.assignment_id = a.assignment_id AND result.event_type = 'REVIEW_RESULT_RECORDED'
    WHERE unixepoch(result.created_at, '+90 days') <= unixepoch(?)
      AND NOT EXISTS (
        SELECT 1 FROM review_retention_holds h
        WHERE h.assignment_id = a.assignment_id AND h.action = 'HOLD'
          AND unixepoch(h.expires_at) > unixepoch(?)
          AND NOT EXISTS (
            SELECT 1 FROM review_retention_holds release
            WHERE release.assignment_id = h.assignment_id AND release.action = 'RELEASE'
              AND unixepoch(release.created_at) >= unixepoch(h.created_at)
          )
      ) ORDER BY result.created_at LIMIT 100`).bind(cutoff.toISOString(), cutoff.toISOString()).all<{ assignment_id: string }>();
  let deleted = 0;
  for (const candidate of candidates.results ?? []) {
    const nonce = crypto.randomUUID();
    const authorizationExpiry = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
    await db.batch([
      db.prepare("INSERT OR REPLACE INTO review_retention_authorizations (assignment_id, authorization_nonce, expires_at) VALUES (?, ?, ?)").bind(candidate.assignment_id, nonce, authorizationExpiry),
      db.prepare("DELETE FROM agent_reviews WHERE review_assignment_id = ?").bind(candidate.assignment_id),
      db.prepare("DELETE FROM activity WHERE review_assignment_id = ?").bind(candidate.assignment_id),
      db.prepare("DELETE FROM notifications WHERE review_assignment_id = ?").bind(candidate.assignment_id),
      db.prepare("DELETE FROM review_events WHERE assignment_id = ?").bind(candidate.assignment_id),
      db.prepare("DELETE FROM review_retention_holds WHERE assignment_id = ?").bind(candidate.assignment_id),
      db.prepare("DELETE FROM review_assignments WHERE assignment_id = ?").bind(candidate.assignment_id),
      db.prepare("DELETE FROM review_retention_authorizations WHERE assignment_id = ? AND authorization_nonce = ?").bind(candidate.assignment_id, nonce),
    ]);
    deleted += 1;
  }
  await db.prepare("INSERT INTO review_retention_runs (cutoff_at, eligible_count, deleted_count, created_at) VALUES (?, ?, ?, ?)")
    .bind(cutoff.toISOString(), (candidates.results ?? []).length, deleted, now.toISOString()).run();
  return json({ ok: true, eligible_count: (candidates.results ?? []).length, deleted_count: deleted });
}

async function handleSignedReviewService(request: Request, db: Database, env: Env): Promise<Response | null> {
  const url = new URL(request.url);
  const acknowledgement = url.pathname.match(/^\/api\/review-assignments\/([0-9a-f]{64})\/acknowledgements$/);
  const result = url.pathname.match(/^\/api\/review-assignments\/([0-9a-f]{64})\/results$/);
  if (request.method !== "POST" || (!acknowledgement && !result)) return null;
  const expected = String(env.REVIEW_SERVICE_TOKEN ?? "");
  if (expected.length < 32 || request.headers.get("authorization") !== `Bearer ${expected}`) return json({ error: "Signed review service authentication failed." }, 401);
  const body = await request.clone().json().catch(() => null) as Record<string, unknown> | null;
  const memberId = String(body?.member_id ?? "");
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/.test(memberId)) return json({ error: "An enrolled reviewer member ID is required." }, 400);
  const reviewerUser: User = { id: memberId, email: null, name: "Enrolled reviewer" };
  if (acknowledgement) return acknowledgeSignedReview(request, db, env, reviewerUser, acknowledgement[1]);
  return recordSignedReviewResult(request, db, env, reviewerUser, result![1]);
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

async function requireMaterialReforecast(db: Database, current: Record<string, unknown>, itemId: number, user: User, reason: string, now: string, blocked = false) {
  if (!current.delivery_forecast_json) return;
  try {
    const previous = JSON.parse(String(current.delivery_forecast_json)) as DeliveryForecast;
    const replacement = {
      ...previous,
      reforecastRequiredReason: reason,
      reforecastRequiredAt: now,
      ...(blocked ? {
        blockedSince: String(current.blocked_since ?? now),
        unblockOwner: String(current.delivery_owner_id ?? "Named delivery owner"),
        unblockAction: String(current.next_action ?? "Resolve the recorded blocker"),
        cannotForecastUntil: `Cannot forecast until: ${String(current.next_action ?? "the recorded dependency is resolved")}`,
      } : {}),
    };
    const actor = await db.prepare("SELECT role FROM members WHERE id = ?").bind(user.id).first<{ role: string }>();
    await db.batch([
      db.prepare("UPDATE work_items SET delivery_forecast_json = ? WHERE id = ?").bind(JSON.stringify(replacement), itemId),
      db.prepare(`INSERT INTO work_economics_events
        (item_id, section, action, actor_id, actor_role, previous_json, replacement_json, reason, created_at)
        VALUES (?, 'deliveryForecast', 'reforecast_required', ?, ?, ?, ?, ?, ?)`)
        .bind(itemId, user.id, actor?.role ?? "Authenticated contributor", String(current.delivery_forecast_json), JSON.stringify(replacement), reason, now),
    ]);
  } catch {
    // Legacy malformed forecasts fail closed as unknown and must be replaced by the named owner.
  }
}

export function decisionTransition(current: Record<string, unknown>, decision: string, reasoning = "") {
  const gate = String(current.gate ?? "Gate pending");
  let nextGate = gate;
  let nextPhase = String(current.phase);
  let nextStatus = decision === "APPROVED" ? "Decided" : "Changes requested";
  let nextState = decision === "APPROVED" ? "active" : "blocked";
  let nextAuthority = String(current.decision_authority ?? "");
  let nextAssignee = current.assignee_id;
  let nextAction = String(current.next_action);
  let reworkInstructions: string | null = null;

  if (decision === "APPROVED") {
    if (gate === "Gate 1 pending") {
      nextGate = "Gate 2 pending";
      nextPhase = "Frame";
      nextStatus = "Waiting";
      nextAuthority = "Interim Tech Lead";
      nextAssignee = "agent-architect";
      nextAction = gateTwoExamNextAction;
    }
    if (gate === "Gate 2 pending") {
      nextGate = "Gate 2 passed";
      nextPhase = "Engineer";
      nextState = "active";
      nextAssignee = "agent-builder";
      nextAction = "Implement the exact approved Gate 2 Exam attached to this item, add the mapped automated and human-check evidence, and return the verified build to Evaluate. Do not release or request Gate 3 until the full Exam is verified.";
    }
    if (gate === "Gate 3 pending") { nextGate = "Gate 3 passed"; nextPhase = "Release"; nextState = "active"; }
  } else {
    nextAssignee = reworkAssigneeForGate(gate) ?? current.assignee_id;
    reworkInstructions = reasoning;
    nextAction = firstRequiredChange(reasoning);
  }

  return {
    gate: nextGate,
    phase: nextPhase,
    decisionStatus: nextStatus,
    state: nextState,
    decisionAuthority: nextAuthority,
    assigneeId: nextAssignee,
    nextAction,
    reworkInstructions,
  };
}

export function gateOneValueReady(valueJson: unknown) {
  try {
    return acceptedValueHypothesisReady(JSON.parse(String(valueJson ?? "")));
  } catch {
    return false;
  }
}

async function decide(request: Request, db: Database, env: Env, user: User, itemId: number) {
  const current = await scopedItemOrDenied(db, user, itemId, "gate decision");
  if (!current) return json({ error: "Work item not found in your POD." }, 404);
  const governedPolicy = await db.prepare("SELECT policy_version FROM decision_signer_policies WHERE pod_id = ? AND status = 'ACTIVE' ORDER BY policy_version DESC LIMIT 1")
    .bind(String(current.pod_id)).first<{ policy_version: number }>();
  if (governedPolicy) return json({ error: `Direct decisions are disabled under signer policy v${governedPolicy.policy_version}. Prepare a package and submit a governed decision intent.` }, 409);
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
  if (decision === "APPROVED" && gate === "Gate 1 pending" && !gateOneValueReady(current.value_hypothesis_json)) {
    return json({ error: "Gate 1 is default-closed until the Product Lead accepts a complete, evidence-verified Value Hypothesis in native units." }, 409);
  }
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

  const transition = decisionTransition(current, decision, reasoning);
  const blockedSince = transition.state === "blocked" ? current.blocked_since ?? now : null;
  await db.prepare(
    "UPDATE work_items SET gate = ?, phase = ?, decision_status = ?, state = ?, decision_authority = ?, assignee_id = ?, next_action = ?, rework_instructions = ?, blocked_since = ?, updated_at = ? WHERE id = ?",
  ).bind(transition.gate, transition.phase, transition.decisionStatus, transition.state, transition.decisionAuthority, transition.assigneeId, transition.nextAction, transition.reworkInstructions, blockedSince, now, itemId).run();
  await db.prepare("INSERT INTO activity (item_id, actor_id, action, detail, created_at) VALUES (?, ?, 'decision', ?, ?)")
    .bind(itemId, user.id, `${gate}: ${decision} — ${reasoning}`, now).run();
  await requireMaterialReforecast(db, current, itemId, user, `Gate decision ${decision.toLowerCase()} changed execution expectations.`, now, transition.state === "blocked");
  if (decision === "CHANGES_REQUESTED") {
    const recipient = transition.assigneeId
      ? await db.prepare("SELECT role FROM members WHERE id = ?").bind(transition.assigneeId).first<{ role: string }>()
      : null;
    await db.prepare(
      `INSERT OR IGNORE INTO notifications
       (dedupe_key, item_id, member_id, recipient_role, kind, title, body, channel, status, created_at)
       VALUES (?, ?, ?, ?, 'rework_requested', ?, ?, 'Block Buzz', 'queued', ?)`,
    ).bind(
      `decision-${decisionResult.meta?.last_row_id ?? now}-changes`, itemId, transition.assigneeId,
      recipient?.role ?? "Evidence owner", `${String(current.key)} returned for changes`, reasoning, now,
    ).run();
  }
  return json({ ok: true, snapshot: await authoritativeItemSnapshot(db, env, user, itemId) });
}

function decisionTargetFromEvidence(urlValue: unknown, revisionValue: unknown, shaValue: unknown) {
  const url = String(urlValue ?? "");
  const match = url.match(/^https:\/\/github\.com\/idrissenayat\/federal-bd-platform\/blob\/([0-9a-f]{40})\/(steer\/[^?#]+)$/);
  const revision = String(revisionValue ?? match?.[1] ?? "");
  const sha256 = String(shaValue ?? "");
  if (!match || revision !== match[1] || !/^[0-9a-f]{64}$/.test(sha256)) return null;
  return { repository_uri: "https://github.com/idrissenayat/federal-bd-platform", commit: revision, path: match[2], body_sha256: sha256 };
}

async function prepareDecisionPackage(db: Database, user: User, itemId: number) {
  const current = await scopedItemOrDenied(db, user, itemId, "decision package preparation");
  if (!current) return json({ error: "Work item not found in your POD." }, 404);
  const review = await db.prepare(
    `SELECT r.*, a.assignment_json FROM agent_reviews r
     LEFT JOIN review_assignments a ON a.assignment_id = r.review_assignment_id
     WHERE r.item_id = ? AND r.reviewed_item_updated_at = ?
     ORDER BY r.created_at DESC, r.id DESC LIMIT 1`,
  ).bind(itemId, String(current.updated_at)).first<Record<string, unknown>>();
  if (!review) return json({ error: "A fresh exact-item Critic review is required before preparing a decision package." }, 409);
  let target = decisionTargetFromEvidence(review.evidence_url ?? current.evidence_url, review.evidence_revision, review.evidence_sha256);
  if (review.review_mode === "signed_assignment_review" && review.assignment_json) {
    try {
      const assignment = JSON.parse(String(review.assignment_json)) as ReviewAssignmentPayload;
      await validateReviewAssignmentPayload(assignment);
      const artifact = assignment.target.target_artifacts.find((candidate) => candidate.url === review.evidence_url)
        ?? assignment.target.target_artifacts[0];
      target = artifact ? decisionTargetFromEvidence(artifact.url, assignment.target.target_git_commit_oid, artifact.sha256) : null;
    } catch {
      target = null;
    }
  }
  if (!target) return json({ error: "The current evidence is not bound to an exact repository commit and SHA-256." }, 409);
  const parseList = (value: unknown) => {
    try { const parsed = JSON.parse(String(value ?? "[]")); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  };
  const findings = parseList(review.findings_json) as Array<Record<string, unknown>>;
  const risks = findings.map((finding) => String(finding.title ?? finding.detail ?? "")).filter(Boolean).slice(0, 12);
  const dependencies = parseList(review.dependencies_json).map(String).filter(Boolean).slice(0, 12);
  const recommendation = String(review.recommendation ?? "").toLowerCase().includes("change") || findings.some((finding) => String(finding.severity) === "blocker")
    ? "CHANGES_REQUESTED" as const : "APPROVED" as const;
  const evidence = [{ url: String(review.evidence_url), revision: target.commit, sha256: target.body_sha256 }];
  const evidenceSetSha256 = await decisionDigest(evidence);
  const now = new Date().toISOString();
  const packageId = createUuidV7();
  const prepared: PreparedDecisionPackage = {
    schema: "steer-decision-package/v1", package_id: packageId, item_key: String(current.key),
    decision_kind: String(current.gate), target, recommendation,
    summary: String(review.summary ?? "Review the exact evidence and record an independent human ruling."),
    proposed_reasoning: recommendation === "APPROVED"
      ? `I reviewed the exact ${String(current.gate)} evidence at ${target.commit} and find it sufficient for this gate.`
      : `Required change: ${risks[0] ?? "Resolve the current Critic finding and return exact revised evidence."}`,
    evidence, risks, missing: dependencies, required_role: String(current.decision_authority),
    consequence: recommendation === "APPROVED" ? "If deliberately submitted and later proven effective, the work may advance under the gate policy." : "The work remains blocked until revised evidence is reviewed.",
    preparation: { principal_id: "steer-critic-preparation-v1", model: "recorded-agent-review", config_version: "str027-package-v1", evidence_set_sha256: evidenceSetSha256 },
    prepared_at: now,
  };
  const packageSha256 = await decisionDigest(prepared);
  await db.prepare(`INSERT INTO decision_packages
    (package_id, item_id, pod_id, decision_kind, target_json, package_json, package_sha256,
     evidence_set_sha256, preparation_principal, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(packageId, itemId, String(current.pod_id), String(current.gate), JSON.stringify(target), JSON.stringify(prepared), packageSha256, evidenceSetSha256, prepared.preparation.principal_id, now).run();
  return json({ package: prepared, package_sha256: packageSha256, advisory: true, decision_created: false }, 201);
}

async function startDecisionSession(request: Request, db: Database, user: User, itemId: number) {
  const current = await scopedItemOrDenied(db, user, itemId, "decision session start");
  if (!current) return json({ error: "Work item not found in your POD." }, 404);
  const member = await memberContext(db, user);
  const gate = String(current.gate);
  if (!humanDecisionAuthority(member, gate)) return json({ error: `Your current human membership is not authorized to start a ${gate} decision session.` }, 403);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const reason = String(body?.reason ?? "").trim();
  if (reason.length < 12 || reason.length > 500) return json({ error: "Confirm the fresh exact-evidence session in 12 to 500 characters." }, 400);
  const now = new Date();
  const sessionId = createUuidV7(now.getTime());
  const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
  await db.prepare(`INSERT INTO decision_sessions
    (session_id, pod_id, principal_id, item_id, decision_kind, reason, started_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(sessionId, String(current.pod_id), user.id, itemId, gate, reason, now.toISOString(), expiresAt).run();
  return json({ session_id: sessionId, item_key: current.key, decision_kind: gate, expires_at: expiresAt, one_intent_only: true }, 201);
}

async function createDecisionIntent(request: Request, db: Database, env: Env, user: User, itemId: number) {
  const current = await scopedItemOrDenied(db, user, itemId, "decision intent submission");
  if (!current) return json({ error: "Work item not found in your POD." }, 404);
  const member = await memberContext(db, user);
  const gate = String(current.gate);
  const authorized = humanDecisionAuthority(member, gate);
  if (!authorized) return json({ error: `Your recorded human role is not authorized to submit intent for ${gate}.` }, 403);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const packageId = String(body?.package_id ?? "");
  const decision = String(body?.decision ?? "");
  const finalReasoning = String(body?.final_reasoning ?? "").trim();
  const idempotencyKey = String(body?.idempotency_key ?? "");
  const decisionSessionId = String(body?.decision_session_id ?? "");
  if (finalReasoning.length > 5_000 || packageId.length > 36 || idempotencyKey.length > 36 || decisionSessionId.length > 36) return json({ error: "The decision intent exceeds the bounded contract." }, 400);
  if (!["APPROVED", "CHANGES_REQUESTED"].includes(decision)) return json({ error: "Select one explicit human ruling." }, 400);
  const prepared = await db.prepare("SELECT * FROM decision_packages WHERE package_id = ? AND item_id = ? AND pod_id = ?")
    .bind(packageId, itemId, String(current.pod_id)).first<Record<string, unknown>>();
  if (!prepared) return json({ error: "The immutable prepared package was not found for this work item." }, 404);
  const existing = await db.prepare("SELECT * FROM decision_intents WHERE pod_id = ? AND idempotency_key = ?")
    .bind(String(current.pod_id), idempotencyKey).first<Record<string, unknown>>();
  if (existing) {
    const prior = JSON.parse(String(existing.intent_json)) as DecisionIntentPayload;
    if (prior.package_id !== packageId || prior.decision !== decision || prior.final_reasoning !== finalReasoning || prior.decision_session_id !== decisionSessionId) return json({ error: "The idempotency key is already bound to different decision bytes." }, 409);
    return json(safeDecisionExport(prior, String(existing.current_state) as "PENDING_PROOF", String(existing.current_event_sha256)));
  }
  const now = new Date().toISOString();
  const decisionSession = await db.prepare(`SELECT * FROM decision_sessions WHERE session_id = ?
    AND pod_id = ? AND principal_id = ? AND item_id = ? AND decision_kind = ? AND expires_at > ?`)
    .bind(decisionSessionId, String(current.pod_id), user.id, itemId, gate, now).first<Record<string, unknown>>();
  if (!decisionSession) return json({ error: "Start a fresh, unexpired decision session for this exact work item and Gate before submitting intent." }, 409);
  const priorDecision = await db.prepare(`SELECT i.intent_json FROM decisions d
    LEFT JOIN decision_intents i ON i.intent_id = d.decision_intent_id
    WHERE d.item_id = ? ORDER BY d.id DESC LIMIT 1`).bind(itemId).first<{ intent_json: string | null }>();
  if (["Gate 2 pending", "Gate 3 pending"].includes(gate)) {
    if (!priorDecision?.intent_json) return json({ error: "The prior Gate lacks durable session proof; this later Gate remains default-closed." }, 409);
    const priorIntent = JSON.parse(priorDecision.intent_json) as DecisionIntentPayload;
    if (priorIntent.decision_session_id === decisionSessionId) return json({ error: "A later Gate must use a different work session from the prior Gate." }, 409);
  }
  const target = JSON.parse(String(prepared.target_json)) as DecisionIntentPayload["target"];
  const draft = JSON.parse(String(prepared.package_json)) as PreparedDecisionPackage;
  const signerPolicy = await db.prepare(`SELECT * FROM decision_signer_policies
    WHERE pod_id = ? AND status = 'ACTIVE' ORDER BY policy_version DESC LIMIT 1`)
    .bind(String(current.pod_id)).first<Record<string, unknown>>();
  if (!signerPolicy) return json({ error: "Decision intent submission is default-closed until the Tech Lead activates an exact-revision signer policy." }, 409);
  let effectiveNotBefore = new Date(Date.parse(now) + Number(signerPolicy.cooling_hours) * 60 * 60 * 1000).toISOString();
  let readinessSnapshotSha256 = "";
  let readinessAuthority: ReturnType<typeof releaseReadinessAuthority> | undefined;
  let requiredCountersignatures = Number(signerPolicy.required_countersignatures);
  if (gate === "Gate 3 pending") {
    const readinessRow = await db.prepare(`SELECT * FROM decision_readiness_snapshots
      WHERE item_id = ? AND pod_id = ? AND current_state = 'ACTIVE' ORDER BY created_at DESC LIMIT 1`)
      .bind(itemId, String(current.pod_id)).first<Record<string, unknown>>();
    if (!readinessRow) return json({ error: "Gate 3 requires an authoritative release readiness snapshot before human intent can be recorded." }, 409);
    const readiness = await releaseReadinessView(db, readinessRow, env, now);
    if (readiness.status === "INVALIDATED") return json({ error: `Release readiness was invalidated: ${readiness.reason}. Create a replacement snapshot and work session.` }, 409);
    const snapshot = readiness.snapshot as ReleaseReadinessSnapshot;
    if (snapshot.intended_submitter_id !== user.id) {
      return json({ error: "This readiness snapshot is bound to a different intended submitter." }, 403);
    }
    if (String(decisionSession.started_at) < snapshot.created_at) {
      return json({ error: "Gate 3 requires a fresh human decision session started after the exact readiness snapshot." }, 409);
    }
    effectiveNotBefore = snapshot.effective_not_before;
    readinessSnapshotSha256 = String(readinessRow.snapshot_sha256);
    readinessAuthority = releaseReadinessAuthority(snapshot, readinessSnapshotSha256);
    requiredCountersignatures = 0;
  }
  const intent: DecisionIntentPayload = {
    schema: "steer-decision-intent/v1", intent_id: createUuidV7(), receipt_id: createUuidV7(), package_id: packageId,
    item_key: String(current.key), decision_kind: gate, decision, final_reasoning: finalReasoning,
    draft_sha256: await decisionDigest(draft), evidence_set_sha256: String(prepared.evidence_set_sha256), target,
    submitter_principal: user.id, submitter_role: member.role, decision_session_id: decisionSessionId, submitted_at: now,
    effective_not_before: effectiveNotBefore,
    operating_mode: String(signerPolicy.operating_mode) as DecisionIntentPayload["operating_mode"],
    signer_policy_version: readinessAuthority?.risk_policy_version ?? Number(signerPolicy.policy_version),
    required_countersignatures: requiredCountersignatures,
    ...(readinessSnapshotSha256 ? { readiness_snapshot_sha256: readinessSnapshotSha256 } : {}),
    ...(readinessAuthority ? { readiness_authority: readinessAuthority } : {}),
    idempotency_key: idempotencyKey, sequence: 1,
  };
  const validationError = validateDecisionIntent(intent);
  if (validationError) return json({ error: validationError }, 400);
  const intentSha256 = await decisionDigest(intent);
  const eventResult = await buildDecisionEvent({ intent_id: intent.intent_id, sequence: 1, previous_event_sha256: null, event_type: "INTENT_RECORDED", resulting_state: "PENDING_PROOF", actor_id: user.id, occurred_at: now, payload: { receipt_id: intent.receipt_id, package_id: packageId, intent_sha256: intentSha256, readiness_authority: intent.readiness_authority ?? null } });
  try {
    await db.batch([
      db.prepare(`INSERT INTO decision_intents
      (intent_id, receipt_id, package_id, item_id, pod_id, idempotency_key, intent_json, intent_sha256,
       current_state, current_sequence, current_event_sha256, required_countersignatures,
       accepted_countersignatures, submitter_id, submitter_role, effective_not_before,
       decision_session_id, signer_policy_version, readiness_snapshot_sha256, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_PROOF', 1, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      intent.intent_id, intent.receipt_id, packageId, itemId, String(current.pod_id), idempotencyKey,
      JSON.stringify(intent), intentSha256, eventResult.event_sha256, intent.required_countersignatures,
      user.id, member.role, intent.effective_not_before, intent.decision_session_id, intent.signer_policy_version,
      intent.readiness_snapshot_sha256 ?? "", now, now,
    ),
      db.prepare(`INSERT INTO decision_proof_events
      (intent_id, sequence, event_type, resulting_state, previous_event_sha256, event_json, event_sha256, actor_id, created_at)
      VALUES (?, 1, 'INTENT_RECORDED', 'PENDING_PROOF', NULL, ?, ?, ?, ?)`).bind(intent.intent_id, JSON.stringify(eventResult.event), eventResult.event_sha256, user.id, now),
      db.prepare("INSERT INTO activity (item_id, actor_id, action, detail, created_at) VALUES (?, ?, 'decision_intent', ?, ?)")
      .bind(itemId, user.id, `${gate} intent recorded as PENDING_PROOF under ${intent.operating_mode}; no gate effect before issuer proof and authoritative readiness${intent.readiness_snapshot_sha256 ? ` snapshot ${intent.readiness_snapshot_sha256}` : ` at ${intent.effective_not_before}`}.`, now),
    ]);
  } catch (error) {
    const raced = await db.prepare("SELECT * FROM decision_intents WHERE pod_id = ? AND idempotency_key = ?")
      .bind(String(current.pod_id), idempotencyKey).first<Record<string, unknown>>();
    if (raced) {
      const prior = JSON.parse(String(raced.intent_json)) as DecisionIntentPayload;
      if (prior.package_id === packageId && prior.decision === decision && prior.final_reasoning === finalReasoning && prior.decision_session_id === decisionSessionId) {
        return json({ ...safeDecisionExport(prior, String(raced.current_state) as Parameters<typeof safeDecisionExport>[1], String(raced.current_event_sha256)), replay: true });
      }
    }
    throw error;
  }
  return json(safeDecisionExport(intent, "PENDING_PROOF", eventResult.event_sha256), 201);
}

async function exportDecisionIntent(db: Database, user: User, intentId: string) {
  const row = await db.prepare(`SELECT i.* FROM decision_intents i
    JOIN members m ON m.id = ? AND m.pod_id = i.pod_id WHERE i.intent_id = ?`)
    .bind(user.id, intentId).first<Record<string, unknown>>();
  if (!row) return json({ error: "Decision receipt not found in your POD." }, 404);
  return json(safeDecisionExport(JSON.parse(String(row.intent_json)) as DecisionIntentPayload, String(row.current_state) as "PENDING_PROOF", String(row.current_event_sha256)));
}

async function appendDecisionFailure(db: Database, row: Record<string, unknown>, intent: DecisionIntentPayload, eventType: string, code: string, resultingState: "PROOF_FAILED" | "PENDING_COUNTERSIGNATURE") {
  const sequence = Number(row.current_sequence) + 1;
  const now = new Date().toISOString();
  const eventResult = await buildDecisionEvent({
    intent_id: intent.intent_id, sequence, previous_event_sha256: String(row.current_event_sha256),
    event_type: eventType, resulting_state: resultingState, actor_id: "steer-decision-proof-service",
    occurred_at: now, payload: { code, readiness_authority: intent.readiness_authority ?? null },
  });
  try {
    await db.batch([
      db.prepare(`INSERT INTO decision_proof_events
        (intent_id, sequence, event_type, resulting_state, previous_event_sha256, event_json, event_sha256, actor_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'steer-decision-proof-service', ?)`)
        .bind(intent.intent_id, sequence, eventType, resultingState, String(row.current_event_sha256), JSON.stringify(eventResult.event), eventResult.event_sha256, now),
      db.prepare(`UPDATE decision_intents SET current_state = ?, current_sequence = ?, current_event_sha256 = ?, updated_at = ?
        WHERE intent_id = ? AND current_state = ? AND current_sequence = ?`)
        .bind(resultingState, sequence, eventResult.event_sha256, now, intent.intent_id, String(row.current_state), Number(row.current_sequence)),
    ]);
  } catch {
    // A concurrent verifier may have already appended the same authoritative outcome.
  }
}

async function currentIntentAuthority(db: Database, row: Record<string, unknown>, intent: DecisionIntentPayload, requireUnexpired: boolean) {
  const member = await db.prepare("SELECT kind, role, status, pod_id FROM members WHERE id = ?")
    .bind(intent.submitter_principal).first<MemberContext>();
  if (!humanDecisionAuthority(member, intent.decision_kind) || member?.pod_id !== row.pod_id || member.role !== intent.submitter_role) return false;
  const session = await db.prepare(`SELECT * FROM decision_sessions WHERE session_id = ? AND pod_id = ?
    AND principal_id = ? AND item_id = ? AND decision_kind = ?`)
    .bind(intent.decision_session_id, String(row.pod_id), intent.submitter_principal, Number(row.item_id), intent.decision_kind)
    .first<Record<string, unknown>>();
  if (!session || String(session.started_at) > intent.submitted_at || String(session.expires_at) < intent.submitted_at) return false;
  return !requireUnexpired || String(session.expires_at) > new Date().toISOString();
}

async function activateDecisionSignerPolicy(request: Request, db: Database, user: User) {
  const member = await memberContext(db, user);
  if (member?.kind !== "human" || !member.role.includes("Tech Lead")) return json({ error: "Only the authenticated Tech Lead may activate the signer-count policy." }, 403);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const operatingMode = String(body?.operating_mode ?? "");
  const required = Number(body?.required_countersignatures ?? -1);
  const reason = String(body?.reason ?? "").trim();
  const rulingUrl = String(body?.ruling_url ?? "");
  const rulingSha256 = String(body?.ruling_sha256 ?? "");
  const validRuling = /^https:\/\/github\.com\/idrissenayat\/federal-bd-platform\/blob\/[0-9a-f]{40}\/steer\/evidence\/0027-solo-calibration-signer-ruling\.md$/.test(rulingUrl) && /^[0-9a-f]{64}$/.test(rulingSha256);
  if (!["SOLO_CALIBRATION", "TEAM"].includes(operatingMode) ||
      (operatingMode === "SOLO_CALIBRATION" ? required !== 0 : required < 2) ||
      reason.length < 12 || !validRuling) {
    return json({ error: "The signer policy must bind the approved ruling: solo requires zero additional signers; team mode requires at least two." }, 400);
  }
  const rulingEvidence = await readEvidence(rulingUrl);
  if (rulingEvidence.sha256 !== rulingSha256) return json({ error: "The signer policy ruling could not be resolved at the exact supplied SHA-256." }, 409);
  const latest = await db.prepare("SELECT * FROM decision_signer_policies WHERE pod_id = ? ORDER BY policy_version DESC LIMIT 1")
    .bind(String(member.pod_id)).first<Record<string, unknown>>();
  if (latest && latest.operating_mode === operatingMode && Number(latest.required_countersignatures) === required && latest.ruling_url === rulingUrl && latest.ruling_sha256 === rulingSha256) {
    return json({ ok: true, policy_version: Number(latest.policy_version), operating_mode: operatingMode, required_countersignatures: required, cooling_hours: 24, replay: true });
  }
  const version = Number(latest?.policy_version ?? 0) + 1;
  const now = new Date().toISOString();
  await db.prepare(`INSERT INTO decision_signer_policies
    (pod_id, policy_version, operating_mode, required_countersignatures, cooling_hours, status,
     activated_by, activation_reason, ruling_url, ruling_sha256, created_at)
    VALUES (?, ?, ?, ?, 24, 'ACTIVE', ?, ?, ?, ?, ?)`)
    .bind(String(member.pod_id), version, operatingMode, required, user.id, reason, rulingUrl, rulingSha256, now).run();
  return json({ ok: true, policy_version: version, operating_mode: operatingMode, required_countersignatures: required, cooling_hours: 24, replay: false }, 201);
}

async function activateDecisionReadinessPolicy(request: Request, db: Database, user: User) {
  const member = await memberContext(db, user);
  if (member?.kind !== "human" || member.status !== "available" || !member.role.includes("Tech Lead")) {
    return json({ error: "Only the authenticated current Tech Lead may activate release readiness policy." }, 403);
  }
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || Object.keys(body).some((key) => !["ruling_url", "ruling_sha256", "reason"].includes(key)) ||
      String(body.ruling_url ?? "") !== readinessPolicyRulingUrl || String(body.ruling_sha256 ?? "") !== readinessPolicyRulingSha256 || String(body.reason ?? "") !== readinessPolicyActivationReason) {
    return json({ error: "The readiness policy must bind the exact approved issue #74 Gate 2 ruling." }, 400);
  }
  const evidence = await readEvidence(readinessPolicyRulingUrl);
  if (evidence.sha256 !== readinessPolicyRulingSha256) return json({ error: "The approved readiness ruling bytes could not be verified." }, 409);
  const policySha256 = await releaseReadinessDigest(RELEASE_READINESS_POLICY_V1);
  const existing = await db.prepare("SELECT * FROM decision_readiness_policies WHERE pod_id = ? AND policy_version = 1")
    .bind(String(member.pod_id)).first<Record<string, unknown>>();
  if (existing) {
    if (existing.policy_sha256 !== policySha256 || existing.ruling_url !== readinessPolicyRulingUrl || existing.ruling_sha256 !== readinessPolicyRulingSha256) {
      return json({ error: "Policy version 1 is already bound to different immutable authority." }, 409);
    }
    return json({ ok: true, policy: RELEASE_READINESS_POLICY_V1, policy_sha256: policySha256, replay: true });
  }
  const now = new Date().toISOString();
  await db.prepare(`INSERT INTO decision_readiness_policies
    (pod_id, policy_version, policy_json, policy_sha256, status, activated_by, activation_reason, ruling_url, ruling_sha256, created_at)
    VALUES (?, 1, ?, ?, 'ACTIVE', ?, ?, ?, ?, ?)`).bind(
    String(member.pod_id), canonicalJson(RELEASE_READINESS_POLICY_V1), policySha256, user.id,
    readinessPolicyActivationReason, readinessPolicyRulingUrl, readinessPolicyRulingSha256, now,
  ).run();
  return json({ ok: true, policy: RELEASE_READINESS_POLICY_V1, policy_sha256: policySha256, replay: false }, 201);
}

const hex40 = (value: unknown) => /^[0-9a-f]{40}$/.test(String(value ?? ""));
const hex64 = (value: unknown) => /^[0-9a-f]{64}$/.test(String(value ?? ""));
const hasOnlyKeys = (value: Record<string, unknown>, allowed: readonly string[]) => Object.keys(value).every((key) => allowed.includes(key));

async function invalidateReleaseReadiness(db: Database, row: Record<string, unknown>, snapshot: ReleaseReadinessSnapshot, changes: ReadinessDrift[], now: string) {
  const reason = { code: "AUTHORITY_DRIFT", changes };
  const event = {
    schema: "steer.gate-readiness-event/v1", snapshot_id: snapshot.snapshot_id,
    event_type: "SNAPSHOT_INVALIDATED", readiness_authority: releaseReadinessAuthority(snapshot, String(row.snapshot_sha256)),
    reason, actor_id: "steer-release-readiness-service", occurred_at: now,
  };
  const statements: Statement[] = [
    db.prepare(`UPDATE decision_readiness_snapshots SET current_state = 'INVALIDATED', invalidation_reason = ?
      WHERE snapshot_id = ? AND current_state = 'ACTIVE'`).bind(canonicalJson(reason), snapshot.snapshot_id),
    db.prepare(`INSERT OR IGNORE INTO decision_readiness_events
      (snapshot_id, event_type, event_json, event_sha256, actor_id, created_at)
      VALUES (?, 'SNAPSHOT_INVALIDATED', ?, ?, 'steer-release-readiness-service', ?)`)
      .bind(snapshot.snapshot_id, canonicalJson(event), await releaseReadinessDigest(event), now),
  ];
  const pending = await db.prepare(`SELECT intent_id, intent_json, current_sequence, current_event_sha256
    FROM decision_intents WHERE readiness_snapshot_sha256 = ? AND current_state IN ('PENDING_PROOF', 'PENDING_COUNTERSIGNATURE')`)
    .bind(String(row.snapshot_sha256)).all<Record<string, unknown>>();
  for (const intentRow of pending.results ?? []) {
    const intent = JSON.parse(String(intentRow.intent_json)) as DecisionIntentPayload;
    const sequence = Number(intentRow.current_sequence) + 1;
    const proofEvent = await buildDecisionEvent({
      intent_id: intent.intent_id, sequence, previous_event_sha256: String(intentRow.current_event_sha256),
      event_type: "READINESS_INVALIDATED", resulting_state: "SUPERSEDED",
      actor_id: "steer-release-readiness-service", occurred_at: now,
      payload: { readiness_authority: intent.readiness_authority ?? null, invalidation: reason },
    });
    statements.push(
      db.prepare(`INSERT OR IGNORE INTO decision_proof_events
        (intent_id, sequence, event_type, resulting_state, previous_event_sha256, event_json, event_sha256, actor_id, created_at)
        VALUES (?, ?, 'READINESS_INVALIDATED', 'SUPERSEDED', ?, ?, ?, 'steer-release-readiness-service', ?)`)
        .bind(intent.intent_id, sequence, String(intentRow.current_event_sha256), canonicalJson(proofEvent.event), proofEvent.event_sha256, now),
      db.prepare(`UPDATE decision_intents SET current_state = 'SUPERSEDED', current_sequence = ?, current_event_sha256 = ?, updated_at = ?
        WHERE intent_id = ? AND current_sequence = ? AND current_state IN ('PENDING_PROOF', 'PENDING_COUNTERSIGNATURE')`)
        .bind(sequence, proofEvent.event_sha256, now, intent.intent_id, Number(intentRow.current_sequence)),
    );
  }
  await db.batch(statements);
  return reason;
}

async function releaseReadinessView(db: Database, row: Record<string, unknown>, env: Env, now = new Date().toISOString()) {
  const startedAt = performance.now();
  const snapshot = JSON.parse(String(row.snapshot_json)) as ReleaseReadinessSnapshot;
  if (String(row.current_state) === "INVALIDATED") {
    let invalidation: unknown = { code: "INVALIDATED", changes: [] };
    try { invalidation = JSON.parse(String(row.invalidation_reason ?? "{}")); } catch { invalidation = { code: String(row.invalidation_reason ?? "INVALIDATED"), changes: [] }; }
    return { snapshot, snapshot_sha256: String(row.snapshot_sha256), status: "INVALIDATED" as const, reason: "AUTHORITY_DRIFT", invalidation, missing_roles: snapshot.required_roles, completed_controls: [], server_now: now };
  }
  const [item, review, signatures, policy, latestReceipt, signerPolicy, builder, submitter, gateDecisions, effectiveIntent] = await Promise.all([
    db.prepare("SELECT key, updated_at, pod_id FROM work_items WHERE id = ? AND pod_id = ?").bind(snapshot.work_item_id, snapshot.pod_id).first<Record<string, unknown>>(),
    db.prepare(`SELECT r.*, a.current_state AS assignment_state, a.pod_id AS assignment_pod_id
      FROM agent_reviews r JOIN review_assignments a ON a.assignment_id = r.review_assignment_id
      WHERE r.item_id = ? ORDER BY r.created_at DESC, r.id DESC LIMIT 1`).bind(snapshot.work_item_id).first<Record<string, unknown>>(),
    db.prepare(`SELECT c.member_id, c.role,
      CASE WHEN m.kind = 'human' AND m.status = 'available' AND m.pod_id = ?
        AND instr(m.role, c.role) > 0 AND c.member_id != ? AND c.member_id != ? THEN c.status ELSE 'STALE' END AS status
      FROM decision_readiness_countersignatures c LEFT JOIN members m ON m.id = c.member_id
      WHERE c.snapshot_id = ? ORDER BY c.created_at, c.member_id`)
      .bind(snapshot.pod_id, snapshot.intended_submitter_id, snapshot.candidate_builder_id, snapshot.snapshot_id).all<{ member_id: string; role: string; status: string }>(),
    db.prepare("SELECT policy_version, policy_sha256, status FROM decision_readiness_policies WHERE pod_id = ? ORDER BY policy_version DESC LIMIT 1")
      .bind(snapshot.pod_id).first<Record<string, unknown>>(),
    db.prepare("SELECT * FROM staging_verification_receipts WHERE item_id = ? AND pod_id = ? ORDER BY created_at DESC LIMIT 1")
      .bind(snapshot.work_item_id, snapshot.pod_id).first<Record<string, unknown>>(),
    db.prepare("SELECT operating_mode FROM decision_signer_policies WHERE pod_id = ? AND status = 'ACTIVE' ORDER BY policy_version DESC LIMIT 1")
      .bind(snapshot.pod_id).first<{ operating_mode: string }>(),
    db.prepare("SELECT id, display_name, kind, role, status, pod_id FROM members WHERE id = ?").bind(snapshot.candidate_builder_id).first<Record<string, unknown>>(),
    db.prepare("SELECT id, kind, role, status, pod_id FROM members WHERE id = ?").bind(snapshot.intended_submitter_id).first<Record<string, unknown>>(),
    db.prepare(`SELECT gate, decision, evidence_url, evidence_revision, evidence_sha256 FROM decisions
      WHERE item_id = ? AND gate IN ('Gate 1 pending', 'Gate 2 pending') ORDER BY created_at DESC, id DESC`)
      .bind(snapshot.work_item_id).all<Record<string, unknown>>(),
    db.prepare(`SELECT intent_id FROM decision_intents WHERE readiness_snapshot_sha256 = ? AND current_state = 'EFFECTIVE' LIMIT 1`)
      .bind(String(row.snapshot_sha256)).first<{ intent_id: string }>(),
  ]);
  if (effectiveIntent) {
    return { snapshot, snapshot_sha256: String(row.snapshot_sha256), status: "READY" as const, reason: "EFFECTIVE_HISTORY_IMMUTABLE", historical_effective: true, missing_roles: [], completed_controls: ["Effective human ruling preserved"], signatures: signatures.results ?? [], server_now: now };
  }
  const currentCriticVerified = review ? await verifyRecordedCriticResult(db, env, review) : false;
  const currentGateOne = (gateDecisions.results ?? []).find((decision) => decision.gate === "Gate 1 pending" && decision.decision === "APPROVED");
  const currentGateTwo = (gateDecisions.results ?? []).find((decision) => decision.gate === "Gate 2 pending" && decision.decision === "APPROVED");
  let currentDerived: string[] = [];
  try { currentDerived = canonicalRiskInputs(JSON.parse(String(review?.derived_tags_json ?? "[]"))); } catch { currentDerived = []; }
  const currentClassification = classifyRiskCodes(snapshot.declared_risk_codes, currentDerived);
  const currentRoles = requiredRolesFor(currentClassification.codes, currentClassification.tier);
  const checks: Array<[string, unknown, unknown]> = [
    ["WORK_ITEM", { key: snapshot.work_item_key, updated_at: snapshot.work_item_updated_at, pod_id: snapshot.pod_id }, item ? { key: item.key, updated_at: item.updated_at, pod_id: item.pod_id } : null],
    ["BRIEF_AUTHORITY", { path: snapshot.brief_path, revision: snapshot.brief_commit, sha256: snapshot.brief_sha256 }, currentGateOne ? { path: String(currentGateOne.evidence_url).split(`/blob/${String(currentGateOne.evidence_revision)}/`)[1] ?? "", revision: currentGateOne.evidence_revision, sha256: currentGateOne.evidence_sha256 } : null],
    ["EXAM_AUTHORITY", { path: snapshot.exam_path, revision: snapshot.exam_commit, sha256: snapshot.exam_sha256 }, currentGateTwo ? { path: String(currentGateTwo.evidence_url).split(`/blob/${String(currentGateTwo.evidence_revision)}/`)[1] ?? "", revision: currentGateTwo.evidence_revision, sha256: currentGateTwo.evidence_sha256 } : null],
    ["CRITIC_RESULT", { assignment_id: snapshot.critic_assignment_id, assignment_state: "RESULT_RECORDED", assignment_pod_id: snapshot.pod_id, review_id: snapshot.critic_review_id, reviewed_item_updated_at: snapshot.work_item_updated_at, target: snapshot.critic_target_revision, recommendation: snapshot.critic_recommendation, evidence: snapshot.evidence_set_sha256, signatures_verified: true }, review ? { assignment_id: review.review_assignment_id, assignment_state: review.assignment_state, assignment_pod_id: review.assignment_pod_id, review_id: review.id, reviewed_item_updated_at: review.reviewed_item_updated_at, target: review.evidence_revision, recommendation: review.recommendation, evidence: review.evidence_sha256, signatures_verified: currentCriticVerified } : null],
    ["DERIVED_DOMAINS", snapshot.derived_risk_codes, currentDerived],
    ["RISK_CLASSIFICATION", { tier: snapshot.tier, resolved: snapshot.resolved_risk_codes, errors: snapshot.classification_errors, roles: snapshot.required_roles }, { tier: currentClassification.tier, resolved: currentClassification.codes, errors: currentClassification.errors, roles: currentRoles }],
    ["RISK_POLICY", { version: snapshot.risk_policy_version, sha256: snapshot.risk_policy_sha256 }, policy ? { version: policy.policy_version, sha256: policy.policy_sha256 } : null],
    ["VERIFICATION_RECEIPT", { id: snapshot.verification_receipt_id, sha256: snapshot.verification_receipt_sha256 }, latestReceipt ? { id: latestReceipt.receipt_id, sha256: latestReceipt.receipt_sha256 } : null],
    ["OPERATING_MODE", snapshot.operating_mode, signerPolicy?.operating_mode ?? null],
    ["CANDIDATE_BUILDER", { id: snapshot.candidate_builder_id, pod_id: snapshot.pod_id, builder: true, eligible: snapshot.candidate_builder_eligible }, builder ? { id: builder.id, pod_id: builder.pod_id, builder: String(builder.role).includes("Builder") || String(builder.role).includes("Implementation") || String(builder.display_name).includes("Builder"), eligible: ["available", "enrolled"].includes(String(builder.status)) } : null],
    ["INTENDED_SUBMITTER", { id: snapshot.intended_submitter_id, pod_id: snapshot.pod_id, kind: "human", available: true, product_lead: true }, submitter ? { id: submitter.id, pod_id: submitter.pod_id, kind: submitter.kind, available: submitter.status === "available", product_lead: String(submitter.role).includes("Product Lead") } : null],
  ];
  if (env?.STEER_SOURCE_REVISION) checks.push(["IMPLEMENTATION", snapshot.implementation_commit, env.STEER_SOURCE_REVISION]);
  if (env?.STEER_BUILD_SHA256) checks.push(["BUILD", snapshot.build_sha256, env.STEER_BUILD_SHA256]);
  if (env?.STEER_MIGRATION_SET_SHA256) checks.push(["MIGRATION_SET", snapshot.migration_set_sha256, env.STEER_MIGRATION_SET_SHA256]);
  if (env?.STEER_RUNTIME_POLICY_SHA256) checks.push(["RUNTIME_POLICY", snapshot.runtime_policy_sha256, env.STEER_RUNTIME_POLICY_SHA256]);
  const changes = (await Promise.all(checks.map(([field, before, after]) => readinessDrift(field, before, after)))).filter((change): change is ReadinessDrift => change !== null);
  if (changes.length) {
    const invalidation = await invalidateReleaseReadiness(db, row, snapshot, changes, now);
    await recordSystemTelemetry(db, "steer_release_readiness_outcome_total", "outcome", "INVALIDATED", 1, snapshot.work_item_id);
    for (const change of changes) await recordSystemTelemetry(db, "steer_release_readiness_invalidation_total", "reason", change.field, 1, snapshot.work_item_id);
    await recordSystemTelemetry(db, "steer_release_readiness_latency_ms", "", "", Math.min(60_000, Math.round(performance.now() - startedAt)), snapshot.work_item_id);
    return { snapshot, snapshot_sha256: String(row.snapshot_sha256), status: "INVALIDATED" as const, reason: "AUTHORITY_DRIFT", invalidation, missing_roles: snapshot.required_roles, completed_controls: [], signatures: signatures.results ?? [], server_now: now };
  }
  const evaluated = readinessStatus({ snapshot, now, currentCandidateSha256: String(review?.evidence_sha256 ?? ""), currentCriticReviewId: Number(review?.id ?? 0), signatures: signatures.results ?? [] });
  await recordSystemTelemetry(db, "steer_release_readiness_outcome_total", "outcome", evaluated.status, 1, snapshot.work_item_id);
  if (evaluated.status === "INVALIDATED") await recordSystemTelemetry(db, "steer_release_readiness_invalidation_total", "reason", "CANDIDATE_OR_CRITIC_DRIFT", 1, snapshot.work_item_id);
  await recordSystemTelemetry(db, "steer_release_readiness_latency_ms", "", "", Math.min(60_000, Math.round(performance.now() - startedAt)), snapshot.work_item_id);
  const completedControls = ["Exact candidate", "Signed staging verification", "Passing signed Critic", "Risk policy v1"];
  if (evaluated.status === "READY") completedControls.push(snapshot.satisfaction_path === "TIME" ? "Time separation" : "Qualified human separation");
  return { snapshot, snapshot_sha256: String(row.snapshot_sha256), ...evaluated, signatures: signatures.results ?? [], completed_controls: completedControls, server_now: now };
}

async function createReleaseReadinessSnapshot(request: Request, db: Database, env: Env, user: User, itemId: number) {
  const startedAt = performance.now();
  const member = await memberContext(db, user);
  if (member?.kind !== "human" || member.status !== "available" || !member.role.includes("Product Lead")) return json({ error: "Only the authenticated current Product Lead may freeze release readiness." }, 403);
  const item = await scopedItemOrDenied(db, user, itemId, "release readiness snapshot");
  if (!item) return json({ error: "Work item not found in your POD." }, 404);
  if (String(item.gate) !== "Gate 3 pending") return json({ error: "Release readiness may be frozen only for Gate 3 pending work." }, 409);
  const policy = await db.prepare("SELECT * FROM decision_readiness_policies WHERE pod_id = ? AND status = 'ACTIVE' ORDER BY policy_version DESC LIMIT 1")
    .bind(String(item.pod_id)).first<Record<string, unknown>>();
  if (!policy || Number(policy.policy_version) !== 1 || String(policy.policy_sha256) !== await releaseReadinessDigest(RELEASE_READINESS_POLICY_V1)) return json({ error: "The exact approved release readiness policy is not active." }, 409);
  const review = await db.prepare(`SELECT r.*, a.current_state AS assignment_state, a.pod_id AS assignment_pod_id
      FROM agent_reviews r JOIN review_assignments a ON a.assignment_id = r.review_assignment_id
      WHERE r.item_id = ? AND r.reviewed_item_updated_at = ? AND r.review_mode = 'signed_assignment_review'
      ORDER BY r.created_at DESC, r.id DESC LIMIT 1`)
    .bind(itemId, String(item.updated_at)).first<Record<string, unknown>>();
  if (!review || review.assignment_state !== "RESULT_RECORDED" || review.assignment_pod_id !== item.pod_id ||
      !["APPROVED", "PASS"].includes(String(review.recommendation).toUpperCase()) ||
      !hex40(review.evidence_revision) || !hex64(review.evidence_sha256) ||
      !(await verifyRecordedCriticResult(db, env, review))) {
    return json({ error: "A passing signed Critic result for the exact candidate is required." }, 409);
  }
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const allowedSnapshotKeys = ["brief_path", "brief_commit", "brief_sha256", "exam_path", "exam_commit", "exam_sha256", "implementation_commit", "build_sha256", "migration_set_sha256", "runtime_policy_sha256", "verification_receipt_id", "verification_receipt_sha256", "verification_receipt", "verification_signature", "declared_risk_codes", "operating_mode", "satisfaction_path"];
  if (!body || !hasOnlyKeys(body, allowedSnapshotKeys)) return json({ error: "A bounded exact-candidate packet is required." }, 400);
  const requiredHex40 = [body.brief_commit, body.exam_commit, body.implementation_commit];
  const requiredHex64 = [body.brief_sha256, body.exam_sha256, body.build_sha256, body.migration_set_sha256, body.runtime_policy_sha256, body.verification_receipt_sha256];
  if (!requiredHex40.every(hex40) || !requiredHex64.every(hex64) || String(body.implementation_commit) !== String(review.evidence_revision)) {
    return json({ error: "The readiness packet must bind exact commits, digests, and the Critic target." }, 400);
  }
  const briefPath = String(body.brief_path ?? "");
  const examPath = String(body.exam_path ?? "");
  if (!governedEvidencePath.test(briefPath) || !briefPath.startsWith("steer/briefs/") ||
      !governedEvidencePath.test(examPath) || !examPath.startsWith("steer/exams/")) {
    return json({ error: "The Brief and Exam must be exact governed evidence paths." }, 400);
  }
  const approvedGates = await db.prepare(`SELECT gate, decision, evidence_url, evidence_revision, evidence_sha256
    FROM decisions WHERE item_id = ? AND gate IN ('Gate 1 pending', 'Gate 2 pending')
    ORDER BY created_at DESC, id DESC`).bind(itemId).all<Record<string, unknown>>();
  const gateOne = (approvedGates.results ?? []).find((decision) => decision.gate === "Gate 1 pending" && decision.decision === "APPROVED");
  const gateTwo = (approvedGates.results ?? []).find((decision) => decision.gate === "Gate 2 pending" && decision.decision === "APPROVED");
  const briefUrl = `https://github.com/${allowedGitHubRepository}/blob/${String(body.brief_commit)}/${briefPath}`;
  const examUrl = `https://github.com/${allowedGitHubRepository}/blob/${String(body.exam_commit)}/${examPath}`;
  if (!gateOne || gateOne.evidence_url !== briefUrl || gateOne.evidence_revision !== body.brief_commit || gateOne.evidence_sha256 !== body.brief_sha256 ||
      !gateTwo || gateTwo.evidence_url !== examUrl || gateTwo.evidence_revision !== body.exam_commit || gateTwo.evidence_sha256 !== body.exam_sha256) {
    return json({ error: "The packet does not match the authenticated exact-evidence Gate 1 and Gate 2 approvals." }, 409);
  }
  const [resolvedBrief, resolvedExam] = await Promise.all([
    readEvidence(briefUrl),
    readEvidence(examUrl),
  ]);
  if (resolvedBrief.revision !== body.brief_commit || resolvedBrief.sha256 !== body.brief_sha256 ||
      resolvedExam.revision !== body.exam_commit || resolvedExam.sha256 !== body.exam_sha256) {
    return json({ error: "The server could not resolve the exact approved Brief and Exam bytes." }, 409);
  }
  if (env.STEER_SOURCE_REVISION && env.STEER_SOURCE_REVISION !== body.implementation_commit ||
      env.STEER_BUILD_SHA256 && env.STEER_BUILD_SHA256 !== body.build_sha256 ||
      env.STEER_MIGRATION_SET_SHA256 && env.STEER_MIGRATION_SET_SHA256 !== body.migration_set_sha256 ||
      env.STEER_RUNTIME_POLICY_SHA256 && env.STEER_RUNTIME_POLICY_SHA256 !== body.runtime_policy_sha256) {
    return json({ error: "The hosted runtime does not match the exact candidate packet." }, 409);
  }
  const verificationReceiptId = String(body.verification_receipt_id ?? "");
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{2,199}$/.test(verificationReceiptId)) return json({ error: "A bounded authoritative staging verification receipt identity is required." }, 400);
  let verificationRow = await db.prepare("SELECT * FROM staging_verification_receipts WHERE receipt_id = ? AND item_id = ? AND pod_id = ?")
    .bind(verificationReceiptId, itemId, String(item.pod_id)).first<Record<string, unknown>>();
  if (!verificationRow && body.verification_receipt && typeof body.verification_receipt === "object" && !Array.isArray(body.verification_receipt)) {
    const importedReceipt = body.verification_receipt as Record<string, unknown>;
    const importedSha256 = await releaseReadinessDigest(importedReceipt);
    const importedSignature = String(body.verification_signature ?? "");
    const importedSigner = await db.prepare(`SELECT public_key FROM decision_issuer_signers
      WHERE pod_id = ? AND key_id = ? AND key_version = ? AND status = 'ACTIVE'`)
      .bind(String(item.pod_id), String(importedReceipt.key_id ?? ""), Number(importedReceipt.key_version ?? 0)).first<{ public_key: string }>();
    if (importedSha256 === verificationReceiptId && importedSha256 === body.verification_receipt_sha256 &&
        importedReceipt.schema === "steer.staging-verification-receipt/v1" && importedReceipt.environment === "staging" &&
        Number(importedReceipt.item_id) === itemId && importedReceipt.pod_id === item.pod_id && importedReceipt.item_updated_at === item.updated_at &&
        importedSigner && verifyAuthorityPayload("STEER_STAGING_VERIFICATION_V1", importedReceipt, importedSignature, importedSigner.public_key)) {
      await db.prepare(`INSERT INTO staging_verification_receipts
        (receipt_id, item_id, pod_id, receipt_json, receipt_sha256, source_revision, build_sha256,
         migration_set_sha256, runtime_policy_sha256, completed_at, key_id, key_version, service_signature, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(importedSha256, itemId, String(item.pod_id), canonicalJson(importedReceipt), importedSha256,
          String(importedReceipt.source_revision), String(importedReceipt.build_sha256), String(importedReceipt.migration_set_sha256),
          String(importedReceipt.runtime_policy_sha256), String(importedReceipt.completed_at), String(importedReceipt.key_id),
          Number(importedReceipt.key_version), importedSignature, new Date().toISOString()).run();
      verificationRow = await db.prepare("SELECT * FROM staging_verification_receipts WHERE receipt_id = ?").bind(importedSha256).first<Record<string, unknown>>();
    }
  }
  if (!verificationRow || verificationRow.receipt_sha256 !== body.verification_receipt_sha256) return json({ error: "The exact signed staging verification receipt was not found." }, 409);
  const verificationReceipt = JSON.parse(String(verificationRow.receipt_json)) as Record<string, unknown>;
  const verificationSigner = await db.prepare(`SELECT public_key FROM decision_issuer_signers
    WHERE pod_id = ? AND key_id = ? AND key_version = ? AND status = 'ACTIVE'`)
    .bind(String(item.pod_id), String(verificationRow.key_id), Number(verificationRow.key_version)).first<{ public_key: string }>();
  if (!verificationSigner || !verifyAuthorityPayload("STEER_STAGING_VERIFICATION_V1", verificationReceipt, String(verificationRow.service_signature), verificationSigner.public_key) ||
      await releaseReadinessDigest(verificationReceipt) !== verificationRow.receipt_sha256) {
    return json({ error: "The staging verification receipt signature or canonical digest is invalid." }, 409);
  }
  if (verificationReceipt.environment !== "staging" || verificationReceipt.item_updated_at !== item.updated_at ||
      verificationReceipt.source_revision !== body.implementation_commit || verificationReceipt.build_sha256 !== body.build_sha256 ||
      verificationReceipt.migration_set_sha256 !== body.migration_set_sha256 || verificationReceipt.runtime_policy_sha256 !== body.runtime_policy_sha256) {
    return json({ error: "The staging verification receipt does not bind this exact candidate packet." }, 409);
  }
  if (verificationReceipt.brief_path !== briefPath || verificationReceipt.brief_commit !== body.brief_commit || verificationReceipt.brief_sha256 !== body.brief_sha256 ||
      verificationReceipt.exam_path !== examPath || verificationReceipt.exam_commit !== body.exam_commit || verificationReceipt.exam_sha256 !== body.exam_sha256) {
    return json({ error: "The signed verification receipt does not bind the exact approved Brief and Exam." }, 409);
  }
  const candidateBuilderId = String(verificationReceipt.candidate_builder_id ?? "");
  const intendedSubmitterId = String(verificationReceipt.intended_submitter_id ?? "");
  if (candidateBuilderId === intendedSubmitterId) {
    return json({ error: "The intended submitter must remain independent from the frozen Builder." }, 409);
  }
  if (intendedSubmitterId !== user.id) {
    return json({ error: "The snapshot must freeze the exact intended human submitter." }, 409);
  }
  const candidateBuilder = await db.prepare("SELECT id, display_name, role, status, pod_id FROM members WHERE id = ?")
    .bind(candidateBuilderId).first<Record<string, unknown>>();
  if (!candidateBuilder || candidateBuilder.pod_id !== item.pod_id || !["available", "enrolled"].includes(String(candidateBuilder.status)) ||
      !(String(candidateBuilder.role).includes("Builder") || String(candidateBuilder.role).includes("Implementation") || String(candidateBuilder.display_name).includes("Builder"))) {
    return json({ error: "The signed verification receipt must bind one currently eligible Builder in this POD." }, 409);
  }
  const verificationCompletedAt = String(verificationReceipt.completed_at ?? "");
  if (!Number.isFinite(Date.parse(verificationCompletedAt)) || Date.parse(verificationCompletedAt) > Date.now() + 5 * 60 * 1000) return json({ error: "The authoritative verification time is invalid." }, 409);
  const declared = body.declared_risk_codes;
  let derived: unknown = [];
  try { derived = JSON.parse(String(review.derived_tags_json ?? "[]")); } catch { derived = []; }
  const classification = classifyRiskCodes(declared, derived);
  const frozenDeclared = canonicalRiskInputs(declared);
  const frozenDerived = canonicalRiskInputs(derived);
  const operatingMode = String(body.operating_mode ?? "") as "SOLO_CALIBRATION" | "TEAM";
  const satisfactionPath = String(body.satisfaction_path ?? "") as SatisfactionPath;
  const pathError = validateSatisfactionPath(classification, operatingMode, satisfactionPath);
  if (pathError) return json({ error: pathError }, 400);
  const activeSignerPolicy = await db.prepare(`SELECT operating_mode FROM decision_signer_policies
    WHERE pod_id = ? AND status = 'ACTIVE' ORDER BY policy_version DESC LIMIT 1`).bind(String(item.pod_id)).first<{ operating_mode: string }>();
  if (!activeSignerPolicy || activeSignerPolicy.operating_mode !== operatingMode) return json({ error: "The selected operating mode is not the current active signer mode." }, 409);
  const roles = requiredRolesFor(classification.codes, classification.tier);
  const earliest = effectiveNotBefore(verificationCompletedAt, satisfactionPath === "TIME" ? classification.delay_hours : 0);
  const identityInput = {
    schema: "steer.gate-readiness-identity/v1", pod_id: String(item.pod_id), item_id: itemId,
    item_updated_at: String(item.updated_at), review_id: Number(review.id), evidence_sha256: String(review.evidence_sha256),
    policy_sha256: String(policy.policy_sha256),
    candidate: {
      brief_path: briefPath, brief_commit: body.brief_commit, brief_sha256: body.brief_sha256,
      exam_path: examPath, exam_commit: body.exam_commit, exam_sha256: body.exam_sha256,
      implementation_commit: body.implementation_commit, build_sha256: body.build_sha256,
      migration_set_sha256: body.migration_set_sha256, runtime_policy_sha256: body.runtime_policy_sha256,
      verification_receipt_id: verificationReceiptId, verification_receipt_sha256: body.verification_receipt_sha256,
      verification_completed_at: verificationCompletedAt, declared_risk_codes: frozenDeclared,
      derived_risk_codes: frozenDerived, operating_mode: operatingMode, satisfaction_path: satisfactionPath,
      critic_assignment_id: String(review.review_assignment_id), candidate_builder_id: candidateBuilderId,
      intended_submitter_id: intendedSubmitterId,
    },
  };
  const snapshotId = await releaseReadinessDigest(identityInput);
  const existing = await db.prepare("SELECT * FROM decision_readiness_snapshots WHERE snapshot_id = ? AND pod_id = ?")
    .bind(snapshotId, String(item.pod_id)).first<Record<string, unknown>>();
  if (existing) {
    await recordSystemTelemetry(db, "steer_release_snapshot_creation_latency_ms", "outcome", "replay", Math.min(60_000, Math.round(performance.now() - startedAt)), itemId);
    return json({ ...(await releaseReadinessView(db, existing, env)), replay: true });
  }
  const predecessor = await db.prepare("SELECT * FROM decision_readiness_snapshots WHERE item_id = ? AND pod_id = ? AND current_state = 'ACTIVE' ORDER BY created_at DESC LIMIT 1")
    .bind(itemId, String(item.pod_id)).first<Record<string, unknown>>();
  const now = new Date().toISOString();
  const authorityFrozenAt = new Date(Math.max(Date.parse(verificationCompletedAt), Date.parse(String(review.created_at)))).toISOString();
  const snapshot: ReleaseReadinessSnapshot = {
    schema: "steer.gate-readiness-snapshot/v1", snapshot_id: snapshotId, work_item_id: itemId,
    work_item_key: String(item.key), work_item_updated_at: String(item.updated_at), pod_id: String(item.pod_id),
    brief_path: briefPath, brief_commit: String(body.brief_commit), brief_sha256: String(body.brief_sha256),
    exam_path: examPath, exam_commit: String(body.exam_commit), exam_sha256: String(body.exam_sha256),
    implementation_commit: String(body.implementation_commit), build_sha256: String(body.build_sha256),
    migration_set_sha256: String(body.migration_set_sha256), runtime_policy_sha256: String(body.runtime_policy_sha256),
    verification_receipt_id: verificationReceiptId,
    verification_receipt_sha256: String(body.verification_receipt_sha256), verification_completed_at: verificationCompletedAt,
    critic_assignment_id: String(review.review_assignment_id), critic_review_id: Number(review.id), critic_target_revision: String(review.evidence_revision), critic_recommendation: String(review.recommendation),
    evidence_set_sha256: String(review.evidence_sha256), declared_risk_codes: frozenDeclared,
    derived_risk_codes: frozenDerived, resolved_risk_codes: classification.codes,
    classification_errors: classification.errors, tier: classification.tier, risk_policy_version: 1,
    risk_policy_sha256: String(policy.policy_sha256),
    operating_mode: operatingMode, satisfaction_path: satisfactionPath, delay_hours: classification.delay_hours,
    required_roles: roles, candidate_builder_id: candidateBuilderId, candidate_builder_eligible: true, intended_submitter_id: intendedSubmitterId,
    effective_not_before: earliest, created_by: user.id, created_at: authorityFrozenAt,
    predecessor_snapshot_sha256: predecessor ? String(predecessor.snapshot_sha256) : null,
  };
  const snapshotSha256 = await releaseReadinessDigest(snapshot);
  const authority = releaseReadinessAuthority(snapshot, snapshotSha256);
  const event = { schema: "steer.gate-readiness-event/v1", snapshot_id: snapshotId, event_type: "SNAPSHOT_FROZEN", readiness_authority: authority, actor_id: user.id, occurred_at: now };
  const eventSha256 = await releaseReadinessDigest(event);
  if (predecessor) {
    const predecessorSnapshot = JSON.parse(String(predecessor.snapshot_json)) as ReleaseReadinessSnapshot;
    const change = await readinessDrift("CANDIDATE_SNAPSHOT", releaseReadinessAuthority(predecessorSnapshot, String(predecessor.snapshot_sha256)), authority);
    if (change) await invalidateReleaseReadiness(db, predecessor, predecessorSnapshot, [change], now);
  }
  const statements = [] as Statement[];
  statements.push(
    db.prepare(`INSERT INTO decision_readiness_snapshots
      (snapshot_id, item_id, pod_id, snapshot_json, snapshot_sha256, evidence_set_sha256, critic_review_id,
       tier, satisfaction_path, effective_not_before, current_state, invalidation_reason,
       predecessor_snapshot_sha256, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', NULL, ?, ?, ?)`).bind(
      snapshotId, itemId, String(item.pod_id), canonicalJson(snapshot), snapshotSha256, snapshot.evidence_set_sha256,
      snapshot.critic_review_id, snapshot.tier, snapshot.satisfaction_path, snapshot.effective_not_before,
      snapshot.predecessor_snapshot_sha256, user.id, now,
    ),
    db.prepare("INSERT INTO decision_readiness_events (snapshot_id, event_type, event_json, event_sha256, actor_id, created_at) VALUES (?, 'SNAPSHOT_FROZEN', ?, ?, ?, ?)").bind(snapshotId, canonicalJson(event), eventSha256, user.id, now),
  );
  try {
    await db.batch(statements);
  } catch (error) {
    const raced = await db.prepare("SELECT * FROM decision_readiness_snapshots WHERE snapshot_id = ? AND pod_id = ?")
      .bind(snapshotId, String(item.pod_id)).first<Record<string, unknown>>();
    if (raced && raced.snapshot_sha256 === snapshotSha256) {
      await recordSystemTelemetry(db, "steer_release_snapshot_creation_latency_ms", "outcome", "replay", Math.min(60_000, Math.round(performance.now() - startedAt)), itemId);
      return json({ ...(await releaseReadinessView(db, raced, env)), replay: true });
    }
    throw error;
  }
  const stored = await db.prepare("SELECT * FROM decision_readiness_snapshots WHERE snapshot_id = ?").bind(snapshotId).first<Record<string, unknown>>();
  await recordSystemTelemetry(db, "steer_release_risk_classification_total", "tier", snapshot.tier, 1, itemId);
  await recordSystemTelemetry(db, "steer_release_snapshot_creation_latency_ms", "outcome", "created", Math.min(60_000, Math.round(performance.now() - startedAt)), itemId);
  return json({ ...(await releaseReadinessView(db, stored!, env)), replay: false }, 201);
}

async function getReleaseReadiness(db: Database, env: Env, user: User, itemId: number) {
  const item = await scopedItemOrDenied(db, user, itemId, "release readiness read");
  if (!item) return json({ error: "Work item not found in your POD." }, 404);
  const row = await db.prepare("SELECT * FROM decision_readiness_snapshots WHERE item_id = ? AND pod_id = ? ORDER BY created_at DESC LIMIT 1")
    .bind(itemId, String(item.pod_id)).first<Record<string, unknown>>();
  return row ? json(await releaseReadinessView(db, row, env)) : json({ status: "NOT_READY", reason: "READINESS_SNAPSHOT_REQUIRED", snapshot: null, missing_roles: [], completed_controls: [] });
}

async function countersignReleaseReadiness(request: Request, db: Database, env: Env, user: User, snapshotId: string) {
  const member = await memberContext(db, user);
  const row = await db.prepare("SELECT * FROM decision_readiness_snapshots WHERE snapshot_id = ?").bind(snapshotId).first<Record<string, unknown>>();
  if (!row) return json({ error: "Release readiness snapshot not found." }, 404);
  const snapshot = JSON.parse(String(row.snapshot_json)) as ReleaseReadinessSnapshot;
  if (!member || member.kind !== "human" || member.status !== "available" || member.pod_id !== snapshot.pod_id) {
    await recordSystemTelemetry(db, "steer_release_countersignature_total", "outcome", "rejected_authority", 1, snapshot.work_item_id);
    return json({ error: "A current enrolled human in the same POD is required." }, 403);
  }
  if (snapshot.satisfaction_path === "TIME") return json({ error: "This snapshot uses the time-separation path." }, 409);
  if (snapshot.intended_submitter_id === user.id || snapshot.candidate_builder_id === user.id) {
    await recordSystemTelemetry(db, "steer_release_countersignature_total", "outcome", "rejected_authority", 1, snapshot.work_item_id);
    return json({ error: "The submitter or Builder cannot satisfy an independent-human slot." }, 403);
  }
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || !hasOnlyKeys(body, ["role", "reason"])) return json({ error: "Countersignature input is outside the bounded contract." }, 400);
  const role = String(body?.role ?? "");
  const reason = String(body?.reason ?? "").trim();
  if (!snapshot.required_roles.includes(role) || !member.role.includes(role) || reason.length < 12 || reason.length > 500) {
    await recordSystemTelemetry(db, "steer_release_countersignature_total", "outcome", "rejected_role", 1, snapshot.work_item_id);
    return json({ error: "Choose one currently held required role and record concise reasoning." }, 400);
  }
  const existingMember = await db.prepare("SELECT * FROM decision_readiness_countersignatures WHERE snapshot_id = ? AND member_id = ?").bind(snapshotId, user.id).first<Record<string, unknown>>();
  if (existingMember) {
    await recordSystemTelemetry(db, "steer_release_countersignature_total", "outcome", "replay", 1, snapshot.work_item_id);
    return json({ ...(await releaseReadinessView(db, row, env)), replay: true });
  }
  const now = new Date().toISOString();
  const authority = releaseReadinessAuthority(snapshot, String(row.snapshot_sha256));
  const proof = { schema: "steer.gate-readiness-countersignature/v1", readiness_authority: authority, member_id: user.id, role, reason_sha256: await sha256Hex(reason), signed_at: now };
  const proofSha256 = await releaseReadinessDigest(proof);
  const event = { schema: "steer.gate-readiness-event/v1", snapshot_id: snapshotId, event_type: "COUNTERSIGNATURE_ACCEPTED", readiness_authority: authority, proof_sha256: proofSha256, actor_id: user.id, occurred_at: now };
  try {
    await db.batch([
      db.prepare("INSERT INTO decision_readiness_countersignatures (snapshot_id, member_id, role, proof_json, proof_sha256, status, created_at) VALUES (?, ?, ?, ?, ?, 'ACCEPTED', ?)").bind(snapshotId, user.id, role, canonicalJson(proof), proofSha256, now),
      db.prepare("INSERT INTO decision_readiness_events (snapshot_id, event_type, event_json, event_sha256, actor_id, created_at) VALUES (?, 'COUNTERSIGNATURE_ACCEPTED', ?, ?, ?, ?)").bind(snapshotId, canonicalJson(event), await releaseReadinessDigest(event), user.id, now),
    ]);
  } catch (error) {
    const raced = await db.prepare("SELECT * FROM decision_readiness_countersignatures WHERE snapshot_id = ? AND member_id = ?")
      .bind(snapshotId, user.id).first<Record<string, unknown>>();
    if (raced?.proof_sha256 === proofSha256) return json({ ...(await releaseReadinessView(db, row, env)), replay: true });
    throw error;
  }
  await recordSystemTelemetry(db, "steer_release_countersignature_total", "outcome", "accepted", 1, snapshot.work_item_id);
  return json({ ...(await releaseReadinessView(db, row, env)), replay: false }, 201);
}

async function activateDecisionIssuer(request: Request, db: Database, user: User) {
  const member = await memberContext(db, user);
  if (member?.kind !== "human" || !member.role.includes("Tech Lead")) return json({ error: "Only the authenticated Tech Lead may activate a decision issuer public key." }, 403);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || !hasOnlyKeys(body, ["key_id", "key_version", "public_key", "reason"])) return json({ error: "The issuer activation input is outside the bounded contract." }, 400);
  const keyId = String(body?.key_id ?? "");
  const keyVersion = Number(body?.key_version ?? 0);
  const publicKey = String(body?.public_key ?? "");
  const reason = String(body?.reason ?? "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/.test(keyId) || !Number.isInteger(keyVersion) || keyVersion < 1 || !/^[0-9a-f]{64}$/.test(publicKey) || reason.length < 12) {
    return json({ error: "Provide a valid issuer key id, positive version, Ed25519 public key, and activation reason." }, 400);
  }
  const existing = await db.prepare("SELECT * FROM decision_issuer_signers WHERE pod_id = ? AND key_id = ? AND key_version = ?")
    .bind(String(member.pod_id), keyId, keyVersion).first<Record<string, unknown>>();
  if (existing) {
    if (existing.public_key !== publicKey || existing.status !== "ACTIVE") return json({ error: "That signer identity is already bound to different immutable bytes." }, 409);
    return json({ ok: true, key_id: keyId, key_version: keyVersion, public_key: publicKey, status: "ACTIVE", replay: true });
  }
  const now = new Date().toISOString();
  await db.prepare(`INSERT INTO decision_issuer_signers
    (pod_id, key_id, key_version, public_key, status, activated_by, activation_reason, created_at)
    VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?)`).bind(String(member.pod_id), keyId, keyVersion, publicKey, user.id, reason, now).run();
  return json({ ok: true, key_id: keyId, key_version: keyVersion, public_key: publicKey, status: "ACTIVE", replay: false }, 201);
}

async function proveDecisionIntent(request: Request, db: Database, env: Env, intentId: string) {
  const token = String(env.DECISION_SERVICE_TOKEN ?? "");
  if (token.length < 32 || request.headers.get("authorization") !== `Bearer ${token}`) return json({ error: "Decision proof service authentication failed." }, 401);
  const privateKey = String(env.DECISION_SERVICE_PRIVATE_KEY ?? "");
  const keyId = String(env.DECISION_SERVICE_KEY_ID ?? "");
  const keyVersion = Number(env.DECISION_SERVICE_KEY_VERSION ?? 0);
  if (!/^[0-9a-f]{64}$/.test(privateKey) || !keyId || !Number.isInteger(keyVersion) || keyVersion < 1) return json({ error: "Decision proof service configuration is incomplete." }, 503);
  const intentRow = await db.prepare("SELECT * FROM decision_intents WHERE intent_id = ?").bind(intentId).first<Record<string, unknown>>();
  if (!intentRow) return json({ error: "Decision intent not found." }, 404);
  const intent = JSON.parse(String(intentRow.intent_json)) as DecisionIntentPayload;
  if (!await currentIntentAuthority(db, intentRow, intent, true)) {
    await appendDecisionFailure(db, intentRow, intent, "ISSUER_AUTHORITY_REJECTED", "SUBMITTER_OR_SESSION_AUTHORITY_DRIFT", "PROOF_FAILED");
    return json({ error: "The submitter membership, role, POD, or decision session is no longer valid; the intent remains ineffective." }, 409);
  }
  const publicKey = decisionIssuerPublicKey(privateKey);
  const signer = await db.prepare(`SELECT * FROM decision_issuer_signers
    WHERE pod_id = ? AND key_id = ? AND key_version = ? AND status = 'ACTIVE'`)
    .bind(String(intentRow.pod_id), keyId, keyVersion).first<Record<string, unknown>>();
  if (!signer || signer.public_key !== publicKey) return json({ error: "The configured private key has no matching human-activated public signer record." }, 409);
  const existingEnvelope = await db.prepare("SELECT * FROM decision_issuer_envelopes WHERE intent_id = ?").bind(intentId).first<Record<string, unknown>>();
  if (existingEnvelope) return json({ ...safeDecisionExport(intent, String(intentRow.current_state) as "PENDING_COUNTERSIGNATURE", String(intentRow.current_event_sha256)), issuer_envelope_sha256: existingEnvelope.envelope_sha256, replay: true });
  if (intentRow.current_state !== "PENDING_PROOF" || Number(intentRow.current_sequence) !== 1) return json({ error: "Only an exact sequence-1 PENDING_PROOF intent may receive issuer proof." }, 409);
  const now = new Date().toISOString();
  const envelope = await createDecisionIssuerEnvelope({ intent, privateKeyHex: privateKey, keyId, issuerPrincipal: "steer-decision-proof-service", issuedAt: now.replace(/\.\d{3}Z$/, "Z") });
  if (!await verifyDecisionIssuerEnvelope(envelope, publicKey)) return json({ error: "The generated issuer envelope did not independently verify." }, 500);
  const envelopeSha256 = await decisionDigest(envelope);
  const sequence = 2;
  const eventResult = await buildDecisionEvent({ intent_id: intentId, sequence, previous_event_sha256: String(intentRow.current_event_sha256), event_type: "ISSUER_PROOF_VERIFIED", resulting_state: "PENDING_COUNTERSIGNATURE", actor_id: "steer-decision-proof-service", occurred_at: now, payload: { envelope_sha256: envelopeSha256, key_id: keyId, key_version: keyVersion, public_key_sha256: await decisionDigest(publicKey), readiness_authority: intent.readiness_authority ?? null } });
  try {
    await db.batch([
      db.prepare(`INSERT INTO decision_issuer_envelopes
      (intent_id, key_id, key_version, envelope_json, envelope_sha256, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(intentId, keyId, keyVersion, JSON.stringify(envelope), envelopeSha256, now),
      db.prepare(`INSERT INTO decision_proof_events
      (intent_id, sequence, event_type, resulting_state, previous_event_sha256, event_json, event_sha256, actor_id, created_at)
      VALUES (?, ?, 'ISSUER_PROOF_VERIFIED', 'PENDING_COUNTERSIGNATURE', ?, ?, ?, 'steer-decision-proof-service', ?)`)
      .bind(intentId, sequence, String(intentRow.current_event_sha256), JSON.stringify(eventResult.event), eventResult.event_sha256, now),
      db.prepare(`UPDATE decision_intents SET current_state = 'PENDING_COUNTERSIGNATURE', current_sequence = ?,
      current_event_sha256 = ?, updated_at = ? WHERE intent_id = ? AND current_state = 'PENDING_PROOF' AND current_sequence = 1`)
      .bind(sequence, eventResult.event_sha256, now, intentId),
    ]);
  } catch (error) {
    const racedEnvelope = await db.prepare("SELECT envelope_sha256 FROM decision_issuer_envelopes WHERE intent_id = ?")
      .bind(intentId).first<{ envelope_sha256: string }>();
    const racedIntent = await db.prepare("SELECT current_state, current_event_sha256 FROM decision_intents WHERE intent_id = ?")
      .bind(intentId).first<Record<string, unknown>>();
    if (racedEnvelope && racedIntent?.current_state === "PENDING_COUNTERSIGNATURE") {
      return json({ ...safeDecisionExport(intent, "PENDING_COUNTERSIGNATURE", String(racedIntent.current_event_sha256)), issuer_envelope_sha256: racedEnvelope.envelope_sha256, replay: true });
    }
    throw error;
  }
  return json({ ...safeDecisionExport(intent, "PENDING_COUNTERSIGNATURE", eventResult.event_sha256), issuer_envelope_sha256: envelopeSha256, replay: false }, 201);
}

async function finalizeDecisionIntent(request: Request, db: Database, env: Env, intentId: string) {
  const token = String(env.DECISION_SERVICE_TOKEN ?? "");
  if (token.length < 32 || request.headers.get("authorization") !== `Bearer ${token}`) return json({ error: "Decision finalization service authentication failed." }, 401);
  const row = await db.prepare(`SELECT i.*, w.key AS item_key, w.gate AS gate, w.phase, w.state,
      w.decision_status, w.decision_authority, w.assignee_id, w.next_action, w.rework_instructions,
      w.blocked_since, w.delivery_forecast_json, w.delivery_owner_id, w.evidence_url AS item_evidence_url,
      w.updated_at AS item_updated_at
    FROM decision_intents i JOIN work_items w ON w.id = i.item_id WHERE i.intent_id = ?`)
    .bind(intentId).first<Record<string, unknown>>();
  if (!row) return json({ error: "Decision intent not found." }, 404);
  const intent = JSON.parse(String(row.intent_json)) as DecisionIntentPayload;
  if (await decisionDigest(intent) !== row.intent_sha256) return json({ error: "The immutable intent digest does not match its stored payload." }, 409);
  if (row.current_state === "EFFECTIVE") return json({ ...safeDecisionExport(intent, "EFFECTIVE", String(row.current_event_sha256)), replay: true });
  if (!await currentIntentAuthority(db, row, intent, false)) {
    await appendDecisionFailure(db, row, intent, "FINALIZATION_AUTHORITY_REJECTED", "SUBMITTER_OR_SESSION_AUTHORITY_DRIFT", "PENDING_COUNTERSIGNATURE");
    return json({ error: "Current human membership, role, POD, or durable session proof no longer authorizes this decision; it remains ineffective." }, 409);
  }
  const controlledNow = request.headers.get("x-steer-controlled-now");
  const controlledClockAllowed = env.STEER_DEPLOYMENT_ENV === "staging" && controlledNow !== null &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(controlledNow) &&
    Math.abs(Date.parse(controlledNow) - Date.now()) <= 48 * 60 * 60 * 1000;
  if (controlledNow !== null && !controlledClockAllowed) return json({ error: "The controlled clock is restricted to a bounded authenticated staging verification window." }, 400);
  const now = controlledClockAllowed ? new Date(Date.parse(controlledNow!)).toISOString() : new Date().toISOString();
  const clockAuthority = controlledClockAllowed ? "STAGING_SIGNED_TEST_CLOCK" : "SERVER_CLOCK";
  const acceptedCountersignatures = await db.prepare(`SELECT COUNT(*) AS count FROM decision_proof_events
    WHERE intent_id = ? AND event_type = 'COUNTERSIGNATURE_VERIFIED'`)
    .bind(intentId).first<{ count: number }>();
  if (Number(row.required_countersignatures) !== intent.required_countersignatures ||
      row.effective_not_before !== intent.effective_not_before ||
      Number(row.signer_policy_version) !== intent.signer_policy_version ||
      String(row.readiness_snapshot_sha256 ?? "") !== (intent.readiness_snapshot_sha256 ?? "")) {
    return json({ error: "The immutable signer-policy projection does not match the signed decision intent." }, 409);
  }
  let readinessAtFinalization: Awaited<ReturnType<typeof releaseReadinessView>> | null = null;
  let readinessAuthorityAtFinalization: ReturnType<typeof releaseReadinessAuthority> | null = null;
  if (intent.readiness_snapshot_sha256) {
    const readinessRow = await db.prepare(`SELECT * FROM decision_readiness_snapshots
      WHERE snapshot_sha256 = ? AND item_id = ? AND pod_id = ? AND current_state = 'ACTIVE'`)
      .bind(intent.readiness_snapshot_sha256, Number(row.item_id), String(row.pod_id)).first<Record<string, unknown>>();
    if (!readinessRow) return json({ error: "The intent-bound release readiness snapshot is no longer active; create a replacement snapshot, session, and intent." }, 409);
    readinessAtFinalization = await releaseReadinessView(db, readinessRow, env, now);
    if (readinessAtFinalization.status !== "READY") {
      const blockedSnapshot = readinessAtFinalization.snapshot as ReleaseReadinessSnapshot;
      await recordSystemTelemetry(db, "steer_release_finalization_total", "outcome", "blocked_readiness", 1, Number(row.item_id));
      if (blockedSnapshot.satisfaction_path === "TIME" && readinessAtFinalization.status === "NOT_READY") {
        await recordSystemTelemetry(db, "steer_release_readiness_boundary_rejection_total", "tier", blockedSnapshot.tier, 1, Number(row.item_id));
      }
      return json({ error: `Release readiness is ${readinessAtFinalization.status}: ${readinessAtFinalization.reason}. No Gate effect was created.`, readiness: readinessAtFinalization }, 409);
    }
    const boundSnapshot = readinessAtFinalization.snapshot as ReleaseReadinessSnapshot;
    const canonicalAuthority = releaseReadinessAuthority(boundSnapshot, String(readinessRow.snapshot_sha256));
    readinessAuthorityAtFinalization = canonicalAuthority;
    if (!intent.readiness_authority || canonicalJson(intent.readiness_authority) !== canonicalJson(canonicalAuthority)) {
      return json({ error: "The signed intent does not match the complete canonical readiness authority." }, 409);
    }
    const [briefEvidence, examEvidence] = await Promise.all([
      readEvidence(`https://github.com/${allowedGitHubRepository}/blob/${canonicalAuthority.brief_commit}/${canonicalAuthority.brief_path}`),
      readEvidence(`https://github.com/${allowedGitHubRepository}/blob/${canonicalAuthority.exam_commit}/${canonicalAuthority.exam_path}`),
    ]);
    if (briefEvidence.sha256 !== canonicalAuthority.brief_sha256 || briefEvidence.revision !== canonicalAuthority.brief_commit ||
        examEvidence.sha256 !== canonicalAuthority.exam_sha256 || examEvidence.revision !== canonicalAuthority.exam_commit) {
      return json({ error: "The intent-bound approved Brief or Exam no longer resolves to its exact bytes." }, 409);
    }
    const session = await db.prepare("SELECT started_at FROM decision_sessions WHERE session_id = ?")
      .bind(intent.decision_session_id).first<{ started_at: string }>();
    if (!session || session.started_at < boundSnapshot.created_at) return json({ error: "The Gate 3 session predates the exact readiness snapshot." }, 409);
  }
  const finalizationError = decisionFinalizationError({
    state: String(row.current_state) as "PENDING_COUNTERSIGNATURE",
    requiredCountersignatures: intent.required_countersignatures,
    acceptedCountersignatures: Number(acceptedCountersignatures?.count ?? 0),
    effectiveNotBefore: intent.effective_not_before,
    now,
  });
  if (finalizationError) return json({ error: finalizationError, ...safeDecisionExport(intent, String(row.current_state) as "PENDING_COUNTERSIGNATURE", String(row.current_event_sha256)) }, 409);
  const envelopeRow = await db.prepare(`SELECT e.*, s.public_key FROM decision_issuer_envelopes e
    JOIN decision_issuer_signers s ON s.pod_id = ? AND s.key_id = e.key_id AND s.key_version = e.key_version
    WHERE e.intent_id = ? AND s.status = 'ACTIVE'`)
    .bind(String(row.pod_id), intentId).first<Record<string, unknown>>();
  if (!envelopeRow) return json({ error: "The active issuer proof is missing or no longer trusted." }, 409);
  const envelope = JSON.parse(String(envelopeRow.envelope_json)) as Parameters<typeof verifyDecisionIssuerEnvelope>[0];
  const envelopeMatchesIntent = envelope.payload.intent_id === intent.intent_id &&
    envelope.payload.receipt_id === intent.receipt_id && envelope.payload.package_id === intent.package_id &&
    envelope.payload.intent_sha256 === row.intent_sha256 && envelope.payload.idempotency_key === intent.idempotency_key &&
    envelope.payload.item_key === intent.item_key && envelope.payload.decision_kind === intent.decision_kind &&
    envelope.payload.decision === intent.decision && envelope.payload.submitter_principal === intent.submitter_principal &&
    envelope.payload.draft_sha256 === intent.draft_sha256 && envelope.payload.evidence_set_sha256 === intent.evidence_set_sha256 &&
    envelope.payload.submitted_at === intent.submitted_at && envelope.payload.effective_not_before === intent.effective_not_before &&
    envelope.payload.operating_mode === intent.operating_mode && envelope.payload.signer_policy_version === intent.signer_policy_version &&
    envelope.payload.required_countersignatures === intent.required_countersignatures &&
    envelope.payload.readiness_snapshot_sha256 === (intent.readiness_snapshot_sha256 ?? "") &&
    canonicalJson(envelope.payload.readiness_authority) === canonicalJson(intent.readiness_authority ?? null) &&
    canonicalJson(envelope.payload.target) === canonicalJson(intent.target) &&
    envelope.payload.final_reasoning_sha256 === await sha256Hex(intent.final_reasoning);
  if (!await verifyDecisionIssuerEnvelope(envelope, String(envelopeRow.public_key)) || !envelopeMatchesIntent) {
    return json({ error: "The issuer proof does not verify against this exact decision intent." }, 409);
  }
  if (intent.readiness_snapshot_sha256) {
    const readinessPolicy = await db.prepare(`SELECT * FROM decision_readiness_policies
      WHERE pod_id = ? AND status = 'ACTIVE' ORDER BY policy_version DESC LIMIT 1`)
      .bind(String(row.pod_id)).first<Record<string, unknown>>();
    if (!readinessPolicy || Number(readinessPolicy.policy_version) !== 1 ||
        String(readinessPolicy.policy_sha256) !== await releaseReadinessDigest(RELEASE_READINESS_POLICY_V1)) {
      return json({ error: "The exact intent-bound release readiness policy is no longer active." }, 409);
    }
  } else {
    const latestPolicy = await db.prepare(`SELECT * FROM decision_signer_policies
      WHERE pod_id = ? AND status = 'ACTIVE' ORDER BY policy_version DESC LIMIT 1`)
      .bind(String(row.pod_id)).first<Record<string, unknown>>();
    if (!latestPolicy || Number(latestPolicy.policy_version) !== intent.signer_policy_version ||
        latestPolicy.operating_mode !== intent.operating_mode ||
        Number(latestPolicy.required_countersignatures) !== intent.required_countersignatures) {
      return json({ error: "Signer policy changed after submission; this pending intent must be superseded and resubmitted." }, 409);
    }
  }
  const exactEvidenceUrl = `${intent.target.repository_uri}/blob/${intent.target.commit}/${intent.target.path}`;
  if (row.item_key !== intent.item_key || row.gate !== intent.decision_kind || row.item_evidence_url !== exactEvidenceUrl) {
    return json({ error: "The work item or exact evidence target changed during cooling; this intent remains ineffective." }, 409);
  }
  const resolvedEvidence = await readEvidence(exactEvidenceUrl);
  if (resolvedEvidence.revision !== intent.target.commit || resolvedEvidence.sha256 !== intent.target.body_sha256) {
    return json({ error: "The exact target no longer resolves to the intent-bound revision and SHA-256." }, 409);
  }
  let review: Record<string, unknown> | null = null;
  if (readinessAuthorityAtFinalization) {
    review = await db.prepare(`SELECT r.*, a.assignment_json FROM agent_reviews r
      JOIN review_assignments a ON a.assignment_id = r.review_assignment_id
      WHERE r.id = ? AND r.item_id = ? AND r.reviewed_item_updated_at = ?`)
      .bind(readinessAuthorityAtFinalization.critic_review_id, Number(row.item_id), String(row.item_updated_at))
      .first<Record<string, unknown>>();
    try {
      const assignment = JSON.parse(String(review?.assignment_json ?? "")) as ReviewAssignmentPayload;
      const artifact = assignment.target.target_artifacts.find((candidate) => candidate.url === exactEvidenceUrl);
      if (!review || !artifact || assignment.target.target_git_commit_oid !== intent.target.commit || artifact.sha256 !== intent.target.body_sha256 ||
          review.evidence_sha256 !== readinessAuthorityAtFinalization.evidence_set_sha256 ||
          !(await verifyRecordedCriticResult(db, env, review))) review = null;
    } catch {
      review = null;
    }
  } else {
    review = await db.prepare(`SELECT id FROM agent_reviews WHERE item_id = ? AND reviewed_item_updated_at = ?
      AND evidence_url = ? AND evidence_revision = ? AND evidence_sha256 = ? ORDER BY created_at DESC, id DESC LIMIT 1`)
      .bind(Number(row.item_id), String(row.item_updated_at), exactEvidenceUrl, intent.target.commit, intent.target.body_sha256)
      .first<Record<string, unknown>>();
  }
  if (!review) return json({ error: "A fresh exact-target Critic review is required at finalization." }, 409);
  if (intent.decision === "APPROVED" && intent.decision_kind === "Gate 1 pending") {
    const value = await db.prepare("SELECT value_hypothesis_json FROM work_items WHERE id = ?").bind(Number(row.item_id)).first<{ value_hypothesis_json: string | null }>();
    if (!gateOneValueReady(value?.value_hypothesis_json)) return json({ error: "Gate 1 remains default-closed until the accepted Value Hypothesis is complete." }, 409);
  }
  const transition = decisionTransition(row, intent.decision, intent.final_reasoning);
  const blockedSince = transition.state === "blocked" ? row.blocked_since ?? now : null;
  const sequence = Number(row.current_sequence) + 1;
  const eventResult = await buildDecisionEvent({
    intent_id: intentId, sequence, previous_event_sha256: String(row.current_event_sha256),
    event_type: "DECISION_EFFECTIVE", resulting_state: "EFFECTIVE", actor_id: "steer-decision-finalization-service",
    occurred_at: now, payload: { receipt_id: intent.receipt_id, decision: intent.decision, item_key: intent.item_key, target: intent.target, readiness_authority: intent.readiness_authority ?? null, clock_authority: clockAuthority },
  });
  const submitter = await db.prepare("SELECT email FROM members WHERE id = ? AND pod_id = ?")
    .bind(intent.submitter_principal, String(row.pod_id)).first<{ email: string | null }>();
  try {
    await db.batch([
      db.prepare(`INSERT INTO decisions
        (item_id, gate, decision, reasoning, actor_id, actor_email, review_id, evidence_url,
         evidence_revision, evidence_sha256, decision_intent_id, created_at)
        SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? FROM work_items
        WHERE id = ? AND gate = ? AND updated_at = ?`)
        .bind(Number(row.item_id), intent.decision_kind, intent.decision, intent.final_reasoning,
          intent.submitter_principal, submitter?.email ?? null, review.id, exactEvidenceUrl,
          intent.target.commit, intent.target.body_sha256, intentId, now,
          Number(row.item_id), intent.decision_kind, String(row.item_updated_at)),
      db.prepare(`INSERT INTO decision_proof_events
        (intent_id, sequence, event_type, resulting_state, previous_event_sha256, event_json, event_sha256, actor_id, created_at)
        SELECT ?, ?, 'DECISION_EFFECTIVE', 'EFFECTIVE', ?, ?, ?, 'steer-decision-finalization-service', ?
        WHERE EXISTS (SELECT 1 FROM decisions WHERE decision_intent_id = ?)`)
        .bind(intentId, sequence, String(row.current_event_sha256), JSON.stringify(eventResult.event), eventResult.event_sha256, now, intentId),
      db.prepare(`UPDATE decision_intents SET current_state = 'EFFECTIVE', current_sequence = ?,
        current_event_sha256 = ?, updated_at = ? WHERE intent_id = ? AND current_state = 'PENDING_COUNTERSIGNATURE'
        AND current_sequence = ? AND EXISTS (SELECT 1 FROM decisions WHERE decision_intent_id = ?)`)
        .bind(sequence, eventResult.event_sha256, now, intentId, Number(row.current_sequence), intentId),
      db.prepare(`UPDATE work_items SET gate = ?, phase = ?, decision_status = ?, state = ?, decision_authority = ?,
        assignee_id = ?, next_action = ?, rework_instructions = ?, blocked_since = ?, updated_at = ?
        WHERE id = ? AND gate = ? AND updated_at = ? AND EXISTS (SELECT 1 FROM decisions WHERE decision_intent_id = ?)`)
        .bind(transition.gate, transition.phase, transition.decisionStatus, transition.state,
          transition.decisionAuthority, transition.assigneeId, transition.nextAction, transition.reworkInstructions,
          blockedSince, now, Number(row.item_id), intent.decision_kind, String(row.item_updated_at), intentId),
      db.prepare(`INSERT INTO activity (item_id, actor_id, action, detail, created_at)
        SELECT ?, ?, 'decision', ?, ? WHERE EXISTS (SELECT 1 FROM decisions WHERE decision_intent_id = ?)`)
        .bind(Number(row.item_id), intent.submitter_principal,
          `${intent.decision_kind}: ${intent.decision} — ${intent.final_reasoning} (effective receipt ${intent.receipt_id})`, now, intentId),
    ]);
  } catch (error) {
    const persisted = await db.prepare("SELECT current_state, current_event_sha256 FROM decision_intents WHERE intent_id = ?").bind(intentId).first<Record<string, unknown>>();
    if (persisted?.current_state === "EFFECTIVE") return json({ ...safeDecisionExport(intent, "EFFECTIVE", String(persisted.current_event_sha256)), replay: true });
    throw error;
  }
  const persisted = await db.prepare("SELECT current_state, current_event_sha256 FROM decision_intents WHERE intent_id = ?").bind(intentId).first<Record<string, unknown>>();
  if (persisted?.current_state !== "EFFECTIVE") return json({ error: "The work item changed during finalization; no effective decision was recorded." }, 409);
  await requireMaterialReforecast(db, row, Number(row.item_id), { id: intent.submitter_principal, email: submitter?.email ?? null, name: intent.submitter_principal }, `Gate decision ${intent.decision.toLowerCase()} changed execution expectations.`, now, transition.state === "blocked");
  if (intent.readiness_snapshot_sha256) await recordSystemTelemetry(db, "steer_release_finalization_total", "outcome", "effective", 1, Number(row.item_id));
  if (intent.decision === "CHANGES_REQUESTED") {
    const recipient = transition.assigneeId
      ? await db.prepare("SELECT role FROM members WHERE id = ?").bind(transition.assigneeId).first<{ role: string }>()
      : null;
    await db.prepare(`INSERT OR IGNORE INTO notifications
      (dedupe_key, item_id, member_id, recipient_role, kind, title, body, channel, status, created_at)
      VALUES (?, ?, ?, ?, 'rework_requested', ?, ?, 'Block Buzz', 'queued', ?)`)
      .bind(`decision-intent-${intentId}-changes`, Number(row.item_id), transition.assigneeId,
        recipient?.role ?? "Evidence owner", `${intent.item_key} returned for changes`, intent.final_reasoning, now).run();
  }
  return json(safeDecisionExport(intent, "EFFECTIVE", eventResult.event_sha256), 201);
}

async function createStagingVerificationReceipt(request: Request, db: Database, env: Env) {
  if (env.STEER_DEPLOYMENT_ENV !== "staging") return json({ error: "Signed staging verification receipts may be issued only by the staging deployment." }, 409);
  const token = String(env.DECISION_SERVICE_TOKEN ?? "");
  if (token.length < 32 || request.headers.get("authorization") !== `Bearer ${token}`) return json({ error: "Staging verification service authentication failed." }, 401);
  const privateKey = String(env.DECISION_SERVICE_PRIVATE_KEY ?? "");
  const keyId = String(env.DECISION_SERVICE_KEY_ID ?? "");
  const keyVersion = Number(env.DECISION_SERVICE_KEY_VERSION ?? 0);
  if (!hex64(privateKey) || !keyId || !Number.isInteger(keyVersion) || keyVersion < 1) return json({ error: "Staging verification signing configuration is incomplete." }, 503);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || !hasOnlyKeys(body, ["item_id", "environment", "brief_path", "brief_commit", "brief_sha256", "exam_path", "exam_commit", "exam_sha256", "source_revision", "build_sha256", "migration_set_sha256", "runtime_policy_sha256", "case_ledger_sha256", "candidate_builder_id", "intended_submitter_id", "completed_at"])) {
    return json({ error: "The verification receipt input is outside the bounded contract." }, 400);
  }
  const itemId = Number(body?.item_id ?? 0);
  const sourceRevision = String(body?.source_revision ?? "");
  const buildSha256 = String(body?.build_sha256 ?? "");
  const migrationSetSha256 = String(body?.migration_set_sha256 ?? "");
  const runtimePolicySha256 = String(body?.runtime_policy_sha256 ?? "");
  const caseLedgerSha256 = String(body?.case_ledger_sha256 ?? "");
  const completedAt = String(body?.completed_at ?? "");
  const briefPath = String(body?.brief_path ?? "");
  const examPath = String(body?.exam_path ?? "");
  const candidateBuilderId = String(body?.candidate_builder_id ?? "");
  const intendedSubmitterId = String(body?.intended_submitter_id ?? "");
  if (!Number.isInteger(itemId) || itemId < 1 || !hex40(sourceRevision) ||
      ![buildSha256, migrationSetSha256, runtimePolicySha256, caseLedgerSha256].every(hex64) ||
      !hex40(body?.brief_commit) || !hex64(body?.brief_sha256) || !hex40(body?.exam_commit) || !hex64(body?.exam_sha256) ||
      !governedEvidencePath.test(briefPath) || !briefPath.startsWith("steer/briefs/") ||
      !governedEvidencePath.test(examPath) || !examPath.startsWith("steer/exams/") ||
      !/^[A-Za-z0-9][A-Za-z0-9._:-]{1,127}$/.test(candidateBuilderId) ||
      !/^[A-Za-z0-9][A-Za-z0-9._:-]{1,127}$/.test(intendedSubmitterId) ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(completedAt) || Date.parse(completedAt) > Date.now() + 5 * 60 * 1000 || body?.environment !== "staging") {
    return json({ error: "The verification receipt must bind one exact staging candidate, ledger, and authoritative completion time." }, 400);
  }
  const item = await db.prepare("SELECT id, key, pod_id, gate, updated_at FROM work_items WHERE id = ?").bind(itemId).first<Record<string, unknown>>();
  if (!item || item.gate !== "Gate 3 pending") return json({ error: "A Gate 3 pending work item is required." }, 409);
  const [builder, submitter] = await Promise.all([
    db.prepare("SELECT display_name, kind, role, pod_id FROM members WHERE id = ?").bind(candidateBuilderId).first<Record<string, unknown>>(),
    db.prepare("SELECT kind, role, status, pod_id FROM members WHERE id = ?").bind(intendedSubmitterId).first<Record<string, unknown>>(),
  ]);
  if (!builder || builder.pod_id !== item.pod_id || !(String(builder.role).includes("Builder") || String(builder.role).includes("Implementation") || String(builder.display_name).includes("Builder")) ||
      !submitter || submitter.pod_id !== item.pod_id || submitter.kind !== "human" || submitter.status !== "available" || !String(submitter.role).includes("Product Lead")) {
    return json({ error: "The receipt must bind one enrolled candidate Builder and one distinct current Product Lead submitter in the same POD." }, 409);
  }
  const publicKey = decisionIssuerPublicKey(privateKey);
  const signer = await db.prepare(`SELECT * FROM decision_issuer_signers
    WHERE pod_id = ? AND key_id = ? AND key_version = ? AND status = 'ACTIVE'`)
    .bind(String(item.pod_id), keyId, keyVersion).first<Record<string, unknown>>();
  if (!signer || signer.public_key !== publicKey) return json({ error: "The verification signer is not activated for this POD." }, 409);
  const receipt = {
    schema: "steer.staging-verification-receipt/v1", environment: "staging", item_id: itemId,
    item_key: String(item.key), item_updated_at: String(item.updated_at), pod_id: String(item.pod_id),
    brief_path: briefPath, brief_commit: String(body.brief_commit), brief_sha256: String(body.brief_sha256),
    exam_path: examPath, exam_commit: String(body.exam_commit), exam_sha256: String(body.exam_sha256),
    source_revision: sourceRevision, build_sha256: buildSha256, migration_set_sha256: migrationSetSha256,
    runtime_policy_sha256: runtimePolicySha256, case_ledger_sha256: caseLedgerSha256,
    candidate_builder_id: candidateBuilderId, intended_submitter_id: intendedSubmitterId,
    completed_at: new Date(Date.parse(completedAt)).toISOString(), key_id: keyId, key_version: keyVersion,
  };
  const receiptSha256 = await releaseReadinessDigest(receipt);
  const receiptId = receiptSha256;
  const existing = await db.prepare("SELECT * FROM staging_verification_receipts WHERE receipt_id = ?").bind(receiptId).first<Record<string, unknown>>();
  if (existing) return json({ receipt_id: receiptId, receipt_sha256: receiptSha256, receipt, replay: true });
  const signature = signAuthorityPayload("STEER_STAGING_VERIFICATION_V1", receipt, privateKey);
  const now = new Date().toISOString();
  try {
    await db.prepare(`INSERT INTO staging_verification_receipts
      (receipt_id, item_id, pod_id, receipt_json, receipt_sha256, source_revision, build_sha256,
       migration_set_sha256, runtime_policy_sha256, completed_at, key_id, key_version, service_signature, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(receiptId, itemId, String(item.pod_id), canonicalJson(receipt), receiptSha256, sourceRevision,
        buildSha256, migrationSetSha256, runtimePolicySha256, receipt.completed_at, keyId, keyVersion, signature, now).run();
  } catch (error) {
    const raced = await db.prepare("SELECT receipt_sha256 FROM staging_verification_receipts WHERE receipt_id = ?").bind(receiptId).first<{ receipt_sha256: string }>();
    if (raced?.receipt_sha256 === receiptSha256) return json({ receipt_id: receiptId, receipt_sha256: receiptSha256, receipt, service_signature: signature, replay: true });
    throw error;
  }
  return json({ receipt_id: receiptId, receipt_sha256: receiptSha256, receipt, service_signature: signature, replay: false }, 201);
}

async function runIssue74StagingFixture(request: Request, db: Database, env: Env) {
  if (env.STEER_DEPLOYMENT_ENV !== "staging") return json({ error: "Issue #74 fixtures are restricted to staging." }, 409);
  const token = String(env.DECISION_SERVICE_TOKEN ?? "");
  if (token.length < 32 || request.headers.get("authorization") !== `Bearer ${token}`) return json({ error: "Issue #74 fixture authentication failed." }, 401);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const action = String(body?.action ?? "");
  if (!body || !["CREATE", "HUMAN", "MUTATE", "COUNTERSIGN", "PROJECT"].includes(action)) return json({ error: "A bounded fixture action is required." }, 400);
  const itemId = Number(body.item_id ?? 0);
  if (action !== "CREATE") {
    if (!Number.isSafeInteger(itemId) || itemId < 1) return json({ error: "A fixture work item is required." }, 400);
    const item = await db.prepare("SELECT id, pod_id, created_by, github_url FROM work_items WHERE id = ? AND workflow = 'Setup / excluded' AND github_url LIKE 'https://staging.test/issue-74/%'")
      .bind(itemId).first<Record<string, unknown>>();
    if (!item) return json({ error: "The bounded issue #74 fixture item was not found." }, 404);
    if (action === "HUMAN") {
      const operation = String(body.operation ?? "");
      const payload = body.payload;
      if (!hasOnlyKeys(body, ["action", "item_id", "operation", "payload"]) ||
          !["SNAPSHOT", "PACKAGE", "SESSION", "INTENT", "READINESS"].includes(operation) ||
          (payload !== undefined && (!payload || typeof payload !== "object" || Array.isArray(payload)))) {
        return json({ error: "The staging human-principal adapter input is outside the bounded contract." }, 400);
      }
      const actor = await db.prepare("SELECT id, email, display_name, kind, role, status, pod_id FROM members WHERE id = ?")
        .bind(String(item.created_by)).first<Record<string, unknown>>();
      if (!actor || actor.kind !== "human" || actor.status !== "available" || actor.pod_id !== item.pod_id || !String(actor.role).includes("Product Lead")) {
        return json({ error: "The exact fixture Product Lead is no longer currently authorized." }, 409);
      }
      const user: User = { id: String(actor.id), email: actor.email ? String(actor.email) : null, name: String(actor.display_name ?? "Product Lead") };
      const adapted = new Request(request.url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload ?? {}) });
      if (operation === "SNAPSHOT") return createReleaseReadinessSnapshot(adapted, db, env, user, itemId);
      if (operation === "PACKAGE") return prepareDecisionPackage(db, user, itemId);
      if (operation === "SESSION") return startDecisionSession(adapted, db, user, itemId);
      if (operation === "INTENT") return createDecisionIntent(adapted, db, env, user, itemId);
      return getReleaseReadiness(db, env, user, itemId);
    }
    if (action === "PROJECT") {
      const fixtureCaseId = String(item.github_url).split("/").at(-1) ?? "";
      const [snapshots, readinessEvents, countersignatures, intents, proofEvents, decisions, activity, telemetry] = await Promise.all([
        db.prepare("SELECT snapshot_id, snapshot_sha256, current_state, invalidation_reason, created_at FROM decision_readiness_snapshots WHERE item_id = ? ORDER BY created_at, snapshot_id").bind(itemId).all(),
        db.prepare("SELECT e.snapshot_id, e.event_type, e.event_sha256, e.created_at FROM decision_readiness_events e JOIN decision_readiness_snapshots s ON s.snapshot_id = e.snapshot_id WHERE s.item_id = ? ORDER BY e.created_at, e.event_sha256").bind(itemId).all(),
        db.prepare("SELECT c.snapshot_id, c.member_id, c.role, c.status, c.proof_sha256, c.created_at FROM decision_readiness_countersignatures c JOIN decision_readiness_snapshots s ON s.snapshot_id = c.snapshot_id WHERE s.item_id = ? ORDER BY c.created_at, c.member_id").bind(itemId).all(),
        db.prepare("SELECT intent_id, intent_sha256, current_state, current_sequence, current_event_sha256, readiness_snapshot_sha256, created_at, updated_at FROM decision_intents WHERE item_id = ? ORDER BY created_at, intent_id").bind(itemId).all(),
        db.prepare("SELECT e.intent_id, e.sequence, e.event_type, e.resulting_state, e.event_sha256, e.created_at FROM decision_proof_events e JOIN decision_intents i ON i.intent_id = e.intent_id WHERE i.item_id = ? ORDER BY e.intent_id, e.sequence").bind(itemId).all(),
        db.prepare("SELECT gate, decision, evidence_revision, evidence_sha256, decision_intent_id, created_at FROM decisions WHERE item_id = ? ORDER BY id").bind(itemId).all(),
        db.prepare("SELECT action, detail, created_at FROM activity WHERE item_id = ? ORDER BY id").bind(itemId).all(),
        db.prepare("SELECT metric_name, label_name, label_value, value, case_id, observed_at FROM steer_telemetry WHERE case_id = ? ORDER BY id").bind(fixtureCaseId).all(),
      ]);
      const projection = { schema: "steer.issue74-real-lifecycle-projection/v2", item_id: itemId,
        snapshots: snapshots.results ?? [], readiness_events: readinessEvents.results ?? [], countersignatures: countersignatures.results ?? [],
        intents: intents.results ?? [], proof_events: proofEvents.results ?? [], decisions: decisions.results ?? [], activity: activity.results ?? [],
        telemetry: telemetry.results ?? [] };
      return json({ projection, projection_sha256: await releaseReadinessDigest(projection) });
    }
    if (action === "COUNTERSIGN") {
      const snapshotId = String(body.snapshot_id ?? "");
      const memberId = String(body.member_id ?? "");
      const role = String(body.role ?? "");
      const snapshotRow = await db.prepare("SELECT snapshot_json FROM decision_readiness_snapshots WHERE snapshot_id = ? AND item_id = ?")
        .bind(snapshotId, itemId).first<{ snapshot_json: string }>();
      const snapshot = snapshotRow ? JSON.parse(snapshotRow.snapshot_json) as ReleaseReadinessSnapshot : null;
      const boundIdentity = snapshot && [snapshot.intended_submitter_id, snapshot.candidate_builder_id].includes(memberId);
      if (!hex64(snapshotId) || !snapshot || (!/^rr74-human-[a-z0-9-]{3,64}$/.test(memberId) && !boundIdentity) || !requiredRolesFor([], "DEFAULT_CLOSED").includes(role) &&
          !["Security Owner", "Privacy Owner", "Legal Owner", "Product Designer", "Platform / Ops Lead", "Finance Owner"].includes(role)) {
        return json({ error: "The fixture countersignature identity or role is outside the bounded contract." }, 400);
      }
      if (!boundIdentity) {
        await db.prepare(`INSERT OR IGNORE INTO members (id, display_name, kind, role, authority, status, accent, pod_id)
          VALUES (?, ?, 'human', ?, 'Issue #74 staging fixture only', 'available', 'aqua', ?)`)
          .bind(memberId, `Fixture ${role}`, role, String(item.pod_id)).run();
      }
      const boundedRequest = new Request(request.url, { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ role, reason: "Independent issue #74 hosted verification countersignature." }) });
      return countersignReleaseReadiness(boundedRequest, db, env, { id: memberId, email: null, name: `Fixture ${role}` }, snapshotId);
    }
    const field = String(body.field ?? "");
    const now = new Date().toISOString();
    if (field === "WORK_ITEM") await db.prepare("UPDATE work_items SET title = title || ' · drift', updated_at = ? WHERE id = ?").bind(now, itemId).run();
    else if (field === "BRIEF_AUTHORITY" || field === "EXAM_AUTHORITY") {
      const gate = field === "BRIEF_AUTHORITY" ? "Gate 1 pending" : "Gate 2 pending";
      const revision = field === "BRIEF_AUTHORITY" ? readinessPolicyRulingRevision : readinessBriefRevision;
      const path = field === "BRIEF_AUTHORITY" ? "steer/exams/0074-risk-based-gate3-readiness.md" : readinessBriefPath;
      const sha = field === "BRIEF_AUTHORITY" ? readinessPolicyRulingSha256 : readinessBriefSha256;
      await db.prepare(`INSERT INTO decisions (item_id, gate, decision, reasoning, actor_id, evidence_url, evidence_revision, evidence_sha256, created_at)
        VALUES (?, ?, 'APPROVED', 'Bounded issue #74 hosted drift fixture.', 'rr74-fixture-service', ?, ?, ?, ?)`)
        .bind(itemId, gate, `https://github.com/${allowedGitHubRepository}/blob/${revision}/${path}`, revision, sha, now).run();
    } else if (field === "CRITIC_RESULT") await db.prepare("UPDATE agent_reviews SET recommendation = 'BLOCK' WHERE item_id = ?").bind(itemId).run();
    else if (field === "DERIVED_DOMAINS") await db.prepare("UPDATE agent_reviews SET derived_tags_json = '[\"SECURITY_NON_AUTH\"]' WHERE item_id = ?").bind(itemId).run();
    else if (field === "OPERATING_MODE") {
      const latest = await db.prepare("SELECT COALESCE(MAX(policy_version),0) AS version FROM decision_signer_policies WHERE pod_id = ?").bind(String(item.pod_id)).first<{ version: number }>();
      await db.prepare(`INSERT INTO decision_signer_policies
        (pod_id, policy_version, operating_mode, required_countersignatures, cooling_hours, status, activated_by, activation_reason, ruling_url, ruling_sha256, created_at)
        VALUES (?, ?, 'TEAM', 2, 24, 'ACTIVE', 'rr74-fixture-service', 'Issue #74 hosted operating-mode drift', ?, ?, ?)`)
        .bind(String(item.pod_id), Number(latest?.version ?? 0) + 1, readinessPolicyRulingUrl, readinessPolicyRulingSha256, now).run();
    } else if (field === "CANDIDATE_BUILDER") {
      const snapshot = await db.prepare("SELECT snapshot_json FROM decision_readiness_snapshots WHERE item_id = ? ORDER BY created_at DESC LIMIT 1").bind(itemId).first<{ snapshot_json: string }>();
      const builderId = snapshot ? (JSON.parse(snapshot.snapshot_json) as ReleaseReadinessSnapshot).candidate_builder_id : "";
      await db.prepare("UPDATE members SET status = 'open' WHERE id = ?").bind(builderId).run();
    } else return json({ error: "The requested hosted drift field is outside the bounded contract." }, 400);
    return json({ ok: true, field, mutated_at: now });
  }

  const allowed = ["action", "run_id", "case_id", "intended_submitter_id", "derived_risk_codes", "operating_mode", "target_path", "target_sha256", "target_commit_object_sha256"];
  if (!hasOnlyKeys(body, allowed)) return json({ error: "The fixture creation input is outside the bounded contract." }, 400);
  const runId = String(body.run_id ?? "");
  const caseId = String(body.case_id ?? "");
  let submitterId = String(body.intended_submitter_id ?? "");
  const operatingMode = String(body.operating_mode ?? "");
  const targetPath = String(body.target_path ?? "");
  const targetSha256 = String(body.target_sha256 ?? "");
  const targetCommitObjectSha256 = String(body.target_commit_object_sha256 ?? "");
  const sourceRevision = String(env.STEER_SOURCE_REVISION ?? "");
  if (!/^[a-z0-9][a-z0-9._:-]{2,79}$/.test(runId) || !/^RR74-[A-Z0-9-]{3,50}$/.test(caseId) ||
      !/^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/.test(submitterId) || !["SOLO_CALIBRATION", "TEAM"].includes(operatingMode) ||
      !/^steer\/evidence\/[A-Za-z0-9][A-Za-z0-9._/-]{1,198}\.md$/.test(targetPath) || !hex64(targetSha256) ||
      !hex64(targetCommitObjectSha256) || !hex40(sourceRevision) || !Array.isArray(body.derived_risk_codes)) {
    return json({ error: "The fixture must bind one exact staging candidate and bounded identity." }, 400);
  }
  if (submitterId === "CURRENT_PRODUCT_LEAD") {
    const candidates = await db.prepare(`SELECT id FROM members WHERE kind = 'human' AND status = 'available'
      AND role LIKE '%Product Lead%' AND id NOT LIKE 'rr74-%' ORDER BY id`).all<{ id: string }>();
    if ((candidates.results ?? []).length !== 1) return json({ error: "The fixture requires exactly one current non-fixture Product Lead." }, 409);
    submitterId = String(candidates.results![0].id);
  }
  const submitter = await db.prepare("SELECT id, pod_id, kind, role, status FROM members WHERE id = ?").bind(submitterId).first<Record<string, unknown>>();
  if (!submitter || submitter.kind !== "human" || submitter.status !== "available" || !String(submitter.role).includes("Product Lead")) return json({ error: "The intended fixture submitter is not the current Product Lead." }, 409);
  const fixtureUrl = `https://staging.test/issue-74/${runId}/${caseId}`;
  const existing = await db.prepare("SELECT id, key, updated_at, assignee_id, created_by FROM work_items WHERE github_url = ?").bind(fixtureUrl).first<Record<string, unknown>>();
  if (existing) return json({ item_id: Number(existing.id), item_key: existing.key, item_updated_at: existing.updated_at, candidate_builder_id: existing.assignee_id, intended_submitter_id: existing.created_by, replay: true });
  const targetUrl = `https://github.com/${allowedGitHubRepository}/blob/${sourceRevision}/${targetPath}`;
  const resolvedTarget = await readEvidence(targetUrl);
  if (resolvedTarget.revision !== sourceRevision || resolvedTarget.sha256 !== targetSha256) return json({ error: "The exact fixture target bytes could not be resolved." }, 409);
  const privateKey = String(env.DECISION_SERVICE_PRIVATE_KEY ?? "");
  const reviewerPublicKey = dispatchPublicKey(privateKey);
  const signer = reviewSigner(env);
  if (!hex64(privateKey)) return json({ error: "The fixture reviewer signer is unavailable." }, 503);
  const identityDigest = await sha256Hex(`${runId}:${caseId}`);
  const builderId = `rr74-builder-${identityDigest.slice(0, 16)}`;
  const criticId = "rr74-fixture-critic";
  const verifierId = "rr74-fixture-verifier";
  const reviewerKeyId = `${String(env.DECISION_SERVICE_KEY_ID)}:rr74-reviewer`;
  await db.batch([
    db.prepare(`INSERT OR IGNORE INTO members (id, display_name, kind, role, authority, status, accent, pod_id) VALUES (?, 'Issue 74 fixture Builder', 'agent', 'Implementation Agent', 'Staging fixture only', 'enrolled', 'green', ?)`)
      .bind(builderId, String(submitter.pod_id)),
    db.prepare(`INSERT OR IGNORE INTO members (id, display_name, kind, role, authority, status, accent, pod_id, agent_key_id, agent_key_version, agent_public_key) VALUES (?, 'Issue 74 fixture Critic', 'agent', 'Independent Critic', 'Staging fixture only', 'enrolled', 'coral', ?, ?, 1, ?)`)
      .bind(criticId, String(submitter.pod_id), reviewerKeyId, reviewerPublicKey),
    db.prepare(`INSERT OR IGNORE INTO members (id, display_name, kind, role, authority, status, accent, pod_id, agent_key_id, agent_key_version, agent_public_key) VALUES (?, 'Issue 74 fixture verifier', 'agent', 'Verification Agent', 'Staging fixture only', 'enrolled', 'amber', ?, ?, 1, ?)`)
      .bind(verifierId, String(submitter.pod_id), reviewerKeyId, reviewerPublicKey),
    db.prepare("UPDATE members SET agent_key_id = ?, agent_key_version = 1, agent_public_key = ?, status = 'enrolled' WHERE id IN (?, ?)")
      .bind(reviewerKeyId, reviewerPublicKey, criticId, verifierId),
  ]);
  const latestPolicy = await db.prepare("SELECT * FROM decision_signer_policies WHERE pod_id = ? ORDER BY policy_version DESC LIMIT 1").bind(String(submitter.pod_id)).first<Record<string, unknown>>();
  if (!latestPolicy || latestPolicy.operating_mode !== operatingMode) {
    await db.prepare(`INSERT INTO decision_signer_policies
      (pod_id, policy_version, operating_mode, required_countersignatures, cooling_hours, status, activated_by, activation_reason, ruling_url, ruling_sha256, created_at)
      VALUES (?, ?, ?, ?, 24, 'ACTIVE', 'rr74-fixture-service', 'Issue #74 hosted lifecycle fixture', ?, ?, ?)`)
      .bind(String(submitter.pod_id), Number(latestPolicy?.policy_version ?? 0) + 1, operatingMode, operatingMode === "TEAM" ? 2 : 0,
        readinessPolicyRulingUrl, readinessPolicyRulingSha256, new Date().toISOString()).run();
  }
  const now = new Date().toISOString();
  const key = `RR74-${identityDigest.slice(0, 12).toUpperCase()}`;
  const inserted = await db.prepare(`INSERT INTO work_items
    (key,title,description,phase,priority,workflow,work_type,state,gate,decision_status,decision_authority,assignee_id,next_action,evidence_url,github_url,pod_id,created_by,created_at,updated_at)
    VALUES (?, ?, 'Bounded real lifecycle fixture for issue #74.', 'Evaluate', 'Later', 'Setup / excluded', 'Technical', 'active', 'Gate 3 pending', 'Needed now', 'Product Lead', ?, 'Run real release readiness lifecycle.', ?, ?, ?, ?, ?, ?)`)
    .bind(key, `${caseId} real lifecycle`, builderId, targetUrl, fixtureUrl, String(submitter.pod_id), submitterId, now, now).run();
  const createdItemId = Number(inserted.meta?.last_row_id);
  const priorSessionId = createUuidV7();
  const priorIntentId = createUuidV7();
  const priorIntent = { decision_session_id: priorSessionId, schema: "steer.issue74-prior-gate-fixture/v1" };
  await db.batch([
    db.prepare(`INSERT INTO decision_sessions (session_id,pod_id,principal_id,item_id,decision_kind,reason,started_at,expires_at) VALUES (?,?,?,?, 'Gate 2 pending','Issue #74 prerequisite Gate session.',?,?)`)
      .bind(priorSessionId, String(submitter.pod_id), submitterId, createdItemId, now, new Date(Date.parse(now) + 10 * 60_000).toISOString()),
    db.prepare(`INSERT INTO decision_intents
      (intent_id,receipt_id,package_id,item_id,pod_id,idempotency_key,intent_json,intent_sha256,current_state,current_sequence,current_event_sha256,required_countersignatures,accepted_countersignatures,submitter_id,submitter_role,effective_not_before,decision_session_id,signer_policy_version,readiness_snapshot_sha256,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?, 'EFFECTIVE',3,?,0,0,?,?,?, ?,1,'',?,?)`)
      .bind(priorIntentId, createUuidV7(), createUuidV7(), createdItemId, String(submitter.pod_id), createUuidV7(), canonicalJson(priorIntent), await decisionDigest(priorIntent), "a".repeat(64), submitterId, String(submitter.role), now, priorSessionId, now, now),
    db.prepare(`INSERT INTO decisions (item_id,gate,decision,reasoning,actor_id,evidence_url,evidence_revision,evidence_sha256,decision_intent_id,created_at) VALUES
      (?, 'Gate 1 pending','APPROVED','Exact issue #74 Brief approved.',?,?,?,?,NULL,?),
      (?, 'Gate 2 pending','APPROVED','Exact issue #74 Exam approved.',?,?,?,?,?,?)`)
      .bind(createdItemId, submitterId, `https://github.com/${allowedGitHubRepository}/blob/${readinessBriefRevision}/${readinessBriefPath}`, readinessBriefRevision, readinessBriefSha256, now,
        createdItemId, submitterId, readinessPolicyRulingUrl, readinessPolicyRulingRevision, readinessPolicyRulingSha256, priorIntentId, now),
  ]);
  const targetWithoutManifest = { target_git_object_format: "sha1" as const, target_git_commit_oid: sourceRevision,
    target_commit_object_sha256: targetCommitObjectSha256,
    target_artifacts: [{ path: targetPath, url: targetUrl, size_bytes: new TextEncoder().encode(String(resolvedTarget.text ?? "")).byteLength, sha256: targetSha256 }] };
  const targetManifestSha256 = await reviewManifestSha256(targetWithoutManifest);
  const target = { ...targetWithoutManifest, target_artifact_manifest_sha256: targetManifestSha256 };
  const verificationReceipt = { schema: "steer-target-verification/v1" as const, target, verified_at: now,
    verification_method: "git-cat-file-and-sha256-bytes" as const, verifier_member_id: verifierId, verifier_key_id: reviewerKeyId, verifier_key_version: 1 };
  const assignmentPayload: ReviewAssignmentPayload = { schema: "steer-review-assignment/v1", work_item_stable_id: createdItemId,
    work_item_key: key, workspace_pod_id: String(submitter.pod_id), workflow: "Setup / excluded", primary_claim_lineage_id: identityDigest,
    primary_owner_role: "Implementation Agent", primary_owner_member_id: builderId, review_stage: "GATE_3_BUILD", target,
    target_verification: { receipt: verificationReceipt, signature: (await signSchnorrBinding(verificationReceipt, privateKey)).signature },
    prior_binding_digests: [readinessBriefSha256, readinessPolicyRulingSha256], reviewer_role: "Independent Critic", reviewer_member_id: criticId,
    output_contract: ["Exact bounded PASS/BLOCK result."], prohibitions: ["No Gate or release authority."], authorizing_actor_id: submitterId,
    authorizing_event_id: await sha256Hex(`rr74-authority:${identityDigest}`), item_revision: now };
  const reviewIdentity = await buildReviewIdentity(assignmentPayload);
  const result = { recommendation: "PASS", confidence: "high", summary: "Exact hosted fixture candidate passed its bounded independent review.", findings: [], dependencies: [], impacts: [], actions: [],
    derived_tags: body.derived_risk_codes, evidence_scope: `${caseId} exact source candidate`, completed_at: now } as SignedCriticResult;
  const typedPayloads: Record<string, unknown>[] = [
    { item_revision: now, target_verification_receipt_sha256: await sha256Hex(canonicalJson(assignmentPayload.target_verification)), verifier_member_id: verifierId, verifier_key_id: reviewerKeyId, verifier_key_version: 1 },
    { review_idempotency_key: reviewIdentity.reviewIdempotencyKey, authorizing_event_id: assignmentPayload.authorizing_event_id, reviewer_member_id: criticId },
    { assignment_event_sha256: "pending", canonical_route: "issue74-staging-fixture" }, {}, {},
  ];
  let previous: string | null = null;
  const eventTypes = ["REVIEW_TARGET_READY", "REVIEW_ASSIGNED", "REVIEW_REQUESTED", "REVIEW_ACKNOWLEDGED", "REVIEW_RESULT_RECORDED"] as const;
  const eventStatements: Statement[] = [];
  for (let index = 0; index < eventTypes.length; index += 1) {
    if (index === 2) typedPayloads[index] = { assignment_event_sha256: previous, canonical_route: "issue74-staging-fixture" };
    if (index === 3) typedPayloads[index] = { schema: "steer-review-acknowledgement/v1", review_assignment_id: reviewIdentity.reviewAssignmentId, target_artifact_manifest_sha256: targetManifestSha256, source_request_event_sha256: previous, predecessor_event_sha256: previous, acknowledged_at: now };
    if (index === 4) typedPayloads[index] = { schema: "steer-review-result/v1", review_assignment_id: reviewIdentity.reviewAssignmentId, target_artifact_manifest_sha256: targetManifestSha256, predecessor_event_sha256: previous, result_sha256: await sha256Hex(canonicalJson(result)), result };
    const reviewerSignature = index >= 3 ? (await signSchnorrBinding(typedPayloads[index], privateKey)).signature : undefined;
    const event = await createSignedReviewEvent({ assignmentId: reviewIdentity.reviewAssignmentId, eventVersion: index, previousEventSha256: previous,
      eventType: eventTypes[index], occurredAt: now, targetManifestSha256, actorId: index >= 3 ? criticId : submitterId,
      typedPayload: typedPayloads[index], serviceKeyId: signer.keyId, serviceKeyVersion: signer.keyVersion, servicePrivateKey: signer.privateKey,
      reviewerKeyId: index >= 3 ? reviewerKeyId : undefined, reviewerKeyVersion: index >= 3 ? 1 : undefined, reviewerSignature });
    eventStatements.push(db.prepare(`INSERT INTO review_events
      (assignment_id,event_version,expected_event_version,event_type,payload_json,previous_event_sha256,event_sha256,service_key_id,service_key_version,service_signature,reviewer_key_id,reviewer_key_version,reviewer_signature,actor_id,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(reviewIdentity.reviewAssignmentId, index, index - 1, eventTypes[index], canonicalJson(event.envelope), previous,
        event.eventSha256, signer.keyId, signer.keyVersion, event.envelope.service_signature, index >= 3 ? reviewerKeyId : null, index >= 3 ? 1 : null,
        reviewerSignature ?? null, index >= 3 ? criticId : submitterId, now));
    previous = event.eventSha256;
  }
  await db.batch([
    db.prepare(`INSERT INTO review_assignments
      (assignment_id,idempotency_key,item_id,pod_id,review_stage,reviewer_member_id,primary_claim_lineage_id,item_revision,target_manifest_sha256,assignment_json,current_state,current_event_version,current_event_sha256,authorizing_actor_id,authorizing_event_id,created_at,terminal_at,delete_after)
      VALUES (?,?,?,?, 'GATE_3_BUILD',?,?,?,?,?,'RESULT_RECORDED',4,?,?,?,?,?,?)`)
      .bind(reviewIdentity.reviewAssignmentId, reviewIdentity.reviewIdempotencyKey, createdItemId, String(submitter.pod_id), criticId, identityDigest, now,
        targetManifestSha256, canonicalJson(assignmentPayload), previous, submitterId, assignmentPayload.authorizing_event_id, now, now, new Date(Date.parse(now) + 90 * 86_400_000).toISOString()),
    ...eventStatements,
    db.prepare(`INSERT INTO agent_reviews
      (item_id,agent_id,review_mode,recommendation,confidence,summary,findings_json,dependencies_json,impacts_json,actions_json,derived_tags_json,evidence_scope,evidence_url,evidence_revision,evidence_sha256,reviewed_item_updated_at,requested_by,created_at,review_assignment_id)
      VALUES (?,?,'signed_assignment_review',?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(createdItemId, criticId, result.recommendation, result.confidence, result.summary, "[]", "[]", "[]", "[]", JSON.stringify(result.derived_tags), result.evidence_scope,
        targetUrl, sourceRevision, targetManifestSha256, now, submitterId, now, reviewIdentity.reviewAssignmentId),
    db.prepare("INSERT INTO activity (item_id,actor_id,action,detail,created_at,review_assignment_id) VALUES (?,?,'agent_review','PASS · signed issue #74 hosted fixture review recorded',?,?)")
      .bind(createdItemId, criticId, now, reviewIdentity.reviewAssignmentId),
  ]);
  return json({ item_id: createdItemId, item_key: key, item_updated_at: now, candidate_builder_id: builderId, intended_submitter_id: submitterId,
    critic_assignment_id: reviewIdentity.reviewAssignmentId, target_manifest_sha256: targetManifestSha256, replay: false }, 201);
}

async function handleDecisionProofService(request: Request, db: Database, env: Env) {
  if (request.method !== "POST") return null;
  const pathname = new URL(request.url).pathname;
  if (pathname === "/api/staging-release-readiness-fixtures") return runIssue74StagingFixture(request, db, env);
  if (pathname === "/api/staging-release-readiness-cases") return json({ error: "Synthetic readiness evaluation is retired. Evidence must traverse the real snapshot, session, intent, proof, and finalization endpoints." }, 410);
  if (pathname === "/api/staging-verification-receipts") return createStagingVerificationReceipt(request, db, env);
  const proofMatch = pathname.match(/^\/api\/decision-intents\/([0-9a-f-]{36})\/issuer-proof$/);
  if (proofMatch) return proveDecisionIntent(request, db, env, proofMatch[1]);
  const finalizeMatch = pathname.match(/^\/api\/decision-intents\/([0-9a-f-]{36})\/finalize$/);
  if (finalizeMatch) return finalizeDecisionIntent(request, db, env, finalizeMatch[1]);
  return null;
}

async function transitionItem(request: Request, db: Database, user: User, itemId: number) {
  const actor = await memberContext(db, user);
  if (actor?.kind !== "human") return json({ error: "Only an authenticated human POD member may transition authoritative workflow state." }, 403);
  const current = await scopedItemOrDenied(db, user, itemId, "workflow transition");
  if (!current) return json({ error: "Work item not found in your POD." }, 404);
  const body = await request.json() as Record<string, unknown>;
  const action = String(body.action ?? "");
  const status = String(current.decision_status);
  const now = new Date().toISOString();

  if (action === "START_REWORK") {
    if (status !== "Changes requested") return json({ error: "This item is not waiting to begin rework." }, 409);
    await db.prepare("UPDATE work_items SET decision_status = 'Rework', state = 'active', blocked_since = NULL, updated_at = ? WHERE id = ?").bind(now, itemId).run();
    await db.prepare("INSERT INTO activity (item_id, actor_id, action, detail, created_at) VALUES (?, ?, 'workflow', 'Rework started from the recorded change request.', ?)").bind(itemId, user.id, now).run();
    await requireMaterialReforecast(db, current, itemId, user, "Test result or change request started a new rework cycle.", now);
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
    await requireMaterialReforecast(db, current, itemId, user, "Updated test or dependency evidence was resubmitted for a new gate ruling.", now, true);
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
  const notification = await db.prepare(`SELECT n.id FROM notifications n
    JOIN work_items w ON w.id = n.item_id
    JOIN members actor ON actor.id = ? AND actor.pod_id = w.pod_id
    WHERE n.id = ? AND (n.member_id = actor.id OR (n.member_id IS NULL AND instr(actor.role, n.recipient_role) > 0))`)
    .bind(user.id, notificationId).first<{ id: number }>();
  if (!notification) {
    const target = await db.prepare("SELECT item_id FROM notifications WHERE id = ?").bind(notificationId).first<{ item_id: number }>();
    if (target) await auditItemControlDenial(db, user, target.item_id, "notification mutation");
    return json({ error: "Notification not found in your POD or assigned role." }, 404);
  }
  await db.prepare("UPDATE notifications SET status = 'read', read_at = ? WHERE id = ?").bind(now, notification.id).run();
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

function decodeGitPath(value: string) {
  const trimmed = value.trim();
  if (!trimmed.startsWith('"') || !trimmed.endsWith('"')) return trimmed;
  try {
    return JSON.parse(trimmed) as string;
  } catch {
    return trimmed.slice(1, -1);
  }
}

export function parseGitHubPatch(patchText: string): GitHubFile[] {
  const files: GitHubFile[] = [];
  let current: (GitHubFile & { lines: string[] }) | null = null;

  const finish = () => {
    if (!current) return;
    const { lines, ...file } = current;
    files.push({ ...file, patch: lines.join("\n").slice(0, 12000) });
  };

  for (const line of patchText.split("\n")) {
    if (line.startsWith("diff --git ")) {
      finish();
      const match = line.match(/^diff --git (?:"a\/(.+)"|a\/(.+)) (?:"b\/(.+)"|b\/(.+))$/);
      const filename = decodeGitPath(match?.[3] ?? match?.[4] ?? match?.[1] ?? match?.[2] ?? "unknown-file");
      current = { filename, status: "modified", additions: 0, deletions: 0, changes: 0, lines: [line] };
      continue;
    }
    if (!current) continue;
    current.lines.push(line);
    if (line.startsWith("new file mode ")) current.status = "added";
    else if (line.startsWith("deleted file mode ")) current.status = "removed";
    else if (line.startsWith("rename to ")) {
      current.status = "renamed";
      current.filename = decodeGitPath(line.slice("rename to ".length));
    } else if (line.startsWith("+") && !line.startsWith("+++")) current.additions += 1;
    else if (line.startsWith("-") && !line.startsWith("---")) current.deletions += 1;
    current.changes = current.additions + current.deletions;
  }
  finish();
  return files;
}

async function patchFingerprint(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function loadPublicPatchSnapshot(
  reference: PullRequestReference,
  item: Record<string, unknown>,
  history: D1Result,
) {
  try {
    const url = `https://github.com/${reference.repository}/pull/${reference.number}.diff`;
    const response = await fetch(url, {
      headers: { accept: "text/plain", "user-agent": "steer-flight-board" },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`Public diff returned HTTP ${response.status}.`);
    const patchText = (await response.text()).slice(0, 1_000_000);
    const files = parseGitHubPatch(patchText);
    if (!files.length) throw new Error("The public diff did not contain any changed files.");
    const fingerprint = await patchFingerprint(patchText);
    const additions = files.reduce((total, file) => total + file.additions, 0);
    const deletions = files.reduce((total, file) => total + file.deletions, 0);
    const checkSummary = { total: 0, failed: 0, pending: 0, successful: 0, all_green: false };
    const pull = {
      draft: false,
      mergeable: null,
      additions,
      deletions,
      changed_files: files.length,
    };
    const aiReview = codeReviewBrief(pull, files, checkSummary);
    return json({
      connection: {
        read: true,
        write: false,
        repository: reference.repository,
        message: "GitHub's public API limit is temporarily exhausted. STEER loaded a public diff snapshot so you can inspect the changed files. Verified checks and actions require the repository credential.",
      },
      pull_request: {
        number: reference.number,
        title: `PR #${reference.number} public review snapshot`,
        body: "This read-only snapshot contains the consolidated public code changes. Exact branch metadata, check results, and mergeability remain unverified until the GitHub connection is available.",
        url: `https://github.com/${reference.repository}/pull/${reference.number}`,
        state: "snapshot",
        draft: false,
        mergeable: null,
        mergeable_state: "unverified",
        author: "unverified",
        base_ref: "base branch",
        head_ref: "public patch",
        head_sha: `snapshot-${fingerprint}`,
        additions,
        deletions,
        changed_files: files.length,
        commits: 0,
        updated_at: new Date().toISOString(),
      },
      checks: { ...checkSummary, items: [] },
      files,
      ai_review: aiReview,
      decision_guidance: codeReviewDecisionGuidance(aiReview, checkSummary, false, false),
      history: history.results ?? [],
      controls: { accepted_head: false, can_merge: false, merge_confirmation: `MERGE ${String(item.key)}`, exact_head_required: false },
    });
  } catch {
    return json({ error: "GitHub review data is temporarily unavailable. Connect the repository credential or retry after the public limit resets." }, 503);
  }
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
  const reviewedConcerns = ranked.filter((finding) => finding.severity === "should-fix").map((finding) => finding.title);
  const proposedAcceptanceReasoning = blockers ? "" : [
    "All reported checks are complete and green, and the available review shows no blocking condition for this revision.",
    reviewedConcerns.length
      ? `I reviewed the highlighted concern${reviewedConcerns.length === 1 ? "" : "s"} (${reviewedConcerns.join("; ")}) against the work-item outcome and find the documented controls and follow-up boundaries acceptable.`
      : "I reviewed the changed files against the work-item outcome and found no material concern that requires rework.",
    "This acceptance applies only to the exact displayed commit. It does not authorize merge, and any new push requires a fresh review.",
  ].join(" ");
  return { recommendation, summary, findings: ranked, dependencies: [...new Set(dependencies)].slice(0, 5), impacts: [...new Set(impacts)].slice(0, 4), actions: [...new Set(actions)].slice(0, 5), proposed_change_instructions: proposedChangeInstructions, proposed_acceptance_reasoning: proposedAcceptanceReasoning };
}

export function codeReviewDecisionGuidance(
  review: { findings: Finding[] },
  checks: { all_green: boolean; failed: number; pending: number; total: number },
  acceptedHead: boolean,
  canMerge: boolean,
) {
  const blockers = review.findings.filter((finding) => finding.severity === "blocker");
  const concerns = review.findings.filter((finding) => finding.severity === "should-fix");
  const concernSummary = concerns.length ? ` Confirm the highlighted concern${concerns.length === 1 ? "" : "s"} before recording the decision.` : "";
  const accept = acceptedHead
    ? { status: "Already recorded", tone: "complete", reason: "Human acceptance is already bound to this exact commit." }
    : blockers.length
      ? { status: "Not recommended", tone: "blocked", reason: `Resolve ${blockers.length} blocking condition${blockers.length === 1 ? "" : "s"} before accepting this revision.` }
      : { status: "Recommended now", tone: "recommended", reason: `No blocking condition remains and all reported checks are green.${concernSummary}` };
  const requestChanges = blockers.length
    ? { status: "Recommended now", tone: "recommended", reason: `The AI review found ${blockers.length} blocking condition${blockers.length === 1 ? "" : "s"}; send the proposed instructions and require a fresh revision.` }
    : { status: "Not recommended", tone: "neutral", reason: "No blocking defect was found. Use this only if your file review identifies a specific required change." };
  const merge = canMerge
    ? { status: "Recommended next", tone: "recommended", reason: "Human acceptance is recorded for this exact commit and every reported check is green." }
    : !acceptedHead
      ? { status: "Not ready", tone: "neutral", reason: "Record human acceptance for this exact commit before considering merge." }
      : !checks.all_green
        ? { status: "Blocked", tone: "blocked", reason: checks.failed ? "Resolve the failing checks before merge." : checks.pending ? "Wait for the pending checks before merge." : "A complete green check set is required before merge." }
        : { status: "Not ready", tone: "neutral", reason: "Refresh the pull request and resolve its remaining merge condition before proceeding." };
  const recommendedAction = canMerge ? "MERGE" : blockers.length ? "REQUEST_CHANGES" : !acceptedHead && checks.all_green ? "ACCEPT" : "WAIT";
  const headline = recommendedAction === "MERGE" ? "Merge the accepted revision"
    : recommendedAction === "REQUEST_CHANGES" ? "Request changes before acceptance"
      : recommendedAction === "ACCEPT" ? "Accept this exact revision"
        : "Wait for the required signals";
  const summary = recommendedAction === "ACCEPT" ? accept.reason
    : recommendedAction === "REQUEST_CHANGES" ? requestChanges.reason
      : merge.reason;
  return { recommended_action: recommendedAction, headline, summary, actions: { accept, request_changes: requestChanges, merge } };
}

async function loadCodeReview(db: Database, env: Env, user: User, itemId: number) {
  const item = await scopedItemOrDenied(db, user, itemId, "code review read");
  if (!item) return json({ error: "Work item not found in your POD." }, 404);
  const reference = pullRequestFromItem(item);
  if (!reference) return json({ error: `Attach a pull request from ${allowedGitHubRepository} to this work item's evidence or engineering record.` }, 409);
  const basePath = `/repos/${reference.owner}/${reference.repo}`;
  const history = await db.prepare("SELECT * FROM code_reviews WHERE item_id = ? AND repository = ? AND pull_number = ? ORDER BY created_at DESC LIMIT 20").bind(itemId, reference.repository, reference.number).all();
  let pull: {
    number: number; title: string; body: string | null; html_url: string; state: string; draft: boolean; mergeable: boolean | null;
    mergeable_state?: string; additions: number; deletions: number; changed_files: number; commits: number; updated_at: string;
    user: { login: string }; base: { ref: string }; head: { ref: string; sha: string };
  };
  let files: GitHubFile[];
  let checkRuns: { check_runs: Array<{ name: string; status: string; conclusion: string | null; html_url: string | null }> };
  let combinedStatus: { statuses: Array<{ context: string; state: string; target_url: string | null }> };
  try {
    pull = await githubJson(env, `${basePath}/pulls/${reference.number}`);
    [files, checkRuns, combinedStatus] = await Promise.all([
      githubJson<GitHubFile[]>(env, `${basePath}/pulls/${reference.number}/files?per_page=100`),
      githubJson<{ check_runs: Array<{ name: string; status: string; conclusion: string | null; html_url: string | null }> }>(env, `${basePath}/commits/${pull.head.sha}/check-runs?per_page=100`).catch(() => ({ check_runs: [] })),
      githubJson<{ statuses: Array<{ context: string; state: string; target_url: string | null }> }>(env, `${basePath}/commits/${pull.head.sha}/status`).catch(() => ({ statuses: [] })),
    ]);
  } catch {
    return loadPublicPatchSnapshot(reference, item, history);
  }
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
  const aiReview = codeReviewBrief(pull, files, checkSummary);
  return json({
    connection: { read: true, write: Boolean(env.GITHUB_TOKEN), repository: reference.repository, message: env.GITHUB_TOKEN ? "GitHub actions are connected." : "Review is available. A repository credential is still required for GitHub write and merge actions." },
    pull_request: { number: pull.number, title: pull.title, body: pull.body, url: pull.html_url, state: pull.state, draft: pull.draft, mergeable: pull.mergeable, mergeable_state: pull.mergeable_state ?? "unknown", author: pull.user.login, base_ref: pull.base.ref, head_ref: pull.head.ref, head_sha: pull.head.sha, additions: pull.additions, deletions: pull.deletions, changed_files: pull.changed_files, commits: pull.commits, updated_at: pull.updated_at },
    checks: { ...checkSummary, items: uniqueChecks },
    files: files.map((file) => ({ ...file, patch: file.patch?.slice(0, 12000) ?? null })),
    ai_review: aiReview,
    decision_guidance: codeReviewDecisionGuidance(aiReview, checkSummary, acceptedHead, canMerge),
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
  const item = await scopedItemOrDenied(db, user, itemId, "code review mutation");
  if (!item) return json({ error: "Work item not found in your POD." }, 404);
  if (!env.GITHUB_TOKEN) return json({ error: "GitHub write actions are not connected yet. Add the repository credential to the hosted STEER environment first." }, 503);
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
  await requireMaterialReforecast(
    db,
    item,
    itemId,
    user,
    `Code-review test result ${action.toLowerCase().replace("_", " ")} changed execution expectations for commit ${pull.head.sha.slice(0, 12)}.`,
    now,
    action === "REQUEST_CHANGES",
  );
  return json({ ok: true, action, delivery: delivery.delivery, url: delivery.url }, 201);
}

export async function handleApi(request: Request, env: Env): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) return null;
  if (!env.DB) return json({ error: "Persistent database binding is unavailable." }, 503);

  try {
    await ensureSchemaReady(env.DB);
    const dispatchServiceResponse = await handleDispatchServiceApi(request, env.DB, env);
    if (dispatchServiceResponse) return dispatchServiceResponse;
    const decisionProofServiceResponse = await handleDecisionProofService(request, env.DB, env);
    if (decisionProofServiceResponse) return decisionProofServiceResponse;
    if (request.method === "POST" && url.pathname === "/api/review-retention/run") return runReviewRetention(request, env.DB, env);
    const signedReviewServiceResponse = await handleSignedReviewService(request, env.DB, env);
    if (signedReviewServiceResponse) return signedReviewServiceResponse;
    const user = userFrom(request);
    if (!user) return json({ error: "Authentication required." }, 401);
    await ensureCurrentUser(env.DB, user);
    if (request.method === "GET" && url.pathname === "/api/buzz-status") return getBuzzStatus();
    if (request.method === "GET" && url.pathname === "/api/bootstrap") return json(await bootstrap(env.DB, user, env));
    if (request.method === "POST" && url.pathname === "/api/telemetry") return recordBoundedTelemetry(request, env.DB, env);
    if (request.method === "POST" && url.pathname === "/api/privacy-policy/activate") return activatePrivacyPolicy(request, env.DB, user);
    if (request.method === "POST" && url.pathname === "/api/decision-signers/activate") return activateDecisionIssuer(request, env.DB, user);
    if (request.method === "POST" && url.pathname === "/api/decision-signer-policies/activate") return activateDecisionSignerPolicy(request, env.DB, user);
    if (request.method === "POST" && url.pathname === "/api/decision-readiness-policies/activate") return activateDecisionReadinessPolicy(request, env.DB, user);
    if (request.method === "POST" && url.pathname === "/api/items") return createItem(request, env.DB, user);
    const itemMatch = url.pathname.match(/^\/api\/items\/(\d+)$/);
    if (request.method === "PATCH" && itemMatch) return updateItem(request, env.DB, env, user, Number(itemMatch[1]));
    const economicsMatch = url.pathname.match(/^\/api\/items\/(\d+)\/work-economics$/);
    if (request.method === "PATCH" && economicsMatch) return updateWorkEconomics(request, env.DB, env, user, Number(economicsMatch[1]));
    const reviewMatch = url.pathname.match(/^\/api\/items\/(\d+)\/reviews$/);
    if (request.method === "POST" && reviewMatch) return requestSignedCriticReview(request, env.DB, env, user, Number(reviewMatch[1]));
    const reviewRetentionHoldMatch = url.pathname.match(/^\/api\/review-assignments\/([0-9a-f]{64})\/retention-holds$/);
    if (request.method === "POST" && reviewRetentionHoldMatch) return manageReviewRetentionHold(request, env.DB, user, reviewRetentionHoldMatch[1]);
    const dispatchMatch = url.pathname.match(/^\/api\/items\/(\d+)\/dispatch$/);
    if (request.method === "POST" && dispatchMatch) return authorizeAgentDispatch(env.DB, env, user, Number(dispatchMatch[1]));
    const retentionHoldMatch = url.pathname.match(/^\/api\/dispatches\/([0-9a-f]{64})\/retention-holds$/);
    if (request.method === "POST" && retentionHoldMatch) return manageDispatchRetentionHold(request, env.DB, user, retentionHoldMatch[1]);
    const codeReviewMatch = url.pathname.match(/^\/api\/items\/(\d+)\/code-review$/);
    if (request.method === "GET" && codeReviewMatch) return loadCodeReview(env.DB, env, user, Number(codeReviewMatch[1]));
    if (request.method === "POST" && codeReviewMatch) return actOnCodeReview(request, env.DB, env, user, Number(codeReviewMatch[1]));
    const workflowMatch = url.pathname.match(/^\/api\/items\/(\d+)\/workflow$/);
    if (request.method === "POST" && workflowMatch) return transitionItem(request, env.DB, user, Number(workflowMatch[1]));
    const decisionMatch = url.pathname.match(/^\/api\/items\/(\d+)\/decisions$/);
    if (request.method === "POST" && decisionMatch) return decide(request, env.DB, env, user, Number(decisionMatch[1]));
    const decisionPackageMatch = url.pathname.match(/^\/api\/items\/(\d+)\/decision-packages$/);
    if (request.method === "POST" && decisionPackageMatch) return prepareDecisionPackage(env.DB, user, Number(decisionPackageMatch[1]));
    const decisionSessionMatch = url.pathname.match(/^\/api\/items\/(\d+)\/decision-sessions$/);
    if (request.method === "POST" && decisionSessionMatch) return startDecisionSession(request, env.DB, user, Number(decisionSessionMatch[1]));
    const readinessMatch = url.pathname.match(/^\/api\/items\/(\d+)\/release-readiness$/);
    if (request.method === "GET" && readinessMatch) return getReleaseReadiness(env.DB, env, user, Number(readinessMatch[1]));
    if (request.method === "POST" && readinessMatch) return createReleaseReadinessSnapshot(request, env.DB, env, user, Number(readinessMatch[1]));
    const readinessSignatureMatch = url.pathname.match(/^\/api\/release-readiness\/([0-9a-f]{64})\/countersignatures$/);
    if (request.method === "POST" && readinessSignatureMatch) return countersignReleaseReadiness(request, env.DB, env, user, readinessSignatureMatch[1]);
    const decisionIntentMatch = url.pathname.match(/^\/api\/items\/(\d+)\/decision-intents$/);
    if (request.method === "POST" && decisionIntentMatch) return createDecisionIntent(request, env.DB, env, user, Number(decisionIntentMatch[1]));
    const decisionExportMatch = url.pathname.match(/^\/api\/decision-intents\/([0-9a-f-]{36})\/export$/);
    if (request.method === "GET" && decisionExportMatch) return exportDecisionIntent(env.DB, user, decisionExportMatch[1]);
    const notificationMatch = url.pathname.match(/^\/api\/notifications\/(\d+)\/read$/);
    if (request.method === "POST" && notificationMatch) return markNotificationRead(env.DB, user, Number(notificationMatch[1]));
    return json({ error: "Not found." }, 404);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected error." }, 500);
  }
}
