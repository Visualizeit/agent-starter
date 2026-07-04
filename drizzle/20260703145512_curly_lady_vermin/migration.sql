DROP INDEX IF EXISTS `conversations_deleted_at_updated_at_idx`;--> statement-breakpoint
ALTER TABLE `conversations` DROP COLUMN `archived_at`;--> statement-breakpoint
ALTER TABLE `conversations` DROP COLUMN `deleted_at`;