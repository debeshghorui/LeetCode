// Client side of a submit. Posts to the Expo API route with the user's access
// token. Dev uses the Metro host; a release build needs EXPO_PUBLIC_API_BASE_URL.
// This module does not talk to CodeBox and must not read hidden tests.
import Constants from "expo-constants";

import type { CaseResult } from "@/lib/judge";
import {
    trackApiFailed,
    trackSubmitFinished,
    trackSubmitStarted,
} from "@/lib/observability";
import type { LanguageId } from "@/lib/problems";
import { supabase } from "@/lib/supabase";

export type { CaseResult } from "@/lib/judge";

export type SubmitResponse = {
    submissionId: string;
    status: string;
    solved: boolean;
    passed: number;
    total: number;
    results: CaseResult[];
    judgeMs?: number;
};

export function resolveApiBaseUrl() {
    if (process.env.EXPO_PUBLIC_API_BASE_URL)
        return process.env.EXPO_PUBLIC_API_BASE_URL;

    if (!__DEV__) {
        throw new Error(
            "Submissions are unavailable. Set EXPO_PUBLIC_API_BASE_URL to the deployed API before building for Google Play.",
        );
    }

    const hostUri =
        Constants.expoConfig?.hostUri ??
        (Constants as { manifest?: { hostUri?: string } }).manifest?.hostUri;

    return hostUri
        ? `http://${hostUri.split("/")[0]}`
        : "http://localhost:8081";
}

export async function submitSolution(params: {
    problemId: string;
    language: LanguageId;
    sourceCode: string;
}) {
    const {
        data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token)
        throw new Error("You must be signed in to submit.");

    trackSubmitStarted({
        problemId: params.problemId,
        language: params.language,
    });
    const startedAt = Date.now();
    let reportedFailure = false;

    try {
        const response = await fetch(`${resolveApiBaseUrl()}/api/submit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(params),
        });

        const payload = (await response.json()) as SubmitResponse & {
            error?: string;
            message?: string;
        };
        if (!response.ok) {
            reportedFailure = true;
            trackApiFailed({
                route: "/api/submit",
                status: response.status,
            });
            throw new Error(
                payload.error ??
                    payload.message ??
                    `Submit failed (${response.status})`,
            );
        }

        trackSubmitFinished({
            problemId: params.problemId,
            language: params.language,
            status: payload.status,
            durationMs: Date.now() - startedAt,
            judgeMs: payload.judgeMs,
            submissionId: payload.submissionId,
        });
        return payload;
    } catch (error) {
        if (!reportedFailure) {
            trackApiFailed({ route: "/api/submit", status: 0 });
        }
        throw error;
    }
}
