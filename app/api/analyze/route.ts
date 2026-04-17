import { analystAgent } from "@/lib/agents/analyst";
import {
  errorResponse,
  parsePostResultInput,
  readJsonBody,
  successResponse,
} from "@/lib/agents/http";
import { listPostResults, saveInsight, savePostResult } from "@/lib/db";
import type { PostResult } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const input = parsePostResultInput(body);

    const result: PostResult = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      text: input.text,
      platform: input.platform,
      likes: input.likes,
      comments: input.comments,
      saves: input.saves,
      impressions: input.impressions,
      notes: input.notes,
    };

    savePostResult(result);

    const allResults = listPostResults();
    const summary = await analystAgent(allResults);

    saveInsight("hook", summary.bestHookPattern);
    saveInsight("weakness", summary.weakPattern);
    saveInsight("strategy", summary.nextStrategy);

    return successResponse(
      {
        recordedResult: result,
        summary,
      },
      {
        platform: result.platform,
        sampleSize: allResults.length,
        recordedAt: result.createdAt,
      },
      201,
    );
  } catch (error) {
    return errorResponse(error);
  }
}
