CREATE TABLE `agent_channel_memberships` (
	`pod_id` text NOT NULL,
	`channel_id` text NOT NULL,
	`member_id` text NOT NULL,
	`membership_version` integer NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_agent_channel_membership` ON `agent_channel_memberships` (`pod_id`,`channel_id`,`member_id`,`membership_version`);--> statement-breakpoint
CREATE INDEX `idx_agent_channel_membership_active` ON `agent_channel_memberships` (`pod_id`,`channel_id`,`member_id`,`status`);--> statement-breakpoint
CREATE TABLE `dispatch_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`intent_id` text NOT NULL,
	`event_version` integer NOT NULL,
	`event_type` text NOT NULL,
	`prior_state` text,
	`resulting_state` text,
	`payload_json` text NOT NULL,
	`actor_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_dispatch_events_intent_version` ON `dispatch_events` (`intent_id`,`event_version`);--> statement-breakpoint
CREATE INDEX `idx_dispatch_events_intent_created` ON `dispatch_events` (`intent_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `dispatch_outbox` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`intent_id` text NOT NULL,
	`receipt_id` text NOT NULL,
	`member_id` text NOT NULL,
	`channel_id` text NOT NULL,
	`channel_name` text NOT NULL,
	`status` text NOT NULL,
	`attempt_number` integer DEFAULT 0 NOT NULL,
	`last_error_code` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dispatch_outbox_intent_id_unique` ON `dispatch_outbox` (`intent_id`);--> statement-breakpoint
CREATE INDEX `idx_dispatch_outbox_status_created` ON `dispatch_outbox` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `dispatch_receipts` (
	`intent_id` text PRIMARY KEY NOT NULL,
	`lineage_id` text NOT NULL,
	`item_id` integer NOT NULL,
	`pod_id` text NOT NULL,
	`authorization_revision` text NOT NULL,
	`channel_id` text NOT NULL,
	`configuration_version` integer NOT NULL,
	`receipt_json` text NOT NULL,
	`created_at` text NOT NULL,
	`terminal_at` text,
	`delete_after` text
);
--> statement-breakpoint
CREATE INDEX `idx_dispatch_receipts_item_created` ON `dispatch_receipts` (`item_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_dispatch_receipts_lineage` ON `dispatch_receipts` (`lineage_id`);--> statement-breakpoint
CREATE TABLE `workspace_routing` (
	`pod_id` text NOT NULL,
	`route_key` text NOT NULL,
	`configuration_version` integer NOT NULL,
	`channel_id` text NOT NULL,
	`channel_name` text NOT NULL,
	`relay_url` text NOT NULL,
	`changed_by` text NOT NULL,
	`change_reason` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_workspace_routing_pod_key_version` ON `workspace_routing` (`pod_id`,`route_key`,`configuration_version`);--> statement-breakpoint
CREATE INDEX `idx_workspace_routing_active` ON `workspace_routing` (`pod_id`,`route_key`,`configuration_version`);--> statement-breakpoint
ALTER TABLE `members` ADD `agent_key_id` text;--> statement-breakpoint
ALTER TABLE `members` ADD `agent_key_version` integer;--> statement-breakpoint
ALTER TABLE `members` ADD `agent_public_key_fingerprint` text;