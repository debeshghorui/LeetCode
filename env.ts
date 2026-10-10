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

const parsedEnv = envSchema.safeParse(process.env);

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
