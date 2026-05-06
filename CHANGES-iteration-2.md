# Risk Management System — Iteration 2 Changes

This iteration builds on the previous fix bundle and addresses three items
you raised after testing:

1. The risk-name dropdown was empty for initiators (because the new
   role-scoping rule on `/api/risk` hid every catalog risk from them).
2. The "history of finished requests" should be the **سجلاتي** entry on
   the *sidebar*, not a third tab on the requests page.
3. The audit-log page should be removed from the user-facing UI; only
   admins should still see it (as **السجلات**).
4. The whole UI should be properly Arabic / right-to-left.

---

## Backend changes (just one file touched)

### `WebApplication2/Controller/RisksController.cs`

The risk-name dropdown calls `GET /api/risk?custom=false` (the catalog of
admin-approved risks). The previous version applied role scoping to *every*
read, which meant initiators couldn't see anything in the catalog because
they don't own any Risk rows.

The fix: when the client passes `custom=false` on a GET, the backend
treats it as a catalog lookup and skips the role scope. All other reads
(including `?custom=true`, or unfiltered) keep the role scope. This is
safe because `Custom=false` only ever applies to admin-accepted, intended-
to-be-public catalog items.

```cs
var isCatalogLookup = custom.HasValue && custom.Value == false;

if (!isCatalogLookup)
{
    // ...role scoping applied here
}
```

---

## Frontend changes

### `src/components/requests/NewRequestForm.tsx`
- Catalog dropdown now fetches `/api/risk?custom=false`.
- Detail-fetch (when a user picks a risk) also passes `custom=false`.

### `src/components/inquiry/RiskInquiryPage.tsx`
- Same: switched to `/api/risk?custom=false`.

### `src/components/layout/Sidebar.tsx`
Sidebar entries reorganized:
- `سجلاتي` is **always shown**, for every role, and now points at
  `/records` (the finished-requests history page).
- `السجلات` (the audit-log page) is **admin-only**.

### `src/App.tsx`
- New route: `/records` → `RequestsList` with `mode="history"`.
- `/logs` is now admin-only (was open to all roles in iteration 1).
- Imported `RequestsList` directly so it can be rendered outside the
  tabs page.

### `src/components/requests/RequestsListWithTabs.tsx`
Reverted to **two tabs only**:
1. **مخاطر تم طلب تسجيلها** → pending logged risks (`RequestsList mode="pending"`).
2. **مخاطر تم اقتراح إضافتها** → pending suggestions (`NewRisksTab`).

The history (Accepted/Rejected) tab was removed — it lives at the
سجلاتي sidebar entry now.

### `src/components/requests/RequestsList.tsx`
- Heading text updated:
  - `mode="pending"` → "مخاطر تم طلب تسجيلها"
  - `mode="history"` → "سجلاتي"

### `src/components/dashboard/Dashboard.tsx`
- Type annotation on `authHeaders` to silence the strict-mode TS error
  you reported.

---

## Arabic / RTL improvements

### `public/index.html`
- `<html lang="ar" dir="rtl">` — proper RTL document direction.
- Added Cairo font from Google Fonts (preconnect + display=swap).
- Title set to "نظام إدارة المخاطر".

### `src/index.css`
- Moved `direction: rtl` from `*` (every element — too aggressive,
  conflicted with Tailwind's auto-flip utilities and third-party
  components) to just `html`, `body`, `#root`, and form controls.
- `body { text-align: right }` so default text aligns right.
- Special-cased `input[type="email"|"password"|"tel"|"number"|"url"]`
  to remain LTR (since those values are inherently latin/numeric)
  while still aligning right inside RTL forms.
- Kept the existing dark-theme block intact.

If you still see specific places where the layout looks wrong (a
particular form, modal, or chart), tell me which screen and I'll patch
that component specifically — RTL fixes are easier targeted than
shotgunned across the whole app.

---

## Behavior matrix (post-iteration-2)

| Sidebar entry         | Visible to     | Page contents                                              |
| --------------------- | -------------- | ---------------------------------------------------------- |
| لوحة المعلومات        | Everyone       | Dashboard with stats                                       |
| استفسار المخاطر       | Everyone       | Inquiry page (browse the catalog of accepted risks)        |
| تسجيل خطر             | Initiator      | Form to log a new incident/risk                            |
| قائمة الطلبات         | Everyone       | Two tabs: pending logged + pending suggestions             |
| مقترح خطر جديد         | Initiator      | Form to suggest a new risk for the catalog                 |
| سجلاتي                | Everyone       | **Finished requests** (Accepted + Rejected) — role-scoped  |
| السجلات               | Admin only     | Audit log of every change in the system                    |
| الإعدادات             | Admin only     | (placeholder)                                              |
| إضافة …                | Admin only     | Catalog management forms                                   |
