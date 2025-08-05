# August Menu with Monthly Plan Setup

## Overview
This document explains how to create and use the "August Menu" with "Monthly Plan" that includes breakfast, lunch, and dinner options with separate address selection.

## Data Structure

### Your Current Schema
```
Menu: "August Menu"
├── MenuItem: "Monthly Plan" (₹9000)
├── MenuCategory: "VEG"
└── MenuItemPrice: ₹9000
```

### How It Works
1. **Backend Detection**: The system automatically detects menus with "monthly" or "plan" in the name as "comprehensive menus"
2. **Meal Type Generation**: Automatically creates breakfast, lunch, and dinner options
3. **Price Structure**: 
   - Total Plan Price: ₹9000
   - Per Day: ₹9000
   - Per Meal: ₹3000 (₹9000 ÷ 3)
4. **Address Selection**: Users can select different delivery addresses for each meal
5. **Meal Skipping**: If user skips a meal, ₹3000 is deducted from the total

## Frontend Features

### What Users See
- **Menu Card**: Shows "Plan Price: ₹9000" (base menu item price)
- **Comprehensive Menu Notice**: Blue banner showing pricing breakdown (₹9000 total, ₹3000 per meal)
- **Breakfast Section**: Green section with ₹3000 per meal and address picker
- **Lunch Section**: Yellow section with ₹3000 per meal and address picker  
- **Dinner Section**: Pink section with ₹3000 per meal and address picker
- **Meal Skipping**: Users can skip meals and ₹3000 is deducted per skipped meal

### Address Selection
- Each meal type has its own address picker
- If no specific address is selected, it uses the primary address
- Users can have different delivery locations for breakfast, lunch, and dinner

## Backend Changes Made

### 1. Service Logic (`admin.service.js`)
- Added detection for comprehensive menus
- Modified pricing calculation to divide total by 3
- Added `isComprehensiveMenu` flag to menu data

### 2. Frontend Updates (`BookingPage.jsx`)
- Added comprehensive menu notice banner
- Shows per-meal pricing for each section
- Enhanced UI to clearly indicate this is a complete meal plan

## How to Create Your Data

### Option 1: Use the Test Script
```bash
cd Server
node test-august-menu.js
```

### Option 2: Manual Creation
1. **Create Menu**: "August Menu"
2. **Create MenuItem**: "Monthly Plan" 
3. **Create MenuCategory**: "VEG"
4. **Create MenuItemPrice**: ₹9000
5. **Link to Product**: Your existing product

## Expected Behavior

### When User Selects "August Menu":
1. ✅ Menu card shows "Plan Price: ₹9000" (base menu item price)
2. ✅ Shows "Comprehensive Meal Plan" notice with pricing breakdown
3. ✅ Displays breakfast, lunch, dinner sections
4. ✅ Shows ₹3000 per meal type
5. ✅ Allows separate address selection for each meal
6. ✅ Calculates total based on selected dates (₹9000 × number of days)
7. ✅ Deducts ₹3000 for each skipped meal

### Order Creation:
- Creates order with ₹9000 total for monthly plan
- Schedules deliveries for breakfast, lunch, dinner
- Uses selected addresses for each meal type
- Handles date selection and meal skipping

## Testing

### To Test the Setup:
1. Run the test script to create the data
2. Start your backend server
3. Go to the booking page
4. Look for "August Menu" in the menu list
5. Select it and verify breakfast/lunch/dinner options appear
6. Test address selection for each meal type

## Customization

### To Modify Pricing:
- Change the `totalPrice` in `MenuItemPrice`
- The system automatically divides by 3 for per-meal pricing

### To Add More Meal Types:
- Modify the backend service to include additional meal types
- Update the frontend to show new sections

### To Change Detection Logic:
- Modify the `isComprehensiveMenu` detection in `admin.service.js`
- Add more keywords or conditions as needed 