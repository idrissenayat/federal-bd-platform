# Domain contracts

This package will hold source-independent records shared by ingestion, analysis, API, and web layers.

The first implementation must define and version:

- `SourceObject`
- `Opportunity` and `OpportunityRevision`
- `EvidenceReference`
- `ContractorProfileRevision`
- `EligibilityGateResult`
- `Recommendation`
- `HumanDecision`
- `PipelineTransition`
- `PilotLedgerEntry`

Contracts must distinguish source facts, contractor-profile facts, deterministic calculations, model-generated synthesis, and human judgment. An absent value is never represented as a guessed value.

