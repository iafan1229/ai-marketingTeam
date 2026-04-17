import { healthlogRepository } from "@/lib/db";
import { copywriterAgent } from "@/lib/agents/copywriter";
import {
  errorResponse,
  parseCopywriterInput,
  readJsonBody,
  successResponse,
} from "@/lib/agents/http";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const input = parseCopywriterInput(body);
    const drafts = await copywriterAgent(input);

    await healthlogRepository.drafts.saveMany(drafts);

    return successResponse(
      {
        idea: input.idea,
        drafts,
      },
      {
        draftCount: drafts.length,
        ideaId: input.idea.id,
        platform: "threads",
      },
      201,
    );
  } catch (error) {
    return errorResponse(error);
  }
}
