// Client Sentry and PostHog. Both no-op when their keys are missing.
// Events carry user id, problem id, language, and timing — never source code.
import * as Application from "expo-application";
import Constants from "expo-constants";
import { isRunningInExpoGo } from "expo";
import * as Updates from "expo-updates";
import PostHog from "posthog-react-native";
import { Platform } from "react-native";
import * as Sentry from "@sentry/react-native";

import { env } from "../../env";

const DEFAULT_POSTHOG_HOST = "https://us.i.posthog.com";

export type AuthProvider = "github" | "google";

let posthog: PostHog | null = null;
let initialized = false;
const sentryNavigation = Sentry.reactNavigationIntegration({
    enableTimeToInitialDisplay: !isRunningInExpoGo(),
});

function getRelease() {
    const version =
        Application.nativeApplicationVersion ??
        Constants.expoConfig?.version ??
        "1.0.0";
    const build = Application.nativeBuildVersion;
    return build ? `mobleet@${version}+${build}` : `mobleet@${version}`;
}

function getUpdateDist() {
    try {
        return Updates.updateId ?? undefined;
    } catch {
        return undefined;
    }
}

function commonProperties() {
    return {
        platform: Platform.OS,
        environment: env.APP_VARIANT,
        release: getRelease(),
    };
}

function dropRequestBodies(breadcrumb: Sentry.Breadcrumb) {
    if (
        breadcrumb.category === "fetch" ||
        breadcrumb.category === "xhr" ||
        breadcrumb.category === "http"
    ) {
        if (breadcrumb.data) {
            delete breadcrumb.data.body;
            delete breadcrumb.data.request_bodySize;
        }
    }
    return breadcrumb;
}

function stripRequestPayload(event: Sentry.ErrorEvent) {
    if (event.request) {
        event.request.data = undefined;
    }
    return event;
}

export function initObservability() {
    if (initialized) return;
    initialized = true;

    try {
        const tracesSampleRate = env.APP_VARIANT === "production" ? 0.2 : 1;
        const dsn = env.EXPO_PUBLIC_SENTRY_DSN;
        const inExpoGo = isRunningInExpoGo();

        if (dsn) {
            Sentry.init({
                dsn,
                sendDefaultPii: false,
                tracesSampleRate,
                environment: env.APP_VARIANT,
                release: getRelease(),
                dist: getUpdateDist(),
                enableNative: !inExpoGo,
                enableNativeFramesTracking: !inExpoGo,
                integrations: [sentryNavigation],
                beforeBreadcrumb: dropRequestBodies,
                beforeSend: stripRequestPayload,
            });
        }

        const posthogKey = env.EXPO_PUBLIC_POSTHOG_KEY;
        if (posthogKey) {
            posthog = new PostHog(posthogKey, {
                host: env.EXPO_PUBLIC_POSTHOG_HOST ?? DEFAULT_POSTHOG_HOST,
                enableSessionReplay: false,
                captureAppLifecycleEvents: true,
            });
            posthog.register(commonProperties());
        }
    } catch (error) {
        console.warn("Observability init skipped", error);
    }
}

export function registerSentryNavigation(ref: unknown) {
    if (!env.EXPO_PUBLIC_SENTRY_DSN) return;
    sentryNavigation.registerNavigationContainer(ref);
}

export function identifyUser(userId: string) {
    Sentry.setUser({ id: userId });
    posthog?.identify(userId);
}

export function resetUser() {
    Sentry.setUser(null);
    posthog?.reset();
}

function capture(event: string, properties: Record<string, unknown>) {
    const props = { ...commonProperties(), ...properties };
    posthog?.capture(event, props);
    Sentry.addBreadcrumb({
        category: "analytics",
        message: event,
        data: props,
    });
}

export function trackAuthCompleted(provider: AuthProvider, success: boolean) {
    capture("auth_completed", { provider, success });
}

export function trackProblemOpened(problemId: string) {
    capture("problem_opened", { problemId });
}

export function trackSubmitStarted(input: {
    problemId: string;
    language: string;
}) {
    capture("submit_started", input);
}

export function trackSubmitFinished(input: {
    problemId: string;
    language: string;
    status: string;
    durationMs: number;
    judgeMs?: number;
    submissionId?: string;
}) {
    capture("submit_finished", input);
}

export function trackApiFailed(input: { route: string; status: number }) {
    capture("api_failed", input);
}
