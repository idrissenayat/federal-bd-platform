CREATE TABLE `workspace_routing_conflicts` (
	`pod_id` text NOT NULL,
	`route_key` text NOT NULL,
	`conflict_id` text NOT NULL,
	`source_kind` text NOT NULL,
	`source_reference_sha256` text NOT NULL,
	`status` text NOT NULL,
	`detected_by` text NOT NULL,
	`detected_at` text NOT NULL,
	`resolved_by` text,
	`resolved_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_workspace_routing_conflict` ON `workspace_routing_conflicts` (`pod_id`,`route_key`,`conflict_id`);--> statement-breakpoint
CREATE INDEX `idx_workspace_routing_conflict_active` ON `workspace_routing_conflicts` (`pod_id`,`route_key`,`status`);