# MobLeet

MobLeet is a mobile coding-practice app. Sign in with Google or GitHub, read a problem, write a solution in JavaScript, Python, or Java, and submit it. Hidden tests run on the server. Your result, runtime, and solved progress stay on your account.

It is an independent app. It is not affiliated with LeetCode.

## What you can do

- Browse problems by title and difficulty
- Read the statement, examples, constraints, and hints
- Edit starter code with syntax highlighting
- Submit and see which cases passed
- Track solved problems and a year of submission activity
- Sign out or delete the account from Profile

Privacy and terms are in the app at `/legal/privacy` and `/legal/terms`.

## Stack

| Piece                    | Choice                                                |
| ------------------------ | ----------------------------------------------------- |
| App                      | Expo SDK 57, React Native 0.86, React 19, expo-router |
| Auth and data            | Supabase (Google and GitHub, PKCE)                    |
| Judge                    | CodeBox at `https://chaicode.net/api/execute`         |
| Session                  | Zustand                                               |
| Crash and product events | Sentry and PostHog, both optional                     |

Routes live in `src/app`. Import app code with `@/`.

API details for this SDK: https://docs.expo.dev/versions/v57.0.0/

## Requirements

- [Bun](https://bun.sh)
- A Supabase project
- A development build of the app (`expo-dev-client`). Expo Go is not enough for the native modules this project uses.
- Xcode for the iOS simulator, or Android Studio for an emulator

## Setup

Install dependencies:

```bash
bun install
```

Create a `.env` in the project root.

```bash
APP_VARIANT=development

EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your-anon-key

# Server only. Never prefix these with EXPO_PUBLIC_.
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CODEBOX_API_TOKEN=your-codebox-token

# Optional
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_POSTHOG_KEY=
EXPO_PUBLIC_POSTHOG_HOST=
SENTRY_ORG=
SENTRY_PROJECT=

# Required for store builds. Dev uses the Metro host automatically.
EXPO_PUBLIC_API_BASE_URL=
```

`EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY` are required. If either is missing, the app opens on a configuration error instead of the sign-in screen.

`APP_VARIANT` must be `development`, `preview`, or `production`. `bun run dev` currently sets `devlopment`, which fails that check. Start local work with:

```bash
bunx expo start
```

### Database

In the Supabase SQL editor, run these files in order:

1. `src/supabase/create_problem_schema.sql` — tables, row-level security, and column grants
2. `src/supabase/delete_own_account.sql` — required before Profile → Delete account works
3. `src/supabase/seed.sql` — starter problems. Safe to re-run; existing titles are skipped

Edit problem content in `src/supabase/seed/problems.ts`, then update `src/supabase/seed.sql`.

The phone can read problem statements and starter code. It cannot read `test_cases` or `reference_solutions`. Those columns are service-role only, and the judge uses them from `POST /api/submit`.

### Sign-in redirects

In Supabase Dashboard → Authentication → URL Configuration, set the Site URL to the redirect this app generates, and add:

- that same redirect URL
- `mobleet://**`
- `exp://**`

Enable the Google and GitHub providers there as well.

## Run

```bash
bunx expo start
```

Then open the development build on a simulator or device. The first native install:

```bash
bun run ios
bun run android
```

Preview variant:

```bash
bun run preview
```

| Script            | What it does                                        |
| ----------------- | --------------------------------------------------- |
| `bunx expo start` | Local Metro server. Variant defaults to development |
| `bun run preview` | Same server with `APP_VARIANT=preview`              |
| `bun run ios`     | Build and run the iOS dev client                    |
| `bun run android` | Build and run the Android dev client                |
| `bun run web`     | Expo web                                            |
| `bun run lint`    | ESLint                                              |
| `bun run format`  | Prettier                                            |

Development and preview installs use a different name and application id so they can sit beside the store app:

| Variant     | Name              | Application id                     |
| ----------- | ----------------- | ---------------------------------- |
| development | MobLeet (Dev)     | `com.debeshghorui.mobleet.dev`     |
| preview     | MobLeet (Preview) | `com.debeshghorui.mobleet.preview` |
| production  | MobLeet           | `com.debeshghorui.mobleet`         |

The deep-link scheme is `mobleet`. Store and internal builds are configured in `eas.json`.

## Project layout

```
src/app/            screens and POST /api/submit
src/components/     code editor, activity heatmap, legal document
src/hooks/          auth, safe area, tab bar
src/lib/            Supabase, auth, problems, judge, theme
src/state/          session store
src/supabase/       schema, account deletion, problem seed
env.ts              client environment schema
app.config.ts       name, ids, plugins, variants
```

## Where to read next

[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) is the map for changing auth, submissions, or the database. It covers the OAuth redirect, the judge, which tables the client may touch, and the rules that are easy to break.
