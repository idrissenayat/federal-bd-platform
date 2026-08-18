CREATE TABLE `work_economics_agent_facts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` integer NOT NULL,
	`record_kind` text NOT NULL,
	`event_id` text NOT NULL,
	`provider` text NOT NULL,
	`model` text,
	`attempts` integer NOT NULL,
	`input_tokens` integer,
	`output_tokens` integer,
	`min_cost_micros` integer,
	`max_cost_micros` integer,
	`metered_cost_micros` integer,
	`currency` text NOT NULL,
	`execution_seconds` integer,
	`source` text NOT NULL,
	`completeness` text NOT NULL,
	`ingestion_state` text NOT NULL,
	`observed_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_work_economics_agent_item_kind` ON `work_economics_agent_facts` (`item_id`,`record_kind`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_work_economics_agent_item_kind_event` ON `work_economics_agent_facts` (`item_id`,`record_kind`,`event_id`);--> statement-breakpoint
CREATE TABLE `work_economics_duration_facts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` integer NOT NULL,
	`fact_kind` text NOT NULL,
	`minutes` integer NOT NULL,
	`source` text NOT NULL,
	`recorded_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_work_economics_duration_item_kind` ON `work_economics_duration_facts` (`item_id`,`fact_kind`);--> statement-breakpoint
CREATE TABLE `work_economics_human_facts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` integer NOT NULL,
	`record_kind` text NOT NULL,
	`role` text NOT NULL,
	`min_minutes` integer,
	`max_minutes` integer,
	`active_minutes` integer,
	`recorded_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_work_economics_human_item_kind` ON `work_economics_human_facts` (`item_id`,`record_kind`);--> statement-breakpoint
ALTER TABLE `members` ADD `pod_id` text DEFAULT 'steer-flight-team' NOT NULL;--> statement-breakpoint
ALTER TABLE `work_items` ADD `pod_id` text DEFAULT 'steer-flight-team' NOT NULL;--> statement-breakpoint
ALTER TABLE `work_items` ADD `delivery_owner_id` text;--> statement-breakpoint
ALTER TABLE `work_items` ADD `outcome_owner_id` text;
--> statement-breakpoint
CREATE TRIGGER `work_economics_events_no_update`
BEFORE UPDATE ON `work_economics_events`
BEGIN SELECT RAISE(ABORT, 'work_economics_events are immutable'); END;
--> statement-breakpoint
CREATE TRIGGER `work_economics_events_no_delete`
BEFORE DELETE ON `work_economics_events`
BEGIN SELECT RAISE(ABORT, 'work_economics_events are immutable'); END;
