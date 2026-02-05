-- AlterTable: product_prices - allow decimal prices (e.g. 37.50)
ALTER TABLE `product_prices` MODIFY COLUMN `price` DECIMAL(10, 2) NOT NULL;

-- AlterTable: menu_item_prices - allow decimal total price
ALTER TABLE `menu_item_prices` MODIFY COLUMN `total_price` DECIMAL(10, 2) NOT NULL;
