import { plannerAgent } from "@/lib/agents/planner";
import { healthlogRepository } from "@/lib/db";
import {
  countMeaningfulLines,
  errorResponse,
  parsePlannerInput,
  readJsonBody,
  successResponse,
} from "@/lib/agents/http";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const input = parsePlannerInput(body);
    const ideas = await plannerAgent(input);
    const sourceLineCount = countMeaningfulLines(input.notes);

    await healthlogRepository.ideas.saveMany(ideas, { sourceNotes: input.notes });

    return successResponse(
      { ideas },
      {
        ideaCount: ideas.length,
        sourceLineCount,
        usedFallbackNotes: sourceLineCount === 0,
      },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
