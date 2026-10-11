// Shared privacy and terms layout. Back goes to sign-in when this screen was
// opened with no history, such as a store-listing link.
import { colors } from "@/lib/theme";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function LegalDocument({
    title,
    updated,
    sections,
}: {
    title: string;
    updated: string;
    sections: readonly { title: string; body: string }[];
}) {
    const router = useRouter();

    return (
        <View style={styles.screen}>
            <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
                <View style={styles.header}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                        onPress={() => {
                            if (router.canGoBack()) {
                                router.back();
                                return;
                            }
                            router.replace("/(auth)/sign-in");
                        }}
                        style={({ pressed }) => [
                            styles.back,
                            pressed && styles.pressed,
                        ]}
                    >
                        <Feather
                            name="arrow-left"
                            size={18}
                            color={colors.foreground}
                        />
                    </Pressable>
                    <Text style={styles.title}>{title}</Text>
                </View>
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.updated}>Updated {updated}</Text>
                    {sections.map((section) => (
                        <View key={section.title} style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                {section.title}
                            </Text>
                            <Text style={styles.body}>{section.body}</Text>
                        </View>
                    ))}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    safe: { flex: 1 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    back: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    title: {
        color: colors.foreground,
        fontSize: 24,
        fontWeight: "700",
    },
    content: { padding: 20, paddingBottom: 40 },
    updated: { color: colors.muted, fontSize: 13 },
    section: { marginTop: 22 },
    sectionTitle: {
        color: colors.foreground,
        fontSize: 16,
        fontWeight: "700",
    },
    body: {
        color: colors.muted,
        fontSize: 15,
        lineHeight: 22,
        marginTop: 6,
    },
    pressed: { opacity: 0.7 },
});
