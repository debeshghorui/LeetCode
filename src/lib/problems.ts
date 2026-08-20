import { colors } from "@/lib/theme";
import { supabase } from "@/lib/supabase";

export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type LanguageId = "javascript" | "python" | "java";

export type LanguageExample = {
    input: string;
    output: string;
    explanation?: string;
};

export type ProblemListItem = {
    id: string;
    title: string;
    difficulty: Difficulty;
    tags: string[];
    created_at: string;
};

export type Problem = ProblemListItem & {
    description: string;
    constraints: string;
    hints: string | null;
    editorial: string | null;
    examples: Record<string, LanguageExample>;
    code_snippets: Record<string, string>;
    updated_at: string;
};

export type SubmissionListItem = {
    id: string;
    language: string;
    status: string;
    memory: string | null;
    time: string | null;
    created_at: string;
};

const LANGUAGE_KEYS: Record<LanguageId, string> = {
    javascript: "JAVASCRIPT",
    python: "PYTHON",
    java: "JAVA",
};

export const LANGUAGE_ORDER: LanguageId[] = ["javascript", "python", "java"];

export const LANGUAGE_LABEL: Record<LanguageId, string> = {
    javascript: "JavaScript",
    python: "Python",
    java: "Java",
};

export const LANGUAGE_TINT: Record<LanguageId, string> = {
    javascript: "#f7df1e",
    python: "#3776ab",
    java: "#f89820",
};

export const LANGUAGE_BADGE: Record<LanguageId, string> = {
    javascript: "JS",
    python: "PY",
    java: "JV",
};

export function difficultyLabel(difficulty: Difficulty) {
    return difficulty[0] + difficulty.slice(1).toLowerCase();
}

export function difficultyTint(difficulty: Difficulty) {
    if (difficulty === "EASY")
        return { fg: colors.success, bg: colors.successBg };
    if (difficulty === "MEDIUM")
        return { fg: colors.warning, bg: colors.warningBg };

    return { fg: colors.danger, bg: colors.dangerBg };
}

export function getAvailableLanguages(problem: Problem) {
    return LANGUAGE_ORDER.filter(
        (lang) => problem.code_snippets?.[LANGUAGE_KEYS[lang]],
    );
}

export function getStarterCode(problem: Problem, language: LanguageId) {
    return problem.code_snippets?.[LANGUAGE_KEYS[language]] ?? "";
}

export function getExamples(problem: Problem): LanguageExample[] {
    const examples = problem.examples;
    if (!examples) return [];
    if (Array.isArray(examples)) return examples;

    return Object.values(examples);
}

export function getConstraintLines(constraints: string) {
    return constraints
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
}

export function toDateKey(date: Date) {
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    return `${date.getFullYear()}-${m}-${d}`;
}

export async function fetchProblems() {
    const { data, error } = await supabase
        .from("problems")
        .select("id, title, difficulty, tags, created_at")
        .order("created_at", { ascending: true });
    if (error) throw error;

    return (data ?? []) as ProblemListItem[];
}

export async function fetchProblemById(id: string) {
    const { data, error } = await supabase
        .from("problems")
        .select(
            "id, title, description, difficulty, tags, examples, constraints, hints, editorial, code_snippets, created_at, updated_at",
        )
        .eq("id", id)
        .maybeSingle();
    if (error) throw error;

    return data as Problem | null;
}

export async function fetchSolvedCount(userId: string) {
    const { count, error } = await supabase
        .from("problem_solved")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
    if (error) throw error;

    return count ?? 0;
}

export async function fetchUserSubmissionsForProblem(
    userId: string,
    problemId: string,
) {
    const { data, error } = await supabase
        .from("submissions")
        .select("id, language, status, memory, time, created_at")
        .eq("user_id", userId)
        .eq("problem_id", problemId)
        .order("created_at", { ascending: false });
    if (error) throw error;

    return (data ?? []) as SubmissionListItem[];
}

export async function fetchUserSubmissionActivity(userId: string, days = 365) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    const { data, error } = await supabase
        .from("submissions")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", start.toISOString());

    if (error) throw error;

    const counts = new Map<string, number>();
    for (const row of data ?? []) {
        const key = toDateKey(new Date(row.created_at));
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return counts;
}
