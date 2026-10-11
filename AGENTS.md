# MobLeet

Read `docs/DEVELOPMENT.md` before changing routes, auth, submissions, or the database. It is the map of this repo.

# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code. Do not follow unversioned “latest” pages.

# Do not break these

- Routes live in `src/app`, not a top-level `app/` directory. `@/` maps to `src/*`.
- The phone must not read `test_cases` or `reference_solutions`, and must not insert submissions. Judging is `POST /api/submit` → `src/lib/judge.ts`, using the service role.
- Native OAuth redirect is `mobleet:///auth/callback` (three slashes). Keep auth listeners for the process lifetime.
- `EXPO_PUBLIC_*` values are read one by one in `env.ts`. Never prefix `SUPABASE_SERVICE_ROLE_KEY` or `CODEBOX_API_TOKEN` with `EXPO_PUBLIC_`.
- Do not send source code to Sentry or PostHog.
- React Compiler is enabled. Do not render `0` or `""` with `&&` inside a `View`.
