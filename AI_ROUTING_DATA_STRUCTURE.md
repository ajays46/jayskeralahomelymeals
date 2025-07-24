# AI Routing Data Structure

## Overview
This document describes the data structure that will be sent to the AI routing engine for optimizing delivery routes.

## API Endpoint
```
GET /api/orders/routing/:date
```

## Data Structure

### Request
- **URL**: `/api/orders/routing/2024-01-15`
- **Method**: GET
- **Headers**: Authorization: Bearer <token>

### Response Structure

```json
{
  "success": true,
  "message": "Delivery schedules retrieved successfully for AI routing",
  "data": {
    "routingData": [
      {
        "orderId": "uuid-123",
        "userId": "user-uuid-456",
        "orderDate": "2024-01-15T00:00:00.000Z",
        "orderTimes": ["Morning", "Noon", "Night"],
        "deliverySchedule": {
          "breakfast": {
            "mealTime": "Morning",
            "deliveryAddressId": "address-abc-123",
            "items": [
              {
                "menuItemId": "menu-item-1",
                "name": "Idly Sambar",
                "quantity": 1
              }
            ]
          },
          "lunch": {
            "mealTime": "Noon",
            "deliveryAddressId": "address-def-456",
            "items": [
              {
                "menuItemId": "menu-item-2",
                "name": "Chicken Biryani",
                "quantity": 1
              }
            ]
          },
          "dinner": {
            "mealTime": "Night",
            "deliveryAddressId": "address-abc-123",
            "items": [
              {
                "menuItemId": "menu-item-3",
                "name": "Fish Curry",
                "quantity": 1
              }
            ]
          }
        },
        "primaryDeliveryAddress": {
          "id": "address-abc-123",
          "street": "123 Main Street",
          "housename": "Green Villa",
          "city": "Kochi",
          "pincode": 682001,
          "geoLocation": "10.5276,76.2144"
        }
      }
    ]
  }
}
```

## AI Routing Information

### Key Data Points for Routing:

1. **Order ID**: Unique identifier for each order
2. **User ID**: Customer identifier
3. **Order Date**: Date of delivery
4. **Order Times**: Array of meal times (Morning, Noon, Night)
5. **Delivery Schedule**: Detailed breakdown of each meal delivery

### Delivery Schedule Structure:

#### Breakfast (Morning)
- **Location**: `deliverySchedule.breakfast.deliveryAddressId`
- **Items**: List of food items to deliver
- **Time**: Morning delivery window

#### Lunch (Noon)
- **Location**: `deliverySchedule.lunch.deliveryAddressId`
- **Items**: List of food items to deliver
- **Time**: Noon delivery window

#### Dinner (Night)
- **Location**: `deliverySchedule.dinner.deliveryAddressId`
- **Items**: List of food items to deliver
- **Time**: Night delivery window

## AI Routing Logic

### Example Scenario:
```
Customer A:
- Breakfast: Home Address (Location A)
- Lunch: Office Address (Location B)
- Dinner: Home Address (Location A)

Customer B:
- Breakfast: Home Address (Location C)
- Lunch: Home Address (Location C)
- Dinner: Home Address (Location C)
```

### Routing Optimization:
1. **Morning Route**: Location A → Location C
2. **Noon Route**: Location B → Location C
3. **Night Route**: Location A → Location C

## Address Information

Each delivery location includes:
- **Street**: Full street address
- **House Name**: Building/house identifier
- **City**: City name
- **Pincode**: Postal code
- **GeoLocation**: GPS coordinates (if available)

## Usage for AI Engine

The AI routing engine can use this data to:
1. **Group deliveries** by meal time
2. **Optimize routes** for each time slot
3. **Calculate distances** between delivery points
4. **Estimate delivery times** based on traffic and distance
5. **Assign delivery vehicles** based on capacity and route efficiency

## Example AI Processing Steps:

1. **Parse Data**: Extract all delivery locations for each meal time
2. **Geocode Addresses**: Convert addresses to GPS coordinates
3. **Calculate Distances**: Use distance matrix for route optimization
4. **Optimize Routes**: Use algorithms like TSP (Traveling Salesman Problem)
5. **Generate Routes**: Create optimized delivery sequences
6. **Estimate Times**: Calculate delivery windows and ETAs 