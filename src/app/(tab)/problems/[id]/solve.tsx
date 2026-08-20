import { CodeEditor } from "@/components/code-editor";
import { useScreenInsets } from "@/hooks/use-screen-insets";
import { submitSolution, type CaseResult } from "@/lib/codebox";
import {
    fetchProblemById,
    getAvailableLanguages,
    getExamples,
    getStarterCode,
    LANGUAGE_BADGE,
    LANGUAGE_LABEL,
    LANGUAGE_TINT,
    type LanguageId,
    type Problem,
} from "@/lib/problems";
import { colors } from "@/lib/theme";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const mono = Platform.select({
    ios: "Menlo",
    android: "monospace",
    default: "Courier",
});

export default function SolveProblemScreen() {
    const { contentPadding } = useScreenInsets({
        includeBottomInset: true,
        bottomExtra: 28,
        topExtra: 6,
    });
    const { id } = useLocalSearchParams<{ id: string }>();
    const [problem, setProblem] = useState<Problem | null>(null);
    const [loading, setLoading] = useState(true);
    const [language, setLanguage] = useState<LanguageId>("javascript");
    const [code, setCode] = useState("");
    const [touched, setTouched] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [activeCase, setActiveCase] = useState(0);
    const [running, setRunning] = useState(false);
    const [results, setResults] = useState<CaseResult[] | null>(null);
    const [resultsOpen, setResultsOpen] = useState(false);
    const [solved, setSolved] = useState(false);

    useEffect(() => {
        let active = true;

        async function load() {
            if (!id) return;
            setLoading(true);
            try {
                const data = await fetchProblemById(id);
                if (!active) return;
                setProblem(data);
                if (data) {
                    const langs = getAvailableLanguages(data);
                    const initial = langs[0] ?? "javascript";
                    setLanguage(initial);
                    setCode(getStarterCode(data, initial));
                    setTouched(false);
                    setActiveCase(0);
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        void load();
        return () => {
            active = false;
        };
    }, [id]);

    const availableLanguages = useMemo(
        () => (problem ? getAvailableLanguages(problem) : []),
        [problem],
    );

    const sampleCases = useMemo(
        () => (problem ? getExamples(problem) : []),
        [problem],
    );

    const summary = useMemo(() => {
        if (!results) return null;
        const passed = results.filter((r) => r.outcome === "accepted").length;
        return { passed, total: results.length };
    }, [results]);

    if (loading) {
        return (
            <SafeAreaView style={styles.centered} edges={["top", "bottom"]}>
                <ActivityIndicator color={colors.lime} />
            </SafeAreaView>
        );
    }

    if (!problem) {
        return (
            <SafeAreaView style={styles.centered} edges={["top", "bottom"]}>
                <Feather
                    name="alert-circle"
                    size={32}
                    color={colors.mutedDark}
                />
                <Text style={styles.notFoundTitle}>Problem not found</Text>
                <Pressable
                    onPress={() => router.replace("/problems" as never)}
                    style={({ pressed }) => [
                        styles.backButton,
                        pressed && styles.pressed,
                    ]}
                >
                    <Text style={styles.backButtonLabel}>Back to problems</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    const currentCase = sampleCases[activeCase];

    const handleReset = () => {
        Alert.alert(
            "Reset code?",
            "This will replace your edits with the starter code.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset",
                    style: "destructive",
                    onPress: () => {
                        setCode(getStarterCode(problem, language));
                        setTouched(false);
                        setResults(null);
                        setSolved(false);
                    },
                },
            ],
        );
    };

    const handleSubmit = async () => {
        if (running || !problem) return;
        setRunning(true);
        setResults(null);
        setSolved(false);
        try {
            const response = await submitSolution({
                problemId: problem.id,
                language,
                sourceCode: code,
            });
            setResults(response.results);
            setSolved(response.solved);
            setResultsOpen(true);
            if (response.solved) {
                Alert.alert(
                    "Accepted",
                    "All test cases passed. Problem marked as solved.",
                );
            }
        } catch (err) {
            Alert.alert(
                "Submit failed",
                err instanceof Error ? err.message : "Unknown error",
            );
        } finally {
            setRunning(false);
        }
    };

    return (
        <View style={styles.screen}>
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <ScrollView
                    contentContainerStyle={[styles.scroll, contentPadding]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    contentInsetAdjustmentBehavior="automatic"
                >
                    <View style={styles.navRow}>
                        <View style={styles.navLeft}>
                            <Pressable
                                onPress={() => router.back()}
                                hitSlop={8}
                                style={({ pressed }) => [
                                    styles.iconButton,
                                    pressed && styles.pressed,
                                ]}
                            >
                                <Feather
                                    name="arrow-left"
                                    size={18}
                                    color={colors.foreground}
                                />
                            </Pressable>
                            <Text style={styles.navTitle} numberOfLines={1}>
                                {problem.title}
                            </Text>
                        </View>

                        <Pressable
                            onPress={() => setPickerOpen(true)}
                            style={({ pressed }) => [
                                styles.languageChip,
                                pressed && styles.pressed,
                            ]}
                        >
                            <View
                                style={[
                                    styles.languageBadge,
                                    {
                                        backgroundColor:
                                            LANGUAGE_TINT[language],
                                    },
                                ]}
                            >
                                <Text style={styles.languageBadgeText}>
                                    {LANGUAGE_BADGE[language]}
                                </Text>
                            </View>
                            <Text style={styles.languageLabel}>
                                {LANGUAGE_LABEL[language]}
                            </Text>
                            <Feather
                                name="chevron-down"
                                size={14}
                                color={colors.muted}
                            />
                        </Pressable>
                    </View>

                    <View style={styles.editorCard}>
                        <View style={styles.editorToolbar}>
                            <Pressable
                                hitSlop={6}
                                onPress={handleReset}
                                style={({ pressed }) =>
                                    pressed && styles.pressed
                                }
                            >
                                <Feather
                                    name="rotate-ccw"
                                    size={14}
                                    color={colors.muted}
                                />
                            </Pressable>
                            <View style={styles.toolbarDivider} />
                            <Pressable
                                hitSlop={6}
                                onPress={() => {
                                    setCode(getStarterCode(problem, language));
                                    setTouched(false);
                                }}
                                style={({ pressed }) =>
                                    pressed && styles.pressed
                                }
                            >
                                <Feather
                                    name="refresh-cw"
                                    size={14}
                                    color={colors.muted}
                                />
                            </Pressable>
                        </View>

                        <CodeEditor
                            value={code}
                            onValueChange={(next) => {
                                setCode(next);
                                setTouched(true);
                            }}
                            language={language}
                            minHeight={280}
                            placeholder="// Write your solution here"
                        />
                    </View>

                    <View style={styles.casesHeader}>
                        <View style={styles.casesIcon}>
                            <Ionicons
                                name="flask-outline"
                                size={14}
                                color={colors.peach}
                            />
                        </View>
                        <Text style={styles.casesTitle}>Sample Cases</Text>
                    </View>

                    {sampleCases.length > 0 ? (
                        <>
                            <View style={styles.caseTabs}>
                                {sampleCases.map((_, index) => {
                                    const active = activeCase === index;
                                    return (
                                        <Pressable
                                            key={index}
                                            onPress={() => setActiveCase(index)}
                                            style={({ pressed }) => [
                                                styles.caseTab,
                                                active && styles.caseTabActive,
                                                pressed && styles.pressed,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.caseTabLabel,
                                                    {
                                                        color: active
                                                            ? colors.peach
                                                            : colors.muted,
                                                    },
                                                ]}
                                            >
                                                Case {index + 1}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>

                            {currentCase ? (
                                <>
                                    <Text style={styles.fieldLabel}>Input</Text>
                                    <View style={styles.fieldBox}>
                                        <Text style={styles.fieldValue}>
                                            {currentCase.input}
                                        </Text>
                                    </View>

                                    <Text style={styles.fieldLabel}>
                                        Expected Output
                                    </Text>
                                    <View style={styles.fieldBox}>
                                        <Text style={styles.fieldValue}>
                                            {currentCase.output}
                                        </Text>
                                    </View>
                                </>
                            ) : null}
                        </>
                    ) : (
                        <View style={styles.emptyCases}>
                            <Text style={styles.emptyCasesText}>
                                No sample cases available for this problem.
                            </Text>
                        </View>
                    )}

                    {summary ? (
                        <Pressable
                            onPress={() => setResultsOpen(true)}
                            style={({ pressed }) => [
                                styles.summaryCard,
                                {
                                    backgroundColor:
                                        summary.passed === summary.total
                                            ? "rgba(134,239,172,0.10)"
                                            : "rgba(252,165,165,0.10)",
                                    borderColor:
                                        summary.passed === summary.total
                                            ? "rgba(134,239,172,0.3)"
                                            : "rgba(252,165,165,0.3)",
                                },
                                pressed && styles.pressed,
                            ]}
                        >
                            <View style={styles.summaryLeft}>
                                <Feather
                                    name={
                                        summary.passed === summary.total
                                            ? "check-circle"
                                            : "x-circle"
                                    }
                                    size={16}
                                    color={
                                        summary.passed === summary.total
                                            ? "#86efac"
                                            : "#fca5a5"
                                    }
                                />
                                <Text
                                    style={[
                                        styles.summaryText,
                                        {
                                            color:
                                                summary.passed === summary.total
                                                    ? "#86efac"
                                                    : "#fca5a5",
                                        },
                                    ]}
                                >
                                    {summary.passed}/{summary.total} test cases
                                    passed
                                    {solved ? " · Solved" : ""}
                                </Text>
                            </View>
                            <Text style={styles.summaryHint}>View details</Text>
                        </Pressable>
                    ) : null}

                    <View style={styles.footer}>
                        <Pressable
                            onPress={handleSubmit}
                            disabled={running}
                            style={({ pressed }) => [
                                styles.submitButton,
                                (running || pressed) && styles.pressed,
                            ]}
                        >
                            {running ? (
                                <ActivityIndicator color="#1f1208" />
                            ) : (
                                <>
                                    <Text style={styles.submitLabel}>
                                        Submit Solution
                                    </Text>
                                    <Feather
                                        name="play"
                                        size={16}
                                        color="#1f1208"
                                    />
                                </>
                            )}
                        </Pressable>
                    </View>
                </ScrollView>
            </SafeAreaView>

            <LanguagePicker
                visible={pickerOpen}
                active={language}
                languages={availableLanguages}
                onClose={() => setPickerOpen(false)}
                onSelect={(lang) => {
                    setLanguage(lang);
                    setPickerOpen(false);
                    if (!touched && problem) {
                        setCode(getStarterCode(problem, lang));
                    }
                }}
            />

            <ResultsSheet
                visible={resultsOpen}
                onClose={() => setResultsOpen(false)}
                results={results}
                solved={solved}
            />
        </View>
    );
}

function ResultsSheet({
    visible,
    onClose,
    results,
    solved,
}: {
    visible: boolean;
    onClose: () => void;
    results: CaseResult[] | null;
    solved: boolean;
}) {
    const { sheetPaddingBottom } = useScreenInsets();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.modalBackdrop}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                <View
                    style={[
                        styles.resultsSheet,
                        { paddingBottom: sheetPaddingBottom, maxHeight: "80%" },
                    ]}
                >
                    <View style={styles.modalHandle} />
                    <View style={styles.resultsHeader}>
                        <Text style={styles.modalTitle}>
                            Run results{solved ? " · Solved" : ""}
                        </Text>
                        <Pressable onPress={onClose} hitSlop={8}>
                            <Feather name="x" size={18} color={colors.muted} />
                        </Pressable>
                    </View>
                    <ScrollView
                        contentContainerStyle={{ paddingBottom: 8 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {results?.map((result) => (
                            <ResultRow key={result.index} result={result} />
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

function ResultRow({ result }: { result: CaseResult }) {
    const tint =
        result.outcome === "accepted"
            ? { fg: "#86efac", bg: "rgba(134,239,172,0.10)", label: "Accepted" }
            : result.outcome === "wrong-answer"
              ? {
                    fg: "#fca5a5",
                    bg: "rgba(252,165,165,0.10)",
                    label: "Wrong Answer",
                }
              : { fg: "#fdba74", bg: "rgba(253,186,116,0.10)", label: "Error" };

    return (
        <View style={styles.resultRow}>
            <View style={styles.resultTop}>
                <Text style={styles.resultCase}>Case {result.index + 1}</Text>
                <View
                    style={[styles.resultBadge, { backgroundColor: tint.bg }]}
                >
                    <Text style={[styles.resultBadgeText, { color: tint.fg }]}>
                        {tint.label.toUpperCase()}
                    </Text>
                </View>
            </View>

            <Text style={styles.resultLabel}>INPUT</Text>
            <Text style={styles.resultValue}>{result.input}</Text>

            <Text style={styles.resultLabel}>EXPECTED</Text>
            <Text style={styles.resultValue}>{result.expectedOutput}</Text>

            <Text style={styles.resultLabel}>OUTPUT</Text>
            <Text style={[styles.resultValue, { color: tint.fg }]}>
                {result.actualOutput || "(empty)"}
            </Text>

            {result.stderr ? (
                <>
                    <Text style={styles.resultLabel}>STDERR</Text>
                    <Text style={[styles.resultValue, { color: "#fca5a5" }]}>
                        {result.stderr}
                    </Text>
                </>
            ) : null}

            {result.timeSec != null || result.memoryKb != null ? (
                <View style={styles.resultMeta}>
                    {result.timeSec != null ? (
                        <View style={styles.resultMetaItem}>
                            <Feather
                                name="clock"
                                size={11}
                                color={colors.muted}
                            />
                            <Text style={styles.resultMetaText}>
                                {result.timeSec.toFixed(3)}s
                            </Text>
                        </View>
                    ) : null}
                    {result.memoryKb != null ? (
                        <View style={styles.resultMetaItem}>
                            <Feather
                                name="cpu"
                                size={11}
                                color={colors.muted}
                            />
                            <Text style={styles.resultMetaText}>
                                {result.memoryKb} KB
                            </Text>
                        </View>
                    ) : null}
                </View>
            ) : null}
        </View>
    );
}

function LanguagePicker({
    visible,
    active,
    languages,
    onClose,
    onSelect,
}: {
    visible: boolean;
    active: LanguageId;
    languages: LanguageId[];
    onClose: () => void;
    onSelect: (lang: LanguageId) => void;
}) {
    const { sheetPaddingBottom } = useScreenInsets();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.modalBackdrop}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                <View
                    style={[
                        styles.modalSheet,
                        { paddingBottom: sheetPaddingBottom },
                    ]}
                >
                    <View style={styles.modalHandle} />
                    <Text style={styles.modalTitle}>Pick a language</Text>
                    <View style={{ gap: 8 }}>
                        {languages.map((lang) => {
                            const isActive = active === lang;
                            return (
                                <Pressable
                                    key={lang}
                                    onPress={() => onSelect(lang)}
                                    style={({ pressed }) => [
                                        styles.languageOption,
                                        {
                                            backgroundColor: isActive
                                                ? "rgba(189,240,110,0.10)"
                                                : colors.card,
                                            borderColor: isActive
                                                ? "rgba(189,240,110,0.35)"
                                                : colors.cardBorder,
                                        },
                                        pressed && styles.pressed,
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.languageBadge,
                                            {
                                                backgroundColor:
                                                    LANGUAGE_TINT[lang],
                                                marginRight: 10,
                                            },
                                        ]}
                                    >
                                        <Text style={styles.languageBadgeText}>
                                            {LANGUAGE_BADGE[lang]}
                                        </Text>
                                    </View>
                                    <Text style={styles.languageOptionLabel}>
                                        {LANGUAGE_LABEL[lang]}
                                    </Text>
                                    {isActive ? (
                                        <Feather
                                            name="check"
                                            size={16}
                                            color={colors.lime}
                                        />
                                    ) : null}
                                </Pressable>
                            );
                        })}
                    </View>
                </View>
            </View>
        </Modal>
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
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        backgroundColor: colors.background,
    },
    notFoundTitle: {
        color: colors.foreground,
        fontSize: 18,
        fontWeight: "700",
        marginTop: 16,
    },
    backButton: {
        marginTop: 24,
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: colors.lime,
    },
    backButtonLabel: {
        color: colors.background,
        fontWeight: "700",
    },
    scroll: {
        flexGrow: 1,
    },
    navRow: {
        height: 56,
        marginBottom: 4,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    navLeft: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        paddingRight: 12,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    navTitle: {
        flex: 1,
        color: colors.foreground,
        fontSize: 15,
        fontWeight: "700",
        marginLeft: 12,
    },
    languageChip: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        gap: 8,
    },
    languageBadge: {
        width: 16,
        height: 16,
        borderRadius: 4,
        alignItems: "center",
        justifyContent: "center",
    },
    languageBadgeText: {
        color: colors.background,
        fontSize: 9,
        fontWeight: "900",
    },
    languageLabel: {
        color: colors.foreground,
        fontSize: 12,
        fontWeight: "600",
    },
    editorCard: {
        borderRadius: 16,
        backgroundColor: "#0f1014",
        borderWidth: 1,
        borderColor: colors.cardBorder,
        overflow: "hidden",
    },
    editorToolbar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.06)",
        backgroundColor: "rgba(255,255,255,0.02)",
    },
    toolbarDivider: {
        width: 1,
        height: 14,
        backgroundColor: "rgba(255,255,255,0.08)",
        marginHorizontal: 12,
    },
    casesHeader: {
        marginTop: 24,
        flexDirection: "row",
        alignItems: "center",
    },
    casesIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
        backgroundColor: "rgba(253,186,116,0.18)",
    },
    casesTitle: {
        color: colors.foreground,
        fontSize: 15,
        fontWeight: "700",
    },
    caseTabs: {
        marginTop: 12,
        flexDirection: "row",
        gap: 8,
    },
    caseTab: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderBottomWidth: 2,
        borderBottomColor: "transparent",
    },
    caseTabActive: {
        borderBottomColor: colors.peach,
    },
    caseTabLabel: {
        fontSize: 13,
        fontWeight: "600",
    },
    fieldLabel: {
        marginTop: 16,
        marginBottom: 8,
        color: colors.muted,
        fontSize: 12,
        letterSpacing: 0.6,
    },
    fieldBox: {
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "rgba(255,255,255,0.03)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
    },
    fieldValue: {
        color: colors.foreground,
        fontSize: 13,
        lineHeight: 20,
        fontFamily: mono,
    },
    emptyCases: {
        marginTop: 12,
        borderRadius: 16,
        padding: 16,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    emptyCasesText: {
        color: colors.muted,
        fontSize: 13,
    },
    summaryCard: {
        marginTop: 20,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
    },
    summaryLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        paddingRight: 12,
    },
    summaryText: {
        fontSize: 13,
        fontWeight: "700",
        marginLeft: 8,
    },
    summaryHint: {
        color: colors.muted,
        fontSize: 12,
    },
    footer: {
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.06)",
    },
    submitButton: {
        height: 54,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.peach,
    },
    submitLabel: {
        color: "#1f1208",
        fontSize: 16,
        fontWeight: "700",
        marginRight: 8,
    },
    pressed: {
        opacity: 0.75,
    },
    resultsSheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 16,
        backgroundColor: "#13141a",
        borderTopWidth: 1,
        borderColor: colors.cardBorder,
    },
    resultsHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    resultRow: {
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 12,
        backgroundColor: "rgba(255,255,255,0.03)",
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    resultTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    resultCase: {
        color: colors.foreground,
        fontSize: 13,
        fontWeight: "700",
    },
    resultBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    resultBadgeText: {
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 0.6,
    },
    resultLabel: {
        color: colors.muted,
        fontSize: 11,
        letterSpacing: 0.6,
        marginTop: 8,
    },
    resultValue: {
        color: colors.foreground,
        fontSize: 12,
        lineHeight: 18,
        fontFamily: mono,
    },
    resultMeta: {
        marginTop: 12,
        flexDirection: "row",
        gap: 12,
    },
    resultMetaItem: {
        flexDirection: "row",
        alignItems: "center",
    },
    resultMetaText: {
        color: colors.muted,
        fontSize: 11,
        marginLeft: 4,
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
    modalTitle: {
        color: colors.foreground,
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 12,
    },
    languageOption: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
    },
    languageOptionLabel: {
        flex: 1,
        color: colors.foreground,
        fontSize: 14,
        fontWeight: "600",
    },
});
