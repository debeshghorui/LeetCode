import type { LanguageId } from '@/lib/problems'

export const LANGUAGE_ID_MAP: Record<LanguageId, number> = {
    javascript: 63,
    python: 71,
    java: 62,
}

export type RunOutcome = 'accepted' | 'wrong-answer' | 'error'

export type CaseResult = {
    index: number
    input: string
    expectedOutput: string
    actualOutput: string
    stderr: string
    status: { id: number; description: string }
    outcome: RunOutcome
    timeSec: number | null
    memoryKb: number | null
}

export type ProblemTestCase = { input: string; output: string }

type CodeBoxResponse = {
    stdout: string | null
    stderr: string | null
    status: { id: number; description: string }
    time: string | null
    memory: number | null
}

export function normalise(value: string | null | undefined) {
    return (value ?? '').replace(/\r\n/g, '\n').trim()
}

export function parseTestCases(raw: unknown): ProblemTestCase[] {
    return Array.isArray(raw) ? (raw as ProblemTestCase[]) : []
}

export async function executeOnCodeBox(params: {
    languageId: number
    sourceCode: string
    stdin: string
    expectedOutput: string
}) {
    const token = process.env.CODEBOX_API_TOKEN
    if (!token) throw new Error('CODEBOX_TOKEN is not configured on the server.')

    const upstream = await fetch('https://chaicode.net/api/execute', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': token,
        },
        body: JSON.stringify({
            language_id: params.languageId,
            source_code: params.sourceCode,
            stdin: params.stdin,
            expected_output: params.expectedOutput,
            cpu_time_limit: 5,
            memory_limit: 256000,
        }),
    })

    const text = await upstream.text()
    if (!upstream.ok) throw new Error(`CodeBox ${upstream.status}: ${text}`)

    return JSON.parse(text) as CodeBoxResponse
}

export function toCaseResult(
    index: number,
    testCase: ProblemTestCase,
    data: CodeBoxResponse
): CaseResult {
    const actualOutput = normalise(data.stdout)
    const expectedOutput = normalise(testCase.output)
    const passed = actualOutput === expectedOutput
    const outcome: RunOutcome = data.status.id === 3 || data.status.id === 4 ? passed ? 'accepted' : 'wrong-answer' : 'error'

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
    }
}

export async function runAllTestCases(params: {
    language: LanguageId
    sourceCode: string
    testCases: ProblemTestCase[]
}) {
    const languageId = LANGUAGE_ID_MAP[params.language]

    return Promise.all(
        params.testCases.map(async (testCase, index) => {
            try {
                const data = await executeOnCodeBox({
                    languageId,
                    sourceCode: params.sourceCode,
                    stdin: testCase.input,
                    expectedOutput: testCase.output,
                })

                return toCaseResult(index, testCase, data)
            } catch (err) {
                return {
                    index,
                    input: testCase.input,
                    expectedOutput: normalise(testCase.output),
                    actualOutput: '',
                    stderr: err instanceof Error ? err.message : String(err),
                    status: { id: -1, description: 'Error' },
                    outcome: 'error' as const,
                    timeSec: null,
                    memoryKb: null,
                }
            }
        })
    )
}

export function outcomeStatusLabel(outcome: RunOutcome) {
    if (outcome === 'accepted') return 'Accepted'
    if (outcome === 'wrong-answer') return 'Wrong Answer'

    return 'Error'
}