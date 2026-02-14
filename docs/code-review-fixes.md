# Code Review Fixes — AdminBlock

> Full code review performed on 2026-02-14.
> This document tracks every issue found, explains **why** it matters, and logs when each fix is applied.

---

## How to Read This Document

Each issue has:
- **Status**: `[ ]` pending, `[x]` fixed
- **Severity**: CRITICAL / WARNING / SUGGESTION
- **What**: the bug
- **Why it matters**: what goes wrong for the user
- **The lesson**: a short explanation so you learn the underlying concept

---

## CRITICAL Issues

### 1. [x] Confirm dialog ESC/click-outside hangs forever
**File:** `src/hooks/use-confirm-dialog.tsx:50`

**What:** When the user presses Escape or clicks outside a confirmation dialog, the dialog closes visually but the code that called `await confirm(...)` never gets an answer back. It waits forever — the entire flow freezes.

**Why it matters:** Every delete button in the app (orders, clients, quotes, expenses) uses this dialog. If your dad presses Escape instead of clicking "Cancelar", the app becomes unresponsive until he refreshes the page.

**The lesson — Promises must always resolve or reject:**
A Promise is like asking someone a yes/no question. If they walk away without answering, you're stuck waiting forever. In code, when you `await` a Promise, your function literally pauses until it gets a value. The `confirm()` function creates a Promise and waits for the user to click "OK" or "Cancel". But if the dialog closes via Escape (a third path the code didn't account for), the Promise is never resolved — it's an abandoned question. **Rule of thumb: every Promise you create must have a guaranteed resolution path for every possible outcome.**

---

### 2. [x] `/api/test-whatsapp` is publicly accessible
**File:** `src/lib/supabase/middleware.ts:48`

**What:** This route is explicitly listed as "public" (no login required). Anyone on the internet can call it and send WhatsApp messages through your Twilio account, costing you money.

**Why it matters:** A bot could find this endpoint and send thousands of messages, draining your Twilio balance overnight.

**The lesson — Test endpoints must never reach production:**
When you create a test/debug endpoint during development, it should either: (a) be behind authentication, (b) be removed before deploy, or (c) check `process.env.NODE_ENV === 'development'` and return 404 in production. The code even has a comment `// DELETE THIS IN PRODUCTION` — comments don't protect you, code does.

---

### 3. [x] `/api/debug` exposes database connection details
**File:** `src/app/api/debug/route.ts`

**What:** Returns DB hostname, username, port, and database name to any logged-in user. Also creates a new Postgres connection per request (bypassing the pool).

**Why it matters:** An attacker who gets one user's credentials now knows exactly where your database lives.

**The lesson — Defense in depth:**
Even behind authentication, sensitive system info should never be exposed. Imagine your house has a locked front door (auth), but once inside, there's a paper on the wall with your safe combination (DB details). If someone picks the lock, they get everything. Each layer should assume the previous layer might fail.

---

### 4. [x] `/api/backup` dumps the entire database
**File:** `src/app/api/backup/route.ts`

**What:** `GET /api/backup` returns every row from every table as JSON — all client names, phones, emails, CUIT tax IDs, financial data.

**Why it matters:** Any authenticated user can download everything. If the login is ever compromised, all business data is exposed in one request.

**The lesson — Principle of least privilege:**
Even admin endpoints should have extra protection. Sensitive operations (data export, bulk delete, settings changes) should require re-authentication, a confirmation step, or be restricted to specific user roles. Not every logged-in user should be able to do everything.

---

### 5. [x] Payment race condition — money gets lost
**File:** `src/app/api/orders/[id]/payment/route.ts:52-55`

**What:** The code reads the current `paymentAmount`, adds the new payment in JavaScript, then writes the total back. If two payments arrive at the same time, both read the same starting value, both add their amount, and the second write overwrites the first. One payment is silently lost.

**Why it matters:** Your dad registers a $5,000 payment. A second later, he registers another $3,000. The system shows $3,000 total instead of $8,000. Money has vanished.

**The lesson — Read-modify-write is not atomic:**
When multiple requests can hit the same data simultaneously, you can't do `read → modify in code → write back`. The database might change between your read and your write. The fix is to let the database do the math atomically: `UPDATE orders SET payment_amount = payment_amount + $1` — this way, Postgres handles the addition in a single operation that can't be interrupted. This is the core concept behind **race conditions**: two processes racing to modify the same data, with unpredictable results.

---

### 6. [x] Payment modal: no custom amount + overpayment bug
**File:** `src/components/orders/payment-modal.tsx:48-50,94-96`

**What:** There's no input field for the payment amount — it always pays the full remaining balance. Worse: when the remaining balance is 0 or negative, it sends the full order price as a new payment (massive overpayment).

**Why it matters:** Your dad cannot record partial payments (customer pays 5,000 of a 15,000 order). And re-opening a fully paid order's payment modal would register the entire price again.

**The lesson — Always validate business logic edge cases:**
Payment flows are the most sensitive part of any business app. Every edge case matters: What if the order has no price? What if it's already paid? What if the customer pays more than owed? What if they pay in installments? Think through every scenario and handle each one explicitly.

---

### 7. [x] `formatCurrency(0)` shows "-" instead of "$0"
**File:** `src/app/(dashboard)/reports/page.tsx:49`

**What:** `if (!value) return "-"` — In JavaScript, `0` is "falsy" (treated as false in boolean contexts). So a legitimate zero amount displays as a dash.

**Why it matters:** The monthly reports show "-" for months with zero revenue or expenses. Your dad thinks data is missing when it's actually zero.

**The lesson — JavaScript falsy gotcha:**
In JS, these values are all "falsy": `false`, `0`, `""`, `null`, `undefined`, `NaN`. When you write `if (!value)`, you're catching ALL of them. If you only want to catch null/undefined, use `if (value == null)` or `if (value === null || value === undefined)`. This is one of the most common JS bugs. The fix: `value == null` (double equals intentionally catches both null and undefined but NOT zero).

---

### 8. [x] Quote-to-order has no database transaction
**File:** `src/app/api/quotes/[id]/create-order/route.ts:49-85`

**What:** Creating an order from a quote involves 3 steps: (1) insert order, (2) copy materials, (3) link quote to order. If step 2 fails, the order exists without materials. If the user retries, step 1 runs again creating a duplicate order.

**Why it matters:** Corrupt data — orders missing their materials, or duplicate orders from retries.

**The lesson — Database transactions (all-or-nothing):**
A transaction groups multiple database operations so they either ALL succeed or ALL fail together. Think of it like a bank transfer: you wouldn't want "debit account A" to succeed while "credit account B" fails — that loses money. In code, you wrap operations in `db.transaction(async (tx) => { ... })`. If anything inside throws, every change is rolled back as if nothing happened. **If your operation touches multiple tables, it probably needs a transaction.**

---

### 9. [x] Client DELETE crashes on FK violation
**File:** `src/app/api/clients/[id]/route.ts:74`

**What:** Hard-deletes the client, but `orders.clientId` has no `onDelete` cascade. Postgres blocks the delete with a foreign key error. The API returns a generic "Error al eliminar cliente."

**Why it matters:** Your dad tries to delete a client and gets an unhelpful error. He doesn't know WHY it failed.

**The lesson — Foreign keys protect your data:**
A foreign key (FK) is a database rule that says "this column must reference a valid row in another table." When you try to delete a client that has orders, Postgres says "No — those orders would point to nothing." The default behavior (`RESTRICT`) blocks the delete. Options: (a) cascade delete (deletes orders too — dangerous), (b) set null (orders lose their client reference), or (c) check first and give a helpful error ("Cannot delete: client has 5 orders"). Option (c) is almost always the best for business apps.

---

### 10. [x] Order status enum mismatch between files
**Files:** `src/lib/validations/orders.ts:24` vs `src/lib/utils/validation.ts:89`

**What:** Two different files define the valid order statuses with different values. `orders.ts` has `"quoted"` and `"approved"`. `validation.ts` has `"pending_approval"` instead. Code using the wrong file will reject valid statuses.

**Why it matters:** Status validation could silently reject a valid order update, or accept an invalid status.

**The lesson — Single source of truth:**
When the same concept (like "valid order statuses") is defined in multiple places, they WILL drift apart over time. Always define constants once and import them everywhere. If you find yourself copy-pasting a list of values, stop — create one shared constant.

---

### 11. [x] HTML injection in email templates
**Files:** Multiple API routes and components

**What:** Client names are inserted directly into HTML email templates: `` `<h2>Hola ${clientName}!</h2>` ``. A name containing HTML characters (like `O'Brien & Sons <Ltd>`) would break the email layout or worse.

**Why it matters:** Broken emails look unprofessional. In a worst case, a crafted name could load external images or tracking pixels.

**The lesson — Never trust user data in HTML:**
Any time you put user-provided text into HTML, you must **escape** special characters: `<` becomes `&lt;`, `>` becomes `&gt;`, `&` becomes `&amp;`, `"` becomes `&quot;`. This is the same principle behind XSS (Cross-Site Scripting) prevention on websites. Always use an escape function, never raw string interpolation.

---

### 12. [x] Termocopiado form: parseInt validation passes NaN
**File:** `src/components/termocopiados/termocopiado-form.tsx:55-66`

**What:** `parseInt("abc")` returns `NaN`. The check `NaN < 1` evaluates to `false`, so validation passes. Corrupt data gets submitted.

**Why it matters:** Your dad types in a wrong field by accident, submits, and garbage data is saved.

**The lesson — NaN is weird:**
`NaN` (Not a Number) in JavaScript is bizarre: `NaN < 1` is false, `NaN > 1` is false, `NaN === NaN` is false. It's not less than, greater than, or equal to ANYTHING — not even itself. The safe check is `Number.isNaN(parseInt(value))` or `isNaN(parseInt(value))`. Always check for NaN explicitly before doing comparisons.

---

## WARNING Issues

### 13. [x] `|| null` coerces price "0" to null
**File:** `src/app/api/orders/route.ts:95-101`

**What:** `validated.price || null` — If price is `"0"`, JS treats it as falsy, converting it to `null`. Use `?? null` instead (nullish coalescing only catches `null`/`undefined`, not `"0"`).

**The lesson:** `||` (OR) returns the right side for ANY falsy value. `??` (nullish coalescing) only returns the right side for `null` or `undefined`. For values where `0`, `""`, or `false` are valid, always prefer `??`.

---

### 14. [x] Zod validation errors return 500 instead of 400
**Files:** `src/app/api/orders/route.ts:117`, `src/app/api/clients/route.ts:53`

**What:** When Zod validation fails, the error falls to the generic catch block which returns HTTP 500 (server error) instead of 400 (bad request).

**The lesson:** HTTP status codes communicate meaning. 400 = "you sent bad data" (client's fault). 500 = "something broke on our end" (server's fault). Returning 500 for bad input is misleading and makes debugging harder.

---

### 15. [x] Order list mutations have no error handling
**File:** `src/components/orders/order-list.tsx:83-113`

**What:** `handleStatusChange`, `handleDuplicate`, `handleArchive` all call `mutateAsync` with no try/catch and no toast. Errors are swallowed silently.

**The lesson:** `mutateAsync` returns a Promise that rejects on failure. If you don't catch it, it becomes an **unhandled promise rejection**. Always wrap `mutateAsync` calls in try/catch and show the user a toast error message. Alternatively, use `mutate()` (not async) with `onError` callback.

---

### 16. [x] Many hooks missing fetch timeout
**Files:** `use-quotes.ts`, `use-materials.ts`, `use-suppliers.ts`, `use-stats.ts`

**What:** These use raw `fetch()` while other hooks use `fetchWithTimeout`. On a slow connection, requests hang forever.

**The lesson:** Network requests can take forever — servers go down, connections drop, proxies time out. Always set a timeout. The project already has `fetchWithTimeout` — use it consistently everywhere.

---

### 17. [x] `paidAt` overwritten on every partial payment
**File:** `src/app/api/orders/[id]/payment/route.ts:120`

**What:** Every payment sets `paidAt = new Date()`, even partial ones. The first payment's date is lost.

**The lesson:** Think about what each field means semantically. Does `paidAt` mean "when the first payment was made" or "when the last payment was made" or "when fully paid"? Define it clearly and code accordingly.

---

### 18. [x] Comprobantes: file upload + DB insert not transactional
**File:** `src/app/api/orders/[id]/comprobantes/route.ts:64-95`

**What:** File uploads to Storage first, then DB record is inserted. If the DB insert fails, the file is orphaned.

**The lesson:** When an operation spans two systems (file storage + database), you can't wrap them in a single transaction. The pattern is: (1) do the harder-to-undo step first (upload), (2) do the DB insert, (3) if the DB insert fails, clean up the upload. This is called **compensating transactions**.

---

### 19. [x] `numericString` accepts strings like "123abc"
**File:** `src/lib/utils/validation.ts:40-45`

**What:** `parseFloat("123abc")` returns `123`, passing validation. The raw string "123abc" is stored in the DB.

**The lesson:** `parseFloat` is lenient — it parses as much as it can and ignores the rest. `Number("123abc")` returns `NaN` (stricter). For validation, prefer `Number(val)` or a regex like `/^\d+(\.\d{1,2})?$/`.

---

### 20. [ ] No role-based access control
**File:** `src/lib/supabase/middleware.ts:50`

**What:** The middleware only checks "is there a user?" — not WHO the user is. If Supabase signup isn't disabled, anyone can create an account and get full admin access.

**The lesson:** Authentication (who are you?) and authorization (what can you do?) are different things. This app has authentication but no authorization. For a single-user admin tool, disabling public signup is the minimum. For multi-user, you need role checks.

---

### 21. [x] Edit modal useEffect resets in-progress edits
**File:** `src/components/orders/edit-order-modal.tsx:48-63`

**What:** The useEffect depends on `[order]` (an object). If the parent re-renders with a new object reference (same data), the effect runs and overwrites what the user was typing.

**The lesson:** React compares dependencies by reference, not by value. Two objects `{a: 1}` and `{a: 1}` are different references even if they contain the same data. To avoid unnecessary re-runs, compare by a stable value like `order.id` instead of the whole object.

---

### 22. [ ] Forms lose data on accidental close
**Files:** `order-form-modal.tsx`, `client-form-modal.tsx`

**What:** Pressing Escape or clicking outside immediately resets the form. No "You have unsaved changes" warning.

**The lesson:** Destructive actions (losing user input) should always require confirmation. Track whether the form is "dirty" (has changes) and show a warning before discarding.

---

### 23. [x] `parseInt(x) || undefined` drops zero values
**File:** `src/components/termocopiados/termocopiado-edit-modal.tsx:56-57`

**What:** `parseInt("0") || undefined` → `0 || undefined` → `undefined`. Same falsy-zero bug as issue #13.

---

### 24. [x] Export orders has no pagination/limit
**File:** `src/app/api/export/orders/route.ts`

**What:** With no date filter, dumps ALL orders. Could exhaust serverless memory.

---

### 25. [x] Stack traces exposed in production error boundary
**File:** `src/components/error-boundary.tsx:51-53`

**What:** Shows `error.stack` to all users in production, leaking internal file paths.

---

### 26. [x] Settings PATCH accepts arbitrary keys
**File:** `src/app/api/settings/route.ts:40-41`

**What:** No allowlist for setting keys. Any key can be inserted.

---

### 27. [x] 7 items in mobile bottom nav overflow
**File:** `src/components/layout/sidebar.tsx:98-124`

**What:** Seven items in bottom bar, "Termocopiados" truncates on narrow phones.

---

### 28. [x] Termocopiado list uses native `confirm()` instead of styled dialog
**File:** `src/components/termocopiados/termocopiado-list.tsx:58`

**What:** Inconsistent with rest of the app. Ugly on mobile, easy to accidentally confirm.

---

### 29. [x] Client delete gives unhelpful error when client has orders
**Related to issue #9** — the error message should explain WHY the delete failed.

---

### 30. [x] Payment modal: floating-point money math
**File:** `src/components/orders/payment-modal.tsx:48-50`

**What:** `100.10 - 50.05` could yield `50.04999999999999` in JavaScript.

**The lesson:** Computers represent decimals in binary (floating-point), which can't perfectly represent most base-10 fractions. For money, either: (a) work in cents (integers), (b) use `Math.round(x * 100) / 100`, or (c) use a decimal library. Never trust raw float subtraction for money.

---

## SUGGESTION Issues

### 31. [x] Order form client dropdown should be searchable (Combobox)
### 32. [x] Quick filter buttons below 44px touch target
### 33. [x] Client list action buttons at 28px (below 44px minimum)
### 34. [x] Business name/address hardcoded in PDF util
### 35. [x] Sign-out button has no confirmation
### 36. [x] Quick client form hardcodes "company" type
### 37. [x] Email compose modal state not updated when props change

---

## Fix Log

| Date | Issue # | Description | Commit |
|------|---------|-------------|--------|
| 2026-02-14 | #1 | Confirm dialog ESC hang — `onOpenChange` now calls `handleCancel()` | pending |
| 2026-02-14 | #7 | `formatCurrency(0)` — changed `!value` to `value == null \|\| value === ""` | pending |
| 2026-02-14 | #13 | `\|\| null` → `?? null` in 7 places in orders route + quotes routes | pending |
| 2026-02-14 | #2 | Removed `/api/test-whatsapp` from public routes, gutted endpoint | pending |
| 2026-02-14 | #3 | `/api/debug` gated behind `NODE_ENV === development`, removed raw DB conn | pending |
| 2026-02-14 | #4 | `/api/backup` added explicit auth check with `supabase.auth.getUser()` | pending |
| 2026-02-14 | #5 | Payment race condition — atomic SQL `SET amount = amount + $1` | pending |
| 2026-02-14 | #6 | Payment modal — custom amount input, overpayment guard, timeout cleanup | pending |
| 2026-02-14 | #8 | Wrapped quote creation + quote-to-order in `db.transaction()` | pending |
| 2026-02-14 | #9 | Client DELETE now checks for orders/quotes before deleting, returns helpful 409 error | pending |
| 2026-02-14 | #10 | Fixed `ORDER_STATUSES` in validation.ts to match DB schema (`quoted`, `approved`) | pending |
| 2026-02-14 | #11 | Added `escapeHtml()` utility, applied to all email templates (API + client-side) | pending |
| 2026-02-14 | #12 | Termocopiado form: added `Number.isFinite()` check before int/float comparisons | pending |
| 2026-02-14 | #14 | Added `z.ZodError` catch to orders POST, clients POST, clients PATCH → returns 400 | pending |
| 2026-02-14 | #17 | `paidAt` now only set when payment completes (atomic SQL CASE) | pending |
| 2026-02-14 | #19 | `numericString` uses `Number()` instead of `parseFloat()` to reject "123abc" | pending |
| 2026-02-14 | #23 | Termocopiado edit: `parseInt(x) \|\| undefined` → `x ? parseInt(x) : undefined` | pending |
| 2026-02-14 | #25 | Error boundary hides stack traces in production (`NODE_ENV === "development"` gate) | pending |
| 2026-02-14 | #15 | Order list: wrapped all mutations in try/catch with toast error messages | pending |
| 2026-02-14 | #16 | Added `fetchWithTimeout` to quotes, materials, suppliers, stats hooks | pending |
| 2026-02-14 | #18 | Comprobantes: compensating transaction — deletes uploaded file if DB insert fails | pending |
| 2026-02-14 | #21 | Edit modal useEffect depends on `order?.id` instead of `order` object | pending |
| 2026-02-14 | #26 | Settings PATCH: added `ALLOWED_KEYS` allowlist, rejects unknown keys with 400 | pending |
| 2026-02-14 | #28 | Termocopiado list: replaced native `confirm()` with styled `useConfirmDialog` | pending |
| 2026-02-14 | #29 | Client delete: hook parses API error message, frontend shows it via toast | pending |
| 2026-02-14 | #24 | Export orders: requires date filter, hard limit of 5000 rows | pending |
| 2026-02-14 | #27 | Mobile nav: reduced to 5 items with short labels, Reportes/Ajustes desktop only | pending |
| 2026-02-14 | #30 | Payment modal IVA: `Math.round` on subtotal and tax calculations | pending |
| 2026-02-14 | #31 | Order form: replaced client Select with searchable Combobox | pending |
| 2026-02-14 | #32 | Quick filter buttons: added `min-h-[44px]` for mobile touch targets | pending |
| 2026-02-14 | #33 | Client list buttons: `h-9 w-9 sm:h-7 sm:w-7` (44px mobile, 28px desktop) | pending |
| 2026-02-14 | #34 | PDF business name/address: now reads from `NEXT_PUBLIC_BUSINESS_*` env vars | pending |
| 2026-02-14 | #35 | Sign-out button: added confirm dialog before logging out | pending |
| 2026-02-14 | #36 | Quick client form: defaults to "individual" instead of "company" | pending |
| 2026-02-14 | #37 | Email compose modal: `useEffect` syncs state when `open`/props change | pending |

