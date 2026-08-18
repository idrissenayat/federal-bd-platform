CREATE TABLE `work_economics_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` integer NOT NULL,
	`section` text NOT NULL,
	`action` text NOT NULL,
	`actor_id` text NOT NULL,
	`actor_role` text NOT NULL,
	`previous_json` text,
	`replacement_json` text,
	`reason` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_work_economics_item_created` ON `work_economics_events` (`item_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `work_items` ADD `value_hypothesis_json` text;--> statement-breakpoint
ALTER TABLE `work_items` ADD `delivery_forecast_json` text;--> statement-breakpoint
ALTER TABLE `work_items` ADD `actual_economics_json` text;--> statement-breakpoint
ALTER TABLE `work_items` ADD `realized_outcome_json` text;