-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `password_hash` VARCHAR(100) NOT NULL,
    `role` ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_reset_tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `password_reset_tokens_token_hash_key`(`token_hash`),
    INDEX `password_reset_tokens_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `addresses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `label` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `street` VARCHAR(255) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `district` VARCHAR(100) NOT NULL,
    `province` VARCHAR(100) NOT NULL,
    `postal_code` VARCHAR(10) NOT NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,

    INDEX `addresses_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `image` VARCHAR(255) NULL,
    `parent_id` INTEGER NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `categories_slug_key`(`slug`),
    INDEX `categories_parent_id_idx`(`parent_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `slug` VARCHAR(220) NOT NULL,
    `description` TEXT NOT NULL,
    `specs` JSON NOT NULL,
    `price` INTEGER NOT NULL,
    `compare_at_price` INTEGER NULL,
    `brand` VARCHAR(100) NOT NULL,
    `category_id` INTEGER NOT NULL,
    `tags` JSON NOT NULL,
    `weight` INTEGER NOT NULL,
    `rating` DECIMAL(2, 1) NOT NULL DEFAULT 0,
    `review_count` INTEGER NOT NULL DEFAULT 0,
    `sold_count` INTEGER NOT NULL DEFAULT 0,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `is_preorder` BOOLEAN NOT NULL DEFAULT false,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `variant_label` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `products_slug_key`(`slug`),
    INDEX `products_category_id_idx`(`category_id`),
    INDEX `products_brand_idx`(`brand`),
    INDEX `products_price_idx`(`price`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `url` VARCHAR(255) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `product_images_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_variants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `price` INTEGER NULL,
    `weight` INTEGER NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `product_variants_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reviews` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `order_item_id` INTEGER NOT NULL,
    `rating` TINYINT NOT NULL,
    `content` TEXT NOT NULL,
    `images` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `reviews_order_item_id_key`(`order_item_id`),
    INDEX `reviews_product_id_idx`(`product_id`),
    INDEX `reviews_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wishlist_items` (
    `user_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `wishlist_items_product_id_idx`(`product_id`),
    PRIMARY KEY (`user_id`, `product_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `promo_codes` (
    `code` VARCHAR(30) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `type` ENUM('PERCENT', 'FIXED') NOT NULL,
    `value` INTEGER NOT NULL,
    `min_subtotal` INTEGER NOT NULL DEFAULT 0,
    `max_discount` INTEGER NULL,
    `quota` INTEGER NULL,
    `used_count` INTEGER NOT NULL DEFAULT 0,
    `per_user_limit` INTEGER NOT NULL DEFAULT 1,
    `starts_at` DATETIME(3) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `promo_usages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(30) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `order_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `promo_usages_order_id_key`(`order_id`),
    INDEX `promo_usages_code_user_id_idx`(`code`, `user_id`),
    INDEX `promo_usages_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_number` VARCHAR(20) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `subtotal` INTEGER NOT NULL,
    `shipping_cost` INTEGER NOT NULL,
    `discount` INTEGER NOT NULL DEFAULT 0,
    `tax` INTEGER NOT NULL DEFAULT 0,
    `grand_total` INTEGER NOT NULL,
    `total_weight` INTEGER NOT NULL,
    `status` ENUM('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
    `payment_method` ENUM('qris', 'bank_bca', 'bank_mandiri', 'cod') NOT NULL,
    `payment_status` ENUM('unpaid', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid',
    `payment_due_at` DATETIME(3) NULL,
    `paid_at` DATETIME(3) NULL,
    `shipping_address` JSON NOT NULL,
    `shipping_method` ENUM('jne_reg', 'sicepat_reg', 'gosend_instant') NOT NULL,
    `tracking_number` VARCHAR(50) NULL,
    `promo_code` VARCHAR(30) NULL,
    `notes` TEXT NULL,
    `cancel_reason` VARCHAR(255) NULL,
    `shipped_at` DATETIME(3) NULL,
    `delivered_at` DATETIME(3) NULL,
    `cancelled_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `payment_attempt` INTEGER NOT NULL DEFAULT 0,
    `payment_transaction_id` VARCHAR(64) NULL,
    `payment_url` VARCHAR(255) NULL,
    `payment_type` VARCHAR(32) NULL,

    UNIQUE INDEX `orders_order_number_key`(`order_number`),
    INDEX `orders_user_id_idx`(`user_id`),
    INDEX `orders_status_idx`(`status`),
    INDEX `orders_payment_due_at_idx`(`payment_due_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `variant_id` INTEGER NULL,
    `name` VARCHAR(200) NOT NULL,
    `variant_name` VARCHAR(50) NULL,
    `image` VARCHAR(255) NULL,
    `price` INTEGER NOT NULL,
    `weight` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,

    INDEX `order_items_order_id_idx`(`order_id`),
    INDEX `order_items_product_id_idx`(`product_id`),
    INDEX `order_items_variant_id_idx`(`variant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_status_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `status` ENUM('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled') NOT NULL,
    `note` VARCHAR(255) NULL,
    `changed_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `order_status_logs_order_id_idx`(`order_id`),
    INDEX `order_status_logs_changed_by_idx`(`changed_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `banners` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(150) NOT NULL,
    `subtitle` VARCHAR(255) NULL,
    `cta` VARCHAR(50) NULL,
    `href` VARCHAR(255) NULL,
    `image` VARCHAR(255) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `addresses` ADD CONSTRAINT `addresses_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_order_item_id_fkey` FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wishlist_items` ADD CONSTRAINT `wishlist_items_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wishlist_items` ADD CONSTRAINT `wishlist_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promo_usages` ADD CONSTRAINT `promo_usages_code_fkey` FOREIGN KEY (`code`) REFERENCES `promo_codes`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promo_usages` ADD CONSTRAINT `promo_usages_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promo_usages` ADD CONSTRAINT `promo_usages_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_status_logs` ADD CONSTRAINT `order_status_logs_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_status_logs` ADD CONSTRAINT `order_status_logs_changed_by_fkey` FOREIGN KEY (`changed_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
