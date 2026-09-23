CREATE TABLE `ai_chat_metadata` (
	`key` text(1024) NOT NULL,
	`namespace` text(256) NOT NULL,
	`value` text NOT NULL,
	CONSTRAINT `ai_chat_metadata_pk` PRIMARY KEY(`namespace`, `key`),
	CONSTRAINT "ai_chat_metadata_namespace_check" CHECK(length("namespace") between 1 and 256),
	CONSTRAINT "ai_chat_metadata_key_check" CHECK(length("key") between 1 and 1024),
	CONSTRAINT "ai_chat_metadata_value_json_check" CHECK(json_valid("value"))
);
--> statement-breakpoint
CREATE TABLE `ai_chat_runs` (
	`cancel_requested` integer,
	`detached_since` integer,
	`driver_epoch` integer,
	`error` text,
	`finished_at` integer,
	`run_id` text(256) PRIMARY KEY,
	`sandbox_key` text,
	`started_at` integer NOT NULL,
	`status` text DEFAULT 'running' NOT NULL,
	`thread_id` text(256) NOT NULL,
	`usage` text,
	CONSTRAINT `fk_ai_chat_runs_thread_id_conversations_id_fk` FOREIGN KEY (`thread_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE,
	CONSTRAINT "ai_chat_runs_run_id_check" CHECK(length("run_id") between 1 and 256),
	CONSTRAINT "ai_chat_runs_thread_id_check" CHECK(length("thread_id") between 1 and 256),
	CONSTRAINT "ai_chat_runs_status_check" CHECK("status" in ('running', 'interrupted', 'completed', 'failed', 'aborted')),
	CONSTRAINT "ai_chat_runs_error_json_check" CHECK("error" is null or (json_valid("error") and json_type("error") = 'object')),
	CONSTRAINT "ai_chat_runs_usage_json_check" CHECK("usage" is null or (json_valid("usage") and json_type("usage") = 'object'))
);
--> statement-breakpoint
CREATE INDEX `ai_chat_runs_thread_id_status_started_at_idx` ON `ai_chat_runs` (`thread_id`,`status`,`started_at`);