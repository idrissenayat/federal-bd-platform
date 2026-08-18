import assert from "node:assert/strict";
import test from "node:test";
import { schnorr } from "@noble/curves/secp256k1.js";
import { applyDispatchCommand, canonicalJson, initialDispatchProjection, sha256Hex, verifyNip01Event, verifySchnorrBinding } from "../lib/dispatch-lifecycle";

test("one reservation fence permits one start and delivery before acknowledgement", () => {
  const reserved = applyDispatchCommand(initialDispatchProjection(), "RESERVE_SEND", { reservationFence: "fence-1" }).next;
  assert.equal(reserved.attemptNumber, 1);
  assert.throws(() => applyDispatchCommand(reserved, "RESERVE_SEND", { reservationFence: "fence-2" }));
  const started = applyDispatchCommand(reserved, "START_SEND").next;
  assert.throws(() => applyDispatchCommand(started, "START_SEND"));
  const delivered = applyDispatchCommand(started, "CONFIRM_DELIVERY").next;
  const acknowledged = applyDispatchCommand(delivered, "ACKNOWLEDGE").next;
  assert.equal(acknowledged.state, "ACKNOWLEDGED");
});

test("unknown delivery reconciles before a new unique attempt", () => {
  const reserved = applyDispatchCommand(initialDispatchProjection(), "RESERVE_SEND", { reservationFence: "fence-1" }).next;
  const started = applyDispatchCommand(reserved, "START_SEND").next;
  const unknown = applyDispatchCommand(started, "MARK_DELIVERY_UNKNOWN").next;
  assert.throws(() => applyDispatchCommand(unknown, "REQUEUE"));
  const retryable = applyDispatchCommand(unknown, "MARK_RETRYABLE", { deliveryAbsent: true }).next;
  const queued = applyDispatchCommand(retryable, "REQUEUE").next;
  const next = applyDispatchCommand(queued, "RESERVE_SEND", { reservationFence: "fence-2" }).next;
  assert.equal(next.attemptNumber, 2);
});

test("a verified delivery discovered during reconciliation advances monotonically to delivered", () => {
  let projection = initialDispatchProjection();
  projection = applyDispatchCommand(projection, "RESERVE_SEND", { reservationFence: "fence-1" }).next;
  projection = applyDispatchCommand(projection, "START_SEND").next;
  projection = applyDispatchCommand(projection, "MARK_DELIVERY_UNKNOWN").next;
  const recovered = applyDispatchCommand(projection, "CONFIRM_DELIVERY").next;
  assert.equal(recovered.state, "DELIVERED");
  assert.equal(recovered.reconciliationRequired, false);
  assert.equal(recovered.attemptNumber, 1);
});

test("terminalization and send start have one fail-closed order", () => {
  const reserved = applyDispatchCommand(initialDispatchProjection(), "RESERVE_SEND", { reservationFence: "fence-1" }).next;
  const terminalized = applyDispatchCommand(reserved, "REQUEST_TERMINALIZATION").next;
  assert.throws(() => applyDispatchCommand(terminalized, "START_SEND"));
  const started = applyDispatchCommand(reserved, "START_SEND").next;
  assert.throws(() => applyDispatchCommand(started, "REQUEST_TERMINALIZATION"));
});

test("BIP-340 bindings and NIP-01 event IDs verify exact bytes", async () => {
  const secret = new Uint8Array(32); secret[31] = 7;
  const publicKey = Buffer.from(schnorr.getPublicKey(secret)).toString("hex");
  const payload = { schema: "steer-dispatch-ack/v1", intent: "intent-1", version: 1 };
  const digest = await sha256Hex(canonicalJson(payload));
  const signature = Buffer.from(schnorr.sign(Buffer.from(digest, "hex"), secret)).toString("hex");
  assert.equal(await verifySchnorrBinding(payload, signature, publicKey), true);
  assert.equal(await verifySchnorrBinding({ ...payload, version: 2 }, signature, publicKey), false);

  const unsigned = { pubkey: publicKey, created_at: 1_787_000_000, kind: 1, tags: [["d", "intent-1"]], content: "authorized" };
  const id = await sha256Hex(JSON.stringify([0, unsigned.pubkey, unsigned.created_at, unsigned.kind, unsigned.tags, unsigned.content]));
  const event = { ...unsigned, id, sig: Buffer.from(schnorr.sign(Buffer.from(id, "hex"), secret)).toString("hex") };
  assert.equal(await verifyNip01Event(event), true);
  assert.equal(await verifyNip01Event({ ...event, content: "tampered" }), false);
});
