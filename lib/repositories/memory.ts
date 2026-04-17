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
      saveMany(
        ideas: PlannedIdea[],
        context: IdeaWriteContext = {},
      ): IdeaRecord[] {
        const createdAt = context.createdAt ?? new Date().toISOString();
        const records = ideas.map((idea) =>
          createIdeaRecord(idea, { ...context, createdAt }),
        );

        store.ideas = mergeNewestById(store.ideas, records, MEMORY_LIMITS.drafts);

        return cloneIdeaRecords(records);
      },
      list(query: IdeaQuery = {}): PlannedIdea[] {
        return filterIdeaRecords(store.ideas, query).map((record) =>
          toIdea(cloneIdeaRecord(record)),
        );
      },
      listRecords(query: IdeaQuery = {}): IdeaRecord[] {
        return cloneIdeaRecords(filterIdeaRecords(store.ideas, query));
      },
      count(): number {
        return store.ideas.length;
      },
    },
    drafts: {
      saveMany(drafts: GeneratedDraft[]): DraftRecord[] {
        const createdAt = new Date().toISOString();
        const records = drafts.map((draft) => createDraftRecord(draft, createdAt));

        store.drafts = mergeNewestById(store.drafts, records, MEMORY_LIMITS.drafts);

        return records.map(cloneDraftRecord);
      },
      list(query: DraftQuery = {}): GeneratedDraft[] {
        return filterDraftRecords(store.drafts, query).map((record) =>
          toDraft(cloneDraftRecord(record)),
        );
      },
      listRecords(query: DraftQuery = {}): DraftRecord[] {
        return filterDraftRecords(store.drafts, query).map(cloneDraftRecord);
      },
      listPreviews(
        query: DraftQuery = {},
        previewLength?: number,
      ): DraftPreview[] {
        return listDraftPreviews(store.drafts, query, previewLength);
      },
      findLatestByIdea(ideaId: string): DraftRecord | null {
        return (
          filterDraftRecords(store.drafts, { ideaId, limit: 1 }).map(
            cloneDraftRecord,
          )[0] ?? null
        );
      },
      count(): number {
        return store.drafts.length;
      },
    },
    postResults: {
      save(result: PostResult): PostResultRecord {
        const record = createPostResultRecord(result);

        store.postResults = mergeNewestById(
          store.postResults,
          [record],
          MEMORY_LIMITS.postResults,
        );

        return clonePostResultRecord(record);
      },
      list(query: PostResultQuery = {}): PostResult[] {
        return filterPostResultRecords(store.postResults, query).map((record) =>
          toPostResult(clonePostResultRecord(record)),
        );
      },
      listRecords(query: PostResultQuery = {}): PostResultRecord[] {
        return filterPostResultRecords(store.postResults, query).map(
          clonePostResultRecord,
        );
      },
      listSummaries(
        query: PostResultQuery = {},
        previewLength?: number,
      ): PostResultSummary[] {
        return listPostResultSummaries(store.postResults, query, previewLength);
      },
      summarize() {
        return summarizeEngagement(store.postResults);
      },
      count(): number {
        return store.postResults.length;
      },
    },
    insights: {
      save(type: InsightType, content: string): MemoryInsight {
        const record = createInsightRecord(type, content);

        store.insights = mergeNewestById(
          store.insights,
          [record],
          MEMORY_LIMITS.insights,
        );

        return cloneInsight(record);
      },
      list(query: InsightQuery = {}): MemoryInsight[] {
        return filterInsightRecords(store.insights, query).map(cloneInsight);
      },
      listPreviews(
        query: InsightQuery = {},
        previewLength?: number,
      ): InsightPreview[] {
        return listInsightPreviews(store.insights, query, previewLength);
      },
      latestByType(previewLength?: number) {
        return selectLatestInsightsByType(store.insights, previewLength);
      },
      count(): number {
        return store.insights.length;
      },
    },
    dashboard: {
      getSnapshot(query: DashboardQuery = {}): DashboardSnapshot {
        return buildDashboardSnapshot(store, query);
      },
      getRecentActivity(
        query: Pick<DashboardQuery, "activityLimit" | "previewLength"> = {},
      ): RecentActivityItem[] {
        return buildDashboardSnapshot(store, query).recentActivity;
      },
    },
    getSnapshot(): RepositorySnapshot {
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
