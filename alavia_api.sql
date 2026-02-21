-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 21, 2026 at 07:53 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `alavia_api`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_users`
--

CREATE TABLE `admin_users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('SUPERADMIN','STAFF') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `actor_type` varchar(255) DEFAULT NULL,
  `actor_id` bigint(20) UNSIGNED DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `entity` varchar(255) NOT NULL,
  `entity_id` bigint(20) UNSIGNED DEFAULT NULL,
  `meta_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`meta_json`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `consultations`
--

CREATE TABLE `consultations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `status` enum('ACTIVE','COMPLETED') NOT NULL DEFAULT 'ACTIVE',
  `severity` enum('LOW','MEDIUM','HIGH','CRITICAL') DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `summary_encrypted` longtext DEFAULT NULL,
  `recommended_specialty` varchar(255) DEFAULT NULL,
  `first_aid_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`first_aid_json`)),
  `warnings_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`warnings_json`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `consultations`
--

INSERT INTO `consultations` (`id`, `user_id`, `status`, `severity`, `category`, `summary_encrypted`, `recommended_specialty`, `first_aid_json`, `warnings_json`, `created_at`, `updated_at`) VALUES
(1, 1, 'ACTIVE', NULL, 'CHEST', NULL, NULL, NULL, NULL, '2026-02-21 16:22:04', '2026-02-21 16:23:30');

-- --------------------------------------------------------

--
-- Table structure for table `consultation_messages`
--

CREATE TABLE `consultation_messages` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `consultation_id` bigint(20) UNSIGNED NOT NULL,
  `role` enum('USER','AI') NOT NULL,
  `content_encrypted` longtext NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `consultation_messages`
--

INSERT INTO `consultation_messages` (`id`, `consultation_id`, `role`, `content_encrypted`, `created_at`, `updated_at`) VALUES
(1, 1, 'USER', 'sRsY4uPV7gVK0Kab3swVvqaHYXxZ9rCHDAgMnPe62panMPKeBER8NNENdLtI8ydx', '2026-02-21 16:22:04', '2026-02-21 16:22:04'),
(2, 1, 'AI', 'eVM45rsMc712gZ847gEZgMYV5JEmRKKF8SwBTBkwEnNgZSONcEE4pCAarW0iaGfRuTSzDqBRYWkn/xb3xq3MyA==', '2026-02-21 16:22:04', '2026-02-21 16:22:04'),
(3, 1, 'USER', 'CuOEXMJe0rsdyM30UlJpxj8C+U6YyYxoSu8qxEnrAZDt2hejGxJrf/z1QR+vWRq6', '2026-02-21 16:23:29', '2026-02-21 16:23:29'),
(4, 1, 'AI', 'ukQcxtU+6RMXWQLUmFpGK0i6BjzgGbtV8yjTO+X3QHm+5vzicyprKMYyjxCbseFKom0z+wR0lMR7CFeclfj3Qg==', '2026-02-21 16:23:30', '2026-02-21 16:23:30');

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hospitals`
--

CREATE TABLE `hospitals` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `osm_type` enum('node','way','relation') NOT NULL,
  `osm_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `state` varchar(255) NOT NULL DEFAULT 'Lagos',
  `lga` varchar(255) DEFAULT NULL,
  `lat` decimal(10,7) NOT NULL,
  `lng` decimal(10,7) NOT NULL,
  `rating` decimal(2,1) DEFAULT NULL,
  `rating_count` int(10) UNSIGNED DEFAULT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 0,
  `is_24_hours` tinyint(1) NOT NULL DEFAULT 0,
  `emergency_ready` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `hospitals`
--

INSERT INTO `hospitals` (`id`, `osm_type`, `osm_id`, `name`, `address`, `state`, `lga`, `lat`, `lng`, `rating`, `rating_count`, `is_public`, `is_24_hours`, `emergency_ready`, `created_at`, `updated_at`) VALUES
(1, 'node', 3995343800, 'MÉDICAL ILE OLA', NULL, 'Lagos', NULL, 6.7282992, 2.7794707, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(2, 'node', 3995347253, 'CLINIQUE FIFATIN', NULL, 'Lagos', NULL, 6.6465180, 2.7440626, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(3, 'node', 3995348029, 'ITA SIMBA', NULL, 'Lagos', NULL, 6.6962517, 2.7765953, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(4, 'node', 4248396090, 'Gramath Medical Center', NULL, 'Lagos', NULL, 6.6860919, 3.2477681, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(5, 'node', 4872475575, 'Rojafia Clinic', NULL, 'Lagos', NULL, 6.5929713, 3.3974544, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(6, 'node', 7334681885, 'Balogun Primary Healthcare Center.', 'Balogun Crescent', 'Lagos', NULL, 6.5906253, 3.2283304, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(7, 'node', 8813093194, 'Eti-Osa', NULL, 'Lagos', NULL, 6.4627777, 3.5852178, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(8, 'node', 10232587966, 'Pink Clinic Nigeria', '13b Muri Folami Street Ogudu', 'Lagos', 'Ogudu', 6.5760257, 3.3869161, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(9, 'node', 10980481851, 'Centre de santé de tchakou', NULL, 'Lagos', NULL, 6.4809833, 2.7087503, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(10, 'node', 11121934213, 'Safeway hospital', NULL, 'Lagos', NULL, 6.4731522, 3.6295577, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(11, 'node', 11121934221, 'Caremax Hospital', NULL, 'Lagos', NULL, 6.4736067, 3.6309711, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(12, 'node', 11121946405, 'Sangotedo Primary Health Care Center', NULL, 'Lagos', NULL, 6.4722606, 3.6325043, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(13, 'node', 11879397885, 'The Tent Wellness Centre', '13 Okunfolami Street Anthony Village', 'Lagos', 'Anthony Village', 6.5657924, 3.3722595, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(14, 'node', 11886853246, 'Grace Olambipo Clinic', NULL, 'Lagos', NULL, 6.5059412, 3.1702262, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(15, 'node', 11886853247, 'Isashi Primary Health Care Center', NULL, 'Lagos', NULL, 6.5023249, 3.1716183, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(16, 'node', 11886853248, 'Lagos State Ministry Of Health Belinda Convalscent And Fertility Centre', NULL, 'Lagos', NULL, 6.4997452, 3.1707680, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(17, 'node', 11886853249, 'Pioneer Medical Clinic', NULL, 'Lagos', NULL, 6.4955932, 3.1718919, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(18, 'node', 11886853250, 'Leverage Hospital Specialist Clinic', NULL, 'Lagos', NULL, 6.4955066, 3.1717899, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(19, 'node', 11886853251, 'Tower Of Glory Hospital', NULL, 'Lagos', NULL, 6.4964220, 3.1711113, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(20, 'node', 11886853252, 'Noble Medical Digonistic Centre', NULL, 'Lagos', NULL, 6.4922566, 3.1740108, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(21, 'node', 11886853253, 'Grace Land Medical Center', NULL, 'Lagos', NULL, 6.4902392, 3.1999826, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(22, 'node', 11886853254, 'Pa Clement Ogunsusi', NULL, 'Lagos', NULL, 6.4927656, 3.2000443, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(23, 'node', 11886853255, 'Adis Bunm Trado Medical Hospital And Maternity Home 14 Nnaema Uzor Street Off Summit Light Road', NULL, 'Lagos', NULL, 6.5029858, 3.2065956, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(24, 'node', 11886853256, 'Ndieze Homeopathic Medical Services 20 Drchiwumba Off Summit Light Road', NULL, 'Lagos', NULL, 6.5004514, 3.2067874, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(25, 'node', 11886853257, 'Wisdom Hospital And Maternity', NULL, 'Lagos', NULL, 6.5023249, 3.1982070, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(26, 'node', 11886853258, 'Betheland Hospital', NULL, 'Lagos', NULL, 6.4971682, 3.1964502, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(27, 'node', 11886996045, 'Ademola Medical Center', NULL, 'Lagos', NULL, 6.4944299, 3.1438789, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(28, 'node', 11886996046, 'Hyssop Eye Clinic', NULL, 'Lagos', NULL, 6.4943833, 3.1254360, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(29, 'node', 11886996047, 'Ore Ofe Hospital Ijanikin', NULL, 'Lagos', NULL, 6.4961688, 3.1253126, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(30, 'node', 11886996048, 'Femola Hospital', NULL, 'Lagos', NULL, 6.4943433, 3.1184435, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(31, 'node', 11886996049, 'Ijanikin Primary Health Care Center By Ile Oba Bstop Lagos Badagry Express Road', NULL, 'Lagos', NULL, 6.4974040, 3.1186245, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(32, 'node', 11886996050, 'Angelic Care Foundation Maternity', NULL, 'Lagos', NULL, 6.4937197, 3.1415319, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(33, 'node', 11886996051, 'Ever Life Hospital', NULL, 'Lagos', NULL, 6.4949056, 3.1394720, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(34, 'node', 11887050496, 'Era Primary Health Care Center', NULL, 'Lagos', NULL, 6.4769146, 3.1240956, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(35, 'node', 11887050497, 'Oriowo Maternity Home', NULL, 'Lagos', NULL, 6.4769579, 3.1232701, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(36, 'node', 11887050498, 'Goodness Medical Center', NULL, 'Lagos', NULL, 6.4607312, 3.1053704, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(37, 'node', 11887050499, 'Imude Primary Health Care Center', NULL, 'Lagos', NULL, 6.4666106, 3.1150451, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(38, 'node', 11887050500, 'Angelic Care Health Center 124 Adaloko Road By Pako Bstop', NULL, 'Lagos', NULL, 6.4768459, 3.1582180, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(39, 'node', 11887050501, 'Devital Care Hospital', NULL, 'Lagos', NULL, 6.4766967, 3.1423406, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(40, 'node', 11887050502, 'Denow Ayetoro Medical Center', NULL, 'Lagos', NULL, 6.4884476, 3.1539707, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(41, 'node', 11887050503, 'Ketu Medical Clinic', NULL, 'Lagos', NULL, 6.4869359, 3.1532773, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(42, 'node', 11887082163, 'Primary Health Building Dadiluwi Ilaje Riverine', NULL, 'Lagos', NULL, 6.4042557, 3.0292305, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(43, 'node', 11887087044, 'Taffi Awori Primary Health Centre', NULL, 'Lagos', NULL, 6.4078114, 3.0736023, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(44, 'node', 11887482478, 'Alhayat Hospital 2ekuweme Street Off Ogo Oluwa Street By Green And White Bus Stop', NULL, 'Lagos', NULL, 6.4730095, 3.1512415, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(45, 'node', 11887482479, 'God Cures Hospital', NULL, 'Lagos', NULL, 6.4700726, 3.1429884, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(46, 'node', 11887512842, 'Healing Land Hospital And Maternity', NULL, 'Lagos', NULL, 6.4601775, 3.1402270, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(47, 'node', 11887512843, 'Ejiwunmi Tradomedical', NULL, 'Lagos', NULL, 6.4670343, 3.1412986, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(48, 'node', 11887512844, 'Goodness Medical Services', NULL, 'Lagos', NULL, 6.4610151, 3.1443389, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(49, 'node', 11887512845, 'Shibiri Primary Health Centre', NULL, 'Lagos', NULL, 6.4617920, 3.1442732, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43'),
(50, 'node', 11887512846, 'Olutayo Nursing Home', NULL, 'Lagos', NULL, 6.4658497, 3.1529447, NULL, NULL, 0, 0, 0, '2026-02-21 14:06:43', '2026-02-21 14:06:43');

-- --------------------------------------------------------

--
-- Table structure for table `hospital_facilities`
--

CREATE TABLE `hospital_facilities` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `hospital_id` bigint(20) UNSIGNED DEFAULT NULL,
  `facility_name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `hospital_facilities`
--

INSERT INTO `hospital_facilities` (`id`, `hospital_id`, `facility_name`, `created_at`, `updated_at`) VALUES
(1, NULL, 'Ambulance', '2026-02-21 14:07:28', '2026-02-21 14:07:28'),
(2, NULL, 'Emergency Unit', '2026-02-21 14:07:28', '2026-02-21 14:07:28'),
(3, NULL, 'Laboratory', '2026-02-21 14:07:28', '2026-02-21 14:07:28'),
(4, NULL, 'Radiology', '2026-02-21 14:07:28', '2026-02-21 14:07:28'),
(5, NULL, 'Pharmacy', '2026-02-21 14:07:28', '2026-02-21 14:07:28'),
(6, NULL, 'Maternity Ward', '2026-02-21 14:07:28', '2026-02-21 14:07:28'),
(7, NULL, 'ICU', '2026-02-21 14:07:28', '2026-02-21 14:07:28');

-- --------------------------------------------------------

--
-- Table structure for table `hospital_specialties`
--

CREATE TABLE `hospital_specialties` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `hospital_id` bigint(20) UNSIGNED DEFAULT NULL,
  `specialty_name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `hospital_specialties`
--

INSERT INTO `hospital_specialties` (`id`, `hospital_id`, `specialty_name`, `created_at`, `updated_at`) VALUES
(1, NULL, 'Cardiology', '2026-02-21 14:07:28', '2026-02-21 14:07:28'),
(2, NULL, 'Emergency Medicine', '2026-02-21 14:07:28', '2026-02-21 14:07:28'),
(3, NULL, 'Pediatrics', '2026-02-21 14:07:28', '2026-02-21 14:07:28'),
(4, NULL, 'Obstetrics & Gynecology', '2026-02-21 14:07:28', '2026-02-21 14:07:28'),
(5, NULL, 'General Surgery', '2026-02-21 14:07:28', '2026-02-21 14:07:28'),
(6, NULL, 'Internal Medicine', '2026-02-21 14:07:28', '2026-02-21 14:07:28');

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

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
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2026_02_21_134549_create_personal_access_tokens_table', 1),
(5, '2026_02_21_150000_create_admin_users_table', 2),
(6, '2026_02_21_150100_create_hospitals_table', 2),
(7, '2026_02_21_150200_create_hospital_facilities_table', 2),
(8, '2026_02_21_150300_create_hospital_specialties_table', 2),
(9, '2026_02_21_150400_create_consultations_table', 2),
(10, '2026_02_21_150500_create_consultation_messages_table', 2),
(11, '2026_02_21_150600_create_audit_logs_table', 2),
(12, '2026_02_21_171718_add_profile_fields_to_users_table', 3);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'App\\Models\\User', 1, 'api', 'ead723ba3ffbaaf833d1a5795d921ca0e6506bda4c4ea1c7903ffe074fea51ba', '[\"*\"]', '2026-02-21 16:23:29', NULL, '2026-02-21 16:19:07', '2026-02-21 16:23:29');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `language` enum('EN','PIDGIN','YORUBA','HAUSA','IGBO') NOT NULL DEFAULT 'EN',
  `emergency_contact_name` varchar(255) DEFAULT NULL,
  `emergency_contact_phone` varchar(255) DEFAULT NULL,
  `refresh_token_hash` varchar(255) DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `phone`, `email_verified_at`, `password`, `language`, `emergency_contact_name`, `emergency_contact_phone`, `refresh_token_hash`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Jane Doe', 'jane@example.com', '+2348000000000', NULL, '$2y$12$7/InfMx7om2HMmBWfLc2Z.Oka/xlNcmMbcOF6BOsw2rqmoEl8.WVO', 'EN', 'John Doe', '+2348000000001', NULL, NULL, '2026-02-21 16:19:07', '2026-02-21 16:19:07');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_users`
--
ALTER TABLE `admin_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `admin_users_email_unique` (`email`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indexes for table `consultations`
--
ALTER TABLE `consultations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `consultations_user_id_foreign` (`user_id`);

--
-- Indexes for table `consultation_messages`
--
ALTER TABLE `consultation_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `consultation_messages_consultation_id_foreign` (`consultation_id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `hospitals`
--
ALTER TABLE `hospitals`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `hospitals_osm_type_osm_id_unique` (`osm_type`,`osm_id`);

--
-- Indexes for table `hospital_facilities`
--
ALTER TABLE `hospital_facilities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hospital_facilities_hospital_id_foreign` (`hospital_id`);

--
-- Indexes for table `hospital_specialties`
--
ALTER TABLE `hospital_specialties`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hospital_specialties_hospital_id_foreign` (`hospital_id`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD UNIQUE KEY `users_phone_unique` (`phone`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_users`
--
ALTER TABLE `admin_users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `consultations`
--
ALTER TABLE `consultations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `consultation_messages`
--
ALTER TABLE `consultation_messages`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `hospitals`
--
ALTER TABLE `hospitals`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `hospital_facilities`
--
ALTER TABLE `hospital_facilities`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `hospital_specialties`
--
ALTER TABLE `hospital_specialties`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `consultations`
--
ALTER TABLE `consultations`
  ADD CONSTRAINT `consultations_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `consultation_messages`
--
ALTER TABLE `consultation_messages`
  ADD CONSTRAINT `consultation_messages_consultation_id_foreign` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `hospital_facilities`
--
ALTER TABLE `hospital_facilities`
  ADD CONSTRAINT `hospital_facilities_hospital_id_foreign` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `hospital_specialties`
--
ALTER TABLE `hospital_specialties`
  ADD CONSTRAINT `hospital_specialties_hospital_id_foreign` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
