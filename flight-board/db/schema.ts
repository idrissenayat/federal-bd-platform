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
    decisionIntentId: text("decision_intent_id"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_decisions_item_created").on(table.itemId, table.createdAt), uniqueIndex("uq_decisions_intent").on(table.decisionIntentId)],
);

export const decisionPackages = sqliteTable(
  "decision_packages",
  {
    packageId: text("package_id").primaryKey(), itemId: integer("item_id").notNull(), podId: text("pod_id").notNull(),
    decisionKind: text("decision_kind").notNull(), targetJson: text("target_json").notNull(), packageJson: text("package_json").notNull(),
    packageSha256: text("package_sha256").notNull(), evidenceSetSha256: text("evidence_set_sha256").notNull(),
    preparationPrincipal: text("preparation_principal").notNull(), createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_decision_packages_item_created").on(table.itemId, table.createdAt)],
);

export const decisionIntents = sqliteTable(
  "decision_intents",
  {
    intentId: text("intent_id").primaryKey(), receiptId: text("receipt_id").notNull().unique(), packageId: text("package_id").notNull(),
    itemId: integer("item_id").notNull(), podId: text("pod_id").notNull(), idempotencyKey: text("idempotency_key").notNull(),
    intentJson: text("intent_json").notNull(), intentSha256: text("intent_sha256").notNull(), currentState: text("current_state").notNull(),
    currentSequence: integer("current_sequence").notNull(), currentEventSha256: text("current_event_sha256").notNull(),
    requiredCountersignatures: integer("required_countersignatures").notNull().default(1), acceptedCountersignatures: integer("accepted_countersignatures").notNull().default(0),
    submitterId: text("submitter_id").notNull(), submitterRole: text("submitter_role").notNull(), decisionSessionId: text("decision_session_id").notNull().unique(), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
    effectiveNotBefore: text("effective_not_before").notNull(), signerPolicyVersion: integer("signer_policy_version").notNull(),
    readinessSnapshotSha256: text("readiness_snapshot_sha256").notNull().default(""),
  },
  (table) => [index("idx_decision_intents_item_created").on(table.itemId, table.createdAt), uniqueIndex("uq_decision_intents_pod_idempotency").on(table.podId, table.idempotencyKey)],
);

export const decisionSessions = sqliteTable(
  "decision_sessions",
  {
    sessionId: text("session_id").primaryKey(), podId: text("pod_id").notNull(), principalId: text("principal_id").notNull(),
    itemId: integer("item_id").notNull(), decisionKind: text("decision_kind").notNull(), reason: text("reason").notNull(),
    startedAt: text("started_at").notNull(), expiresAt: text("expires_at").notNull(),
  },
  (table) => [index("idx_decision_sessions_principal_started").on(table.principalId, table.startedAt)],
);

export const decisionSignerPolicies = sqliteTable(
  "decision_signer_policies",
  {
    podId: text("pod_id").notNull(), policyVersion: integer("policy_version").notNull(),
    operatingMode: text("operating_mode").notNull(), requiredCountersignatures: integer("required_countersignatures").notNull(),
    coolingHours: integer("cooling_hours").notNull(), status: text("status").notNull(), activatedBy: text("activated_by").notNull(),
    activationReason: text("activation_reason").notNull(), rulingUrl: text("ruling_url").notNull(), rulingSha256: text("ruling_sha256").notNull(), createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("uq_decision_signer_policy").on(table.podId, table.policyVersion), index("idx_decision_signer_policies_active").on(table.podId, table.status, table.policyVersion)],
);

export const decisionReadinessPolicies = sqliteTable(
  "decision_readiness_policies",
  {
    podId: text("pod_id").notNull(), policyVersion: integer("policy_version").notNull(),
    policyJson: text("policy_json").notNull(), policySha256: text("policy_sha256").notNull(), status: text("status").notNull(),
    activatedBy: text("activated_by").notNull(), activationReason: text("activation_reason").notNull(),
    rulingUrl: text("ruling_url").notNull(), rulingSha256: text("ruling_sha256").notNull(), createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("uq_decision_readiness_policy").on(table.podId, table.policyVersion), index("idx_decision_readiness_policy_active").on(table.podId, table.status, table.policyVersion)],
);

export const stagingVerificationReceipts = sqliteTable(
  "staging_verification_receipts",
  {
    receiptId: text("receipt_id").primaryKey(), itemId: integer("item_id").notNull(), podId: text("pod_id").notNull(),
    receiptJson: text("receipt_json").notNull(), receiptSha256: text("receipt_sha256").notNull().unique(),
    sourceRevision: text("source_revision").notNull(), buildSha256: text("build_sha256").notNull(),
    migrationSetSha256: text("migration_set_sha256").notNull(), runtimePolicySha256: text("runtime_policy_sha256").notNull(),
    completedAt: text("completed_at").notNull(), keyId: text("key_id").notNull(), keyVersion: integer("key_version").notNull(),
    serviceSignature: text("service_signature").notNull(), createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_staging_verification_receipts_item_created").on(table.itemId, table.createdAt)],
);

export const decisionReadinessSnapshots = sqliteTable(
  "decision_readiness_snapshots",
  {
    snapshotId: text("snapshot_id").primaryKey(), itemId: integer("item_id").notNull(), podId: text("pod_id").notNull(),
    snapshotJson: text("snapshot_json").notNull(), snapshotSha256: text("snapshot_sha256").notNull().unique(),
    evidenceSetSha256: text("evidence_set_sha256").notNull(), criticReviewId: integer("critic_review_id").notNull(),
    tier: text("tier").notNull(), satisfactionPath: text("satisfaction_path").notNull(), effectiveNotBefore: text("effective_not_before").notNull(),
    currentState: text("current_state").notNull(), invalidationReason: text("invalidation_reason"), predecessorSnapshotSha256: text("predecessor_snapshot_sha256"),
    createdBy: text("created_by").notNull(), createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_decision_readiness_snapshots_item_created").on(table.itemId, table.createdAt), index("idx_decision_readiness_snapshots_pod_state").on(table.podId, table.currentState)],
);

export const decisionReadinessEvents = sqliteTable(
  "decision_readiness_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }), snapshotId: text("snapshot_id").notNull(),
    eventType: text("event_type").notNull(), eventJson: text("event_json").notNull(), eventSha256: text("event_sha256").notNull().unique(),
    actorId: text("actor_id").notNull(), createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_decision_readiness_events_snapshot_created").on(table.snapshotId, table.createdAt)],
);

export const decisionReadinessCountersignatures = sqliteTable(
  "decision_readiness_countersignatures",
  {
    snapshotId: text("snapshot_id").notNull(), memberId: text("member_id").notNull(), role: text("role").notNull(),
    proofJson: text("proof_json").notNull(), proofSha256: text("proof_sha256").notNull(), status: text("status").notNull(), createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("uq_decision_readiness_countersignature").on(table.snapshotId, table.memberId), index("idx_decision_readiness_countersignatures_snapshot").on(table.snapshotId, table.status)],
);

export const decisionProofEvents = sqliteTable(
  "decision_proof_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }), intentId: text("intent_id").notNull(), sequence: integer("sequence").notNull(),
    eventType: text("event_type").notNull(), resultingState: text("resulting_state").notNull(), previousEventSha256: text("previous_event_sha256"),
    eventJson: text("event_json").notNull(), eventSha256: text("event_sha256").notNull(), actorId: text("actor_id").notNull(), createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_decision_proof_events_intent_created").on(table.intentId, table.createdAt), uniqueIndex("uq_decision_proof_events_intent_sequence").on(table.intentId, table.sequence)],
);

export const decisionIssuerSigners = sqliteTable(
  "decision_issuer_signers",
  {
    podId: text("pod_id").notNull(), keyId: text("key_id").notNull(), keyVersion: integer("key_version").notNull(),
    publicKey: text("public_key").notNull(), status: text("status").notNull(), activatedBy: text("activated_by").notNull(),
    activationReason: text("activation_reason").notNull(), createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("uq_decision_issuer_signer").on(table.podId, table.keyId, table.keyVersion), index("idx_decision_issuer_signers_active").on(table.podId, table.status)],
);

export const decisionIssuerEnvelopes = sqliteTable(
  "decision_issuer_envelopes",
  {
    intentId: text("intent_id").primaryKey(), keyId: text("key_id").notNull(), keyVersion: integer("key_version").notNull(),
    envelopeJson: text("envelope_json").notNull(), envelopeSha256: text("envelope_sha256").notNull(), createdAt: text("created_at").notNull(),
  },
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

export const workspaceRoutingConflicts = sqliteTable(
  "workspace_routing_conflicts",
  {
    podId: text("pod_id").notNull(),
    routeKey: text("route_key").notNull(),
    conflictId: text("conflict_id").notNull(),
    sourceKind: text("source_kind").notNull(),
    sourceReferenceSha256: text("source_reference_sha256").notNull(),
    status: text("status").notNull(),
    detectedBy: text("detected_by").notNull(),
    detectedAt: text("detected_at").notNull(),
    resolvedBy: text("resolved_by"),
    resolvedAt: text("resolved_at"),
  },
  (table) => [
    uniqueIndex("uq_workspace_routing_conflict").on(table.podId, table.routeKey, table.conflictId),
    index("idx_workspace_routing_conflict_active").on(table.podId, table.routeKey, table.status),
  ],
);

export const buzzChannelRegistry = sqliteTable(
  "buzz_channel_registry",
  {
    podId: text("pod_id").notNull(),
    registryVersion: integer("registry_version").notNull(),
    channelId: text("channel_id").notNull(),
    channelName: text("channel_name").notNull(),
    relayUrl: text("relay_url").notNull(),
    status: text("status").notNull(),
    changedBy: text("changed_by").notNull(),
    changeReason: text("change_reason").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("uq_buzz_channel_registry_version").on(table.podId, table.channelId, table.registryVersion),
    index("idx_buzz_channel_registry_active").on(table.podId, table.channelId, table.status),
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

export const dispatchAuthorizationAudits = sqliteTable(
  "dispatch_authorization_audits",
  {
    auditEventId: text("audit_event_id").primaryKey(),
    intentId: text("intent_id").notNull().unique(),
    itemId: integer("item_id").notNull(),
    podId: text("pod_id").notNull(),
    authorizationRevision: text("authorization_revision").notNull(),
    authorizationJson: text("authorization_json").notNull(),
    actorId: text("actor_id").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_dispatch_authorization_item_created").on(table.itemId, table.createdAt)],
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
    currentState: text("current_state").notNull().default("QUEUED"),
    currentEventVersion: integer("current_event_version").notNull().default(0),
    currentEventSha256: text("current_event_sha256").notNull(),
    attemptNumber: integer("attempt_number").notNull().default(0),
    leaseId: text("lease_id"),
    leaseExpiresAt: text("lease_expires_at"),
    reservationFence: text("reservation_fence"),
    sendStarted: integer("send_started", { mode: "boolean" }).notNull().default(false),
    reconciliationRequired: integer("reconciliation_required", { mode: "boolean" }).notNull().default(false),
    terminalizationRequested: integer("terminalization_requested", { mode: "boolean" }).notNull().default(false),
    relayUrl: text("relay_url").notNull(),
    routingConfigurationVersion: integer("routing_configuration_version").notNull(),
    deliveredEventId: text("delivered_event_id"),
    acceptedAcknowledgementSha256: text("accepted_acknowledgement_sha256"),
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
    expectedEventVersion: integer("expected_event_version").notNull(),
    eventType: text("event_type").notNull(),
    priorState: text("prior_state"),
    resultingState: text("resulting_state"),
    payloadJson: text("payload_json").notNull(),
    previousEventSha256: text("previous_event_sha256"),
    eventSha256: text("event_sha256").notNull(),
    serviceKeyId: text("service_key_id").notNull(),
    serviceKeyVersion: integer("service_key_version").notNull(),
    serviceSignature: text("service_signature").notNull(),
    agentKeyId: text("agent_key_id"),
    agentKeyVersion: integer("agent_key_version"),
    agentSignature: text("agent_signature"),
    acknowledgementSha256: text("acknowledgement_sha256"),
    actorId: text("actor_id").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("uq_dispatch_events_intent_version").on(table.intentId, table.eventVersion),
    index("idx_dispatch_events_intent_created").on(table.intentId, table.createdAt),
  ],
);

export const dispatchAttempts = sqliteTable(
  "dispatch_attempts",
  {
    intentId: text("intent_id").notNull(),
    attemptNumber: integer("attempt_number").notNull(),
    leaseId: text("lease_id").notNull(),
    leaseExpiresAt: text("lease_expires_at").notNull(),
    reservationFence: text("reservation_fence").notNull(),
    status: text("status").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("uq_dispatch_attempts_intent_number").on(table.intentId, table.attemptNumber),
    uniqueIndex("uq_dispatch_attempts_fence").on(table.reservationFence),
    index("idx_dispatch_attempts_intent_status").on(table.intentId, table.status),
  ],
);

export const dispatchEventSigners = sqliteTable(
  "dispatch_event_signers",
  {
    podId: text("pod_id").notNull(),
    registryVersion: integer("registry_version").notNull(),
    serviceRole: text("service_role").notNull(),
    allowedEventTypesJson: text("allowed_event_types_json").notNull(),
    keyId: text("key_id").notNull(),
    keyVersion: integer("key_version").notNull(),
    publicKey: text("public_key").notNull(),
    validFrom: text("valid_from").notNull(),
    validUntil: text("valid_until"),
    status: text("status").notNull(),
    changedBy: text("changed_by").notNull(),
    changeReason: text("change_reason").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("uq_dispatch_event_signers_key_version").on(table.podId, table.keyId, table.keyVersion),
    index("idx_dispatch_event_signers_active").on(table.podId, table.serviceRole, table.status),
  ],
);

export const relayEventSigners = sqliteTable(
  "relay_event_signers",
  {
    podId: text("pod_id").notNull(),
    registryVersion: integer("registry_version").notNull(),
    relayUrl: text("relay_url").notNull(),
    channelId: text("channel_id").notNull(),
    keyId: text("key_id").notNull(),
    keyVersion: integer("key_version").notNull(),
    publicKey: text("public_key").notNull(),
    validFrom: text("valid_from").notNull(),
    validUntil: text("valid_until"),
    status: text("status").notNull(),
    changedBy: text("changed_by").notNull(),
    changeReason: text("change_reason").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("uq_relay_event_signers_key_version").on(table.podId, table.keyId, table.keyVersion),
    index("idx_relay_event_signers_active").on(table.podId, table.relayUrl, table.channelId, table.status),
  ],
);

export const dispatchRetentionHolds = sqliteTable(
  "dispatch_retention_holds",
  {
    holdEventId: text("hold_event_id").primaryKey(),
    intentId: text("intent_id").notNull(),
    action: text("action").notNull(),
    reasonCode: text("reason_code").notNull(),
    expiresAt: text("expires_at").notNull(),
    actorId: text("actor_id").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_dispatch_retention_holds_intent_created").on(table.intentId, table.createdAt)],
);

export const dispatchRetentionAuthorizations = sqliteTable(
  "dispatch_retention_authorizations",
  {
    intentId: text("intent_id").primaryKey(),
    authorizationNonce: text("authorization_nonce").notNull(),
    expiresAt: text("expires_at").notNull(),
  },
);

export const dispatchRetentionRuns = sqliteTable(
  "dispatch_retention_runs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    cutoffAt: text("cutoff_at").notNull(),
    eligibleCount: integer("eligible_count").notNull(),
    deletedCount: integer("deleted_count").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_dispatch_retention_runs_created").on(table.createdAt)],
);

export const steerTelemetry = sqliteTable(
  "steer_telemetry",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    metricName: text("metric_name").notNull(),
    labelName: text("label_name").notNull().default(""),
    labelValue: text("label_value").notNull().default(""),
    value: integer("value").notNull(),
    caseId: text("case_id"),
    observedAt: text("observed_at").notNull(),
  },
  (table) => [index("idx_steer_telemetry_metric_observed").on(table.metricName, table.observedAt)],
);

export const dispatchPrivacyPolicies = sqliteTable(
  "dispatch_privacy_policies",
  {
    podId: text("pod_id").notNull(),
    policyVersion: integer("policy_version").notNull(),
    inventoryUrl: text("inventory_url").notNull(),
    inventorySha256: text("inventory_sha256").notNull(),
    terminalRetentionDays: integer("terminal_retention_days").notNull(),
    providerRecoveryDays: integer("provider_recovery_days").notNull(),
    status: text("status").notNull(),
    changedBy: text("changed_by").notNull(),
    changeReason: text("change_reason").notNull(),
    createdAt: text("created_at").notNull(),
    rulingUrl: text("ruling_url"),
    rulingSha256: text("ruling_sha256"),
    authorityRole: text("authority_role"),
    authorizationEventId: text("authorization_event_id"),
    idempotencyKey: text("idempotency_key"),
    activationReceiptSha256: text("activation_receipt_sha256"),
  },
  (table) => [
    uniqueIndex("uq_dispatch_privacy_policy_version").on(table.podId, table.policyVersion),
    uniqueIndex("uq_dispatch_privacy_policy_event").on(table.authorizationEventId),
    uniqueIndex("uq_dispatch_privacy_policy_idempotency").on(table.podId, table.idempotencyKey),
    index("idx_dispatch_privacy_policy_active").on(table.podId, table.status, table.policyVersion),
  ],
);

export const dispatchSecurityDiagnostics = sqliteTable(
  "dispatch_security_diagnostics",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    code: text("code").notNull(),
    configurationVersion: integer("configuration_version"),
    observedAt: text("observed_at").notNull(),
  },
  (table) => [index("idx_dispatch_security_diagnostics_observed").on(table.observedAt)],
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
