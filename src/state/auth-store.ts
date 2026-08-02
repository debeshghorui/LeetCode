import { create } from "zustand";
import { supabase } from "../lib/supabase";

import type { Session, User } from "@supabase/supabase-js";

interface AuthState {
    session: Session | null;
    user: User | null;
    isLoading: boolean;
    isInitialized: boolean;

    initialize: () => void;
    handelDeepLink: (url: string) => Promise<void>;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    session: null,
    user: null,
    isLoading: true,
    isInitialized: false,

    initialize: async () => {
        if (get().isInitialized) return () => {};

        set({ isInitialized: true });

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                set({
                    session,
                    user: session?.user ?? null,
                    isLoading: false,
                });
            }
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
        // TODO: Implement deep link handling
    },
    signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error(error);
            throw error.message;
        }
        set({ session: null, user: null, isLoading: true });
    },
}));
