-- Forward-compatible code rollback guard for issue #74.
-- The previous application version ignores the retained readiness tables. This
-- guard is intentionally read-only: it proves that legacy decisions remain
-- present and that every pending readiness-bound intent remains ineffective.
SELECT COUNT(*) AS legacy_decision_count
FROM decisions
WHERE decision_intent_id IS NULL
   OR decision_intent_id IN (SELECT intent_id FROM decision_intents WHERE readiness_snapshot_sha256 = '');

SELECT COUNT(*) AS ineffective_readiness_intent_count
FROM decision_intents
WHERE readiness_snapshot_sha256 != ''
  AND current_state != 'EFFECTIVE';

SELECT COUNT(*) AS invalid_gate_effect_count
FROM decisions d
JOIN decision_intents i ON i.intent_id = d.decision_intent_id
WHERE i.readiness_snapshot_sha256 != ''
  AND i.current_state != 'EFFECTIVE';
