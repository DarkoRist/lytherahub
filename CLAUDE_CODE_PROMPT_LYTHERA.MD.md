# Claude Code Prompt — Lythera Rebuild: Fixes + Polish Across ALL Phases (based on test checklist)

You are Claude Code working inside the **current git working tree** (this is the pushed, tested code).  
Goal: make the app pass the entire **Lythera testing checklist** (Sections 1–12) and polish UI to a “professional SaaS” level.

**Important constraints**
- Do **NOT** rewrite or restate any architecture document.
- Do **NOT** regenerate files that already exist unless you are explicitly fixing them.
- Prefer **targeted diffs** over big rewrites.
- Keep existing style (Tailwind + lucide icons + toasts + dark mode).
- Every page must have: **loading + empty + error states**, mobile responsiveness, and robust API error handling.

---

## 0) What I observed in the current repo (high-impact issues)

### A) Contacts page “black screen” root cause (confirmed)
Frontend **Contacts.jsx** currently calls:
- `api.get('/clients')` and then `setCompanies(res.data)`  
But `/api/clients` returns a **PaginatedResponse** like `{ items: [...], total, ... }`.

Result: `companies` becomes an object, then the UI does `companies.map(...)` → runtime crash → “black page” and navigation breaks.

**Fix required**
- Frontend: set companies from `res.data.items` (or switch to a proper `companiesApi.list()`).
- Backend: there is **no** `/api/contacts` route currently; `backend/app/routers/contacts.py` uses prefix `/contacts` (missing `/api`). That will also create 404s once the frontend uses `/api/contacts`.

### B) Several backend routers are missing the `/api` prefix
These routers currently mount at:
- `/contacts`, `/deals`, `/signals`, `/activities`

But the rest of the app uses `/api/...`.

**Fix required**
- Change router prefixes to `/api/contacts`, `/api/deals`, `/api/signals`, `/api/activities`
- Ensure `main.py` includes the routers exactly once, and that frontend API calls match.

### C) Sidebar spec mismatch vs checklist
Checklist requires sidebar groups in this order:
**MAIN / SALES / OPERATIONS / FINANCE / INSIGHTS / SYSTEM**

Current sidebar order is:
**MAIN / SALES / FINANCE / OPERATIONS / INSIGHTS / SYSTEM**

Also checklist requires:
- Workspace name in header (not generic “Lythera” text)
- All links navigable without 404

**Fix required**
- Reorder groups
- Fetch workspace name (`GET /api/workspace`) once and display it in header.
- Ensure links match `App.jsx` routes.

---

## 1) Execution protocol (follow exactly)

### Work order (highest leverage first)
1) Fix **Contacts black screen** (frontend) + **contacts API** (backend)
2) Fix backend prefixes for Deals/Signals/Activities to `/api/...`
3) Fix sidebar group order + workspace header name
4) Run through checklist sections 2–12 and fix gaps
5) UI polish pass (tables, detail panels, empty states, responsive)

### Coding rules
- One file at a time
- Complete each file fully (no partials)
- After each file, run quick checks:
  - `npm`/`pnpm`/`yarn` lint/build if available
  - sanity run: `docker compose up` or frontend dev server if that’s your workflow
  - At minimum: open page and verify no console errors

---

## 2) Phase 1 — Navigation & Layout (Checklist Section 1)

### Required outcomes
- Sidebar shows groups **in correct order**
- SALES group: Contacts, Companies, Deals
- OPERATIONS group: Products, Inventory, Sales Orders, Purchase Orders
- All links navigate without 404
- Workspace name shown in sidebar header (from API)

### Files likely involved
- `frontend/src/components/layout/Sidebar.jsx`
- `frontend/src/api/workspace.js` (already exists)
- `frontend/src/App.jsx`

### Implementation notes
- On sidebar mount: call `workspaceApi.get()` and display `workspace.name` in header.
- Cache workspace in a small context/store if already present; otherwise keep local state in Sidebar (simple is fine).
- Add a defensive fallback: show “Workspace” while loading; never show a blank header.
- Reorder nav groups to match checklist.

---

## 3) Phase 1 — Products (Checklist Section 2)

Products page already exists and seems built. Ensure checklist items are met:

### Must-have fixes/polish
- 3-dot menu should include: Edit, **View Stock**, Deactivate  
  (current menu likely lacks View Stock; add it)
- Clicking a product row must open a **detail side panel** showing stock per warehouse:
  - implement a right-side slide-over panel
  - call `GET /api/products/{id}/stock`
  - show breakdown by warehouse, on_hand/reserved/available

### Files likely involved
- `frontend/src/pages/Products.jsx`
- `frontend/src/api/products.js`

---

## 4) Phase 1 — Inventory (Checklist Section 3)

### Required outcomes
- Tabs: Stock Levels, Stock Movements, Low Stock
- Filters work (product filter, warehouse filter optional)
- Adjustment modal works and updates table immediately
- Badges: purchase(green +), sale(red -), adjustment(gray)

### Files likely involved
- `frontend/src/pages/Inventory.jsx`
- `frontend/src/api/inventory.js`

### Notes
- Ensure API endpoints used:
  - `GET /api/inventory`
  - `GET /api/inventory/movements`
  - `POST /api/inventory/adjustment`
- Ensure low stock tab matches Products low stock logic:
  - either call `/api/products/low-stock` or compute from stock levels, but keep consistent.

---

## 5) Phase 1 — Sales Orders (Checklist Section 4)

### Required outcomes
- Table loads with demo data
- New Sales Order modal supports:
  - select company
  - add multiple line items
  - product search dropdown
  - auto-fill unit price from product.sale_price
  - total calculation correct
- Draft → Confirm changes status
- Detail side panel shows:
  - company
  - items table
  - totals and status
- Fulfill creates stock movements; inventory decreases accordingly

### Files likely involved
- `frontend/src/pages/SalesOrders.jsx`
- `frontend/src/api/salesOrders.js`
- Backend should already support:
  - `POST /api/sales-orders/{id}/confirm`
  - `POST /api/sales-orders/{id}/fulfill`

### Polish
- Add “Confirm” action in row menu only for draft
- Add “Fulfill” button in detail panel only for confirmed/partially_fulfilled

---

## 6) Phase 1 — Purchase Orders (Checklist Section 5)

### Required outcomes
- Supplier dropdown filters to supplier/both companies
- Draft → Send
- Receive modal supports partial quantities; status updates:
  - Sent → Partially Received → Received
- Receiving updates inventory (purchase movements positive delta)

### Files likely involved
- `frontend/src/pages/PurchaseOrders.jsx`
- `frontend/src/api/purchaseOrders.js`

---

## 7) Phase 2 — Companies (Checklist Section 6)

### Required outcomes
- `/companies` and `/clients` both work
- Filters for company type (supplier) work
- Detail panel shows:
  - info
  - linked deals (placeholder ok)
  - contacts (placeholder ok)
- Add Company modal supports type selection; saved supplier appears in PO dropdown

### Files likely involved
- `frontend/src/pages/Companies.jsx`
- backend `companies.py` and `clients.py` already exist

### Polish
- Add type badges (Customer/Supplier/Both)
- Add consistent “table toolbar”: search + filters + primary action

---

## 8) Phase 2 — Contacts (Checklist Section 7)  **(fix black page + complete features)**

### Required outcomes
- `/contacts` page loads demo contacts (8)
- Columns: name, company, email, phone, last activity
- Search by name; filter by company
- Add Contact modal (first/last/email/company) saves and appears
- Detail panel shows contact info + linked company + linked deals

### Must-fix backend routing
- Change `backend/app/routers/contacts.py` prefix to `/api/contacts`
- Ensure it is included in `backend/app/main.py`
- Confirm any dependencies / DB models exist (contacts table) and demo seeding includes contacts

### Must-fix frontend data shape bug
- When loading companies for dropdown/filter, use `/api/companies` and read `res.data.items`
- Or create `frontend/src/api/companies.js` and centralize.

### Crash-proofing
- Never `.map` on unknown types; always guard:
  - `Array.isArray(companies) ? companies : companies?.items ?? []`

---

## 9) Phase 2 — Deals (Checklist Section 8)

### Required outcomes
- `/deals` loads kanban with 7 demo deals
- Columns exactly:
  - Qualified / Contact Made / Demo Scheduled / Proposal Made / Negotiations Started
- Dragging a deal changes stage (optimistic UI + API patch)
- Won/Lost toggle for closed deals view
- New Deal modal saves and appears in correct column
- Deal detail panel includes:
  - stage dropdown
  - value
  - company + contact
  - activity timeline (demo activities)
  - quick actions: +Call, +Meeting, +Note, +Task
  - Mark Won / Mark Lost (+lost reason required)

### Must-fix backend routing
- Change `backend/app/routers/deals.py` prefix to `/api/deals` (currently `/deals`)

### Activity timeline
- Ensure activities API exists and is mounted at `/api/activities`
- If activities aren’t implemented, implement minimal:
  - list by entity_type/entity_id
  - create activity entries (note/call/meeting/task)
  - return in newest-first order

---

## 10) Phase 3 — Signals (Checklist Section 9)

### Required outcomes
- `/signals` loads signals grouped by severity
- Each signal shows icon, message, entity link, timestamp
- Dismiss works; Dismiss All works
- Sidebar badge shows unresolved count
- Dashboard widget shows top 3 critical/warning with link to /signals

### Must-fix backend routing
- Change `backend/app/routers/signals.py` prefix to `/api/signals` (currently `/signals`)

### Celery jobs
- If the engine exists, ensure:
  - scheduled job generates low-stock signals
  - job cadence is reasonable
- Keep logic simple:
  - generate signal if `stock_on_hand <= reorder_level`
  - avoid duplicates: mark previous resolved or upsert based on (workspace_id, type, entity_id)

---

## 11) Phase 5 — Settings (Checklist Section 10)

### Required outcomes
Settings page has 9 tabs:
1) Workspace
2) Members & Roles
3) Profile
4) Security
5) Inventory
6) Notifications
7) Integrations
8) Billing
9) Audit Log

Key behaviors:
- Workspace tab edits name; saving updates sidebar header (immediate UI update)
- Members tab: list members, invite by email, role dropdown per member
- Profile tab: edit user name/email (or at least name) and toast success
- Inventory tab: default warehouse selector, negative stock policy toggle
- Audit Log tab: show recent actions

### Likely needed changes
- Ensure settings endpoints exist:
  - workspace: `/api/workspace`
  - members: `/api/workspace/members`
  - invite: `/api/workspace/invite`
- If profile endpoints aren’t available, add minimal `/api/profile` backend route.

---

## 12) Dashboard (Checklist Section 11)

### Required outcomes
Dashboard includes:
- Signals strip at top (critical signals)
- Revenue snapshot (this month vs last)
- Pipeline snapshot (deals by stage)
- Inventory health card (low stock count, pending orders)
- Activities today (tasks + meetings due today)
- Cards are clickable and navigate to filtered pages

### Implementation notes
- Start with lightweight aggregation endpoints or reuse existing list endpoints with filtering.
- Prefer computed summaries in backend for performance and clean UI.

---

## 13) End-to-End Workflow (Checklist Section 12)

You must ensure these 13 steps work end-to-end without manual DB edits:
- Create supplier, product, PO, receive stock
- Create customer, contact, deal, mark won
- Create SO, fulfill, inventory decreases
- Trigger low-stock signal by raising reorder_level and confirm signal appears

This is the final “definition of done”.

---

## 14) UI polish guidelines (make it look like a top-tier SaaS)

Use patterns inspired by successful B2B SaaS / admin UIs:
- **Shopify admin** / **Stripe dashboard** / **Atlassian admin** / **Linear** density patterns

Key UX upgrades to implement across pages:
1) **Consistent Table Toolbar**  
   - left: search
   - right: filters (dropdown) + primary action button  
   - show active filter “chips” with clear buttons

2) **Sticky headers and action bars**  
   - tables: sticky header row  
   - detail panels: sticky footer actions (Save/Cancel, Confirm/Fulfill)

3) **Row click -> detail panel** (slide-over)  
   - consistent component used across Products/Companies/Orders/Deals/Contacts  
   - supports deep link (e.g. /sales-orders?selected=so-001)

4) **Empty states that guide action**  
   - always: short copy + a primary CTA  
   - example: “No purchase orders yet” + “Create Purchase Order”

5) **Responsive layout**  
   - tables become stacked cards on small screens for key pages (Deals, Orders, Inventory)
   - slide-over panels become full-screen on mobile

6) **Micro-interactions**  
   - hover row actions, subtle transitions, skeleton loaders  
   - optimistic updates for stage drag and status changes

### Useful public references
(Use these as inspiration, not as code to copy)
- Material Design: Data Tables guidelines (sorting/pagination/checkboxes)
- Shopify Polaris: IndexTable and navigation patterns
- Atlassian Design System: Side navigation + tables

---

## 15) Concrete “Fix list” (apply in this order)

### Step 1 — Contacts crash + API correctness
**Frontend**
- Fix `frontend/src/pages/Contacts.jsx`
  - Use `/api/companies` (paginated) and set `companies = res.data.items`
  - Use `/api/contacts` to load contacts, not placeholder routes
  - Ensure robust guards and error rendering (no blank screen)

**Backend**
- Fix `backend/app/routers/contacts.py` prefix to `/api/contacts`
- Ensure router included in `backend/app/main.py`
- Verify CORS + auth dependencies are consistent

### Step 2 — Prefix normalization for Deals/Signals/Activities
- Update router prefixes:
  - deals → `/api/deals`
  - signals → `/api/signals`
  - activities → `/api/activities`
- Update any frontend api modules to match

### Step 3 — Sidebar order + workspace name
- Update `Sidebar.jsx`:
  - reorder groups
  - show workspace name from `workspaceApi.get()`
  - optional: show signals badge count

### Step 4 — Fill missing checklist gaps
- Products: View Stock + detail panel
- Inventory: low stock tab, adjustments, badges
- Sales Orders: detail panel, confirm/fulfill wiring
- Purchase Orders: supplier filter + receive modal

### Step 5 — Professional polish pass
- unify table + toolbar styling across pages
- unify slide-over panel component
- consistent badge system and status colors

---

## 16) Your output requirements
As Claude Code:
- Implement changes with minimal diff, file-by-file.
- After completing everything, print exactly:
`LYTHERA BUILD COMPLETE`

---

## Appendix A — Debug workflow (use when something breaks)
- Blank page: open browser devtools → Console → fix the first error
- API errors: devtools → Network → inspect response body and fix route/payload mismatch
- Docker issues:
  - `docker compose logs backend | tail -50`
  - `docker compose logs frontend | tail -50`

---

## Start now
Begin with the highest-impact fix:

**File 1:** `backend/app/routers/contacts.py`  
Fix prefix to `/api/contacts`, confirm it matches frontend expectations, and ensure it’s included in `backend/app/main.py` (edit that next if needed).
