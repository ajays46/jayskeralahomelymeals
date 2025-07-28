# July Menu Setup Guide

This guide explains how to set up and use the July menu functionality in your booking page.

## What's New

The booking page now supports:
- **Menu-based selection**: Instead of just showing meals by day, it can show items from a specific menu (like "July Menu")
- **Automatic July menu detection**: The system automatically finds and displays a menu named "July Menu" if it exists
- **Menu selector dropdown**: Users can choose between different menus if multiple menus exist
- **Fallback to day-based meals**: If no menu is found, it falls back to the original day-based meal system

## Setup Instructions

### 1. Create a July Menu

You can create a July menu in several ways:

#### Option A: Using the API endpoint
```bash
curl -X POST http://localhost:5000/api/admin/create-july-menu
```

#### Option B: Using the test script
```bash
cd Server
node test-july-menu.js
```

#### Option C: Through the admin interface
1. Go to your admin panel
2. Create a new menu with the name "July Menu"
3. Set the status to "ACTIVE"

### 2. Add Menu Items to July Menu

Once you have a July menu, you need to add menu items to it:

1. **Create Products** (if not already created):
   - Go to admin panel → Products
   - Create products for breakfast, lunch, and dinner items

2. **Create Menu Items**:
   - Go to admin panel → Menu Items
   - Create menu items and associate them with the July menu
   - Make sure to include "breakfast", "lunch", or "dinner" in the menu item names for proper categorization

3. **Set Menu Item Prices**:
   - Go to admin panel → Menu Item Prices
   - Set prices for each menu item

## How It Works

### Frontend Changes (BookingPage.jsx)

1. **Menu Detection**: The page automatically searches for a menu with "july" in the name
2. **Menu Selection**: If multiple menus exist, users can select from a dropdown
3. **Data Fetching**: Uses `useMenuList()` and `useMenuById()` hooks to fetch menu data
4. **Fallback**: If no menu is found, falls back to the original `useMealsByDay()` functionality

### Backend Changes

1. **New Service**: `createJulyMenuIfNotExists()` - Creates a July menu if it doesn't exist
2. **New Controller**: `createJulyMenu` - API endpoint to create July menu
3. **New Route**: `POST /api/admin/create-july-menu` - Creates July menu

## Testing

### 1. Run the test script
```bash
cd Server
node test-july-menu.js
```

### 2. Check the booking page
1. Start your frontend application
2. Navigate to the booking page
3. You should see "Showing: July Menu" in the header
4. The menu items should be categorized as breakfast, lunch, and dinner

### 3. Test menu selection
If you have multiple menus:
1. You'll see a dropdown menu selector
2. Select different menus to see different items
3. The page will update to show items from the selected menu

## Menu Item Naming Convention

For proper categorization, include these keywords in your menu item names:

- **Breakfast items**: Include "breakfast" in the name
- **Lunch items**: Include "lunch" in the name  
- **Dinner items**: Include "dinner" in the name

Examples:
- "Monday Breakfast - Idli Sambar"
- "Tuesday Lunch - Rice and Curry"
- "Wednesday Dinner - Chapati and Vegetables"

## Troubleshooting

### No July menu showing
1. Check if a menu with "July" in the name exists
2. Ensure the menu status is "ACTIVE"
3. Verify the menu has menu items associated with it

### No menu items showing
1. Check if menu items are created and associated with the July menu
2. Verify menu items have prices set
3. Ensure menu items have proper names for categorization

### Fallback to day-based meals
This is normal behavior if no July menu exists. The system will show meals based on the selected day of the week.

## API Endpoints

- `GET /api/admin/menu-list` - Get all menus
- `GET /api/admin/menu/:menuId` - Get specific menu with items
- `POST /api/admin/create-july-menu` - Create July menu if it doesn't exist

## Next Steps

1. Create your July menu using one of the methods above
2. Add menu items with breakfast, lunch, and dinner categories
3. Test the booking page to see your July menu in action
4. Consider creating additional menus for other months (August, September, etc.) 