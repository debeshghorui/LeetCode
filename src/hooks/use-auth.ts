import { useAuthStore } from "@/state/auth-store";

export function useAuth() {
    const session = useAuthStore((state) => state.session);
    const user = useAuthStore((state) => state.user);
    const isLoading = useAuthStore((state) => state.isLoading);
    const signIn = useAuthStore((state) => state.signIn);
    const signOut = useAuthStore((state) => state.signOut);
    const deleteAccount = useAuthStore((state) => state.deleteAccount);

    return { session, user, isLoading, signIn, signOut, deleteAccount };
}
