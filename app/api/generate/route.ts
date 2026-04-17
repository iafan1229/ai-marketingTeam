import { NextResponse } from "next/server";
import { copywriterAgent } from "@/lib/agents/copywriter";
import { saveDrafts } from "@/lib/db";
import type { CopywriterInput } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<CopywriterInput>;

  if (!body.idea) {
    return NextResponse.json(
      { error: "idea is required" },
      { status: 400 },
    );
  }

  const drafts = await copywriterAgent({ idea: body.idea });
  saveDrafts(drafts);

  return NextResponse.json({ drafts });
}

