import { ActivityHeatmap } from "@/components/activity-heatmap";
import { useAuth } from "@/hooks/use-auth";
import { useScreenInsets } from "@/hooks/use-screen-insets";
import { fetchSolvedCount, fetchUserSubmissionActivity } from "@/lib/problems";
import { colors } from "@/lib/theme";
import { getAvatar, getDisplayName, getInitials } from "@/lib/user";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
    const { contentPadding } = useScreenInsets({
        bottomExtra: 24,
        topExtra: 12,
    });
    const { user, isLoading, signOut } = useAuth();
    const [signingOut, setSigningOut] = useState(false);
    const [activity, setActivity] = useState<Map<string, number>>(new Map());
    const [solvedCount, setSolvedCount] = useState(0);
    const [statsLoading, setStatsLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            if (!user?.id) return;
            setStatsLoading(true);
            Promise.all([
                fetchUserSubmissionActivity(user.id),
                fetchSolvedCount(user.id),
            ])
                .then(([activityMap, solved]) => {
                    setActivity(activityMap);
                    setSolvedCount(solved);
                })
                .finally(() => setStatsLoading(false));
        }, [user]),
    );

    const totalSubmissions = useMemo(() => {
        let total = 0;
        activity.forEach((n) => {
            total += n;
        });
        return total;
    }, [activity]);

    if (isLoading || !user) {
        return (
            <SafeAreaView style={styles.loading} edges={["top", "bottom"]}>
                <ActivityIndicator color={colors.lime} />
            </SafeAreaView>
        );
    }

    const displayName = getDisplayName(user);
    const avatarUrl = getAvatar(user);

    return (
        <View style={styles.screen}>
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <ScrollView
                    contentContainerStyle={[styles.scroll, contentPadding]}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.title}>Profile</Text>
                    <Text style={styles.subtitle}>
                        Manage your MobLeet account.
                    </Text>

                    <View style={styles.card}>
                        <View style={styles.avatar}>
                            {avatarUrl ? (
                                <Image
                                    source={{ uri: avatarUrl }}
                                    style={styles.avatarImage}
                                />
                            ) : (
                                <Text style={styles.avatarInitials}>
                                    {getInitials(displayName)}
                                </Text>
                            )}
                        </View>
                        <Text style={styles.name}>{displayName}</Text>
                        <Text style={styles.email}>{user.email}</Text>
                    </View>

                    <View style={styles.statsRow}>
                        <StatCard
                            label="Solved"
                            value={statsLoading ? "—" : String(solvedCount)}
                            tint={colors.lime}
                        />
                        <StatCard
                            label="Submissions"
                            value={
                                statsLoading ? "—" : String(totalSubmissions)
                            }
                            tint={colors.peach}
                        />
                        <StatCard
                            label="Active days"
                            value={statsLoading ? "—" : String(activity.size)}
                            tint={colors.mint}
                        />
                    </View>

                    <ActivityHeatmap
                        activity={activity}
                        loading={statsLoading}
                    />

                    <Pressable
                        onPress={async () => {
                            setSigningOut(true);
                            try {
                                await signOut();
                            } catch (err) {
                                Alert.alert(
                                    "Sign out failed",
                                    err instanceof Error
                                        ? err.message
                                        : "Unknown error",
                                );
                            } finally {
                                setSigningOut(false);
                            }
                        }}
                        disabled={signingOut}
                        style={({ pressed }) => [
                            styles.signOutButton,
                            (pressed || signingOut) && styles.pressed,
                        ]}
                    >
                        {signingOut ? (
                            <ActivityIndicator color={colors.danger} />
                        ) : (
                            <>
                                <Feather
                                    name="log-out"
                                    size={16}
                                    color={colors.danger}
                                />
                                <Text style={styles.signOutLabel}>
                                    Sign out
                                </Text>
                            </>
                        )}
                    </Pressable>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

function StatCard({
    label,
    value,
    tint,
}: {
    label: string;
    value: string;
    tint: string;
}) {
    return (
        <View style={styles.statCard}>
            <View style={[styles.statDot, { backgroundColor: tint }]} />
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    safe: { flex: 1 },
    loading: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
    },
    scroll: { flexGrow: 1 },
    title: {
        color: colors.foreground,
        fontSize: 30,
        lineHeight: 36,
        fontWeight: "700",
    },
    subtitle: { color: colors.muted, fontSize: 14, marginTop: 8 },
    card: {
        marginTop: 24,
        borderRadius: 24,
        padding: 20,
        alignItems: "center",
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        backgroundColor: "rgba(189, 240, 110, 0.16)",
        borderWidth: 2,
        borderColor: colors.lime,
    },
    avatarImage: { width: "100%", height: "100%" },
    avatarInitials: { color: colors.lime, fontSize: 24, fontWeight: "700" },
    name: {
        color: colors.foreground,
        fontSize: 20,
        fontWeight: "700",
        marginTop: 16,
    },
    email: { color: colors.muted, fontSize: 13, marginTop: 4 },
    statsRow: { marginTop: 16, flexDirection: "row", gap: 10 },
    statCard: {
        flex: 1,
        borderRadius: 16,
        padding: 14,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    statDot: { width: 6, height: 6, borderRadius: 3, marginBottom: 8 },
    statValue: { color: colors.foreground, fontSize: 18, fontWeight: "700" },
    statLabel: { color: colors.muted, fontSize: 11, marginTop: 2 },
    signOutButton: {
        marginTop: 24,
        height: 52,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    signOutLabel: { color: colors.danger, fontSize: 15, fontWeight: "600" },
    pressed: { opacity: 0.7 },
});
