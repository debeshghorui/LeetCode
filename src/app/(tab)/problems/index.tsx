import { useScreenInsets } from "@/hooks/use-screen-insets";
import {
    difficultyLabel,
    difficultyTint,
    fetchProblems,
    type Difficulty,
    type ProblemListItem,
} from "@/lib/problems";
import { colors } from "@/lib/theme";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

export default function ProblemsScreen() {
    const { contentPadding, sheetPaddingBottom } = useScreenInsets({
        bottomExtra: 24,
        topExtra: 12,
    });
    const [problems, setProblems] = useState<ProblemListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [activeDifficulties, setActiveDifficulties] = useState<
        Set<Difficulty>
    >(new Set());

    const load = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        setError(null);
        try {
            const data = await fetchProblems();
            setProblems(data);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to load problems",
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        let active = true;
        fetchProblems()
            .then((data) => {
                if (active) setProblems(data);
            })
            .catch((err) => {
                if (active)
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load problems",
                    );
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        return problems.filter((problem) => {
            if (
                activeDifficulties.size > 0 &&
                !activeDifficulties.has(problem.difficulty)
            ) {
                return false;
            }
            if (!query) return true;
            return (
                problem.title.toLowerCase().includes(query) ||
                problem.tags.some((tag) => tag.toLowerCase().includes(query))
            );
        });
    }, [problems, search, activeDifficulties]);

    const toggleDifficulty = (difficulty: Difficulty) => {
        setActiveDifficulties((prev) => {
            const next = new Set(prev);
            if (next.has(difficulty)) next.delete(difficulty);
            else next.add(difficulty);
            return next;
        });
    };

    return (
        <View style={styles.screen}>
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <ScrollView
                    contentContainerStyle={[styles.scroll, contentPadding]}
                    showsVerticalScrollIndicator={false}
                    contentInsetAdjustmentBehavior="automatic"
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => load(true)}
                            tintColor={colors.lime}
                        />
                    }
                >
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>Coding Problems</Text>
                        <View style={styles.countBadge}>
                            <Text style={styles.countText}>
                                {problems.length} total
                            </Text>
                        </View>
                    </View>

                    <View style={styles.searchBox}>
                        <Feather
                            name="search"
                            size={16}
                            color={colors.mutedDark}
                        />
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Search problems..."
                            placeholderTextColor={colors.mutedDark}
                            style={styles.searchInput}
                            returnKeyType="search"
                        />
                        {search.length > 0 ? (
                            <Pressable
                                onPress={() => setSearch("")}
                                hitSlop={8}
                            >
                                <Feather
                                    name="x"
                                    size={14}
                                    color={colors.mutedDark}
                                />
                            </Pressable>
                        ) : null}
                    </View>

                    <Pressable
                        onPress={() => setFiltersOpen(true)}
                        style={({ pressed }) => [
                            styles.filterButton,
                            pressed && styles.pressed,
                        ]}
                    >
                        <Ionicons
                            name="filter-outline"
                            size={16}
                            color={colors.foreground}
                        />
                        <Text style={styles.filterLabel}>Filters</Text>
                        {activeDifficulties.size > 0 ? (
                            <View style={styles.filterCount}>
                                <Text style={styles.filterCountText}>
                                    {activeDifficulties.size}
                                </Text>
                            </View>
                        ) : null}
                    </Pressable>

                    <View style={styles.list}>
                        {loading ? (
                            <ActivityIndicator
                                color={colors.lime}
                                style={{ marginTop: 40 }}
                            />
                        ) : error ? (
                            <View style={styles.empty}>
                                <Feather
                                    name="alert-circle"
                                    size={28}
                                    color={colors.mutedDark}
                                />
                                <Text style={styles.emptyTitle}>
                                    Could not load problems
                                </Text>
                                <Text style={styles.emptySubtitle}>
                                    {error}
                                </Text>
                                <Pressable
                                    onPress={() => {
                                        setLoading(true);
                                        void load();
                                    }}
                                    style={({ pressed }) => [
                                        styles.retryButton,
                                        pressed && styles.pressed,
                                    ]}
                                >
                                    <Text style={styles.retryLabel}>
                                        Try again
                                    </Text>
                                </Pressable>
                            </View>
                        ) : filtered.length === 0 ? (
                            <View style={styles.empty}>
                                <Feather
                                    name="inbox"
                                    size={28}
                                    color={colors.mutedDark}
                                />
                                <Text style={styles.emptyTitle}>
                                    No problems match
                                </Text>
                                <Text style={styles.emptySubtitle}>
                                    Try a different keyword or clear the
                                    filters.
                                </Text>
                            </View>
                        ) : (
                            filtered.map((problem) => (
                                <ProblemCard
                                    key={problem.id}
                                    problem={problem}
                                />
                            ))
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>

            <Modal
                visible={filtersOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setFiltersOpen(false)}
                statusBarTranslucent
            >
                <View style={styles.modalBackdrop}>
                    <Pressable
                        style={StyleSheet.absoluteFill}
                        onPress={() => setFiltersOpen(false)}
                    />
                    <View
                        style={[
                            styles.modalSheet,
                            { paddingBottom: sheetPaddingBottom },
                        ]}
                    >
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filters</Text>
                            <Pressable
                                onPress={() => setActiveDifficulties(new Set())}
                                hitSlop={8}
                            >
                                <Text style={styles.clearText}>Clear</Text>
                            </Pressable>
                        </View>

                        <Text style={styles.modalSection}>DIFFICULTY</Text>
                        <View style={styles.difficultyRow}>
                            {DIFFICULTIES.map((difficulty) => {
                                const tint = difficultyTint(difficulty);
                                const active =
                                    activeDifficulties.has(difficulty);
                                return (
                                    <Pressable
                                        key={difficulty}
                                        onPress={() =>
                                            toggleDifficulty(difficulty)
                                        }
                                        style={({ pressed }) => [
                                            styles.difficultyChip,
                                            {
                                                backgroundColor: active
                                                    ? tint.bg
                                                    : colors.card,
                                                borderColor: active
                                                    ? tint.fg
                                                    : colors.cardBorder,
                                            },
                                            pressed && styles.pressed,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.difficultyChipText,
                                                {
                                                    color: active
                                                        ? tint.fg
                                                        : colors.foreground,
                                                },
                                            ]}
                                        >
                                            {difficultyLabel(difficulty)}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        <Pressable
                            onPress={() => setFiltersOpen(false)}
                            style={({ pressed }) => [
                                styles.applyButton,
                                pressed && styles.pressed,
                            ]}
                        >
                            <Text style={styles.applyLabel}>Apply</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

function ProblemCard({ problem }: { problem: ProblemListItem }) {
    const tint = difficultyTint(problem.difficulty);

    return (
        <Pressable
            onPress={() => router.push(`/problems/${problem.id}` as never)}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
            <Text style={styles.cardTitle}>{problem.title}</Text>
            <View style={styles.cardMeta}>
                <View
                    style={[
                        styles.difficultyBadge,
                        { backgroundColor: tint.bg },
                    ]}
                >
                    <Text
                        style={[styles.difficultyBadgeText, { color: tint.fg }]}
                    >
                        {problem.difficulty}
                    </Text>
                </View>
            </View>
            {problem.tags.length > 0 ? (
                <View style={styles.tagsRow}>
                    {problem.tags.slice(0, 3).map((tag) => (
                        <View key={tag} style={styles.tagChip}>
                            <Text style={styles.tagText}>{tag}</Text>
                        </View>
                    ))}
                </View>
            ) : null}
        </Pressable>
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
    scroll: {
        flexGrow: 1,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    title: {
        color: colors.foreground,
        fontSize: 28,
        lineHeight: 34,
        fontWeight: "700",
    },
    countBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: "rgba(189, 240, 110, 0.12)",
        borderWidth: 1,
        borderColor: "rgba(189, 240, 110, 0.28)",
    },
    countText: {
        color: colors.lime,
        fontSize: 11,
        fontWeight: "600",
    },
    searchBox: {
        marginTop: 20,
        height: 48,
        borderRadius: 16,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        color: colors.foreground,
        fontSize: 14,
    },
    filterButton: {
        marginTop: 12,
        height: 44,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    filterLabel: {
        color: colors.foreground,
        fontWeight: "600",
        marginLeft: 8,
    },
    filterCount: {
        marginLeft: 8,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        paddingHorizontal: 6,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.lime,
    },
    filterCountText: {
        color: colors.background,
        fontSize: 11,
        fontWeight: "700",
    },
    list: {
        marginTop: 20,
        gap: 12,
    },
    empty: {
        borderRadius: 24,
        padding: 32,
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.03)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
    },
    emptyTitle: {
        color: colors.foreground,
        fontSize: 15,
        fontWeight: "600",
        marginTop: 12,
    },
    emptySubtitle: {
        color: colors.muted,
        fontSize: 13,
        textAlign: "center",
        marginTop: 4,
    },
    retryButton: {
        marginTop: 16,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: colors.lime,
    },
    retryLabel: {
        color: colors.background,
        fontWeight: "700",
    },
    card: {
        borderRadius: 24,
        padding: 16,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    cardTitle: {
        color: colors.foreground,
        fontSize: 16,
        lineHeight: 22,
        fontWeight: "700",
    },
    cardMeta: {
        marginTop: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    difficultyBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    difficultyBadgeText: {
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1,
    },
    tagsRow: {
        marginTop: 12,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    tagChip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    tagText: {
        color: colors.muted,
        fontSize: 11,
    },
    pressed: {
        opacity: 0.7,
    },
    modalBackdrop: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.6)",
    },
    modalSheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 20,
        backgroundColor: "#13141a",
        borderTopWidth: 1,
        borderColor: colors.cardBorder,
    },
    modalHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: "rgba(255,255,255,0.18)",
        alignSelf: "center",
        marginBottom: 16,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    modalTitle: {
        color: colors.foreground,
        fontSize: 18,
        fontWeight: "700",
    },
    clearText: {
        color: colors.lime,
        fontWeight: "600",
    },
    modalSection: {
        color: colors.muted,
        fontSize: 12,
        letterSpacing: 1,
        marginTop: 16,
        marginBottom: 12,
    },
    difficultyRow: {
        flexDirection: "row",
        gap: 10,
    },
    difficultyChip: {
        flex: 1,
        borderRadius: 16,
        paddingVertical: 12,
        alignItems: "center",
        borderWidth: 1,
    },
    difficultyChipText: {
        fontSize: 13,
        fontWeight: "700",
    },
    applyButton: {
        marginTop: 24,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        backgroundColor: colors.lime,
    },
    applyLabel: {
        color: colors.background,
        fontWeight: "700",
    },
});
