CREATE TABLE `signals` (
	`signal_id` text PRIMARY KEY NOT NULL,
	`pod_id` text NOT NULL,
	`submitter_id` text NOT NULL,
	`original_text` text NOT NULL,
	`original_sha256` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`lifecycle_state` text NOT NULL,
	`current_proposal_version` integer DEFAULT 0 NOT NULL,
	`retention_delete_after` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_signals_pod_idempotency` ON `signals` (`pod_id`,`idempotency_key`);
--> statement-breakpoint
CREATE INDEX `idx_signals_pod_created` ON `signals` (`pod_id`,`created_at`);
--> statement-breakpoint
CREATE TABLE `signal_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`signal_id` text NOT NULL,
	`event_version` integer NOT NULL,
	`event_type` text NOT NULL,
	`actor_id` text NOT NULL,
	`detail_json` text NOT NULL,
	`previous_event_sha256` text,
	`event_sha256` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_signal_events_version` ON `signal_events` (`signal_id`,`event_version`);
--> statement-breakpoint
CREATE INDEX `idx_signal_events_created` ON `signal_events` (`signal_id`,`created_at`);
--> statement-breakpoint
CREATE TABLE `signal_proposals` (
	`proposal_id` text PRIMARY KEY NOT NULL,
	`signal_id` text NOT NULL,
	`version` integer NOT NULL,
	`proposal_json` text NOT NULL,
	`schema_version` text NOT NULL,
	`input_sha256` text NOT NULL,
	`output_sha256` text NOT NULL,
	`state` text NOT NULL,
	`confidence` text NOT NULL,
	`readiness_status` text NOT NULL,
	`provider` text NOT NULL,
	`model` text NOT NULL,
	`prompt_version` text NOT NULL,
	`implementation_revision` text NOT NULL,
	`supersedes_proposal_id` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_signal_proposals_version` ON `signal_proposals` (`signal_id`,`version`);
--> statement-breakpoint
CREATE INDEX `idx_signal_proposals_created` ON `signal_proposals` (`signal_id`,`created_at`);
--> statement-breakpoint
CREATE TABLE `signal_sources` (
	`source_id` text PRIMARY KEY NOT NULL,
	`signal_id` text NOT NULL,
	`proposal_id` text NOT NULL,
	`source_type` text NOT NULL,
	`source_reference` text NOT NULL,
	`revision` text,
	`sha256` text NOT NULL,
	`verification_state` text NOT NULL,
	`retrieved_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_signal_sources_proposal` ON `signal_sources` (`proposal_id`,`source_id`);
--> statement-breakpoint
CREATE TABLE `signal_generation_attempts` (
	`attempt_id` text PRIMARY KEY NOT NULL,
	`signal_id` text NOT NULL,
	`attempt_number` integer NOT NULL,
	`target_proposal_version` integer DEFAULT 1 NOT NULL,
	`provider` text NOT NULL,
	`model` text NOT NULL,
	`prompt_version` text NOT NULL,
	`state` text NOT NULL,
	`started_at` text NOT NULL,
	`completed_at` text,
	`input_tokens` integer,
	`output_tokens` integer,
	`estimated_cost_micros` integer,
	`error_code` text,
	`input_sha256` text NOT NULL,
	`output_sha256` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_signal_attempts_number` ON `signal_generation_attempts` (`signal_id`,`attempt_number`);
--> statement-breakpoint
CREATE INDEX `idx_signal_attempts_started` ON `signal_generation_attempts` (`signal_id`,`started_at`);
--> statement-breakpoint
CREATE TABLE `signal_rejections` (
	`rejection_id` text PRIMARY KEY NOT NULL,
	`pod_id` text NOT NULL,
	`actor_id` text NOT NULL,
	`reason_code` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_signal_rejections_pod_created` ON `signal_rejections` (`pod_id`,`created_at`);
--> statement-breakpoint
CREATE TRIGGER `signals_immutable_original` BEFORE UPDATE ON `signals` WHEN
	NEW.signal_id != OLD.signal_id OR NEW.pod_id != OLD.pod_id OR NEW.submitter_id != OLD.submitter_id OR
	NEW.original_text != OLD.original_text OR NEW.original_sha256 != OLD.original_sha256 OR
	NEW.idempotency_key != OLD.idempotency_key OR NEW.retention_delete_after != OLD.retention_delete_after OR
	NEW.created_at != OLD.created_at
BEGIN SELECT RAISE(ABORT, 'signal original and authority are immutable'); END;
--> statement-breakpoint
CREATE TRIGGER `signals_no_delete` BEFORE DELETE ON `signals`
BEGIN SELECT RAISE(ABORT, 'signals require the governed retention path'); END;
--> statement-breakpoint
CREATE TRIGGER `signal_events_no_update` BEFORE UPDATE ON `signal_events`
BEGIN SELECT RAISE(ABORT, 'signal events are append-only'); END;
--> statement-breakpoint
CREATE TRIGGER `signal_events_no_delete` BEFORE DELETE ON `signal_events`
BEGIN SELECT RAISE(ABORT, 'signal events require the governed retention path'); END;
--> statement-breakpoint
CREATE TRIGGER `signal_proposals_governed_state` BEFORE UPDATE ON `signal_proposals` WHEN
	NEW.proposal_id != OLD.proposal_id OR NEW.signal_id != OLD.signal_id OR NEW.version != OLD.version OR
	NEW.proposal_json != OLD.proposal_json OR NEW.schema_version != OLD.schema_version OR
	NEW.input_sha256 != OLD.input_sha256 OR NEW.output_sha256 != OLD.output_sha256 OR
	NEW.confidence != OLD.confidence OR NEW.readiness_status != OLD.readiness_status OR
	NEW.provider != OLD.provider OR NEW.model != OLD.model OR NEW.prompt_version != OLD.prompt_version OR
	NEW.implementation_revision != OLD.implementation_revision OR
	NEW.supersedes_proposal_id IS NOT OLD.supersedes_proposal_id OR NEW.created_at != OLD.created_at OR
	OLD.state != 'CURRENT' OR NEW.state != 'STALE'
BEGIN SELECT RAISE(ABORT, 'signal proposal content is immutable and only CURRENT to STALE is allowed'); END;
--> statement-breakpoint
CREATE TRIGGER `signal_proposals_no_delete` BEFORE DELETE ON `signal_proposals`
BEGIN SELECT RAISE(ABORT, 'signal proposals require the governed retention path'); END;
--> statement-breakpoint
CREATE TRIGGER `signal_sources_no_update` BEFORE UPDATE ON `signal_sources`
BEGIN SELECT RAISE(ABORT, 'signal sources are immutable'); END;
--> statement-breakpoint
CREATE TRIGGER `signal_sources_no_delete` BEFORE DELETE ON `signal_sources`
BEGIN SELECT RAISE(ABORT, 'signal sources require the governed retention path'); END;
