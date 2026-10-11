// Judge-side Sentry (@sentry/node). Do not import this from a screen.
import * as Sentry from "@sentry/node";

let initialized = false;

function initServerSentry() {
    if (initialized) return;
    initialized = true;

    const dsn =
        process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() ||
        process.env.SENTRY_DSN?.trim();
    if (!dsn) return;

    const environment = process.env.APP_VARIANT || "development";

    Sentry.init({
        dsn,
        environment,
        tracesSampleRate: environment === "production" ? 0.2 : 1,
    });
}

export async function captureSubmitObservability(input: {
    userId: string;
    problemId: string;
    language: string;
    outcome: string;
    judgeMs: number;
    error?: unknown;
}) {
    initServerSentry();
    if (!Sentry.getClient()) return;

    Sentry.withScope((scope) => {
        scope.setTag("runtime", "server");
        scope.setUser({ id: input.userId });
        scope.setContext("submit", {
            problemId: input.problemId,
            language: input.language,
            outcome: input.outcome,
            judgeMs: input.judgeMs,
        });

        if (input.error) {
            Sentry.captureException(input.error);
            return;
        }

        Sentry.captureMessage("submit.judge", "info");
    });

    await Sentry.flush(2000);
}
