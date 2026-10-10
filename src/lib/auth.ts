import { supabase } from "@/lib/supabase";
import type { Provider, Session } from "@supabase/supabase-js";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

const codeExchanges = new Map<string, Promise<Session | undefined>>();

// Three slashes keep "auth" in the path. `mobleet://auth/callback` is parsed as
// host "auth" and path "/callback", so Expo Router never opens the callback screen.
export const nativeAuthRedirect = "mobleet:///auth/callback";

export function getAuthRedirectUrl() {
    if (Platform.OS === "web") {
        return makeRedirectUri({ path: "auth/callback" });
    }

    return makeRedirectUri({
        native: nativeAuthRedirect,
        path: "auth/callback",
        scheme: "mobleet",
    });
}

export function isAuthCallback(url: string) {
    const { params } = QueryParams.getQueryParams(url);
    return !!(params.code || (params.access_token && params.refresh_token));
}

/**
 *
 * @param url - The URL to create a session from. example: https://app.com/auth/callback?params={...}&errorCode=...
 * @returns The session created from the URL.
 * @throws An error if the URL is not a valid auth callback URL.
 */
export async function createSessionFromUrl(url: string) {
    const { params, errorCode } = QueryParams.getQueryParams(url);

    if (errorCode) {
        throw new Error(`Auth error: ${errorCode}`);
    }

    if (params.error || params.error_description) {
        throw new Error(params.error_description || params.error);
    }

    if (params.code) {
        const existing = codeExchanges.get(params.code);
        if (existing) return existing;
        // iife function to Exchange the code for a session
        const exchange = (async () => {
            const { data, error } = await supabase.auth.exchangeCodeForSession(
                params.code,
            );
            if (error) {
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                if (session) return session;
                throw error;
            }
            return data.session;
        })();

        codeExchanges.set(params.code, exchange);

        try {
            return await exchange;
        } finally {
            codeExchanges.delete(params.code);
        }
    }

    if (params.access_token && params.refresh_token) {
        const { data, error } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
        });
        if (error) throw error;
        return data.session;
    }
}

/**
 *
 * @param redirectUri - The redirect URI to display in the message.
 * @returns The message to display to the user.
 */
function getRedirectSetupMessage(redirectUri: string) {
    return [
        "Supabase sent the browser to localhost, which this phone cannot open.",
        "",
        "Open Supabase Dashboard → Authentication → URL Configuration.",
        "Set Site URL to:",
        `  ${redirectUri}`,
        "Add these Redirect URLs:",
        `  ${redirectUri}`,
        "  mobleet://**",
        "  exp://**",
        "",
        "Save, then try signing in again. The installed app picks this up without a new build.",
    ].join("\n");
}

/**
 *
 * @param provider - The provider to sign in with.
 * @returns The session created from the OAuth URL.
 * @throws An error if the provider is not supported or the URL is not a valid auth callback URL.
 * @throws An error if the OAuth URL is not returned.
 * @throws An error if the OAuth URL is not a valid auth callback URL.
 * @throws An error if the OAuth URL is not a valid auth callback URL.
 */
export async function signInWithOAuth(provider: Provider) {
    const redirectTo = getAuthRedirectUrl();

    if (!redirectTo) {
        throw new Error(
            "Could not determine OAuth redirect URI for this platform.",
        );
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo,
            skipBrowserRedirect: true,
        },
    });

    if (error) throw error;
    if (!data.url) throw new Error("No OAuth URL returned");

    // Android reports the browser as dismissed when the app resumes, often
    // before the deep-link event arrives. Keep listening so the code is not lost.
    let callbackUrl: string | null = null;
    const subscription = Linking.addEventListener("url", ({ url }) => {
        if (isAuthCallback(url)) callbackUrl = url;
    });

    try {
        const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectTo,
            { showInRecents: true },
        );

        let url =
            result.type === "success" && isAuthCallback(result.url)
                ? result.url
                : callbackUrl;

        if (!url) {
            await new Promise((resolve) => setTimeout(resolve, 800));
            url = callbackUrl;
        }

        if (!url) {
            const initialUrl = await Linking.getInitialURL();
            if (initialUrl && isAuthCallback(initialUrl)) url = initialUrl;
        }

        if (url) return createSessionFromUrl(url);

        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (session) return session;

        if (result.type === "cancel" || result.type === "dismiss") return;

        throw new Error(getRedirectSetupMessage(redirectTo));
    } finally {
        subscription.remove();
    }
}

/**
 *
 * @returns The session created from the OAuth URL.
 * @throws An error if the OAuth URL is not returned.
 * @throws An error if the OAuth URL is not a valid auth callback URL.
 * @throws An error if the OAuth URL is not a valid auth callback URL.
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

/**
 * Deletes the signed-in Supabase user. Related profile, submission, and
 * progress rows cascade from `auth.users`. Requires `delete_own_account`
 * from `src/supabase/delete_own_account.sql`.
 */
export async function deleteOwnAccount() {
    const { error } = await supabase.rpc("delete_own_account");
    if (error) {
        if (error.message.includes("delete_own_account")) {
            throw new Error(
                "Account deletion is not enabled yet. Run src/supabase/delete_own_account.sql in the Supabase SQL editor, then try again.",
            );
        }
        throw error;
    }

    const { error: signOutError } = await supabase.auth.signOut({
        scope: "local",
    });
    if (signOutError) throw signOutError;
}
