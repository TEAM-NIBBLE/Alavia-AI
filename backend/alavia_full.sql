-- Alavia full database setup (MariaDB/MySQL, utf8mb4). Generated 2026-10-10.
-- Creates every table (all 15 migrations), records them in `migrations` so 'php artisan migrate' is a no-op,
-- and loads reference data: 548 hospitals + hospital facility/specialty lists.
-- Contains NO users, consultations, admin accounts or secrets. Create the admin afterwards:
--   ADMIN_EMAIL=... ADMIN_PASSWORD=... php artisan db:seed --class=AdminUserSeeder --force
-- Import into an EMPTY database:  mysql -u USER -p DBNAME < alavia_full.sql
/*M!999999\- enable the sandbox mode */ 

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
DROP TABLE IF EXISTS `admin_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('SUPERADMIN','STAFF') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admin_users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `admin_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_users` ENABLE KEYS */;
DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `actor_type` varchar(255) DEFAULT NULL,
  `actor_id` bigint(20) unsigned DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `entity` varchar(255) NOT NULL,
  `entity_id` bigint(20) unsigned DEFAULT NULL,
  `meta_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`meta_json`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
DROP TABLE IF EXISTS `consultation_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultation_messages` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `consultation_id` bigint(20) unsigned NOT NULL,
  `role` enum('USER','AI') NOT NULL,
  `content_encrypted` longtext NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `consultation_messages_consultation_id_foreign` (`consultation_id`),
  CONSTRAINT `consultation_messages_consultation_id_foreign` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `consultation_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultation_messages` ENABLE KEYS */;
DROP TABLE IF EXISTS `consultations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `guest_token_hash` varchar(64) DEFAULT NULL,
  `status` enum('ACTIVE','COMPLETED') NOT NULL DEFAULT 'ACTIVE',
  `severity` enum('LOW','MEDIUM','HIGH','CRITICAL') DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `summary_encrypted` longtext DEFAULT NULL,
  `recommended_specialty` varchar(255) DEFAULT NULL,
  `first_aid_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`first_aid_json`)),
  `warnings_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`warnings_json`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `follow_up_due_at` timestamp NULL DEFAULT NULL,
  `follow_up_outcome` enum('BETTER','SAME','WORSE') DEFAULT NULL,
  `follow_up_at` timestamp NULL DEFAULT NULL,
  `feedback_helpful` tinyint(1) DEFAULT NULL,
  `feedback_comment_encrypted` longtext DEFAULT NULL,
  `feedback_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `consultations_guest_token_hash_unique` (`guest_token_hash`),
  KEY `consultations_user_id_foreign` (`user_id`),
  CONSTRAINT `consultations_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `consultations` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultations` ENABLE KEYS */;
DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
DROP TABLE IF EXISTS `hospital_facilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `hospital_facilities` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `hospital_id` bigint(20) unsigned DEFAULT NULL,
  `facility_name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `hospital_facilities_hospital_id_foreign` (`hospital_id`),
  CONSTRAINT `hospital_facilities_hospital_id_foreign` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `hospital_facilities` DISABLE KEYS */;
INSERT INTO `hospital_facilities` VALUES
(1,NULL,'Ambulance','2026-10-10 08:37:59','2026-10-10 08:37:59'),
(2,NULL,'Emergency Unit','2026-10-10 08:37:59','2026-10-10 08:37:59'),
(3,NULL,'Laboratory','2026-10-10 08:37:59','2026-10-10 08:37:59'),
(4,NULL,'Radiology','2026-10-10 08:37:59','2026-10-10 08:37:59'),
(5,NULL,'Pharmacy','2026-10-10 08:37:59','2026-10-10 08:37:59'),
(6,NULL,'Maternity Ward','2026-10-10 08:37:59','2026-10-10 08:37:59'),
(7,NULL,'ICU','2026-10-10 08:37:59','2026-10-10 08:37:59');
/*!40000 ALTER TABLE `hospital_facilities` ENABLE KEYS */;
DROP TABLE IF EXISTS `hospital_specialties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `hospital_specialties` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `hospital_id` bigint(20) unsigned DEFAULT NULL,
  `specialty_name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `hospital_specialties_hospital_id_foreign` (`hospital_id`),
  CONSTRAINT `hospital_specialties_hospital_id_foreign` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `hospital_specialties` DISABLE KEYS */;
INSERT INTO `hospital_specialties` VALUES
(1,NULL,'Cardiology','2026-10-10 08:37:59','2026-10-10 08:37:59'),
(2,NULL,'Emergency Medicine','2026-10-10 08:37:59','2026-10-10 08:37:59'),
(3,NULL,'Pediatrics','2026-10-10 08:37:59','2026-10-10 08:37:59'),
(4,NULL,'Obstetrics & Gynecology','2026-10-10 08:37:59','2026-10-10 08:37:59'),
(5,NULL,'General Surgery','2026-10-10 08:37:59','2026-10-10 08:37:59'),
(6,NULL,'Internal Medicine','2026-10-10 08:37:59','2026-10-10 08:37:59');
/*!40000 ALTER TABLE `hospital_specialties` ENABLE KEYS */;
DROP TABLE IF EXISTS `hospitals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `hospitals` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `osm_type` enum('node','way','relation') NOT NULL,
  `osm_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `state` varchar(255) NOT NULL DEFAULT 'Lagos',
  `lga` varchar(255) DEFAULT NULL,
  `lat` decimal(10,7) NOT NULL,
  `lng` decimal(10,7) NOT NULL,
  `rating` decimal(2,1) DEFAULT NULL,
  `rating_count` int(10) unsigned DEFAULT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 0,
  `is_24_hours` tinyint(1) NOT NULL DEFAULT 0,
  `emergency_ready` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hospitals_osm_type_osm_id_unique` (`osm_type`,`osm_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `hospitals` DISABLE KEYS */;
INSERT INTO `hospitals` VALUES
(1,'node',3995343800,'MÉDICAL ILE OLA',NULL,'Lagos',NULL,6.7282992,2.7794707,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(2,'node',3995347253,'CLINIQUE FIFATIN',NULL,'Lagos',NULL,6.6465180,2.7440626,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(3,'node',3995348029,'ITA SIMBA',NULL,'Lagos',NULL,6.6962517,2.7765953,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(4,'node',4248396090,'Gramath Medical Center',NULL,'Lagos',NULL,6.6860919,3.2477681,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(5,'node',4872475575,'Rojafia Clinic',NULL,'Lagos',NULL,6.5929713,3.3974544,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(6,'node',7334681885,'Balogun Primary Healthcare Center.','Balogun Crescent','Lagos',NULL,6.5906253,3.2283304,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(7,'node',8813093194,'Eti-Osa',NULL,'Lagos',NULL,6.4627777,3.5852178,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(8,'node',10232587966,'Pink Clinic Nigeria','13b Muri Folami Street Ogudu','Lagos','Ogudu',6.5760257,3.3869161,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(9,'node',10980481851,'Centre de santé de tchakou',NULL,'Lagos',NULL,6.4809833,2.7087503,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(10,'node',11121934213,'Safeway hospital',NULL,'Lagos',NULL,6.4731522,3.6295577,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(11,'node',11121934221,'Caremax Hospital',NULL,'Lagos',NULL,6.4736067,3.6309711,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(12,'node',11121946405,'Sangotedo Primary Health Care Center',NULL,'Lagos',NULL,6.4722606,3.6325043,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(13,'node',11879397885,'The Tent Wellness Centre','13 Okunfolami Street Anthony Village','Lagos','Anthony Village',6.5657924,3.3722595,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(14,'node',11886853246,'Grace Olambipo Clinic',NULL,'Lagos',NULL,6.5059412,3.1702262,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(15,'node',11886853247,'Isashi Primary Health Care Center',NULL,'Lagos',NULL,6.5023249,3.1716183,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(16,'node',11886853248,'Lagos State Ministry Of Health Belinda Convalscent And Fertility Centre',NULL,'Lagos',NULL,6.4997452,3.1707680,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(17,'node',11886853249,'Pioneer Medical Clinic',NULL,'Lagos',NULL,6.4955932,3.1718919,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(18,'node',11886853250,'Leverage Hospital Specialist Clinic',NULL,'Lagos',NULL,6.4955066,3.1717899,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(19,'node',11886853251,'Tower Of Glory Hospital',NULL,'Lagos',NULL,6.4964220,3.1711113,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(20,'node',11886853252,'Noble Medical Digonistic Centre',NULL,'Lagos',NULL,6.4922566,3.1740108,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(21,'node',11886853253,'Grace Land Medical Center',NULL,'Lagos',NULL,6.4902392,3.1999826,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(22,'node',11886853254,'Pa Clement Ogunsusi',NULL,'Lagos',NULL,6.4927656,3.2000443,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(23,'node',11886853255,'Adis Bunm Trado Medical Hospital And Maternity Home 14 Nnaema Uzor Street Off Summit Light Road',NULL,'Lagos',NULL,6.5029858,3.2065956,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(24,'node',11886853256,'Ndieze Homeopathic Medical Services 20 Drchiwumba Off Summit Light Road',NULL,'Lagos',NULL,6.5004514,3.2067874,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(25,'node',11886853257,'Wisdom Hospital And Maternity',NULL,'Lagos',NULL,6.5023249,3.1982070,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(26,'node',11886853258,'Betheland Hospital',NULL,'Lagos',NULL,6.4971682,3.1964502,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(27,'node',11886996045,'Ademola Medical Center',NULL,'Lagos',NULL,6.4944299,3.1438789,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(28,'node',11886996046,'Hyssop Eye Clinic',NULL,'Lagos',NULL,6.4943833,3.1254360,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(29,'node',11886996047,'Ore Ofe Hospital Ijanikin','Lagos-Badagry Expressway','Lagos',NULL,6.4951550,3.1258380,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(30,'node',11886996048,'Femola Hospital',NULL,'Lagos',NULL,6.4943433,3.1184435,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(31,'node',11886996049,'Ijanikin Primary Health Care Center By Ile Oba Bstop Lagos Badagry Express Road',NULL,'Lagos',NULL,6.4974040,3.1186245,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(32,'node',11886996050,'Angelic Care Foundation Maternity',NULL,'Lagos',NULL,6.4937197,3.1415319,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(33,'node',11886996051,'Ever Life Hospital',NULL,'Lagos',NULL,6.4949056,3.1394720,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(34,'node',11887050496,'Era Primary Health Care Center',NULL,'Lagos',NULL,6.4769146,3.1240956,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(35,'node',11887050497,'Oriowo Maternity Home',NULL,'Lagos',NULL,6.4769579,3.1232701,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(36,'node',11887050498,'Goodness Medical Center',NULL,'Lagos',NULL,6.4607312,3.1053704,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(37,'node',11887050499,'Imude Primary Health Care Center',NULL,'Lagos',NULL,6.4666106,3.1150451,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(38,'node',11887050500,'Angelic Care Health Center 124 Adaloko Road By Pako Bstop',NULL,'Lagos',NULL,6.4768459,3.1582180,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(39,'node',11887050501,'Devital Care Hospital',NULL,'Lagos',NULL,6.4766967,3.1423406,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(40,'node',11887050502,'Denow Ayetoro Medical Center',NULL,'Lagos',NULL,6.4884476,3.1539707,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(41,'node',11887050503,'Ketu Medical Clinic',NULL,'Lagos',NULL,6.4869359,3.1532773,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(42,'node',11887082163,'Primary Health Building Dadiluwi Ilaje Riverine',NULL,'Lagos',NULL,6.4042557,3.0292305,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(43,'node',11887087044,'Taffi Awori Primary Health Centre',NULL,'Lagos',NULL,6.4078114,3.0736023,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(44,'node',11887482478,'Alhayat Hospital 2ekuweme Street Off Ogo Oluwa Street By Green And White Bus Stop',NULL,'Lagos',NULL,6.4730095,3.1512415,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(45,'node',11887482479,'God Cures Hospital',NULL,'Lagos',NULL,6.4700726,3.1429884,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(46,'node',11887512842,'Healing Land Hospital And Maternity',NULL,'Lagos',NULL,6.4601775,3.1402270,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(47,'node',11887512843,'Ejiwunmi Tradomedical',NULL,'Lagos',NULL,6.4670343,3.1412986,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(48,'node',11887512844,'Goodness Medical Services',NULL,'Lagos',NULL,6.4610151,3.1443389,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(49,'node',11887512845,'Shibiri Primary Health Centre',NULL,'Lagos',NULL,6.4617920,3.1442732,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(50,'node',11887512846,'Olutayo Nursing Home',NULL,'Lagos',NULL,6.4658497,3.1529447,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(51,'node',11887512847,'Illogbo Central Hospital Illogboope',NULL,'Lagos',NULL,6.4648342,3.1534101,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(52,'node',11887512848,'Muskat Hospital','9 Abbi Street By Rasaq Bstop Off Bishiri Ajangbadi Ojo','Lagos',NULL,6.4616534,3.1538205,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(53,'node',11887518928,'Vineyard Convalescent Hospital',NULL,'Lagos',NULL,6.4593733,3.1405167,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(54,'node',11887518929,'Edo Convalescent Homeclinic And Easy Delivery',NULL,'Lagos',NULL,6.4575930,3.1535174,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(55,'node',11887518930,'Munidola Maternity Center',NULL,'Lagos',NULL,6.4534686,3.1439942,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(56,'node',11887518931,'Grace Mobolaji Maternity',NULL,'Lagos',NULL,6.4547106,3.1392762,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(57,'node',11887518933,'Summy Indeel Laboratary',NULL,'Lagos',NULL,6.4584845,3.1313610,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(58,'node',11887555938,'Healing Land Hospital And Maternity',NULL,'Lagos',NULL,6.4603501,3.1401533,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(59,'node',11888950304,'Primary Health Center Ese Ofin Riverine',NULL,'Lagos',NULL,6.4438890,3.1465262,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(60,'node',11888969820,'Irewe Primary Care Health Center Osulu Kingdom',NULL,'Lagos',NULL,6.4181773,3.1449088,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(61,'node',11889023436,'Chidove Homoeopathic Medical Center',NULL,'Lagos',NULL,6.4870651,3.1653258,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(62,'node',11889023437,'Mainframe Hospital And Maternity Centre',NULL,'Lagos',NULL,6.4864475,3.1736923,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(63,'node',11889023438,'Divine Favour Maternity Center Adoloko',NULL,'Lagos',NULL,6.4780452,3.1587236,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(64,'node',11889023439,'Emmanuel Power Hospital',NULL,'Lagos',NULL,6.4761770,3.1628032,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(65,'node',11889023440,'Abodunrin Medical Center',NULL,'Lagos',NULL,6.4711933,3.1783828,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(66,'node',11889023441,'Redeem Medical Center Annex',NULL,'Lagos',NULL,6.4709387,3.1616921,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(67,'node',11889023442,'Conner Stone Medical Center',NULL,'Lagos',NULL,6.4581407,3.1593271,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(68,'node',11889023443,'Okoko Central Hospital Jakande New Site',NULL,'Lagos',NULL,6.4675700,3.1800444,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(69,'node',11889023444,'Dikue Medical Centre',NULL,'Lagos',NULL,6.4647236,3.1720206,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(70,'node',11889023445,'Sabo Crown Hospital',NULL,'Lagos',NULL,6.4621438,3.1728575,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(71,'node',11889023446,'Garden Hospital Sabo Oniba Town',NULL,'Lagos',NULL,6.4617147,3.1753948,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(72,'node',11889023447,'Deelshaddai Health Canter Home',NULL,'Lagos',NULL,6.4587350,3.1770015,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(73,'node',11889046391,'Igbede Primary Health Center Igbede Bstop Ojo Igbede',NULL,'Lagos',NULL,6.4515789,3.1627616,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(74,'node',11889139972,'Blessed Mary Natural Clinic And Maternity',NULL,'Lagos',NULL,6.4648835,3.1889132,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(75,'node',11889139973,'Redeemed Medical Center',NULL,'Lagos',NULL,6.4665519,3.1816980,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(76,'node',11889139974,'Ifeoluwa Maternity Home',NULL,'Lagos',NULL,6.4669943,3.1853673,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(77,'node',11889139975,'Kena Hospital',NULL,'Lagos',NULL,6.4659549,3.1831571,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(78,'node',11889139976,'Kemberi Primary Health Center',NULL,'Lagos',NULL,6.4671796,3.1872247,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(79,'node',11889139977,'Kiladejo Hospital',NULL,'Lagos',NULL,6.4702271,3.1949793,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(80,'node',11889139978,'Okokomaiko Primary Health Care Board',NULL,'Lagos',NULL,6.4707042,3.1910831,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(81,'node',11889139979,'Hon C O Ojelabi Health Center Igbo Elerin',NULL,'Lagos',NULL,6.4821828,3.1882533,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(82,'node',11889139980,'Bossom Hospital And Maternity',NULL,'Lagos',NULL,6.4835473,3.1872851,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(83,'node',11889139981,'Bolus Coudlescent Center',NULL,'Lagos',NULL,6.4835926,3.1867862,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(84,'node',11889139982,'Ancel Hospital',NULL,'Lagos',NULL,6.4862936,3.1852627,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(85,'node',11889159163,'Fellowship Clinic And Maternity Center',NULL,'Lagos',NULL,6.4568267,3.2021928,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(86,'node',11889159164,'God\'s Goal Hospital',NULL,'Lagos',NULL,6.4560805,3.2022692,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(87,'node',11889159165,'Divine Release Maternity Home',NULL,'Lagos',NULL,6.4585040,3.1849846,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(88,'node',11889159166,'Genesis Health Center',NULL,'Lagos',NULL,6.4535725,3.1895582,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(89,'node',11889190332,'Bonne Fante Hospital',NULL,'Lagos',NULL,6.4590801,3.2290417,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(90,'node',11889190333,'Safe Healing Nursing Home',NULL,'Lagos',NULL,6.4592327,3.2229839,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(91,'node',11889190334,'Alexander Memorial Hospital Olugbemi Agric',NULL,'Lagos',NULL,6.4585031,3.2200912,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(92,'node',11889190335,'St David Med Center',NULL,'Lagos',NULL,6.4562244,3.2211815,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(93,'node',11889190336,'Tedi Primary Health Center Ojo',NULL,'Lagos',NULL,6.4463071,3.2276148,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(94,'node',11889190337,'Divine Gift Medical Centre Hospital',NULL,'Lagos',NULL,6.4457141,3.2218426,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(95,'node',11889190338,'New Nigeria Hospital',NULL,'Lagos',NULL,6.4445400,3.2142627,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(96,'node',11889212942,'MRS Hospital',NULL,'Lagos',NULL,6.4696408,3.2276791,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(97,'node',11889356823,'Oluwalogbon Medical Centre',NULL,'Lagos',NULL,6.5797385,3.0888936,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(98,'node',11889356824,'Blessed Trinity Hospital',NULL,'Lagos',NULL,6.5772458,3.0935238,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(99,'node',11889356825,'De Godswill Hospital',NULL,'Lagos',NULL,6.5764238,3.0914457,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(100,'node',11889356826,'Ojuoluwa Medical Centre',NULL,'Lagos',NULL,6.5657894,3.0814022,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(101,'node',11889356827,'Medics Clinical Venture',NULL,'Lagos',NULL,6.5610491,3.0790901,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(102,'node',11889378477,'Saving Grace Hospital',NULL,'Lagos',NULL,6.5882850,3.0805197,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(103,'node',11889378478,'Ketu Health Centre',NULL,'Lagos',NULL,6.5987137,3.0715866,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(104,'node',11889378479,'Odugbe Hosipal',NULL,'Lagos',NULL,6.6174031,3.0917099,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(105,'node',11889669564,'Egudu Health Center',NULL,'Lagos',NULL,6.5521424,3.0427006,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(106,'node',11889706143,'Nestle Nig Plc Staff Clinic',NULL,'Lagos',NULL,6.5011017,3.0874774,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(107,'node',11889706144,'Rophe Clinic',NULL,'Lagos',NULL,6.5061171,3.0885985,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(108,'node',11889706145,'Toluwalope Clinic and Maternity',NULL,'Lagos',NULL,6.5118040,3.0917206,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(109,'node',11889706146,'Rock Of Ages Hospital',NULL,'Lagos',NULL,6.5296453,3.0774298,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(110,'node',11889717157,'Agbara Primary Health Care Center',NULL,'Lagos',NULL,6.5041077,3.1024092,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(111,'node',11889717158,'Agbara Medical Center',NULL,'Lagos',NULL,6.5028899,3.1011794,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(112,'node',11889717159,'Sefa Hospital Clinic And Maternity',NULL,'Lagos',NULL,6.5039505,3.1009206,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(113,'node',11889743915,'Igbesa Primary Health Center',NULL,'Lagos',NULL,6.5276893,3.1341237,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(114,'node',11889743916,'Falola Clinic Medical',NULL,'Lagos',NULL,6.5242703,3.1363955,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(115,'node',11889743917,'Ikogbo Primary Health Center',NULL,'Lagos',NULL,6.5318571,3.1786939,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(116,'node',11889755182,'Falola Medical Clinic',NULL,'Lagos',NULL,6.5367869,3.1355050,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(117,'node',11889755183,'Olabaji Clinic',NULL,'Lagos',NULL,6.5406641,3.1293118,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(118,'node',11890813755,'Savelife Hospital Moshe',NULL,'Lagos',NULL,6.5615953,3.1885584,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(119,'node',11890813756,'Odan Abuja Primary Health Center',NULL,'Lagos',NULL,6.5781878,3.1754203,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(120,'node',11890939738,'Ilupewo Health Center',NULL,'Lagos',NULL,6.6798885,3.2520658,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(121,'node',11890939739,'Heaven Hospital Alagbado',NULL,'Lagos',NULL,6.6785672,3.2610545,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(122,'node',11890939740,'Agbado Okeodo Primary Health Center',NULL,'Lagos',NULL,6.6778665,3.2597651,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(123,'node',11890939741,'Oke Ilo Health Center',NULL,'Lagos',NULL,6.6727483,3.2541525,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(124,'node',11890939742,'New Merit Hospital Limited',NULL,'Lagos',NULL,6.6698558,3.2540560,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(125,'node',11890939743,'Taqwa Hospital',NULL,'Lagos',NULL,6.6669253,3.2510090,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(126,'node',11891069740,'Alaso Amikanle Primary Health Care Center',NULL,'Lagos',NULL,6.6503625,3.2446092,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(127,'node',11891069741,'First Wave Medical Center',NULL,'Lagos',NULL,6.6461751,3.2710310,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(128,'node',11891069742,'Crescent Hospital',NULL,'Lagos',NULL,6.6487001,3.2695994,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(129,'node',11891069743,'Agbenuba Health Centre',NULL,'Lagos',NULL,6.6499389,3.2622528,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(130,'node',11891069744,'Surulere Primary Health Care Center',NULL,'Lagos',NULL,6.6542615,3.2601178,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(131,'node',11891069745,'Cavesbury Private Hospital',NULL,'Lagos',NULL,6.6579913,3.2575589,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(132,'node',11891106130,'Raufmomic Health Care',NULL,'Lagos',NULL,6.6389225,3.2589068,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(133,'node',11891106131,'Realcare Hospitals',NULL,'Lagos',NULL,6.6298853,3.2598160,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(134,'node',11891106132,'Ehj Catholic Hospital',NULL,'Lagos',NULL,6.6424109,3.2690023,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(135,'node',11891106133,'God\'s Footstep Nursing Home',NULL,'Lagos',NULL,6.6446532,3.2637247,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(136,'node',11891106134,'Fueller Health Hospital',NULL,'Lagos',NULL,6.6442882,3.2617338,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(137,'node',11891106135,'Limad Hospital Ltd',NULL,'Lagos',NULL,6.6429134,3.2549036,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(138,'node',11891216324,'Glad Tidings Hospital',NULL,'Lagos',NULL,6.6140133,3.2597121,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(139,'node',11891216325,'Chrisol Medicals Maternity Home',NULL,'Lagos',NULL,6.6169781,3.2725672,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(140,'node',11891216326,'Lee Way Medical Center',NULL,'Lagos',NULL,6.6216393,3.2745172,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(141,'node',11891216327,'Double Crown Medical Diagnostic Service',NULL,'Lagos',NULL,6.6211997,3.2761587,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(142,'node',11891318391,'Agape Medical Centre',NULL,'Lagos',NULL,6.6070167,3.2582349,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(143,'node',11891318392,'Samas Hospital',NULL,'Lagos',NULL,6.6058117,3.2547547,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(144,'node',11891318393,'Quest Medical Diagnosis',NULL,'Lagos',NULL,6.6016119,3.2712241,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(145,'node',11891318394,'Daverhodes Clinic And Maternity Home',NULL,'Lagos',NULL,6.5986351,3.2680249,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(146,'node',11891318395,'Solad Medical Centre And Maternity Hospital',NULL,'Lagos',NULL,6.6005988,3.2675260,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(147,'node',11891318396,'The Ark Hospital And Maternity Centre',NULL,'Lagos',NULL,6.6063363,3.2543185,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(148,'node',11891318397,'St Monica Hospital',NULL,'Lagos',NULL,6.5931078,3.2337406,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(149,'node',11891318398,'Ayobo Primary Health Care Centre',NULL,'Lagos',NULL,6.6064245,3.2349466,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(150,'node',11891318399,'Abalamo Maternity Centre',NULL,'Lagos',NULL,6.6045967,3.2614629,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(151,'node',11891318400,'Ipaja Primary Health Centre',NULL,'Lagos',NULL,6.6043183,3.2542075,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(152,'node',11891318401,'Akinsayosikenu Hospital',NULL,'Lagos',NULL,6.6034870,3.2597543,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(153,'node',11891318402,'Prestige Medical Clinic 6a Aina Obembe Street Ipaja',NULL,'Lagos',NULL,6.6012063,3.2542571,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(154,'node',11891318403,'Banke Hospital',NULL,'Lagos',NULL,6.6007906,3.2461783,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(155,'node',11891318404,'Tofaan\'s Hopital',NULL,'Lagos',NULL,6.5990601,3.2453790,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(156,'node',11891318405,'Alanni Traditional Hospital and Maternity Home',NULL,'Lagos',NULL,6.5924456,3.2366082,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(157,'node',11891318406,'St Monica Hospital',NULL,'Lagos',NULL,6.5930637,3.2337812,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(158,'node',11891318407,'Crown Well Hospital Haggai Diagonistic Ltd',NULL,'Lagos',NULL,6.5950567,3.2280734,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(159,'node',11891318408,'Damilola Trado Medical Hospital And Maternity Home 7 Agbaje Street Off Olayinka Olatunji Street Orisunmbare Phase 1camp Davies Road Ayobo Lagos',NULL,'Lagos',NULL,6.5932476,3.2218279,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(160,'node',11891367969,'Amen Health Center',NULL,'Lagos',NULL,6.6341588,3.2809344,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(161,'node',11891367970,'Agbelekale Primary Health Care',NULL,'Lagos',NULL,6.6382431,3.2835267,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(162,'node',11891367971,'Araba Medical Center',NULL,'Lagos',NULL,6.6399389,3.2780269,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(163,'node',11891367972,'Sethfone Hospital And Maternity Home',NULL,'Lagos',NULL,6.6539671,3.2880637,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(164,'node',11891367973,'Merian Primary Health Care Center',NULL,'Lagos',NULL,6.6636458,3.2818276,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(165,'node',11891422227,'Victory Success Maternity Home',NULL,'Lagos',NULL,6.5856125,3.2456017,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(166,'node',11891422228,'Samas Hospital And Maternity',NULL,'Lagos',NULL,6.5843188,3.2472619,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(167,'node',11891422229,'Moyo Medical Center',NULL,'Lagos',NULL,6.5834316,3.2519504,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(168,'node',11891422230,'The Vine Medical Center',NULL,'Lagos',NULL,6.5835035,3.2462400,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(169,'node',11891422231,'St Joseph Eye Clinic',NULL,'Lagos',NULL,6.5801768,3.2390705,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(170,'node',11891422232,'Fend Clinic',NULL,'Lagos',NULL,6.5858003,3.2372761,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(171,'node',11891454363,'Ckc Hospital',NULL,'Lagos',NULL,6.5998114,3.3078946,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(172,'node',11891454364,'Crystal Specialist Hospital',NULL,'Lagos',NULL,6.6025838,3.3062249,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:21'),
(173,'node',11891454365,'Alimosho Health Centre',NULL,'Lagos',NULL,6.6003776,3.3003455,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(174,'node',11891454366,'Moria Clinic And Maternity Home',NULL,'Lagos',NULL,6.6039200,3.3019200,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(175,'node',11891454367,'Light Hospital',NULL,'Lagos',NULL,6.6063486,3.2998091,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(176,'node',11891454368,'Tri Star Hospital',NULL,'Lagos',NULL,6.6056612,3.2974058,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(177,'node',11891476169,'Top Talent Hospital',NULL,'Lagos',NULL,6.6030774,3.2924813,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(178,'node',11891476170,'Prince And Princess Hospital',NULL,'Lagos',NULL,6.6049365,3.2860011,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(179,'node',11891476171,'Health Center Akinogun',NULL,'Lagos',NULL,6.6094899,3.2845768,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(180,'node',11891476172,'Rabban Medical Centre',NULL,'Lagos',NULL,6.6070360,3.2801820,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(181,'node',11891476173,'Good Land Medical Diagnosis',NULL,'Lagos',NULL,6.6090583,3.2856323,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(182,'node',11891476174,'Krowa Hospital',NULL,'Lagos',NULL,6.6121789,3.3015224,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(183,'node',11891476175,'Oki Primary Health',NULL,'Lagos',NULL,6.6153528,3.2959165,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(184,'node',11891476176,'St Alexander Hospital And Maternity Home',NULL,'Lagos',NULL,6.6146335,3.2960024,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(185,'node',11891476177,'Omosola Hospital',NULL,'Lagos',NULL,6.6170274,3.2970598,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(186,'node',11891476178,'Ogundimu Primary Health Care Centre',NULL,'Lagos',NULL,6.6240372,3.2914647,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(187,'node',11891476179,'Aboru Primary Health Centre',NULL,'Lagos',NULL,6.6244835,3.2821266,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(188,'node',11891476180,'Day Star Health Cares',NULL,'Lagos',NULL,6.6257207,3.2814148,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(189,'node',11891477754,'Royal Salvation Hospital',NULL,'Lagos',NULL,6.5914997,3.3064958,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(190,'node',11891477755,'Summit Hospital And Maternity Home',NULL,'Lagos',NULL,6.5942747,3.3042059,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(191,'node',11891477756,'Blue Sky Hospital',NULL,'Lagos',NULL,6.5924799,3.2903912,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(192,'node',11891477757,'Careway Hospital And Maternity',NULL,'Lagos',NULL,6.5925575,3.2898460,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(193,'node',11891477758,'Solik Hospital',NULL,'Lagos',NULL,6.5976066,3.2886860,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(194,'node',11891477759,'Rauf Aregbesola Flagship Pry Healthcare Center',NULL,'Lagos',NULL,6.5947583,3.2826617,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(195,'node',11891527761,'Isefun Primary Health Care Center',NULL,'Lagos',NULL,6.5798125,3.2074358,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(196,'node',11891527762,'Grace Point Medical Centre',NULL,'Lagos',NULL,6.5794284,3.2083780,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(197,'node',11891527763,'Oluwabamise Convalescent and Maternity Home',NULL,'Lagos',NULL,6.5779000,3.2068397,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(198,'node',11891527764,'Hope In God Faith Clinic and Maternity Home',NULL,'Lagos',NULL,6.5772432,3.2095313,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(199,'node',11891527765,'Cele Apata Community Health Center',NULL,'Lagos',NULL,6.5753227,3.2145410,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(200,'node',11915825149,'Orisunbare Primary Health Care Center',NULL,'Lagos',NULL,6.5699369,3.3029406,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(201,'node',11915825150,'Majesty Hospital',NULL,'Lagos',NULL,6.5776029,3.2822379,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(202,'node',11915825151,'Alimosho Local Goverment Egbe Idimu Lcda Health Center',NULL,'Lagos',NULL,6.5706350,3.2878263,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(203,'node',11915825152,'Basic Hospital',NULL,'Lagos',NULL,6.5719020,3.2920428,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(204,'node',11915825153,'Mary The Queen Hospital',NULL,'Lagos',NULL,6.5916809,3.2996616,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(205,'node',11915825154,'Life Anchor Hospital',NULL,'Lagos',NULL,6.5884595,3.2980522,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(206,'node',11915825155,'Shasha Medical Centre',NULL,'Lagos',NULL,6.5869794,3.3061163,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(207,'node',11915825156,'Emc Hospital and Maternity',NULL,'Lagos',NULL,6.5846413,3.3053452,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(208,'node',11915825157,'Mojol Hospital and Maternity Home',NULL,'Lagos',NULL,6.5853394,3.2971993,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(209,'node',11915885586,'Ogbomoshotedo Community Health Cetre',NULL,'Lagos',NULL,6.5749929,3.2582161,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(210,'node',11915885587,'Max Health Consultant Hospital Ltd',NULL,'Lagos',NULL,6.5776122,3.2631125,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(211,'node',11915885588,'Flora Hospital And Maternity',NULL,'Lagos',NULL,6.5760867,3.2641920,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(212,'node',11915885589,'Carelife Medical Centre',NULL,'Lagos',NULL,6.5796932,3.2790159,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(213,'node',11915885590,'Ajiboye Clinic And Maternity Home',NULL,'Lagos',NULL,6.5782184,3.2812281,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(214,'node',11915885591,'Pons Medicaldiagonistics',NULL,'Lagos',NULL,6.5774124,3.2816827,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(215,'node',11915885592,'Health Center Isheri Olofin',NULL,'Lagos',NULL,6.5768541,3.2805710,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(216,'node',11915885593,'Fellowship Hospital',NULL,'Lagos',NULL,6.5742322,3.2813971,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(217,'node',11915885594,'Dove Hospital',NULL,'Lagos',NULL,6.5658347,3.2560649,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(218,'node',11915885595,'Amuwo Mile 2 Primary Health Center',NULL,'Lagos',NULL,6.5622668,3.2696852,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(219,'node',11915885596,'Bluesea Hospital And Maternity',NULL,'Lagos',NULL,6.5579208,3.2803899,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(220,'node',11923506886,'Delife Hospital',NULL,'Lagos',NULL,6.5516654,3.2547252,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(221,'node',11923506887,'Elf Foundation Primary Health Centre',NULL,'Lagos',NULL,6.5523489,3.2691702,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(222,'node',11923506888,'Day Spring Hospital',NULL,'Lagos',NULL,6.5522916,3.2654285,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(223,'node',11923506889,'B Rock Convalescent And Maternity Home',NULL,'Lagos',NULL,6.5499121,3.2596993,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(224,'node',11923506890,'Broad Hospital And Maternity',NULL,'Lagos',NULL,6.5491753,3.2661326,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(225,'node',11923506891,'Ogunmoded Memorial Hospital And Maternity Home',NULL,'Lagos',NULL,6.5492845,3.2625411,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(226,'node',11923506892,'Primex Hospital',NULL,'Lagos',NULL,6.5486903,3.2607213,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(227,'node',11923506893,'Joba Diagnostic Medical Service',NULL,'Lagos',NULL,6.5475418,3.2623118,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(228,'node',11923506894,'Kamzone Medical Diagnostic',NULL,'Lagos',NULL,6.5467577,3.2645226,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(229,'node',11923506895,'Health Point Diagnostic',NULL,'Lagos',NULL,6.5464879,3.2657330,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(230,'node',11923506896,'Joas Medical Diagnostics',NULL,'Lagos',NULL,6.5458297,3.2725283,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(231,'node',11923506897,'Jones Specialist Hospital',NULL,'Lagos',NULL,6.5445120,3.2747278,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:21'),
(232,'node',11923506898,'Matcom Medical Diagnostic Service S',NULL,'Lagos',NULL,6.5397848,3.2562178,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(233,'node',11923506899,'Ohhbee Hospital',NULL,'Lagos',NULL,6.5411758,3.2802987,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(234,'node',11923506900,'Mt Sinai Hospital',NULL,'Lagos',NULL,6.5418846,3.2817471,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(235,'node',11923506901,'Mount Pisgah Hospital',NULL,'Lagos',NULL,6.5414103,3.2832599,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(236,'node',11923506902,'Holiness Hospital',NULL,'Lagos',NULL,6.5377516,3.2727282,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(237,'node',11923506903,'Agodo Primary Health Center',NULL,'Lagos',NULL,6.5320276,3.2793747,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(238,'node',11923596064,'Afonja Eye Clinic',NULL,'Lagos',NULL,6.5218187,3.2578003,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(239,'node',11923596065,'Best Option Healthcare And Maternity Home',NULL,'Lagos',NULL,6.5288645,3.2535544,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(240,'node',11923596066,'Cornell Health Laboratory Service',NULL,'Lagos',NULL,6.5287632,3.2589772,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(241,'node',11923596067,'Gg Able Medical Diaglab',NULL,'Lagos',NULL,6.5306096,3.2593922,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(242,'node',11923596068,'Faniyet Hospital',NULL,'Lagos',NULL,6.5302502,3.2599890,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(243,'node',11923599869,'Samadex Clinic',NULL,'Lagos',NULL,6.5293548,3.2662413,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(244,'node',11923599870,'Zephaniah Maternity Center',NULL,'Lagos',NULL,6.5295040,3.2709700,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(245,'node',11923599871,'Molabi Hospital',NULL,'Lagos',NULL,6.5230578,3.2705033,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(246,'node',11923604168,'Victory Life Medical Diagnostic',NULL,'Lagos',NULL,6.5157721,3.2552858,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(247,'node',11923639569,'Glory Of God Health Care Centre',NULL,'Lagos',NULL,6.5155549,3.2598013,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(248,'node',11923639570,'St Grace Natural Medical Clinic And Me Eternity',NULL,'Lagos',NULL,6.5067047,3.2618196,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(249,'node',11924945902,'Alimosho General Hospital',NULL,'Lagos',NULL,6.5613475,3.2511592,NULL,NULL,1,0,1,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(250,'node',11924945903,'Kent Hospital',NULL,'Lagos',NULL,6.5629783,3.2509768,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(251,'node',11924945904,'Shonowo Hospital',NULL,'Lagos',NULL,6.5639588,3.2504967,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(252,'node',11924945905,'Purpose Of God Clinic and Maternity',NULL,'Lagos',NULL,6.5682955,3.2460804,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(253,'node',11924945906,'Santamaria Hospital Annex',NULL,'Lagos',NULL,6.5649008,3.2394513,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(254,'node',11924945907,'Mount Moriah Hospital And Maternity',NULL,'Lagos',NULL,6.5626145,3.2245503,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(255,'node',11925010462,'Above Clinic Medical Centre',NULL,'Lagos',NULL,6.5389294,3.2547051,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(256,'node',11925010463,'Solvicaj Laboratory',NULL,'Lagos',NULL,6.5316332,3.2452530,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(257,'node',11925010464,'Noble Clinic',NULL,'Lagos',NULL,6.5369228,3.2432742,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(258,'node',11925010465,'Royal Jubille Hospital',NULL,'Lagos',NULL,6.5376956,3.2454595,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(259,'node',11925010466,'St White Shield Clinic',NULL,'Lagos',NULL,6.5389307,3.2454957,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(260,'node',11925010467,'Okey Madu Maternity Home',NULL,'Lagos',NULL,6.5482733,3.2476629,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(261,'node',11925010468,'Igando Diagnostic Center',NULL,'Lagos',NULL,6.5517854,3.2437402,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(262,'node',11925019769,'De Fairlane Hospital',NULL,'Lagos',NULL,6.5534201,3.2482168,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(263,'node',11925019770,'Afriglobal Medicare',NULL,'Lagos',NULL,6.5558743,3.2481632,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(264,'node',11925019771,'Cj Confidence Care',NULL,'Lagos',NULL,6.5588854,3.2452208,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(265,'node',11925019772,'Christ Apostolic Maternity Center',NULL,'Lagos',NULL,6.5608212,3.2369609,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(266,'node',11925019773,'Life Fount Medical Center',NULL,'Lagos',NULL,6.5569562,3.2268745,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(267,'node',11925030440,'Crusaints Hospital',NULL,'Lagos',NULL,6.5108920,3.2525982,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(268,'node',11925030441,'Ijegun Primary Health Care',NULL,'Lagos',NULL,6.5140412,3.2517278,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(269,'node',11925030442,'Olatemi Maternity Home',NULL,'Lagos',NULL,6.5139999,3.2521798,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(270,'node',11925030443,'Datam Conv Health Care Center',NULL,'Lagos',NULL,6.5225555,3.2506241,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(271,'node',11925030444,'Maciland Medical Center',NULL,'Lagos',NULL,6.5240758,3.2491449,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(272,'node',11925066632,'Ijagemo Primary Health Centre',NULL,'Lagos',NULL,6.5045281,3.2242063,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(273,'node',11925066633,'Adebek Maternity Home',NULL,'Lagos',NULL,6.5258492,3.2163817,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(274,'node',11925066634,'Pakal Medical Centre',NULL,'Lagos',NULL,6.5255295,3.2151418,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(275,'node',11925066635,'Hefamaa Laboratory',NULL,'Lagos',NULL,6.5276866,3.2143190,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(276,'node',11925066636,'Sholay Beauty World',NULL,'Lagos',NULL,6.5360594,3.2201421,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(277,'node',11925076786,'Winkoye Laboratory Service',NULL,'Lagos',NULL,6.5526647,3.2217327,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(278,'node',11925076787,'Vintage Hospital',NULL,'Lagos',NULL,6.5518107,3.2265379,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(279,'node',11925076788,'Egan Primary Health Care Center',NULL,'Lagos',NULL,6.5503741,3.2359591,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(280,'node',11925076789,'Santa Maria Hospital',NULL,'Lagos',NULL,6.5487316,3.2315496,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(281,'node',11925076790,'Marie Stopes Clinic General Medical Care And Laboratory',NULL,'Lagos',NULL,6.5405003,3.2236565,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(282,'node',11925076791,'Eldunamis Medical Center',NULL,'Lagos',NULL,6.5423682,3.2243002,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(283,'node',11925076792,'Bukz Clinical Diagnostic Center',NULL,'Lagos',NULL,6.5417960,3.2283443,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(284,'node',11925076793,'Divine Blessing Hospital',NULL,'Lagos',NULL,6.5401725,3.2306933,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(285,'node',11925076794,'Jubilee Health Center And Laboratory',NULL,'Lagos',NULL,6.5358509,3.2272104,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(286,'node',11925076795,'Betterlife Hospital',NULL,'Lagos',NULL,6.5341381,3.2367370,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(287,'node',11925076800,'Isuti Medical Centre',NULL,'Lagos',NULL,6.5517440,3.2188976,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(288,'node',11925076801,'Pelfik Clinic And Maternity Center',NULL,'Lagos',NULL,6.5494684,3.2182176,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(289,'node',11925076802,'Atinuke Tr Clinic And Maternity Home',NULL,'Lagos',NULL,6.5471541,3.2189526,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(290,'node',11925078331,'Roland Orthopedic Hospital',NULL,'Lagos',NULL,6.5326165,3.2367732,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(291,'node',11925078332,'Okerube Health Centre',NULL,'Lagos',NULL,6.5284168,3.2387862,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(292,'node',11925078333,'Ayodamola Health Careand Maternity Home',NULL,'Lagos',NULL,6.5228606,3.2381793,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(293,'node',11925139252,'Ojo Bala Ologunebi Trado And Maternity Clinic',NULL,'Lagos',NULL,6.4953240,3.2443987,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(294,'node',11925139253,'Ijedodo Primary Health Center',NULL,'Lagos',NULL,6.4983674,3.2474980,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(295,'node',11925914566,'Divine Nursin Hme',NULL,'Lagos',NULL,6.5265321,3.3417106,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(296,'node',11925914567,'Good Hope Hospital',NULL,'Lagos',NULL,6.5242730,3.3411077,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(297,'node',11925914568,'Salvation Hospital',NULL,'Lagos',NULL,6.5244768,3.3394776,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(298,'node',11925925645,'Femtab Hosp',NULL,'Lagos',NULL,6.5305420,3.3427982,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(299,'node',11925925646,'Divine Nursing Home',NULL,'Lagos',NULL,6.5289311,3.3443009,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(300,'node',11925925647,'Best Hospital',NULL,'Lagos',NULL,6.5284098,3.3442194,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(301,'node',11925925648,'Hammed Conwale Hospital',NULL,'Lagos',NULL,6.5278279,3.3444853,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(302,'node',11925925649,'Alafiatayo Hospital',NULL,'Lagos',NULL,6.5275561,3.3463696,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(303,'node',11925925650,'Isolo Road Primary Health Care Centre',NULL,'Lagos',NULL,6.5271883,3.3489398,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(304,'node',11925925651,'Saltak Consualtant Home',NULL,'Lagos',NULL,6.5276966,3.3511654,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(305,'node',11925925652,'Alhameed Conval Hospital',NULL,'Lagos',NULL,6.5255353,3.3548502,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(306,'node',11925925653,'Health Center Mushin',NULL,'Lagos',NULL,6.5249265,3.3546945,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(307,'node',11925925654,'Ogungbaiye Primary Health Centre',NULL,'Lagos',NULL,6.5253016,3.3533138,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(308,'node',11925925655,'Orisegun Med Center',NULL,'Lagos',NULL,6.5249139,3.3496660,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(309,'node',11925925656,'Saint Kizito Clinic',NULL,'Lagos',NULL,6.5208093,3.3516663,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(310,'node',11925925657,'Ajoke Clinic',NULL,'Lagos',NULL,6.5217154,3.3457218,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(311,'node',11925925658,'Labake Maternity Center',NULL,'Lagos',NULL,6.5214642,3.3443338,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(312,'node',11925925659,'Odus Health Center',NULL,'Lagos',NULL,6.5211178,3.3449507,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(313,'node',11925925660,'Awesome Grace Hospital',NULL,'Lagos',NULL,6.5208753,3.3449990,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(314,'node',11925925661,'Odus Specialist Clinic',NULL,'Lagos',NULL,6.5208353,3.3452511,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(315,'node',11925925662,'St Claire Specialist Clinic',NULL,'Lagos',NULL,6.5157248,3.3596589,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(316,'node',11925925663,'VNusamin Clinic',NULL,'Lagos',NULL,6.5153217,3.3602279,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(317,'node',11925925664,'A Aand A Medical Diagostic Center',NULL,'Lagos',NULL,6.5147048,3.3561402,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(318,'node',11925925665,'Aishat Specialist Hospital Limited',NULL,'Lagos',NULL,6.5192031,3.3512633,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:21'),
(319,'node',11925925666,'Ola Omoyenji Maternity Home',NULL,'Lagos',NULL,6.5174233,3.3473741,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(320,'node',11925925667,'Dela Nursing Home',NULL,'Lagos',NULL,6.5169846,3.3465520,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(321,'node',11925925668,'Betlem Hospital',NULL,'Lagos',NULL,6.5164769,3.3442801,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(322,'node',11925928169,'Risaaj Hospital And Medicure',NULL,'Lagos',NULL,6.5162677,3.3441272,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(323,'node',11925928170,'Alves Primary Health Center',NULL,'Lagos',NULL,6.5145596,3.3447448,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(324,'node',11925928171,'Mount Camel Hospital',NULL,'Lagos',NULL,6.5150139,3.3428961,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(325,'node',11925928172,'Belan Consultant Home',NULL,'Lagos',NULL,6.5143690,3.3415738,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(326,'node',11925959169,'Phonex Clinic',NULL,'Lagos',NULL,6.5240558,3.3391839,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(327,'node',11925959170,'Mary Anne Hospital',NULL,'Lagos',NULL,6.5211465,3.3392731,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(328,'node',11925959171,'Ilasa Health Centre',NULL,'Lagos',NULL,6.5201438,3.3375370,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(329,'node',11925959172,'Bethlem Hospital',NULL,'Lagos',NULL,6.5180852,3.3391947,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(330,'node',11925959173,'Zephaniah Maternity Center',NULL,'Lagos',NULL,6.5120852,3.3335714,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(331,'node',11925959174,'Dans Medical Hospital',NULL,'Lagos',NULL,6.5124986,3.3347318,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(332,'node',11925959175,'Itireijesha Primary Health Care',NULL,'Lagos',NULL,6.5099439,3.3372366,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(333,'node',11925959176,'Able God Hospital',NULL,'Lagos',NULL,6.5080359,3.3352411,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(334,'node',11925959177,'St Femos Conual Home',NULL,'Lagos',NULL,6.5090219,3.3294193,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(335,'node',11925959178,'Mountain Of Fire Hospital',NULL,'Lagos',NULL,6.5085142,3.3291002,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(336,'node',11925959179,'Able God Hospital Maternity',NULL,'Lagos',NULL,6.5041024,3.3317381,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(337,'node',11925959180,'Adetutu Clinic Ltd',NULL,'Lagos',NULL,6.5033136,3.3290130,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(338,'node',11925959181,'Am Hospital',NULL,'Lagos',NULL,6.5018372,3.3278207,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(339,'node',11925959182,'Bimtom Hospital',NULL,'Lagos',NULL,6.4995393,3.3273024,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(340,'node',11925999039,'Crusaints Hospital',NULL,'Lagos',NULL,6.5425148,3.3599040,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(341,'node',11925999040,'Iyalode Bisoye',NULL,'Lagos',NULL,6.5453501,3.3596170,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(342,'node',11925999041,'Nidus Aquilae',NULL,'Lagos',NULL,6.5467730,3.3611874,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(343,'node',11925999042,'Grace Springs Med Clinic',NULL,'Lagos',NULL,6.5466145,3.3613430,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(344,'node',11925999043,'Coker Primary Health Center',NULL,'Lagos',NULL,6.5485278,3.3616461,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(345,'node',11925999044,'May Hospital Ilupeju',NULL,'Lagos',NULL,6.5483386,3.3594480,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(346,'node',11925999045,'Mary Anne Med Clinic',NULL,'Lagos',NULL,6.5488155,3.3597913,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(347,'node',11925999046,'Ufoma Specialist Hospital',NULL,'Lagos',NULL,6.5506195,3.3603492,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:21'),
(348,'node',11925999047,'Sharon Clinic',NULL,'Lagos',NULL,6.5536180,3.3603385,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(349,'node',11925999048,'Odonton Ville Dental Clinic',NULL,'Lagos',NULL,6.5572946,3.3640601,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(350,'node',11925999049,'Rosanna Clinic',NULL,'Lagos',NULL,6.5567563,3.3621597,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(351,'node',11925999050,'D2 Staff Clinic',NULL,'Lagos',NULL,6.5561301,3.3561650,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(352,'node',11925999051,'Glasmithkline Company Clinic',NULL,'Lagos',NULL,6.5546725,3.3544350,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(353,'node',11925999052,'Mecure Health Care',NULL,'Lagos',NULL,6.5530737,3.3466727,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(354,'node',11925999053,'Federal Medical Centre',NULL,'Lagos',NULL,6.5506968,3.3501414,NULL,NULL,1,0,1,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(355,'node',11925999054,'Federal Neuro Psychatric Hospital Oshodi',NULL,'Lagos',NULL,6.5482866,3.3486508,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(356,'node',11925999055,'Ladipo',NULL,'Lagos',NULL,6.5477523,3.3449507,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(357,'node',11925999056,'Goodhope Clinic and Maternity',NULL,'Lagos',NULL,6.5444854,3.3442560,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(358,'node',11926018050,'Regina Mundi Catholic Hospital',NULL,'Lagos',NULL,6.5272869,3.3555561,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(359,'node',11926018051,'Rally Hospital',NULL,'Lagos',NULL,6.5414382,3.3624615,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(360,'node',11926018052,'Ultima Medical Hospital',NULL,'Lagos',NULL,6.5405376,3.3666913,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(361,'node',11926018053,'Tolajide Health Centre',NULL,'Lagos',NULL,6.5289577,3.3567122,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(362,'node',11926018054,'Mojide Specialist Hospital',NULL,'Lagos',NULL,6.5392252,3.3640051,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:21'),
(363,'node',11926018055,'Fafty Clinic',NULL,'Lagos',NULL,6.5389614,3.3634472,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(364,'node',11926018056,'Omo Medical Health Center',NULL,'Lagos',NULL,6.5388068,3.3637798,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(365,'node',11926018057,'Fountain Of Grace Hospital',NULL,'Lagos',NULL,6.5374078,3.3502775,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(366,'node',11926018058,'Fafolu Mga Center',NULL,'Lagos',NULL,6.5374718,3.3547944,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(367,'node',11926018059,'Ebenezer Specialist Clinic and Maternity',NULL,'Lagos',NULL,6.5390013,3.3548588,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(368,'node',11926018060,'Merit Medical Clinic',NULL,'Lagos',NULL,6.5367736,3.3534291,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(369,'node',11926018061,'Olutoba Clinic',NULL,'Lagos',NULL,6.5298238,3.3544578,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(370,'node',11926018062,'Heritage Hospital',NULL,'Lagos',NULL,6.5335679,3.3562991,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(371,'node',11926018063,'Fafolu Clinic and Maternity Home',NULL,'Lagos',NULL,6.5346151,3.3553952,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(372,'node',11926018064,'Calvaty Med Center',NULL,'Lagos',NULL,6.5356144,3.3518936,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(373,'node',11926018065,'Divine Favour Maternity Home',NULL,'Lagos',NULL,6.5343546,3.3525172,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(374,'node',11926018066,'Merit Medical Centre Ojuwoyw',NULL,'Lagos',NULL,6.5328270,3.3527331,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(375,'node',11926018067,'Ayatuga Health Care',NULL,'Lagos',NULL,6.5331068,3.3540541,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(376,'node',11926018068,'Ayantuga Primary Health Centre',NULL,'Lagos',NULL,6.5331175,3.3552021,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(377,'node',11926103969,'Kayode Health Center Onipanu',NULL,'Lagos',NULL,6.5326059,3.3646367,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(378,'node',11926103970,'Legus Specialist Hospital',NULL,'Lagos',NULL,6.5307818,3.3658692,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:21'),
(379,'node',11926103971,'Redeemtion Medical Clinic',NULL,'Lagos',NULL,6.5288085,3.3585763,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(380,'node',11926103972,'Continental Hospital And Maternity Home',NULL,'Lagos',NULL,6.5281423,3.3587185,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(381,'node',11926103973,'Kajla Primary Health Center',NULL,'Lagos',NULL,6.5271457,3.3657673,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(382,'node',11926103974,'Jag-Bon Medical Center',NULL,'Lagos',NULL,6.5203130,3.3670950,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(383,'node',11926103975,'Bm Hospital',NULL,'Lagos',NULL,6.5211258,3.3648741,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(384,'node',11926103976,'Debof Clinicks Ltd',NULL,'Lagos',NULL,6.5381459,3.3455354,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(385,'node',11926103977,'Oluwalase Clinic',NULL,'Lagos',NULL,6.5387948,3.3438456,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(386,'node',11926103978,'Palm Avenue Primary Health Centre',NULL,'Lagos',NULL,6.5365284,3.3498108,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(387,'node',11926103979,'New Bethsaida Hospital Maternity',NULL,'Lagos',NULL,6.5363019,3.3506745,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(388,'node',11926103980,'Cedar Clinic',NULL,'Lagos',NULL,6.5326445,3.3477120,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(389,'node',11926103981,'Mercy Maternity Center',NULL,'Lagos',NULL,6.5342301,3.3460906,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(390,'node',11926103982,'Diamond Clinic',NULL,'Lagos',NULL,6.5340715,3.3465788,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(391,'node',11926103983,'Hillstar Hospital',NULL,'Lagos',NULL,6.5343460,3.3448541,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(392,'node',11926103984,'Canvalescent And Health Care Center',NULL,'Lagos',NULL,6.5340462,3.3447012,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(393,'node',11926103985,'Nature Hospital',NULL,'Lagos',NULL,6.5313441,3.3476704,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(394,'node',11926103986,'John Vic Clinic',NULL,'Lagos',NULL,6.5319503,3.3460061,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(395,'node',11926103987,'Mushin General Hospital',NULL,'Lagos',NULL,6.5315253,3.3462515,NULL,NULL,1,0,1,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(396,'node',11926103988,'Rembo Hospital',NULL,'Lagos',NULL,6.5318790,3.3437088,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(397,'node',11926103989,'St Andrew Hospital',NULL,'Lagos',NULL,6.5316625,3.3427352,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(398,'node',11926103990,'Huse Of Peace Specialist Clinic',NULL,'Lagos',NULL,6.5314473,3.3407323,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(399,'node',11926103991,'Sentinel Hospital',NULL,'Lagos',NULL,6.5328390,3.3419614,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(400,'node',11926103992,'Saint Claire Hospital Ltd',NULL,'Lagos',NULL,6.5365557,3.3396587,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(401,'node',11926103993,'Oluwadamilare Maternity Home',NULL,'Lagos',NULL,6.5348776,3.3391719,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(402,'node',11942279497,'The Lords Chosen Mission Hospital',NULL,'Lagos',NULL,6.4918275,3.3197781,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(403,'node',11942321671,'Olutope Nursing Home',NULL,'Lagos',NULL,6.4628607,3.3156368,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(404,'node',11942321672,'Clinic Healthcare',NULL,'Lagos',NULL,6.4725005,3.3119246,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(405,'node',11942321673,'Panox Hospital and Neurological Center',NULL,'Lagos',NULL,6.4708335,3.3042669,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(406,'node',11942321674,'Bogije Primary Health Center',NULL,'Lagos',NULL,6.4702591,3.3073488,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(407,'node',11942321675,'Cherith Hospital',NULL,'Lagos',NULL,6.4699606,3.3060667,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(408,'node',11942321676,'Zodiak Hospital',NULL,'Lagos',NULL,6.4677126,3.3122425,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(409,'node',11942321677,'Amc Hospital',NULL,'Lagos',NULL,6.4651954,3.3139665,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(410,'node',11942321678,'Hf Dental Eye Clinic',NULL,'Lagos',NULL,6.4592374,3.3057864,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(411,'node',11942321679,'Deoyefemi Clinic Block 4 Jakande Estate Mile 2',NULL,'Lagos',NULL,6.4641826,3.3064985,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(412,'node',11942321680,'Jes And Jes Mosque Road Jakande Estate',NULL,'Lagos',NULL,6.4631738,3.3117060,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(413,'node',11942321681,'Jeokem Hospital',NULL,'Lagos',NULL,6.4592507,3.3041798,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(414,'node',11942321682,'Safehands Medical Centre',NULL,'Lagos',NULL,6.4585418,3.3000143,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(415,'node',11942321683,'Blessed Assurance Maternity Home',NULL,'Lagos',NULL,6.4574570,3.3033389,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(416,'node',11942321684,'Adetunji Memorial Hospital',NULL,'Lagos',NULL,6.4562390,3.3063564,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(417,'node',11942350426,'Levan Hospital First Avenue G Close Festac Town',NULL,'Lagos',NULL,6.4701539,3.2957228,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(418,'node',11942350427,'Emel Specialist Hospital Festac Town',NULL,'Lagos',NULL,6.4756533,3.2894450,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:21'),
(419,'node',11942350428,'Pentecost Medical Center 112 Festac Town',NULL,'Lagos',NULL,6.4700939,3.2929105,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(420,'node',11942350429,'Praise Medical Center',NULL,'Lagos',NULL,6.4681010,3.2889321,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(421,'node',11942350430,'Faith Care Hospital',NULL,'Lagos',NULL,6.4683895,3.2864825,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(422,'node',11942350431,'Zodiac Hospital',NULL,'Lagos',NULL,6.4677386,3.2859307,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(423,'node',11942350432,'Holy Rosary Medical Center',NULL,'Lagos',NULL,6.4671383,3.2850033,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(424,'node',11942350433,'Godspower Specialist Clinic Hospital And Matanity',NULL,'Lagos',NULL,6.4666852,3.2859253,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(425,'node',11942350434,'Neb\'s Clinic and Health Care Service',NULL,'Lagos',NULL,6.4683509,3.2957791,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(426,'node',11942350435,'Sheperd Specialist Hospital',NULL,'Lagos',NULL,6.4649528,3.2984921,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:21'),
(427,'node',11942350436,'St Clements Hospital',NULL,'Lagos',NULL,6.4652274,3.2873248,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(428,'node',11942350437,'Royal Oak Hospital',NULL,'Lagos',NULL,6.4657777,3.2935488,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(429,'node',11942350438,'Lasapienza Hospital and Maternity',NULL,'Lagos',NULL,6.4646537,3.2952514,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(430,'node',11942350439,'St Judes Hospital Maternity',NULL,'Lagos',NULL,6.4633351,3.2955042,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(431,'node',11942350440,'Fravyn Maternity',NULL,'Lagos',NULL,6.4589649,3.2951535,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(432,'node',11942350441,'Common Sight Ltd',NULL,'Lagos',NULL,6.4589769,3.2959856,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(433,'node',11942350442,'Makal Medical Center',NULL,'Lagos',NULL,6.4577236,3.2941228,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(434,'node',11942350443,'Macfin Medical Clinic',NULL,'Lagos',NULL,6.4583206,3.2929346,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(435,'node',11942350444,'Agboju Primary Health Care Centre',NULL,'Lagos',NULL,6.4590935,3.2912824,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(436,'node',11942350445,'Golden Care Hospital',NULL,'Lagos',NULL,6.4581567,3.2867360,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(437,'node',11942350446,'Far East Maternity Center',NULL,'Lagos',NULL,6.4567894,3.2968748,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(438,'node',11942350447,'St Grace Nursing and Convascent Home',NULL,'Lagos',NULL,6.4556820,3.2927126,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(439,'node',11942350448,'Eromon Specialist Hospital',NULL,'Lagos',NULL,6.4522586,3.2916337,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:21'),
(440,'node',11942424908,'Pathcare Laboratories',NULL,'Lagos',NULL,6.4708521,3.2741618,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(441,'node',11942424909,'Linopmedical Laboratory Services',NULL,'Lagos',NULL,6.4706469,3.2740800,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(442,'node',11942424910,'Renue Clinic',NULL,'Lagos',NULL,6.4701285,3.2782991,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(443,'node',11942424911,'Primecare Hospital Festac',NULL,'Lagos',NULL,6.4690358,3.2780966,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(444,'node',11942424912,'De Marvel Hospitalsabo Crown Hospital',NULL,'Lagos',NULL,6.4645584,3.2714729,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(445,'node',11942424913,'Festac Primary Health Centre',NULL,'Lagos',NULL,6.4694543,3.2837695,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(446,'node',11942424914,'Golden Cross Hospital Festac',NULL,'Lagos',NULL,6.4681337,3.2833041,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(447,'node',11942424915,'Holy Family Catholic Church Medical Centre Festac',NULL,'Lagos',NULL,6.4683802,3.2830212,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(448,'node',11942424916,'The Hosanna Hospital',NULL,'Lagos',NULL,6.4675061,3.2840994,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(449,'node',11942424917,'Bethesda Family Clinic And Maternity',NULL,'Lagos',NULL,6.4632738,3.2838660,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(450,'node',11942424918,'Firstline Hospital Festac',NULL,'Lagos',NULL,6.4626635,3.2841249,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(451,'node',11942424919,'Elbethel Hospital',NULL,'Lagos',NULL,6.4568974,3.2766187,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(452,'node',11942424920,'Nigerian Navy Reference Hospital',NULL,'Lagos',NULL,6.4516509,3.2821199,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(453,'node',11970671716,'Igbologun Medical Centre',NULL,'Lagos',NULL,6.4206234,3.3325555,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(454,'node',11970671717,'Igbologun Primary Health Center Snake Island',NULL,'Lagos',NULL,6.4177241,3.3286428,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(455,'node',11970682230,'Nanti',NULL,'Lagos',NULL,6.4267238,3.3465493,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(456,'node',11975012213,'Oriom Clinic',NULL,'Lagos',NULL,6.4249233,3.2544288,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(457,'node',11975012214,'Outreach Medical Service',NULL,'Lagos',NULL,6.4213624,3.2454273,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(458,'node',11975012215,'Igbologun Medical Center',NULL,'Lagos',NULL,6.4137527,3.2523206,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(459,'node',11975020406,'Far East Medical Center',NULL,'Lagos',NULL,6.4223233,3.2743549,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(460,'node',11975050294,'Irede Primary Health Centre',NULL,'Lagos',NULL,6.4266452,3.2338093,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(461,'node',11975057900,'Iyagbe Maternity Centre',NULL,'Lagos',NULL,6.4182879,3.2002549,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(462,'node',11975079559,'Hilton Hospital',NULL,'Lagos',NULL,6.4485139,3.3206686,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(463,'node',11975079560,'Ibafon Primary Health Center',NULL,'Lagos',NULL,6.4432420,3.3307752,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(464,'node',11975079561,'St Joseph Mission Clinic',NULL,'Lagos',NULL,6.4462778,3.3109456,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(465,'node',11975079562,'The Point Clinic',NULL,'Lagos',NULL,6.4428902,3.3119468,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(466,'node',11975079563,'Aminat Convalesce Home',NULL,'Lagos',NULL,6.4416056,3.3120386,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(467,'node',11975079564,'Asheco Hospital',NULL,'Lagos',NULL,6.4388124,3.3118978,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(468,'node',11975117976,'Grace View Medical Center',NULL,'Lagos',NULL,6.4467495,3.2774971,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(469,'node',11975117977,'Jes 7 Jes Clinic Amuwo Housing',NULL,'Lagos',NULL,6.4481701,3.2798119,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(470,'node',11975119548,'Kexpress Clinic',NULL,'Lagos',NULL,6.4557813,3.2608929,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(471,'node',11975119549,'Dunamis House Medical Center',NULL,'Lagos',NULL,6.4557233,3.2619672,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(472,'node',11975119550,'Rhowil Total Care Medical Center',NULL,'Lagos',NULL,6.4532040,3.2625472,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(473,'node',11975119551,'Life Hope Multi Medical Center',NULL,'Lagos',NULL,6.4542575,3.2605657,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(474,'node',11975119552,'Shalom Riyyah Hospital And Maternity',NULL,'Lagos',NULL,6.4675367,3.2420866,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(475,'node',11975119553,'Norex Clinic',NULL,'Lagos',NULL,6.4651900,3.2417527,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(476,'node',11975119554,'Agbaju Primary Health Center',NULL,'Lagos',NULL,6.4531161,3.2454561,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(477,'node',11975119555,'Divine Care Neighborhood Clinic And Maternity Satellite Town',NULL,'Lagos',NULL,6.4529548,3.2520369,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(478,'node',11975119556,'Hopeland Hospital',NULL,'Lagos',NULL,6.4517575,3.2562956,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(479,'node',11975119557,'Outreach Specialist Hospital',NULL,'Lagos',NULL,6.4509872,3.2564941,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:21'),
(480,'node',11975119558,'Charles Henry Specialist Hospital',NULL,'Lagos',NULL,6.4486838,3.2566430,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:21'),
(481,'node',11975119559,'Irede Primary Health Center Riverine',NULL,'Lagos',NULL,6.4484100,3.2608272,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(482,'node',11975119560,'Satellite Town Primary Health Care Center',NULL,'Lagos',NULL,6.4497333,3.2646802,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(483,'node',11975127997,'Holy Family Hospital and Maternity Home',NULL,'Lagos',NULL,6.4457401,3.2614616,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(484,'node',11975127998,'Bengoz Maternity Home',NULL,'Lagos',NULL,6.4420493,3.2663083,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(485,'node',11975127999,'Irede Primary Health Center',NULL,'Lagos',NULL,6.4413071,3.2650986,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(486,'node',11975128000,'De Uzoma Clinic',NULL,'Lagos',NULL,6.4413204,3.2636301,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(487,'node',11975128001,'Orion Clinic',NULL,'Lagos',NULL,6.4345972,3.2592950,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(488,'node',11975219713,'Joycy Hospital Saka Adisa Street Abule Osun',NULL,'Lagos',NULL,6.4548372,3.2316582,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(489,'node',12281555810,'Good shepherd Catholic church hospital',NULL,'Lagos',NULL,6.6009752,3.4207899,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(490,'node',12281555811,'Barry Medical Clinic',NULL,'Lagos',NULL,6.6072503,3.4208514,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(491,'node',12281555812,'Layo clinic',NULL,'Lagos',NULL,6.6055412,3.4300369,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(492,'node',12281555813,'dan\'s medical centre hospital',NULL,'Lagos',NULL,6.6080355,3.4238430,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(493,'node',12281555814,'Ajegunle Primary Health care Centre',NULL,'Lagos',NULL,6.6072722,3.4310909,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(494,'node',12281555815,'vertiarg hospital',NULL,'Lagos',NULL,6.6068512,3.4149575,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(495,'node',12281555816,'calvary medical centre',NULL,'Lagos',NULL,6.6064179,3.4230459,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(496,'node',12281555817,'kingfield diagnostic services',NULL,'Lagos',NULL,6.6067410,3.4224352,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(497,'node',12282713900,'Lord\'s own medical center',NULL,'Lagos',NULL,6.5250008,3.2337858,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(498,'node',12282723401,'Babatunde Sanwo-Olu primary health care center Okerube',NULL,'Lagos',NULL,6.5285637,3.2388417,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(499,'node',12282723406,'Temitope faith clinic and maternity house',NULL,'Lagos',NULL,6.5204337,3.2372613,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(500,'node',12282723408,'Orthopedic hospital',NULL,'Lagos',NULL,6.5326196,3.2368086,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(501,'node',12282723410,'Better life Hospital',NULL,'Lagos',NULL,6.5290120,3.2370546,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(502,'node',13943367358,'Onyems-B.-Hospital','16 Oba Dauda Street','Lagos',NULL,6.4602978,3.2032677,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(503,'node',13943393311,'Elphy Specialist Hospital','6 Task Force Road','Lagos',NULL,6.4689964,3.1944073,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:21'),
(504,'node',13943621147,'De Marvel Sabo Crown Hospital',NULL,'Lagos',NULL,6.4634167,3.1730193,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(505,'node',13950795500,'Adebayo Living Tower Hospital','8 Adebayo Ojajuni Street, Off Kemuye Bus-Stop, Imeke-Badagry','Lagos','Imeke-Badagry',6.4357572,2.9836407,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(506,'node',13964436996,'Elite Eyes and Opticals','Q Mall, Plot 20 Lekki Beach Road Lekki peninsula II','Lagos','Lekki peninsula II',6.4321594,3.5091145,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(507,'way',392098411,'shalom la mains de dieu',NULL,'Lagos',NULL,6.6742164,2.7196247,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(508,'way',394119616,'Gbagada General Hospital',NULL,'Lagos',NULL,6.5524610,3.3869044,NULL,NULL,1,0,1,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(509,'way',525043228,'National Orthopaedic Hospital Igbobi',NULL,'Lagos',NULL,6.5314302,3.3706452,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(510,'way',556508170,'Gold Cross Hospital - Bourdillon','17B Bourdillon Road Lagos','Lagos','Lagos',6.4458508,3.4374230,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(511,'way',568367654,'Reddington Hospital - Ikeja GRA',NULL,'Lagos',NULL,6.5834582,3.3571576,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(512,'way',594743340,'Reddington Hospital','Idowu Martins Street','Lagos',NULL,6.4329787,3.4204157,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(513,'way',595195260,'Eye Foundation Hospital & Laser Centre',NULL,'Lagos',NULL,6.4395153,3.4562444,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(514,'way',643481485,'St. Kizito Clinic & Maternity Ward',NULL,'Lagos',NULL,6.4347517,3.5054285,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(515,'way',659370489,'Nigerian Police Hospital - Falomo',NULL,'Lagos',NULL,6.4428498,3.4290507,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(516,'way',672092174,'General Hospital Lagos',NULL,'Lagos',NULL,6.4474086,3.3966328,NULL,NULL,1,0,1,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(517,'way',704991085,'Lagos State University Teaching Hospital',NULL,'Lagos',NULL,6.5895386,3.3422014,NULL,NULL,1,0,1,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(518,'way',705800031,'Alimosho General Hospital Igando',NULL,'Lagos',NULL,6.5614643,3.2519734,NULL,NULL,1,0,1,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(519,'way',705859954,'Onikan Health Centre',NULL,'Lagos',NULL,6.4446953,3.4054336,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(520,'way',705874362,'St Nicholas Hospital',NULL,'Lagos',NULL,6.4492553,3.3976597,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(521,'way',705874363,'Lagos Island Maternity Hospital',NULL,'Lagos',NULL,6.4486491,3.3973883,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(522,'way',707003778,'Massey Street Children Hospital',NULL,'Lagos',NULL,6.4550636,3.3922468,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(523,'way',707257732,'Amuwo Odofin Maternal & Childcare Centre',NULL,'Lagos',NULL,6.4615407,3.3022453,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(524,'way',707258933,'Emel Hospital',NULL,'Lagos',NULL,6.4757329,3.2895368,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(525,'way',707848334,'Lagos University Teaching Hospital',NULL,'Lagos',NULL,6.5180383,3.3558835,NULL,NULL,1,0,1,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(526,'way',707941982,'Randle General Hospital',NULL,'Lagos',NULL,6.5081637,3.3575671,NULL,NULL,1,0,1,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(527,'way',735122001,'Badagry General Hospital',NULL,'Lagos',NULL,6.4145828,2.8972773,NULL,NULL,1,0,1,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(528,'way',742039132,'General Hospital Ikorodu',NULL,'Lagos',NULL,6.6085890,3.4998072,NULL,NULL,1,0,1,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(529,'way',745483984,'St Raphael Divine Mercy Specialist Hospital','Ijede Road','Lagos',NULL,6.6246837,3.5496019,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:21'),
(530,'way',746008852,'General Hospital Ijede',NULL,'Lagos',NULL,6.5647446,3.5965317,NULL,NULL,1,0,1,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(531,'way',785246570,'Primary Health Center, Badore',NULL,'Lagos',NULL,6.5094027,3.6114970,NULL,NULL,1,0,0,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(532,'way',787161781,'CENTRE DE SANTÉ D\'IFEANGI',NULL,'Lagos',NULL,6.6616315,2.7244023,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(533,'way',788305530,'Isolo General Hospital',NULL,'Lagos',NULL,6.5271861,3.3192544,NULL,NULL,1,0,1,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(534,'way',795018742,'Health Center',NULL,'Lagos',NULL,6.5924628,3.5224043,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(535,'way',795540036,'Glen Eagles Hospital','7 Oju Olobun Close Lagos','Lagos','Lagos',6.4278170,3.4151579,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(536,'way',795581891,'Lagos Emergency Operations Center',NULL,'Lagos',NULL,6.5113657,3.3710344,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(537,'way',802983686,'Medison Specialist Women\'s Hospital','18 Olatunji Moore Street lagos','Lagos','lagos',6.4285584,3.4642416,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(538,'way',803289541,'Lagos Health Center Harvey Road','Harvey Road','Lagos',NULL,6.5107918,3.3734426,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(539,'way',803294342,'Federal Psychiatric Hospital Yaba','Murtala Mohammed Way','Lagos',NULL,6.5099506,3.3731926,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(540,'way',803337410,'Ilogbo-Center Hospital',NULL,'Lagos',NULL,6.4647560,3.1532235,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(541,'way',803347476,'MARANATHA MEDICAL CENTER',NULL,'Lagos',NULL,6.5292043,3.3803186,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(542,'way',803349307,'St. LukeÃ¢Â€Â˜s medical center',NULL,'Lagos',NULL,6.4978539,3.3299951,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(543,'way',803362520,'Ayeitoro PHC',NULL,'Lagos',NULL,6.4927587,3.3874150,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(544,'way',803364243,'Federal Medical Centre',NULL,'Lagos',NULL,6.4841274,3.3806661,NULL,NULL,1,0,1,'2026-10-09 17:05:40','2026-10-09 17:06:28'),
(545,'way',888425357,'Abbey Medical Centre',NULL,'Lagos',NULL,6.4474224,3.3370055,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(546,'way',1267887514,'Verdic Life Care Hospital',NULL,'Lagos',NULL,6.4322132,3.4720577,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(547,'way',1272911129,'Medison Specialist Women\'s Hospital','18 Olatunji Moore Street lagos','Lagos','lagos',6.4284248,3.4642786,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40'),
(548,'way',1530842305,'Paelon Memorial Hospital',NULL,'Lagos',NULL,6.4226458,3.4151379,NULL,NULL,0,0,0,'2026-10-09 17:05:40','2026-10-09 17:05:40');
/*!40000 ALTER TABLE `hospitals` ENABLE KEYS */;
DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES
(1,'0001_01_01_000000_create_users_table',1),
(2,'0001_01_01_000001_create_cache_table',1),
(3,'0001_01_01_000002_create_jobs_table',1),
(4,'2026_02_21_134549_create_personal_access_tokens_table',1),
(5,'2026_02_21_150000_create_admin_users_table',1),
(6,'2026_02_21_150100_create_hospitals_table',1),
(7,'2026_02_21_150200_create_hospital_facilities_table',1),
(8,'2026_02_21_150300_create_hospital_specialties_table',1),
(9,'2026_02_21_150400_create_consultations_table',1),
(10,'2026_02_21_150500_create_consultation_messages_table',1),
(11,'2026_02_21_150600_create_audit_logs_table',1),
(12,'2026_02_21_171718_add_profile_fields_to_users_table',1),
(13,'2026_10_09_120000_add_emergency_contacts_to_users_table',1),
(14,'2026_10_09_130000_add_guest_access_to_consultations_table',1),
(15,'2026_10_09_140000_add_followup_and_feedback_to_consultations_table',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) unsigned NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `language` enum('EN','PIDGIN','YORUBA','HAUSA','IGBO') NOT NULL DEFAULT 'EN',
  `emergency_contact_name` varchar(255) DEFAULT NULL,
  `emergency_contact_phone` varchar(255) DEFAULT NULL,
  `emergency_contacts` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`emergency_contacts`)),
  `refresh_token_hash` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_phone_unique` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

