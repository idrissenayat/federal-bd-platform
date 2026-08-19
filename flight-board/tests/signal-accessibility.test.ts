import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { cycleDrawerFocus } from "../app/page";

function visible(element: HTMLElement) {
  element.getClientRects = () => [{ x: 0, y: 0, width: 10, height: 10, top: 0, right: 10, bottom: 10, left: 0, toJSON: () => ({}) }] as unknown as DOMRectList;
}

test("signal workspace focus trap includes the provenance summary disclosure", () => {
  const dom = new JSDOM(`<button id="origin">Open signal</button><dialog open aria-labelledby="title"><h2 id="title">Platform AI decision preparation</h2><button id="close" aria-label="Close signal workspace">×</button><details><summary id="provenance">How this proposal was produced</summary><p>Provider and model</p></details></dialog>`);
  const document = dom.window.document;
  const dialog = document.querySelector("dialog")!;
  const close = document.querySelector<HTMLElement>("#close")!;
  const provenance = document.querySelector<HTMLElement>("#provenance")!;
  visible(close);
  visible(provenance);

  close.focus();
  assert.equal(cycleDrawerFocus(dialog, false), false, "normal Tab must be allowed to reach provenance");
  provenance.focus();
  assert.equal(cycleDrawerFocus(dialog, false), true, "Tab from the last control wraps to Close");
  assert.equal(document.activeElement, close);
  assert.equal(cycleDrawerFocus(dialog, true), true, "Shift+Tab from Close wraps to provenance");
  assert.equal(document.activeElement, provenance);
});

function luminance(hex: string) {
  const channels = hex.match(/[a-f\d]{2}/gi)!.map((part) => Number.parseInt(part, 16) / 255)
    .map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground: string, background: string) {
  const [high, low] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (high + 0.05) / (low + 0.05);
}

test("signal workspace text colors meet WCAG AA against their explicit surfaces", () => {
  for (const [foreground, background] of [
    ["24312a", "ffffff"],
    ["49380f", "fff7df"],
    ["46564e", "f4f2ea"],
    ["1f2924", "f4f2ea"],
    ["45534c", "eef5f7"],
    ["45534c", "fff0f0"],
    ["2f6244", "e9f5ec"],
    ["394940", "fff9dd"],
    ["3f4d45", "f7f8f7"],
    ["4b5951", "ffffff"],
  ]) assert.ok(contrast(foreground, background) >= 4.5, `${foreground} on ${background}`);
});
