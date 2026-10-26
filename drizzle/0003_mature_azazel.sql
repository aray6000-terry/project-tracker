ALTER TABLE `team_members` ADD `supabase_uid` text;--> statement-breakpoint
CREATE UNIQUE INDEX `team_members_supabase_uid_unique` ON `team_members` (`supabase_uid`);