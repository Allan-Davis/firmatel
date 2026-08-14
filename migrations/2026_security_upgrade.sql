-- ============================================================
-- FIRMATEL SECURITY UPGRADE — raw SQL (MariaDB / phpMyAdmin)
-- Only use this if you are NOT using `npx prisma migrate dev`.
-- Run once against the `firmatel` database.
-- ============================================================

START TRANSACTION;

CREATE TABLE `organizationkey` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `publicKey` text NOT NULL,
  `privateKeyEnc` text NOT NULL,
  `keyVersion` int(11) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `rotatedAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `OrganizationKey_organizationId_key` (`organizationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `document`
  ADD COLUMN `contentHash` varchar(64) DEFAULT NULL AFTER `qrPayload`,
  ADD COLUMN `signature` text DEFAULT NULL AFTER `contentHash`,
  ADD COLUMN `signedAt` datetime(3) DEFAULT NULL AFTER `signature`,
  ADD COLUMN `keyVersion` int(11) DEFAULT NULL AFTER `signedAt`,
  ADD COLUMN `templateId` varchar(191) DEFAULT NULL AFTER `keyVersion`;

ALTER TABLE `credential`
  ADD COLUMN `contentHash` varchar(64) DEFAULT NULL AFTER `qrPayload`,
  ADD COLUMN `signature` text DEFAULT NULL AFTER `contentHash`,
  ADD COLUMN `signedAt` datetime(3) DEFAULT NULL AFTER `signature`,
  ADD COLUMN `keyVersion` int(11) DEFAULT NULL AFTER `signedAt`;

ALTER TABLE `ticket`
  ADD COLUMN `contentHash` varchar(64) DEFAULT NULL AFTER `qrPayload`,
  ADD COLUMN `signature` text DEFAULT NULL AFTER `contentHash`,
  ADD COLUMN `signedAt` datetime(3) DEFAULT NULL AFTER `signature`,
  ADD COLUMN `keyVersion` int(11) DEFAULT NULL AFTER `signedAt`;

CREATE TABLE `documenttemplate` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `documentType` varchar(191) NOT NULL,
  `version` int(11) NOT NULL DEFAULT 1,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `layout` longtext NOT NULL,
  `securityLevel` varchar(191) NOT NULL DEFAULT 'STANDARD',
  `backgroundSeed` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `DocumentTemplate_organizationId_documentType_idx` (`organizationId`,`documentType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `auditlog`
  ADD COLUMN `previousHash` varchar(64) DEFAULT NULL AFTER `userAgent`,
  ADD COLUMN `entryHash` varchar(64) DEFAULT NULL AFTER `previousHash`;

ALTER TABLE `verificationevent`
  ADD COLUMN `country` varchar(191) DEFAULT NULL AFTER `userAgent`,
  ADD COLUMN `city` varchar(191) DEFAULT NULL AFTER `country`,
  ADD COLUMN `isAnomalous` tinyint(1) NOT NULL DEFAULT 0 AFTER `city`,
  ADD COLUMN `anomalyReason` text DEFAULT NULL AFTER `isAnomalous`;

ALTER TABLE `organizationkey`
  ADD CONSTRAINT `OrganizationKey_organizationId_fkey`
  FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `documenttemplate`
  ADD CONSTRAINT `DocumentTemplate_organizationId_fkey`
  FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
