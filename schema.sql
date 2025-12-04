SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for inventory_stocks
-- ----------------------------
DROP TABLE IF EXISTS `inventory_stocks`;
CREATE TABLE `inventory_stocks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `kode_barang` varchar(50) NOT NULL,
  `warehouse_id` int(11) NOT NULL,
  `stok` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_stock` (`kode_barang`,`warehouse_id`),
  KEY `warehouse_id` (`warehouse_id`),
  CONSTRAINT `inventory_stocks_ibfk_1` FOREIGN KEY (`kode_barang`) REFERENCES `products` (`kode_barang`) ON DELETE CASCADE,
  CONSTRAINT `inventory_stocks_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- ----------------------------
-- Records of inventory_stocks
-- ----------------------------
BEGIN;
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (1, 'BRG001', 1, 19, '2025-12-04 06:51:08', '2025-12-04 11:58:53');
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (2, 'BRG002', 1, 75, '2025-12-04 06:51:08', '2025-12-04 14:13:40');
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (3, 'BRG003', 1, 32, '2025-12-04 06:51:08', '2025-12-04 11:37:16');
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (4, 'BRG004', 1, 15, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (5, 'BRG005', 1, 127, '2025-12-04 06:51:08', '2025-12-04 11:37:16');
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (6, 'BRG006', 1, 60, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (7, 'BRG007', 1, 41, '2025-12-04 06:51:08', '2025-12-04 11:37:16');
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (8, 'BRG013', 1, 200, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (9, 'BRG008', 2, 14, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (10, 'BRG009', 2, 16, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (11, 'BRG010', 2, 12, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (12, 'BRG011', 2, 40, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (13, 'BRG012', 2, 10, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (14, 'BRG014', 2, 100, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (15, 'BRG015', 2, 45, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (16, 'BRG001', 3, 8, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (17, 'BRG002', 3, 40, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (18, 'BRG003', 3, 15, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (19, 'BRG005', 3, 55, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (20, 'BRG007', 3, 19, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (21, 'BRG009', 3, 14, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (22, 'BRG011', 3, 50, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (23, 'test', 1, 5, '2025-12-04 10:25:37', '2025-12-04 10:26:02');
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (31, 'BRG008', 1, 14, '2025-12-04 11:37:16', '2025-12-04 11:37:16');
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (32, 'BRG009', 1, 30, '2025-12-04 11:37:16', '2025-12-04 11:37:16');
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (33, 'BRG010', 1, 12, '2025-12-04 11:37:17', '2025-12-04 11:37:17');
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (34, 'BRG011', 1, 90, '2025-12-04 11:37:17', '2025-12-04 11:37:17');
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (35, 'BRG012', 1, 10, '2025-12-04 11:37:17', '2025-12-04 11:37:17');
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (37, 'BRG014', 1, 100, '2025-12-04 11:37:17', '2025-12-04 11:37:17');
INSERT INTO `inventory_stocks` (`id`, `kode_barang`, `warehouse_id`, `stok`, `created_at`, `updated_at`) VALUES (38, 'BRG015', 1, 45, '2025-12-04 11:37:17', '2025-12-04 11:37:17');
COMMIT;

-- ----------------------------
-- Table structure for products
-- ----------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `kode_barang` varchar(50) NOT NULL,
  `nama_barang` varchar(255) NOT NULL,
  `kategori` varchar(100) DEFAULT NULL,
  `satuan` varchar(50) DEFAULT NULL,
  `stok_minimal` int(11) DEFAULT 0,
  `stok_saat_ini` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`kode_barang`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- ----------------------------
-- Records of products
-- ----------------------------
BEGIN;
INSERT INTO `products` (`kode_barang`, `nama_barang`, `kategori`, `satuan`, `stok_minimal`, `stok_saat_ini`, `created_at`, `updated_at`) VALUES ('BRG001', 'Laptop Dell XPS 13', 'Elektronik', 'Unit', 5, 27, '2025-12-04 06:51:08', '2025-12-04 11:58:53');
INSERT INTO `products` (`kode_barang`, `nama_barang`, `kategori`, `satuan`, `stok_minimal`, `stok_saat_ini`, `created_at`, `updated_at`) VALUES ('BRG002', 'Mouse Logitech M90', 'Aksesoris', 'Unit', 20, 115, '2025-12-04 06:51:08', '2025-12-04 14:13:40');
INSERT INTO `products` (`kode_barang`, `nama_barang`, `kategori`, `satuan`, `stok_minimal`, `stok_saat_ini`, `created_at`, `updated_at`) VALUES ('BRG003', 'Keyboard Mechanical', 'Aksesoris', 'Unit', 10, 32, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `products` (`kode_barang`, `nama_barang`, `kategori`, `satuan`, `stok_minimal`, `stok_saat_ini`, `created_at`, `updated_at`) VALUES ('BRG004', 'Monitor LG 24 inch', 'Elektronik', 'Unit', 8, 15, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `products` (`kode_barang`, `nama_barang`, `kategori`, `satuan`, `stok_minimal`, `stok_saat_ini`, `created_at`, `updated_at`) VALUES ('BRG005', 'Kabel HDMI 2m', 'Kabel', 'Pcs', 50, 127, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `products` (`kode_barang`, `nama_barang`, `kategori`, `satuan`, `stok_minimal`, `stok_saat_ini`, `created_at`, `updated_at`) VALUES ('BRG006', 'Flash Drive 32GB', 'Storage', 'Pcs', 30, 60, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `products` (`kode_barang`, `nama_barang`, `kategori`, `satuan`, `stok_minimal`, `stok_saat_ini`, `created_at`, `updated_at`) VALUES ('BRG007', 'SSD Samsung 500GB', 'Storage', 'Unit', 15, 41, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `products` (`kode_barang`, `nama_barang`, `kategori`, `satuan`, `stok_minimal`, `stok_saat_ini`, `created_at`, `updated_at`) VALUES ('BRG008', 'Router TP-Link AC1200', 'Network', 'Unit', 10, 14, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `products` (`kode_barang`, `nama_barang`, `kategori`, `satuan`, `stok_minimal`, `stok_saat_ini`, `created_at`, `updated_at`) VALUES ('BRG009', 'Webcam Logitech C920', 'Aksesoris', 'Unit', 12, 30, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `products` (`kode_barang`, `nama_barang`, `kategori`, `satuan`, `stok_minimal`, `stok_saat_ini`, `created_at`, `updated_at`) VALUES ('BRG010', 'Headset Sony WH-1000XM4', 'Audio', 'Unit', 8, 12, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `products` (`kode_barang`, `nama_barang`, `kategori`, `satuan`, `stok_minimal`, `stok_saat_ini`, `created_at`, `updated_at`) VALUES ('BRG011', 'Power Bank 20000mAh', 'Aksesoris', 'Unit', 25, 90, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `products` (`kode_barang`, `nama_barang`, `kategori`, `satuan`, `stok_minimal`, `stok_saat_ini`, `created_at`, `updated_at`) VALUES ('BRG012', 'Printer Canon G3010', 'Elektronik', 'Unit', 5, 10, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `products` (`kode_barang`, `nama_barang`, `kategori`, `satuan`, `stok_minimal`, `stok_saat_ini`, `created_at`, `updated_at`) VALUES ('BRG013', 'Kertas A4 80gsm', 'ATK', 'Rim', 100, 200, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `products` (`kode_barang`, `nama_barang`, `kategori`, `satuan`, `stok_minimal`, `stok_saat_ini`, `created_at`, `updated_at`) VALUES ('BRG014', 'Tinta Printer Black', 'Consumable', 'Botol', 40, 100, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `products` (`kode_barang`, `nama_barang`, `kategori`, `satuan`, `stok_minimal`, `stok_saat_ini`, `created_at`, `updated_at`) VALUES ('BRG015', 'Hub USB 4 Port', 'Aksesoris', 'Unit', 20, 45, '2025-12-04 06:51:08', '2025-12-04 06:51:08');
INSERT INTO `products` (`kode_barang`, `nama_barang`, `kategori`, `satuan`, `stok_minimal`, `stok_saat_ini`, `created_at`, `updated_at`) VALUES ('test', 'test', 'Aksesoris', 'Botol', 15, 5, '2025-12-04 09:32:04', '2025-12-04 10:26:02');
COMMIT;

-- ----------------------------
-- Table structure for stock_opname
-- ----------------------------
DROP TABLE IF EXISTS `stock_opname`;
CREATE TABLE `stock_opname` (
  `id_opname` int(11) NOT NULL AUTO_INCREMENT,
  `tanggal` date NOT NULL,
  `kode_barang` varchar(50) NOT NULL,
  `stok_sistem` int(11) NOT NULL,
  `stok_fisik` int(11) NOT NULL,
  `selisih` int(11) NOT NULL,
  `is_adjusted` tinyint(1) DEFAULT 0,
  `petugas` varchar(255) DEFAULT NULL,
  `catatan` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `warehouse_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_opname`),
  KEY `kode_barang` (`kode_barang`),
  KEY `warehouse_id` (`warehouse_id`),
  CONSTRAINT `stock_opname_ibfk_1` FOREIGN KEY (`kode_barang`) REFERENCES `products` (`kode_barang`),
  CONSTRAINT `stock_opname_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`),
  CONSTRAINT `stock_opname_ibfk_3` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- ----------------------------
-- Records of stock_opname
-- ----------------------------
BEGIN;
INSERT INTO `stock_opname` (`id_opname`, `tanggal`, `kode_barang`, `stok_sistem`, `stok_fisik`, `selisih`, `is_adjusted`, `petugas`, `catatan`, `created_at`, `warehouse_id`) VALUES (3, '2024-11-30', 'BRG005', 70, 72, 2, 1, 'Admin', 'Ada selisih lebih', '2025-12-04 06:51:08', 1);
INSERT INTO `stock_opname` (`id_opname`, `tanggal`, `kode_barang`, `stok_sistem`, `stok_fisik`, `selisih`, `is_adjusted`, `petugas`, `catatan`, `created_at`, `warehouse_id`) VALUES (4, '2024-12-01', 'BRG008', 14, 14, 0, 0, 'Petugas Gudang 2', 'Pengecekan rutin', '2025-12-04 06:51:08', 2);
INSERT INTO `stock_opname` (`id_opname`, `tanggal`, `kode_barang`, `stok_sistem`, `stok_fisik`, `selisih`, `is_adjusted`, `petugas`, `catatan`, `created_at`, `warehouse_id`) VALUES (5, '2024-12-01', 'BRG011', 42, 40, -2, 1, 'Petugas Gudang 2', 'Barang rusak', '2025-12-04 06:51:08', 2);
INSERT INTO `stock_opname` (`id_opname`, `tanggal`, `kode_barang`, `stok_sistem`, `stok_fisik`, `selisih`, `is_adjusted`, `petugas`, `catatan`, `created_at`, `warehouse_id`) VALUES (6, '2024-12-02', 'BRG001', 8, 8, 0, 0, 'Supervisor', 'OK', '2025-12-04 06:51:08', 3);
INSERT INTO `stock_opname` (`id_opname`, `tanggal`, `kode_barang`, `stok_sistem`, `stok_fisik`, `selisih`, `is_adjusted`, `petugas`, `catatan`, `created_at`, `warehouse_id`) VALUES (7, '2024-12-02', 'BRG007', 18, 19, 1, 1, 'Supervisor', 'Koreksi stok', '2025-12-04 06:51:08', 3);
COMMIT;

-- ----------------------------
-- Table structure for transactions_in
-- ----------------------------
DROP TABLE IF EXISTS `transactions_in`;
CREATE TABLE `transactions_in` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tanggal_masuk` date NOT NULL,
  `kode_barang` varchar(50) NOT NULL,
  `jumlah_masuk` int(11) NOT NULL,
  `gudang_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `penerima` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `kode_barang` (`kode_barang`),
  KEY `gudang_id` (`gudang_id`),
  CONSTRAINT `transactions_in_ibfk_1` FOREIGN KEY (`kode_barang`) REFERENCES `products` (`kode_barang`),
  CONSTRAINT `transactions_in_ibfk_2` FOREIGN KEY (`gudang_id`) REFERENCES `warehouses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- ----------------------------
-- Records of transactions_in
-- ----------------------------
BEGIN;
INSERT INTO `transactions_in` (`id`, `tanggal_masuk`, `kode_barang`, `jumlah_masuk`, `gudang_id`, `created_at`, `penerima`) VALUES (1, '2024-11-01', 'BRG001', 15, 1, '2025-12-04 06:51:08', NULL);
INSERT INTO `transactions_in` (`id`, `tanggal_masuk`, `kode_barang`, `jumlah_masuk`, `gudang_id`, `created_at`, `penerima`) VALUES (2, '2024-11-01', 'BRG002', 50, 1, '2025-12-04 06:51:08', NULL);
INSERT INTO `transactions_in` (`id`, `tanggal_masuk`, `kode_barang`, `jumlah_masuk`, `gudang_id`, `created_at`, `penerima`) VALUES (3, '2024-11-05', 'BRG003', 25, 1, '2025-12-04 06:51:08', NULL);
INSERT INTO `transactions_in` (`id`, `tanggal_masuk`, `kode_barang`, `jumlah_masuk`, `gudang_id`, `created_at`, `penerima`) VALUES (4, '2024-11-10', 'BRG004', 20, 1, '2025-12-04 06:51:08', NULL);
INSERT INTO `transactions_in` (`id`, `tanggal_masuk`, `kode_barang`, `jumlah_masuk`, `gudang_id`, `created_at`, `penerima`) VALUES (5, '2024-11-15', 'BRG005', 100, 1, '2025-12-04 06:51:08', NULL);
INSERT INTO `transactions_in` (`id`, `tanggal_masuk`, `kode_barang`, `jumlah_masuk`, `gudang_id`, `created_at`, `penerima`) VALUES (6, '2024-11-20', 'BRG006', 80, 1, '2025-12-04 06:51:08', NULL);
INSERT INTO `transactions_in` (`id`, `tanggal_masuk`, `kode_barang`, `jumlah_masuk`, `gudang_id`, `created_at`, `penerima`) VALUES (7, '2024-12-01', 'BRG007', 30, 1, '2025-12-04 06:51:08', NULL);
INSERT INTO `transactions_in` (`id`, `tanggal_masuk`, `kode_barang`, `jumlah_masuk`, `gudang_id`, `created_at`, `penerima`) VALUES (8, '2024-12-02', 'BRG013', 200, 1, '2025-12-04 06:51:08', NULL);
INSERT INTO `transactions_in` (`id`, `tanggal_masuk`, `kode_barang`, `jumlah_masuk`, `gudang_id`, `created_at`, `penerima`) VALUES (9, '2024-11-02', 'BRG008', 18, 2, '2025-12-04 06:51:08', NULL);
INSERT INTO `transactions_in` (`id`, `tanggal_masuk`, `kode_barang`, `jumlah_masuk`, `gudang_id`, `created_at`, `penerima`) VALUES (10, '2024-11-03', 'BRG009', 22, 2, '2025-12-04 06:51:08', NULL);
INSERT INTO `transactions_in` (`id`, `tanggal_masuk`, `kode_barang`, `jumlah_masuk`, `gudang_id`, `created_at`, `penerima`) VALUES (11, '2024-11-08', 'BRG010', 15, 2, '2025-12-04 06:51:08', NULL);
INSERT INTO `transactions_in` (`id`, `tanggal_masuk`, `kode_barang`, `jumlah_masuk`, `gudang_id`, `created_at`, `penerima`) VALUES (12, '2024-11-12', 'BRG011', 60, 2, '2025-12-04 06:51:08', NULL);
INSERT INTO `transactions_in` (`id`, `tanggal_masuk`, `kode_barang`, `jumlah_masuk`, `gudang_id`, `created_at`, `penerima`) VALUES (13, '2024-11-18', 'BRG012', 12, 2, '2025-12-04 06:51:08', NULL);
INSERT INTO `transactions_in` (`id`, `tanggal_masuk`, `kode_barang`, `jumlah_masuk`, `gudang_id`, `created_at`, `penerima`) VALUES (14, '2024-11-25', 'BRG014', 100, 2, '2025-12-04 06:51:08', NULL);
INSERT INTO `transactions_in` (`id`, `tanggal_masuk`, `kode_barang`, `jumlah_masuk`, `gudang_id`, `created_at`, `penerima`) VALUES (15, '2024-12-01', 'BRG015', 45, 2, '2025-12-04 06:51:08', NULL);
INSERT INTO `transactions_in` (`id`, `tanggal_masuk`, `kode_barang`, `jumlah_masuk`, `gudang_id`, `created_at`, `penerima`) VALUES (16, '2024-11-04', 'BRG001', 10, 3, '2025-12-04 06:51:08', NULL);
INSERT INTO `transactions_in` (`id`, `tanggal_masuk`, `kode_barang`, `jumlah_masuk`, `gudang_id`, `created_at`, `penerima`) VALUES (17, '2024-11-06', 'BRG003', 20, 3, '2025-12-04 06:51:08', NULL);
INSERT INTO `transactions_in` (`id`, `tanggal_masuk`, `kode_barang`, `jumlah_masuk`, `gudang_id`, `created_at`, `penerima`) VALUES (18, '2024-11-11', 'BRG005', 80, 3, '2025-12-04 06:51:08', NULL);
INSERT INTO `transactions_in` (`id`, `tanggal_masuk`, `kode_barang`, `jumlah_masuk`, `gudang_id`, `created_at`, `penerima`) VALUES (19, '2024-11-16', 'BRG007', 25, 3, '2025-12-04 06:51:08', NULL);
INSERT INTO `transactions_in` (`id`, `tanggal_masuk`, `kode_barang`, `jumlah_masuk`, `gudang_id`, `created_at`, `penerima`) VALUES (20, '2024-11-22', 'BRG009', 18, 3, '2025-12-04 06:51:08', NULL);
INSERT INTO `transactions_in` (`id`, `tanggal_masuk`, `kode_barang`, `jumlah_masuk`, `gudang_id`, `created_at`, `penerima`) VALUES (21, '2024-11-28', 'BRG011', 50, 3, '2025-12-04 06:51:08', NULL);
INSERT INTO `transactions_in` (`id`, `tanggal_masuk`, `kode_barang`, `jumlah_masuk`, `gudang_id`, `created_at`, `penerima`) VALUES (22, '2024-12-03', 'BRG002', 40, 3, '2025-12-04 06:51:08', NULL);
INSERT INTO `transactions_in` (`id`, `tanggal_masuk`, `kode_barang`, `jumlah_masuk`, `gudang_id`, `created_at`, `penerima`) VALUES (23, '2025-12-04', 'test', 10, 1, '2025-12-04 10:25:37', 'test penerima');
COMMIT;

-- ----------------------------
-- Table structure for transactions_out
-- ----------------------------
DROP TABLE IF EXISTS `transactions_out`;
CREATE TABLE `transactions_out` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tanggal_keluar` date NOT NULL,
  `kode_barang` varchar(50) NOT NULL,
  `jumlah_keluar` int(11) NOT NULL,
  `asal_gudang_id` int(11) NOT NULL,
  `penanggung_jawab` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `kode_barang` (`kode_barang`),
  KEY `asal_gudang_id` (`asal_gudang_id`),
  CONSTRAINT `transactions_out_ibfk_1` FOREIGN KEY (`kode_barang`) REFERENCES `products` (`kode_barang`),
  CONSTRAINT `transactions_out_ibfk_2` FOREIGN KEY (`asal_gudang_id`) REFERENCES `warehouses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- ----------------------------
-- Records of transactions_out
-- ----------------------------
BEGIN;
INSERT INTO `transactions_out` (`id`, `tanggal_keluar`, `kode_barang`, `jumlah_keluar`, `asal_gudang_id`, `penanggung_jawab`, `created_at`) VALUES (1, '2024-11-08', 'BRG001', 3, 1, 'Budi Santoso', '2025-12-04 06:51:08');
INSERT INTO `transactions_out` (`id`, `tanggal_keluar`, `kode_barang`, `jumlah_keluar`, `asal_gudang_id`, `penanggung_jawab`, `created_at`) VALUES (2, '2024-11-12', 'BRG002', 15, 1, 'Ani Wijaya', '2025-12-04 06:51:08');
INSERT INTO `transactions_out` (`id`, `tanggal_keluar`, `kode_barang`, `jumlah_keluar`, `asal_gudang_id`, `penanggung_jawab`, `created_at`) VALUES (3, '2024-11-18', 'BRG003', 8, 1, 'Citra Dewi', '2025-12-04 06:51:08');
INSERT INTO `transactions_out` (`id`, `tanggal_keluar`, `kode_barang`, `jumlah_keluar`, `asal_gudang_id`, `penanggung_jawab`, `created_at`) VALUES (4, '2024-11-22', 'BRG004', 5, 1, 'Dedi Kurniawan', '2025-12-04 06:51:08');
INSERT INTO `transactions_out` (`id`, `tanggal_keluar`, `kode_barang`, `jumlah_keluar`, `asal_gudang_id`, `penanggung_jawab`, `created_at`) VALUES (5, '2024-11-28', 'BRG005', 30, 1, 'Eka Pratama', '2025-12-04 06:51:08');
INSERT INTO `transactions_out` (`id`, `tanggal_keluar`, `kode_barang`, `jumlah_keluar`, `asal_gudang_id`, `penanggung_jawab`, `created_at`) VALUES (6, '2024-12-02', 'BRG006', 20, 1, 'Fani Lestari', '2025-12-04 06:51:08');
INSERT INTO `transactions_out` (`id`, `tanggal_keluar`, `kode_barang`, `jumlah_keluar`, `asal_gudang_id`, `penanggung_jawab`, `created_at`) VALUES (7, '2024-12-03', 'BRG007', 8, 1, 'Gilang Ramadhan', '2025-12-04 06:51:08');
INSERT INTO `transactions_out` (`id`, `tanggal_keluar`, `kode_barang`, `jumlah_keluar`, `asal_gudang_id`, `penanggung_jawab`, `created_at`) VALUES (8, '2024-11-10', 'BRG008', 4, 2, 'Hani Safitri', '2025-12-04 06:51:08');
INSERT INTO `transactions_out` (`id`, `tanggal_keluar`, `kode_barang`, `jumlah_keluar`, `asal_gudang_id`, `penanggung_jawab`, `created_at`) VALUES (9, '2024-11-15', 'BRG009', 6, 2, 'Irfan Hakim', '2025-12-04 06:51:08');
INSERT INTO `transactions_out` (`id`, `tanggal_keluar`, `kode_barang`, `jumlah_keluar`, `asal_gudang_id`, `penanggung_jawab`, `created_at`) VALUES (10, '2024-11-20', 'BRG010', 3, 2, 'Joko Widodo', '2025-12-04 06:51:08');
INSERT INTO `transactions_out` (`id`, `tanggal_keluar`, `kode_barang`, `jumlah_keluar`, `asal_gudang_id`, `penanggung_jawab`, `created_at`) VALUES (11, '2024-11-25', 'BRG011', 18, 2, 'Kartika Sari', '2025-12-04 06:51:08');
INSERT INTO `transactions_out` (`id`, `tanggal_keluar`, `kode_barang`, `jumlah_keluar`, `asal_gudang_id`, `penanggung_jawab`, `created_at`) VALUES (12, '2024-12-01', 'BRG012', 2, 2, 'Lukman Hakim', '2025-12-04 06:51:08');
INSERT INTO `transactions_out` (`id`, `tanggal_keluar`, `kode_barang`, `jumlah_keluar`, `asal_gudang_id`, `penanggung_jawab`, `created_at`) VALUES (13, '2024-11-09', 'BRG001', 2, 3, 'Maya Angelina', '2025-12-04 06:51:08');
INSERT INTO `transactions_out` (`id`, `tanggal_keluar`, `kode_barang`, `jumlah_keluar`, `asal_gudang_id`, `penanggung_jawab`, `created_at`) VALUES (14, '2024-11-14', 'BRG003', 5, 3, 'Nanda Putri', '2025-12-04 06:51:08');
INSERT INTO `transactions_out` (`id`, `tanggal_keluar`, `kode_barang`, `jumlah_keluar`, `asal_gudang_id`, `penanggung_jawab`, `created_at`) VALUES (15, '2024-11-19', 'BRG005', 25, 3, 'Oji Sentosa', '2025-12-04 06:51:08');
INSERT INTO `transactions_out` (`id`, `tanggal_keluar`, `kode_barang`, `jumlah_keluar`, `asal_gudang_id`, `penanggung_jawab`, `created_at`) VALUES (16, '2024-11-26', 'BRG007', 7, 3, 'Putri Ayu', '2025-12-04 06:51:08');
INSERT INTO `transactions_out` (`id`, `tanggal_keluar`, `kode_barang`, `jumlah_keluar`, `asal_gudang_id`, `penanggung_jawab`, `created_at`) VALUES (17, '2024-12-02', 'BRG009', 4, 3, 'Qori Rahman', '2025-12-04 06:51:08');
INSERT INTO `transactions_out` (`id`, `tanggal_keluar`, `kode_barang`, `jumlah_keluar`, `asal_gudang_id`, `penanggung_jawab`, `created_at`) VALUES (18, '2025-12-04', 'test', 5, 1, 'pj', '2025-12-04 10:26:02');
COMMIT;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','petugas') NOT NULL DEFAULT 'petugas',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- ----------------------------
-- Records of users
-- ----------------------------
BEGIN;
INSERT INTO `users` (`id`, `nama`, `email`, `password`, `role`, `created_at`) VALUES (1, 'Admin', 'admin@example.com', '2651a54a6aab36c60cb7a4bf5443d9e1:77998ada5e6f82530fe8499c0e88cd20b48aeea43a0132fe58e623d9b997960d51b6c1d4e9d3384a0c76630766ccd44c9c0b14c3becbf5861102c538993edd02', 'admin', '2025-12-04 06:52:17');
COMMIT;

-- ----------------------------
-- Table structure for warehouses
-- ----------------------------
DROP TABLE IF EXISTS `warehouses`;
CREATE TABLE `warehouses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama_gudang` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- ----------------------------
-- Records of warehouses
-- ----------------------------
BEGIN;
INSERT INTO `warehouses` (`id`, `nama_gudang`) VALUES (1, 'Gudang 1');
INSERT INTO `warehouses` (`id`, `nama_gudang`) VALUES (2, 'Gudang 2');
INSERT INTO `warehouses` (`id`, `nama_gudang`) VALUES (3, 'Gudang 3');
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
