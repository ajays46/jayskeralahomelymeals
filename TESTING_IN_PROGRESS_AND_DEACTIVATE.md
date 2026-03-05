# How to Test: In Progress Status & Deactivate Driver Warning

## Prerequisites

1. **Database**: Ensure `In_Progress` is in the `OrderStatus` enum (Prisma schema and migration). Without it, journey start may not persist "In Progress" in your DB.
2. **Run the app**:
   - Backend: `cd Server && npm run dev`
   - Client: from project root, run your frontend dev server (e.g. `npm run dev` in `Client`).
3. **Login** as a user with Delivery Manager and/or Delivery Executive access.

---

## 1. Test “In Progress” display (no external API needed)

### Delivery Executive page

- Go to **Delivery Executive** (executive view).
- Open a route/order that has delivery items.
- For any delivery item whose **status** in the DB is `In_Progress` or `In Progress`:
  - You should see **amber/orange** styling and **“In Progress”** (with pulse) in the status block.
- If nothing is “In Progress” yet, you can temporarily set one item to `In_Progress` in the DB (e.g. via Prisma Studio: `cd Server && npm run db:studio`) and refresh the page.

### Delivery Manager page

- Go to **Delivery Manager → Route & Management** (or tab where delivery data table is shown).
- In the delivery data table, any row with status **“In Progress”** or **“In_Progress”** should show an **amber badge with pulse**.
- Use the status filter dropdown and choose **“In Progress”** to filter; rows should match.

---

## 2. Test Journey Start → “In Progress” (needs external API)

- Ensure **AI_ROUTE_API** (or the API that serves `POST /api/journey/start`) is running and reachable.
- In **Delivery Manager** or **Delivery Executive** flow:
  - Assign a route to a driver and **Start Journey** (use the existing “Start Journey” button/modal with `route_id` and `driver_id`).
- After a successful start:
  - The **external API** sets all deliveries on that route to “In Progress”.
  - Refresh the **delivery list** or **route view**; those items should show **“In Progress”** (and in our app’s UI, amber + pulse where we render that status).

If your app also updates delivery items in your own DB on journey start, ensure that flow sets `status = 'In_Progress'` (or `'In Progress'`) so the UI and dashboard show it.

---

## 3. Test Deactivate Driver blocked (deliveries in progress)

The modal appears when your **backend** returns **400** with `in_progress_count` (and optionally `error`, `user_id`). That happens when the **external API** (`AI_ROUTE_API` – e.g. Flask) returns 400 for deactivation because the driver has deliveries in progress.

### Option A: Real external API

- Have at least one driver with **active “In Progress”** deliveries (e.g. start a journey so some items are “In Progress”).
- In **Delivery Manager → Executives & Routes**, load active executives.
- Toggle that driver to **Inactive** and click **Save Changes**.
- The external API should return **400** with body like:
  `{ "success": false, "error": "Cannot inactivate driver: ...", "in_progress_count": 5 }`
- **Expected**: Your backend forwards 400; the frontend shows the **“Cannot Inactivate Driver”** modal with the message and **Reassign Route** / **Cancel**.

### Option B: Simulate 400 locally (no external API)

You can temporarily force a 400 response for one executive so you can test the modal:

1. In `Server/src/controllers/admin.controller.js`, inside **updateExecutiveStatus**, right after validating `updates`, add a test block (e.g. only when `NODE_ENV !== 'production'`):

```javascript
// TEMPORARY: simulate deactivate blocked for testing (remove after testing)
if (process.env.NODE_ENV !== 'production' && updates.some(u => u.status === 'INACTIVE')) {
  const firstInactive = updates.find(u => u.status === 'INACTIVE');
  if (firstInactive) {
    return res.status(400).json({
      success: false,
      error: 'Cannot inactivate driver: 3 delivery(s) currently in progress. Complete or reassign deliveries before inactivating.',
      in_progress_count: 3,
      user_id: firstInactive.user_id
    });
  }
}
```

2. Restart the Server, then in the UI: set any executive to **Inactive** and **Save Changes**.
3. **Expected**: Modal appears with the message and count; **Reassign Route** / **Cancel** work.
4. **Remove** the temporary block when done.

---

## 4. Quick checklist

| What to test              | Where                         | How to verify                                      |
|---------------------------|--------------------------------|----------------------------------------------------|
| “In Progress” styling     | Delivery Executive page        | Amber/pulse and “In Progress” label on items       |
| “In Progress” badge       | Delivery Manager delivery table| Amber pulse badge and filter option “In Progress”  |
| Journey start             | Start Journey flow             | After start, deliveries show “In Progress”         |
| Deactivate blocked modal  | Executives & Routes → Deactivate | Modal with message, count, Reassign / Cancel     |

---

## 5. API details (for manual/Postman tests)

- **Journey start** (your backend proxies to external API):
  - `POST /ai-routes/journey/start` (or your actual route path)
  - Body: `{ "route_id": "...", "driver_id": "..." }`
  - Headers: auth + `X-Company-ID` if required.

- **Update executive status** (your backend proxies to external API):
  - `POST /admin/update-executive-status`
  - Body: `{ "updates": [ { "user_id": "...", "status": "INACTIVE", "date": "YYYY-MM-DD" } ] }`
  - When external API returns 400 with `in_progress_count`, your API now returns 400 with `error`, `in_progress_count`, `user_id` so the frontend can show the modal.
