// Client env. Each EXPO_PUBLIC_* value must be read as its own process.env
// key or the Expo bundler leaves it undefined. A failed parse sets
// envConfigurationError and the root layout shows a startup message.
// Service-role and CodeBox tokens do not belong in this file.
import { z } from "zod";

const optionalUrl = z.preprocess(
    (value) =>
        typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().url().optional(),
);

const optionalKey = z.preprocess(
    (value) =>
        typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().min(1).optional(),
);

const envSchema = z.object({
    APP_VARIANT: z
        .enum(["development", "preview", "production"])
        .optional()
        .default("development")
        .describe("The application build variant"),
    EXPO_PUBLIC_SUPABASE_URL: z
        .string()
        .url()
        .startsWith("https://")
        .endsWith(".supabase.co")
        .describe("The URL of the Supabase database to connect to"),
    EXPO_PUBLIC_SUPABASE_KEY: z
        .string()
        .min(1)
        .describe("The API key for the Supabase database"),
    EXPO_PUBLIC_SENTRY_DSN: optionalUrl,
    EXPO_PUBLIC_POSTHOG_KEY: optionalKey,
    EXPO_PUBLIC_POSTHOG_HOST: optionalUrl,
});

// Expo only inlines EXPO_PUBLIC_* values when each one is read as
// process.env.EXPO_PUBLIC_NAME. Passing process.env itself leaves them undefined.
const parsedEnv = envSchema.safeParse({
    APP_VARIANT: process.env.APP_VARIANT,
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_KEY: process.env.EXPO_PUBLIC_SUPABASE_KEY,
    EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
    EXPO_PUBLIC_POSTHOG_KEY: process.env.EXPO_PUBLIC_POSTHOG_KEY,
    EXPO_PUBLIC_POSTHOG_HOST: process.env.EXPO_PUBLIC_POSTHOG_HOST,
});

export const envConfigurationError = parsedEnv.success
    ? null
    : "This build is missing its Supabase configuration, so MobLeet cannot open.";

export const env = parsedEnv.success
    ? parsedEnv.data
    : {
          APP_VARIANT: "production" as const,
          EXPO_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co",
          EXPO_PUBLIC_SUPABASE_KEY: "missing",
          EXPO_PUBLIC_SENTRY_DSN: undefined,
          EXPO_PUBLIC_POSTHOG_KEY: undefined,
          EXPO_PUBLIC_POSTHOG_HOST: undefined,
      };
