-- D21: Login Google. ID akun Google (klaim sub), unik, null bila belum ditautkan.
-- AlterTable
ALTER TABLE `users` ADD COLUMN `google_sub` VARCHAR(255) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_google_sub_key` ON `users`(`google_sub`);
