// POST /api/submit. The phone sends the user's access token. Hidden tests are
// read, and submission rows are written, only inside recordSubmission.
import { recordSubmission } from "@/lib/judge";
import { getUserFromRequest } from "@/lib/supabase-admin";
import { StatusError } from "expo-server";

export async function POST(request: Request) {
    const user = await getUserFromRequest(request);
    if (!user) throw new StatusError(401, "Unauthorized");

    const { problemId, language, sourceCode } = (await request.json()) as {
        problemId?: unknown;
        language?: unknown;
        sourceCode?: unknown;
    };

    return Response.json(
        await recordSubmission({
            userId: user.id,
            problemId,
            language,
            sourceCode,
        }),
    );
}
