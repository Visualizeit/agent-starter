DROP TABLE IF EXISTS `ai_chat_runs`;--> statement-breakpoint
DROP TABLE IF EXISTS `ai_chat_threads`;--> statement-breakpoint
CREATE TABLE `ai_chat_threads` (
	`messages` text DEFAULT '[]' NOT NULL,
	`thread_id` text PRIMARY KEY,
	CONSTRAINT `fk_ai_chat_threads_thread_id_conversations_id_fk` FOREIGN KEY (`thread_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE,
	CONSTRAINT "ai_chat_threads_messages_json_check" CHECK(json_valid("messages") and json_type("messages") = 'array')
);
