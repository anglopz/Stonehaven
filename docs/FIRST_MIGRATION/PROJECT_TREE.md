# Project Tree — Canonical Structure (Post-Migration)

This document explains the **canonical** directory layout after the migration to TypeScript and React. Legacy EJS/JS lives only in `archive/legacy/` and is not part of the app.

---

## 1. Why It Looked Disorganized

You had (or saw) several confusing pieces:

| What you saw | What it actually was |
|--------------|----------------------|
| **Empty `api`, `middleware`, `models`, … under `src/backend/`** | Leftover **duplicate empty folders** next to `src/backend/src/`. The real code has always been under `src/backend/src/` (api, config, middleware, models, services, types, utils, validation). Those empty siblings were removed. |
| **Another nested `src`** | The **only** source of truth: `src/backend/src/` (backend) and `src/frontend/` (frontend). So “nested src” is correct: backend app lives under `src/backend/src/`. |
| **`dist/` with JS files** | **Build output**, not legacy. TypeScript compiles to JS; the backend build writes to `src/backend/dist/`. Those are compiled TS (modern stack). They are gitignored and should not be edited. |
| **`coverage/` with HTML** | **Test coverage reports** from Jest (backend: `src/backend/coverage/`). Standard tooling output, gitignored. Not source code. |

So: **no legacy JS in the active stack.** Legacy code is only under `archive/legacy/`. `dist` and `coverage` are build/test artifacts.

---

## 2. Canonical Tree (Source Only)

Only **source** and **config** are listed. Build outputs (`dist/`, `.next/`, `coverage/`) and dependencies (`node_modules/`) are omitted and belong in `.gitignore`.

```
Stonehaven/
├── .github/workflows/          # CI/CD
├── archive/
│   └── legacy/                # Legacy EJS/JS (reference only; not used by app)
├── docs/                      # All project docs (including this file)
├── infra/docker/              # Dockerfiles
├── scripts/                   # Build, verify, pre-deploy scripts
├── src/
│   ├── backend/               # Express API (TypeScript)
│   │   ├── src/               # ← All backend source lives here
│   │   │   ├── __tests__/     # Tests, fixtures, mocks, integration
│   │   │   ├── api/routes/    # HTTP routes (campgrounds, reviews, users, home)
│   │   │   ├── config/        # DB, passport, session, helmet, cloudinary, mapbox
│   │   │   ├── middleware/    # Auth, validation
│   │   │   ├── models/        # Mongoose models (Campground, Review, User)
│   │   │   ├── services/      # Business logic (campground, review, user)
│   │   │   ├── types/         # Shared types, module declarations
│   │   │   ├── utils/         # catchAsync, ExpressError
│   │   │   ├── validation/    # Zod schemas (campground, review)
│   │   │   └── index.ts       # App entry
│   │   ├── jest.config.js
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsconfig.test.json
│   ├── frontend/              # Next.js app (TypeScript/React)
│   │   ├── __tests__/
│   │   ├── app/               # App Router pages and layout
│   │   ├── components/        # UI, layout, campgrounds, reviews, auth
│   │   ├── hooks/
│   │   ├── lib/               # API client, constants, providers, utils
│   │   ├── stores/            # Zustand
│   │   ├── types/
│   │   ├── next.config.js
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── shared/                # Shared types (if any)
│       └── types/
├── .env.example
├── .gitignore
├── package.json               # Workspace root (backend + frontend)
├── render.yaml
├── tsconfig.json
├── tsconfig.backend.json
└── tsconfig.frontend.json
```

---

## 3. Folders That Are Not Source (Do Not Commit)

| Path | Purpose | Ignored by |
|------|---------|------------|
| `src/backend/dist/` | Compiled backend JS (from `tsc`) | `.gitignore` (`dist/`) |
| `src/frontend/.next/` | Next.js build and cache | `.gitignore` (`.next/`) |
| `src/backend/coverage/` | Jest HTML/text coverage reports | `.gitignore` (`coverage/`) |
| `node_modules/` | Dependencies | `.gitignore` |
| Root `dist/` | Optional root build output; not used by current scripts | `.gitignore` (`dist/`) |

Treat these as **generated**: delete and regenerate with `npm run build` / `npm test` as needed.

---

## 4. Backend Layout (Single Source of Truth)

All backend **source** lives under **`src/backend/src/`**:

- **`api/routes/`** — Express routers (campgrounds, reviews, users, home).
- **`config/`** — Database, Passport, session, Helmet, Cloudinary, Mapbox.
- **`middleware/`** — Auth, validation.
- **`models/`** — Mongoose schemas.
- **`services/`** — Use-case / business logic.
- **`types/`** — TypeScript types and module declarations.
- **`utils/`** — catchAsync, ExpressError.
- **`validation/`** — Zod schemas.

There are **no** parallel empty `api/`, `models/`, etc. directly under `src/backend/` anymore; those were removed.

---

## 5. Summary

- **One nested `src`**: backend app is `src/backend/src/`; frontend is `src/frontend/`. This is the intended layout.
- **Empty duplicate folders**: Removed from `src/backend/` (api, middleware, models, services, types, utils, validation).
- **`dist/`**: Compiled TypeScript → JS (modern stack), not legacy. Ignored.
- **`coverage/`**: Test reports. Ignored.
- **Legacy**: Only in `archive/legacy/` (EJS/JS); not used by the running app.

The tree is now aligned with a single, clear structure for the current TS/React stack.
