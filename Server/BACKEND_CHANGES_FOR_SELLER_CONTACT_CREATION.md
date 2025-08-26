# Backend Changes for Seller Contact Creation

## Overview
Modified the backend to automatically assign new users to the seller's company instead of requiring manual company selection.

## Changes Made

### 1. Seller Controller (`src/controllers/seller.controller.js`)
- **Removed** `companyId` from request body destructuring
- **Removed** `companyId` from required field validation
- **Removed** `companyId` from service function call

**Before:**
```javascript
const { firstName, lastName, phoneNumber, companyId } = req.body;
if (!firstName || !lastName || !phoneNumber || !companyId) {
  // validation error
}
```

**After:**
```javascript
const { firstName, lastName, phoneNumber } = req.body;
if (!firstName || !lastName || !phoneNumber) {
  // validation error
}
```

### 2. Seller Service (`src/services/seller.service.js`)
- **Removed** `companyId` parameter from function signature
- **Added** automatic seller company ID lookup
- **Added** validation that seller has a company
- **Updated** user creation to use seller's company ID

**Before:**
```javascript
export const createContactOnly = async ({ firstName, lastName, phoneNumber, sellerId, companyId }) => {
  // ... create user with provided companyId
}
```

**After:**
```javascript
export const createContactOnly = async ({ firstName, lastName, phoneNumber, sellerId }) => {
  // Get seller's company ID automatically
  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { companyId: true }
  });

  if (!seller || !seller.companyId) {
    throw new AppError('Seller must be associated with a company to create contacts', 400);
  }

  // Create user with seller's company ID
  const user = await tx.user.create({
    data: {
      // ... other fields
      companyId: seller.companyId // Automatically use seller's company ID
    }
  });
}
```

## Benefits

1. **Simplified Frontend**: No need for company selection dropdown
2. **Automatic Assignment**: Users are automatically assigned to the correct company
3. **Data Integrity**: Ensures users are always created under the seller's company
4. **Better UX**: Sellers don't need to remember or select company information

## API Changes

### Request Body
**Before:**
```json
{
  "firstName": "John",
  "lastName": "Doe", 
  "phoneNumber": "+1234567890",
  "companyId": "uuid-here"
}
```

**After:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}
```

### Response
The response now includes company information:
```json
{
  "success": true,
  "message": "Contact created successfully",
  "data": {
    "user": { ... },
    "contact": { ... },
    "phoneNumber": { ... },
    "company": {
      "id": "seller-company-uuid"
    }
  }
}
```

## Error Handling

- **400 Bad Request**: If seller is not associated with any company
- **400 Bad Request**: If phone number already exists
- **500 Internal Server Error**: For other database/transaction failures

## Testing

To test these changes:
1. Ensure seller user has a valid `companyId` in the database
2. Create a contact using the `/seller/create-contact` endpoint
3. Verify the new user is automatically assigned to the seller's company
4. Verify the response includes the company information
