-- RAKE Web - MySQL şema ve örnek kayıtlar
-- cPanel phpMyAdmin kullanım:
-- 1) cPanel > MySQL Databases ile veritabanı ve kullanıcı oluşturun
-- 2) Kullanıcıyı veritabanına ALL PRIVILEGES ile bağlayın
-- 3) phpMyAdmin'de ilgili veritabanını seçin
-- 4) Import sekmesinden bu dosyayı yükleyin
--
-- Not: cPanel'de veritabanı adı genelde `cpanelkullanici_rake_db` şeklindedir.
-- Aşağıdaki CREATE DATABASE / USE satırlarını kendi adınıza göre düzenleyin
-- veya phpMyAdmin'de DB seçiliyse CREATE DATABASE / USE satırlarını silip sadece
-- tablo + INSERT kısmını import edin.
--
-- Mevcut (eski) tablo varsa: DROP TABLE applications; sonrası bu dosyayı import edin
-- veya aşağıdaki ALTER bloğunu (yorum satırlarını açarak) çalıştırın.

CREATE DATABASE IF NOT EXISTS `rake_db`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `rake_db`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `applications`;

CREATE TABLE `applications` (
  `id` VARCHAR(50) NOT NULL,
  `fullName` VARCHAR(255) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `department` VARCHAR(255) DEFAULT NULL,
  `team` VARCHAR(100) DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'Bekliyor',
  `notes` TEXT,
  `qReason` TEXT,
  `qCareer` TEXT,
  `qProgram` VARCHAR(255) DEFAULT NULL,
  `qClubs` TEXT,
  `qTime` VARCHAR(50) DEFAULT NULL,
  `qWeekend` TEXT,
  `qMekanikTasarim` TEXT,
  `qMekanikCad` TEXT,
  `qMekanikUretim` TEXT,
  `qYazilimDiller` TEXT,
  `qYazilimLinux` TEXT,
  `qYazilimRos` TEXT,
  `qYazilimGithub` VARCHAR(500) DEFAULT NULL,
  `qElektronikGomulu` TEXT,
  `qElektronikPcb` TEXT,
  `qElektronikDonanim` TEXT,
  `qOrgDeneyim` TEXT,
  `qOrgNeden` TEXT,
  `data` JSON DEFAULT NULL,
  `createdAt` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*
-- Eski şemadan yükseltme (veriyi koruyarak kolon eklemek için):
ALTER TABLE `applications`
  ADD COLUMN IF NOT EXISTS `department` VARCHAR(255) DEFAULT NULL AFTER `phone`,
  ADD COLUMN IF NOT EXISTS `qReason` TEXT AFTER `notes`,
  ADD COLUMN IF NOT EXISTS `qCareer` TEXT AFTER `qReason`,
  ADD COLUMN IF NOT EXISTS `qProgram` VARCHAR(255) DEFAULT NULL AFTER `qCareer`,
  ADD COLUMN IF NOT EXISTS `qClubs` TEXT AFTER `qProgram`,
  ADD COLUMN IF NOT EXISTS `qTime` VARCHAR(50) DEFAULT NULL AFTER `qClubs`,
  ADD COLUMN IF NOT EXISTS `qWeekend` TEXT AFTER `qTime`,
  ADD COLUMN IF NOT EXISTS `qMekanikTasarim` TEXT AFTER `qWeekend`,
  ADD COLUMN IF NOT EXISTS `qMekanikCad` TEXT AFTER `qMekanikTasarim`,
  ADD COLUMN IF NOT EXISTS `qMekanikUretim` TEXT AFTER `qMekanikCad`,
  ADD COLUMN IF NOT EXISTS `qYazilimDiller` TEXT AFTER `qMekanikUretim`,
  ADD COLUMN IF NOT EXISTS `qYazilimLinux` TEXT AFTER `qYazilimDiller`,
  ADD COLUMN IF NOT EXISTS `qYazilimRos` TEXT AFTER `qYazilimLinux`,
  ADD COLUMN IF NOT EXISTS `qYazilimGithub` VARCHAR(500) DEFAULT NULL AFTER `qYazilimRos`,
  ADD COLUMN IF NOT EXISTS `qElektronikGomulu` TEXT AFTER `qYazilimGithub`,
  ADD COLUMN IF NOT EXISTS `qElektronikPcb` TEXT AFTER `qElektronikGomulu`,
  ADD COLUMN IF NOT EXISTS `qElektronikDonanim` TEXT AFTER `qElektronikPcb`,
  ADD COLUMN IF NOT EXISTS `qOrgDeneyim` TEXT AFTER `qElektronikDonanim`,
  ADD COLUMN IF NOT EXISTS `qOrgNeden` TEXT AFTER `qOrgDeneyim`;
*/

INSERT INTO `applications` (
  `id`, `fullName`, `email`, `phone`, `department`, `team`, `status`, `notes`,
  `qReason`, `qCareer`, `qProgram`, `qClubs`, `qTime`, `qWeekend`,
  `qMekanikTasarim`, `qMekanikCad`, `qMekanikUretim`,
  `qYazilimDiller`, `qYazilimLinux`, `qYazilimRos`, `qYazilimGithub`,
  `qElektronikGomulu`, `qElektronikPcb`, `qElektronikDonanim`,
  `qOrgDeneyim`, `qOrgNeden`,
  `data`, `createdAt`
) VALUES
(
  '1785223344415',
  'Test User',
  'test@itu.edu.tr',
  NULL,
  NULL,
  'Mekanik',
  'Bekliyor',
  '',
  NULL, NULL, NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL,
  JSON_OBJECT(),
  '2026-07-28 07:22:24'
),
(
  '1785235484712',
  'Yusuf Zer Tuncer',
  'zertuncer@gmail.com',
  '05387309662',
  'PC',
  'Yazılım',
  'Kabul',
  '',
  'kk',
  'k',
  'Yaz Dönemi Stajı',
  'k',
  '3-4 gün',
  'k',
  '',
  '',
  '',
  'kk',
  'k',
  'k',
  'http://127.0.0.1:5500/index.html',
  '',
  '',
  '',
  '',
  '',
  JSON_OBJECT(),
  '2026-07-28 10:44:44'
),
(
  '1785249847618',
  'Yusuf Zer Tuncer',
  'zertuncer@gmail.com',
  '05387309662',
  'PC',
  'Mekanik',
  'Red',
  'sg',
  'eeeeeeeeeeeee',
  'e',
  'Work and Travel',
  'eee',
  '1 gün',
  'ee',
  'eeeeeeeeeee',
  'eeeeee',
  'eeeeeeeeeeeee',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  JSON_OBJECT(),
  '2026-07-28 14:44:07'
);

SET FOREIGN_KEY_CHECKS = 1;
