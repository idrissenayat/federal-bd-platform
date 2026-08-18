CREATE TABLE `steer_telemetry` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`metric_name` text NOT NULL,
	`label_name` text DEFAULT '' NOT NULL,
	`label_value` text DEFAULT '' NOT NULL,
	`value` integer NOT NULL,
	`case_id` text,
	`observed_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_steer_telemetry_metric_observed` ON `steer_telemetry` (`metric_name`,`observed_at`);