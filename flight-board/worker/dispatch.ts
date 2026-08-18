import {
  applyDispatchCommand,
  canonicalJson,
  createSignedDispatchEvent,
  dispatchPublicKey,
  initialDispatchProjection,
  sha256Hex,
  verifyNip01Event,
  verifySchnorrBinding,
  type DispatchCommand,
  type DispatchEventEnvelope,
  type DispatchProjection,
  type DispatchState,
  type NostrEvent,
} from "../lib/dispatch-lifecycle";

export type D1Result<T = Record<string, unknown>> = { results?: T[]; meta?: { last_row_id?: number }; success?: boolean };
export type Statement = {
  bind(...values: unknown[]): Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
};
export type Database = { prepare(sql: string): Statement; batch(statements: Statement[]): Promise<unknown[]> };

export type DispatchServiceEnv = {
  DISPATCH_SERVICE_PRIVATE_KEY?: string;
  DISPATCH_SERVICE_KEY_ID?: string;
  DISPATCH_SERVICE_KEY_VERSION?: string;
  DISPATCH_SERVICE_TOKEN?: string;
};

const serviceRole = "work-management-authorization";
const serviceEventTypes = [
  "QUEUED", "SEND_ATTEMPT_RESERVED", "SEND_ATTEMPT_STARTED", "DELIVERED",
  "RECONCILIATION_REQUIRED", "FAILED_RETRYABLE", "REQUEUED", "ACKNOWLEDGED",
  "FAILED_FINAL", "SUPERSEDED", "CANCELLED", "TERMINALIZATION_REQUESTED",
  "ACK_REJECTED", "DELIVERY_BLOCKED_CONFIG_STALE",
];

type ReceiptRecord = {
  intent_id: string;
  lineage_id: string;
  item_id: number;
  pod_id: string;
  authorization_revision: string;
  channel_id: string;
  configuration_version: number;
  receipt_json: string;
};

type OutboxRecord = {
  intent_id: string;
  member_id: string;
  channel_id: string;
  channel_name: string;
  current_state: DispatchState;
  current_event_version: number;
  current_event_sha256: string;
  attempt_number: number;
  lease_id: string | null;
  lease_expires_at: string | null;
  reservation_fence: string | null;
  send_started: number;
  reconciliation_required: number;
  terminalization_requested: number;
  relay_url: string;
  routing_configuration_version: number;
  delivered_event_id: string | null;
  accepted_acknowledgement_sha256: string | null;
  last_error_code: string | null;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

export function dispatchServiceSigner(env: DispatchServiceEnv) {
  const privateKey = String(env.DISPATCH_SERVICE_PRIVATE_KEY ?? "");
  const keyId = String(env.DISPATCH_SERVICE_KEY_ID ?? "steer-work-management-dispatch");
  const keyVersion = Number(env.DISPATCH_SERVICE_KEY_VERSION ?? 1);
  if (!/^[0-9a-f]{64}$/.test(privateKey) || !keyId || !Number.isInteger(keyVersion) || keyVersion < 1) {
    throw new Error("Dispatch signing is unavailable because the versioned service signer is not configured.");
  }
  return { privateKey, publicKey: dispatchPublicKey(privateKey), keyId, keyVersion };
}

export async function ensureDispatchServiceSigner(db: Database, podId: string, actorId: string, env: DispatchServiceEnv, now: string) {
  const signer = dispatchServiceSigner(env);
  const existing = await db.prepare(`SELECT public_key, status, service_role, allowed_event_types_json, valid_from, valid_until
    FROM dispatch_event_signers WHERE pod_id = ? AND key_id = ? AND key_version = ?`)
    .bind(podId, signer.keyId, signer.keyVersion).first<Record<string, unknown>>();
  if (existing) {
    if (String(existing.public_key) !== signer.publicKey || String(existing.status) !== "ACTIVE" || String(existing.service_role) !== serviceRole
      || String(existing.valid_from) > now || (existing.valid_until !== null && String(existing.valid_until) <= now)) {
      throw new Error("The configured dispatch signer conflicts with the audited signer registry.");
    }
    const allowed = JSON.parse(String(existing.allowed_event_types_json)) as string[];
    if (!serviceEventTypes.every((eventType) => allowed.includes(eventType))) throw new Error("The dispatch signer registry does not authorize the required event matrix.");
    return signer;
  }
  const registry = await db.prepare("SELECT COALESCE(MAX(registry_version), 0) AS version FROM dispatch_event_signers WHERE pod_id = ?")
    .bind(podId).first<{ version: number }>();
  await db.prepare(`INSERT INTO dispatch_event_signers
    (pod_id, registry_version, service_role, allowed_event_types_json, key_id, key_version, public_key,
     valid_from, valid_until, status, changed_by, change_reason, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 'ACTIVE', ?, 'Initial STR-028 dispatch signer enrollment under the approved Gate 2 implementation.', ?)`)
    .bind(podId, Number(registry?.version ?? 0) + 1, serviceRole, JSON.stringify(serviceEventTypes), signer.keyId, signer.keyVersion, signer.publicKey, now, actorId, now).run();
  return signer;
}

function projection(row: OutboxRecord): DispatchProjection {
  return {
    state: row.current_state,
    eventVersion: Number(row.current_event_version),
    attemptNumber: Number(row.attempt_number),
    reservationFence: row.reservation_fence,
    leaseActive: Boolean(row.lease_id) && Boolean(row.lease_expires_at) && String(row.lease_expires_at) > new Date().toISOString(),
    sendStarted: Boolean(row.send_started),
    reconciliationRequired: Boolean(row.reconciliation_required),
    terminalizationRequested: Boolean(row.terminalization_requested),
  };
}

async function loadDispatch(db: Database, intentId: string) {
  const receipt = await db.prepare("SELECT * FROM dispatch_receipts WHERE intent_id = ?").bind(intentId).first<ReceiptRecord>();
  const outbox = await db.prepare("SELECT * FROM dispatch_outbox WHERE intent_id = ?").bind(intentId).first<OutboxRecord>();
  return receipt && outbox ? { receipt, outbox, receiptBody: JSON.parse(receipt.receipt_json) as Record<string, unknown> } : null;
}

export async function buildInitialQueuedEvent(input: {
  intentId: string;
  lineageId: string;
  occurredAt: string;
  routingConfigurationVersion: number;
  evidenceRevision: string;
  signer: ReturnType<typeof dispatchServiceSigner>;
}) {
  return createSignedDispatchEvent({
    intentId: input.intentId,
    lineageId: input.lineageId,
    eventVersion: 0,
    previousEventSha256: null,
    eventType: "QUEUED",
    priorState: null,
    resultingState: "QUEUED",
    occurredAt: input.occurredAt,
    authority: serviceRole,
    receiptId: input.intentId,
    routingConfigurationVersion: input.routingConfigurationVersion,
    evidenceRevision: input.evidenceRevision,
    payload: { receipt_id: input.intentId },
    serviceKeyId: input.signer.keyId,
    serviceKeyVersion: input.signer.keyVersion,
    servicePrivateKey: input.signer.privateKey,
  });
}

function eventInsert(db: Database, event: Awaited<ReturnType<typeof createSignedDispatchEvent>>, actorId: string, acknowledgementSha256: string | null = null) {
  const envelope = event.envelope;
  return db.prepare(`INSERT INTO dispatch_events
    (intent_id, event_version, expected_event_version, event_type, prior_state, resulting_state, payload_json,
     previous_event_sha256, event_sha256, service_key_id, service_key_version, service_signature,
     agent_key_id, agent_key_version, agent_signature, acknowledgement_sha256, actor_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      event.payload.dispatch_intent_id, event.payload.event_version, event.payload.expected_event_version,
      event.payload.event_type, event.payload.prior_state, event.payload.resulting_state, canonicalJson(envelope),
      event.payload.previous_event_sha256, event.eventSha256, envelope.service_key_id, envelope.service_key_version,
      envelope.service_signature, envelope.agent_key_id ?? null, envelope.agent_key_version ?? null,
      envelope.agent_signature ?? null, acknowledgementSha256, actorId, event.payload.occurred_at,
    );
}

async function signedTransition(input: {
  db: Database;
  env: DispatchServiceEnv;
  receipt: ReceiptRecord;
  outbox: OutboxRecord;
  command: DispatchCommand;
  actorId: string;
  authority: string;
  payload?: Record<string, unknown>;
  options?: { reservationFence?: string; deliveryAbsent?: boolean };
  agentKeyId?: string;
  agentKeyVersion?: number;
  agentSignature?: string;
  acknowledgementSha256?: string;
  extraStatements?: Statement[];
  lease?: { id: string; expiresAt: string };
  outboxFields?: { deliveredEventId?: string | null; acceptedAcknowledgementSha256?: string | null; lastErrorCode?: string | null };
}) {
  const now = new Date().toISOString();
  const signer = await ensureDispatchServiceSigner(input.db, input.receipt.pod_id, input.actorId, input.env, now);
  const current = projection(input.outbox);
  const transition = applyDispatchCommand(current, input.command, input.options);
  const event = await createSignedDispatchEvent({
    intentId: input.receipt.intent_id,
    lineageId: input.receipt.lineage_id,
    eventVersion: transition.next.eventVersion,
    previousEventSha256: input.outbox.current_event_sha256,
    eventType: transition.eventType,
    priorState: transition.priorState,
    resultingState: transition.resultingState,
    occurredAt: now,
    authority: input.authority,
    receiptId: input.receipt.intent_id,
    routingConfigurationVersion: input.receipt.configuration_version,
    evidenceRevision: String((JSON.parse(input.receipt.receipt_json) as Record<string, unknown>).evidence_revision ?? ""),
    payload: input.payload,
    serviceKeyId: signer.keyId,
    serviceKeyVersion: signer.keyVersion,
    servicePrivateKey: signer.privateKey,
    agentKeyId: input.agentKeyId,
    agentKeyVersion: input.agentKeyVersion,
    agentSignature: input.agentSignature,
  });
  const deliveredEventId = input.outboxFields?.deliveredEventId === undefined ? input.outbox.delivered_event_id : input.outboxFields.deliveredEventId;
  const acceptedAck = input.outboxFields?.acceptedAcknowledgementSha256 === undefined ? input.outbox.accepted_acknowledgement_sha256 : input.outboxFields.acceptedAcknowledgementSha256;
  const lastError = input.outboxFields?.lastErrorCode === undefined ? input.outbox.last_error_code : input.outboxFields.lastErrorCode;
  const leaseId = transition.next.leaseActive ? (input.lease?.id ?? input.outbox.lease_id) : null;
  const leaseExpiresAt = transition.next.leaseActive ? (input.lease?.expiresAt ?? input.outbox.lease_expires_at) : null;
  const statements = [
    ...(input.extraStatements ?? []),
    eventInsert(input.db, event, input.actorId, input.acknowledgementSha256 ?? null),
    input.db.prepare(`UPDATE dispatch_outbox SET status = ?, current_state = ?, current_event_version = ?, current_event_sha256 = ?,
      attempt_number = ?, lease_id = ?, lease_expires_at = ?, reservation_fence = ?, send_started = ?,
      reconciliation_required = ?, terminalization_requested = ?, delivered_event_id = ?, accepted_acknowledgement_sha256 = ?,
      last_error_code = ?, updated_at = ? WHERE intent_id = ? AND current_event_version = ? AND current_event_sha256 = ?`)
      .bind(
        transition.next.state, transition.next.state, transition.next.eventVersion, event.eventSha256,
        transition.next.attemptNumber, leaseId, leaseExpiresAt, transition.next.reservationFence,
        transition.next.sendStarted ? 1 : 0, transition.next.reconciliationRequired ? 1 : 0,
        transition.next.terminalizationRequested ? 1 : 0, deliveredEventId, acceptedAck, lastError,
        now, input.receipt.intent_id, current.eventVersion, input.outbox.current_event_sha256,
      ),
  ];
  await input.db.batch(statements);
  return { event, projection: transition.next };
}

function serviceAuthorized(request: Request, env: DispatchServiceEnv) {
  const configured = String(env.DISPATCH_SERVICE_TOKEN ?? "");
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  return configured.length >= 32 && constantTimeEqual(configured, supplied);
}

async function readBody(request: Request) {
  try { return await request.json() as Record<string, unknown>; } catch { return null; }
}

async function validateCurrentRoute(db: Database, receipt: ReceiptRecord, outbox: OutboxRecord, receiptBody: Record<string, unknown>) {
  const route = await db.prepare(`SELECT r.channel_id, r.channel_name, r.relay_url, r.configuration_version,
    CASE WHEN m.status = 'active' THEN 1 ELSE 0 END AS member_active,
    CASE WHEN c.status = 'ACTIVE' THEN 1 ELSE 0 END AS channel_active,
    c.channel_name AS registered_channel_name, c.relay_url AS registered_relay_url
    FROM workspace_routing r
    LEFT JOIN buzz_channel_registry c
      ON c.pod_id = r.pod_id AND c.channel_id = r.channel_id
     AND c.registry_version = (SELECT MAX(c2.registry_version) FROM buzz_channel_registry c2
       WHERE c2.pod_id = r.pod_id AND c2.channel_id = r.channel_id)
    LEFT JOIN agent_channel_memberships m
      ON m.pod_id = r.pod_id AND m.channel_id = r.channel_id AND m.member_id = ?
     AND m.membership_version = (SELECT MAX(m2.membership_version) FROM agent_channel_memberships m2
       WHERE m2.pod_id = r.pod_id AND m2.channel_id = r.channel_id AND m2.member_id = ?)
    WHERE r.pod_id = ? AND r.route_key = 'workspace.routing.steer_agent_handoff.channel_id'
    ORDER BY r.configuration_version DESC LIMIT 1`)
    .bind(outbox.member_id, outbox.member_id, receipt.pod_id).first<Record<string, unknown>>();
  if (!route) return "ROUTE_CONFIG_MISSING";
  if (Number(route.channel_active) !== 1) return "CHANNEL_BINDING_STALE";
  if (String(route.registered_channel_name) !== String(route.channel_name)) return "CHANNEL_BINDING_STALE";
  if (String(route.registered_relay_url) !== String(route.relay_url)) return "RELAY_BINDING_STALE";
  if (String(route.channel_id) !== receipt.channel_id) return "CHANNEL_BINDING_STALE";
  if (String(route.relay_url) !== outbox.relay_url) return "RELAY_BINDING_STALE";
  if (Number(route.configuration_version) !== receipt.configuration_version) return "ROUTING_VERSION_STALE";
  if (Number(route.member_active) !== 1) return "MEMBERSHIP_STALE";
  const publisher = await db.prepare(`SELECT registry_version, key_id, key_version, public_key FROM relay_event_signers
    WHERE pod_id = ? AND relay_url = ? AND channel_id = ? AND status = 'ACTIVE'
      AND valid_from <= ? AND (valid_until IS NULL OR valid_until > ?)
      AND registry_version = (SELECT MAX(latest.registry_version) FROM relay_event_signers latest
        WHERE latest.pod_id = ? AND latest.relay_url = ? AND latest.channel_id = ?)
    ORDER BY registry_version DESC LIMIT 1`)
    .bind(receipt.pod_id, outbox.relay_url, receipt.channel_id, new Date().toISOString(), new Date().toISOString(),
      receipt.pod_id, outbox.relay_url, receipt.channel_id).first<Record<string, unknown>>();
  if (!publisher) return "RELAY_PUBLISHER_UNTRUSTED";
  if (Number(publisher.registry_version) !== Number(receiptBody.relay_publisher_registry_version)
    || String(publisher.key_id) !== String(receiptBody.relay_publisher_key_id)
    || Number(publisher.key_version) !== Number(receiptBody.relay_publisher_key_version)
    || String(publisher.public_key) !== String(receiptBody.relay_publisher_public_key)) return "RELAY_PUBLISHER_UNTRUSTED";
  return null;
}

async function recordConfigBlock(db: Database, env: DispatchServiceEnv, dispatch: NonNullable<Awaited<ReturnType<typeof loadDispatch>>>, code: string) {
  const requested = await signedTransition({
    db, env, receipt: dispatch.receipt, outbox: dispatch.outbox,
    command: "REQUEST_TERMINALIZATION", actorId: "dispatch-terminalization-coordinator",
    authority: "terminalization-coordinator", payload: { diagnostic_code: code }, outboxFields: { lastErrorCode: code },
    extraStatements: dispatch.outbox.reservation_fence
      ? [db.prepare(`UPDATE dispatch_attempts SET status = 'FENCED_CONFIG_STALE', updated_at = ?
          WHERE intent_id = ? AND attempt_number = ? AND reservation_fence = ? AND status = 'RESERVED'`)
        .bind(new Date().toISOString(), dispatch.receipt.intent_id, dispatch.outbox.attempt_number, dispatch.outbox.reservation_fence)]
      : undefined,
  });
  const refreshed = await loadDispatch(db, dispatch.receipt.intent_id);
  if (!refreshed) throw new Error("Dispatch disappeared after terminalization.");
  const diagnostic = await createSignedDispatchEvent({
    intentId: refreshed.receipt.intent_id, lineageId: refreshed.receipt.lineage_id,
    eventVersion: requested.projection.eventVersion + 1, previousEventSha256: requested.event.eventSha256,
    eventType: "DELIVERY_BLOCKED_CONFIG_STALE", priorState: requested.projection.state,
    resultingState: requested.projection.state, occurredAt: new Date().toISOString(), authority: "reconciliation-service",
    receiptId: refreshed.receipt.intent_id, routingConfigurationVersion: refreshed.receipt.configuration_version,
    evidenceRevision: String(refreshed.receiptBody.evidence_revision ?? ""), payload: { diagnostic_code: code },
    serviceKeyId: dispatchServiceSigner(env).keyId, serviceKeyVersion: dispatchServiceSigner(env).keyVersion,
    servicePrivateKey: dispatchServiceSigner(env).privateKey,
  });
  await db.batch([
    eventInsert(db, diagnostic, "dispatch-reconciliation-service"),
    db.prepare("UPDATE dispatch_outbox SET current_event_version = ?, current_event_sha256 = ?, last_error_code = ?, updated_at = ? WHERE intent_id = ? AND current_event_version = ?")
      .bind(diagnostic.payload.event_version, diagnostic.eventSha256, code, diagnostic.payload.occurred_at, refreshed.receipt.intent_id, requested.projection.eventVersion),
  ]);
  return diagnostic;
}

async function reserveDispatch(db: Database, env: DispatchServiceEnv, dispatch: NonNullable<Awaited<ReturnType<typeof loadDispatch>>>) {
  const intentId = dispatch.receipt.intent_id;
  const leaseId = crypto.randomUUID();
  const fence = crypto.randomUUID();
  const leaseExpiresAt = new Date(Date.now() + 60_000).toISOString();
  const attempt = Number(dispatch.outbox.attempt_number) + 1;
  const result = await signedTransition({
    db, env, receipt: dispatch.receipt, outbox: dispatch.outbox, command: "RESERVE_SEND", actorId: "dispatch-outbox-service",
    authority: "outbox-delivery-service", options: { reservationFence: fence },
    lease: { id: leaseId, expiresAt: leaseExpiresAt },
    payload: { attempt_number: attempt, lease_id: leaseId, lease_expires_at: leaseExpiresAt, reservation_fence: fence, relay_idempotency_key: intentId },
    extraStatements: [db.prepare(`INSERT INTO dispatch_attempts
      (intent_id, attempt_number, lease_id, lease_expires_at, reservation_fence, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'RESERVED', ?, ?)`)
      .bind(intentId, attempt, leaseId, leaseExpiresAt, fence, new Date().toISOString(), new Date().toISOString())],
  });
  return { result, attempt };
}

async function handleNextDispatch(request: Request, db: Database, env: DispatchServiceEnv) {
  if (!serviceAuthorized(request, env)) return json({ error: "Dispatch service authentication required.", code: "SERVICE_AUTH_REQUIRED" }, 401);
  const candidate = await db.prepare(`SELECT o.intent_id FROM dispatch_outbox o
    WHERE o.current_state = 'QUEUED' AND o.send_started = 0 AND o.reconciliation_required = 0
      AND o.terminalization_requested = 0 AND (o.lease_id IS NULL OR o.lease_expires_at <= ?)
    ORDER BY o.created_at, o.id LIMIT 1`).bind(new Date().toISOString()).first<{ intent_id: string }>();
  if (!candidate) return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  const dispatch = await loadDispatch(db, candidate.intent_id);
  if (!dispatch) return json({ error: "Queued dispatch lost its receipt binding.", code: "OUTBOX_RECEIPT_MISSING" }, 409);
  try {
    const { result, attempt } = await reserveDispatch(db, env, dispatch);
    const agent = await enrolledAgent(db, dispatch);
    if (!agent) return json({ error: "Assigned agent key enrollment is unavailable.", code: "AGENT_KEY_NOT_ENROLLED" }, 409);
    const transportContent = {
      schema: "steer-dispatch-delivery/v1",
      dispatch_intent_id: dispatch.receipt.intent_id,
      attempt_number: attempt,
      channel_id: dispatch.receipt.channel_id,
      payload_sha256: String(dispatch.receiptBody.authorized_handoff_sha256 ?? ""),
      message: String(dispatch.receiptBody.authorized_handoff_message ?? ""),
    };
    return json({
      ok: true,
      dispatch_intent_id: dispatch.receipt.intent_id,
      attempt_number: attempt,
      channel_id: dispatch.receipt.channel_id,
      relay_url: dispatch.outbox.relay_url,
      agent_public_key: String(agent.agent_public_key ?? ""),
      transport_content: canonicalJson(transportContent),
      event: result.event.envelope,
      projection: result.projection,
    }, 201);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "The next dispatch could not be reserved.", code: "RESERVATION_CONFLICT" }, 409);
  }
}

async function handleRetentionRun(request: Request, db: Database, env: DispatchServiceEnv) {
  if (!serviceAuthorized(request, env)) return json({ error: "Dispatch service authentication required.", code: "SERVICE_AUTH_REQUIRED" }, 401);
  const now = new Date();
  const cutoffAt = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const eligible = await db.prepare(`SELECT r.intent_id FROM dispatch_receipts r
    JOIN dispatch_outbox o ON o.intent_id = r.intent_id
    WHERE o.current_state IN ('ACKNOWLEDGED','FAILED_FINAL','SUPERSEDED','CANCELLED')
      AND o.updated_at <= ?
      AND NOT EXISTS (
        SELECT 1 FROM dispatch_retention_holds h
        WHERE h.intent_id = r.intent_id AND h.action = 'HOLD' AND h.expires_at > ?
          AND NOT EXISTS (
            SELECT 1 FROM dispatch_retention_holds release
            WHERE release.intent_id = h.intent_id AND release.action = 'RELEASE' AND release.created_at > h.created_at
          )
      )
    ORDER BY o.updated_at LIMIT 100`).bind(cutoffAt, now.toISOString()).all<{ intent_id: string }>();
  let deletedCount = 0;
  for (const candidate of eligible.results ?? []) {
    const authorizationNonce = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60_000).toISOString();
    await db.batch([
      db.prepare("INSERT INTO dispatch_retention_authorizations (intent_id, authorization_nonce, expires_at) VALUES (?, ?, ?)")
        .bind(candidate.intent_id, authorizationNonce, expiresAt),
      db.prepare("DELETE FROM dispatch_events WHERE intent_id = ?").bind(candidate.intent_id),
      db.prepare("DELETE FROM dispatch_attempts WHERE intent_id = ?").bind(candidate.intent_id),
      db.prepare("DELETE FROM dispatch_outbox WHERE intent_id = ?").bind(candidate.intent_id),
      db.prepare("DELETE FROM dispatch_authorization_audits WHERE intent_id = ?").bind(candidate.intent_id),
      db.prepare("DELETE FROM notifications WHERE dedupe_key = ?").bind(`dispatch-${candidate.intent_id}`),
      db.prepare("DELETE FROM dispatch_retention_holds WHERE intent_id = ?").bind(candidate.intent_id),
      db.prepare("DELETE FROM dispatch_receipts WHERE intent_id = ?").bind(candidate.intent_id),
      db.prepare("DELETE FROM dispatch_retention_authorizations WHERE intent_id = ? AND authorization_nonce = ?")
        .bind(candidate.intent_id, authorizationNonce),
    ]);
    deletedCount += 1;
  }
  await db.prepare(`INSERT INTO dispatch_retention_runs (cutoff_at, eligible_count, deleted_count, created_at)
    VALUES (?, ?, ?, ?)`).bind(cutoffAt, (eligible.results ?? []).length, deletedCount, now.toISOString()).run();
  return json({ ok: true, cutoff_at: cutoffAt, eligible_count: (eligible.results ?? []).length, deleted_count: deletedCount });
}

async function handleServiceCommand(request: Request, db: Database, env: DispatchServiceEnv, intentId: string) {
  if (!serviceAuthorized(request, env)) return json({ error: "Dispatch service authentication required.", code: "SERVICE_AUTH_REQUIRED" }, 401);
  const dispatch = await loadDispatch(db, intentId);
  if (!dispatch) return json({ error: "Dispatch intent not found." }, 404);
  const body = await readBody(request);
  const command = String(body?.command ?? "") as DispatchCommand;
  const allowed: DispatchCommand[] = ["RESERVE_SEND", "START_SEND", "CONFIRM_DELIVERY", "MARK_DELIVERY_UNKNOWN", "MARK_RETRYABLE", "REQUEUE", "FAIL_FINAL"];
  if (!allowed.includes(command)) return json({ error: "Unsupported service command." }, 400);

  if (command === "START_SEND") {
    const configError = await validateCurrentRoute(db, dispatch.receipt, dispatch.outbox, dispatch.receiptBody);
    if (configError) {
      await recordConfigBlock(db, env, dispatch, configError);
      return json({ error: "Dispatch was terminalized before send because an immutable route binding changed.", code: configError }, 409);
    }
  }

  if (command === "RESERVE_SEND") {
    const { result } = await reserveDispatch(db, env, dispatch);
    return json({ ok: true, event: result.event.envelope, projection: result.projection }, 201);
  }

  if (command === "CONFIRM_DELIVERY") {
    const relayEvent = body?.relay_event as NostrEvent | undefined;
    if (!relayEvent || !(await verifyNip01Event(relayEvent))) return json({ error: "A valid NIP-01 relay event is required.", code: "RELAY_SIGNATURE_INVALID" }, 409);
    const signer = await db.prepare(`SELECT * FROM relay_event_signers WHERE pod_id = ? AND relay_url = ? AND channel_id = ?
      AND public_key = ? AND status = 'ACTIVE' AND valid_from <= ? AND (valid_until IS NULL OR valid_until > ?)
      AND registry_version = ? AND key_id = ? AND key_version = ?
      AND registry_version = (SELECT MAX(latest.registry_version) FROM relay_event_signers latest
        WHERE latest.pod_id = ? AND latest.relay_url = ? AND latest.channel_id = ?)
      ORDER BY registry_version DESC LIMIT 1`)
      .bind(dispatch.receipt.pod_id, dispatch.outbox.relay_url, dispatch.receipt.channel_id, relayEvent.pubkey, new Date().toISOString(), new Date().toISOString(),
        Number(dispatch.receiptBody.relay_publisher_registry_version), String(dispatch.receiptBody.relay_publisher_key_id), Number(dispatch.receiptBody.relay_publisher_key_version),
        dispatch.receipt.pod_id, dispatch.outbox.relay_url, dispatch.receipt.channel_id).first<Record<string, unknown>>();
    if (!signer) return json({ error: "Relay publisher is not active in the audited registry.", code: "RELAY_PUBLISHER_UNTRUSTED" }, 409);
    let content: Record<string, unknown>;
    try { content = JSON.parse(relayEvent.content) as Record<string, unknown>; } catch { return json({ error: "Relay event content is not valid JSON.", code: "RELAY_BINDING_INVALID" }, 409); }
    const attempt = Number(dispatch.outbox.attempt_number);
    const channelTag = relayEvent.tags.some((tag) => tag[0] === "h" && tag[1] === dispatch.receipt.channel_id);
    if (!channelTag || content.dispatch_intent_id !== intentId || Number(content.attempt_number) !== attempt
      || content.channel_id !== dispatch.receipt.channel_id || content.payload_sha256 !== dispatch.receiptBody.authorized_handoff_sha256) {
      return json({ error: "Relay proof does not match the immutable dispatch bindings.", code: "RELAY_BINDING_INVALID" }, 409);
    }
    const result = await signedTransition({
      db, env, receipt: dispatch.receipt, outbox: dispatch.outbox, command, actorId: "dispatch-outbox-service",
      authority: "outbox-delivery-service", payload: { attempt_number: attempt, relay_event_id: relayEvent.id, relay_event_sha256: await sha256Hex(canonicalJson(relayEvent)) },
      outboxFields: { deliveredEventId: relayEvent.id },
      extraStatements: [db.prepare("UPDATE dispatch_attempts SET status = 'DELIVERED', updated_at = ? WHERE intent_id = ? AND attempt_number = ? AND status IN ('RESERVED','STARTED')")
        .bind(new Date().toISOString(), intentId, attempt)],
    });
    return json({ ok: true, event: result.event.envelope, projection: result.projection }, 201);
  }

  const options = command === "MARK_RETRYABLE" ? { deliveryAbsent: body?.delivery_absent === true } : {};
  const result = await signedTransition({
    db, env, receipt: dispatch.receipt, outbox: dispatch.outbox, command,
    actorId: command === "START_SEND" ? "dispatch-outbox-service" : "dispatch-reconciliation-service",
    authority: command === "START_SEND" ? "outbox-delivery-service" : "reconciliation-service",
    options, payload: { attempt_number: dispatch.outbox.attempt_number, reason_code: String(body?.reason_code ?? "") },
    extraStatements: command === "START_SEND"
      ? [db.prepare("UPDATE dispatch_attempts SET status = 'STARTED', updated_at = ? WHERE intent_id = ? AND attempt_number = ? AND reservation_fence = ? AND status = 'RESERVED'")
        .bind(new Date().toISOString(), intentId, dispatch.outbox.attempt_number, dispatch.outbox.reservation_fence)]
      : undefined,
  });
  return json({ ok: true, event: result.event.envelope, projection: result.projection }, 201);
}

async function enrolledAgent(db: Database, dispatch: NonNullable<Awaited<ReturnType<typeof loadDispatch>>>) {
  return db.prepare("SELECT id, agent_key_id, agent_key_version, agent_public_key FROM members WHERE id = ? AND pod_id = ? AND status = 'enrolled'")
    .bind(dispatch.outbox.member_id, dispatch.receipt.pod_id).first<Record<string, unknown>>();
}

async function handleAgentRead(request: Request, db: Database, intentId: string) {
  const dispatch = await loadDispatch(db, intentId);
  if (!dispatch) return json({ error: "Dispatch intent not found." }, 404);
  const body = await readBody(request);
  const agent = await enrolledAgent(db, dispatch);
  const requestedAt = String(body?.requested_at ?? "");
  const timestamp = Date.parse(requestedAt);
  const readPayload = { schema: "steer-dispatch-read/v1", method: "POST", path: `/api/dispatches/${intentId}/read`, dispatch_intent_id: intentId, requested_at: requestedAt };
  if (!agent || String(body?.member_id) !== agent.id || String(body?.key_id) !== agent.agent_key_id || Number(body?.key_version) !== Number(agent.agent_key_version)
    || !Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > 300_000
    || !(await verifySchnorrBinding(readPayload, String(body?.signature ?? ""), String(agent.agent_public_key ?? "")))) {
    return json({ error: "Enrolled-agent signature required.", code: "AGENT_AUTH_INVALID" }, 401);
  }
  const events = await db.prepare("SELECT payload_json FROM dispatch_events WHERE intent_id = ? ORDER BY event_version").bind(intentId).all<{ payload_json: string }>();
  const authorizationAudit = await db.prepare("SELECT authorization_json FROM dispatch_authorization_audits WHERE intent_id = ?")
    .bind(intentId).first<{ authorization_json: string }>();
  if (!authorizationAudit) return json({ error: "The immutable authorization audit reference cannot be resolved.", code: "AUTHORIZATION_AUDIT_UNRESOLVED" }, 409);
  return json({
    receipt: dispatch.receiptBody,
    authorization_audit: JSON.parse(authorizationAudit.authorization_json),
    events: (events.results ?? []).map((row) => JSON.parse(row.payload_json)),
    projection: projection(dispatch.outbox),
  });
}

async function appendAckRejected(db: Database, env: DispatchServiceEnv, dispatch: NonNullable<Awaited<ReturnType<typeof loadDispatch>>>, code: string) {
  const signer = await ensureDispatchServiceSigner(db, dispatch.receipt.pod_id, "dispatch-authorization-service", env, new Date().toISOString());
  const event = await createSignedDispatchEvent({
    intentId: dispatch.receipt.intent_id, lineageId: dispatch.receipt.lineage_id,
    eventVersion: dispatch.outbox.current_event_version + 1, previousEventSha256: dispatch.outbox.current_event_sha256,
    eventType: "ACK_REJECTED", priorState: dispatch.outbox.current_state, resultingState: dispatch.outbox.current_state,
    occurredAt: new Date().toISOString(), authority: serviceRole, receiptId: dispatch.receipt.intent_id,
    routingConfigurationVersion: dispatch.receipt.configuration_version, evidenceRevision: String(dispatch.receiptBody.evidence_revision ?? ""),
    payload: { diagnostic_code: code }, serviceKeyId: signer.keyId, serviceKeyVersion: signer.keyVersion, servicePrivateKey: signer.privateKey,
  });
  await db.batch([
    eventInsert(db, event, "dispatch-authorization-service"),
    db.prepare("UPDATE dispatch_outbox SET current_event_version = ?, current_event_sha256 = ?, last_error_code = ?, updated_at = ? WHERE intent_id = ? AND current_event_version = ?")
      .bind(event.payload.event_version, event.eventSha256, code, event.payload.occurred_at, dispatch.receipt.intent_id, dispatch.outbox.current_event_version),
  ]);
}

async function handleAcknowledgement(request: Request, db: Database, env: DispatchServiceEnv, intentId: string) {
  const dispatch = await loadDispatch(db, intentId);
  if (!dispatch) return json({ error: "Dispatch intent not found." }, 404);
  const body = await readBody(request);
  const agent = await enrolledAgent(db, dispatch);
  const acknowledgementPayload = {
    schema: "steer-dispatch-ack/v1",
    dispatch_intent_id: intentId,
    authorization_revision: String(body?.authorization_revision ?? ""),
    evidence_sha256: String(body?.evidence_sha256 ?? ""),
    canonical_channel_id: String(body?.canonical_channel_id ?? ""),
    delivered_event_id: String(body?.delivered_event_id ?? ""),
    agent_claim_run_id: String(body?.agent_claim_run_id ?? ""),
    acknowledged_at: String(body?.acknowledged_at ?? ""),
  };
  const acknowledgementSha256 = await sha256Hex(canonicalJson(acknowledgementPayload));
  if (dispatch.outbox.accepted_acknowledgement_sha256 === acknowledgementSha256) {
    const existing = await db.prepare("SELECT payload_json FROM dispatch_events WHERE intent_id = ? AND acknowledgement_sha256 = ?")
      .bind(intentId, acknowledgementSha256).first<{ payload_json: string }>();
    return json({ ok: true, idempotent_replay: true, event: existing ? JSON.parse(existing.payload_json) : null, projection: projection(dispatch.outbox) });
  }
  const receipt = dispatch.receiptBody;
  let rejectCode = "ACK_BINDING_INVALID";
  const acknowledgedAt = Date.parse(acknowledgementPayload.acknowledged_at);
  const bindingsValid = dispatch.outbox.current_state === "DELIVERED"
    && acknowledgementPayload.authorization_revision === dispatch.receipt.authorization_revision
    && acknowledgementPayload.evidence_sha256 === receipt.evidence_sha256
    && acknowledgementPayload.canonical_channel_id === dispatch.receipt.channel_id
    && acknowledgementPayload.delivered_event_id === dispatch.outbox.delivered_event_id
    && acknowledgementPayload.agent_claim_run_id.length >= 8
    && Number.isFinite(acknowledgedAt)
    && String(body?.member_id ?? "") === dispatch.outbox.member_id
    && String(body?.key_id ?? "") === String(agent?.agent_key_id ?? "")
    && Number(body?.key_version ?? 0) === Number(agent?.agent_key_version ?? 0);
  const signatureValid = Boolean(agent) && await verifySchnorrBinding(acknowledgementPayload, String(body?.signature ?? ""), String(agent?.agent_public_key ?? ""));
  if (!bindingsValid || !signatureValid) {
    if (!signatureValid) rejectCode = "ACK_SIGNATURE_INVALID";
    await appendAckRejected(db, env, dispatch, rejectCode);
    return json({ error: "Acknowledgement did not match the enrolled agent and immutable receipt bindings.", code: rejectCode }, 409);
  }
  if (dispatch.outbox.accepted_acknowledgement_sha256) {
    await appendAckRejected(db, env, dispatch, "ACK_SECOND_DIFFERENT");
    return json({ error: "A different acknowledgement is already accepted for this intent.", code: "ACK_SECOND_DIFFERENT" }, 409);
  }
  const result = await signedTransition({
    db, env, receipt: dispatch.receipt, outbox: dispatch.outbox, command: "ACKNOWLEDGE",
    actorId: "dispatch-authorization-service", authority: serviceRole,
    payload: { acknowledgement_sha256: acknowledgementSha256, delivered_event_id: acknowledgementPayload.delivered_event_id, agent_claim_run_id: acknowledgementPayload.agent_claim_run_id },
    agentKeyId: String(agent?.agent_key_id), agentKeyVersion: Number(agent?.agent_key_version), agentSignature: String(body?.signature),
    acknowledgementSha256, outboxFields: { acceptedAcknowledgementSha256: acknowledgementSha256 },
  });
  return json({ ok: true, idempotent_replay: false, event: result.event.envelope, projection: result.projection }, 201);
}

export async function handleDispatchServiceApi(request: Request, db: Database, env: DispatchServiceEnv) {
  const url = new URL(request.url);
  if (request.method === "POST" && url.pathname === "/api/dispatches/next") return handleNextDispatch(request, db, env);
  if (request.method === "POST" && url.pathname === "/api/dispatch-retention/run") return handleRetentionRun(request, db, env);
  const commandMatch = url.pathname.match(/^\/api\/dispatches\/([0-9a-f]{64})\/commands$/);
  if (request.method === "POST" && commandMatch) return handleServiceCommand(request, db, env, commandMatch[1]);
  const readMatch = url.pathname.match(/^\/api\/dispatches\/([0-9a-f]{64})\/read$/);
  if (request.method === "POST" && readMatch) return handleAgentRead(request, db, readMatch[1]);
  const ackMatch = url.pathname.match(/^\/api\/dispatches\/([0-9a-f]{64})\/acknowledgements$/);
  if (request.method === "POST" && ackMatch) return handleAcknowledgement(request, db, env, ackMatch[1]);
  return null;
}

export function initialOutboxProjection() {
  return initialDispatchProjection();
}

export type { DispatchEventEnvelope };
