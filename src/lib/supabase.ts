import "@/lib/crypto-polyfill";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

import { env } from "../../env";

// Expo static web render runs in Node. AsyncStorage's web build reads
// window.localStorage, which throws and takes down the dev server.
function isWebServer() {
    return Platform.OS === "web" && typeof window === "undefined";
}

const authStorage = {
    getItem: (key: string) => {
        if (isWebServer()) return Promise.resolve(null);
        return AsyncStorage.getItem(key);
    },
    setItem: (key: string, value: string) => {
        if (isWebServer()) return Promise.resolve();
        return AsyncStorage.setItem(key, value);
    },
    removeItem: (key: string) => {
        if (isWebServer()) return Promise.resolve();
        return AsyncStorage.removeItem(key);
    },
};

const renderingOnServer = isWebServer();

export const supabase = createClient(
    env.EXPO_PUBLIC_SUPABASE_URL,
    env.EXPO_PUBLIC_SUPABASE_KEY,
    {
        auth: {
            storage: authStorage,
            autoRefreshToken: !renderingOnServer,
            persistSession: !renderingOnServer,
            detectSessionInUrl: false,
            flowType: "pkce",
        },
    },
);
