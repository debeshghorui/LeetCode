# MobLeet

Coding-practice app. Sign in with Google or GitHub, solve problems in JavaScript, Python, or Java, and submit against hidden tests.

## Develop

```bash
bun install
bunx expo start
```

Use a development build (`expo-dev-client`), not Expo Go. `APP_VARIANT` must be `development`, `preview`, or `production`. The `dev` script currently sets `devlopment`, which fails env validation.

Architecture, auth, judging, database, and environment variables: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

Expo SDK 57: https://docs.expo.dev/versions/v57.0.0/
