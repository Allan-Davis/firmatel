/*
  Warnings:

  - A unique constraint covering the columns `[documentPrefix]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `organization` ADD COLUMN `documentPrefix` VARCHAR(191) NULL,
    ADD COLUMN `logoUrl` TEXT NULL,
    ADD COLUMN `primaryColor` VARCHAR(191) NULL,
    ADD COLUMN `secondaryColor` VARCHAR(191) NULL,
    ADD COLUMN `type` ENUM('COMPANY', 'SCHOOL', 'UNIVERSITY', 'COLLEGE', 'TRAINING_INSTITUTION', 'CHURCH', 'HOSPITAL', 'BANK', 'SACCO', 'NGO', 'GOVERNMENT', 'EVENT_ORGANIZER', 'PROFESSIONAL_BODY', 'ASSOCIATION', 'OTHER') NOT NULL DEFAULT 'COMPANY',
    ADD COLUMN `verificationUrl` VARCHAR(191) NULL,
    ADD COLUMN `website` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `departmentId` VARCHAR(191) NULL,
    ADD COLUMN `lastLoginAt` DATETIME(3) NULL,
    ADD COLUMN `lastLoginIp` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Department` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Department_organizationId_idx`(`organizationId`),
    INDEX `Department_code_idx`(`code`),
    UNIQUE INDEX `Department_organizationId_name_key`(`organizationId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrganizationSetting` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'Africa/Nairobi',
    `dateFormat` VARCHAR(191) NOT NULL DEFAULT 'DD/MM/YYYY',
    `defaultDocumentValidityDays` INTEGER NULL,
    `requireQrVerification` BOOLEAN NOT NULL DEFAULT true,
    `requireRecipientEmail` BOOLEAN NOT NULL DEFAULT false,
    `requireRecipientPhone` BOOLEAN NOT NULL DEFAULT false,
    `allowPublicVerification` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `OrganizationSetting_organizationId_key`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Organization_documentPrefix_key` ON `Organization`(`documentPrefix`);

-- CreateIndex
CREATE INDEX `Organization_type_idx` ON `Organization`(`type`);

-- CreateIndex
CREATE INDEX `User_departmentId_idx` ON `User`(`departmentId`);

-- CreateIndex
CREATE INDEX `User_role_idx` ON `User`(`role`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Department` ADD CONSTRAINT `Department_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrganizationSetting` ADD CONSTRAINT `OrganizationSetting_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
