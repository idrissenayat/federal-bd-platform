# STR-028 dispatch and review data inventory

Status: implementation evidence; Privacy/Security ruling still required before Gate 3  
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
| `agent_reviews` and their current activity/notification records | Pseudonymous reviewer/requester identity and evidence metadata | Existing synchronous review result and UI history | Same-POD UI | Not yet connected to the new intent-level cascade. The required signed assignment/acknowledgement/result lifecycle remains a release blocker and is consolidated with the hosted-agent integration dependency. |

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
- Synthetic integration coverage proves hold, release, deletion, trigger enforcement,
  and removal of the identity-linked receipt/event/audit rows.

## Replica and backup boundary

The app has one Sites D1 binding and does not create an R2 export or application
replica. Cloudflare D1 Time Travel is always-on provider recovery history. Cloudflare's
current documentation states that paid D1 databases can be restored up to 30 days in
the past (7 days on the free plan), and it exposes whole-database restore rather than
per-row purge: <https://developers.cloudflare.com/d1/reference/time-travel/>.

Therefore the current governed row deletion at terminal day 90 removes live D1 rows but
cannot prove that the same bytes are immediately absent from provider Time Travel.
They may remain recoverable until the provider recovery window expires. This is an
explicit Gate 3 blocker under the signed Exam. Resolve it by either:

1. adding per-intent cryptographic erasure with keys outside D1 and rehearsing deletion
   across live data and provider recovery, or
2. obtaining an authenticated Privacy/Security ruling that defines and accepts the
   provider recovery window as part of the deletion SLA and updates the signed policy.

No implementation or review may describe live-row deletion alone as backup deletion.

## No-PII logging contract

Allowed operational fields are metric name, one bounded outcome/result/severity label,
duration or count, deployment environment, and UTC time. Error responses use typed
codes. Application logging of request bodies, handoff content, receipt JSON, signatures,
keys, user headers, or raw exception payloads is prohibited. A telemetry label or error
field outside the allowlist must fail closed rather than be recorded.
