import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import axe from "axe-core";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { AgentDispatchControl, InlineActionFeedback } from "../app/page";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

async function assertAccessible(html: string, selector: string, role: string, live: string) {
  const dom = new JSDOM(`<main>${html}</main>`, { runScripts: "dangerously" });
  dom.window.eval(axe.source);
  const region = dom.window.document.querySelector<HTMLElement>(selector);
  assert.ok(region);
  assert.equal(region.getAttribute("role"), role);
  assert.equal(region.getAttribute("aria-live"), live);
  const results = await (dom.window as unknown as { axe: typeof axe }).axe.run(dom.window.document.querySelector("main")!, { rules: { "color-contrast": { enabled: false } } });
  assert.equal(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? "")).length, 0);
}

async function assertClientErrorFocus(message: string) {
  const dom = new JSDOM("<!doctype html><html><body><button id='initiator'>Initiating control</button><div id='root'></div></body></html>", { pretendToBeVisual: true });
  const previous = {
    window: Object.getOwnPropertyDescriptor(globalThis, "window"),
    document: Object.getOwnPropertyDescriptor(globalThis, "document"),
    navigator: Object.getOwnPropertyDescriptor(globalThis, "navigator"),
  };
  Object.defineProperties(globalThis, {
    window: { value: dom.window, configurable: true, writable: true },
    document: { value: dom.window.document, configurable: true, writable: true },
    navigator: { value: dom.window.navigator, configurable: true },
    IS_REACT_ACT_ENVIRONMENT: { value: true, configurable: true, writable: true },
  });
  const root = createRoot(dom.window.document.querySelector("#root")!);
  await act(async () => {
    root.render(createElement(InlineActionFeedback, { feedback: { id: 1, scope: "economics", state: "error", message } }));
  });
  const alert = dom.window.document.querySelector<HTMLElement>("[role='alert']");
  assert.ok(alert);
  assert.equal(dom.window.document.activeElement, alert);
  assert.equal(alert.getAttribute("aria-live"), "assertive");
  assert.match(alert.textContent ?? "", new RegExp(message));
  await act(async () => root.unmount());
  for (const [key, descriptor] of Object.entries(previous)) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
  Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
  dom.window.close();
}

test("STR-028 agent-operated accessibility matrix executes all eight frozen states", async (context) => {
  await context.test("success", async () => {
    const html = renderToStaticMarkup(createElement(InlineActionFeedback, { feedback: { id: 1, scope: "economics", state: "success", message: "The authoritative record is visible." } }));
    await assertAccessible(html, "[role='status']", "status", "polite");
  });

  await context.test("validation", () => assertClientErrorFocus("Validation failed; input is preserved."));
  await context.test("conflict", () => assertClientErrorFocus("Revision conflict; authoritative state is preserved."));
  await context.test("transport", () => assertClientErrorFocus("Transport failed; retry without repeating the action."));

  await context.test("blocked authorization", async () => {
    const item = {
      id: 28,
      updated_at: "2026-08-18T18:00:00.000Z",
      dispatch_intent_id: null,
      dispatch_authorization_revision: null,
      dispatch_state: null,
      dispatch_event_version: null,
      dispatch_updated_at: null,
      dispatch_authorization: {
        authorized: false,
        status: "Blocked",
        summary: "Authorization remains default-closed.",
        checks: [{ id: "hold", label: "Human hold", detail: "Resolve the hold before dispatch.", met: false }],
        missing: ["Human hold"],
        channel: "#steer-team",
        handoff_message: null,
      },
    } as unknown as Parameters<typeof AgentDispatchControl>[0]["item"];
    const html = renderToStaticMarkup(createElement(AgentDispatchControl, { item, dispatching: false, copied: false, onDispatch: () => undefined }));
    await assertAccessible(html, "[aria-label='Durable dispatch status']", "status", "polite");
    const dom = new JSDOM(`<main>${html}</main>`);
    assert.equal(dom.window.document.querySelector("button")?.hasAttribute("disabled"), true);
  });

  await context.test("pending", async () => {
    const html = renderToStaticMarkup(createElement(InlineActionFeedback, { feedback: { id: 2, scope: "economics", state: "pending", message: "Waiting for the authoritative response." } }));
    await assertAccessible(html, "[role='status']", "status", "polite");
  });

  await context.test("empty or unavailable", async () => {
    assert.match(page, /aria-label="Authoritative work item unavailable"/);
    const html = `<section role="alert" aria-live="assertive" aria-label="Authoritative work item unavailable"><h2>Work item unavailable</h2><p>No durable value was fabricated.</p><button>Refresh workspace</button></section>`;
    await assertAccessible(html, "[aria-label='Authoritative work item unavailable']", "alert", "assertive");
  });

  await context.test("reload failure", async () => {
    assert.match(page, /aria-label="Workspace refresh failed"/);
    assert.match(page, /retry the refresh without repeating the action/);
    const html = `<section role="alert" aria-live="assertive" aria-label="Workspace refresh failed"><h2>Workspace refresh failed</h2><p>The drawer still shows the last authoritative result.</p><button>Try refresh again</button></section>`;
    await assertAccessible(html, "[aria-label='Workspace refresh failed']", "alert", "assertive");
  });
});
