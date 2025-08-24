# Stock Management Feature for Menu Items

## Overview

This feature adds real-time stock checking for menu items in the JAYS KERALA HM application. When a product's quantity is less than 5, it shows "Out of Stock" label, but only blocks purchase when quantity is 0 (completely out of stock).

## Features

### 1. Stock Status Display
- **Cannot Purchase**: Red indicator when quantity = 0 (completely out of stock)
- **Out of Stock Warning**: Red indicator when quantity < 5 (very low stock)
- **Low Stock**: Orange warning when quantity < 10 (running low)
- **In Stock**: Green indicator when quantity >= 10 (sufficient stock)

### 2. Visual Indicators
- Stock status badges on menu item cards
- Color-coded borders and backgrounds
- "Cannot Purchase" overlay only for zero stock items
- Stock status in order summary and pricing breakdown

### 3. User Experience
- **Menu cards remain clickable** even when showing "Out of Stock" warning
- **Only zero stock items** are blocked from selection and purchase
- Clear error messages when trying to purchase completely out of stock items
- Stock warnings in multiple locations (menu selector, order summary, mobile buttons)

### 4. Order Prevention
- **Only blocks purchase** when quantity = 0 (completely out of stock)
- **Allows selection and viewing** when quantity < 5 (shows warning but doesn't block)
- Prevents order placement only for zero stock items
- Validates stock before allowing purchase

## Implementation Details

### Backend Changes

#### New API Endpoint
```
GET /admin/product-quantities-for-menus
```

#### Service Function
```javascript
// Server/src/services/admin.service.js
export const getProductQuantitiesForMenusService = async () => {
  // Fetches product quantities for all menu items
  // Returns object with productId as key and quantity info as value
}
```

#### Database Query
```javascript
const menuItemsWithQuantities = await prisma.menuItem.findMany({
  where: { productId: { not: null } },
  include: {
    product: {
      include: {
        quantities: {
          orderBy: { createdAt: 'desc' },
          take: 1 // Get the latest quantity
        }
      }
    }
  }
});
```

### Frontend Changes

#### New Hook
```javascript
// Client/src/hooks/adminHook/adminHook.js
export const useProductQuantitiesForMenus = () => {
  // Fetches product quantities data
  // Caches for 5 minutes, refetches on mount
}
```

#### Stock Status Logic
```javascript
// Client/src/utils/stockUtils.js
export const isCompletelyOutOfStock = (menuItem, productQuantities) => {
  if (!menuItem?.product || !productQuantities) return false;
  const productQuantity = productQuantities[menuItem.product.id];
  if (!productQuantity) return false;
  return productQuantity.quantity === 0; // Only zero stock blocks purchase
};

export const shouldShowOutOfStockLabel = (menuItem, productQuantities) => {
  if (!menuItem?.product || !productQuantities) return false;
  const productQuantity = productQuantities[menuItem.product.id];
  if (!productQuantity) return false;
  return productQuantity.quantity < 5; // Show warning for low stock
};
```

#### Menu Selector Updates
- Added stock status badges
- "Cannot Purchase" overlay only for zero stock items
- Menu cards remain clickable for all stock levels
- Visual styling for different stock levels

#### Order Summary Updates
- Stock status indicator in selected menu section
- Stock warnings in pricing breakdown
- Stock status in mobile buttons

## Stock Thresholds

| Quantity | Status | Color | Action |
|----------|--------|-------|---------|
| 0 | Cannot Purchase | Red | Block selection and purchase, show overlay |
| 1-4 | Out of Stock Warning | Red | Allow selection, show warning, don't block |
| 5-9 | Low Stock | Orange | Allow selection, show warning |
| 10+ | In Stock | Green | Allow selection, no warning |

## User Interface Elements

### 1. Menu Item Cards
- Stock status badge (top-right corner)
- Color-coded borders based on stock level
- **"Cannot Purchase" overlay only for zero stock**
- **Menu cards remain clickable for all stock levels**

### 2. Order Summary
- Stock status below selected menu
- Stock warnings in pricing breakdown
- Visual indicators for stock levels

### 3. Mobile Interface
- Stock status in floating action button
- Stock warnings in mobile save order section
- **Disabled buttons only for zero stock items**

### 4. Error Messages
- Clear feedback when trying to purchase zero stock items
- Stock quantity information in error messages
- **Prevention of order placement only for zero stock**

## Error Handling

### 1. Stock Validation
```javascript
// Check before menu selection - only block zero stock
if (menu.product && productQuantities && productQuantities[menu.product.id]) {
  const productQuantity = productQuantities[menu.product.id];
  if (productQuantity.quantity === 0) { // Only zero stock blocks
    showErrorToast(`Cannot select "${menu.name}" - Completely Out of Stock (Available: ${productQuantity.quantity})`);
    return;
  }
}
```

### 2. Order Validation
```javascript
// Check before order placement - only block zero stock
if (selectedMenu.product && productQuantities && productQuantities[selectedMenu.product.id]) {
  const productQuantity = productQuantities[selectedMenu.product.id];
  if (productQuantity.quantity === 0) { // Only zero stock blocks
    showErrorToast(`Cannot place order - "${selectedMenu.name}" is Completely Out of Stock (Available: ${productQuantity.quantity})`);
    return;
  }
}
```

### 3. Daily Flexible Mode
```javascript
// Check all selected dates for zero stock
const completelyOutOfStockDates = [];
selectedDates.forEach(date => {
  const dateStr = date.toISOString().split('T')[0];
  const menuForDate = dateMenuSelections[dateStr];
  if (menuForDate && isCompletelyOutOfStock(menuForDate, productQuantities)) {
    completelyOutOfStockDates.push({
      date: formatDateForDisplay(date),
      menu: menuForDate.name,
      available: productQuantities[menuForDate.product.id].quantity
    });
  }
});
```

## Performance Considerations

### 1. Caching
- Product quantities cached for 5 minutes
- Reduces API calls for stock information
- Automatic refetch on component mount

### 2. Data Structure
- Efficient lookup using product ID as key
- Minimal data transfer (only necessary quantity info)
- Single API call for all menu item stock levels

### 3. Loading States
- Loading indicator while fetching stock data
- Graceful fallback when stock data unavailable
- Non-blocking UI updates

## Future Enhancements

### 1. Real-time Updates
- WebSocket integration for live stock updates
- Push notifications for stock changes
- Auto-refresh when stock levels change

### 2. Advanced Stock Management
- Multiple warehouse support
- Stock reservation system
- Stock forecasting and alerts

### 3. User Preferences
- Stock threshold customization
- Stock notification preferences
- Alternative item suggestions

## Testing

### 1. Stock Scenarios
- Test with various stock levels (0, 3, 7, 15)
- Verify visual indicators and messages
- **Test that only zero stock blocks purchase**
- **Test that low stock items remain selectable**

### 2. Edge Cases
- Missing product data
- Network errors
- Invalid stock quantities
- Rapid stock changes

### 3. User Experience
- Verify clear error messages
- **Test that menu cards remain clickable for low stock**
- **Test that only zero stock prevents selection**
- Test mobile responsiveness
- Check accessibility features

## Troubleshooting

### Common Issues

1. **Stock not showing**
   - Check if menu items have associated products
   - Verify product quantities exist in database
   - Check API endpoint accessibility

2. **Low stock items still blocked**
   - Verify stock validation logic uses `=== 0` not `< 5`
   - Check product quantity data structure
   - Ensure proper error handling

3. **Performance issues**
   - Check API response times
   - Verify caching configuration
   - Monitor database query performance

### Debug Information

```javascript
// Log stock data for debugging
console.log('Product Quantities:', productQuantities);
console.log('Selected Menu:', selectedMenu);
console.log('Is Completely Out of Stock:', isCompletelyOutOfStock(selectedMenu, productQuantities));
console.log('Should Show Out of Stock Label:', shouldShowOutOfStockLabel(selectedMenu, productQuantities));
```

## Conclusion

This stock management feature provides users with real-time visibility into product availability while maintaining a good user experience. **Only completely out of stock items (quantity = 0) are blocked from purchase**, while low stock items (quantity < 5) show warnings but remain selectable. The implementation is robust, user-friendly, and maintains good performance through efficient caching and data structures.
