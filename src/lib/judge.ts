// Server judge. Reads test_cases with the service role — the client is not
// granted that column — runs each case on CodeBox, then writes submissions,
// test_case_results, and problem_solved.
//
// language_id values are the Judge0 ids chaicode.net expects. A case is
// accepted only when status id is 3 or 4 and trimmed stdout matches.
import { captureSubmitObservability } from "@/lib/sentry-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { LanguageId } from "@/lib/problems";
import { runTask, StatusError } from "expo-server";

const LANGUAGE_ID_MAP: Record<LanguageId, number> = {
    javascript: 63,
    python: 71,
    java: 62,
};

export type RunOutcome = "accepted" | "wrong-answer" | "error";

export type CaseResult = {
    index: number;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    stderr: string;
    status: { id: number; description: string };
    outcome: RunOutcome;
    timeSec: number | null;
    memoryKb: number | null;
};

type ProblemTestCase = { input: string; output: string };

type CodeBoxResponse = {
    stdout: string | null;
    stderr: string | null;
    status: { id: number; description: string };
    time: string | null;
    memory: number | null;
};

function normalise(value: string | null | undefined) {
    return (value ?? "").replace(/\r\n/g, "\n").trim();
}

function parseTestCases(raw: unknown): ProblemTestCase[] {
    return Array.isArray(raw) ? (raw as ProblemTestCase[]) : [];
}

async function executeOnCodeBox(params: {
    languageId: number;
    sourceCode: string;
    stdin: string;
    expectedOutput: string;
}) {
    const token = process.env.CODEBOX_API_TOKEN;
    if (!token)
        throw new Error("CODEBOX_TOKEN is not configured on the server.");

    const upstream = await fetch("https://chaicode.net/api/execute", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": token,
        },
        body: JSON.stringify({
            language_id: params.languageId,
            source_code: params.sourceCode,
            stdin: params.stdin,
            expected_output: params.expectedOutput,
            cpu_time_limit: 5,
            memory_limit: 256000,
        }),
    });

    const text = await upstream.text();
    if (!upstream.ok) throw new Error(`CodeBox ${upstream.status}: ${text}`);

    return JSON.parse(text) as CodeBoxResponse;
}

function toCaseResult(
    index: number,
    testCase: ProblemTestCase,
    data: CodeBoxResponse,
): CaseResult {
    const actualOutput = normalise(data.stdout);
    const expectedOutput = normalise(testCase.output);
    const passed = actualOutput === expectedOutput;
    const outcome: RunOutcome =
        data.status.id === 3 || data.status.id === 4
            ? passed
                ? "accepted"
                : "wrong-answer"
            : "error";

    return {
        index,
        input: testCase.input,
        expectedOutput,
        actualOutput,
        stderr: normalise(data.stderr),
        status: data.status,
        outcome,
        timeSec: data.time ? Number(data.time) : null,
        memoryKb: data.memory ?? null,
    };
}

async function runAllTestCases(params: {
    language: LanguageId;
    sourceCode: string;
    testCases: ProblemTestCase[];
}) {
    const languageId = LANGUAGE_ID_MAP[params.language];

    return Promise.all(
        params.testCases.map(async (testCase, index) => {
            try {
                const data = await executeOnCodeBox({
                    languageId,
                    sourceCode: params.sourceCode,
                    stdin: testCase.input,
                    expectedOutput: testCase.output,
                });

                return toCaseResult(index, testCase, data);
            } catch (err) {
                return {
                    index,
                    input: testCase.input,
                    expectedOutput: normalise(testCase.output),
                    actualOutput: "",
                    stderr: err instanceof Error ? err.message : String(err),
                    status: { id: -1, description: "Error" },
                    outcome: "error" as const,
                    timeSec: null,
                    memoryKb: null,
                };
            }
        }),
    );
}

function outcomeStatusLabel(outcome: RunOutcome) {
    if (outcome === "accepted") return "Accepted";
    if (outcome === "wrong-answer") return "Wrong Answer";

    return "Error";
}

function overallStatus(results: CaseResult[]) {
    if (results.every((result) => result.outcome === "accepted")) {
        return "accepted" as const;
    }
    if (results.some((result) => result.outcome === "error")) {
        return "error" as const;
    }
    return "wrong-answer" as const;
}

function runTaskAsync<T>(fn: () => Promise<T>) {
    return new Promise<T>((resolve, reject) => {
        runTask(async () => {
            try {
                resolve(await fn());
            } catch (error) {
                reject(error);
            }
        });
    });
}

function isLanguageId(value: unknown): value is LanguageId {
    return value === "javascript" || value === "python" || value === "java";
}

export async function recordSubmission(input: {
    userId: string;
    problemId: unknown;
    language: unknown;
    sourceCode: unknown;
}) {
    const { userId, problemId, language, sourceCode } = input;

    if (
        typeof problemId !== "string" ||
        !problemId ||
        typeof sourceCode !== "string" ||
        !sourceCode
    ) {
        throw new StatusError(
            400,
            "`problemId` and `sourceCode` are required.",
        );
    }

    if (!isLanguageId(language)) {
        throw new StatusError(
            400,
            "`language` must be javascript, python, or java.",
        );
    }

    const admin = getSupabaseAdmin();
    const { data: problem } = await admin
        .from("problems")
        .select("id, test_cases")
        .eq("id", problemId)
        .maybeSingle();

    if (!problem) throw new StatusError(404, "Problem not found");

    const testCases = parseTestCases(problem.test_cases);
    if (!testCases.length) {
        throw new StatusError(400, "No test cases configured.");
    }

    const judgeStartedAt = Date.now();
    let results: CaseResult[];
    try {
        results = await runTaskAsync(() =>
            runAllTestCases({ language, sourceCode, testCases }),
        );
    } catch (error) {
        await captureSubmitObservability({
            userId,
            problemId,
            language: String(language ?? ""),
            outcome: "error",
            judgeMs: Date.now() - judgeStartedAt,
            error,
        });
        throw error;
    }

    const judgeMs = Date.now() - judgeStartedAt;
    const status = overallStatus(results);

    await captureSubmitObservability({
        userId,
        problemId,
        language: String(language ?? ""),
        outcome: status,
        judgeMs,
    });

    const statusLabel = outcomeStatusLabel(status);
    const times = results
        .map((result) => result.timeSec)
        .filter((time): time is number => time != null);
    const memories = results
        .map((result) => result.memoryKb)
        .filter((memory): memory is number => memory != null);

    const { data: submission, error: submissionError } = await admin
        .from("submissions")
        .insert({
            user_id: userId,
            problem_id: problemId,
            source_code: { [language]: sourceCode },
            language,
            status: statusLabel,
            memory: memories.length ? `${Math.max(...memories)} KB` : null,
            time: times.length ? `${Math.max(...times).toFixed(3)} s` : null,
        })
        .select("id")
        .single();

    if (submissionError || !submission) {
        throw new StatusError(
            500,
            submissionError?.message ?? "Failed to save submission.",
        );
    }

    await admin.from("test_case_results").insert(
        results.map((result) => ({
            submission_id: submission.id,
            test_case: result.index + 1,
            passed: result.outcome === "accepted",
            stdout: result.actualOutput,
            expected: result.expectedOutput,
            stderr: result.stderr || null,
            status: outcomeStatusLabel(result.outcome),
            memory: result.memoryKb != null ? `${result.memoryKb} KB` : null,
            time:
                result.timeSec != null
                    ? `${result.timeSec.toFixed(3)} s`
                    : null,
        })),
    );

    const solved = status === "accepted";
    if (solved) {
        await admin
            .from("problem_solved")
            .upsert(
                { user_id: userId, problem_id: problemId },
                { onConflict: "user_id,problem_id", ignoreDuplicates: true },
            );
    }

    return {
        submissionId: submission.id,
        status: statusLabel,
        solved,
        passed: results.filter((result) => result.outcome === "accepted")
            .length,
        total: results.length,
        results,
        judgeMs,
    };
}
