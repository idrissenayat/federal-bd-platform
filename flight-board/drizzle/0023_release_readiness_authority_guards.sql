CREATE TRIGGER IF NOT EXISTS decision_readiness_snapshots_manifest_v2
BEFORE INSERT ON decision_readiness_snapshots WHEN
  json_extract(NEW.snapshot_json, '$.schema') != 'steer.gate-readiness-snapshot/v1' OR
  LENGTH(COALESCE(json_extract(NEW.snapshot_json, '$.brief_path'), '')) < 3 OR
  LENGTH(COALESCE(json_extract(NEW.snapshot_json, '$.exam_path'), '')) < 3 OR
  LENGTH(COALESCE(json_extract(NEW.snapshot_json, '$.critic_assignment_id'), '')) < 3 OR
  LENGTH(COALESCE(json_extract(NEW.snapshot_json, '$.risk_policy_sha256'), '')) != 64 OR
  LENGTH(COALESCE(json_extract(NEW.snapshot_json, '$.candidate_builder_id'), '')) < 2 OR
  LENGTH(COALESCE(json_extract(NEW.snapshot_json, '$.intended_submitter_id'), '')) < 2 OR
  json_extract(NEW.snapshot_json, '$.critic_review_id') != NEW.critic_review_id OR
  json_extract(NEW.snapshot_json, '$.evidence_set_sha256') != NEW.evidence_set_sha256 OR
  json_extract(NEW.snapshot_json, '$.tier') != NEW.tier OR
  json_extract(NEW.snapshot_json, '$.satisfaction_path') != NEW.satisfaction_path OR
  json_extract(NEW.snapshot_json, '$.effective_not_before') != NEW.effective_not_before
BEGIN SELECT RAISE(ABORT, 'complete readiness authority manifest is required'); END;

CREATE TRIGGER IF NOT EXISTS decision_intents_readiness_manifest_v4
BEFORE INSERT ON decision_intents WHEN NEW.readiness_snapshot_sha256 != '' AND (
  json_extract(NEW.intent_json, '$.readiness_snapshot_sha256') != NEW.readiness_snapshot_sha256 OR
  json_extract(NEW.intent_json, '$.readiness_authority.snapshot_sha256') != NEW.readiness_snapshot_sha256 OR
  LENGTH(COALESCE(json_extract(NEW.intent_json, '$.readiness_authority.risk_policy_sha256'), '')) != 64 OR
  LENGTH(COALESCE(json_extract(NEW.intent_json, '$.readiness_authority.candidate_builder_id'), '')) < 2 OR
  LENGTH(COALESCE(json_extract(NEW.intent_json, '$.readiness_authority.intended_submitter_id'), '')) < 2 OR
  json_extract(NEW.intent_json, '$.readiness_authority.intended_submitter_id') != NEW.submitter_id
)
BEGIN SELECT RAISE(ABORT, 'decision intent requires complete snapshot authority'); END;

CREATE TRIGGER IF NOT EXISTS decision_proof_events_readiness_manifest_v1
BEFORE INSERT ON decision_proof_events WHEN
  COALESCE((SELECT readiness_snapshot_sha256 FROM decision_intents WHERE intent_id = NEW.intent_id), '') != '' AND
  COALESCE(json_extract(NEW.event_json, '$.payload.readiness_authority.snapshot_sha256'), '') !=
    (SELECT readiness_snapshot_sha256 FROM decision_intents WHERE intent_id = NEW.intent_id)
BEGIN SELECT RAISE(ABORT, 'proof event readiness authority mismatch'); END;

CREATE TRIGGER IF NOT EXISTS decision_readiness_events_manifest_v1
BEFORE INSERT ON decision_readiness_events WHEN
  COALESCE(json_extract(NEW.event_json, '$.readiness_authority.snapshot_sha256'), '') !=
    COALESCE((SELECT snapshot_sha256 FROM decision_readiness_snapshots WHERE snapshot_id = NEW.snapshot_id),
             json_extract(NEW.event_json, '$.readiness_authority.snapshot_sha256'))
BEGIN SELECT RAISE(ABORT, 'readiness event authority mismatch'); END;

CREATE TRIGGER IF NOT EXISTS staging_verification_receipts_manifest_v2
BEFORE INSERT ON staging_verification_receipts WHEN
  json_extract(NEW.receipt_json, '$.schema') != 'steer.staging-verification-receipt/v1' OR
  LENGTH(COALESCE(json_extract(NEW.receipt_json, '$.brief_path'), '')) < 3 OR
  LENGTH(COALESCE(json_extract(NEW.receipt_json, '$.exam_path'), '')) < 3 OR
  LENGTH(COALESCE(json_extract(NEW.receipt_json, '$.candidate_builder_id'), '')) < 2 OR
  LENGTH(COALESCE(json_extract(NEW.receipt_json, '$.intended_submitter_id'), '')) < 2 OR
  json_extract(NEW.receipt_json, '$.source_revision') != NEW.source_revision OR
  json_extract(NEW.receipt_json, '$.build_sha256') != NEW.build_sha256 OR
  json_extract(NEW.receipt_json, '$.migration_set_sha256') != NEW.migration_set_sha256 OR
  json_extract(NEW.receipt_json, '$.runtime_policy_sha256') != NEW.runtime_policy_sha256
BEGIN SELECT RAISE(ABORT, 'verification receipt requires complete candidate authority'); END;
