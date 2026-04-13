# max_route Prisma Split Analysis

**Status:** Future placeholder -- no code changes. Analysis only.

---

## 1. Models Exclusively Used by max_route (Split Candidates)

These models are only accessed from `max_route/services/` and could move to a dedicated `max_route` database schema:

| Model | Service File | Operations |
|-------|-------------|------------|
| `MlTrip` | `mlTrip.service.js` | create, findMany, findFirst, update, count, aggregate |
| `MlTripAddress` | `mlTripAddress.service.js` | create, findFirst, update |
| `DriverAvailability` | `mlTrip.service.js` | (referenced in queries) |

**Raw SQL tables** (only in `aiRoute.service.js`):
- `actual_route_stops` -- journey tracking, stop-reached events
- `planned_route_stops` -- planned route data
- `route_journey_summary` -- aggregated journey summaries

---

## 2. Shared Models That Block the Split

These models are accessed by max_route but are also primary assets of other modules:

| Model | Primary Owner | max_route Usage | Blocker Level |
|-------|---------------|-----------------|---------------|
| `User` | shared | `findMany` (driver lists), `findUnique` (company lookup) | HIGH -- 4 call sites |
| `Auth` | shared | `findUnique`, `findFirst` (partner onboarding checks) | MEDIUM -- 2 call sites |
| `DeliveryItem` | max_kitchen | `findFirst` (address lookup from order) | LOW -- 1 call site |
| `MenuItem` | max_kitchen/shared | `create` (trip meal items) | LOW -- 1 call site |
| `MenuItemPrice` | shared | `create` (trip pricing) | LOW -- 1 call site |
| `vehicles` | shared/admin | `findMany` (partner vehicle listing) | LOW -- 1 call site |
| `delivery_executive_profile` | shared (centralized in P2) | raw SQL INSERT (partner onboarding) | LOW -- via shared service |

---

## 3. Prerequisites Before Splitting

Before max_route can have its own database, complete these steps:

1. **P4 query facades must be adopted** -- Replace all `prisma.user`, `prisma.auth`, `prisma.deliveryItem` calls in max_route with facade imports from `shared/services/queries/`. This decouples max_route from the main Prisma client.

2. **Raw SQL tables need migration scripts** -- `actual_route_stops`, `planned_route_stops`, and `route_journey_summary` are not in the Prisma schema (they're created via raw SQL or external tools). These need proper CREATE TABLE migrations in the new max_route schema.

3. **MlTrip meal item creation** -- `mlTrip.service.js` creates `MenuItem` and `MenuItemPrice` records. This cross-boundary write needs to be replaced with a connector call to max_kitchen or shared.

4. **Partner onboarding** -- `mlPartnerManager.service.js` creates `Auth`, `User`, `UserRole`, `Contact` records. These are identity-domain writes that should route through a shared identity service or API.

---

## 4. Suggested Migration Order

```
Step 1: Adopt P4 query facades in max_route (all read calls)
Step 2: Replace cross-module writes with connector/service calls
Step 3: Create max_route Prisma schema with MlTrip, MlTripAddress, DriverAvailability
Step 4: Add raw SQL table definitions to max_route schema
Step 5: Generate max_route Prisma client
Step 6: Migrate max_route services to use new client for owned models
Step 7: Data migration from main DB to max_route DB (if using separate DB)
```

---

## 5. Risk Assessment

| Risk | Mitigation |
|------|------------|
| Data consistency across two databases | Use eventual consistency; route data is operationally independent |
| Partner onboarding writes to identity tables | Route through shared identity service (already partially done in P2) |
| Raw SQL tables not in any schema | Document and formalize before split |
| MlTrip references to MenuItem IDs | Keep as foreign key references with cross-DB read facade |

---

**Decision required:** Separate database instance vs. separate schema in same database. A separate schema is lower risk and still provides logical isolation.
