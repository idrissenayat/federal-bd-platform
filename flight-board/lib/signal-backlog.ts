export const SIGNAL_BACKLOG_DEFAULT_LIMIT = 25;
export const SIGNAL_BACKLOG_MAX_LIMIT = 50;
export const SIGNAL_BACKLOG_EXCERPT_LENGTH = 240;

export const signalBacklogGroups = ["ALL", "NEW", "SCREENING", "READY_FOR_REVIEW", "NEEDS_ATTENTION"] as const;
export type SignalBacklogGroup = typeof signalBacklogGroups[number];
export type SignalLifecycleState = "CAPTURED" | "PROCESSING" | "READY" | "STALE" | "SAFE_FAILURE";
export type SignalPresentationGroup = Exclude<SignalBacklogGroup, "ALL">;

export type SignalBacklogQuery = {
  group: SignalBacklogGroup;
  q: string | null;
  limit: number;
  snapshotAt: string;
  after: null | { createdAt: string; signalId: string };
  cursorProvided: boolean;
};

type CursorV1 = {
  v: 1;
  snapshot_at: string;
  last_created_at: string;
  last_signal_id: string;
  query_sha256: string;
};

export class SignalBacklogContractError extends Error {
  constructor(readonly code: string, message: string, readonly status = 400) {
    super(message);
  }
}

function oneParameter(params: URLSearchParams, name: string) {
  const values = params.getAll(name);
  if (values.length > 1) throw new SignalBacklogContractError(parameterCode(name), `Use exactly one ${name} parameter.`);
  return values[0];
}

function parameterCode(name: string) {
  if (name === "limit") return "INVALID_SIGNAL_PAGE_LIMIT";
  if (name === "group") return "INVALID_SIGNAL_GROUP";
  if (name === "q") return "INVALID_SIGNAL_QUERY";
  return "INVALID_SIGNAL_CURSOR";
}

function normalizedQueryInput(value: string | undefined) {
  if (value === undefined) return null;
  const normalized = value.normalize("NFKC").trim();
  const containsControl = [...normalized].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 31 || (codePoint >= 127 && codePoint <= 159);
  });
  if (!normalized || [...normalized].length > 100 || containsControl) {
    throw new SignalBacklogContractError("INVALID_SIGNAL_QUERY", "Search must contain 1–100 visible characters.");
  }
  return normalized;
}

function parsedLimit(value: string | undefined) {
  if (value === undefined) return SIGNAL_BACKLOG_DEFAULT_LIMIT;
  if (!/^(?:[1-9]|[1-4][0-9]|50)$/.test(value)) {
    throw new SignalBacklogContractError("INVALID_SIGNAL_PAGE_LIMIT", "Page size must be a whole number from 1 to 50.");
  }
  return Number(value);
}

function parsedGroup(value: string | undefined): SignalBacklogGroup {
  if (value === undefined) return "ALL";
  if (!(signalBacklogGroups as readonly string[]).includes(value)) {
    throw new SignalBacklogContractError("INVALID_SIGNAL_GROUP", "Choose a supported signal lifecycle group.");
  }
  return value as SignalBacklogGroup;
}

function exactUtcTimestamp(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && new Date(value).toISOString() === value;
}

function signalId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
}

function canonicalQuery(group: SignalBacklogGroup, q: string | null, limit: number) {
  return JSON.stringify({ group, limit, q });
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function base64UrlEncode(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function base64UrlDecode(value: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("invalid base64url");
  const standard = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(standard.padEnd(Math.ceil(standard.length / 4) * 4, "="));
  return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
}

function parseClosedCursorJson(value: string) {
  const decoded = base64UrlDecode(value);
  const keys = [...decoded.matchAll(/"(?:[^"\\]|\\.)*"\s*:/gu)].map((match) => JSON.parse(match[0].slice(0, match[0].lastIndexOf(":"))) as string);
  const allowed = ["v", "snapshot_at", "last_created_at", "last_signal_id", "query_sha256"];
  if (keys.length !== allowed.length || new Set(keys).size !== keys.length || keys.some((key) => !allowed.includes(key))) {
    throw new Error("cursor keys are not closed");
  }
  const parsed = JSON.parse(decoded) as Partial<CursorV1>;
  if (parsed.v !== 1 || !exactUtcTimestamp(parsed.snapshot_at) || !exactUtcTimestamp(parsed.last_created_at) ||
    !signalId(parsed.last_signal_id) || !/^[0-9a-f]{64}$/.test(String(parsed.query_sha256 ?? ""))) {
    throw new Error("cursor values are invalid");
  }
  return parsed as CursorV1;
}

export async function parseSignalBacklogQuery(url: URL, now = new Date()): Promise<SignalBacklogQuery> {
  const allowed = new Set(["limit", "cursor", "group", "q"]);
  for (const key of url.searchParams.keys()) {
    if (!allowed.has(key)) throw new SignalBacklogContractError("INVALID_SIGNAL_LIST_PARAMETER", "The signal-list request contains an unsupported parameter.");
  }
  const limit = parsedLimit(oneParameter(url.searchParams, "limit"));
  const group = parsedGroup(oneParameter(url.searchParams, "group"));
  const q = normalizedQueryInput(oneParameter(url.searchParams, "q"));
  const cursorValue = oneParameter(url.searchParams, "cursor");
  if (cursorValue === "" || (cursorValue && cursorValue.length > 1_024)) {
    throw new SignalBacklogContractError("INVALID_SIGNAL_CURSOR", "The continuation cursor is invalid.");
  }
  if (!cursorValue) {
    return { group, q, limit, snapshotAt: now.toISOString(), after: null, cursorProvided: false };
  }
  try {
    const cursor = parseClosedCursorJson(cursorValue);
    const expectedDigest = await sha256Hex(canonicalQuery(group, q, limit));
    if (cursor.query_sha256 !== expectedDigest || Date.parse(cursor.snapshot_at) > now.getTime() + 5 * 60_000 || cursor.last_created_at > cursor.snapshot_at) {
      throw new Error("cursor binding is invalid");
    }
    return {
      group,
      q,
      limit,
      snapshotAt: cursor.snapshot_at,
      after: { createdAt: cursor.last_created_at, signalId: cursor.last_signal_id },
      cursorProvided: true,
    };
  } catch {
    throw new SignalBacklogContractError("INVALID_SIGNAL_CURSOR", "The continuation cursor is invalid for this query.");
  }
}

export async function createSignalBacklogCursor(query: SignalBacklogQuery, last: { createdAt: string; signalId: string }) {
  const cursor: CursorV1 = {
    v: 1,
    snapshot_at: query.snapshotAt,
    last_created_at: last.createdAt,
    last_signal_id: last.signalId,
    query_sha256: await sha256Hex(canonicalQuery(query.group, query.q, query.limit)),
  };
  return base64UrlEncode(JSON.stringify(cursor));
}

export function presentationForSignalState(state: string): { group: SignalPresentationGroup; label: string } {
  if (state === "CAPTURED") return { group: "NEW", label: "New" };
  if (state === "PROCESSING") return { group: "SCREENING", label: "Screening" };
  if (state === "READY") return { group: "READY_FOR_REVIEW", label: "Ready for review" };
  if (state === "STALE" || state === "SAFE_FAILURE") return { group: "NEEDS_ATTENTION", label: "Needs attention" };
  throw new SignalBacklogContractError("SIGNAL_STATE_CONTRACT_VIOLATION", "A stored signal has an unsupported lifecycle state.", 500);
}

export function lifecycleStatesForGroup(group: SignalBacklogGroup): SignalLifecycleState[] {
  if (group === "NEW") return ["CAPTURED"];
  if (group === "SCREENING") return ["PROCESSING"];
  if (group === "READY_FOR_REVIEW") return ["READY"];
  if (group === "NEEDS_ATTENTION") return ["STALE", "SAFE_FAILURE"];
  return ["CAPTURED", "PROCESSING", "READY", "STALE", "SAFE_FAILURE"];
}

const safeFailureReasons = new Set([
  "MISSING_CREDENTIAL", "MODEL_POLICY_MISMATCH", "INPUT_BUDGET_EXCEEDED", "COST_BUDGET_EXCEEDED",
  "PROVIDER_TIMEOUT", "PROVIDER_4XX", "PROVIDER_5XX", "MALFORMED_OUTPUT",
  "PROPOSAL_VALIDATION_FAILED", "TOKEN_BUDGET_EXCEEDED", "PROVIDER_FAILURE",
]);

export function signalAttentionReason(state: string, latestErrorCode: unknown) {
  if (state === "STALE") return "SOURCE_CHANGED";
  if (state !== "SAFE_FAILURE") return null;
  const value = String(latestErrorCode ?? "");
  return safeFailureReasons.has(value) ? value : "SAFE_FAILURE";
}

export function signalExcerpt(value: unknown) {
  const plain = String(value ?? "").replace(/\s+/gu, " ").trim();
  const scalars = [...plain];
  if (scalars.length <= SIGNAL_BACKLOG_EXCERPT_LENGTH) return plain;
  return `${scalars.slice(0, SIGNAL_BACKLOG_EXCERPT_LENGTH - 1).join("")}…`;
}

export function escapeSignalSearch(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}
