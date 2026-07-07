This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Project Structure

The app is organized by **business domain** (a feature-based / vertical-slice architecture),
not by technical layer. Each route under `app/` maps to one domain (e.g. Companies, Licenses,
SSO, LLM Providers), and everything that domain needs — UI, logic, API calls, and types — lives
together inside its folder. Editing a feature usually touches only that one directory. Only code
genuinely shared across domains is lifted to the root (`components/ui`, `lib`, `store`, `hooks`,
`i18n`, `repository`). The Next.js App Router paths line up with these domain boundaries
(`/companies` ↔ the Companies domain).

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

Conventions:

- **Validation schemas** are defined **inline** in the form component that uses them
  (e.g. `const fooSchema = z.object({ ... })` in `components/modal-foo-form.tsx`), not in a
  separate file.
- **Feature-specific constants and helpers** live in `helpers/index.ts`. Avoid per-feature
  `lib/` folders — keep feature code under `components / helpers / services`.
- **Shared** code lives at the root: `components/` (with `components/ui/` for shadcn primitives),
  `components/layouts/`, `hooks/`, `lib/`, `store/`, `i18n/`, `repository/`.

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
