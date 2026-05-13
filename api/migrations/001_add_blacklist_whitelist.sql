-- Migration: Add device blacklist and whitelist support
-- Description: Add tables and update nodes table for device management
-- Date: 2026-05-13

-- Create device_blacklist table
CREATE TABLE IF NOT EXISTS device_blacklist (
  id INT PRIMARY KEY AUTO_INCREMENT,
  device_id INT NOT NULL,
  mac_address VARCHAR(17) NOT NULL,
  reason VARCHAR(255) DEFAULT 'Blocked by admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES nodes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_device_blacklist (device_id)
);

-- Create device_whitelist table
CREATE TABLE IF NOT EXISTS device_whitelist (
  id INT PRIMARY KEY AUTO_INCREMENT,
  device_id INT,
  mac_address VARCHAR(17) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES nodes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_device_whitelist (device_id)
);

-- Add index on mac_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_blacklist_mac ON device_blacklist(mac_address);
CREATE INDEX IF NOT EXISTS idx_whitelist_mac ON device_whitelist(mac_address);
