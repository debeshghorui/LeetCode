import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import {
    createSessionFromUrl,
    deleteOwnAccount,
    isAuthCallback,
} from "@/lib/auth";
import { identifyUser, resetUser } from "@/lib/observability";

function syncObservabilityUser(session: Session | null) {
    if (session?.user.id) {
        identifyUser(session.user.id);
        return;
    }
    resetUser();
}

interface AuthState {
    session: Session | null;
    user: User | null;
    isLoading: boolean;
    isInitialized: boolean;

    initialize: () => () => void;
    setSession: (session: Session | null) => void;
    handelDeepLink: (url: string) => Promise<void>;
    signOut: () => Promise<void>;
    deleteAccount: () => Promise<void>;
}

function applySession(
    set: (
        partial:
            Partial<AuthState> | ((state: AuthState) => Partial<AuthState>),
    ) => void,
    session: Session | null,
) {
    syncObservabilityUser(session);
    set({
        session,
        user: session?.user ?? null,
        isLoading: false,
    });
}

let authListenersStarted = false;

export const useAuthStore = create<AuthState>((set, get) => ({
    session: null,
    user: null,
    isLoading: true,
    isInitialized: false,

    setSession: (session) => {
        applySession(set, session);
    },

    initialize: () => {
        if (authListenersStarted) {
            set({ isInitialized: true, isLoading: false });
            return () => {};
        }

        authListenersStarted = true;
        set({ isInitialized: true });

        // A late getSession() must not wipe a session that sign-in already stored.
        supabase.auth
            .getSession()
            .then(({ data: { session } }) => {
                set((state) => {
                    if (state.session) return { isLoading: false };
                    syncObservabilityUser(session);
                    return {
                        session: session ?? null,
                        user: session?.user ?? null,
                        isLoading: false,
                    };
                });
            })
            .catch((error) => {
                console.error(error);
                set({ isLoading: false });
            });

        supabase.auth.onAuthStateChange((event, session) => {
            set((state) => {
                // Ignore a late empty session. Android can emit one after the
                // OAuth code has already been exchanged.
                if (!session && state.session && event !== "SIGNED_OUT") {
                    return state;
                }
                syncObservabilityUser(session);
                return {
                    session,
                    user: session?.user ?? null,
                    isLoading: false,
                };
            });
        });

        const handleUrl = (url: string | null) => {
            if (!url || !isAuthCallback(url)) return;
            void get().handelDeepLink(url);
        };

        void Linking.getInitialURL().then(handleUrl);
        Linking.addEventListener("url", ({ url }) => handleUrl(url));

        // Keep the listeners for the process lifetime. Unsubscribing when the
        // root remounts drops the session Android creates on the way back from Chrome.
        return () => {};
    },
    handelDeepLink: async (url: string) => {
        if (!isAuthCallback(url)) return;

        try {
            const session = await createSessionFromUrl(url);
            if (!session) throw new Error("Sign-in did not return a session.");
            applySession(set, session);
        } catch (error) {
            console.error(error);
            throw new Error((error as Error).message);
        }
    },
    signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error(error);
            throw new Error(error.message);
        }
        resetUser();
        set({ session: null, user: null, isLoading: false });
    },
    deleteAccount: async () => {
        await deleteOwnAccount();
        resetUser();
        set({ session: null, user: null, isLoading: false });
    },
}));
