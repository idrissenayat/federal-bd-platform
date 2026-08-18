CREATE TABLE `work_economics_delivery_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` integer NOT NULL,
	`event_kind` text NOT NULL,
	`originating_phase` text,
	`severity` text,
	`minutes` integer,
	`count` integer,
	`reason` text NOT NULL,
	`occurred_at` text NOT NULL,
	`recorded_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_work_economics_delivery_event_item_kind` ON `work_economics_delivery_events` (`item_id`,`event_kind`);--> statement-breakpoint
ALTER TABLE `work_economics_agent_facts` ADD `conflict_reason` text DEFAULT '' NOT NULL;