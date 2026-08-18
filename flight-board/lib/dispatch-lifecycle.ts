import { schnorr } from "@noble/curves/secp256k1.js";

export type DispatchState = "QUEUED" | "DELIVERED" | "RECONCILIATION_REQUIRED" | "FAILED_RETRYABLE" | "ACKNOWLEDGED" | "FAILED_FINAL" | "SUPERSEDED" | "CANCELLED";
export type DispatchCommand =
  | "RESERVE_SEND" | "START_SEND" | "CONFIRM_DELIVERY" | "MARK_DELIVERY_UNKNOWN"
  | "MARK_RETRYABLE" | "REQUEUE" | "ACKNOWLEDGE" | "REQUEST_TERMINALIZATION"
  | "FAIL_FINAL" | "SUPERSEDE" | "CANCEL";

export type DispatchProjection = {
  state: DispatchState;
  eventVersion: number;
  attemptNumber: number;
  reservationFence: string | null;
  leaseActive: boolean;
  sendStarted: boolean;
  reconciliationRequired: boolean;
  terminalizationRequested: boolean;
};

export type DispatchTransition = {
  eventType: string;
  priorState: DispatchState;
  resultingState: DispatchState;
  next: DispatchProjection;
};

export function initialDispatchProjection(): DispatchProjection {
  return { state: "QUEUED", eventVersion: 0, attemptNumber: 0, reservationFence: null, leaseActive: false, sendStarted: false, reconciliationRequired: false, terminalizationRequested: false };
}

function reject(message: string): never { throw new Error(message); }

export function applyDispatchCommand(current: DispatchProjection, command: DispatchCommand, options: { reservationFence?: string; deliveryAbsent?: boolean } = {}): DispatchTransition {
  const next = { ...current, eventVersion: current.eventVersion + 1 };
  const result = (eventType: string, resultingState = current.state): DispatchTransition => ({ eventType, priorState: current.state, resultingState, next: { ...next, state: resultingState } });
  if (["ACKNOWLEDGED", "FAILED_FINAL", "SUPERSEDED", "CANCELLED"].includes(current.state)) reject("The dispatch intent is terminal.");

  if (command === "RESERVE_SEND") {
    if (current.state !== "QUEUED" || current.leaseActive || current.reconciliationRequired || current.terminalizationRequested) reject("A send may be reserved only from an unencumbered QUEUED state.");
    if (!options.reservationFence) reject("A reservation fence is required.");
    Object.assign(next, { attemptNumber: current.attemptNumber + 1, reservationFence: options.reservationFence, leaseActive: true, sendStarted: false });
    return result("SEND_ATTEMPT_RESERVED");
  }
  if (command === "START_SEND") {
    if (current.state !== "QUEUED" || !current.leaseActive || current.sendStarted || !current.reservationFence || current.terminalizationRequested) reject("The active reservation fence does not authorize a send start.");
    next.sendStarted = true;
    return result("SEND_ATTEMPT_STARTED");
  }
  if (command === "CONFIRM_DELIVERY") {
    if (current.state === "DELIVERED") return result("DELIVERY_ALREADY_CONFIRMED", "DELIVERED");
    if (current.state !== "QUEUED" || !current.leaseActive || !current.sendStarted) reject("Delivery requires the exact started attempt.");
    Object.assign(next, { leaseActive: false, reservationFence: null, reconciliationRequired: false });
    return result("DELIVERED", "DELIVERED");
  }
  if (command === "MARK_DELIVERY_UNKNOWN") {
    if (current.state !== "QUEUED" || !current.leaseActive || !current.sendStarted) reject("Only a started unresolved attempt can require reconciliation.");
    Object.assign(next, { leaseActive: false, reservationFence: null, reconciliationRequired: true });
    return result("RECONCILIATION_REQUIRED", "RECONCILIATION_REQUIRED");
  }
  if (command === "MARK_RETRYABLE") {
    if (current.state !== "RECONCILIATION_REQUIRED" || current.leaseActive || !current.reconciliationRequired || options.deliveryAbsent !== true) reject("Retryable failure requires bounded proof that delivery is absent.");
    next.reconciliationRequired = false;
    return result("FAILED_RETRYABLE", "FAILED_RETRYABLE");
  }
  if (command === "REQUEUE") {
    if (current.state !== "FAILED_RETRYABLE" || current.leaseActive || current.reconciliationRequired || current.terminalizationRequested) reject("Only a resolved retryable failure may be requeued.");
    Object.assign(next, { sendStarted: false, reservationFence: null });
    return result("REQUEUED", "QUEUED");
  }
  if (command === "ACKNOWLEDGE") {
    if (current.state !== "DELIVERED") reject("Acknowledgement cannot precede verified delivery.");
    return result("ACKNOWLEDGED", "ACKNOWLEDGED");
  }
  if (command === "REQUEST_TERMINALIZATION") {
    if (current.sendStarted) reject("Terminalization must wait for the started attempt to resolve.");
    Object.assign(next, { terminalizationRequested: true, leaseActive: false, reservationFence: null });
    return result("TERMINALIZATION_REQUESTED");
  }
  if (command === "FAIL_FINAL") {
    if (current.leaseActive || current.reconciliationRequired) reject("Final failure cannot be recorded while a lease or reconciliation remains unresolved.");
    return result("FAILED_FINAL", "FAILED_FINAL");
  }
  if (command === "SUPERSEDE") return result("SUPERSEDED", "SUPERSEDED");
  if (command === "CANCEL") return result("CANCELLED", "CANCELLED");
  return reject("Unsupported dispatch command.");
}

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
  }
  throw new TypeError("Only JSON values can be canonicalized.");
}

export async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexBytes(value: string) {
  return Uint8Array.from(value.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? []);
}

function bytesHex(value: Uint8Array) {
  return Array.from(value, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function dispatchPublicKey(privateKey: string) {
  if (!/^[0-9a-f]{64}$/.test(privateKey)) throw new Error("The dispatch service private key must be 32-byte lowercase hex.");
  return bytesHex(schnorr.getPublicKey(hexBytes(privateKey)));
}

export async function signSchnorrBinding(payload: unknown, privateKey: string) {
  const digest = await sha256Hex(canonicalJson(payload));
  return {
    digest,
    signature: bytesHex(schnorr.sign(hexBytes(digest), hexBytes(privateKey))),
  };
}

export async function verifySchnorrBinding(payload: unknown, signature: string, publicKey: string) {
  if (!/^[0-9a-f]{128}$/.test(signature) || !/^[0-9a-f]{64}$/.test(publicKey)) return false;
  const digest = await sha256Hex(canonicalJson(payload));
  return schnorr.verify(hexBytes(signature), hexBytes(digest), hexBytes(publicKey));
}

export type NostrEvent = { id: string; pubkey: string; created_at: number; kind: number; tags: string[][]; content: string; sig: string };

export async function verifyNip01Event(event: NostrEvent) {
  if (!/^[0-9a-f]{64}$/.test(event.id) || !/^[0-9a-f]{64}$/.test(event.pubkey) || !/^[0-9a-f]{128}$/.test(event.sig)) return false;
  const id = await sha256Hex(JSON.stringify([0, event.pubkey, event.created_at, event.kind, event.tags, event.content]));
  return id === event.id && schnorr.verify(hexBytes(event.sig), hexBytes(event.id), hexBytes(event.pubkey));
}

export type DispatchEventPayload = {
  schema: "steer-dispatch-event/v1";
  dispatch_intent_id: string;
  dispatch_claim_lineage_id: string;
  event_version: number;
  expected_event_version: number;
  previous_event_sha256: string | null;
  event_type: string;
  prior_state: DispatchState | null;
  resulting_state: DispatchState;
  occurred_at: string;
  authority: string;
  typed_payload_sha256: string;
  receipt_id: string;
  routing_configuration_version: number;
  evidence_revision: string;
  payload: Record<string, unknown>;
};

export type DispatchEventEnvelope = {
  payload: DispatchEventPayload;
  service_key_id: string;
  service_key_version: number;
  service_signature: string;
  agent_key_id?: string;
  agent_key_version?: number;
  agent_signature?: string;
};

export async function createSignedDispatchEvent(input: {
  intentId: string;
  lineageId: string;
  eventVersion: number;
  previousEventSha256: string | null;
  eventType: string;
  priorState: DispatchState | null;
  resultingState: DispatchState;
  occurredAt: string;
  authority: string;
  receiptId: string;
  routingConfigurationVersion: number;
  evidenceRevision: string;
  payload?: Record<string, unknown>;
  serviceKeyId: string;
  serviceKeyVersion: number;
  servicePrivateKey: string;
  agentKeyId?: string;
  agentKeyVersion?: number;
  agentSignature?: string;
}) {
  const typedPayload = input.payload ?? {};
  const payload: DispatchEventPayload = {
    schema: "steer-dispatch-event/v1",
    dispatch_intent_id: input.intentId,
    dispatch_claim_lineage_id: input.lineageId,
    event_version: input.eventVersion,
    expected_event_version: input.eventVersion - 1,
    previous_event_sha256: input.previousEventSha256,
    event_type: input.eventType,
    prior_state: input.priorState,
    resulting_state: input.resultingState,
    occurred_at: input.occurredAt,
    authority: input.authority,
    typed_payload_sha256: await sha256Hex(canonicalJson(typedPayload)),
    receipt_id: input.receiptId,
    routing_configuration_version: input.routingConfigurationVersion,
    evidence_revision: input.evidenceRevision,
    payload: typedPayload,
  };
  const signed = await signSchnorrBinding(payload, input.servicePrivateKey);
  const envelope: DispatchEventEnvelope = {
    payload,
    service_key_id: input.serviceKeyId,
    service_key_version: input.serviceKeyVersion,
    service_signature: signed.signature,
    ...(input.agentKeyId ? { agent_key_id: input.agentKeyId } : {}),
    ...(input.agentKeyVersion ? { agent_key_version: input.agentKeyVersion } : {}),
    ...(input.agentSignature ? { agent_signature: input.agentSignature } : {}),
  };
  return { payload, envelope, eventSha256: await sha256Hex(canonicalJson(envelope)) };
}

export async function verifyDispatchEventEnvelope(envelope: DispatchEventEnvelope, publicKey: string) {
  if (envelope.payload.schema !== "steer-dispatch-event/v1") return false;
  if (envelope.payload.event_version !== envelope.payload.expected_event_version + 1) return false;
  const payloadDigest = await sha256Hex(canonicalJson(envelope.payload.payload));
  if (payloadDigest !== envelope.payload.typed_payload_sha256) return false;
  return verifySchnorrBinding(envelope.payload, envelope.service_signature, publicKey);
}
