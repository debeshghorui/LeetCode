import type { User } from "@supabase/supabase-js";

export function getDisplayName(user: User) {
    return (
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.email ??
        "MobLeet User"
    );
}

export function getAvatar(user: User) {
    return user.user_metadata?.avatar_url ?? user.user_metadata?.picture;
}

export function getInitials(label: string) {
    const parts = label.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return label.slice(0, 2).toUpperCase();
}
