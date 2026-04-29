# Sehat

AI-first healthcare recovery and rehabilitation web app (formerly "RecoveryOS"). Tagline: "Sehat – Aapki Health ka Saathi". Patients onboard with their condition, get an AI-generated recovery plan, log daily check-ins (pain + adherence), chat with an AI assistant, and clinicians review patients, edit plans, and add notes. Free vs paid tier with feature gating. Bilingual: English (default) and simple Hindi (Latin-script).

## i18n
Lightweight in-house i18n at `src/lib/i18n/`:
- `en.json` / `hi.json` — flat key/value dictionaries
- `index.tsx` — `<I18nProvider>` (wraps the app), `useT()` hook returns `{ language, setLanguage, t }`
- Selected language persisted to `localStorage["appLanguage"]`
- `<LanguageSelect>` component used on landing, role-select, onboarding, and Settings

## Learn section
`/learn` (patient nav, "Sehat Sikhein" in Hindi) — mock article cards from `src/services/contentService.ts` linking out to https://www.healthbits360.com/.

## Architecture

Monorepo (pnpm workspaces) with three artifacts and shared libs.

### Artifacts
- `artifacts/api-server` — Express 5 + Node, serves `/api/*` on port 8080. Validates with Zod schemas from `@workspace/api-zod`. Pino logging.
- `artifacts/recovery-os` — React + Vite + Tailwind v4 web app, served at `/`. Uses wouter for routing, TanStack Query, recharts, framer-motion, shadcn/ui. Calming teal/sand palette with Outfit + Playfair Display fonts.
- `artifacts/mockup-sandbox` — design canvas (template, unused).

### Shared libs
- `lib/api-spec` — OpenAPI 3.1 contract (`openapi.yaml`). Source of truth for API.
- `lib/api-client-react` — Orval-generated React Query hooks.
- `lib/api-zod` — Orval-generated Zod schemas (used by both server and client).
- `lib/db` — Drizzle ORM schemas and `db` client. Tables: `sessions`, `users`, `user_profiles`, `patient_profiles`, `recovery_plans`, `tracking_entries`, `chat_messages`, `clinician_notes`.
- `lib/replit-auth-web` — `useAuth()` hook for browser auth.
- `lib/integrations-openai-ai-server` — Replit-managed OpenAI client (no API key needed).

### Auth
Replit Auth (OIDC) — browser session via httpOnly cookie; `authMiddleware` populates `req.user`. New users default to no role until they pick patient/clinician on `/role-select`.

### AI
- Recovery plans generated on-demand via `gpt-5.4` JSON-mode in `services/aiPlanGenerator.ts`. Falls back to a safe baseline plan on failure.
- Chat assistant uses `gpt-5.4` with patient context (condition + baseline pain). Free tier capped at 10 messages/24h.

### Subscription gating
Stored on `user_profiles.subscription_tier`. Free tier: 1 plan generation, 10 chat messages/day. Paid tier: unlimited. Mock toggle on the Settings page.

## Common commands
- `pnpm --filter @workspace/api-spec run codegen` — regen client + zod after editing `openapi.yaml`.
- `pnpm --filter @workspace/db run push` — push DB schema changes.
- `pnpm run typecheck` — full repo typecheck.
- Workflows: `artifacts/api-server: API Server`, `artifacts/recovery-os: web`.
