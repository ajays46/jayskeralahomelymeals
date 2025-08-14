# Seller Contact Creation System

## Overview
This system allows **SELLERS** to create new contacts with basic information through a web interface. When a seller creates a contact, the system automatically:

1. Creates a minimal auth record (with system-generated email and placeholder password)
2. Creates a minimal user record linked to the auth record
3. Creates a contact record with first name and last name
4. Creates a phone number record linked to the contact
5. Assigns a unique customer ID for tracking

## 🏗️ **File Structure**

### **Backend (Server)**
```
Server/
├── src/
│   ├── controllers/
│   │   └── seller.controller.js          # Seller-specific controllers
│   ├── routes/
│   │   └── seller.routes.js              # Seller-specific routes
│   ├── services/
│   │   └── seller.service.js             # Seller-specific business logic
│   └── App.js                            # Main app with seller routes
```

### **Frontend (Client)**
```
Client/
├── src/
│   ├── hooks/
│   │   └── sellerHooks/
│   │       └── useSeller.js              # Seller-specific React hooks
│   └── pages/
│       └── CreateUserPage.jsx            # Contact creation form
```

## 🔧 **How It Works**

### **Backend Implementation**
- **Base URL**: `/api/seller`
- **Endpoint**: `POST /api/seller/create-contact`
- **Controller**: `createContactController` in `seller.controller.js`
- **Service**: `createContactOnly` in `seller.service.js`
- **Authentication**: Requires SELLER role only
- **Database**: Uses Prisma with transaction support for data integrity

### **Frontend Implementation**
- **Page**: `CreateUserPage.jsx` - A React component with form validation
- **Hook**: `useSeller` - Custom hook for seller operations
- **Features**:
  - Role-based access control (only SELLERS can access)
  - Form validation for all fields
  - Real-time error handling
  - Responsive design with animations
  - Integration with seller API endpoints

### **API Endpoints**
```
GET  /api/seller/profile          # Get seller profile
POST /api/seller/create-contact   # Create new contact
GET  /api/seller/users            # Get seller's created users
```

## 📋 **Required Fields**
1. **First Name** - Minimum 2 characters
2. **Last Name** - Minimum 2 characters  
3. **Phone Number** - Valid phone format, must be unique

## 🗄️ **Database Models Used**
- `Auth` - Minimal auth record (system-generated email, placeholder password)
- `User` - Minimal user record with customer ID (linked to auth)
- `Contact` - Contact details (first name, last name)
- `PhoneNumber` - Phone number linked to contact

## 🔐 **Security Features**
- **Role-based access control** - Only SELLER role can access
- **Input validation and sanitization**
- **Transaction-based database operations**
- **JWT token authentication**
- **System-generated credentials** - No user input for sensitive fields

## 🚀 **Usage Flow**
1. **Seller Login** - Seller logs into the system with SELLER role
2. **Access Control** - System verifies SELLER role permissions
3. **Contact Creation Form** - Seller fills out form with contact details
4. **System Processing** - Backend creates auth + user + contact + phone number
5. **Success** - Contact is stored with unique customer ID for future reference

## 📡 **API Response Format**
```json
{
  "success": true,
  "message": "Contact created successfully",
  "data": {
    "user": {
      "id": "user-uuid",
      "customerId": 12345,
      "status": "ACTIVE"
    },
    "contact": {
      "id": "contact-uuid",
      "firstName": "John",
      "lastName": "Doe"
    },
    "phoneNumber": {
      "id": "phone-uuid",
      "type": "PRIMARY",
      "number": "+1234567890"
    }
  }
}
```

## ⚠️ **Error Handling**
- Field validation errors
- Duplicate phone number errors
- Database transaction errors
- Authentication/authorization errors
- Role permission errors

## 🔄 **State Management**
- **Zustand Store** - Global authentication state
- **useSeller Hook** - Seller-specific state and operations
- **Local State** - Form data and validation state

## 🚀 **Future Enhancements**
- Contact import from CSV/Excel
- Contact management dashboard
- Contact search and filtering
- Contact categories and tags
- Contact activity tracking
- Bulk contact operations
- Customer ID management system
- Auth record cleanup for unused contacts

## 📝 **Key Benefits**
- **Simple & Focused** - Only collects essential contact information
- **Customer Tracking** - Each contact gets a unique customer ID
- **Clean Separation** - Seller logic is completely separate from admin
- **Scalable Architecture** - Easy to add more seller features
- **Maintainable Code** - Clear file structure and responsibilities
- **Security First** - Role-based access control at every level
- **Type Safety** - Proper error handling and validation
- **Data Integrity** - Transaction-based operations ensure consistency

## 🔄 **What Changed**
- **Removed Email & Password** - No user authentication required from seller
- **Simplified Form** - Only first name, last name, and phone number
- **Contact + Customer ID** - Creates minimal user with contact info
- **Streamlined API** - `/create-contact` endpoint for contact management
- **Transaction Support** - Ensures data integrity across all records
- **System-Generated Auth** - Creates minimal auth records automatically
