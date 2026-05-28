@AGENTS.md

# Transport Ledger

A **local-first, mobile-first transport business management app**. Ledger-first design: every operational record (trip, expense, driver payment) doubles as a financial entry. Built as a Next.js PWA and packaged as an Android APK via Capacitor.

Targets small transport/fleet operators in India who want a lightweight ERP replacement: trucks, parties (customers), drivers, trips, expenses, party ledgers, driver payables, and a P&L report — **all stored locally on the device**, no backend, no cloud, no account.

---

## Quick Start

```bash
# 1. Install deps
npm install

# 2. Run in browser (development)
npm run dev          # http://localhost:3000

# 3. Build static export (also used as input for Android APK)
npm run build        # output → out/

# 4. Sync web assets into Android project
npm run android:sync

# 5. Build a debug APK locally (needs Android SDK + Java 21)
npm run android:apk
# → android/app/build/outputs/apk/debug/app-debug.apk

# OR — build APK without installing Android Studio:
# Push to GitHub, the workflow at .github/workflows/android-apk.yml
# runs automatically and uploads the APK as a build artifact.
```

First-run flow: app prompts for a **4-digit PIN**. Set one. PIN is hashed (PBKDF2 + random salt) and stored locally; there is no recovery — losing it means wiping data.

---

## Project Decisions (Locked)

| Topic | Decision | Reason |
|---|---|---|
| Platform | Mobile-first PWA, packaged as Android APK via Capacitor | Single codebase, offline-capable, no Android Studio required |
| Storage | IndexedDB via Dexie.js | All data lives on device. No backend. |
| Auth | 4-digit PIN (PBKDF2 hash) | Single owner; protects against casual access only |
| Currency | INR (₹), India number format (lakh/crore) | Target users |
| GST | Capture GSTIN on parties, optional GST% per trip | No filing/returns in MVP |
| Users | Single owner per device | Multi-user deferred |
| Backup | Manual JSON export/import; PDF + Excel exports per report | No cloud sync |

---

## Tech Stack

- **Next.js 16** (App Router, TypeScript, src dir, `@/*` alias). Turbopack default. `output: "export"` for static SPA build that Capacitor wraps.
- **Tailwind v4** (postcss plugin)
- **Dexie.js** (IndexedDB wrapper) — all data
- **react-hook-form** + simple validation
- **jsPDF + jspdf-autotable** — PDF exports
- **xlsx (SheetJS)** — Excel exports
- **Recharts** — dashboard (installed, room to grow)
- **lucide-react** — icons
- **Capacitor v6** — Android shell (v6 pinned for Node 20 compat; v7+ needs Node 22)

---

## Next.js 16 gotchas

- `params` / `searchParams` are **Promises** — `await props.params` in pages. We avoid this by using query strings (see below).
- All pages that hit Dexie must be `"use client"` (IndexedDB is browser-only).
- No `next lint` — ESLint runs directly.
- Static export does **not** support `[id]` dynamic routes without `generateStaticParams`. We use query strings instead: `/trucks/edit?id=5`.

---

## Folder Map

```
transport-ledger/
├── CLAUDE.md                       # this file
├── AGENTS.md                       # warning about Next 16 changes
├── capacitor.config.ts             # appId, appName, webDir
├── next.config.ts                  # output: "export"
├── package.json                    # npm scripts
├── public/
│   ├── manifest.json               # PWA manifest
│   └── icon.svg                    # app icon (SVG, used for any size)
├── android/                        # Capacitor-generated Android project (commit it)
├── out/                            # Next.js static export output (gitignored)
├── .github/workflows/
│   └── android-apk.yml             # CI: builds APK on push to main
└── src/
    ├── app/                        # App Router pages (all client)
    │   ├── layout.tsx              # PinGate + nav shell + global metadata
    │   ├── page.tsx                # Dashboard
    │   ├── trucks/
    │   │   ├── page.tsx            # list
    │   │   ├── new/page.tsx        # add (uses TruckForm)
    │   │   └── edit/page.tsx       # edit via ?id= (uses TruckForm)
    │   ├── parties/
    │   │   ├── page.tsx            # list
    │   │   ├── new/page.tsx
    │   │   ├── edit/page.tsx       # edit form
    │   │   └── view/page.tsx       # detail + ledger (PartyDetail)
    │   ├── drivers/                # list, new, edit, view (same pattern)
    │   ├── trips/                  # list, new, edit
    │   ├── expenses/               # list, new, edit
    │   ├── reports/pl/page.tsx     # P&L report (overall, per-truck, per-party, per-trip)
    │   └── settings/page.tsx       # business info, change PIN, backup/restore, wipe
    ├── components/
    │   ├── PinGate.tsx             # first-run PIN setup, subsequent PIN check
    │   ├── BottomNav.tsx           # mobile bottom tabs + desktop sidebar
    │   ├── PartyDetail.tsx         # party page (ledger + free-flow entry form)
    │   ├── DriverDetail.tsx        # driver page (payments + balance)
    │   ├── ui/primitives.tsx       # Button, Input, Select, Field, Card, etc.
    │   └── forms/
    │       ├── TruckForm.tsx
    │       ├── PartyForm.tsx
    │       ├── DriverForm.tsx
    │       ├── TripForm.tsx
    │       └── ExpenseForm.tsx
    ├── db/
    │   ├── schema.ts               # Dexie tables, types, version 1
    │   └── ledger.ts               # syncTripLedger, partyBalance, cascade delete
    └── lib/
        ├── inr.ts                  # paise<->rupees converters, ₹ formatter
        ├── pin.ts                  # PBKDF2 hash/verify via WebCrypto
        ├── cn.ts                   # className merge (clsx + tw-merge)
        ├── pl.ts                   # P&L aggregators (overall, perTruck, perParty, perTrip)
        └── export.ts               # JSON dump/restore, PDF, Excel exporters
```

---

## Data Model (Dexie schema v1)

All amounts stored as **paise integers** (avoid float drift). Dates stored as ISO `YYYY-MM-DD` strings.

```ts
trucks       ++id, number, type[owned|market], ownerName?, registrationDate?, notes?
parties      ++id, name, gstin?, phone?, address?,
             openingBalance (paise), openingType[dr|cr]
drivers      ++id, name, phone?, licenseNo?, joiningDate?,
             openingBalance (paise; +ve = we owe driver)
trips        ++id, tripDate, lrNo?, truckId, partyId, driverId?,
             fromCity, toCity, freightAmount (paise), gstPercent,
             advance (paise), status[open|completed|settled], notes?
expenses     ++id, date, category[office|maintenance|fuel|toll|emi|repair|misc],
             truckId?, amount (paise), paidTo?, paymentMode?, notes?
ledger       ++id, date, partyId, type[dr|cr], amount (paise),
             refType[trip|payment|advance|adjustment|opening], refId?, notes?
driverPay    ++id, date, driverId, type[salary|advance|adjustment],
             amount (paise), notes?
settings     id=1, businessName, businessGstin?, pinHash?, salt?, lastBackupAt?
```

**Ledger rules** (see `src/db/ledger.ts`):

- Trip create/update → auto Dr ledger entry of `freight + gst`, `refType=trip`, `refId=tripId`. Handled by `syncTripLedger(trip)`.
- Trip delete → cascade delete its ledger row via `deleteTripCascade(id)`.
- Manual Cr (payment received), Dr (extra charge), or adjustment can be added independently of trips (the "free-flow ledger" requirement from the vision doc).
- Party balance = `opening (signed by openingType) + Σ Dr − Σ Cr`. Positive = party owes us.

**Driver balance** (computed in `src/app/drivers/page.tsx`):

- Starts at `openingBalance` (+ve = we owe driver).
- `salary` → increases payable (we owe more).
- `advance` → decreases payable (driver took money).
- `adjustment` → adds amount (use negative amount via UI if needed).

**P&L** (`src/lib/pl.ts`):

- **Income** = Σ `trip.freightAmount` in date range (excludes GST, as GST is pass-through).
- **Expense** = Σ `expenses.amount` in range.
- **Driver Pay** = Σ `driverPay.amount where type=salary` in range.
- **Profit** = Income − Expense − Driver Pay.
- Slice tabs: Overall | Per Truck | Per Party | Per Trip.

---

## Important patterns

### Read-only vs read-write in Dexie

`useLiveQuery` from `dexie-react-hooks` runs its factory **inside a read-only transaction**. You will get `ReadOnlyError` if you `put`/`add`/`update` inside the factory.

✅ Correct:
```ts
const settings = useLiveQuery(() => readSettings(), []);  // read-only
useEffect(() => { ensureSettings(); }, []);               // write
```

❌ Wrong:
```ts
const settings = useLiveQuery(() => getSettings(), []);   // getSettings writes if missing → throws
```

Bug we hit & fixed early — `getSettings` was split into `readSettings` (read-only) + `ensureSettings` (write).

### Money handling

UI inputs are in rupees (string). Convert on submit:
```ts
toPaise("1234.56") // → 123456
toRupees(123456)    // → 1234.56
fmtINR(123456)      // → "₹1,234.56"
```

### Dynamic routes via query strings (NOT `[id]`)

Because `output: "export"` cannot generate pages for arbitrary IDs, all detail/edit pages live at fixed paths and read `id` from `?id=` via `useSearchParams()`. Each such page wraps its inner component in `<Suspense fallback={null}>` (required by Next).

Links: `/trucks/edit?id=5`, `/parties/view?id=12`, etc.

### Form pattern

Every form (Truck, Party, Driver, Trip, Expense) follows the same shape:
1. `useForm<FormVals>` with sensible defaults
2. `useLiveQuery(async () => id ? await db.X.get(id) : undefined, [id])` to load when editing
3. `useEffect` to `reset()` the form once existing data arrives
4. On submit, convert money fields to paise, then `db.X.update(id, data)` or `db.X.add(data)`
5. For trips specifically, also call `syncTripLedger(trip)` after add/update

---

## Android packaging (Capacitor)

### Files
- `capacitor.config.ts` — `appId`, `appName`, `webDir: "out"`
- `android/` — generated Android project. Commit it. Modifications to `android/app/src/main/AndroidManifest.xml` or icons live here.

### How it works
1. `npm run build` produces `out/` (static HTML + JS + Dexie + assets).
2. `npx cap sync android` copies `out/` into `android/app/src/main/assets/public/`.
3. Android WebView loads the app from `file:///android_asset/public/index.html` — fully offline. IndexedDB persists in the WebView's per-app storage.

### Local APK build (requires Android SDK + Java 21)
```bash
npm run android:apk
# APK at: android/app/build/outputs/apk/debug/app-debug.apk
```

### Cloud APK build (no Android Studio needed) — **recommended for now**

1. Initialize git and push to a GitHub repo:
   ```bash
   git init
   git add -A
   git commit -m "Initial transport ledger app"
   gh repo create transport-ledger --private --source=. --remote=origin --push
   ```
2. GitHub Actions auto-runs `.github/workflows/android-apk.yml` on push to `main`.
3. Open the Actions tab on GitHub → latest run → download artifact `transport-ledger-debug` → unzip → install `app-debug.apk` on phone (enable "Install unknown apps" for whichever file manager opens it).

### Signing a release APK (when ready to publish)
- Generate a keystore (`keytool -genkey ...`).
- Add signing config to `android/app/build.gradle`.
- Use `./gradlew assembleRelease`.
- Or use the **Android Studio → Build → Generate Signed Bundle** UI on any machine that has it.

### Updating the app
After code changes:
```bash
npm run android:sync   # rebuilds web + copies into android/
```
Then either rebuild the APK locally or push to GitHub for CI rebuild.

### Updating the icon
Replace `public/icon.svg`, then regenerate Android icons with [`@capacitor/assets`](https://github.com/ionic-team/capacitor-assets) (not currently installed — add when needed).

---

## Backup & data safety

- **Where is data?** Dexie/IndexedDB inside the WebView's per-app storage. Uninstalling the APK or wiping app data **destroys all records**. There is no automatic backup.
- **Manual backup**: Settings → Export JSON → save the file to Drive/email yourself. Restore via Settings → Import JSON.
- **PDF/Excel exports**: per-report from the P&L screen and per-party from the party detail screen. These are reports, not backups — they can't be reimported.
- **PIN reset**: there is none. If forgotten: Settings → Erase All Data (or uninstall app), then restore from a JSON backup if available.

---

## Out of scope (deferred per vision doc)

- GPS tracking / driver location
- Invoice generation (PDF invoices distinct from ledger PDF)
- Supplier/vendor ledgers
- Advanced driver accounting (trip-wise commission, fuel allowances)
- Multi-user / role-based access
- GST returns / e-invoicing
- Document uploads (RC copies, license scans)
- Push notifications
- AI-based insights
- Google Drive sync

These are intentionally absent from MVP to keep the app focused on the ledger-first workflow.

---

## Common edits — quick recipes

### Add a new expense category
1. Add to `ExpenseCategory` union in `src/db/schema.ts`.
2. Add an `<option>` in `src/components/forms/ExpenseForm.tsx`.
3. Add a label entry in `catLabel` in `src/app/expenses/page.tsx`.

### Change the trip → ledger formula (e.g. exclude GST from receivables)
Edit `syncTripLedger` in `src/db/ledger.ts`.

### Add a new top-level page
1. Create `src/app/<name>/page.tsx` with `"use client"`.
2. Add a tab entry in `src/components/BottomNav.tsx` (`tabs` or `more` array).

### Change the app name / appId on Android
Edit `capacitor.config.ts`, then run `npx cap sync android`. For appId changes, you may need to also adjust `android/app/build.gradle` `applicationId` and `android/app/src/main/AndroidManifest.xml`.

### Bump Dexie schema (add a column or table)
Add a new `this.version(2).stores({ ... })` block in `src/db/schema.ts`, optionally with `.upgrade(tx => ...)` to migrate existing rows. **Never edit version 1** — Dexie uses version numbers to migrate users forward.

---

## Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| `ReadOnlyError: Readwrite transaction in liveQuery context` | A `db.X.put/add/update` is being called inside a `useLiveQuery` factory. Move the write into `useEffect`. |
| `params is a Promise` TS error | Next 16: `await props.params` (we mostly use query strings, so this won't appear). |
| `next build` fails with `generateStaticParams` for dynamic route | Move that route to a query-string form (see existing routes). |
| APK installed but app crashes on launch | Usually a missing asset or unsynced web build. Run `npm run android:sync` and rebuild. |
| Capacitor CLI complains about Node version | We pin `@capacitor/*@6` for Node 20. Don't upgrade to v7+ unless on Node 22+. |
| Lost PIN | No recovery. Settings → Erase All Data, or uninstall and reinstall, then restore JSON backup. |

---

## Progress checklist

- [x] Phase A: scaffold + deps
- [x] Phase B: Dexie schema + PIN gate + shell
- [x] Phase C: CRUD trucks/parties/drivers/expenses
- [x] Phase D: Trips + ledger auto-entry + party ledger view (free-flow entries)
- [x] Phase E: Driver pay + dashboard + P&L (overall/truck/party/trip)
- [x] Phase F: JSON backup/restore + PDF + Excel exports + settings + change PIN
- [x] Phase G: PWA manifest + SVG icon
- [x] Capacitor Android wrapper + GH Actions APK pipeline
- [ ] Per-truck deep page (trips + expenses filtered)
- [ ] Service worker (truly optional — Capacitor is already offline)
- [ ] Release/signed APK + Play Store listing

## Verified
- `npx tsc --noEmit` clean
- `npm run build` produces 21 static pages in `out/`
- `npx cap sync android` succeeds
- All routes return 200 in `next dev`
- PIN flow tested end-to-end (first-run PIN set → lock → unlock)
