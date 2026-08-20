CREATE INDEX IF NOT EXISTS `idx_signals_pod_created_id`
ON `signals` (`pod_id`, `created_at` DESC, `signal_id` DESC);
--> statement-breakpoint
PRAGMA optimize;
