import { useAuthStore } from "@/state/auth-store";

export const useAuth = () => {
    const session = useAuthStore((data) => data.session);
    const user = useAuthStore((data) => data.user);
    const isLoading = useAuthStore((data) => data.isLoading);
    const signOut = useAuthStore((data) => data.signOut);

    return { session, user, isLoading, signOut };
};
