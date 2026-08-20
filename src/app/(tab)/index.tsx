import { useAuth } from "@/hooks/use-auth";
import { useScreenInsets } from "@/hooks/use-screen-insets";
import { fetchProblems, fetchSolvedCount } from "@/lib/problems";
import { colors } from "@/lib/theme";
import { getAvatar, getDisplayName, getInitials } from "@/lib/user";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
    const { contentPadding } = useScreenInsets({
        bottomExtra: 24,
        topExtra: 8,
    });
    const { user, isLoading } = useAuth();
    const [firstProblemId, setFirstProblemId] = useState<string | null>(null);
    const [solvedCount, setSolvedCount] = useState(0);

    useEffect(() => {
        if (!user?.id) return;
        fetchProblems().then((problems) =>
            setFirstProblemId(problems[0]?.id ?? null),
        );
        fetchSolvedCount(user.id).then(setSolvedCount);
    }, [user?.id]);

    if (isLoading || !user) {
        return (
            <SafeAreaView style={styles.loading} edges={["top", "bottom"]}>
                <ActivityIndicator color={colors.lime} />
            </SafeAreaView>
        );
    }

    const displayName = getDisplayName(user);
    const firstName = displayName.split(" ")[0] ?? "Rider";
    const initials = getInitials(displayName);
    const avatarUrl = getAvatar(user);

    return (
        <View style={styles.screen}>
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <ScrollView
                    contentContainerStyle={[styles.scroll, contentPadding]}
                    showsVerticalScrollIndicator={false}
                    contentInsetAdjustmentBehavior="automatic"
                >
                    <View style={styles.topRow}>
                        <View style={styles.brandRow}>
                            <View style={styles.logoBox}>
                                <Image
                                    source={require("../../../assets/images/logo.png")}
                                    style={styles.logoImage}
                                    resizeMode="contain"
                                />
                            </View>
                            <Text style={styles.brand}>MobLeet</Text>
                        </View>
                    </View>

                    <View style={styles.welcomeRow}>
                        <View style={styles.avatar}>
                            {avatarUrl ? (
                                <Image
                                    source={{ uri: avatarUrl }}
                                    style={styles.avatarImage}
                                />
                            ) : (
                                <Text style={styles.avatarInitials}>
                                    {initials}
                                </Text>
                            )}
                        </View>
                        <View style={styles.welcomeText}>
                            <Text style={styles.welcomeLabel}>
                                Welcome back
                            </Text>
                            <Text style={styles.welcomeName} numberOfLines={1}>
                                {firstName}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.heroCard}>
                        <View style={styles.heroContent}>
                            <View style={styles.heroTextWrap}>
                                <Text style={styles.heroTitle}>
                                    Ready to practice
                                </Text>
                                <Text style={styles.heroSubtitle}>
                                    Your session is live. Jump into a problem
                                    and keep the streak going.
                                </Text>
                            </View>
                            <View style={styles.heroIcon}>
                                <Ionicons
                                    name="shield-checkmark"
                                    size={22}
                                    color={colors.lime}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Quick practice</Text>
                        <Text style={styles.sectionHint}>Tap to start</Text>
                    </View>

                    <View style={styles.actions}>
                        <ActionCard
                            icon="map"
                            color={colors.peach}
                            title="Browse problems"
                            subtitle="Pick from the problem set"
                            onPress={() => router.push("/problems" as never)}
                        />
                        <ActionCard
                            icon="navigate"
                            color={colors.lime}
                            title="Daily challenge"
                            subtitle="Start with the first challenge"
                            onPress={() => {
                                if (firstProblemId) {
                                    router.push(
                                        `/problems/${firstProblemId}` as never,
                                    );
                                } else {
                                    router.push("/problems" as never);
                                }
                            }}
                        />
                        <ActionCard
                            icon="bookmark"
                            color={colors.mint}
                            title="Saved problems"
                            subtitle="Bookmarks are coming soon"
                            onPress={() => router.push("/problems" as never)}
                        />
                    </View>

                    <View style={styles.weekSection}>
                        <Text style={styles.sectionTitle}>This week</Text>
                        <View style={styles.statsRow}>
                            <StatCard
                                label="Solved"
                                value={String(solvedCount)}
                                tint={colors.lime}
                            />
                            <StatCard
                                label="Streak"
                                value="0"
                                tint={colors.peach}
                            />
                            <StatCard
                                label="Saved"
                                value="0"
                                tint={colors.mint}
                            />
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

function ActionCard({
    icon,
    color,
    title,
    subtitle,
    onPress,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    title: string;
    subtitle: string;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.actionCard,
                pressed && styles.pressed,
            ]}
        >
            <View
                style={[styles.actionIcon, { backgroundColor: `${color}26` }]}
            >
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <View style={styles.actionText}>
                <Text style={styles.actionTitle}>{title}</Text>
                <Text style={styles.actionSubtitle}>{subtitle}</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#a1a1aa" />
        </Pressable>
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
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },
    safe: {
        flex: 1,
    },
    loading: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
    },
    scroll: {
        flexGrow: 1,
    },
    topRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    brandRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    logoBox: {
        width: 40,
        height: 40,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        backgroundColor: colors.limeSoft,
        borderWidth: 1,
        borderColor: colors.limeBorder,
    },
    logoImage: {
        width: 26,
        height: 26,
    },
    brand: {
        color: colors.foreground,
        fontSize: 18,
        fontWeight: "700",
        marginLeft: 10,
    },
    welcomeRow: {
        marginTop: 24,
        flexDirection: "row",
        alignItems: "center",
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        backgroundColor: "rgba(189, 240, 110, 0.18)",
        borderWidth: 2,
        borderColor: colors.lime,
    },
    avatarImage: {
        width: "100%",
        height: "100%",
    },
    avatarInitials: {
        color: colors.lime,
        fontSize: 18,
        fontWeight: "700",
    },
    welcomeText: {
        flex: 1,
        marginLeft: 12,
    },
    welcomeLabel: {
        color: colors.muted,
        fontSize: 12,
    },
    welcomeName: {
        color: colors.foreground,
        fontSize: 22,
        lineHeight: 28,
        fontWeight: "700",
    },
    heroCard: {
        marginTop: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "rgba(189, 240, 110, 0.35)",
        backgroundColor: "rgba(189, 240, 110, 0.12)",
        padding: 18,
    },
    heroContent: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
    },
    heroTextWrap: {
        flex: 1,
        paddingRight: 12,
    },
    heroTitle: {
        color: colors.foreground,
        fontSize: 18,
        lineHeight: 24,
        fontWeight: "700",
    },
    heroSubtitle: {
        color: colors.muted,
        fontSize: 13,
        lineHeight: 18,
        marginTop: 4,
    },
    heroIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(10, 10, 12, 0.4)",
    },
    sectionHeader: {
        marginTop: 24,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    sectionTitle: {
        color: colors.foreground,
        fontSize: 16,
        fontWeight: "700",
    },
    sectionHint: {
        color: colors.muted,
        fontSize: 12,
    },
    actions: {
        marginTop: 12,
        gap: 10,
    },
    actionCard: {
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    pressed: {
        opacity: 0.7,
    },
    actionIcon: {
        width: 44,
        height: 44,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    actionText: {
        flex: 1,
        marginLeft: 12,
    },
    actionTitle: {
        color: colors.foreground,
        fontSize: 15,
        fontWeight: "600",
    },
    actionSubtitle: {
        color: colors.muted,
        fontSize: 12,
        marginTop: 2,
    },
    weekSection: {
        marginTop: 24,
    },
    statsRow: {
        marginTop: 12,
        flexDirection: "row",
        gap: 10,
    },
    statCard: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    statDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginBottom: 8,
    },
    statValue: {
        color: colors.foreground,
        fontSize: 18,
        lineHeight: 22,
        fontWeight: "700",
    },
    statLabel: {
        color: colors.muted,
        fontSize: 11,
        marginTop: 2,
    },
});
