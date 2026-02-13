# Multi-Company (Multi-Tenant) Feature – Reference

This document describes how the **multi-company** feature is implemented in the current branch so you can switch to the **cxo** branch and later port or re-implement it if needed.

---

## 1. Overview

- **One app, multiple companies**: Same codebase serves different “companies” (e.g. JKHM, JLG) via URL path.
- **URL pattern**: All tenant routes live under `/:companyPath` (e.g. `/jkhm`, `/jlg`). The path segment is the **company identifier** (resolved from `Company.name` in DB, case-insensitive).
- **Data isolation**: Users, products, menus, orders, delivery, etc. are scoped by `company_id`. Admins with a company see only that company; users with `company_id = NULL` are “super admin” and see all.
- **Per-company branding**: Each company can have its own theme (colors, logo, copy) via `tenantThemes`; no DB change, keyed by company path/name.

---

## 2. Database (Prisma)

- **`Company`** model: `id`, `name`, `address_id`, timestamps. Related: `User[]`, `Product[]`, `Menu[]`, `ProductCategory[]`, `MenuCategory[]`, `MenuItemPrice[]`.
- **`User.companyId`**: Optional. If set, user belongs to that company. If `NULL`, user is treated as super admin (admin routes use this).
- **Company-scoped models** (have `companyId` / `company_id`):
  - `Product`, `Menu`, `ProductCategory`, `MenuCategory`, `MenuItemPrice`
  - (Orders and delivery are scoped via `User.companyId` or explicit company in APIs.)

**Path resolution**: There is **no** `path` column on `Company`. The “path” in the URL is **`Company.name`** (case-insensitive). Example: path `jlg` → company with `name = "JLG"` or `"jlg"`.

---

## 3. Backend (Server)

### 3.1 Resolving company from URL (tenant API)

- **Route**: `GET /api/company-by-path/:path`
- **Files**: `Server/src/routes/tenant.routes.js`, `Server/src/controllers/tenant.controller.js`, `Server/src/services/tenant.service.js`
- **Logic**: `getCompanyByPath(path)` loads all companies (or could be optimized with a unique index on lowercased name), finds one where `name.toLowerCase() === path.trim().toLowerCase()`, returns `{ id, name }`. Used by frontend to get `companyId` from current URL.

### 3.2 Resolving company for API requests (req.companyId)

- **Middleware**: `Server/src/middleware/resolveCompanyId.js`
  - **Priority**: `X-Company-ID` header → `company_id` query → `company_id` in body. If none and `req.user` exists (after auth), loads `User.companyId` from DB and uses that.
  - **Sets**: `req.companyId` (string or null). Does **not** block if missing.
  - **Usage**: Must run **after** `authenticateToken` when using fallback from user.
- **Helper**: `requireCompanyId` – use after `resolveCompanyId`; returns 400 if `req.companyId` is missing.

**Used in**:  
`aiRoute.routes.js`, `seller.routes.js`, `auth.address.route.js`, `deliveryExecutive.routes.js` (and any other route that needs company-scoped data).

### 3.3 Resolving admin’s company (req.adminCompanyId)

- **Middleware**: `Server/src/middleware/resolveAdminCompany.js`
  - Reads `req.user.userId` / `req.user.id`, loads `User.companyId`.
  - **Sets**: `req.adminCompanyId`. If `User.companyId` is null/empty → **super admin** (can see all companies). If set → admin is scoped to that company only.
  - Must run **after** `authenticateToken`.

**Used in**: `Server/src/routes/admin.routes.js` (all admin routes).  
**Usage in controllers**: `admin.controller.js` (and related services) filters all list/create/update/delete by `req.adminCompanyId` when it is set; when null, no company filter (super admin).

### 3.4 Auth and company

- **Files**: `Server/src/services/auth.service.js`, `Server/src/controllers/auth.controller.js`
- **Registration**: `registerUser({ email, password, phone, companyPath })`. If `companyPath` is provided, resolve company via `getCompanyByPath(companyPath)` and set `User.companyId`. Phone uniqueness is enforced **per company** when company is present.
- **Login**: `loginUser({ identifier, password, companyPath })`. For phone login, when `companyPath` is provided, resolve company and find auth by phone **and** `user.companyId`. Response includes `companyId` and `companyPath` (company name lowercased) for redirect and client storage.
- **Response**: Login returns `user.companyId` and `user.companyPath` so the client can store `companyId` and redirect to `/{companyPath}`.

---

## 4. Frontend (Client)

### 4.1 Routing and tenant context

- **App entry**: Root `/` redirects to `/{DEFAULT_COMPANY_PATH}` (e.g. `/jkhm`). Default comes from `Client/src/utils/companyPaths.js` (`VITE_DEFAULT_COMPANY_PATH` or `'jkhm'`).
- **Tenant routes**: All main app routes are under one parent:  
  `path="/:companyPath"` with `element={<TenantProviderWrapper />}` (which wraps `TenantProvider` + `TenantLayout`). So every route is like `/:companyPath/menu`, `/:companyPath/admin`, etc.
- **Files**: `Client/src/App.jsx` (routes), `Client/src/context/TenantContext.jsx`, `Client/src/utils/companyPaths.js`.

### 4.2 TenantContext

- **Provider**: `TenantProvider` reads `companyPath` from `useParams()` (the `:companyPath` segment).
- **Resolve company**: Calls `GET /api/company-by-path/${companyPath}` and sets state: `companyId`, `companyName`, `companyPath`, `loading`, `error`.
- **Theme**: `getThemeForCompany(companyPath, companyName)` from `Client/src/config/tenantThemes.js` returns theme object (primaryColor, logoUrl, brandName, etc.). Stored in context as `theme`.
- **Exports**:
  - `useTenant()` – full context (companyId, companyName, companyPath, theme, loading, error, redirectToDefault).
  - `useCompanyBasePath()` – returns `/${companyPath}` or default, for building links and navigate().
- **TenantLayout**: Injects CSS vars from `theme` (e.g. `--tenant-primary`), sets document title and favicon from theme, shows “Company not found” + “Go to home” if company resolve fails.

### 4.3 Sending company to API

- **Axios**: `Client/src/api/axios.js`. For requests to `ai-routes` and `delivery-executives` (and not `/api/admin`), interceptor adds header `X-Company-ID` from `store.user?.companyId || localStorage.getItem('company_id')`.
- **Login**: `Client/src/hooks/userHooks/useLogin.js` stores `data.data.companyId` in `localStorage.setItem('company_id', ...)` and uses `data.data.companyPath` to redirect to `/${companyPath}` (or role dashboard under that path).
- **Logout**: Clears `localStorage.removeItem('company_id')`.

### 4.4 Where company is used in UI

- **Links/navigation**: Use `useCompanyBasePath()` so links stay under current tenant (e.g. `basePath + '/admin'`).
- **Delivery manager**: `DeliveryManagerPage.jsx` uses `useTenant()` / `useCompanyBasePath()`, passes `companyId` into mutations and AssistantChat when present.
- **Admin**: UsersPage, AddProductPage, AddMenuPage, MenuItemPage, etc. use `useCompanyBasePath()` for navigation; forms and API calls include `companyId` where backend expects it (e.g. create user, create product, menu, menu item price). Admin list/create/update are already scoped by `req.adminCompanyId` on the server.
- **Booking**: BookingWizardPage and other flows that need company typically get it from tenant context or from the URL-derived company.

---

## 5. Theming (per-company look)

- **File**: `Client/src/config/tenantThemes.js`
- **Keys**: Company path/name (lowercase), e.g. `jkhm`, `jlg`.
- **Values**: Objects with `primaryColor`, `accentColor`, `logoUrl`, `brandName`, `navBg`, and optional home-page overrides (`heroTitle`, `heroSubtitle`, `featuredSectionTitle`, etc.). Fallback: `DEFAULT_THEME`.
- **Usage**: `getThemeForCompany(companyPath, companyName)` used in `TenantContext`; result is in `tenant.theme` and applied in `TenantLayout` (CSS vars, title, favicon).

---

## 6. File Checklist (for porting to cxo branch)

**Server**

- `prisma/schema.prisma` – `Company` model, `User.companyId`, and all `companyId` on Product, Menu, ProductCategory, MenuCategory, MenuItemPrice.
- `src/middleware/resolveCompanyId.js`, `src/middleware/resolveAdminCompany.js`
- `src/services/tenant.service.js` – `getCompanyByPath`
- `src/controllers/tenant.controller.js` – `companyByPath`
- `src/routes/tenant.routes.js` – `GET /company-by-path/:path` (and mount in app).
- `src/services/auth.service.js` – register/login companyPath and companyId logic, phone-per-company, response companyPath/companyId.
- `src/controllers/auth.controller.js` – pass companyPath to register/login.
- `src/routes/admin.routes.js` – use of `resolveAdminCompany` on admin routes.
- `src/routes/aiRoute.routes.js`, `seller.routes.js`, `auth.address.route.js`, `deliveryExecutive.routes.js` – use of `resolveCompanyId`.
- `src/controllers/admin.controller.js` – all `req.adminCompanyId` filters.
- `src/controllers/aiRoute.controller.js`, `src/controllers/deliveryExecutive.controller.js`, `src/controllers/seller.controller.js`, `src/controllers/address.controller.js` – use of `req.companyId`.
- Any service that takes `companyId` and filters by it (e.g. aiRoute.service.js, deliveryExecutive.service.js, admin.service.js, etc.).

**Client**

- `src/context/TenantContext.jsx`
- `src/utils/companyPaths.js`
- `src/config/tenantThemes.js`
- `src/App.jsx` – `/:companyPath` route, `TenantProviderWrapper`, redirect from `/` to default company path.
- `src/api/axios.js` – `X-Company-ID` for ai-routes and delivery-executives.
- `src/hooks/userHooks/useLogin.js` – companyId in localStorage, companyPath redirect.
- `src/hooks/userHooks/useLogout.js` – clear company_id.
- Pages that use `useTenant()` or `useCompanyBasePath()` or pass `companyId`: DeliveryManagerPage, admin pages (UsersPage, AddProductPage, AddMenuPage, MenuItemPage, etc.), BookingWizardPage if it uses company.
- `src/utils/roleBasedRouting.js`, `src/protectRoute/Protect.jsx`, `src/protectRoute/DeliveryManagerProtect.jsx` – use of company base path where needed.

---

## 7. Behavior Summary for cxo Branch

On the **cxo** branch (without this feature):

- Routes are likely **flat** (e.g. `/menu`, `/admin`) with no `:companyPath` segment.
- There is no TenantContext; no company-by-path API; no `X-Company-ID` or `req.companyId` / `req.adminCompanyId`.
- Single-tenant: one company (or no company model). Auth and admin do not filter by company.

To **re-add** multi-company later, use this document and the checklist above to reintroduce URL-based tenant, middleware, auth company scoping, and client context/theme/axios wiring step by step.
