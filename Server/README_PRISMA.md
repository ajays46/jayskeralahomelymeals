# Prisma Migration Guide

## Overview
Successfully migrated from Sequelize ORM to Prisma ORM.

## Key Changes Made

1. **Replaced Sequelize with Prisma**
   - Removed `sequelize` dependency
   - Added `@prisma/client` and `prisma` dependencies

2. **Updated Database Configuration**
   - Created `prisma/schema.prisma` with all models
   - Replaced `src/config/database.js` with `src/config/prisma.js`

3. **Updated Models**
   - Converted Sequelize models to Prisma schema
   - Added proper relations and enums

4. **Updated Services**
   - Modified `src/services/auth.service.js` to use Prisma
   - Updated all database queries

5. **Updated Controllers**
   - Modified `src/controllers/auth.controller.js` to use Prisma
   - Updated database operations

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create .env file:**
   ```env
   DATABASE_URL="mysql://root:jayskeralapilot#213@127.0.0.1:3306/homelymeals"
   JWT_ACCESS_SECRET=your_secret_here
   JWT_REFRESH_SECRET=your_refresh_secret_here
   EMAIL_USER=your_email
   EMAIL_PASS=your_password
   NODE_ENV=development
   ```

3. **Generate Prisma client:**
   ```bash
   npm run db:generate
   ```

4. **Push schema to database:**
   ```bash
   npm run db:push
   ```

5. **Start server:**
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:reset` - Reset database

## Model Structure

The Prisma schema includes:
- **Auth**: User authentication data
- **User**: User profile data
- **UserRole**: User role assignments
- **Enums**: Status, UserStatus, RoleName

All relations are properly defined with cascading deletes. 