# Security policy

## Supported scope

This pre-release project accepts public, unclassified information and synthetic test data
only. Production security support begins when a production environment exists; until
then, every security finding applies to the current `main` branch.

## Reporting

Use a private GitHub Security Advisory for a vulnerability or suspected credential
exposure. Do not place exploit details, keys, private contractor information, or source
attachments in a public issue or Discussion. For non-sensitive reliability defects, use
the defect issue form.

## Credential handling

- Keep SAM.gov and model-provider keys in local ignored environment files or the GitHub
  Actions secret store.
- Never paste a credential into an agent prompt, brief, exam, log, fixture, issue, PR, or
  Discussion.
- If exposure is suspected, revoke first, then investigate and rotate.

## Data boundary

Do not ingest or upload CUI, FCI, export-controlled, proprietary proposal, or classified
material. Attachments are hostile input and remain quarantined until the signed brief and
exam prove scanning and safe extraction controls.
