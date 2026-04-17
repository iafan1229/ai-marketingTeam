import { NextResponse } from "next/server";
import { analystAgent } from "@/lib/agents/analyst";
import { listPostResults, saveInsight, savePostResult } from "@/lib/db";
import type { PostResult, PostResultInput } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<PostResultInput>;

  if (!body.text || !body.platform) {
    return NextResponse.json(
      { error: "text and platform are required" },
      { status: 400 },
    );
  }

  const result: PostResult = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    text: body.text,
    platform: body.platform,
    likes: Number(body.likes ?? 0),
    comments: Number(body.comments ?? 0),
    saves: Number(body.saves ?? 0),
    impressions: Number(body.impressions ?? 0),
    notes: body.notes?.trim() ?? "",
  };

  savePostResult(result);

  const summary = await analystAgent(listPostResults());
  saveInsight("hook", summary.bestHookPattern);
  saveInsight("weakness", summary.weakPattern);
  saveInsight("strategy", summary.nextStrategy);

  return NextResponse.json({ summary });
}

