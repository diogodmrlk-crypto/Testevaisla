# CentralAuth TSX

A React + Vite frontend application — mobile phone-style key management panel, rebuilt from the original PHP version to TSX.

## Architecture

- **Framework**: React 19 + Vite 7
- **Styling**: Custom CSS (PHP-original design) — DM Sans font, blue gradient, phone container
- **Routing**: State-based navigation (no router library)
- **Auth**: Client-side key-based authentication with localStorage session persistence + HWID locking

## Structure

- `client/` — React application (src/, public/, index.html)
  - `src/main.tsx` — Entry point, wraps app in AuthProvider
  - `src/App.tsx` — Root component: shows Login or MainApp (with AppProvider)
  - `src/index.css` — All CSS (custom, from PHP original)
  - `src/contexts/AuthContext.tsx` — Auth state: login/logout/session
  - `src/contexts/AppContext.tsx` — App state: keys, packages, navigation, modals, toasts
  - `src/data/keys.ts` — Static keys database (HWID-based)
  - `src/pages/Login.tsx` — Login page
  - `src/pages/Home.tsx` — Home page (stats, chart, quick actions)
  - `src/pages/Keys.tsx` — Keys list with search, select, delete, copy
  - `src/pages/Devices.tsx` — Devices & sessions list
  - `src/pages/Packages.tsx` — Package management
  - `src/pages/Profile.tsx` — Profile, language, support, logout
  - `src/components/Modals.tsx` — All 6 modals (Create Key, Add Package, Integration, Device Action, Language, Support)
- `shared/` — Shared constants
- `vite.config.ts` — Vite config at root, `root: "client"`, port 5000, host 0.0.0.0

## Path Aliases

- `@` → `client/src/`
- `@shared` → `shared/`

## API

- Keys API: `https://teste-api-mcok.vercel.app/keys`
- Support: Discord webhook (hardcoded in AppContext)

## Key Design Decisions

- Phone container `.phone` (max 430px, 100dvh) centers on desktop
- Blue gradient `#1a56e8 → #1240c0` for header/login
- All state in AppContext (generatedKeys, apiKeys, packages, limitCount, chartData)
- Keys stored in localStorage with `ferrao_*` prefix
- HWID binding prevents key sharing across devices
