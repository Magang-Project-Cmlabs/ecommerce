-- Additive infrastructure migration: no existing records are changed.
CREATE TABLE `auth_rate_limits` (
    `key_hash` CHAR(64) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `expires_at` DATETIME(3) NOT NULL,
    INDEX `auth_rate_limits_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`key_hash`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
