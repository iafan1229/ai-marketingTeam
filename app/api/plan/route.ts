import { NextResponse } from "next/server";
import { plannerAgent } from "@/lib/agents/planner";
import type { PlannerInput } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<PlannerInput>;
  const notes = body.notes?.trim() ?? "";

  const ideas = await plannerAgent({ notes });

  return NextResponse.json({ ideas });
}

