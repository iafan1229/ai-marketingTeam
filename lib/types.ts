export type ContentGoal =
  | "댓글 유도"
  | "공감 확보"
  | "업데이트 공유"
  | "설치 관심 유도";

export interface PlannerInput {
  notes: string;
}

export interface PlannedIdea {
  id: string;
  theme: string;
  goal: ContentGoal;
  cta: string;
  angle: string;
}

export interface CopywriterInput {
  idea: PlannedIdea;
}

export interface GeneratedDraft {
  id: string;
  ideaId: string;
  hook: string;
  body: string;
  cta: string;
  platform: "threads";
}

export interface PostResultInput {
  text: string;
  platform: string;
  likes: number;
  comments: number;
  saves: number;
  impressions: number;
  notes?: string;
}

export interface PostResult extends PostResultInput {
  id: string;
  createdAt: string;
}

export interface AnalysisSummary {
  bestHookPattern: string;
  weakPattern: string;
  nextStrategy: string;
  insightBullets: string[];
}

