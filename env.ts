import { z } from "zod";

const envSchema = z.object({
    EXPO_PUBLIC_SUPABASE_URL: z
        .string()
        .url()
        .startsWith("https://")
        .describe("The URL of the Supabase database to connect to"),
    EXPO_PUBLIC_SUPABASE_KEY: z
        .string()
        .startsWith("sk_")
        .describe("The API key for the Supabase database"),
});

function createEnv(env: NodeJS.ProcessEnv) {
    const safeParsedEnv = envSchema.safeParse(env);

    if (!safeParsedEnv.success) {
        console.error(
            "Invalid environment variables:",
            safeParsedEnv.error.format(),
        );
        throw new Error(
            `Invalid environment variables: ${safeParsedEnv.error.message}`,
        );
    }

    return safeParsedEnv.data;
}

export const env = createEnv(process.env);
