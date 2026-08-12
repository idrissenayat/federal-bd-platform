# Buzz integration boundary

This directory versions the configuration contract between STEER and Buzz. It contains
no credentials and does not make the older Buzz Scrum pilot authoritative.

## Target topology

```text
humans + uniquely identified agents
                 |
                 v
          Buzz communication
          /        |         \
         v         v          v
 GitHub /steer  OpenProject   XWiki
  authority       mirror     read copy
```

- GitHub and `/steer` own work, code, contracts, gates, evidence, and decisions.
- Buzz owns room membership, messages, routing, and communication audit events.
- OpenProject may mirror coordination state. It must not overwrite GitHub state during
  the pilot.
- XWiki may publish onboarding copies. Every page must show its repository source and
  commit SHA; the repository wins on disagreement.

`agent-roster.yaml` is the non-secret desired-state manifest. Provisioning automation
must be idempotent, emit no credentials, preserve the existing `Agentic End2End SDLC`
project, and target a distinct `STEER Federal BD Platform` workspace.

`provision_openproject.rb` implements the B0 workspace boundary. It creates no API token
and does not make an agent operational; credential issuance and positive/negative B1
tests remain separate, reviewable actions.

## Implementation order

1. Preserve the existing Buzz prototype as a tagged or committed baseline in its own
   repository after its current untracked files are reviewed by their owner.
2. Provision the separate STEER workspace and unique minimum-fleet identities.
3. Add authenticated sessions, workspace/channel membership, and append-only message
   events to Buzz; remove fake seed data from the STEER workspace only.
4. Add read-only GitHub artifact unfurling, then an idempotent coordination projection.
5. Publish revision-labelled onboarding pages to XWiki.
6. Execute B1 negative and positive proofs before declaring Buzz the default huddle.

The local Buzz UI is intentionally not modified from this repository. Its current
working tree contains unversioned prior work, so preserving that baseline is a
prerequisite to adaptation.
