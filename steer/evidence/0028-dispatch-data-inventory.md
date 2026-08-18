# STR-028 dispatch and review data inventory

Status: approved implementation inventory; provider-recovery ruling recorded 2026-08-18
Controller/workspace: STEER Flight Team POD  
System owner: Platform / Ops Lead  
Policy owner: Privacy / Legal with Security Owner review  
Terminal retention: 90 days unless an explicit scoped, time-bounded hold is active

## Purpose and minimization

These records exist only to enforce authenticated human authorization, exact agent and
route bindings, one-run/idempotency control, delivery reconciliation, signed
acknowledgement, security investigation, and bounded reliability measurement. Routine
logs and telemetry must not contain work-item IDs, actor/member IDs, key material,
authorization or scope text, display names, email addresses, message bodies, evidence
URLs, or arbitrary error text.

| Store / fields | Personal-data class | Purpose and source | Access / owner | Retention and deletion |
|---|---|---|---|---|
| `dispatch_receipts`: POD/item/member stable IDs, actor ID, agent and relay-publisher public key ID/version/public key, route/config/membership/publisher-registry versions, evidence revision/digest, action/message digests, authorization fields | Public cryptographic identity plus pseudonymous identity and authorization data | Server snapshot of the authenticated human authorization, approved immutable evidence, and exact publisher trust binding | Same-POD human UI; exact enrolled-agent signed read; Platform / Ops | Immutable while active. Eligible 90 days after terminal ledger state. Governed cascade deletes receipt and all intent-linked rows unless a live hold exists. |
| `dispatch_authorization_audits`: audit ID, intent/item/POD/actor IDs, material authorization JSON | Pseudonymous identity and authorization data | Durable resolution of the receipt's human authorization reference | Exact enrolled-agent signed read; Platform / Ops | Same intent lifecycle and cascade as receipt. Update and ordinary delete are blocked. |
| `dispatch_outbox`: intent/member/channel IDs, state/version/hash, lease/fence, relay binding, delivery/ack digests, typed error code | Pseudonymous operational data | One external-delivery identity, CAS projection, retry/reconciliation control | Dispatch service; same-POD UI exposes bounded state only | Same intent lifecycle and cascade. Mutable only as a rebuildable projection; ledger remains authority. |
| `dispatch_attempts`: intent, attempt, lease/fence, bounded status/timestamps | Pseudonymous operational data | Prevent duplicate attempts and serialize external send | Dispatch and reconciliation services | Same intent lifecycle and cascade. |
| `dispatch_events`: signed envelope, service/agent key references and signatures, actor/service stable ID, typed payload and hashes | Pseudonymous identity, security, and provenance data | Append-only lifecycle, acknowledgement, and diagnostic authority | Exact enrolled-agent signed read; Platform / Ops and Security investigation | Same intent lifecycle and cascade. Update and ordinary delete are blocked. |
| `dispatch_event_signers` and `relay_event_signers`: public keys, key IDs/versions, validity/status and change authority | Public cryptographic identity plus pseudonymous change authority | Verify service and relay event provenance under audited versions | Tech Lead and Security; read by authorization/delivery services | Retained as security configuration evidence; never contains private keys. Rotation is append-only. |
| `workspace_routing`, `buzz_channel_registry`, and `agent_channel_memberships`: POD/channel/member IDs, route and membership versions, relay URL, status, change authority | Pseudonymous membership and configuration data | Resolve the one audited dispatch route and prove assigned-agent channel membership | Tech Lead; read by authorization/delivery services | Retained as append-only configuration evidence. Superseding versions do not rewrite prior authority. |
| `workspace_routing_conflicts`: POD/route key, random conflict ID, bounded source kind, one-way source-reference digest, status, detector/resolver stable IDs and timestamps | Pseudonymous change authority; source content is not retained | Fail closed when an environment, legacy integration, or other source competes with the audited route | Tech Lead and Security; read by authorization service | Retained as append-only security configuration evidence. Resolution adds bounded authority/timing fields; no source payload is stored. |
| `dispatch_security_diagnostics` and `steer_telemetry`: typed bounded code/metric, configuration version, case ID, bounded label/value, timestamp | Non-identifying operational data | Prove fail-closed routing and bounded reliability outcomes without user, item, message, or evidence labels | Platform / Ops and Security | Operational evidence only; arbitrary fields and labels are rejected. |
| `dispatch_retention_holds`: intent/actor ID, bounded reason code, action, expiry | Pseudonymous legal/security control | Prevent deletion during an approved investigation or legal obligation | Tech, Platform / Ops, or Security authority in same POD | Append-only HOLD/RELEASE events. Holds require an explicit expiry no more than 365 days away; deleted with the eligible intent after release/expiry. |
| `dispatch_retention_runs`: cutoff, eligible count, deleted count, timestamp | Non-identifying aggregate | Prove the deletion job ran without retaining deleted identity | Platform / Ops | Operational evidence; no intent or actor labels. |
| `notifications` row keyed by `dispatch-<intent>` | Pseudonymous assignment plus message body | Human-visible copy of the authorized handoff | Same-POD UI | Deleted by the same governed intent cascade. |
| `review_assignments`: assignment/item/POD/member IDs, target manifest digest, item revision, authorization IDs, signed current-state projection, timestamps | Pseudonymous identity, authorization, and provenance data | Immutable assignment binding between one primary-owner claim lineage and one independent reviewer | Same-POD human UI; exact enrolled reviewer; Platform / Ops | Eligible 90 days after terminal review state. Governed review-retention deletion removes the assignment and every assignment-linked identity record unless a live hold exists. |
| `review_events`: assignment ID, event version/hash chain, bounded payload, service/reviewer public-key references and signatures, actor ID, timestamp | Pseudonymous identity, security, and provenance data | Append-only authority for assignment, acknowledgement, and one terminal review result | Exact enrolled reviewer signed write/read; same-POD bounded UI; Platform / Ops and Security investigation | Same review-assignment lifecycle. Updates and ordinary deletes are blocked. |
| `review_retention_holds`: assignment/actor IDs, bounded action/reason, expiry, timestamp | Pseudonymous legal/security control | Prevent deletion during an approved investigation or legal obligation | Named same-POD Tech, Platform / Ops, or Security authority | Append-only HOLD/RELEASE events with explicit expiry of at most 365 days; removed with the eligible assignment after release/expiry. |
| `review_retention_authorizations`: assignment ID, one-time nonce, short expiry | Pseudonymous transient deletion capability | Allows only the governed review-retention job to cross database delete triggers | Review retention service only | Created immediately before the governed batch and deleted in the same batch; never exposed to UI or logs. |
| `review_retention_runs`: cutoff, eligible/deleted counts, timestamp | Non-identifying aggregate | Prove the review deletion job ran without retaining deleted identity | Platform / Ops | Operational evidence only; contains no assignment, item, actor, or reviewer labels. |
| `agent_reviews.review_assignment_id`, `activity.review_assignment_id`, and `notifications.review_assignment_id` | Pseudonymous relationship and bounded human-visible result data | Link the rendered review and its activity/notification projections to the signed assignment authority | Same-POD UI | Deleted by the same governed review-assignment cascade. Legacy rows without a signed assignment remain governed by the pre-existing work-item lifecycle and are not eligible through this cascade. |
| `dispatch_privacy_policies`: POD, immutable policy version/status, inventory and ruling URL/digests, 90/30-day values, named authority role/actor, authorization event, idempotency key, receipt digest, reason, timestamp | Pseudonymous change authority and policy provenance | Bind dispatch and review authorization to the exact approved inventory and provider-recovery ruling | Named same-POD Privacy, Security, or combined Product/Tech authority; read by dispatch/review authorization | Append-only policy versions. Updates/deletes are blocked. Contains no work-item, message, email, or free-form user content. |

Private keys and bearer credentials are environment secrets only. They are not stored
in D1, returned by an API, written to activity, emitted in errors, or placed in this
inventory. Public x-only keys and signatures are necessary provenance, not secrets.

## Executable controls

- Receipt, authorization audit, and event updates are rejected by database triggers.
- Ordinary deletion of those tables is rejected unless a short-lived, intent-specific
  `dispatch_retention_authorizations` row exists.
- `POST /api/dispatch-retention/run` requires the dispatch-service bearer credential,
  selects only terminal records older than 90 days with no active unreleased hold,
  deletes the intent-linked receipt, audit, event, attempt, outbox, notification, hold,
  and transient authorization rows in one D1 batch, and retains only aggregate counts.
- `POST /api/dispatches/<intent>/retention-holds` requires a named same-POD Tech,
  Platform / Ops, or Security human. Free-text reasons are rejected; only bounded
  reason codes and explicit expiries are stored.
- `POST /api/review-retention/run` applies the same 90-day terminal-age rule to signed
  review assignments and atomically deletes assignment, signed events, linked review,
  activity, notification, hold, and transient authorization rows when no live hold exists.
- `POST /api/review-assignments/<assignment>/retention-holds` uses the same named-role,
  bounded-reason, explicit-expiry control as dispatch holds.
- `POST /api/privacy-policy/activate` requires a named authenticated human in the same
  POD with Privacy, Security, or combined Product Lead and Tech Lead authority. It uses
  expected-version compare-and-swap plus an idempotency key, resolves both immutable
  GitHub artifacts and exact SHA-256 digests, and appends—never updates—one `ACTIVE`
  90/30 policy version with a deterministic authorization event and receipt digest.
- Synthetic integration coverage proves hold, release, deletion, trigger enforcement,
  removal of the identity-linked receipt/event/audit and review-lifecycle rows, and
  fail-closed policy activation for unauthorized, stale, replay-mismatched, missing,
  or contradictory requests.

## Replica and backup boundary

The app has one Sites D1 binding and does not create an R2 export or application
replica. Cloudflare D1 Time Travel is always-on provider recovery history. Cloudflare's
current documentation states that paid D1 databases can be restored up to 30 days in
the past (7 days on the free plan), and it exposes whole-database restore rather than
per-row purge: <https://developers.cloudflare.com/d1/reference/time-travel/>.

The Product Lead and interim Tech Lead approved the provider-recovery boundary on
2026-08-18: eligible live identity-linked records are deleted after 90 days; Cloudflare-
managed Time Travel history may remain only for the configured recovery window, up to
30 days; recovery access is restricted; and restored data remains subject to the same
deletion and hold controls. The exact ruling is retained in the immutable STR-028 Gate 3
evidence artifact and is bound by URL and SHA-256 in every `ACTIVE` policy version.

Live-row deletion is not described as immediate provider-history deletion. Platform / Ops
restricts D1 restore capability to authorized recovery operators. After any Time Travel
restore, the operator must keep dispatch and review writes closed, run both governed
retention jobs against the restored database, verify aggregate eligible/deleted counts and
active holds, then reopen writes only after the latest immutable `ACTIVE` 90/30 policy and
its exact inventory/ruling digests validate. A restore does not reset retention age, release
a hold, create a new legal basis, or make an otherwise expired identity record eligible for
continued live use.

## No-PII logging contract

Allowed operational fields are metric name, one bounded outcome/result/severity label,
duration or count, deployment environment, and UTC time. Error responses use typed
codes. Application logging of request bodies, handoff content, receipt JSON, signatures,
keys, user headers, or raw exception payloads is prohibited. A telemetry label or error
field outside the allowlist must fail closed rather than be recorded.
