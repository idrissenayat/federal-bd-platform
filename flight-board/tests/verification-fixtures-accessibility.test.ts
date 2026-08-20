import assert from "node:assert/strict";
import test from "node:test";
import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import axe from "axe-core";
import { VerificationEvidence } from "../app/page";

type EvidenceItem = ComponentProps<typeof VerificationEvidence>["items"][number];

const fixture = {
  id: 477,
  key: "RR74-ABCDEF123456",
  title: "RR74-CLASS-OPEN real lifecycle",
  description: "Bounded real lifecycle fixture for issue #74.",
  phase: "Evaluate",
  gate: "Gate 3 pending",
  state: "active",
  decision_status: "Needed now",
  verification_classification: {
    classifier_version: "steer.verification-fixture/v1",
    kind: "ISSUE_74_HOSTED_LIFECYCLE",
    is_fixture: true,
  },
} as unknown as EvidenceItem;

async function scan(items: EvidenceItem[], total: number) {
  const html = renderToStaticMarkup(createElement(VerificationEvidence, { items, total, onOpen: () => undefined }));
  const dom = new JSDOM(`<main style="width:320px;zoom:2">${html}</main>`, { runScripts: "dangerously" });
  dom.window.eval(axe.source);
  const main = dom.window.document.querySelector("main")!;
  const results = await (dom.window as unknown as { axe: typeof axe }).axe.run(main, { rules: { "color-contrast": { enabled: false } } });
  return { main, results };
}

function relativeLuminance(hex: string) {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground: string, background: string) {
  const values = [relativeLuminance(foreground), relativeLuminance(background)].sort((left, right) => right - left);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("FI-15 populated verification evidence is named, read-only, and axe clean", async () => {
  const { main, results } = await scan([fixture], 106);
  assert.match(main.textContent ?? "", /Preserved, not operational/);
  assert.match(main.textContent ?? "", /106preserved fixtures/);
  assert.equal(main.querySelectorAll("button").length, 1);
  assert.equal(main.querySelector("button")?.textContent, "Inspect authoritative evidence →");
  assert.equal(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? "")).length, 0);
});

test("FI-14 empty and filtered-empty states do not claim evidence was deleted", async () => {
  const empty = await scan([], 0);
  assert.match(empty.main.textContent ?? "", /No governed staging fixture has been classified/);
  const filtered = await scan([], 106);
  assert.match(filtered.main.textContent ?? "", /Clear the global search/);
  assert.match(filtered.main.textContent ?? "", /Nothing was deleted or rewritten/);
});

test("FI-15 verification evidence text and controls meet WCAG AA contrast", () => {
  const pairs = [
    ["#94506a", "#fffefa"],
    ["#77626b", "#fffefa"],
    ["#647680", "#fffefa"],
    ["#68525c", "#fffdf8"],
    ["#5f7041", "#f2f7e8"],
    ["#51672b", "#f2f7e8"],
    ["#684f26", "#fff5d9"],
    ["#76500b", "#fff5d9"],
    ["#ffffff", "#697d3d"],
  ] as const;
  for (const [foreground, background] of pairs) {
    assert.ok(contrastRatio(foreground, background) >= 4.5, `${foreground} on ${background} must meet 4.5:1`);
  }
});
