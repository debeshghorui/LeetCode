import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import { makeRedirectUri } from "expo-auth-session";
// import * as QueryParams from "expo-router/build/queryParams";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

const codeExchanges = new Map<string, Promise<string> | undefined>();

export function getAuthRedirectUrl() {
    return makeRedirectUri({ path: "auth/callback" });
}

export function isAuthCallback(url: string) {
    const { params } = QueryParams.getQueryParams(url);
    return !!(params.code || (params.access_token && params.refresh_token));
}

export async function createSessionFromUrl(url: string) {
    const { params, errorCode } = QueryParams.getQueryParams(url);

    if (errorCode) {
        throw new Error(`Auth error: ${errorCode}`);
    }
}
