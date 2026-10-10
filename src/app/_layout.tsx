import {
    initObservability,
    registerSentryNavigation,
} from "@/lib/observability";
import { useAuthStore } from "@/state/auth-store";
import * as Sentry from "@sentry/react-native";
import {
    Stack,
    useNavigationContainerRef,
    useRouter,
    useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-url-polyfill/auto";

import { envConfigurationError } from "../../env";

initObservability();
SplashScreen.preventAutoHideAsync();

function RootNavigator() {
    const session = useAuthStore((s) => s.session);
    const isLoading = useAuthStore((s) => s.isLoading);
    const initialize = useAuthStore((s) => s.initialize);
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        const cleanup = initialize();
        return cleanup;
    }, [initialize]);

    useEffect(() => {
        if (isLoading) return;

        const rootSegment = segments.at(0) as string | undefined;
        const inAuthGroup = rootSegment === "(auth)";
        const inAuthCallback = rootSegment === "auth";
        const inLegal = rootSegment === "legal";

        if (!session && !inAuthGroup && !inAuthCallback && !inLegal) {
            router.replace("/(auth)/sign-in" as never);
        } else if (session && (inAuthGroup || inAuthCallback)) {
            router.replace("/" as never);
        }

        SplashScreen.hideAsync();
    }, [session, isLoading, segments, router]);

    if (isLoading) {
        return (
            <View
                style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#0a0a0c",
                }}
            >
                <ActivityIndicator color="#bdf06e" />
            </View>
        );
    }

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#0a0a0c" },
                animation: "fade",
            }}
        >
            <Stack.Screen name="(tab)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="auth/callback" />
            <Stack.Screen name="legal" />
        </Stack>
    );
}

function RootLayout() {
    const navigationRef = useNavigationContainerRef();

    useEffect(() => {
        registerSentryNavigation(navigationRef);
    }, [navigationRef]);

    useEffect(() => {
        if (envConfigurationError) {
            SplashScreen.hideAsync();
        }
    }, []);

    if (envConfigurationError) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    padding: 24,
                    backgroundColor: "#0a0a0c",
                }}
            >
                <Text
                    style={{
                        color: "#fafafa",
                        fontSize: 20,
                        fontWeight: "700",
                    }}
                >
                    MobLeet could not start
                </Text>
                <Text style={{ color: "#9e9ea7", marginTop: 12, fontSize: 16 }}>
                    {envConfigurationError}
                </Text>
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <StatusBar style="light" />
            <RootNavigator />
        </SafeAreaProvider>
    );
}

export default Sentry.wrap(RootLayout);
