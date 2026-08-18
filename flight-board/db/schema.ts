import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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
    podId: text("pod_id").notNull().default("steer-flight-team"),
    agentKeyId: text("agent_key_id"),
    agentKeyVersion: integer("agent_key_version"),
    agentPublicKey: text("agent_public_key"),
    agentPublicKeyFingerprint: text("agent_public_key_fingerprint"),
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
    workType: text("work_type").notNull().default("Unclassified"),
    state: text("state").notNull(),
    gate: text("gate").notNull(),
    decisionStatus: text("decision_status").notNull(),
    decisionAuthority: text("decision_authority").notNull(),
    assigneeId: text("assignee_id"),
    nextAction: text("next_action").notNull(),
    evidenceUrl: text("evidence_url"),
    githubUrl: text("github_url"),
    reworkInstructions: text("rework_instructions"),
    blockedSince: text("blocked_since"),
    podId: text("pod_id").notNull().default("steer-flight-team"),
    deliveryOwnerId: text("delivery_owner_id"),
    outcomeOwnerId: text("outcome_owner_id"),
    valueHypothesisJson: text("value_hypothesis_json"),
    deliveryForecastJson: text("delivery_forecast_json"),
    actualEconomicsJson: text("actual_economics_json"),
    realizedOutcomeJson: text("realized_outcome_json"),
    createdBy: text("created_by").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_work_items_phase_state").on(table.phase, table.state),
    index("idx_work_items_decision_status").on(table.decisionStatus),
    index("idx_work_items_assignee").on(table.assigneeId),
    index("idx_work_items_pod_work_type_state").on(table.podId, table.workType, table.state),
  ],
);

export const workEconomicsEvents = sqliteTable(
  "work_economics_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    itemId: integer("item_id").notNull(),
    section: text("section").notNull(),
    action: text("action").notNull(),
    actorId: text("actor_id").notNull(),
    actorRole: text("actor_role").notNull(),
    previousJson: text("previous_json"),
    replacementJson: text("replacement_json"),
    reason: text("reason").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_work_economics_item_created").on(table.itemId, table.createdAt)],
);

export const workEconomicsHumanFacts = sqliteTable(
  "work_economics_human_facts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    itemId: integer("item_id").notNull(),
    recordKind: text("record_kind").notNull(),
    role: text("role").notNull(),
    minMinutes: integer("min_minutes"),
    maxMinutes: integer("max_minutes"),
    activeMinutes: integer("active_minutes"),
    recordedAt: text("recorded_at").notNull(),
  },
  (table) => [index("idx_work_economics_human_item_kind").on(table.itemId, table.recordKind)],
);

export const workEconomicsAgentFacts = sqliteTable(
  "work_economics_agent_facts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    itemId: integer("item_id").notNull(),
    recordKind: text("record_kind").notNull(),
    eventId: text("event_id").notNull(),
    provider: text("provider").notNull(),
    model: text("model"),
    attempts: integer("attempts").notNull(),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    minCostMicros: integer("min_cost_micros"),
    maxCostMicros: integer("max_cost_micros"),
    meteredCostMicros: integer("metered_cost_micros"),
    currency: text("currency").notNull(),
    executionSeconds: integer("execution_seconds"),
    source: text("source").notNull(),
    completeness: text("completeness").notNull(),
    ingestionState: text("ingestion_state").notNull(),
    conflictReason: text("conflict_reason").notNull().default(""),
    observedAt: text("observed_at").notNull(),
  },
  (table) => [
    index("idx_work_economics_agent_item_kind").on(table.itemId, table.recordKind),
    uniqueIndex("uq_work_economics_agent_item_kind_event").on(table.itemId, table.recordKind, table.eventId),
  ],
);

export const workEconomicsDeliveryEvents = sqliteTable(
  "work_economics_delivery_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }), itemId: integer("item_id").notNull(), eventKind: text("event_kind").notNull(), originatingPhase: text("originating_phase"), severity: text("severity"), minutes: integer("minutes"), count: integer("count"), reason: text("reason").notNull(), occurredAt: text("occurred_at").notNull(), recordedAt: text("recorded_at").notNull(),
  },
  (table) => [index("idx_work_economics_delivery_event_item_kind").on(table.itemId, table.eventKind)],
);

export const workEconomicsDurationFacts = sqliteTable(
  "work_economics_duration_facts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    itemId: integer("item_id").notNull(),
    factKind: text("fact_kind").notNull(),
    minutes: integer("minutes").notNull(),
    source: text("source").notNull(),
    recordedAt: text("recorded_at").notNull(),
  },
  (table) => [index("idx_work_economics_duration_item_kind").on(table.itemId, table.factKind)],
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

export const workspaceRouting = sqliteTable(
  "workspace_routing",
  {
    podId: text("pod_id").notNull(),
    routeKey: text("route_key").notNull(),
    configurationVersion: integer("configuration_version").notNull(),
    channelId: text("channel_id").notNull(),
    channelName: text("channel_name").notNull(),
    relayUrl: text("relay_url").notNull(),
    changedBy: text("changed_by").notNull(),
    changeReason: text("change_reason").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("uq_workspace_routing_pod_key_version").on(table.podId, table.routeKey, table.configurationVersion),
    index("idx_workspace_routing_active").on(table.podId, table.routeKey, table.configurationVersion),
  ],
);

export const agentChannelMemberships = sqliteTable(
  "agent_channel_memberships",
  {
    podId: text("pod_id").notNull(),
    channelId: text("channel_id").notNull(),
    memberId: text("member_id").notNull(),
    membershipVersion: integer("membership_version").notNull(),
    status: text("status").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("uq_agent_channel_membership").on(table.podId, table.channelId, table.memberId, table.membershipVersion),
    index("idx_agent_channel_membership_active").on(table.podId, table.channelId, table.memberId, table.status),
  ],
);

export const dispatchReceipts = sqliteTable(
  "dispatch_receipts",
  {
    intentId: text("intent_id").primaryKey(),
    lineageId: text("lineage_id").notNull(),
    itemId: integer("item_id").notNull(),
    podId: text("pod_id").notNull(),
    authorizationRevision: text("authorization_revision").notNull(),
    channelId: text("channel_id").notNull(),
    configurationVersion: integer("configuration_version").notNull(),
    receiptJson: text("receipt_json").notNull(),
    createdAt: text("created_at").notNull(),
    terminalAt: text("terminal_at"),
    deleteAfter: text("delete_after"),
  },
  (table) => [
    index("idx_dispatch_receipts_item_created").on(table.itemId, table.createdAt),
    index("idx_dispatch_receipts_lineage").on(table.lineageId),
  ],
);

export const dispatchOutbox = sqliteTable(
  "dispatch_outbox",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    intentId: text("intent_id").notNull().unique(),
    receiptId: text("receipt_id").notNull(),
    memberId: text("member_id").notNull(),
    channelId: text("channel_id").notNull(),
    channelName: text("channel_name").notNull(),
    status: text("status").notNull(),
    attemptNumber: integer("attempt_number").notNull().default(0),
    lastErrorCode: text("last_error_code"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [index("idx_dispatch_outbox_status_created").on(table.status, table.createdAt)],
);

export const dispatchEvents = sqliteTable(
  "dispatch_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    intentId: text("intent_id").notNull(),
    eventVersion: integer("event_version").notNull(),
    eventType: text("event_type").notNull(),
    priorState: text("prior_state"),
    resultingState: text("resulting_state"),
    payloadJson: text("payload_json").notNull(),
    actorId: text("actor_id").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("uq_dispatch_events_intent_version").on(table.intentId, table.eventVersion),
    index("idx_dispatch_events_intent_created").on(table.intentId, table.createdAt),
  ],
);

export const codeReviews = sqliteTable(
  "code_reviews",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    itemId: integer("item_id").notNull(),
    repository: text("repository").notNull(),
    pullNumber: integer("pull_number").notNull(),
    headSha: text("head_sha").notNull(),
    action: text("action").notNull(),
    reasoning: text("reasoning").notNull(),
    actorId: text("actor_id").notNull(),
    actorEmail: text("actor_email"),
    githubDelivery: text("github_delivery").notNull(),
    githubUrl: text("github_url"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_code_reviews_item_created").on(table.itemId, table.createdAt),
    index("idx_code_reviews_pr_head").on(table.repository, table.pullNumber, table.headSha),
  ],
);
