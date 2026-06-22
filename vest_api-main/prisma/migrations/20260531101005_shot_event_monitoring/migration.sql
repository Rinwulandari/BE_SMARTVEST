-- CreateTable
CREATE TABLE `shot_event` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `team` ENUM('TeamA', 'TeamB') NULL,
    `session_id` VARCHAR(191) NOT NULL,
    `main_sensor` INTEGER NOT NULL,
    `main_area` VARCHAR(191) NOT NULL,
    `main_adc` INTEGER NOT NULL,
    `shot_number` INTEGER NOT NULL,
    `damage` INTEGER NOT NULL,
    `hp_before` INTEGER NOT NULL,
    `hp_after` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shot_impact` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shot_event_id` INTEGER NOT NULL,
    `sensor_id` INTEGER NOT NULL,
    `adc_value` INTEGER NOT NULL,
    `level` VARCHAR(191) NOT NULL,

    INDEX `shot_impact_shot_event_id_idx`(`shot_event_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `shot_impact` ADD CONSTRAINT `shot_impact_shot_event_id_fkey` FOREIGN KEY (`shot_event_id`) REFERENCES `shot_event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
