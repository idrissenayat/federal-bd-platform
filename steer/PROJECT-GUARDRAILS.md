# Project guardrails

| ID | Rule | Enforcement target |
|---|---|---|
| SRC-01 | A material opportunity fact requires resolvable official-source evidence | Schema + analysis tests |
| SRC-02 | Raw source objects are immutable and SHA-256 addressed | Storage tests |
| SRC-03 | Search snippets, aggregators and model output cannot be a system of record | Source allowlist |
| SRC-04 | SAM.gov API keys and other secrets never enter logs, evidence, prompts or fixtures | Secret scan + redaction tests |
| REV-01 | Every fetched representation is retained so revisions can be reconstructed | Ingestion tests |
| REV-02 | Deadline, status, set-aside, scope or attachment changes trigger re-analysis | Change-detection tests |
| ATT-01 | Attachments remain quarantined until malware scanning and safe extraction pass | Pipeline state guard |
| AI-01 | A model may not infer a hard-gate pass from missing company or source facts | Decision-engine tests |
| AI-02 | Recommendation output includes citations, confidence, unknowns and assumptions | Output schema |
| AI-03 | Prompt/model/implementation identifiers and input revisions are recorded | Audit schema |
| HUM-01 | Only an authenticated human may move `DECISION_REVIEW` to `CAPTURE`, `MONITOR` or `ARCHIVED` | Authorization + database constraint |
| HUM-02 | An override records a reason; the original recommendation remains immutable | Decision audit tests |
| DATA-01 | MVP accepts public, unclassified data only | UI warning + ingestion policy |
| DATA-02 | Tenant-scoped company profiles, past performance and decisions never cross organization boundaries | Authorization tests |
| EXT-01 | No recommendation automatically sends email, submits a response or contacts a government party | Capability boundary |
| PILOT-01 | Rubric weights and thresholds are frozen during the pilot except through a logged defect decision | Configuration versioning |

