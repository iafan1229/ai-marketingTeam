import type { GeneratedDraft, PostResult } from "@/lib/types";
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

declare global {
  var __healthlogMockDb__: MemoryStore | undefined;
}

const store = globalThis.__healthlogMockDb__ ?? createMemoryStore();

if (!globalThis.__healthlogMockDb__) {
  globalThis.__healthlogMockDb__ = store;
}

const draftRepository = {
  saveMany(drafts: GeneratedDraft[]): DraftRecord[] {
    const createdAt = new Date().toISOString();
    const records = drafts.map((draft) => createDraftRecord(draft, createdAt));

    store.drafts = mergeNewestById(store.drafts, records, MEMORY_LIMITS.drafts);

    return filterDraftRecords(store.drafts, {}).map(cloneDraftRecord);
  },
  list(query: DraftQuery = {}): GeneratedDraft[] {
    return filterDraftRecords(store.drafts, query).map((record) =>
      toDraft(cloneDraftRecord(record)),
    );
  },
  listRecords(query: DraftQuery = {}): DraftRecord[] {
    return filterDraftRecords(store.drafts, query).map(cloneDraftRecord);
  },
  listPreviews(query: DraftQuery = {}, previewLength?: number): DraftPreview[] {
    return listDraftPreviews(store.drafts, query, previewLength);
  },
  findLatestByIdea(ideaId: string): DraftRecord | null {
    return filterDraftRecords(store.drafts, { ideaId, limit: 1 }).map(
      cloneDraftRecord,
    )[0] ?? null;
  },
  count(): number {
    return store.drafts.length;
  },
};

const postResultRepository = {
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
};

const insightRepository = {
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
};

export const healthlogRepository = {
  drafts: draftRepository,
  postResults: postResultRepository,
  insights: insightRepository,
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
  getSnapshot(): MemoryStore {
    return cloneStore(store);
  },
};

export function saveDrafts(drafts: GeneratedDraft[]) {
  draftRepository.saveMany(drafts);
}

export function listDrafts() {
  return draftRepository.list();
}

export function listDraftRecords(query: DraftQuery = {}) {
  return draftRepository.listRecords(query);
}

export function listDraftPreviewsForDashboard(
  query: DraftQuery = {},
  previewLength?: number,
) {
  return draftRepository.listPreviews(query, previewLength);
}

export function savePostResult(result: PostResult) {
  return postResultRepository.save(result);
}

export function listPostResults() {
  return postResultRepository.list();
}

export function listPostResultRecords(query: PostResultQuery = {}) {
  return postResultRepository.listRecords(query);
}

export function listPostResultSummariesForDashboard(
  query: PostResultQuery = {},
  previewLength?: number,
) {
  return postResultRepository.listSummaries(query, previewLength);
}

export function getPostResultEngagementSnapshot() {
  return postResultRepository.summarize();
}

export function saveInsight(type: InsightType, content: string) {
  return insightRepository.save(type, content);
}

export function listInsights() {
  return insightRepository.list();
}

export function listInsightPreviewsForDashboard(
  query: InsightQuery = {},
  previewLength?: number,
) {
  return insightRepository.listPreviews(query, previewLength);
}

export function getLatestInsightsByType(previewLength?: number) {
  return insightRepository.latestByType(previewLength);
}

export function getDashboardSnapshot(query: DashboardQuery = {}) {
  return healthlogRepository.dashboard.getSnapshot(query);
}

export function getMemoryStoreSnapshot() {
  return healthlogRepository.getSnapshot();
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
  MemoryStore,
  PostResultQuery,
  PostResultRecord,
  PostResultSummary,
  RecentActivityItem,
};
