import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import {
    createSessionFromUrl,
    deleteOwnAccount,
    isAuthCallback,
} from "@/lib/auth";

interface AuthState {
    session: Session | null;
    user: User | null;
    isLoading: boolean;
    isInitialized: boolean;

    initialize: () => () => void;
    handelDeepLink: (url: string) => Promise<void>;
    signOut: () => Promise<void>;
    deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    session: null,
    user: null,
    isLoading: true,
    isInitialized: false,

    initialize: () => {
        if (get().isInitialized) return () => {};

        set({ isInitialized: true });

        supabase.auth
            .getSession()
            .then(({ data: { session } }) => {
                set({
                    session: session ?? null,
                    user: session?.user ?? null,
                    isLoading: false,
                });
            })
            .catch((error) => {
                console.error(error);
                set({ isLoading: false });
            });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            set({
                session: session ?? null,
                user: session?.user ?? null,
                isLoading: false,
            });
        });

        return () => subscription.unsubscribe();
    },
    handelDeepLink: async (url: string) => {
        if (!isAuthCallback(url)) return;

        try {
            await createSessionFromUrl(url);
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
        set({ session: null, user: null, isLoading: false });
    },
    deleteAccount: async () => {
        await deleteOwnAccount();
        set({ session: null, user: null, isLoading: false });
    },
}));
