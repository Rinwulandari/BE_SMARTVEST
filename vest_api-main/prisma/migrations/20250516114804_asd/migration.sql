-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Esp32` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mac_address` VARCHAR(191) NULL,
    `isUsed` BOOLEAN NULL DEFAULT false,

    UNIQUE INDEX `Esp32_mac_address_key`(`mac_address`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Personel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `PlayerID` INTEGER NULL,
    `name` VARCHAR(191) NULL,
    `selectedTeam` ENUM('TeamA', 'TeamB') NULL,
    `statusReady` BOOLEAN NOT NULL DEFAULT false,
    `statusWeapon` BOOLEAN NOT NULL DEFAULT false,
    `health` INTEGER NOT NULL DEFAULT 100,

    UNIQUE INDEX `Personel_PlayerID_key`(`PlayerID`),
    UNIQUE INDEX `Personel_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GameStatus` (
    `id` INTEGER NOT NULL,
    `status` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GameStatusLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `gameStatusId` INTEGER NOT NULL,
    `statusLog` INTEGER NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Hitpoint` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NULL,
    `team` ENUM('TeamA', 'TeamB') NULL,
    `hitpoint` INTEGER NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HitpointLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NULL,
    `hitpoint` INTEGER NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Personel` ADD CONSTRAINT `Personel_PlayerID_fkey` FOREIGN KEY (`PlayerID`) REFERENCES `Esp32`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GameStatusLog` ADD CONSTRAINT `GameStatusLog_gameStatusId_fkey` FOREIGN KEY (`gameStatusId`) REFERENCES `GameStatus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Hitpoint` ADD CONSTRAINT `Hitpoint_name_fkey` FOREIGN KEY (`name`) REFERENCES `Personel`(`name`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HitpointLog` ADD CONSTRAINT `HitpointLog_name_fkey` FOREIGN KEY (`name`) REFERENCES `Personel`(`name`) ON DELETE CASCADE ON UPDATE CASCADE;
