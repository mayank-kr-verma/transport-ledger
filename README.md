# Transport Ledger

Local-first, mobile-first transport business management app for small fleet operators. Ledger-first: every trip, expense, and driver payment doubles as a financial entry. All data stays on the device — no backend, no cloud, no account.

Built with **Next.js 16 + Dexie (IndexedDB) + Tailwind**, packaged as an **Android APK** via Capacitor.

## What it does

- Manage trucks (owned + market/rented), parties (customers), drivers
- Record trips → auto-creates Dr ledger entry for the party
- Free-flow ledger entries: payments received, advances, adjustments — independent of any trip
- Track expenses by category (fuel, toll, EMI, maintenance, repair, office, misc) and by truck
- Driver salary / advance tracking with running payable
- **P&L report**: overall + per-truck + per-party + per-trip with date range
- Export reports as PDF or Excel
- JSON backup / restore (the only way to migrate data between devices)
- 4-digit PIN lock (PBKDF2)

## Quick Start

```bash
npm install
npm run dev          # http://localhost:3000 — set PIN and try it in browser

# Build APK (no Android Studio needed):
# Push to GitHub → .github/workflows/android-apk.yml builds + uploads APK as artifact.

# Or build APK locally if you have Android SDK + Java 21:
npm run android:apk
```

## For developers / contributors

Read **[CLAUDE.md](./CLAUDE.md)** for the full project context: data model, ledger rules, folder map, Next 16 gotchas, Capacitor packaging, common edits, and troubleshooting.

## License

Private project.
