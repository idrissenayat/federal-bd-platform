import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const members = sqliteTable(
  "members",
  {
    id: text("id").primaryKey(),
    displayName: text("display_name").notNull(),
    email: text("email"),
    kind: text("kind").notNull(),
    role: text("role").notNull(),
    authority: text("authority").notNull(),
    status: text("status").notNull().default("available"),
    accent: text("accent").notNull().default("aqua"),
  },
  (table) => [index("idx_members_kind").on(table.kind)],
);

export const workItems = sqliteTable(
  "work_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    key: text("key").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    phase: text("phase").notNull(),
    priority: text("priority").notNull(),
    workflow: text("workflow").notNull(),
    state: text("state").notNull(),
    gate: text("gate").notNull(),
    decisionStatus: text("decision_status").notNull(),
    decisionAuthority: text("decision_authority").notNull(),
    assigneeId: text("assignee_id"),
    nextAction: text("next_action").notNull(),
    evidenceUrl: text("evidence_url"),
    githubUrl: text("github_url"),
    reworkInstructions: text("rework_instructions"),
    createdBy: text("created_by").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_work_items_phase_state").on(table.phase, table.state),
    index("idx_work_items_decision_status").on(table.decisionStatus),
    index("idx_work_items_assignee").on(table.assigneeId),
  ],
);

export const activity = sqliteTable(
  "activity",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    itemId: integer("item_id").notNull(),
    actorId: text("actor_id").notNull(),
    action: text("action").notNull(),
    detail: text("detail").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_activity_item_created").on(table.itemId, table.createdAt)],
);

export const decisions = sqliteTable(
  "decisions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    itemId: integer("item_id").notNull(),
    gate: text("gate").notNull(),
    decision: text("decision").notNull(),
    reasoning: text("reasoning").notNull(),
    actorId: text("actor_id").notNull(),
    actorEmail: text("actor_email"),
    reviewId: integer("review_id"),
    evidenceUrl: text("evidence_url"),
    evidenceRevision: text("evidence_revision"),
    evidenceSha256: text("evidence_sha256"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_decisions_item_created").on(table.itemId, table.createdAt)],
);

export const agentReviews = sqliteTable(
  "agent_reviews",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    itemId: integer("item_id").notNull(),
    agentId: text("agent_id").notNull(),
    reviewMode: text("review_mode").notNull(),
    recommendation: text("recommendation").notNull(),
    confidence: text("confidence").notNull(),
    summary: text("summary").notNull(),
    findingsJson: text("findings_json").notNull(),
    dependenciesJson: text("dependencies_json").notNull(),
    impactsJson: text("impacts_json").notNull(),
    actionsJson: text("actions_json").notNull(),
    derivedTagsJson: text("derived_tags_json").notNull(),
    evidenceScope: text("evidence_scope").notNull(),
    evidenceUrl: text("evidence_url"),
    evidenceRevision: text("evidence_revision"),
    evidenceSha256: text("evidence_sha256"),
    reviewedItemUpdatedAt: text("reviewed_item_updated_at").notNull(),
    requestedBy: text("requested_by").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_agent_reviews_item_created").on(table.itemId, table.createdAt)],
);

export const notifications = sqliteTable(
  "notifications",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    dedupeKey: text("dedupe_key").notNull().unique(),
    itemId: integer("item_id").notNull(),
    memberId: text("member_id"),
    recipientRole: text("recipient_role").notNull(),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    channel: text("channel").notNull().default("Block Buzz"),
    status: text("status").notNull().default("queued"),
    createdAt: text("created_at").notNull(),
    readAt: text("read_at"),
  },
  (table) => [
    index("idx_notifications_role_created").on(table.recipientRole, table.createdAt),
    index("idx_notifications_member_status").on(table.memberId, table.status),
  ],
);
