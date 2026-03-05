-- Add DELIVERY_PARTNER to user_roles_name enum (user_roles.name)
ALTER TABLE `user_roles` MODIFY `name` ENUM('ADMIN', 'SELLER', 'USER', 'DELIVERY_EXECUTIVE', 'DELIVERY_MANAGER', 'DELIVERY_PARTNER', 'CEO', 'CFO') NOT NULL;
