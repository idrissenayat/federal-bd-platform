ALTER TABLE `work_items` ADD `work_type` text DEFAULT 'Unclassified' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_work_items_pod_work_type_state` ON `work_items` (`pod_id`,`work_type`,`state`);