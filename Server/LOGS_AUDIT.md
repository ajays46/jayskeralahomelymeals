# Server Logs Audit – Application, Database, Performance, Security

This document summarizes what logging exists in the Server and where each type is produced.

---

## 1. Application logs ✅

| What | Where | Log file |
|------|--------|----------|
| **Request/response** | `requestLogger` in `middleware/logging.middleware.js`; applied in `App.js` | `logs/daily/app-system-{date}.log` |
| **Errors** | `errorLogger` (same middleware); unhandled errors in `App.js` | `logs/daily/app-system-{date}.log` |
| **Startup / rotation** | `App.js`, `logRotationManager.js`, `criticalLogger.js` | `app-system-*.log` |

- **Categories used:** `LOG_CATEGORIES.SYSTEM`
- **Content:** method, url, statusCode, duration, userAgent, ip, requestId, userId, timestamp; errors include message and stack.

---

## 2. Database logs ⚠️ → ✅ (after wiring)

| What | Where | Log file |
|------|--------|----------|
| **Query logging** | Helper: `logDatabaseQuery()` in `logging.middleware.js` → `LOG_CATEGORIES.TRANSACTION` | `logs/daily/app-transaction-{date}.log` |
| **Prisma** | `config/prisma.js`: only `log: ['warn','error']` to console; no custom file logging by default | — |

- **Before:** No code called `logDatabaseQuery()`, so no database log files were written.
- **After:** Prisma client is extended to log slow queries (e.g. &gt; 300ms) via `logDatabaseQuery()`, so `app-transaction-*.log` will contain DB entries.

---

## 3. Performance monitoring logs ✅

| What | Where | Log file |
|------|--------|----------|
| **Slow requests** | `requestLogger`: requests &gt; 5s → `LOG_CATEGORIES.PERFORMANCE` | `logs/daily/app-performance-{date}.log` |
| **Service-level** | `logPerformance()` in inventory, payment, deliveryManager, admin, seller services | `app-performance-*.log` |

- **Categories used:** `LOG_CATEGORIES.PERFORMANCE`
- **Content:** operation, duration, metadata (e.g. orderId, itemIds).

---

## 4. Security logs ⚠️ → ✅ (after wiring)

| What | Where | Log file |
|------|--------|----------|
| **Security events** | Helper: `logSecurityEvent()` in `logging.middleware.js` → `LOG_CATEGORIES.SECURITY` | `logs/daily/app-security-{date}.log` |

- **Before:** No code called `logSecurityEvent()`, so no security log files were written.
- **After:** Auth controller calls `logSecurityEvent()` for login failure, logout, refresh-token missing/invalid, so `app-security-*.log` will contain these events.

---

## 5. Log file layout (`criticalLogger.js`)

- **Base dir:** `Server/logs`
- **Daily logs:** `logs/daily/app-{category}-{YYYY-MM-DD}.log`
- **Categories:** payment, inventory, user_roles, **transaction**, **security**, **performance**, **system**
- **Rotation:** `logRotationManager.js` (daily midnight); optional S3 upload; cleanup; monitoring.

---

## 6. Quick checklist

| Log type | Infrastructure | Actually used (before) | After changes |
|----------|----------------|------------------------|---------------|
| **Application** | ✅ requestLogger, errorLogger, SYSTEM | ✅ Yes | ✅ |
| **Database** | ✅ logDatabaseQuery, TRANSACTION | ❌ Never called | ✅ Prisma extension logs slow queries |
| **Performance** | ✅ logPerformance, PERFORMANCE | ✅ Slow requests + services | ✅ |
| **Security** | ✅ logSecurityEvent, SECURITY | ❌ Never called | ✅ Auth controller calls it |

---

## 7. Files touched to complete all four log types

1. **`src/controllers/auth.controller.js`** – Import `logSecurityEvent`; call it on login failure, logout, refresh token missing/invalid.
2. **`src/config/prisma.js`** – Extend Prisma client to log slow queries via `logDatabaseQuery()`.

After these changes, all four log types (application, database, performance, security) are produced and written to the corresponding `app-*-{date}.log` files under `logs/daily/`.
