import { z } from "zod";

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
      };
