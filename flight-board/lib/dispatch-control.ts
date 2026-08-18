export const STEER_HANDOFF_ROUTE_KEY = "workspace.routing.steer_agent_handoff.channel_id";

export type DispatchRoute = {
  podId: string;
  configurationVersion: number;
  channelId: string;
  channelName: string;
  relayUrl: string;
  membershipVersion: number;
  agentMemberId: string;
  agentIsMember: boolean;
};

export type DispatchIdentityInput = {
  podId: string;
  itemId: number;
  itemKey: string;
  workflow: string;
  agentMemberId: string;
  agentKeyId: string;
  agentKeyVersion: number;
  agentPublicKey: string;
  agentPublicKeyFingerprint: string;
  authorizationRevision: string;
  authorizationAuditEventId: string;
  evidenceUrl: string;
  evidenceRevision: string;
  evidenceSha256: string;
  forecastAuditEventId: string;
  channelId: string;
  routingConfigurationVersion: number;
  relayUrl: string;
  membershipVersion: number;
  nextAction: string;
};

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "number") return JSON.stringify(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
  }
  throw new TypeError("Dispatch identity accepts only JSON values.");
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function nextActionSha256(nextAction: string) {
  return sha256(nextAction.trim());
}

export async function buildDispatchIdentity(input: DispatchIdentityInput) {
  const nextActionDigest = await nextActionSha256(input.nextAction);
  const intentPayload = {
    schema: "steer-dispatch-intent/v1",
    originating_workspace_pod_id: input.podId,
    work_item_stable_id: input.itemId,
    work_item_key: input.itemKey,
    workflow: input.workflow,
    assigned_agent_member_id: input.agentMemberId,
    assigned_agent_key_id: input.agentKeyId,
    assigned_agent_key_version: input.agentKeyVersion,
    assigned_agent_public_key: input.agentPublicKey,
    assigned_agent_public_key_fingerprint: input.agentPublicKeyFingerprint,
    authorization_revision: input.authorizationRevision,
    human_authorization_audit_event_id: input.authorizationAuditEventId,
    evidence_url: input.evidenceUrl,
    evidence_revision: input.evidenceRevision,
    evidence_sha256: input.evidenceSha256,
    accepted_forecast_audit_event_id: input.forecastAuditEventId,
    canonical_channel_id: input.channelId,
    routing_configuration_version: input.routingConfigurationVersion,
    relay_url: input.relayUrl,
    membership_version: input.membershipVersion,
    authorized_next_action_sha256: nextActionDigest,
  };
  const lineagePayload = {
    schema: "steer-dispatch-lineage/v1",
    originating_workspace_pod_id: input.podId,
    work_item_stable_id: input.itemId,
    work_item_key: input.itemKey,
    workflow: "STEER",
    root_human_authorization_audit_event_id: input.authorizationAuditEventId,
  };
  const [intentId, lineageId] = await Promise.all([
    sha256(canonicalJson(intentPayload)),
    sha256(canonicalJson(lineagePayload)),
  ]);
  return { intentId, lineageId, nextActionDigest, intentPayload };
}

export function validateDispatchRoute(route: DispatchRoute | null, expectedPodId: string, expectedAgentMemberId: string) {
  if (!route) return { ok: false as const, code: "ROUTE_CONFIG_MISSING", detail: `Missing ${STEER_HANDOFF_ROUTE_KEY}.` };
  if (!route.channelId || !route.channelName || !route.relayUrl) return { ok: false as const, code: "ROUTE_CONFIG_INCOMPLETE", detail: "The canonical route is incomplete." };
  if (route.podId !== expectedPodId) return { ok: false as const, code: "ROUTE_WORKSPACE_MISMATCH", detail: "The canonical route belongs to another workspace/POD." };
  if (route.agentMemberId !== expectedAgentMemberId || !route.agentIsMember) return { ok: false as const, code: "ROUTE_AGENT_NOT_ENROLLED", detail: "The assigned agent is not enrolled in the canonical channel." };
  if (!Number.isInteger(route.configurationVersion) || route.configurationVersion < 1) return { ok: false as const, code: "ROUTE_VERSION_INVALID", detail: "The canonical route has no valid audited configuration version." };
  return { ok: true as const, code: "ROUTE_OK", detail: `${route.channelName} is bound by configuration v${route.configurationVersion}.` };
}

export function exactGitEvidence(urlValue: unknown) {
  try {
    const url = new URL(String(urlValue ?? ""));
    const parts = url.pathname.split("/").filter(Boolean);
    const revision = parts[2] === "blob" ? parts[3] : null;
    if (url.protocol !== "https:" || url.hostname !== "github.com" || !revision || !/^[0-9a-f]{40}$/.test(revision)) return null;
    return { url: url.toString(), revision };
  } catch {
    return null;
  }
}
