/*
  Warnings:

  - A unique constraint covering the columns `[qrcode]` on the table `Personel` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `personel` ADD COLUMN `hitpoint` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `qrcode` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Personel_qrcode_key` ON `Personel`(`qrcode`);
