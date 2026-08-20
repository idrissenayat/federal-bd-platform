CREATE TABLE IF NOT EXISTS staging_readiness_case_results (
  run_id text NOT NULL,
  case_id text NOT NULL,
  request_json text NOT NULL,
  request_sha256 text NOT NULL,
  response_json text NOT NULL,
  response_sha256 text NOT NULL,
  service_signature text NOT NULL,
  created_at text NOT NULL,
  PRIMARY KEY(run_id, case_id)
);

CREATE INDEX IF NOT EXISTS idx_staging_readiness_case_results_created
  ON staging_readiness_case_results (run_id, created_at);

CREATE TRIGGER IF NOT EXISTS staging_readiness_case_results_no_update
  BEFORE UPDATE ON staging_readiness_case_results
  BEGIN SELECT RAISE(ABORT, 'staging readiness case results are immutable'); END;

CREATE TRIGGER IF NOT EXISTS staging_readiness_case_results_no_delete
  BEFORE DELETE ON staging_readiness_case_results
  BEGIN SELECT RAISE(ABORT, 'staging readiness case results require governed retention'); END;
