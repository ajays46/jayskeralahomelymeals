/**
 * Stock utility functions for menu items
 */

/**
 * Check if a menu item is completely out of stock (cannot be purchased)
 * @param {Object} menuItem - The menu item object
 * @param {Object} productQuantities - Product quantities data
 * @returns {boolean} - True if completely out of stock (quantity = 0)
 */
export const isCompletelyOutOfStock = (menuItem, productQuantities) => {
  if (!menuItem?.product || !productQuantities) return false;
  
  const productQuantity = productQuantities[menuItem.product.id];
  if (!productQuantity) return false;
  
  return productQuantity.quantity === 0;
};

/**
 * Check if a menu item should show "Out of Stock" label (quantity < 5)
 * @param {Object} menuItem - The menu item object
 * @param {Object} productQuantities - Product quantities data
 * @returns {boolean} - True if should show out of stock label
 */
export const shouldShowOutOfStockLabel = (menuItem, productQuantities) => {
  if (!menuItem?.product || !productQuantities) return false;
  
  const productQuantity = productQuantities[menuItem.product.id];
  if (!productQuantity) return false;
  
  return productQuantity.quantity < 5;
};

/**
 * Get stock status for a menu item
 * @param {Object} menuItem - The menu item object
 * @param {Object} productQuantities - Product quantities data
 * @returns {Object|null} - Stock status object or null if no data
 */
export const getStockStatus = (menuItem, productQuantities) => {
  if (!menuItem?.product || !productQuantities) return null;
  
  const productQuantity = productQuantities[menuItem.product.id];
  if (!productQuantity) return null;
  
  if (productQuantity.quantity === 0) {
    return {
      text: 'Out of Stock',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-200',
      status: 'completely-out-of-stock',
      quantity: productQuantity.quantity,
      canPurchase: false
    };
  } else if (productQuantity.quantity < 5) {
    return {
      text: 'Out of Stock',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-200',
      status: 'low-stock-warning',
      quantity: productQuantity.quantity,
      canPurchase: true
    };
  } else if (productQuantity.quantity < 10) {
    return {
      text: `Low Stock (${productQuantity.quantity})`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      borderColor: 'border-orange-200',
      status: 'low-stock',
      quantity: productQuantity.quantity,
      canPurchase: true
    };
  } else {
    return {
      text: `In Stock (${productQuantity.quantity})`,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-200',
      status: 'in-stock',
      quantity: productQuantity.quantity,
      canPurchase: true
    };
  }
};

/**
 * Check if a menu item can be purchased (has stock > 0)
 * @param {Object} menuItem - The menu item object
 * @param {Object} productQuantities - Product quantities data
 * @returns {boolean} - True if can be purchased
 */
export const canPurchaseMenuItem = (menuItem, productQuantities) => {
  if (!menuItem?.product || !productQuantities) return true; // Default to true if no data
  
  const productQuantity = productQuantities[menuItem.product.id];
  if (!productQuantity) return true; // Default to true if no quantity data
  
  return productQuantity.quantity > 0;
};

/**
 * Get stock warning message for a menu item
 * @param {Object} menuItem - The menu item object
 * @param {Object} productQuantities - Product quantities data
 * @returns {string|null} - Warning message or null if no warning
 */
export const getStockWarningMessage = (menuItem, productQuantities) => {
  if (!menuItem?.product || !productQuantities) return null;
  
  const productQuantity = productQuantities[menuItem.product.id];
  if (!productQuantity) return null;
  
  if (productQuantity.quantity === 0) {
    return `Cannot purchase "${menuItem.name}" - Completely Out of Stock (Available: ${productQuantity.quantity})`;
  } else if (productQuantity.quantity < 5) {
    return `Warning: "${menuItem.name}" has very low stock (Available: ${productQuantity.quantity})`;
  } else if (productQuantity.quantity < 10) {
    return `Warning: "${menuItem.name}" has low stock (Available: ${productQuantity.quantity})`;
  }
  
  return null;
};
