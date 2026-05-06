# Risk Management System — Backend & Frontend Fixes

This bundle contains a backend (`QM-master/`) and a frontend (`react-risk-system/`)
that have been reworked to fix the role-scoping, naming, and workflow issues
you described:

1. Endpoints are now **role-scoped** — initiators see only their own records,
   risk managers see their own + records owned by users whose `ManagerId`
   equals theirs, admins see everything.
2. **Suggesting a new risk** writes to the `Risks` table with `Custom=true`
   (not the Requests table). It only flips to `Custom=false` once an admin
   accepts it (`Status=Accepted`).
3. **Logging an incident/risk** writes to the `Requests` table. It stays
   visible in the *pending* list while `Status` is `InProgress` or
   `underReview`. Once the admin accepts (`Status=Accepted`) or the manager/
   admin rejects (`Status=Rejected`), it disappears from the pending list and
   shows up in **سجلاتي** (the history tab) instead.
4. **Status enum values** are aligned across backend and frontend (the old
   frontend was sending `status:3` for "reject" — which actually means
   *Accepted* on the backend).
5. **Field naming** is unified across the two DTO families
   (`CauseDescription`, `StrategicGoals`).

---

## Status enum reference (backend `QM.Models.Enums.RequestStatus`)

| Numeric | Name        | Meaning in this app                                |
| ------- | ----------- | -------------------------------------------------- |
| 0       | Rejected    | Manager or admin rejected it                       |
| 1       | InProgress  | Just submitted; in the manager review queue        |
| 2       | underReview | Manager forwarded it; in the admin review queue    |
| 3       | Accepted    | Admin accepted it                                  |

Anything in state 1 or 2 is "pending" and shows up in the main list.
Anything in state 0 or 3 is "history" and shows up in **سجلاتي**.

---

## Notification enum reference (`QM.Models.Enums.notificationType`)

| Numeric | Name    |
| ------- | ------- |
| 0       | reject  |
| 1       | accept  |
| 2       | updated |
| 3       | created |

---

## Backend changes

### `QM.Models/DTO/CauseDto.cs`
Standardized on `CauseDescription` (matches the entity field). Kept a
JSON alias `description` so older clients that still send `"description"`
continue to work. The setter mirrors the legacy field into the canonical
one.

### `QM.Models/DTO/CauseInputDto.cs`
Now a thin alias of `CauseDto`. Existing controller signatures that
referenced `CauseInputDto` keep compiling.

### `QM.Models/DTO/RequestDto.cs`
Renamed `StrategicGoalIds` → `StrategicGoals` to match `RiskDto`.
Kept a JSON alias `strategicGoalIds` for backward-compat.

### `WebApplication2/Controller/RequestsController.cs` (full rewrite)
- Added a `pending` query parameter on GET:
  - `pending=true` → only `InProgress` + `underReview` (the pending list).
  - `pending=false` → only `Accepted` + `Rejected` (the سجلاتي list).
  - Omitted → everything visible to the current user.
- Role-scoped GET:
  - **Initiator** → `r.UserId == currentUser`.
  - **Risk Manager** → `r.UserId == currentUser` OR
    `r.User.ManagerId == currentUser`.
  - **Admin** → no extra scope.
- Authorization on `addUpdate`:
  - An **Initiator** updating someone else's request now gets `403 Forbid`.
- Notification routing:
  - Forward (`Status=underReview`) → notify all admin users.
  - Accept / Reject → notify the **original initiator** (`request.UserId`),
    not the actor. Previously notifications always went to the actor.
- Original creator (`UserId`) is preserved on edits (was being overwritten).
- Uses `CauseDto.CauseDescription` (was `CauseInputDto.CauseDescription`).
- Uses `dto.StrategicGoals` (was `dto.StrategicGoalIds`).

### `WebApplication2/Controller/RisksController.cs` (full rewrite)
Same pattern as Requests. Specifically:
- Role-scoped GET (Initiator → own, Manager → own + reports, Admin → all).
- Authorization on update — Initiator can only edit their own; Manager
  must own it OR own a user whose `ManagerId == self`.
- `Custom` flag rule: `false` only if creator is Admin OR `Status=Accepted`.
  Otherwise `true`.
- Notification routing mirrors RequestsController (admin fan-out on
  forward; original initiator on accept/reject).

### `WebApplication2/Controller/Notification.cs`
- `[Authorize]` added.
- Default filter: `n.UserId == currentUser` (non-admin only sees own).
- Admin can pass `userId=` to look at someone else's.

### `WebApplication2/Controller/AuditLogController.cs`
- `/api/log[s]` (full list) is **Admin only** (`[Authorize(Roles="Admin")]`).
- `/api/log[s]/my` accepts any authenticated user (`Initi/Initiator/Risk
  Manager/Admin`).

### `WebApplication2/Controller/CategoriesController.cs`
- `[Authorize]` on GET (any logged-in user).
- `[Authorize(Roles="Admin")]` on `/create` (initiators can't create
  categories — the entity has no `Custom` field).

### `WebApplication2/Controller/DepartmentController.cs`
Same pattern as Categories.

### `WebApplication2/Controller/StrategicGoalsController.cs`
Same pattern as Categories.

### `WebApplication2/Controller/ResponsiblesController.cs`
Same pattern as Categories.

### `WebApplication2/Controller/CausesController.cs`
- `[Authorize]` on GET.
- All authenticated roles can `/create`. `Custom = !isAdmin` (Admin's adds
  go straight in as standard items; everyone else's are flagged as
  suggestions).
- **Important new behavior**: the GET endpoint now **defaults to filtering
  out `Custom=true` for non-admins** unless they pass `?custom=` explicitly.
  This implements your rule "all roles see Custom=false in dropdowns".
  Admins see everything by default.

### `WebApplication2/Controller/ActionsController.cs`
Same pattern as Causes (auth + Custom flag + non-admin auto-filter to
approved items).

---

## Frontend changes

### `src/utils/statusMapping.ts` (new)
Single source of truth for the status enum. Anywhere we POST a status, use
the constants from this file. Anywhere we read a status, use the helpers.

```ts
STATUS_REJECT          = 0   // Rejected
STATUS_PENDING         = 1   // InProgress
STATUS_FORWARD_TO_ADMIN= 2   // underReview
STATUS_ACCEPT          = 3   // Accepted
```

Helpers:
- `uiStatusFromApi(num)` → `'pending' | 'accepted' | 'rejected'`
- `reviewerFromStatus(num)` → `'manager' | 'admin' | null`
- `suggestionStatusFromApi(num, redirected)` → labels for the
  *مخاطر تقترح اضافتها* tab.

This fixes the most damaging bug in the old code, where:
- "Reject"  was sending `status: 3`  → backend read it as **Accepted**.
- "Accept"  was sending `status: 2`  → backend read it as **underReview**.
- "Forward" was sending `status: 1`  → backend read it as **InProgress**.

### `src/api/http.ts`
Axios interceptor that auto-attaches the bearer token on every request.

### `src/api/riskRequests.api.ts`
- New `getPending()` and `getHistory()` methods that pass
  `?pending=true|false` to the backend.
- `cancel(id)` now sends `STATUS_REJECT` (0) instead of `3`.

### `src/components/requests/RequestsList.tsx` (full rewrite)
- Adapter (`adapt`) that maps the real backend `Request` shape to the
  legacy `WorkflowRequest` UI shape.
- New `mode: 'pending' | 'history'` prop. The component fetches with the
  matching `?pending=` flag.
- Accept/Reject/Forward buttons now use the canonical status constants.
- Admin actions only render when `currentReviewerRole === 'admin'`
  (i.e. status = `underReview`), so admins can't accidentally accept a
  request still in the manager queue.
- Builds a minimal `addUpdate` payload (id + the changed fields only) so
  status updates don't blow away child mappings on the server.

### `src/components/requests/RequestsListWithTabs.tsx`
Three tabs:
1. **الطلبات الجارية** (pending) → `RequestsList mode="pending"`.
2. **سجلاتي** (history) → `RequestsList mode="history"`.
3. **مخاطر تقترح اضافتها** (suggestions) → `NewRisksTab`.

### `src/components/requests/NewRisksTab.tsx`
- Adapter from real `Risk` shape.
- Filters use `suggestionStatusFromApi` to map numeric backend status
  to the four UI labels (`manager_review`, `admin_review`, `accepted`,
  `rejected`).
- Forward → `STATUS_FORWARD_TO_ADMIN` (was `1` which meant InProgress).
- Reject → `STATUS_REJECT` (was `3` which meant Accepted!).
- Admin Accept still navigates to `/add-new-risk` so the admin can flesh
  out the proposal before officially accepting.

### `src/components/logs/LogsPage.tsx` (full rewrite)
- Consumes the real `AuditLog` shape from `/api/logs` and `/api/logs/my`.
- Arabic-localized type labels (`Create` → إضافة, etc.) and table labels
  (`Risk` → مخاطر, etc.).
- For `Update` logs, the details panel shows both old and new values.

### `src/components/layout/Header.tsx`
- Notification bell now hits `/api/notification` (the real notifications
  endpoint) instead of pulling audit logs.
- Uses the real `notificationType` enum mapping
  (reject=0, accept=1, updated=2, created=3).

### `src/components/layout/Sidebar.tsx`
Logs entry is now visible to managers too (was only admin + initiator).

### `src/App.tsx`
- Uses `STATUS_PENDING` for new-request submissions.
- Removed the hardcoded stub category/likelihood/impact in the
  `/predefined` route; it now sends what the user actually entered.
- Forwards the proposal id from the suggested-risks tab into
  `AddNewRisk` (so accepting a suggestion *updates* the existing record
  instead of duplicating it).
- Extended `/logs` access to managers.
- The "log incident" flow stays on `/api/requests/addUpdate`; the
  "suggest risk" flow stays on `/api/risk/addUpdate`. Both correct now.

### `src/components/dashboard/Dashboard.tsx`
- Auth header now sent on `/risk` even when there's no token (consistent).
- Maps numeric backend `status` → string for the stats panel
  (the old code compared numeric backend values against `'pending'`, etc.,
  which always returned 0).

### `src/components/inquiry/RiskInquiryPage.tsx`
- Auth headers on `/category`, `/risk`, `/responsible` GETs.
- Fixed `RiskGoalMappingDto.strategicGoal.strategicGoal` →
  `.strategicGoal.goalDescription` (matches the real backend field).

### `src/components/requests/NewRequestForm.tsx`
- Auth headers on master-data fetches.

### `src/components/admin/AddNewRisk.tsx`
- Auth headers on master-data fetches.
- Added `proposalId` to `AddRiskInitialData` so the form can carry the
  id of the Risk row being accepted.
- When a `proposalId` is present, the payload includes `id: <proposalId>`
  so the backend updates the existing record (and flips Custom=false
  because Status=Accepted) instead of inserting a duplicate.
- Cause payload uses canonical `causeDescription` field.
- Admin-saved risks send `status: 3` (Accepted) so they go straight in
  as standard catalog items.

---

## Behavior matrix

### As an Initiator

| Action                                  | Endpoint                       | Resulting state                           |
| --------------------------------------- | ------------------------------ | ----------------------------------------- |
| Log a risk/incident (`/new-request`)    | `POST /api/requests/addUpdate` | New row in Requests, Status=InProgress    |
| Suggest a new risk (`/predefined`)      | `POST /api/risk/addUpdate`     | New row in Risks, Custom=true             |
| View "قائمة الطلبات"                    | `GET /api/requests?pending=true`  | Only own pending requests             |
| View "سجلاتي" tab                       | `GET /api/requests?pending=false` | Only own accepted/rejected requests   |
| View "مقترحات المخاطر" tab              | `GET /api/risk?custom=true`    | Only own pending suggestions              |
| Cause/action dropdowns                  | `GET /api/cause`, `/api/action`| Only `Custom=false` items                 |

### As a Risk Manager

| Action                  | Endpoint                              | Resulting state                                                  |
| ----------------------- | ------------------------------------- | ---------------------------------------------------------------- |
| View pending requests   | `GET /api/requests?pending=true`      | Own + records by users with `ManagerId == self`                  |
| Forward to admin        | `POST /api/requests/addUpdate` w/ Status=2  | Status moves to underReview; admins notified              |
| Reject                  | `POST /api/requests/addUpdate` w/ Status=0  | Status=Rejected; original initiator notified              |
| View suggestions        | `GET /api/risk?custom=true`           | Same role scope                                                  |

### As an Admin

| Action                 | Endpoint                              | Resulting state                                                |
| ---------------------- | ------------------------------------- | -------------------------------------------------------------- |
| View pending requests  | `GET /api/requests?pending=true`      | Everything                                                     |
| Accept request         | `POST /api/requests/addUpdate` w/ Status=3   | Status=Accepted; original initiator notified            |
| Reject request         | `POST /api/requests/addUpdate` w/ Status=0   | Status=Rejected; original initiator notified            |
| Accept a suggestion    | Navigates to `/add-new-risk`, then `POST /api/risk/addUpdate` with id+Status=3 | Custom flips to false; original initiator notified |
| Add catalog items      | `POST /api/category/create`, etc.     | Created with Custom=false (admin-approved standard)            |

---

## Things that still need attention (not changed)

These are not bugs from your description, but you may want to revisit:

1. **`Risk.Custom = (isAdmin || Status==Accepted) ? false : true`.**
   This logic runs on every save, so an Admin editing an already-accepted
   record keeps it at `false`. ✓ Correct behavior.

2. **`normalizeUserRole` defaults to `'manager'`** when the role is empty
   (`src/components/auth/authUtils.tsx:10`). I left it alone since you said
   "keep the design as it is", but `'initiator'` would be a safer default
   if the JWT ever fails to include the role claim.

3. **Session/captcha** — the login page does its own captcha entirely on the
   client. Since you said the design is not the issue, I left it alone.

4. **`AddNewRisk.tsx` is large (1700+ lines)** and I only made surgical
   edits to it. The rest of its logic is unchanged.

---

## Testing checklist

Once deployed, walk through these to confirm the fixes:

- [ ] As Initiator A, log a risk. As Initiator B, list requests → A's request should NOT appear.
- [ ] As Risk Manager M (whose reports include A but not B), list requests → A's request appears, B's does not.
- [ ] As Admin, list requests → both appear.
- [ ] As Initiator A, edit your own pending request → succeeds.
- [ ] As Initiator B, attempt to call `addUpdate` with A's request id → 403 Forbid.
- [ ] As Manager, click "تحويل إلى الأدمن" → the request disappears from your queue and appears in the admin queue. Status in DB = 2. All admins receive a notification.
- [ ] As Admin, click "قبول" → request disappears from pending list, shows in سجلاتي. Status in DB = 3. Original initiator gets an "accept" notification.
- [ ] As Admin, click "رفض" → request disappears from pending list, shows in سجلاتي with reject reason. Status in DB = 0. Original initiator gets a "reject" notification.
- [ ] As Initiator, submit a "مقترح خطر جديد" → new row in Risks with Custom=true.
- [ ] As Manager, see the suggestion in their queue (only if the initiator reports to them). Forward → admin sees it.
- [ ] As Admin, accept the suggestion → goes to AddNewRisk form pre-filled. Save → existing Risk row is updated, Custom flips to false. NO duplicate row.
- [ ] As Initiator, the cause/action dropdowns in NewRequestForm show only items where `Custom=false`.
- [ ] Admin sees both Custom=true and Custom=false items in their dropdowns.
- [ ] `/api/logs` returns 403 for non-admins; `/api/logs/my` returns the user's own audit entries.
- [ ] Notifications bell shows real notifications from `/api/notification`, not audit logs.
