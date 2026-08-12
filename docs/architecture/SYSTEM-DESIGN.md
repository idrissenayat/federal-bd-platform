# System design

## Architectural objective

Make every recommendation reproducible from preserved official evidence, a versioned contractor profile, a frozen rubric revision, and a recorded analysis implementation.

## Logical flow

```text
Official source adapters
        ↓
Immutable evidence store ──→ quarantine/scanning for attachments
        ↓
Normalizer + revision/deduplication engine
        ↓
Opportunity database ──→ official award/forecast enrichment
        ↓
Eligibility rules → fit score → evidence-backed narrative
        ↓
Recommendation package: BID / NO_BID / REVIEW
        ↓
Authenticated human decision
        ↓
Capture record / Monitor / No-bid archive
```

## Minimum implementation

- **Application/API:** Python 3.12 with FastAPI and Pydantic contracts.
- **Database:** PostgreSQL 16; relational records are authoritative. Semantic retrieval may be added only after baseline provenance tests pass.
- **Workers:** One Python ingestion/analysis worker initially. Add a queue only when measured volume or retry isolation requires it.
- **Evidence objects:** Filesystem in local development behind an object-store interface; versioned S3-compatible storage in deployed environments.
- **Web application:** A thin analyst review interface after the source tracer works. It must display citations, unknowns, hard gates, score components, source freshness, and profile/rubric revisions.
- **Authentication:** Organization-scoped identities and role-based approval. The MVP cannot use anonymous approvals.

These choices are provisional architecture decisions, not a commitment to a particular cloud.

## Core records

### Source object

Immutable bytes plus digest, canonical URL, source record ID, retrieval metadata, and adapter version.

### Opportunity

Canonical record linked to all source objects and revisions. It includes notice identifiers, agency hierarchy, notice type, status, dates, NAICS/PSC, set-aside, place of performance, description, contacts, attachment metadata, and related notices.

### Contractor profile revision

Versioned eligibility, capability, past-performance, vehicle, capacity, strategy, and exclusion facts. A recommendation never reads an unversioned "current" profile without recording the resolved revision.

### Recommendation

Hard-gate results, factor scores, citations, unknowns, assumptions, rubric revision, profile revision, analysis implementation/model identifier, confidence, and generated time.

### Human decision

Authenticated actor, recommendation reviewed, decision, rationale, override reason, timestamp, and resulting state transition.

## Trust boundaries

1. **Internet boundary:** all fetched content is untrusted; attachments enter quarantine.
2. **Evidence boundary:** raw objects are immutable; normalized data never overwrites evidence.
3. **Model boundary:** models may extract and synthesize but cannot create source facts, alter evidence, satisfy hard gates through inference, or advance a decision state.
4. **Organization boundary:** contractor profiles, past performance, and decisions are tenant-scoped.
5. **External-action boundary:** no email, submission, download to a third party, or government-system write is authorized by a bid recommendation.

## Explainability requirement

A reviewer must be able to open any score or material sentence and reach the exact source evidence or contractor-profile fact supporting it. If a source is missing, stale, contradictory, or ambiguous, the product labels the unknown and lowers confidence rather than filling the gap.

## Change detection

The platform compares content digests and normalized high-value fields. A change to response date, status, set-aside, NAICS/PSC, place of performance, description, attachment list, or related-notice linkage creates a new opportunity revision and triggers re-analysis. High-impact changes generate a human-visible alert.

## Failure posture

- Source unavailable: retain the last evidence, mark freshness failure, retry with backoff, and block "fresh" claims.
- Schema drift: quarantine the record and alert; do not silently discard fields.
- Analysis unavailable: retain normalized opportunity and route to manual review.
- Contradictory sources: prefer the live-notice official source for current facts, show the conflict, and require review.
- Missing contractor fact: return `REVIEW` when the fact affects a hard gate.

