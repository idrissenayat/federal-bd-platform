import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";
import type { DatabaseSync } from "node:sqlite";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { InlineActionFeedback } from "../app/page";

type QueryableDatabase = {
  sqlite: DatabaseSync;
};

const captureCase = process.env.STR028_CAPTURE_CASE;

function digest(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function tableRows(db: QueryableDatabase | undefined, table: string, columns: string) {
  if (!db) return [];
  const exists = db.sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").all(table);
  if (!exists.length) return [];
  return db.sqlite.prepare(`SELECT ${columns} FROM ${table} ORDER BY rowid`).all();
}

function outcomeFromResponse(response: Response, body: Record<string, unknown>, dispatch: boolean) {
  if (response.status >= 500) return dispatch ? "error" : "transport";
  if (!response.ok) {
    if (dispatch) return "blocked";
    return response.status === 409 ? "conflict" : response.status >= 400 && response.status < 500 ? "validation" : "transport";
  }
  if (body.idempotent_replay === true) return "duplicate_suppressed";
  const projection = body.projection && typeof body.projection === "object" ? body.projection as Record<string, unknown> : null;
  const state = String(projection?.state ?? body.state ?? body.dispatch_state ?? "").toUpperCase();
  if (["DELIVERED", "ACKNOWLEDGED"].includes(state)) return "delivered";
  if (dispatch) return "queued";
  return "success";
}

function bodyMessage(body: Record<string, unknown>, response: Response, outcome: string) {
  const projection = body.projection && typeof body.projection === "object" ? body.projection as Record<string, unknown> : null;
  return String(body.error ?? body.code ?? body.message ?? projection?.state ?? body.state ?? `${response.status} ${outcome}`);
}

export async function captureConnectedResponse(input: {
  caseId: string;
  response: Response | undefined;
  db?: QueryableDatabase;
  scope: "economics" | "dispatch";
  reconciliation: "fresh" | "stale_suppressed" | "authoritative_reload" | "error";
  substeps?: Array<{ substep_id: string; result: "pass" | "fail"; code?: string }>;
  additional?: Record<string, unknown>;
}) {
  if (captureCase !== input.caseId) return;
  const responseReceivedAt = performance.now();
  if (!input.response) throw new Error(`${input.caseId} did not return an authoritative response.`);
  const text = await input.response.clone().text();
  let parsed: Record<string, unknown>;
  try {
    const candidate = JSON.parse(text) as unknown;
    parsed = candidate && typeof candidate === "object" && !Array.isArray(candidate) ? candidate as Record<string, unknown> : { value: candidate };
  } catch {
    parsed = { message: text };
  }
  const dispatch = input.scope === "dispatch";
  const outcome = outcomeFromResponse(input.response, parsed, dispatch);
  const parsedProjection = parsed.projection && typeof parsed.projection === "object" ? parsed.projection as Record<string, unknown> : null;
  const feedbackState = input.response.ok ? "success" as const : "error" as const;
  const message = bodyMessage(parsed, input.response, outcome);
  const dom = new JSDOM("<!doctype html><html><body><button id='initiator'>Initiating control</button><div id='root'></div></body></html>", { pretendToBeVisual: true });
  const previous = {
    window: Object.getOwnPropertyDescriptor(globalThis, "window"),
    document: Object.getOwnPropertyDescriptor(globalThis, "document"),
    navigator: Object.getOwnPropertyDescriptor(globalThis, "navigator"),
    act: Object.getOwnPropertyDescriptor(globalThis, "IS_REACT_ACT_ENVIRONMENT"),
  };
  Object.defineProperties(globalThis, {
    window: { value: dom.window, configurable: true, writable: true },
    document: { value: dom.window.document, configurable: true, writable: true },
    navigator: { value: dom.window.navigator, configurable: true },
    IS_REACT_ACT_ENVIRONMENT: { value: true, configurable: true, writable: true },
  });
  const initiator = dom.window.document.querySelector<HTMLButtonElement>("#initiator")!;
  initiator.focus();
  const root = createRoot(dom.window.document.querySelector("#root")!);
  await act(async () => root.render(createElement(InlineActionFeedback, {
    feedback: { id: 1, scope: input.scope, state: feedbackState, message },
  })));
  await new Promise<void>((resolve) => dom.window.requestAnimationFrame(() => resolve()));
  const visibleAt = performance.now();
  const region = dom.window.document.querySelector<HTMLElement>(feedbackState === "error" ? "[role='alert']" : "[role='status']");
  if (!region) throw new Error(`${input.caseId} did not paint a named local result.`);
  const focusTarget = dom.window.document.activeElement === region ? "inline_error" : dom.window.document.activeElement === initiator ? "initiating_control" : "unexpected";
  const database = {
    receipts: tableRows(input.db, "dispatch_receipts", "intent_id, lineage_id, authorization_revision, receipt_json"),
    outbox: tableRows(input.db, "dispatch_outbox", "intent_id, current_state, current_event_version, current_event_sha256, send_started, terminalization_requested"),
    events: tableRows(input.db, "dispatch_events", "intent_id, event_version, event_type, event_sha256"),
    attempts: tableRows(input.db, "dispatch_attempts", "intent_id, attempt_number, status, reservation_fence"),
    authorization_audits: tableRows(input.db, "dispatch_authorization_audits", "audit_event_id, intent_id, authorization_revision, authorization_json"),
    activity: tableRows(input.db, "activity", "id, item_id, action"),
    economics_events: tableRows(input.db, "work_economics_events", "id, item_id, section, action"),
  };
  const observation = {
    schema: "steer-str028-connected-observation/v1",
    case_id: input.caseId,
    authoritative_response: {
      status: input.response.status,
      body_sha256: digest(parsed),
      code: parsed.code ?? null,
      state: parsedProjection?.state ?? parsed.state ?? null,
      idempotent_replay: parsed.idempotent_replay === true,
      response_identity: parsed.dispatch_intent_id ?? (parsed.snapshot && typeof parsed.snapshot === "object" ? digest(parsed.snapshot) : digest(parsed)),
    },
    client: {
      feedback_state: feedbackState,
      role: region.getAttribute("role"),
      aria_live: region.getAttribute("aria-live"),
      message_sha256: digest(region.textContent ?? ""),
      focus_target: focusTarget,
      response_received_at_ms: responseReceivedAt,
      visible_at_ms: visibleAt,
      latency_ms: Math.max(0, Math.round(visibleAt - responseReceivedAt)),
      terminal_feedback_observations: 1,
    },
    derived: { outcome, reconciliation: input.reconciliation },
    database,
    database_sha256: digest(database),
    substeps: input.substeps ?? [],
    additional: input.additional ?? {},
  };
  console.log(`STR028_CONNECTED_OBSERVATION ${JSON.stringify(observation)}`);
  await act(async () => root.unmount());
  for (const [key, descriptor] of Object.entries(previous)) {
    const globalKey = key === "act" ? "IS_REACT_ACT_ENVIRONMENT" : key;
    if (descriptor) Object.defineProperty(globalThis, globalKey, descriptor);
    else Reflect.deleteProperty(globalThis, globalKey);
  }
  dom.window.close();
}

export async function captureConnectedClient(input: {
  caseId: string;
  outcome: "success" | "conflict" | "transport" | "duplicate_suppressed";
  reconciliation: "stale_suppressed";
  authoritative: unknown;
  visible: unknown;
}) {
  if (captureCase !== input.caseId) return;
  const responseReceivedAt = performance.now();
  const feedbackState = input.outcome === "transport" || input.outcome === "conflict" ? "error" as const : "success" as const;
  const dom = new JSDOM("<!doctype html><html><body><button id='initiator'>Initiating control</button><div id='root'></div></body></html>", { pretendToBeVisual: true });
  const previous = {
    window: Object.getOwnPropertyDescriptor(globalThis, "window"),
    document: Object.getOwnPropertyDescriptor(globalThis, "document"),
    navigator: Object.getOwnPropertyDescriptor(globalThis, "navigator"),
    act: Object.getOwnPropertyDescriptor(globalThis, "IS_REACT_ACT_ENVIRONMENT"),
  };
  Object.defineProperties(globalThis, {
    window: { value: dom.window, configurable: true, writable: true },
    document: { value: dom.window.document, configurable: true, writable: true },
    navigator: { value: dom.window.navigator, configurable: true },
    IS_REACT_ACT_ENVIRONMENT: { value: true, configurable: true, writable: true },
  });
  const initiator = dom.window.document.querySelector<HTMLButtonElement>("#initiator")!;
  initiator.focus();
  const root = createRoot(dom.window.document.querySelector("#root")!);
  await act(async () => root.render(createElement(InlineActionFeedback, {
    feedback: { id: 1, scope: input.caseId === "ORDER-03" ? "dispatch" : "economics", state: feedbackState, message: JSON.stringify(input.visible) },
  })));
  await new Promise<void>((resolve) => dom.window.requestAnimationFrame(() => resolve()));
  const visibleAt = performance.now();
  const region = dom.window.document.querySelector<HTMLElement>(feedbackState === "error" ? "[role='alert']" : "[role='status']");
  if (!region) throw new Error(`${input.caseId} did not paint its reconciled result.`);
  const focusTarget = dom.window.document.activeElement === region ? "inline_error" : dom.window.document.activeElement === initiator ? "initiating_control" : "unexpected";
  const observation = {
    schema: "steer-str028-connected-observation/v1",
    case_id: input.caseId,
    authoritative_response: { status: 200, body_sha256: digest(input.authoritative), code: null, response_identity: digest(input.authoritative) },
    client: { feedback_state: feedbackState, role: region.getAttribute("role"), aria_live: region.getAttribute("aria-live"), message_sha256: digest(region.textContent ?? ""), focus_target: focusTarget, response_received_at_ms: responseReceivedAt, visible_at_ms: visibleAt, latency_ms: Math.max(0, Math.round(visibleAt - responseReceivedAt)), terminal_feedback_observations: 1 },
    derived: { outcome: input.outcome, reconciliation: input.reconciliation },
    database: { receipts: [], outbox: [], events: [], attempts: [], authorization_audits: [], activity: [], economics_events: [] },
    database_sha256: digest([]),
    substeps: [],
    additional: { visible_sha256: digest(input.visible) },
  };
  console.log(`STR028_CONNECTED_OBSERVATION ${JSON.stringify(observation)}`);
  await act(async () => root.unmount());
  for (const [key, descriptor] of Object.entries(previous)) {
    const globalKey = key === "act" ? "IS_REACT_ACT_ENVIRONMENT" : key;
    if (descriptor) Object.defineProperty(globalThis, globalKey, descriptor);
    else Reflect.deleteProperty(globalThis, globalKey);
  }
  dom.window.close();
}
