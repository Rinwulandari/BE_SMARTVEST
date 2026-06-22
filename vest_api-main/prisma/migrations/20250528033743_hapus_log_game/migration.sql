/*
  Warnings:

  - You are about to drop the `gamestatuslog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `GameStatusLog` DROP FOREIGN KEY `GameStatusLog_gameStatusId_fkey`;

-- DropTable
DROP TABLE `GameStatusLog`;
