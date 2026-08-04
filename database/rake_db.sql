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
  `team` VARCHAR(100) DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'Bekliyor',
  `notes` TEXT,
  `data` JSON DEFAULT NULL,
  `createdAt` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `applications`
  (`id`, `fullName`, `email`, `phone`, `team`, `status`, `notes`, `data`, `createdAt`)
VALUES
  (
    '1785223344415',
    'Test User',
    'test@itu.edu.tr',
    NULL,
    'Mekanik',
    'Bekliyor',
    '',
    JSON_OBJECT(),
    '2026-07-28 07:22:24'
  ),
  (
    '1785235484712',
    'Yusuf Zer Tuncer',
    'zertuncer@gmail.com',
    '05387309662',
    'Yazılım',
    'Kabul',
    '',
    JSON_OBJECT(
      'department', 'PC',
      'qReason', 'kk',
      'qCareer', 'k',
      'qProgram', 'Yaz Dönemi Stajı',
      'qClubs', 'k',
      'qTime', '3-4 gün',
      'qWeekend', 'k',
      'qMekanikTasarim', '',
      'qMekanikCad', '',
      'qMekanikUretim', '',
      'qYazilimDiller', 'kk',
      'qYazilimLinux', 'k',
      'qYazilimRos', 'k',
      'qYazilimGithub', 'http://127.0.0.1:5500/index.html',
      'qElektronikGomulu', '',
      'qElektronikPcb', '',
      'qElektronikDonanim', '',
      'qOrgDeneyim', '',
      'qOrgNeden', ''
    ),
    '2026-07-28 10:44:44'
  ),
  (
    '1785249847618',
    'Yusuf Zer Tuncer',
    'zertuncer@gmail.com',
    '05387309662',
    'Mekanik',
    'Red',
    'sg',
    JSON_OBJECT(
      'department', 'PC',
      'qReason', 'eeeeeeeeeeeee',
      'qCareer', 'e',
      'qProgram', 'Work and Travel',
      'qClubs', 'eee',
      'qTime', '1 gün',
      'qWeekend', 'ee',
      'qMekanikTasarim', 'eeeeeeeeeee',
      'qMekanikCad', 'eeeeee',
      'qMekanikUretim', 'eeeeeeeeeeeee',
      'qYazilimDiller', '',
      'qYazilimLinux', '',
      'qYazilimRos', '',
      'qYazilimGithub', '',
      'qElektronikGomulu', '',
      'qElektronikPcb', '',
      'qElektronikDonanim', '',
      'qOrgDeneyim', '',
      'qOrgNeden', ''
    ),
    '2026-07-28 14:44:07'
  );

SET FOREIGN_KEY_CHECKS = 1;
