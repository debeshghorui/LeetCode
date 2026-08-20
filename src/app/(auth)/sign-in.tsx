import { AntDesign, Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";

import { signInWithOAuth } from "@/lib/auth";

type Provider = "github" | "google";

const LIME = "#bdf06e";
const PEACH = "#fdba74";
const BACKGROUND = "#0a0a0c";
const FOREGROUND = "#fafafa";
const MUTED = "#9e9ea7";

export default function SignInScreen() {
    const [loading, setLoading] = useState<Provider | null>(null);

    useEffect(() => {
        void WebBrowser.warmUpAsync();
        return () => {
            void WebBrowser.coolDownAsync();
        };
    }, []);

    async function handleSignIn(provider: Provider) {
        if (loading) return;
        setLoading(provider);
        try {
            await signInWithOAuth(provider);
        } catch (err) {
            Alert.alert(
                "Sign in failed",
                err instanceof Error ? err.message : "Unknown error",
            );
        } finally {
            setLoading(null);
        }
    }

    return (
        <View style={styles.screen}>
            <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <View style={styles.logoBox}>
                            <Image
                                source={require("../../../assets/images/logo.png")}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.version}>v1.0</Text>
                    </View>

                    <View style={styles.hero}>
                        <View style={styles.badge}>
                            <View style={styles.badgeDot} />
                            <Text style={styles.badgeText}>Solve smarter</Text>
                        </View>

                        <Text style={styles.title}>Welcome to</Text>
                        <Text style={styles.titleAccent}>MobLeet.</Text>

                        <Text style={styles.subtitle}>
                            Practice anywhere - track your{" "}
                            <Text style={styles.subtitleHighlight}>streak</Text>
                            , revisit solutions, and stay consistent.
                        </Text>
                    </View>

                    <View style={styles.features}>
                        <FeatureRow
                            icon="zap"
                            color={LIME}
                            title="Daily practice"
                            subtitle="Quick problems that fit your day"
                        />
                        <FeatureRow
                            icon="map-pin"
                            color={PEACH}
                            title="Track progress"
                            subtitle="Streaks, topics, and solved history"
                        />
                        <FeatureRow
                            icon="shield"
                            color="#a5f3fc"
                            title="Private & secure"
                            subtitle="Supabase Auth · secure sessions"
                        />
                    </View>

                    <View style={styles.actions}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.githubButton,
                                pressed && styles.buttonPressed,
                                loading !== null && styles.buttonDisabled,
                            ]}
                            disabled={loading !== null}
                            onPress={() => handleSignIn("github")}
                        >
                            {loading === "github" ? (
                                <ActivityIndicator color={BACKGROUND} />
                            ) : (
                                <>
                                    <AntDesign
                                        name="github"
                                        size={18}
                                        color={BACKGROUND}
                                    />
                                    <Text style={styles.githubButtonLabel}>
                                        Continue with GitHub
                                    </Text>
                                </>
                            )}
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [
                                styles.googleButton,
                                pressed && styles.buttonPressed,
                                loading !== null && styles.buttonDisabled,
                            ]}
                            disabled={loading !== null}
                            onPress={() => handleSignIn("google")}
                        >
                            {loading === "google" ? (
                                <ActivityIndicator color={FOREGROUND} />
                            ) : (
                                <>
                                    <AntDesign
                                        name="google"
                                        size={18}
                                        color={FOREGROUND}
                                    />
                                    <Text style={styles.googleButtonLabel}>
                                        Continue with Google
                                    </Text>
                                </>
                            )}
                        </Pressable>
                    </View>

                    <Text style={styles.legal}>
                        {"By continuing you agree to MobLeet's "}
                        <Text
                            style={styles.legalLink}
                            onPress={() =>
                                Linking.openURL("https://example.com/terms")
                            }
                        >
                            Terms
                        </Text>{" "}
                        and{" "}
                        <Text
                            style={styles.legalLink}
                            onPress={() =>
                                Linking.openURL("https://example.com/privacy")
                            }
                        >
                            Privacy Policy
                        </Text>
                        .
                    </Text>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

function FeatureRow({
    icon,
    color,
    title,
    subtitle,
}: {
    icon: keyof typeof Feather.glyphMap;
    color: string;
    title: string;
    subtitle: string;
}) {
    return (
        <View style={styles.featureRow}>
            <View
                style={[
                    styles.featureIconBox,
                    { backgroundColor: `${color}24` },
                ]}
            >
                <Feather name={icon} size={18} color={color} />
            </View>
            <View style={styles.featureCopy}>
                <Text style={styles.featureTitle}>{title}</Text>
                <Text style={styles.featureSubtitle}>{subtitle}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: BACKGROUND,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 16,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    logoBox: {
        width: 44,
        height: 44,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        backgroundColor: "rgba(189, 240, 110, 0.14)",
        borderWidth: 1,
        borderColor: "rgba(189, 240, 110, 0.32)",
    },
    logoImage: {
        width: 28,
        height: 28,
    },
    version: {
        color: MUTED,
        fontSize: 12,
        letterSpacing: 1.4,
    },
    hero: {
        marginTop: 40,
    },
    badge: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 999,
        marginBottom: 16,
        backgroundColor: "rgba(189, 240, 110, 0.12)",
        borderWidth: 1,
        borderColor: "rgba(189, 240, 110, 0.28)",
    },
    badgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: LIME,
        marginRight: 8,
    },
    badgeText: {
        color: LIME,
        fontSize: 12,
        fontWeight: "600",
    },
    title: {
        color: FOREGROUND,
        fontSize: 36,
        lineHeight: 42,
        fontWeight: "700",
    },
    titleAccent: {
        color: LIME,
        fontSize: 36,
        lineHeight: 42,
        fontWeight: "700",
    },
    subtitle: {
        color: MUTED,
        fontSize: 15,
        lineHeight: 22,
        marginTop: 12,
    },
    subtitleHighlight: {
        color: PEACH,
    },
    features: {
        marginTop: 32,
        gap: 10,
    },
    featureRow: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 16,
        padding: 14,
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.06)",
    },
    featureIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    featureCopy: {
        flex: 1,
        marginLeft: 12,
    },
    featureTitle: {
        color: FOREGROUND,
        fontSize: 14,
        fontWeight: "600",
    },
    featureSubtitle: {
        color: MUTED,
        fontSize: 12,
    },
    actions: {
        marginTop: 32,
        gap: 12,
    },
    githubButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        minHeight: 52,
        borderRadius: 16,
        backgroundColor: LIME,
        paddingHorizontal: 20,
    },
    googleButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        minHeight: 52,
        borderRadius: 16,
        backgroundColor: "rgba(255, 255, 255, 0.06)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.12)",
        paddingHorizontal: 20,
    },
    buttonPressed: {
        opacity: 0.88,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    githubButtonLabel: {
        color: BACKGROUND,
        fontSize: 16,
        fontWeight: "600",
    },
    googleButtonLabel: {
        color: FOREGROUND,
        fontSize: 16,
        fontWeight: "600",
    },

    legal: {
        color: MUTED,
        fontSize: 12,
        lineHeight: 18,
        textAlign: "center",
        marginTop: 24,
    },
    legalLink: {
        color: PEACH,
        textDecorationLine: "underline",
    },
});
