CREATE TABLE `dispatch_attempts` (
	`intent_id` text NOT NULL,
	`attempt_number` integer NOT NULL,
	`lease_id` text NOT NULL,
	`lease_expires_at` text NOT NULL,
	`reservation_fence` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_dispatch_attempts_intent_number` ON `dispatch_attempts` (`intent_id`,`attempt_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_dispatch_attempts_fence` ON `dispatch_attempts` (`reservation_fence`);--> statement-breakpoint
CREATE INDEX `idx_dispatch_attempts_intent_status` ON `dispatch_attempts` (`intent_id`,`status`);--> statement-breakpoint
CREATE TABLE `dispatch_event_signers` (
	`pod_id` text NOT NULL,
	`registry_version` integer NOT NULL,
	`service_role` text NOT NULL,
	`allowed_event_types_json` text NOT NULL,
	`key_id` text NOT NULL,
	`key_version` integer NOT NULL,
	`public_key` text NOT NULL,
	`valid_from` text NOT NULL,
	`valid_until` text,
	`status` text NOT NULL,
	`changed_by` text NOT NULL,
	`change_reason` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_dispatch_event_signers_key_version` ON `dispatch_event_signers` (`pod_id`,`key_id`,`key_version`);--> statement-breakpoint
CREATE INDEX `idx_dispatch_event_signers_active` ON `dispatch_event_signers` (`pod_id`,`service_role`,`status`);--> statement-breakpoint
CREATE TABLE `relay_event_signers` (
	`pod_id` text NOT NULL,
	`registry_version` integer NOT NULL,
	`relay_url` text NOT NULL,
	`channel_id` text NOT NULL,
	`key_id` text NOT NULL,
	`key_version` integer NOT NULL,
	`public_key` text NOT NULL,
	`valid_from` text NOT NULL,
	`valid_until` text,
	`status` text NOT NULL,
	`changed_by` text NOT NULL,
	`change_reason` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_relay_event_signers_key_version` ON `relay_event_signers` (`pod_id`,`key_id`,`key_version`);--> statement-breakpoint
CREATE INDEX `idx_relay_event_signers_active` ON `relay_event_signers` (`pod_id`,`relay_url`,`channel_id`,`status`);--> statement-breakpoint
ALTER TABLE `dispatch_events` ADD `expected_event_version` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `dispatch_events` ADD `previous_event_sha256` text;--> statement-breakpoint
ALTER TABLE `dispatch_events` ADD `event_sha256` text NOT NULL;--> statement-breakpoint
ALTER TABLE `dispatch_events` ADD `service_key_id` text NOT NULL;--> statement-breakpoint
ALTER TABLE `dispatch_events` ADD `service_key_version` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `dispatch_events` ADD `service_signature` text NOT NULL;--> statement-breakpoint
ALTER TABLE `dispatch_events` ADD `agent_key_id` text;--> statement-breakpoint
ALTER TABLE `dispatch_events` ADD `agent_key_version` integer;--> statement-breakpoint
ALTER TABLE `dispatch_events` ADD `agent_signature` text;--> statement-breakpoint
ALTER TABLE `dispatch_events` ADD `acknowledgement_sha256` text;--> statement-breakpoint
ALTER TABLE `dispatch_outbox` ADD `current_state` text DEFAULT 'QUEUED' NOT NULL;--> statement-breakpoint
ALTER TABLE `dispatch_outbox` ADD `current_event_version` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `dispatch_outbox` ADD `current_event_sha256` text NOT NULL;--> statement-breakpoint
ALTER TABLE `dispatch_outbox` ADD `lease_id` text;--> statement-breakpoint
ALTER TABLE `dispatch_outbox` ADD `lease_expires_at` text;--> statement-breakpoint
ALTER TABLE `dispatch_outbox` ADD `reservation_fence` text;--> statement-breakpoint
ALTER TABLE `dispatch_outbox` ADD `send_started` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `dispatch_outbox` ADD `reconciliation_required` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `dispatch_outbox` ADD `terminalization_requested` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `dispatch_outbox` ADD `relay_url` text NOT NULL;--> statement-breakpoint
ALTER TABLE `dispatch_outbox` ADD `routing_configuration_version` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `dispatch_outbox` ADD `delivered_event_id` text;--> statement-breakpoint
ALTER TABLE `dispatch_outbox` ADD `accepted_acknowledgement_sha256` text;