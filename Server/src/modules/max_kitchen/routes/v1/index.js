/**
 * @product  max_kitchen
 * @version  v1
 * @prefix   /api/max_kitchen/v1
 *
 * MaX Kitchen — food-delivery SaaS product.
 * Covers the full order-to-delivery lifecycle for kitchen/catering companies.
 *
 * Feature modules:
 *
 *  store        (/kitchen-store)        Legacy BFF mount (v1 items, v2 purchase dupes, meal-report, catalog).
 *  store        (/store)               Guide brands surface (§9.2).
 *  recipe       (/recipe)              Guide recipe/BOM lines (§9.4).
 *  kitchen      (/kitchen)             Guide menus, plans, reconciliation (§9.5).
 *  orders       (/orders)               Order creation, status, pricing calculations
 *  payments     (/payments)             Payment processing, receipt uploads
 *  seller       (/seller)               Seller profile, customer management,
 *                                       delivery notes, order cancellation
 *  seller-perf  (/seller-performance)   CEO dashboard — seller KPIs and top performers
 *  delivery-mgr (/delivery-managers)    Delivery manager order/item cancellation
 *  delivery-exe (/delivery-executives)  Executive routes, location, proof-of-delivery,
 *                                       photo uploads, status updates
 *  delivery-itm (/delivery-items)       Delivery item status, image uploads
 *  drivers      (/drivers)              Driver next-stop & route-overview map links
 *  customer     (/customer-portal)      Token-based customer access — orders, addresses,
 *                                       password setup (no auth middleware)
 *  text         (/)                     AI text correction utility
 */
import express from 'express';
import { extractApiVersion } from '../../../../middleware/apiVersion.js';

import customerAccessRoutes from './customerAccess.routes.js';
import deliveryExecutiveRoutes from './deliveryExecutive.routes.js';
import deliveryItemRoutes from './deliveryItem.routes.js';
import deliveryManagerRoutes from './deliveryManager.routes.js';
import driverMapsRoutes from './driverMaps.routes.js';
import kitchenStoreRoutes from './kitchenStore.routes.js';
import storeRestRoutes from './storeRest.routes.js';
import recipeRestRoutes from './recipeRest.routes.js';
import kitchenRestRoutes from './kitchenRest.routes.js';
import inventoryRestRoutes from './inventoryRest.routes.js';
import purchaseRestRoutes from './purchaseRest.routes.js';
import orderRoutes from './order.routes.js';
import paymentRoutes from './payment.routes.js';
import sellerRoutes from './seller.routes.js';
import sellerPerformanceRoutes from './sellerPerformance.routes.js';
import textRoutes from './text.routes.js';

const router = express.Router();

router.use(extractApiVersion);

// @feature store — inventory, brands, recipes, purchase, forecasting
router.use('/kitchen-store', kitchenStoreRoutes);

// Guide-aligned namespaces (FRONTEND_GUIDE_FULL.md §9.2–§9.5; same controllers/services as kitchen-store)
router.use('/store', storeRestRoutes);
router.use('/recipe', recipeRestRoutes);
router.use('/kitchen', kitchenRestRoutes);

// Guide-aligned REST prefixes (same BFF → upstream as kitchen-store)
router.use('/inventory', inventoryRestRoutes);
router.use('/purchase', purchaseRestRoutes);

// @feature orders — order CRUD, pricing calculations
router.use('/orders', orderRoutes);

// @feature payments — payment processing, receipt uploads
router.use('/payments', paymentRoutes);

// @feature seller — seller profile, customer mgmt, delivery notes
router.use('/seller', sellerRoutes);

// @feature seller-performance — CEO seller KPI dashboard
router.use('/seller-performance', sellerPerformanceRoutes);

// @feature delivery-manager — manager-level order/item cancellation
router.use('/delivery-managers', deliveryManagerRoutes);

// @feature delivery-executive — exec routes, location, proof-of-delivery
router.use('/delivery-executives', deliveryExecutiveRoutes);

// @feature delivery-items — item status tracking, image uploads
router.use('/delivery-items', deliveryItemRoutes);

// @feature drivers — next-stop & route-overview map links
router.use('/drivers', driverMapsRoutes);

// @feature customer-portal — token-based customer access (no auth middleware)
router.use('/customer-portal', customerAccessRoutes);

// @feature text — AI text correction utility
router.use('/', textRoutes);

export default router;
