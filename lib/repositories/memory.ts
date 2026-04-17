import type { GeneratedDraft, PlannedIdea, PostResult } from "@/lib/types";
import {
  INSIGHT_TYPES,
  MEMORY_LIMITS,
  buildDashboardSnapshot,
  cloneDraftRecord,
  cloneInsight,
  clonePostResultRecord,
  cloneStore,
  createDraftRecord,
  createInsightRecord,
  createMemoryStore,
  createPostResultRecord,
  filterDraftRecords,
  filterInsightRecords,
  filterPostResultRecords,
  listDraftPreviews,
  listInsightPreviews,
  listPostResultSummaries,
  mergeNewestById,
  selectLatestInsightsByType,
  summarizeEngagement,
  toDraft,
  toPostResult,
  type DashboardQuery,
  type DashboardSnapshot,
  type DraftPreview,
  type DraftQuery,
  type DraftRecord,
  type InsightPreview,
  type InsightQuery,
  type InsightType,
  type MemoryInsight,
  type MemoryStore,
  type PostResultQuery,
  type PostResultRecord,
  type PostResultSummary,
  type RecentActivityItem,
} from "@/lib/server/manual-loop-memory";
import type {
  HealthlogRepository,
  IdeaQuery,
  IdeaRecord,
  IdeaWriteContext,
  RepositorySnapshot,
} from "@/lib/repositories/contracts";

interface MemoryRepositoryStore extends MemoryStore {
  ideas: IdeaRecord[];
}

declare global {
  var __healthlogMemoryRepositoryStore__: MemoryRepositoryStore | undefined;
}

function createMemoryRepositoryStore(): MemoryRepositoryStore {
  return {
    ideas: [],
    ...createMemoryStore(),
  };
}

function getMemoryRepositoryStore(): MemoryRepositoryStore {
  const store =
    globalThis.__healthlogMemoryRepositoryStore__ ?? createMemoryRepositoryStore();

  if (!globalThis.__healthlogMemoryRepositoryStore__) {
    globalThis.__healthlogMemoryRepositoryStore__ = store;
  }

  return store;
}

function normalizeLimit(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.floor(value));
}

function createIdeaRecord(
  idea: PlannedIdea,
  context: IdeaWriteContext = {},
): IdeaRecord {
  return {
    ...idea,
    sourceNotes: context.sourceNotes?.trim() ?? "",
    createdAt: context.createdAt ?? new Date().toISOString(),
  };
}

function cloneIdeaRecord(record: IdeaRecord): IdeaRecord {
  return { ...record };
}

function cloneIdeaRecords(records: IdeaRecord[]): IdeaRecord[] {
  return records.map(cloneIdeaRecord);
}

function toIdea(record: IdeaRecord): PlannedIdea {
  const { sourceNotes, createdAt, ...idea } = record;
  void sourceNotes;
  void createdAt;
  return idea;
}

function filterIdeaRecords(
  records: IdeaRecord[],
  query: IdeaQuery = {},
): IdeaRecord[] {
  const filtered = query.goal
    ? records.filter((record) => record.goal === query.goal)
    : records;

  return filtered.slice(0, normalizeLimit(query.limit, filtered.length));
}

export function createMemoryHealthlogRepository(): HealthlogRepository {
  const store = getMemoryRepositoryStore();

  return {
    ideas: {
      async saveMany(
        ideas: PlannedIdea[],
        context: IdeaWriteContext = {},
      ): Promise<IdeaRecord[]> {
        const createdAt = context.createdAt ?? new Date().toISOString();
        const records = ideas.map((idea) =>
          createIdeaRecord(idea, { ...context, createdAt }),
        );

        store.ideas = mergeNewestById(store.ideas, records, MEMORY_LIMITS.drafts);

        return cloneIdeaRecords(records);
      },
      async list(query: IdeaQuery = {}): Promise<PlannedIdea[]> {
        return filterIdeaRecords(store.ideas, query).map((record) =>
          toIdea(cloneIdeaRecord(record)),
        );
      },
      async listRecords(query: IdeaQuery = {}): Promise<IdeaRecord[]> {
        return cloneIdeaRecords(filterIdeaRecords(store.ideas, query));
      },
      async count(): Promise<number> {
        return store.ideas.length;
      },
    },
    drafts: {
      async saveMany(drafts: GeneratedDraft[]): Promise<DraftRecord[]> {
        const createdAt = new Date().toISOString();
        const records = drafts.map((draft) => createDraftRecord(draft, createdAt));

        store.drafts = mergeNewestById(store.drafts, records, MEMORY_LIMITS.drafts);

        return records.map(cloneDraftRecord);
      },
      async list(query: DraftQuery = {}): Promise<GeneratedDraft[]> {
        return filterDraftRecords(store.drafts, query).map((record) =>
          toDraft(cloneDraftRecord(record)),
        );
      },
      async listRecords(query: DraftQuery = {}): Promise<DraftRecord[]> {
        return filterDraftRecords(store.drafts, query).map(cloneDraftRecord);
      },
      async listPreviews(
        query: DraftQuery = {},
        previewLength?: number,
      ): Promise<DraftPreview[]> {
        return listDraftPreviews(store.drafts, query, previewLength);
      },
      async findLatestByIdea(ideaId: string): Promise<DraftRecord | null> {
        return (
          filterDraftRecords(store.drafts, { ideaId, limit: 1 }).map(
            cloneDraftRecord,
          )[0] ?? null
        );
      },
      async count(): Promise<number> {
        return store.drafts.length;
      },
    },
    postResults: {
      async save(result: PostResult): Promise<PostResultRecord> {
        const record = createPostResultRecord(result);

        store.postResults = mergeNewestById(
          store.postResults,
          [record],
          MEMORY_LIMITS.postResults,
        );

        return clonePostResultRecord(record);
      },
      async list(query: PostResultQuery = {}): Promise<PostResult[]> {
        return filterPostResultRecords(store.postResults, query).map((record) =>
          toPostResult(clonePostResultRecord(record)),
        );
      },
      async listRecords(query: PostResultQuery = {}): Promise<PostResultRecord[]> {
        return filterPostResultRecords(store.postResults, query).map(
          clonePostResultRecord,
        );
      },
      async listSummaries(
        query: PostResultQuery = {},
        previewLength?: number,
      ): Promise<PostResultSummary[]> {
        return listPostResultSummaries(store.postResults, query, previewLength);
      },
      async summarize(): Promise<ReturnType<typeof summarizeEngagement>> {
        return summarizeEngagement(store.postResults);
      },
      async count(): Promise<number> {
        return store.postResults.length;
      },
    },
    insights: {
      async save(type: InsightType, content: string): Promise<MemoryInsight> {
        const record = createInsightRecord(type, content);

        store.insights = mergeNewestById(
          store.insights,
          [record],
          MEMORY_LIMITS.insights,
        );

        return cloneInsight(record);
      },
      async list(query: InsightQuery = {}): Promise<MemoryInsight[]> {
        return filterInsightRecords(store.insights, query).map(cloneInsight);
      },
      async listPreviews(
        query: InsightQuery = {},
        previewLength?: number,
      ): Promise<InsightPreview[]> {
        return listInsightPreviews(store.insights, query, previewLength);
      },
      async latestByType(previewLength?: number) {
        return selectLatestInsightsByType(store.insights, previewLength);
      },
      async count(): Promise<number> {
        return store.insights.length;
      },
    },
    dashboard: {
      async getSnapshot(query: DashboardQuery = {}): Promise<DashboardSnapshot> {
        return buildDashboardSnapshot(store, query);
      },
      async getRecentActivity(
        query: Pick<DashboardQuery, "activityLimit" | "previewLength"> = {},
      ): Promise<RecentActivityItem[]> {
        return buildDashboardSnapshot(store, query).recentActivity;
      },
    },
    async getSnapshot(): Promise<RepositorySnapshot> {
      return {
        ideas: cloneIdeaRecords(store.ideas),
        ...cloneStore(store),
      };
    },
  };
}

export { INSIGHT_TYPES, MEMORY_LIMITS };

export type {
  DashboardQuery,
  DashboardSnapshot,
  DraftPreview,
  DraftQuery,
  DraftRecord,
  InsightPreview,
  InsightQuery,
  InsightType,
  MemoryInsight,
  PostResultQuery,
  PostResultRecord,
  PostResultSummary,
  RecentActivityItem,
};
