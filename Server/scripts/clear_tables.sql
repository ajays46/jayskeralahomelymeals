-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Clear all tables
TRUNCATE TABLE users;
TRUNCATE TABLE sessions;
TRUNCATE TABLE SequelizeMeta;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1; 