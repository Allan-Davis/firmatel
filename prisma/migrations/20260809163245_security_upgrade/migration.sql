-- AlterTable
ALTER TABLE `auditlog` ADD COLUMN `entryHash` VARCHAR(64) NULL,
    ADD COLUMN `previousHash` VARCHAR(64) NULL;

-- AlterTable
ALTER TABLE `credential` ADD COLUMN `contentHash` VARCHAR(64) NULL,
    ADD COLUMN `keyVersion` INTEGER NULL,
    ADD COLUMN `signature` TEXT NULL,
    ADD COLUMN `signedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `document` ADD COLUMN `contentHash` VARCHAR(64) NULL,
    ADD COLUMN `keyVersion` INTEGER NULL,
    ADD COLUMN `signature` TEXT NULL,
    ADD COLUMN `signedAt` DATETIME(3) NULL,
    ADD COLUMN `templateId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ticket` ADD COLUMN `contentHash` VARCHAR(64) NULL,
    ADD COLUMN `keyVersion` INTEGER NULL,
    ADD COLUMN `signature` TEXT NULL,
    ADD COLUMN `signedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `verificationevent` ADD COLUMN `anomalyReason` TEXT NULL,
    ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `country` VARCHAR(191) NULL,
    ADD COLUMN `isAnomalous` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `OrganizationKey` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `publicKey` TEXT NOT NULL,
    `privateKeyEnc` TEXT NOT NULL,
    `keyVersion` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `rotatedAt` DATETIME(3) NULL,

    UNIQUE INDEX `OrganizationKey_organizationId_key`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocumentTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `documentType` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `layout` JSON NOT NULL,
    `securityLevel` VARCHAR(191) NOT NULL DEFAULT 'STANDARD',
    `backgroundSeed` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DocumentTemplate_organizationId_documentType_idx`(`organizationId`, `documentType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OrganizationKey` ADD CONSTRAINT `OrganizationKey_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentTemplate` ADD CONSTRAINT `DocumentTemplate_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
