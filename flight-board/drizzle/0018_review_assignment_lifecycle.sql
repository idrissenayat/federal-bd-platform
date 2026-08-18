CREATE TABLE `review_assignments` (
	`assignment_id` text PRIMARY KEY NOT NULL,
	`idempotency_key` text NOT NULL,
	`item_id` integer NOT NULL,
	`pod_id` text NOT NULL,
	`review_stage` text NOT NULL,
	`reviewer_member_id` text NOT NULL,
	`primary_claim_lineage_id` text NOT NULL,
	`item_revision` text NOT NULL,
	`target_manifest_sha256` text NOT NULL,
	`assignment_json` text NOT NULL,
	`current_state` text NOT NULL,
	`current_event_version` integer NOT NULL,
	`current_event_sha256` text NOT NULL,
	`authorizing_actor_id` text NOT NULL,
	`authorizing_event_id` text NOT NULL,
	`created_at` text NOT NULL,
	`terminal_at` text,
	`delete_after` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_review_assignments_idempotency` ON `review_assignments` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `idx_review_assignments_item_created` ON `review_assignments` (`item_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `review_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`assignment_id` text NOT NULL,
	`event_version` integer NOT NULL,
	`expected_event_version` integer NOT NULL,
	`event_type` text NOT NULL,
	`payload_json` text NOT NULL,
	`previous_event_sha256` text,
	`event_sha256` text NOT NULL,
	`service_key_id` text NOT NULL,
	`service_key_version` integer NOT NULL,
	`service_signature` text NOT NULL,
	`reviewer_key_id` text,
	`reviewer_key_version` integer,
	`reviewer_signature` text,
	`actor_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_review_events_assignment_version` ON `review_events` (`assignment_id`,`event_version`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_review_events_one_ack` ON `review_events` (`assignment_id`) WHERE `event_type` = 'REVIEW_ACKNOWLEDGED';--> statement-breakpoint
CREATE UNIQUE INDEX `uq_review_events_one_result` ON `review_events` (`assignment_id`) WHERE `event_type` = 'REVIEW_RESULT_RECORDED';--> statement-breakpoint
CREATE INDEX `idx_review_events_assignment_created` ON `review_events` (`assignment_id`,`created_at`);
--> statement-breakpoint
ALTER TABLE `agent_reviews` ADD `review_assignment_id` text;--> statement-breakpoint
ALTER TABLE `activity` ADD `review_assignment_id` text;--> statement-breakpoint
ALTER TABLE `notifications` ADD `review_assignment_id` text;--> statement-breakpoint
CREATE TABLE `review_retention_holds` (
	`hold_event_id` text PRIMARY KEY NOT NULL,
	`assignment_id` text NOT NULL,
	`action` text NOT NULL,
	`reason_code` text NOT NULL,
	`expires_at` text NOT NULL,
	`actor_id` text NOT NULL,
	`created_at` text NOT NULL
);--> statement-breakpoint
CREATE INDEX `idx_review_retention_holds_assignment_created` ON `review_retention_holds` (`assignment_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `review_retention_authorizations` (
	`assignment_id` text PRIMARY KEY NOT NULL,
	`authorization_nonce` text NOT NULL,
	`expires_at` text NOT NULL
);--> statement-breakpoint
CREATE TABLE `review_retention_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cutoff_at` text NOT NULL,
	`eligible_count` integer NOT NULL,
	`deleted_count` integer NOT NULL,
	`created_at` text NOT NULL
);
