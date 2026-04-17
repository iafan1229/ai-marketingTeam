import type { GeneratedDraft, PlannedIdea, PostResult } from "@/lib/types";
import type {
  DashboardQuery,
  DashboardSnapshot,
  DraftPreview,
  DraftQuery,
  DraftRecord,
  EngagementSnapshot,
  InsightPreview,
  InsightQuery,
  InsightType,
  MemoryInsight,
  PostResultQuery,
  PostResultRecord,
  PostResultSummary,
  RecentActivityItem,
} from "@/lib/server/manual-loop-memory";

export interface IdeaRecord extends PlannedIdea {
  sourceNotes: string;
  createdAt: string;
}

export interface IdeaQuery {
  goal?: PlannedIdea["goal"];
  limit?: number;
}

export interface IdeaWriteContext {
  sourceNotes?: string;
  createdAt?: string;
}

export interface IdeaRepository {
  saveMany(
    ideas: PlannedIdea[],
    context?: IdeaWriteContext,
  ): Promise<IdeaRecord[]>;
  list(query?: IdeaQuery): Promise<PlannedIdea[]>;
  listRecords(query?: IdeaQuery): Promise<IdeaRecord[]>;
  count(): Promise<number>;
}

export interface DraftRepository {
  saveMany(drafts: GeneratedDraft[]): Promise<DraftRecord[]>;
  list(query?: DraftQuery): Promise<GeneratedDraft[]>;
  listRecords(query?: DraftQuery): Promise<DraftRecord[]>;
  listPreviews(
    query?: DraftQuery,
    previewLength?: number,
  ): Promise<DraftPreview[]>;
  findLatestByIdea(ideaId: string): Promise<DraftRecord | null>;
  count(): Promise<number>;
}

export interface PostResultRepository {
  save(result: PostResult): Promise<PostResultRecord>;
  list(query?: PostResultQuery): Promise<PostResult[]>;
  listRecords(query?: PostResultQuery): Promise<PostResultRecord[]>;
  listSummaries(
    query?: PostResultQuery,
    previewLength?: number,
  ): Promise<PostResultSummary[]>;
  summarize(): Promise<EngagementSnapshot>;
  count(): Promise<number>;
}

export interface InsightRepository {
  save(type: InsightType, content: string): Promise<MemoryInsight>;
  list(query?: InsightQuery): Promise<MemoryInsight[]>;
  listPreviews(
    query?: InsightQuery,
    previewLength?: number,
  ): Promise<InsightPreview[]>;
  latestByType(
    previewLength?: number,
  ): Promise<Record<InsightType, InsightPreview | null>>;
  count(): Promise<number>;
}

export interface DashboardRepository {
  getSnapshot(query?: DashboardQuery): Promise<DashboardSnapshot>;
  getRecentActivity(
    query?: Pick<DashboardQuery, "activityLimit" | "previewLength">,
  ): Promise<RecentActivityItem[]>;
}

export interface RepositorySnapshot {
  ideas: IdeaRecord[];
  drafts: DraftRecord[];
  postResults: PostResultRecord[];
  insights: MemoryInsight[];
}

export interface HealthlogRepository {
  ideas: IdeaRepository;
  drafts: DraftRepository;
  postResults: PostResultRepository;
  insights: InsightRepository;
  dashboard: DashboardRepository;
  getSnapshot(): Promise<RepositorySnapshot>;
}

export type {
  DashboardQuery,
  DashboardSnapshot,
  DraftPreview,
  DraftQuery,
  DraftRecord,
  EngagementSnapshot,
  InsightPreview,
  InsightQuery,
  InsightType,
  MemoryInsight,
  PostResultQuery,
  PostResultRecord,
  PostResultSummary,
  RecentActivityItem,
} from "@/lib/server/manual-loop-memory";
