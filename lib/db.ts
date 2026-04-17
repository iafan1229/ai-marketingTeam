import { getHealthlogRepository } from "@/lib/repositories";
import { INSIGHT_TYPES, MEMORY_LIMITS } from "@/lib/repositories/memory";
import type { GeneratedDraft, PlannedIdea, PostResult } from "@/lib/types";
import type {
  DashboardQuery,
  DashboardSnapshot,
  DraftPreview,
  DraftQuery,
  DraftRecord,
  IdeaQuery,
  IdeaRecord,
  InsightPreview,
  InsightQuery,
  InsightType,
  MemoryInsight,
  PostResultQuery,
  PostResultRecord,
  PostResultSummary,
  RecentActivityItem,
  RepositorySnapshot,
} from "@/lib/repositories/contracts";

export const healthlogRepository = getHealthlogRepository();

export function saveIdeas(ideas: PlannedIdea[], sourceNotes = "") {
  return healthlogRepository.ideas.saveMany(ideas, { sourceNotes });
}

export function listIdeas(query: IdeaQuery = {}) {
  return healthlogRepository.ideas.list(query);
}

export function listIdeaRecords(query: IdeaQuery = {}) {
  return healthlogRepository.ideas.listRecords(query);
}

export function saveDrafts(drafts: GeneratedDraft[]) {
  return healthlogRepository.drafts.saveMany(drafts);
}

export function listDrafts(query: DraftQuery = {}) {
  return healthlogRepository.drafts.list(query);
}

export function listDraftRecords(query: DraftQuery = {}) {
  return healthlogRepository.drafts.listRecords(query);
}

export function listDraftPreviewsForDashboard(
  query: DraftQuery = {},
  previewLength?: number,
) {
  return healthlogRepository.drafts.listPreviews(query, previewLength);
}

export function savePostResult(result: PostResult) {
  return healthlogRepository.postResults.save(result);
}

export function listPostResults(query: PostResultQuery = {}) {
  return healthlogRepository.postResults.list(query);
}

export function listPostResultRecords(query: PostResultQuery = {}) {
  return healthlogRepository.postResults.listRecords(query);
}

export function listPostResultSummariesForDashboard(
  query: PostResultQuery = {},
  previewLength?: number,
) {
  return healthlogRepository.postResults.listSummaries(query, previewLength);
}

export function getPostResultEngagementSnapshot() {
  return healthlogRepository.postResults.summarize();
}

export function saveInsight(type: InsightType, content: string) {
  return healthlogRepository.insights.save(type, content);
}

export function listInsights(query: InsightQuery = {}) {
  return healthlogRepository.insights.list(query);
}

export function listInsightPreviewsForDashboard(
  query: InsightQuery = {},
  previewLength?: number,
) {
  return healthlogRepository.insights.listPreviews(query, previewLength);
}

export function getLatestInsightsByType(previewLength?: number) {
  return healthlogRepository.insights.latestByType(previewLength);
}

export function getDashboardSnapshot(query: DashboardQuery = {}) {
  return healthlogRepository.dashboard.getSnapshot(query);
}

export function getRepositorySnapshot(): RepositorySnapshot {
  return healthlogRepository.getSnapshot();
}

export function getMemoryStoreSnapshot(): RepositorySnapshot {
  return getRepositorySnapshot();
}

export { INSIGHT_TYPES, MEMORY_LIMITS };

export type {
  DashboardQuery,
  DashboardSnapshot,
  DraftPreview,
  DraftQuery,
  DraftRecord,
  IdeaQuery,
  IdeaRecord,
  InsightPreview,
  InsightQuery,
  InsightType,
  MemoryInsight,
  PostResultQuery,
  PostResultRecord,
  PostResultSummary,
  RecentActivityItem,
  RepositorySnapshot,
};
