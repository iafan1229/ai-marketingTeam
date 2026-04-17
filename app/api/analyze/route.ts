import { analystAgent } from "@/lib/agents/analyst";
import { healthlogRepository } from "@/lib/db";
import {
  errorResponse,
  parsePostResultInput,
  readJsonBody,
  successResponse,
} from "@/lib/agents/http";
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

    healthlogRepository.postResults.save(result);

    const allResults = healthlogRepository.postResults.list();
    const summary = await analystAgent(allResults);

    healthlogRepository.insights.save("hook", summary.bestHookPattern);
    healthlogRepository.insights.save("weakness", summary.weakPattern);
    healthlogRepository.insights.save("strategy", summary.nextStrategy);

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
