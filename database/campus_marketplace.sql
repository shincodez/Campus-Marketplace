-- NORSU Campus Marketplace database
-- Import into an empty database (e.g. with phpMyAdmin > Import).
-- Contains the tables, 9 categories, 3 accounts (password: password123) and 23 listings.


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
DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cart_items` (
  `user_id` int(10) unsigned NOT NULL,
  `listing_id` int(10) unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`user_id`,`listing_id`),
  KEY `idx_cart_listing` (`listing_id`),
  CONSTRAINT `fk_cart_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(40) NOT NULL,
  `slug` varchar(40) NOT NULL,
  `icon` varchar(40) NOT NULL DEFAULT 'layout-grid',
  `sort_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categories_slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Books','books','book-open',1),(2,'Electronics','electronics','laptop',2),(3,'Uniforms','uniforms','shirt',3),(4,'Supplies','supplies','pencil-ruler',4),(5,'Calculators','calculators','calculator',5),(6,'Sports','sports','dumbbell',6),(7,'Furniture','furniture','armchair',7),(8,'Accessories','accessories','headphones',8),(9,'Others','others','layout-grid',9);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `favorites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `favorites` (
  `user_id` int(10) unsigned NOT NULL,
  `listing_id` int(10) unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`user_id`,`listing_id`),
  KEY `idx_favorites_listing` (`listing_id`),
  CONSTRAINT `fk_favorites_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_favorites_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `favorites` WRITE;
/*!40000 ALTER TABLE `favorites` DISABLE KEYS */;
/*!40000 ALTER TABLE `favorites` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `listing_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `listing_images` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `listing_id` int(10) unsigned NOT NULL,
  `path` varchar(500) NOT NULL,
  `sort_order` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_images_listing` (`listing_id`,`sort_order`),
  CONSTRAINT `fk_images_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `listing_images` WRITE;
/*!40000 ALTER TABLE `listing_images` DISABLE KEYS */;
INSERT INTO `listing_images` VALUES (1,1,'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=80',0,'2026-10-05 06:07:11'),(2,2,'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80',0,'2026-10-05 06:07:11'),(3,3,'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=900&q=80',0,'2026-10-05 06:07:11'),(4,4,'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80',0,'2026-10-05 06:07:11'),(5,5,'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80',0,'2026-10-05 06:07:11'),(6,6,'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=900&q=80',0,'2026-10-05 06:07:11'),(7,7,'https://images.unsplash.com/photo-1564939558297-fc396f18e5c7?auto=format&fit=crop&w=900&q=80',0,'2026-10-05 06:07:11'),(8,8,'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=900&q=80',0,'2026-10-05 06:07:11'),(9,9,'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80',0,'2026-10-05 06:07:11'),(10,9,'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=900&q=80',1,'2026-10-05 06:07:11'),(11,10,'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=900&q=80',0,'2026-10-05 06:07:11'),(12,11,'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',0,'2026-10-05 06:07:11'),(13,11,'https://images.unsplash.com/photo-1585298723682-7115561c51b7?auto=format&fit=crop&w=900&q=80',1,'2026-10-05 06:07:11'),(14,12,'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',0,'2026-10-05 06:07:11'),(15,13,'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=80',0,'2026-10-05 06:07:11'),(16,14,'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=900&q=80',0,'2026-10-05 06:07:11'),(17,15,'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=900&q=80',0,'2026-10-05 06:07:11'),(18,16,'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80',0,'2026-10-05 06:07:11'),(19,17,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',0,'2026-10-05 06:07:11'),(20,18,'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=900&q=80',0,'2026-10-05 06:07:11'),(21,19,'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=900&q=80',0,'2026-10-05 06:07:11'),(22,20,'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80',0,'2026-10-05 06:07:11'),(23,21,'https://images.unsplash.com/photo-1587145820098-23e484e69816?auto=format&fit=crop&w=900&q=80',0,'2026-10-05 06:07:11'),(24,22,'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80',0,'2026-10-05 06:07:11'),(25,23,'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=900&q=80',0,'2026-10-05 06:07:11');
/*!40000 ALTER TABLE `listing_images` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `listings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `listings` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `category_id` int(10) unsigned NOT NULL,
  `title` varchar(80) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `item_condition` enum('New','Like New','Used - Good','Used - Fair') NOT NULL DEFAULT 'Used - Good',
  `location` varchar(80) NOT NULL,
  `fulfillment` enum('meetup','delivery') NOT NULL DEFAULT 'meetup',
  `meetup_location` varchar(80) DEFAULT NULL,
  `meetup_availability` varchar(80) DEFAULT NULL,
  `meetup_safety` varchar(80) DEFAULT NULL,
  `delivery_area` varchar(80) DEFAULT NULL,
  `delivery_fee` decimal(10,2) DEFAULT NULL,
  `delivery_payer` enum('buyer','seller','included') DEFAULT NULL,
  `delivery_notes` varchar(300) DEFAULT NULL,
  `status` enum('available','sold') NOT NULL DEFAULT 'available',
  `views` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_listings_status` (`status`,`created_at`),
  KEY `idx_listings_category` (`category_id`),
  KEY `idx_listings_user` (`user_id`),
  CONSTRAINT `fk_listings_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `fk_listings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `listings` WRITE;
/*!40000 ALTER TABLE `listings` DISABLE KEYS */;
INSERT INTO `listings` VALUES (1,1,2,'Wireless Earbuds','Wireless earbuds in good working condition. Includes the charging case and spare ear tips.',1200.00,'Used - Good','Near Student Center','meetup','Near Student Center','Weekdays · After 4 PM','Public campus location',NULL,NULL,NULL,NULL,'available',101,'2026-10-05 04:07:11','2026-10-08 19:05:37'),(2,1,2,'Mechanical Keyboard','Mechanical keyboard with RGB lighting and blue switches. Great for studying, programming and gaming.',1500.00,'Used - Good','Near Engineering','meetup','Near Engineering','Flexible','Public campus location',NULL,NULL,NULL,NULL,'available',124,'2026-10-04 06:07:11','2026-10-08 19:05:37'),(3,1,1,'Chemistry Book','General Chemistry reference book (11th edition). Some notes inside but all pages are complete.',300.00,'Used - Fair','Near Library','meetup','Near Library','Weekdays · 8 AM–5 PM','Public campus location',NULL,NULL,NULL,NULL,'available',58,'2026-10-02 06:07:11','2026-10-08 19:05:37'),(4,1,4,'Nike Backpack','Black Nike backpack with multiple compartments and a padded laptop sleeve. Good condition.',800.00,'Used - Good','Near Gate 2','delivery',NULL,NULL,NULL,'Within campus',30.00,'buyer','Delivery available after 4 PM on weekdays.','available',78,'2026-10-01 06:07:11','2026-10-08 19:05:37'),(5,1,3,'Gray Hoodie','Comfortable gray university hoodie. Medium size and lightly used.',400.00,'Like New','Near Gate 3','meetup','Near Main Gate','Weekdays · After 4 PM','Public campus location',NULL,NULL,NULL,NULL,'available',50,'2026-09-30 06:07:11','2026-10-08 19:05:37'),(6,1,5,'Scientific Calculator','Scientific calculator suitable for engineering, mathematics and science subjects. Exam approved.',600.00,'Used - Good','Near Library','meetup','Near Library','Flexible','Campus security area',NULL,NULL,NULL,NULL,'available',97,'2026-09-29 06:07:11','2026-10-08 19:05:37'),(7,1,5,'Desktop Printing Calculator','Printing calculator for accounting and business subjects. Comes with a spare paper roll.',500.00,'Like New','Near Library','meetup','Near Library','Weekdays · 8 AM–5 PM','Public campus location',NULL,NULL,NULL,NULL,'available',23,'2026-09-28 06:07:11','2026-10-08 19:05:37'),(8,1,1,'Calculus Textbook','Calculus textbook with worked examples and exercises for first-year college students.',230.00,'Used - Good','Near Engineering','meetup','Near Engineering','Flexible','Public campus location',NULL,NULL,NULL,NULL,'available',51,'2026-09-27 06:07:11','2026-10-08 19:05:37'),(9,1,2,'13\" Laptop for Students','Lightweight 13-inch laptop, 8 GB RAM, 256 GB SSD. Battery lasts about 6 hours. Charger included.',18500.00,'Used - Good','Near Student Center','meetup','Near Student Center','Weekdays · After 4 PM','Campus security area',NULL,NULL,NULL,NULL,'available',224,'2026-10-05 05:37:11','2026-10-08 19:10:34'),(10,1,2,'Wireless Mouse','Quiet-click wireless mouse with USB receiver. Used for one semester.',350.00,'Like New','Near Engineering','meetup','Near Engineering','Flexible','Public campus location',NULL,NULL,NULL,NULL,'available',34,'2026-09-26 06:07:11','2026-10-08 19:05:37'),(11,1,8,'Over-ear Headphones','Closed-back over-ear headphones with great noise isolation for the library.',1100.00,'Used - Good','Near Student Center','delivery',NULL,NULL,NULL,'Campus + nearby area',50.00,'buyer','Can deliver around campus on weekends.','available',74,'2026-09-25 06:07:11','2026-10-08 19:05:37'),(12,1,8,'Smartwatch','Smartwatch with step tracking and notifications. Includes a spare white strap.',2200.00,'Used - Good','Near Main Gate','meetup','Near Main Gate','Weekends','Campus security area',NULL,NULL,NULL,NULL,'available',58,'2026-09-24 06:07:11','2026-10-08 19:05:37'),(13,1,6,'Basketball','Official size 7 basketball. Good grip, holds air well.',450.00,'Used - Fair','Near Gate 3','meetup','Near Main Gate','Weekdays · After 4 PM','Public campus location',NULL,NULL,NULL,NULL,'available',19,'2026-09-23 06:07:11','2026-10-08 19:05:37'),(14,1,6,'Running Shoes','Lightweight running shoes, US size 9. Worn a handful of times.',1300.00,'Like New','Near Gate 2','meetup','Near Main Gate','Flexible','Public campus location',NULL,NULL,NULL,NULL,'available',41,'2026-09-22 06:07:11','2026-10-08 19:05:37'),(15,1,7,'Study Chair','Ergonomic study chair with soft seat. Perfect for dorm rooms.',900.00,'Used - Good','Near Main Gate','delivery',NULL,NULL,NULL,'Within campus',0.00,'seller','Free delivery within campus.','available',27,'2026-09-21 06:07:11','2026-10-08 19:05:37'),(16,1,7,'Desk Lamp','Adjustable desk lamp with warm light. Bulb included.',450.00,'Used - Good','Near Library','meetup','Near Library','Weekdays · 8 AM–5 PM','Public campus location',NULL,NULL,NULL,NULL,'available',30,'2026-09-20 06:07:11','2026-10-08 19:05:37'),(17,1,3,'White PE Shirt','Brand new white PE shirt, size M. Bought the wrong size.',250.00,'New','Near Gate 2','meetup','Near Student Center','Weekdays · After 4 PM','Public campus location',NULL,NULL,NULL,NULL,'available',14,'2026-10-03 06:07:11','2026-10-08 19:05:37'),(18,1,4,'Spiral Notebooks (Set of 5)','Five unused spiral notebooks, 80 leaves each.',150.00,'New','Near Library','meetup','Near Library','Flexible','Public campus location',NULL,NULL,NULL,NULL,'available',9,'2026-09-29 06:07:11','2026-10-08 19:05:37'),(19,1,9,'Acoustic Guitar','Full-size acoustic guitar with gig bag. Great for beginners.',3500.00,'Used - Good','Near Student Center','meetup','Near Student Center','Weekends','Public campus location',NULL,NULL,NULL,NULL,'available',66,'2026-09-19 06:07:11','2026-10-08 19:05:37'),(20,1,1,'Business Books Bundle','Bundle of six business and startup books. Great for entrepreneurship electives.',650.00,'Used - Good','Near Library','meetup','Near Library','Flexible','Public campus location',NULL,NULL,NULL,NULL,'available',24,'2026-09-18 06:07:11','2026-10-08 19:05:37'),(21,1,2,'64 GB USB Flash Drive','Fast USB 3.0 flash drive. Wiped and ready to use.',280.00,'Like New','Near Engineering','meetup','Near Engineering','Flexible','Public campus location',NULL,NULL,NULL,NULL,'available',13,'2026-09-17 06:07:11','2026-10-08 19:05:37'),(22,1,6,'Soccer Ball','Size 5 soccer ball, used for one season of intramurals.',300.00,'Used - Good','Near Gate 3','meetup','Near Main Gate','Weekdays · After 4 PM','Public campus location',NULL,NULL,NULL,NULL,'sold',42,'2026-09-10 06:07:11','2026-10-08 19:05:37'),(23,1,7,'Wooden Stool','Sturdy wooden stool, fits under most dorm desks.',350.00,'Used - Good','Near Gate 2','meetup','Near Gate 2','Flexible','Public campus location',NULL,NULL,NULL,NULL,'sold',18,'2026-09-07 06:07:11','2026-10-08 19:05:37');
/*!40000 ALTER TABLE `listings` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `messages` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `sender_id` int(10) unsigned NOT NULL,
  `recipient_id` int(10) unsigned NOT NULL,
  `listing_id` int(10) unsigned DEFAULT NULL,
  `body` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_by_sender` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_by_recipient` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_messages_pair` (`sender_id`,`recipient_id`,`created_at`),
  KEY `idx_messages_inbox` (`recipient_id`,`is_read`),
  KEY `fk_messages_listing` (`listing_id`),
  CONSTRAINT `fk_messages_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_messages_recipient` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `type` varchar(30) NOT NULL DEFAULT 'system',
  `title` varchar(120) NOT NULL,
  `body` varchar(255) NOT NULL DEFAULT '',
  `link` varchar(255) NOT NULL DEFAULT '',
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user` (`user_id`,`is_read`,`created_at`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `orders` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `listing_id` int(10) unsigned DEFAULT NULL,
  `buyer_id` int(10) unsigned NOT NULL,
  `seller_id` int(10) unsigned NOT NULL,
  `listing_title` varchar(80) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `status` enum('pending','completed','declined','cancelled') NOT NULL DEFAULT 'pending',
  `note` varchar(300) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_orders_buyer` (`buyer_id`,`status`),
  KEY `idx_orders_seller` (`seller_id`,`status`),
  KEY `idx_orders_listing` (`listing_id`),
  CONSTRAINT `fk_orders_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_orders_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_orders_seller` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `full_name` varchar(80) NOT NULL,
  `email` varchar(120) NOT NULL,
  `student_id` varchar(30) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `campus` varchar(80) NOT NULL DEFAULT 'Main Campus',
  `bio` varchar(280) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT 1,
  `notify_messages` tinyint(1) NOT NULL DEFAULT 1,
  `notify_orders` tinyint(1) NOT NULL DEFAULT 1,
  `notify_favorites` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  UNIQUE KEY `uq_users_student_id` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Maria Santos','maria.santos@campus.edu','2024-10001','$2y$10$JxK0z8lgZPk8qHqn2OuEC.s1KOPVof9ARtm/0X8gU4yB8nIvN55Mq','Main Campus',NULL,NULL,1,1,1,1,'2026-10-08 19:05:37','2026-10-08 19:05:37'),(2,'Paolo Villanueva','paolo.villanueva@campus.edu','2023-10002','$2y$10$JxK0z8lgZPk8qHqn2OuEC.s1KOPVof9ARtm/0X8gU4yB8nIvN55Mq','North Campus',NULL,NULL,1,1,1,1,'2026-10-08 19:05:37','2026-10-08 19:05:37'),(3,'Andrea Bautista','andrea.bautista@campus.edu','2025-10003','$2y$10$JxK0z8lgZPk8qHqn2OuEC.s1KOPVof9ARtm/0X8gU4yB8nIvN55Mq','South Campus',NULL,NULL,1,1,1,1,'2026-10-08 19:05:37','2026-10-08 19:05:37');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

