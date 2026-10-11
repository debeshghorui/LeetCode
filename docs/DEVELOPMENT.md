# MobLeet developer guide

MobLeet is a coding-practice app. A signed-in user browses problems, writes JavaScript, Python, or Java, and submits. The server runs the hidden tests and records the result.

This file is the map for humans and agents. Read it before changing auth, submissions, or the database. Expo SDK 57 APIs are documented at https://docs.expo.dev/versions/v57.0.0/ — use that version, not “latest”.

## Stack

- Expo SDK 57, React Native 0.86, React 19, expo-router (file routes under `src/app`)
- React Compiler is on (`experiments.reactCompiler` in `app.config.ts`)
- Supabase Auth (Google and GitHub, PKCE) and Postgres
- Judging through CodeBox at `https://chaicode.net/api/execute`
- Zustand for the session (`src/state/auth-store.ts`)
- Sentry and PostHog, both optional
- Package manager scripts use Bun (`bunx expo start`)

Import app code with `@/` (`src/*`) and assets with `@/assets/*`.

## Layout

```
src/app/                  expo-router screens and the submit API route
src/app/(auth)/           sign-in
src/app/(tab)/            Home, Problems, Profile
src/app/(tab)/problems/   list, problem detail, solve screen
src/app/auth/callback.tsx OAuth return screen
src/app/legal/            privacy and terms
src/app/api/submit+api.ts POST /api/submit (server only)
src/components/           code editor, heatmap, legal document
src/hooks/                auth selector, safe-area padding, tab bar
src/lib/                  supabase, auth, problems, judge, theme, analytics
src/state/                Zustand auth store
src/supabase/             SQL schema, account deletion, problem seed
env.ts                    client env schema (Zod)
app.config.ts             name, bundle id, plugins, variants
```

There is no top-level `app/` directory. Routes live in `src/app`.

## Screens

| Route                            | File                                    | What it does                                  |
| -------------------------------- | --------------------------------------- | --------------------------------------------- |
| `/`                              | `src/app/index.tsx`                     | Redirects to `/(tab)`                         |
| `/(auth)/sign-in`                | `src/app/(auth)/sign-in.tsx`            | Google and GitHub buttons                     |
| `/auth/callback`                 | `src/app/auth/callback.tsx`             | Finishes the OAuth redirect                   |
| `/(tab)`                         | `src/app/(tab)/index.tsx`               | Home: greeting, solved count, start a problem |
| `/(tab)/problems`                | `src/app/(tab)/problems/index.tsx`      | Problem list                                  |
| `/(tab)/problems/[id]`           | `src/app/(tab)/problems/[id]/index.tsx` | Statement, examples, past submissions         |
| `/(tab)/problems/[id]/solve`     | `src/app/(tab)/problems/[id]/solve.tsx` | Editor and submit                             |
| `/(tab)/profile`                 | `src/app/(tab)/profile.tsx`             | Account, heatmap, sign out, delete account    |
| `/legal/privacy`, `/legal/terms` | `src/app/legal/`                        | Copy from `src/lib/legal.ts`                  |

`src/app/_layout.tsx` is the gate. No session sends the user to sign-in, except `/auth/callback` and `/legal/*`. A session on the auth screens sends them home. Splash stays up until that decision.

The problem-detail stack hides the tab bar (`useHideTabBar` in `src/hooks/use-tab-bar-style.ts`).

## Auth

Session state lives in `useAuthStore`. `useAuth()` is the screen-facing selector. Do not call `supabase.auth` from a screen when the store already exposes the action.

Sign-in is OAuth with `skipBrowserRedirect: true`, then `WebBrowser.openAuthSessionAsync`. The native redirect must be `mobleet:///auth/callback` (three slashes). `mobleet://auth/callback` is parsed as host `auth` and path `/callback`, so the callback screen never opens.

Android often reports the browser as dismissed before the deep link arrives. `signInWithOAuth` therefore also listens to `Linking` and waits briefly. `initialize()` keeps the auth listeners for the process lifetime. Unsubscribing them on root remount drops the session created on the way back from Chrome. A late empty `SIGNED_IN` must not wipe a session that is already stored; only `SIGNED_OUT` clears it.

PKCE codes can be exchanged twice (browser result and linking event). `createSessionFromUrl` dedupes in-flight exchanges by code.

Supabase Dashboard → Authentication → URL Configuration needs:

- Site URL: the redirect from `getAuthRedirectUrl()`
- Redirect URLs: that same URL, `mobleet://**`, and `exp://**`

Account deletion calls the `delete_own_account` RPC (`src/supabase/delete_own_account.sql`). Profile, submissions, test results, and solved rows cascade from `auth.users`.

## Submitting a solution

```
solve screen
  → submitSolution() in src/lib/codebox.ts
  → POST {API}/api/submit  (Bearer access token)
  → src/app/api/submit+api.ts
  → recordSubmission() in src/lib/judge.ts
  → CodeBox executes every hidden test
  → service role writes submissions, test_case_results, and problem_solved
```

The phone never receives `test_cases` or `reference_solutions`. Postgres column grants hide them from `authenticated`. The judge reads them with `SUPABASE_SERVICE_ROLE_KEY`.

Language ids sent to CodeBox: JavaScript `63`, Python `71`, Java `62`. App language ids are lowercase (`javascript`, `python`, `java`). Snippet and example keys in the database are uppercase (`JAVASCRIPT`, `PYTHON`, `JAVA`). `src/lib/problems.ts` maps between them.

A case is accepted only when CodeBox status id is `3` or `4` and trimmed stdout equals the expected output. Any error case makes the submission `Error`. Otherwise a failed comparison is `Wrong Answer`. All cases accepted upserts `problem_solved`.

In dev, the API base is the Metro host (`Constants.expoConfig.hostUri`), falling back to `http://localhost:8081`. Release builds require `EXPO_PUBLIC_API_BASE_URL`. That variable is read directly in `src/lib/codebox.ts`. It is not part of the Zod schema in `env.ts`.

`runTask` from `expo-server` wraps the CodeBox calls so they survive the request on the server runtime.

## Database

Apply these in the Supabase SQL editor, in order:

1. `src/supabase/create_problem_schema.sql` — tables, RLS, column grants
2. `src/supabase/delete_own_account.sql` — required before account deletion works
3. `src/supabase/seed.sql` — problems. Safe to re-run; skips titles that already exist

Edit problem content in `src/supabase/seed/problems.ts`, then regenerate or update `src/supabase/seed.sql`. Clients cannot insert problems.

| Table               | Who can read                                | Who can write        |
| ------------------- | ------------------------------------------- | -------------------- |
| `problems`          | signed-in users, public columns only        | service role         |
| `profiles`          | own row; created by trigger on `auth.users` | trigger / cascade    |
| `submissions`       | own rows                                    | judge (service role) |
| `test_case_results` | rows whose submission is yours              | judge                |
| `problem_solved`    | own rows                                    | judge, on accept     |

`profiles.id` is `auth.users.id`. Display name and avatar come from `user.user_metadata`, not from `profiles`.

## Environment

`env.ts` must read each `EXPO_PUBLIC_*` value as its own `process.env.EXPO_PUBLIC_NAME`. Passing `process.env` through leaves them undefined in the client bundle. A failed parse sets `envConfigurationError` and the root layout shows “MobLeet could not start” instead of crashing.

Client (inlined into the app):

| Variable                   | Required     | Used for                                            |
| -------------------------- | ------------ | --------------------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL` | yes          | Supabase project URL, `https://….supabase.co`       |
| `EXPO_PUBLIC_SUPABASE_KEY` | yes          | anon key                                            |
| `EXPO_PUBLIC_SENTRY_DSN`   | no           | client crash reports                                |
| `EXPO_PUBLIC_POSTHOG_KEY`  | no           | product events                                      |
| `EXPO_PUBLIC_POSTHOG_HOST` | no           | defaults to `https://us.i.posthog.com`              |
| `EXPO_PUBLIC_API_BASE_URL` | release only | deployed `/api/submit` origin                       |
| `APP_VARIANT`              | no           | `development` (default), `preview`, or `production` |

Server and build only. Never prefix these with `EXPO_PUBLIC_`:

| Variable                       | Used for                                                                                                         |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY`    | judge writes and hidden tests                                                                                    |
| `CODEBOX_API_TOKEN`            | `x-api-key` for CodeBox. The error string in `judge.ts` says `CODEBOX_TOKEN`; the code reads `CODEBOX_API_TOKEN` |
| `SENTRY_DSN`                   | server Sentry if the public DSN is absent                                                                        |
| `SENTRY_ORG`, `SENTRY_PROJECT` | Sentry Expo config plugin at build time                                                                          |

`npm run dev` sets `APP_VARIANT=devlopment`. That spelling is not in the Zod enum, so the whole env parse fails and the app will not open. Start local work with `bunx expo start`, or export `APP_VARIANT=development`.

Variants change the install identity in `app.config.ts`:

- development → `MobLeet (Dev)`, `com.debeshghorui.mobleet.dev`
- preview → `MobLeet (Preview)`, `com.debeshghorui.mobleet.preview`
- production → `MobLeet`, `com.debeshghorui.mobleet`

Deep link scheme is `mobleet`. EAS project id is in `app.config.ts`. Channels are `development`, `preview`, and `production` (`eas.json`).

## Observability

`initObservability()` runs once at import time in the root layout. It no-ops when the DSN or PostHog key is missing.

Client events: `auth_completed`, `problem_opened`, `submit_started`, `submit_finished`, `api_failed`. Sentry breadcrumbs for those events do not include source code. Fetch breadcrumbs drop request bodies. Identify with the Supabase user id only.

The judge reports separately via `@sentry/node` in `src/lib/sentry-server.ts` (`runtime: server`). Do not import that file from a screen.

## UI conventions

Colors live in `src/lib/theme.ts`. Background `#0a0a0c`, accent lime `#bdf06e`. Screens use `Pressable`, `gap` for sibling spacing, and `useScreenInsets` for scroll padding.

The editor (`src/components/code-editor.tsx`) is a `TextInput` with a Prism highlight layer behind it. Grammars are registered in `src/lib/prism-languages.ts`.

React Compiler is enabled, so do not add `memo` or `useCallback` by habit. Reanimated shared values, if introduced, should use `.get()` and `.set()`. Do not render `0` or `""` with `&&` inside `View`. Strings belong in `Text`.

## Commands

```bash
bun install
bunx expo start          # local, APP_VARIANT defaults to development
bun run preview          # APP_VARIANT=preview
bun run ios
bun run android
bun run lint
bun run format
```

This app uses a dev client (`expo-dev-client`), not Expo Go, because of the native modules in use.

## Rules that are easy to break

- Do not select `test_cases` or `reference_solutions` from the client. The grant will fail, and shipping them would leak the judge.
- Do not write submissions from the client. Inserts go through `recordSubmission`.
- Do not change the OAuth redirect to `mobleet://auth/callback`.
- Do not unsubscribe the auth listeners when the root layout remounts.
- Do not put the service role key or CodeBox token in an `EXPO_PUBLIC_` variable.
- Do not log or send source code to Sentry or PostHog.
- Keep legal copy in `src/lib/legal.ts` in sync with what the privacy screen promises (diagnostics exclude source code, deletion cascades).
