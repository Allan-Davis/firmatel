-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: firmatel
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('43112eee-1ccb-4630-a46f-52929eb8c15e','0f298fe39cb2e52d7281d371882e3a96429174c134e6b2a2c7c8d8b782369d05','2026-08-08 18:19:37.873','20260808181930_initial_firmatel_schema',NULL,NULL,'2026-08-08 18:19:30.776',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auditlog`
--

DROP TABLE IF EXISTS `auditlog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auditlog` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `action` varchar(191) NOT NULL,
  `entityType` varchar(191) NOT NULL,
  `entityId` varchar(191) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `ipAddress` varchar(191) DEFAULT NULL,
  `userAgent` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `AuditLog_organizationId_idx` (`organizationId`),
  KEY `AuditLog_entityType_idx` (`entityType`),
  KEY `AuditLog_entityId_idx` (`entityId`),
  KEY `AuditLog_createdAt_idx` (`createdAt`),
  CONSTRAINT `AuditLog_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organization` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditlog`
--

LOCK TABLES `auditlog` WRITE;
/*!40000 ALTER TABLE `auditlog` DISABLE KEYS */;
/*!40000 ALTER TABLE `auditlog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `credential`
--

DROP TABLE IF EXISTS `credential`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `credential` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `recipientId` varchar(191) DEFAULT NULL,
  `credentialNumber` varchar(191) NOT NULL,
  `credentialType` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `issueDate` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `expiryDate` datetime(3) DEFAULT NULL,
  `status` enum('ACTIVE','SUSPENDED','REVOKED','EXPIRED') NOT NULL DEFAULT 'ACTIVE',
  `verificationCode` varchar(191) NOT NULL,
  `qrPayload` text DEFAULT NULL,
  `fileUrl` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Credential_verificationCode_key` (`verificationCode`),
  UNIQUE KEY `Credential_organizationId_credentialNumber_key` (`organizationId`,`credentialNumber`),
  KEY `Credential_organizationId_idx` (`organizationId`),
  KEY `Credential_recipientId_idx` (`recipientId`),
  KEY `Credential_credentialType_idx` (`credentialType`),
  KEY `Credential_status_idx` (`status`),
  KEY `Credential_verificationCode_idx` (`verificationCode`),
  CONSTRAINT `Credential_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organization` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Credential_recipientId_fkey` FOREIGN KEY (`recipientId`) REFERENCES `recipient` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `credential`
--

LOCK TABLES `credential` WRITE;
/*!40000 ALTER TABLE `credential` DISABLE KEYS */;
/*!40000 ALTER TABLE `credential` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document`
--

DROP TABLE IF EXISTS `document`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `document` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `recipientId` varchar(191) DEFAULT NULL,
  `documentNumber` varchar(191) NOT NULL,
  `documentType` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `issueDate` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `expiryDate` datetime(3) DEFAULT NULL,
  `status` enum('DRAFT','ISSUED','REVOKED','EXPIRED') NOT NULL DEFAULT 'DRAFT',
  `verificationCode` varchar(191) NOT NULL,
  `qrPayload` text DEFAULT NULL,
  `fileUrl` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Document_verificationCode_key` (`verificationCode`),
  UNIQUE KEY `Document_organizationId_documentNumber_key` (`organizationId`,`documentNumber`),
  KEY `Document_organizationId_idx` (`organizationId`),
  KEY `Document_recipientId_idx` (`recipientId`),
  KEY `Document_documentType_idx` (`documentType`),
  KEY `Document_status_idx` (`status`),
  KEY `Document_verificationCode_idx` (`verificationCode`),
  CONSTRAINT `Document_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organization` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Document_recipientId_fkey` FOREIGN KEY (`recipientId`) REFERENCES `recipient` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document`
--

LOCK TABLES `document` WRITE;
/*!40000 ALTER TABLE `document` DISABLE KEYS */;
/*!40000 ALTER TABLE `document` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organization`
--

DROP TABLE IF EXISTS `organization`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `organization` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `status` enum('ACTIVE','SUSPENDED','DEACTIVATED') NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Organization_slug_key` (`slug`),
  KEY `Organization_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organization`
--

LOCK TABLES `organization` WRITE;
/*!40000 ALTER TABLE `organization` DISABLE KEYS */;
/*!40000 ALTER TABLE `organization` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recipient`
--

DROP TABLE IF EXISTS `recipient`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `recipient` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `fullName` varchar(191) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `identifier` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Recipient_organizationId_idx` (`organizationId`),
  KEY `Recipient_email_idx` (`email`),
  KEY `Recipient_phone_idx` (`phone`),
  CONSTRAINT `Recipient_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organization` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recipient`
--

LOCK TABLES `recipient` WRITE;
/*!40000 ALTER TABLE `recipient` DISABLE KEYS */;
/*!40000 ALTER TABLE `recipient` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket`
--

DROP TABLE IF EXISTS `ticket`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ticket` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `recipientId` varchar(191) DEFAULT NULL,
  `ticketNumber` varchar(191) NOT NULL,
  `ticketType` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `eventName` varchar(191) DEFAULT NULL,
  `eventDate` datetime(3) DEFAULT NULL,
  `status` enum('ACTIVE','USED','CANCELLED','EXPIRED') NOT NULL DEFAULT 'ACTIVE',
  `verificationCode` varchar(191) NOT NULL,
  `qrPayload` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Ticket_verificationCode_key` (`verificationCode`),
  UNIQUE KEY `Ticket_organizationId_ticketNumber_key` (`organizationId`,`ticketNumber`),
  KEY `Ticket_organizationId_idx` (`organizationId`),
  KEY `Ticket_recipientId_idx` (`recipientId`),
  KEY `Ticket_ticketType_idx` (`ticketType`),
  KEY `Ticket_status_idx` (`status`),
  KEY `Ticket_verificationCode_idx` (`verificationCode`),
  CONSTRAINT `Ticket_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organization` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Ticket_recipientId_fkey` FOREIGN KEY (`recipientId`) REFERENCES `recipient` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket`
--

LOCK TABLES `ticket` WRITE;
/*!40000 ALTER TABLE `ticket` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticket` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `passwordHash` varchar(191) NOT NULL,
  `status` enum('ACTIVE','SUSPENDED','DEACTIVATED') NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_organizationId_email_key` (`organizationId`,`email`),
  KEY `User_organizationId_idx` (`organizationId`),
  KEY `User_status_idx` (`status`),
  CONSTRAINT `User_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organization` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `verificationevent`
--

DROP TABLE IF EXISTS `verificationevent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `verificationevent` (
  `id` varchar(191) NOT NULL,
  `verificationCode` varchar(191) NOT NULL,
  `result` enum('VALID','INVALID','REVOKED','EXPIRED') NOT NULL,
  `documentId` varchar(191) DEFAULT NULL,
  `credentialId` varchar(191) DEFAULT NULL,
  `ticketId` varchar(191) DEFAULT NULL,
  `ipAddress` varchar(191) DEFAULT NULL,
  `userAgent` text DEFAULT NULL,
  `verifiedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `VerificationEvent_verificationCode_idx` (`verificationCode`),
  KEY `VerificationEvent_documentId_idx` (`documentId`),
  KEY `VerificationEvent_credentialId_idx` (`credentialId`),
  KEY `VerificationEvent_ticketId_idx` (`ticketId`),
  KEY `VerificationEvent_verifiedAt_idx` (`verifiedAt`),
  CONSTRAINT `VerificationEvent_credentialId_fkey` FOREIGN KEY (`credentialId`) REFERENCES `credential` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `VerificationEvent_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `document` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `VerificationEvent_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `ticket` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `verificationevent`
--

LOCK TABLES `verificationevent` WRITE;
/*!40000 ALTER TABLE `verificationevent` DISABLE KEYS */;
/*!40000 ALTER TABLE `verificationevent` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-08 21:29:03
