# Loan Factory Borrower Portal

The borrower-facing web portal for Loan Factory, built with the [Next.js](https://nextjs.org)
App Router. Borrowers use it to track their loans, complete their application, manage rate
alerts, request quotes, and chat with the AI assistant.

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 ·
shadcn/ui · Redux Toolkit + redux-persist · react-hook-form + Zod · TanStack Table ·
i18next · Vitest.

## Getting Started

This project uses **Yarn** (see `packageManager` in `package.json`).

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Editing files under
`app/` hot-reloads the page.

Common scripts:

```bash
yarn dev            # dev server (Turbopack)
yarn build          # production build
yarn start          # serve the production build
yarn lint           # ESLint
yarn format         # Prettier write
yarn format:check   # Prettier check
yarn test           # Vitest (run once)
yarn test:watch     # Vitest (watch)
```

## Project Structure

The app is organized by **business domain** (a feature-based / vertical-slice architecture),
not by technical layer. Each route under `app/` maps to one domain (e.g. My Loans,
Application, Rate Alerts, Quote, AI Assistant), and everything that domain needs — UI, logic,
API calls, and types — lives together inside its folder. Editing a feature usually touches
only that one directory. Only code genuinely shared across domains is lifted to the root
(`components/ui`, `lib`, `store`, `hooks`, `i18n`, `repository`). The Next.js App Router paths
line up with these domain boundaries (`/my-loans` ↔ the My Loans domain).

Current domains under `app/`:

```
application      loan-purpose     my-rate-alert    quote          testimonials
ai-assistant     loanfactory-iq   policies         rate-alerts
get-started      my-loans         login            settings
```

Each domain folder follows a consistent shape:

```
app/<feature>/
├─ page.tsx            # route entry
├─ components/         # UI specific to this feature (modal-*, tab-*, ...)
├─ helpers/            # pure logic, mappers, feature constants + co-located tests
│  ├─ index.ts
│  └─ index.test.ts
└─ services/           # API layer
   ├─ index.ts         # request functions
   └─ types.ts         # API request/response types
```

Nested routes live as subfolders of their domain (e.g. `app/my-loans/documents`,
`app/my-loans/messages`).

Conventions:

- **Validation schemas** are defined **inline** in the form component that uses them
  (e.g. `const fooSchema = z.object({ ... })` in `components/modal-foo-form.tsx`), not in a
  separate file.
- **Feature-specific constants and helpers** live in `helpers/index.ts`. Avoid per-feature
  `lib/` folders — keep feature code under `components / helpers / services`.
- **Shared** code lives at the root: `components/` (with `components/ui/` for shadcn
  primitives), `components/layouts/`, `hooks/`, `lib/`, `store/` (Redux Toolkit slices +
  persisted auth), `i18n/`, `repository/` (the shared Axios client).

## Testing

Tests run with [Vitest](https://vitest.dev). They are split **by scope**:

- **Local (feature) tests** are co-located next to the code they cover, e.g.
  `app/<feature>/helpers/index.test.ts`.
- **Global (shared) tests** live under `tests/`, mirroring the shared source — e.g.
  `tests/lib/helpers.test.ts`, `tests/components/badge.test.tsx`.

```bash
yarn test         # run once
yarn test:watch   # watch mode
```

## Continuous Integration

GitHub Actions runs lint, type-check, unit tests, and a production build on every push to
`master` and on pull requests targeting `master`. See
[`.github/workflows/ci.yml`](.github/workflows/ci.yml).
