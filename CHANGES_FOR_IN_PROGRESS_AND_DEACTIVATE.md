# Changes Required for In Progress Status & Deactivate Driver Warning

Based on **FRONTEND_IN_PROGRESS_AND_DEACTIVATE_GUIDE.md**, these are the changes needed in the system.

---

## 1. Database / Schema

- **OrderStatus enum**: Add `In_Progress` (or `In Progress` per migration) to the `delivery_items.status` enum.
- **Migration**: Run the migration referenced in the guide (e.g. `008_add_in_progress_status.sql`) before using the feature.
- **Prisma**: If your app uses Prisma, add `In_Progress` to the `OrderStatus` enum in `Server/prisma/schema.prisma` and run `prisma generate` (and migrate if you use Prisma migrations).

---

## 2. Backend

| Area | Change |
|------|--------|
| **admin.controller.js** | When the external API returns **400** for executive deactivation (driver has deliveries in progress), parse the response body and forward `error` and `in_progress_count` (and optionally `user_id`) to the client so the frontend can show the “Cannot inactivate driver” modal. |
| **deliveryItem.service.js** | Add `'In_Progress'` to `validStatuses` in `updateDeliveryItemStatusService` (currently only Pending, Confirmed, Delivered, Cancelled). |
| **deliveryDashboard.service.js** | In `getRealTimeDeliveryStatus`: add `'In Progress'` (or `In_Progress` to match DB) to `statusGroups`; include “In Progress” deliveries in the `inProgressDeliveries` count. |

---

## 3. Frontend

| Area | Change |
|------|--------|
| **DeliveryExecutivePage.jsx** | In the delivery status UI (Swiggy-style block), handle **“In Progress”** (and optionally `In_Progress`): orange/amber styling and label “In Progress” so it’s visible after journey start. |
| **DeliveryManagerPage.jsx** | (1) On save executive status, if the API returns 400 with `in_progress_count`, show a **“Deactivate blocked”** modal (driver name, count, message) with actions like “Reassign route” / “Cancel”. (2) Optionally style “In Progress” badge as **orange/amber with pulse** per guide. |
| **useUpdateExecutiveStatus.js** | Ensure the mutation passes through or exposes `error.response.data` (including `in_progress_count` and `error`) so the page can branch on “deactivate blocked” and show the modal. |
| **useDeliveryDashboardSimple.js** | Add `'In Progress'` (or `In_Progress`) to the default `statusGroups` in `realTimeStatus` so dashboard real-time stats include “In Progress”. |

---

## 4. Journey Start (Already Implemented)

- Journey start is already implemented: `POST /api/journey/start` is proxied via your backend; the **external API** sets all route delivery items to **“In Progress”**.
- After journey start, frontend should refresh deliveries and optionally start tracking; ensure lists and filters include **“In Progress”** (already partially present in filters).

---

## 5. Quick Checklist

- [ ] **DB migration** for `In Progress` / `In_Progress` on `delivery_items.status` (and Prisma if used) – **run manually**.
- [x] Backend: Forward 400 + `error` + `in_progress_count` when external API blocks deactivation.
- [x] Backend: `deliveryItem.service.js` validStatuses includes `In_Progress`.
- [x] Backend: `deliveryDashboard.service.js` statusGroups and `inProgressDeliveries` include “In Progress”.
- [x] Frontend: DeliveryExecutivePage shows “In Progress” with orange/amber styling and pulse.
- [x] Frontend: DeliveryManagerPage shows “Deactivate blocked” modal when API returns in-progress count.
- [x] Frontend: Save flow uses `error.response.data` for modal (in_progress_count, error, user_id).
- [x] Frontend: useDeliveryDashboardSimple and useDeliveryDashboard default statusGroups include “In Progress”.
- [x] Frontend: DeliveryManagerPage “In Progress” badge uses orange/amber and pulse per guide.
