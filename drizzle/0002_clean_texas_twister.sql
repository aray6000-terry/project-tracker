ALTER TABLE `team_members` ADD `firebase_uid` text;--> statement-breakpoint
CREATE UNIQUE INDEX `team_members_firebase_uid_unique` ON `team_members` (`firebase_uid`);