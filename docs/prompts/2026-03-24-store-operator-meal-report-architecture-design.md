# Store Operator Meal Report - Architecture and Design Prompt

Date: 2026-03-24

Use this prompt to implement or review the Store Operator Meal Report feature with clean API layering and production-safe backend behavior.

## Prompt

Implement a Store Operator Meal Report feature using the project API integration flow:

1. Frontend hook for API calls + loading/error state + response shaping.
2. Backend route to expose endpoint and apply auth/role middleware.
3. Backend controller to validate inputs and map service output to HTTP response.
4. Backend service for external API call, fallback behavior, and error mapping.

### Functional Requirements

- Add Store Operator Meal Report UI page with date input (`YYYY-MM-DD`) and load action.
- Render `text_report` as primary view.
- If `text_report` is missing, render structured fallback from `sessions` and `totals`.
- Wire page into Store Operator navigation and route list.
- Frontend should call backend proxy endpoint, not external API directly.

### Backend Requirements

- Expose `GET /api/kitchen-store/meal-report`.
- Protect with auth + role checks for `STORE_OPERATOR` and `STORE_MANAGER`.
- Validate `date` query and return `400` for missing/invalid input.
- Service should call upstream Meal Report API and support both:
  - `/api/meal-report`
  - `/meal-report` (fallback on 404)
- Normalize response shape so frontend always receives:
  - `text_report`
  - `sessions`
  - `totals`

### Quality Requirements

- Keep router/controller/service boundaries clean.
- Use consistent response envelope: `{ success: true, data }`.
- Avoid business logic in router/controller.
- Keep error messages safe and actionable.
- Add or recommend tests for:
  - date validation failure
  - upstream fallback path
  - frontend nested/flat response handling

### Output Expectations

- List changed files by layer (hook, route, controller, service, page, nav, app route).
- Include verification steps and lint/test status.
- Call out remaining risks (secrets fallback, missing tests, edge-case validation).

