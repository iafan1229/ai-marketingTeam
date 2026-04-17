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
  saveMany(ideas: PlannedIdea[], context?: IdeaWriteContext): IdeaRecord[];
  list(query?: IdeaQuery): PlannedIdea[];
  listRecords(query?: IdeaQuery): IdeaRecord[];
  count(): number;
}

export interface DraftRepository {
  saveMany(drafts: GeneratedDraft[]): DraftRecord[];
  list(query?: DraftQuery): GeneratedDraft[];
  listRecords(query?: DraftQuery): DraftRecord[];
  listPreviews(query?: DraftQuery, previewLength?: number): DraftPreview[];
  findLatestByIdea(ideaId: string): DraftRecord | null;
  count(): number;
}

export interface PostResultRepository {
  save(result: PostResult): PostResultRecord;
  list(query?: PostResultQuery): PostResult[];
  listRecords(query?: PostResultQuery): PostResultRecord[];
  listSummaries(
    query?: PostResultQuery,
    previewLength?: number,
  ): PostResultSummary[];
  summarize(): EngagementSnapshot;
  count(): number;
}

export interface InsightRepository {
  save(type: InsightType, content: string): MemoryInsight;
  list(query?: InsightQuery): MemoryInsight[];
  listPreviews(
    query?: InsightQuery,
    previewLength?: number,
  ): InsightPreview[];
  latestByType(previewLength?: number): Record<InsightType, InsightPreview | null>;
  count(): number;
}

export interface DashboardRepository {
  getSnapshot(query?: DashboardQuery): DashboardSnapshot;
  getRecentActivity(
    query?: Pick<DashboardQuery, "activityLimit" | "previewLength">,
  ): RecentActivityItem[];
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
  getSnapshot(): RepositorySnapshot;
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
