# Approved source register

Only sources listed here may create or materially enrich an opportunity. A source adapter must preserve raw evidence and pass its source-specific exam before activation.

## Source tiers

| Source | Authority and use | MVP status | Interface and constraints |
|---|---|---|---|
| SAM.gov Contract Opportunities | Primary official source for live federal procurement notices | `ACTIVE-FIRST` | Public Opportunities API v2; personal API key required; paginated; latest active version only; active records update daily and archived data weekly |
| USAspending.gov | Official historical award and transaction context | `ACTIVE-ENRICHMENT` | Public REST API; never treated as the source of a live solicitation |
| Acquisition.gov agency procurement forecasts | Official index of anticipated agency procurements | `PILOT-LATER` | Agency links are heterogeneous; preserve agency page and retrieval evidence; forecasts are signals, not solicitations |
| SBA SUBNet | Official SBA listing for subcontracting opportunities | `PILOT-LATER` | Public browse interface; no stable API is assumed; connector needs legal/technical review and conservative polling |
| SAM.gov Contract Awards API | Official contract/IDV award detail | `EVALUATE-LATER` | API key required; public DoD data may have a 90-day reveal delay; overlap with USAspending must be reconciled |

## Disallowed by default

- Reposting sites and opportunity aggregators as factual systems of record.
- Search-engine snippets.
- Social media posts.
- Model-generated or inferred notices.
- Arbitrary agency-site scraping without an approved source entry and adapter exam.

A disallowed source may provide a discovery hint, but the record cannot enter `DECISION_REVIEW` until an approved official source corroborates every material fact.

## Provenance contract

Every fetched record stores:

- Source name and adapter version.
- Canonical source URL and source record identifier.
- Retrieval time in UTC.
- Effective/published/updated times as reported by the source.
- Request parameters, excluding secrets.
- HTTP status and content type.
- Raw response or attachment in immutable storage.
- SHA-256 digest of every raw object.
- Parser version and normalized-record revision.
- Parent/related notice identifiers and revision lineage where available.

Every material analysis claim stores one or more evidence references containing the raw-object digest, a JSON pointer or document page/section, and a short verbatim-safe excerpt or normalized value.

## SAM.gov adapter rules

1. Poll incrementally by a recorded window with overlap; deduplicate by notice ID plus content digest.
2. Follow pagination until the reported total is exhausted.
3. Treat the public API's latest-active-version behavior as a limitation. Preserve every retrieved representation locally so changes can be reconstructed from polling history.
4. Never log or persist the API key in request evidence.
5. Rate-limit below the account allowance and back off on `429` or transient failures.
6. Mark a record stale when the source has not been successfully checked within its configured SLA.
7. Quarantine attachments until malware scanning and safe text extraction complete.

## Source activation gate

A source remains disabled until fixtures demonstrate pagination, retry behavior, deduplication, revision detection, provenance completeness, secret redaction, schema-drift handling, and a fail-closed response to ambiguous or malformed data.

## Official references

- SAM.gov public Opportunities API: https://open.gsa.gov/api/get-opportunities-public-api/
- SAM.gov Contract Opportunities: https://sam.gov/opportunities
- USAspending API project: https://github.com/fedspendingtransparency/usaspending-api
- Acquisition.gov forecasts: https://www.acquisition.gov/procurement-forecasts
- SBA SUBNet: https://www.sba.gov/federal-contracting/contracting-guide/prime-subcontracting/subcontracting-opportunities

