# Changes Needed: Use Multicompany With CXO Ability

**Implemented (current branch):** `getDashboardRoute(roles, basePath)` with fallback, `companyPaths.js`, RoleSelectionSidebar using basePath, useLogin/useLogout storing companyId and using basePath for redirect. Remaining: Login form sending `companyPath`, Navbar and all pages replacing hardcoded `/jkhm`, and (optional) backend passing companyId to CXO AI route services.

---

CXO = CEO and CFO roles (management dashboard, financial dashboard, route map data, executive performance, delivery managers list, seller dashboard). For these to work correctly with **multicompany** (tenant URL like `/jkhm`, `/jlg`), the following changes are required.

---

## 1. Frontend – Dynamic Company Path (Replace Hardcoded `/jkhm`)

### 1.1 Role-based routing and login redirect

- **`Client/src/utils/roleBasedRouting.js`**
  - **Change**: `getDashboardRoute(roles)` should accept an optional second argument `basePath` (e.g. from `useCompanyBasePath()` or `getCompanyBasePathFallback()`).
  - **Logic**: When `basePath` is provided (e.g. `/jlg`), return `${basePath}/management-dashboard`, `${basePath}/financial-dashboard`, etc. When missing, fallback to `getCompanyBasePathFallback()` so behaviour stays correct when called outside tenant context.
  - **Impact**: CEO/CFO/Admin/DM/Seller/DE redirects after login and from role switcher go to the current company, not always `/jkhm`.

### 1.2 useLogin and useLogout

- **`Client/src/hooks/userHooks/useLogin.js`**
  - **Change**: 
    - Accept or read current `companyPath` (from URL or argument) and send it in login request body: `{ identifier, password, companyPath }`.
    - On success: store `data.data.companyId` in `localStorage.setItem('company_id', ...)`; use `data.data.companyPath` (or current URL companyPath) to build redirect target; call `getDashboardRoute(roles, targetBasePath)` with `targetBasePath = userCompanyPath ? \`/${userCompanyPath}\` : basePath`.
    - Use `useCompanyBasePath()` (or fallback) for `basePath` so redirect stays on current tenant when no companyPath in response.
  - **Change**: Import and use `getCompanyBasePathFallback` when hook is used outside TenantProvider (e.g. login page at `/customer-login`).
- **`Client/src/hooks/userHooks/useLogout.js`**
  - **Change**: On success/error, `localStorage.removeItem('company_id')` and `navigate(basePath)` where `basePath = useCompanyBasePath()` or fallback, not hardcoded `'/jkhm'`.

### 1.3 Login form – send companyPath

- **`Client/src/components/Login.jsx`** (or wherever login credentials are built)
  - **Change**: If Login is rendered under a route that has `:companyPath` (e.g. inside TenantLayout), get `companyPath` from `useParams()` and include it in the credentials passed to `loginMutation`: `{ identifier, password, companyPath }`. So phone login and post-login redirect are company-scoped.

### 1.4 RoleSelectionSidebar

- **`Client/src/components/RoleSelectionSidebar.jsx`**
  - **Change**: Use `useCompanyBasePath()` to get `basePath`. Build `roleConfig` routes dynamically as `${basePath}/management-dashboard`, `${basePath}/financial-dashboard`, etc., or pass `basePath` into a helper that returns the same structure. In `handleConfirmSelection`, use `basePath` for SELLER (e.g. `isCXO ? \`${basePath}/seller\` : \`${basePath}/seller/customers\``) and for `getDashboardRoute([selectedRole], basePath)`.

### 1.5 Navbar and other components

- **`Client/src/components/Navbar.jsx`**
  - **Change**: Replace every `href="/jkhm/..."` and `href="/jkhm"` with `${basePath}/...` and `basePath` where `basePath = useCompanyBasePath()`. Same for any `navigate('/jkhm/...')` if present.
- **All other pages/components** that use `/jkhm` (see grep list in MULTICOMPANY_FEATURE_REFERENCE.md): use `useCompanyBasePath()` (or `getCompanyBasePathFallback()` where hook is not available) and replace hardcoded `/jkhm` with `${basePath}/...` for links and `navigate(basePath + '/...')` for programmatic navigation.

### 1.6 Protect routes

- **`Client/src/protectRoute/Protect.jsx`**, **`DeliveryManagerProtect.jsx`**
  - **Change**: Redirect to `getCompanyBasePathFallback()` (or login) instead of hardcoded `'/jkhm'` when the user is not allowed.

---

## 2. Backend – CXO APIs and Company Scoping (Optional but Recommended)

The ai-routes already use `resolveCompanyId`; the client sends `X-Company-ID` for ai-routes. So `req.companyId` is set for CXO requests.

- **If the external AI Route API is multi-tenant** (expects `X-Company-ID` or similar):
  - **`Server/src/services/aiRoute.service.js`**: For `getRouteMapDataService`, `getExecutivePerformanceService`, `getExecutivePerformanceByDriverService`, accept an optional `companyId` and pass it as header `X-Company-ID` on the axios request to the external API (same pattern as other company-scoped calls if any).
  - **`Server/src/controllers/aiRoute.controller.js`**: Pass `req.companyId` into these three handlers into the service calls so the external API can scope data by company.

- **If the external API is single-tenant**, no backend change needed; CXO will see the single tenant’s data.

---

## 3. Admin “Delivery managers” list for CXO

- **`Server`**: Admin routes already use `resolveAdminCompany` and filter by `req.adminCompanyId`. So when a CXO user has `User.companyId` set, they only see their company’s data (e.g. delivery managers). When `User.companyId` is null (super admin), they see all. No change required unless you want CXO to always be company-scoped.

---

## 4. Summary Checklist

| Area | Change |
|------|--------|
| **roleBasedRouting.js** | `getDashboardRoute(roles, basePath?)`; use basePath for all role routes; fallback to `getCompanyBasePathFallback()` |
| **useLogin.js** | Send `companyPath` in login body; store `companyId` in localStorage; redirect using `companyPath`/basePath; use `getDashboardRoute(roles, targetBasePath)` |
| **useLogout.js** | Clear `company_id`; navigate to `basePath` (useCompanyBasePath or fallback) |
| **Login.jsx** | Pass `companyPath` from `useParams()` into login credentials when under `:companyPath` |
| **RoleSelectionSidebar.jsx** | `useCompanyBasePath()`; build all role routes with basePath; pass basePath to `getDashboardRoute` |
| **Navbar.jsx** | Replace all `/jkhm` links and navigations with `basePath` from `useCompanyBasePath()` |
| **Protect / DeliveryManagerProtect** | Redirect to `getCompanyBasePathFallback()` instead of `/jkhm` |
| **All other pages** | Replace hardcoded `/jkhm` with `${basePath}/...` or `navigate(basePath + '/...')` (see grep list) |
| **Backend CXO APIs** | (If external API is multi-tenant) Pass `req.companyId` to route map and executive performance services and send `X-Company-ID` to external API |

After these changes, CXO (CEO/CFO) will work under any company path (e.g. `/jlg/management-dashboard`, `/jkhm/financial-dashboard`) and redirects/links will stay on the current tenant.
