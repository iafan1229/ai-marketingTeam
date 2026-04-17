import type { GeneratedDraft, PostResult } from "@/lib/types";

export const MEMORY_LIMITS = {
  drafts: 50,
  postResults: 100,
  insights: 50,
} as const;

export const INSIGHT_TYPES = ["hook", "weakness", "strategy"] as const;

const DEFAULT_PREVIEW_LENGTH = 140;
const DEFAULT_RECENT_LIMIT = 5;
const DEFAULT_ACTIVITY_LIMIT = 10;

export type InsightType = (typeof INSIGHT_TYPES)[number];

export interface MemoryInsight {
  id: string;
  type: InsightType;
  content: string;
  createdAt: string;
}

export interface DraftRecord extends GeneratedDraft {
  createdAt: string;
}

export interface PostResultRecord extends PostResult {
  totalEngagement: number;
  engagementRate: number;
}

export interface MemoryStore {
  drafts: DraftRecord[];
  postResults: PostResultRecord[];
  insights: MemoryInsight[];
}

export interface DraftQuery {
  ideaId?: string;
  limit?: number;
}

export interface PostResultQuery {
  limit?: number;
  platform?: string;
}

export interface InsightQuery {
  limit?: number;
  type?: InsightType;
}

export interface DraftPreview {
  id: string;
  ideaId: string;
  hook: string;
  platform: GeneratedDraft["platform"];
  cta: string;
  preview: string;
  createdAt: string;
}

export interface PostResultSummary {
  id: string;
  platform: string;
  textPreview: string;
  notesPreview: string;
  likes: number;
  comments: number;
  saves: number;
  impressions: number;
  totalEngagement: number;
  engagementRate: number;
  createdAt: string;
}

export interface InsightPreview {
  id: string;
  type: InsightType;
  content: string;
  preview: string;
  createdAt: string;
}

export interface EngagementSnapshot {
  totalLikes: number;
  totalComments: number;
  totalSaves: number;
  totalImpressions: number;
  totalEngagement: number;
  averageLikes: number;
  averageComments: number;
  averageSaves: number;
  averageImpressions: number;
  averageEngagementRate: number;
}

export interface RecentActivityItem {
  id: string;
  kind: "draft" | "postResult" | "insight";
  createdAt: string;
  title: string;
  preview: string;
}

export interface DashboardQuery {
  recentDraftLimit?: number;
  recentPostResultLimit?: number;
  recentInsightLimit?: number;
  activityLimit?: number;
  previewLength?: number;
}

export interface DashboardSnapshot {
  hasData: boolean;
  counts: {
    drafts: number;
    postResults: number;
    insights: number;
  };
  insightCountsByType: Record<InsightType, number>;
  engagement: EngagementSnapshot;
  latestDraft: DraftPreview | null;
  topPerformingResult: PostResultSummary | null;
  recentDrafts: DraftPreview[];
  recentPostResults: PostResultSummary[];
  recentInsights: InsightPreview[];
  latestInsightsByType: Record<InsightType, InsightPreview | null>;
  recentActivity: RecentActivityItem[];
}

export function createMemoryStore(): MemoryStore {
  return {
    drafts: [],
    postResults: [],
    insights: [],
  };
}

export function createDraftRecord(
  draft: GeneratedDraft,
  createdAt = new Date().toISOString(),
): DraftRecord {
  return {
    ...draft,
    createdAt,
  };
}

export function createPostResultRecord(result: PostResult): PostResultRecord {
  const likes = sanitizeMetric(result.likes);
  const comments = sanitizeMetric(result.comments);
  const saves = sanitizeMetric(result.saves);
  const impressions = sanitizeMetric(result.impressions);
  const totalEngagement = likes + comments + saves;
  const engagementRate =
    impressions > 0 ? roundTo((totalEngagement / impressions) * 100) : 0;

  return {
    ...result,
    text: result.text.trim(),
    notes: result.notes?.trim() ?? "",
    likes,
    comments,
    saves,
    impressions,
    totalEngagement,
    engagementRate,
  };
}

export function createInsightRecord(
  type: InsightType,
  content: string,
  createdAt = new Date().toISOString(),
): MemoryInsight {
  return {
    id: crypto.randomUUID(),
    type,
    content: content.trim(),
    createdAt,
  };
}

export function mergeNewestById<T extends { id: string }>(
  current: T[],
  incoming: T[],
  limit: number,
): T[] {
  const merged: T[] = [];
  const seen = new Set<string>();

  for (const item of [...incoming, ...current]) {
    if (seen.has(item.id)) {
      continue;
    }

    seen.add(item.id);
    merged.push(item);
  }

  return merged.slice(0, normalizeLimit(limit, limit));
}

export function cloneDraftRecord(record: DraftRecord): DraftRecord {
  return { ...record };
}

export function clonePostResultRecord(
  record: PostResultRecord,
): PostResultRecord {
  return { ...record };
}

export function cloneInsight(record: MemoryInsight): MemoryInsight {
  return { ...record };
}

export function cloneStore(store: MemoryStore): MemoryStore {
  return {
    drafts: store.drafts.map(cloneDraftRecord),
    postResults: store.postResults.map(clonePostResultRecord),
    insights: store.insights.map(cloneInsight),
  };
}

export function toDraft(record: DraftRecord): GeneratedDraft {
  const { createdAt, ...draft } = record;
  void createdAt;
  return draft;
}

export function toPostResult(record: PostResultRecord): PostResult {
  const { totalEngagement, engagementRate, ...result } = record;
  void totalEngagement;
  void engagementRate;
  return result;
}

export function filterDraftRecords(
  records: DraftRecord[],
  query: DraftQuery = {},
): DraftRecord[] {
  const filtered = query.ideaId
    ? records.filter((record) => record.ideaId === query.ideaId)
    : records;

  return filtered.slice(0, normalizeLimit(query.limit, filtered.length));
}

export function filterPostResultRecords(
  records: PostResultRecord[],
  query: PostResultQuery = {},
): PostResultRecord[] {
  const filtered = query.platform
    ? records.filter((record) => record.platform === query.platform)
    : records;

  return filtered.slice(0, normalizeLimit(query.limit, filtered.length));
}

export function filterInsightRecords(
  records: MemoryInsight[],
  query: InsightQuery = {},
): MemoryInsight[] {
  const filtered = query.type
    ? records.filter((record) => record.type === query.type)
    : records;

  return filtered.slice(0, normalizeLimit(query.limit, filtered.length));
}

export function buildDraftPreview(
  record: DraftRecord,
  previewLength = DEFAULT_PREVIEW_LENGTH,
): DraftPreview {
  return {
    id: record.id,
    ideaId: record.ideaId,
    hook: record.hook,
    platform: record.platform,
    cta: record.cta,
    preview: createTextPreview(record.body, previewLength),
    createdAt: record.createdAt,
  };
}

export function buildPostResultSummary(
  record: PostResultRecord,
  previewLength = DEFAULT_PREVIEW_LENGTH,
): PostResultSummary {
  return {
    id: record.id,
    platform: record.platform,
    textPreview: createTextPreview(record.text, previewLength),
    notesPreview: createTextPreview(record.notes ?? "", previewLength),
    likes: record.likes,
    comments: record.comments,
    saves: record.saves,
    impressions: record.impressions,
    totalEngagement: record.totalEngagement,
    engagementRate: record.engagementRate,
    createdAt: record.createdAt,
  };
}

export function buildInsightPreview(
  record: MemoryInsight,
  previewLength = DEFAULT_PREVIEW_LENGTH,
): InsightPreview {
  return {
    id: record.id,
    type: record.type,
    content: record.content,
    preview: createTextPreview(record.content, previewLength),
    createdAt: record.createdAt,
  };
}

export function summarizeEngagement(
  records: PostResultRecord[],
): EngagementSnapshot {
  if (records.length === 0) {
    return {
      totalLikes: 0,
      totalComments: 0,
      totalSaves: 0,
      totalImpressions: 0,
      totalEngagement: 0,
      averageLikes: 0,
      averageComments: 0,
      averageSaves: 0,
      averageImpressions: 0,
      averageEngagementRate: 0,
    };
  }

  const totalLikes = sum(records.map((record) => record.likes));
  const totalComments = sum(records.map((record) => record.comments));
  const totalSaves = sum(records.map((record) => record.saves));
  const totalImpressions = sum(records.map((record) => record.impressions));
  const totalEngagement = sum(
    records.map((record) => record.totalEngagement),
  );

  return {
    totalLikes,
    totalComments,
    totalSaves,
    totalImpressions,
    totalEngagement,
    averageLikes: roundTo(totalLikes / records.length),
    averageComments: roundTo(totalComments / records.length),
    averageSaves: roundTo(totalSaves / records.length),
    averageImpressions: roundTo(totalImpressions / records.length),
    averageEngagementRate: roundTo(
      sum(records.map((record) => record.engagementRate)) / records.length,
    ),
  };
}

export function countInsightsByType(
  insights: MemoryInsight[],
): Record<InsightType, number> {
  return {
    hook: insights.filter((insight) => insight.type === "hook").length,
    weakness: insights.filter((insight) => insight.type === "weakness").length,
    strategy: insights.filter((insight) => insight.type === "strategy").length,
  };
}

export function listDraftPreviews(
  drafts: DraftRecord[],
  query: DraftQuery = {},
  previewLength = DEFAULT_PREVIEW_LENGTH,
): DraftPreview[] {
  return filterDraftRecords(drafts, query).map((record) =>
    buildDraftPreview(record, previewLength),
  );
}

export function listPostResultSummaries(
  results: PostResultRecord[],
  query: PostResultQuery = {},
  previewLength = DEFAULT_PREVIEW_LENGTH,
): PostResultSummary[] {
  return filterPostResultRecords(results, query).map((record) =>
    buildPostResultSummary(record, previewLength),
  );
}

export function listInsightPreviews(
  insights: MemoryInsight[],
  query: InsightQuery = {},
  previewLength = DEFAULT_PREVIEW_LENGTH,
): InsightPreview[] {
  return filterInsightRecords(insights, query).map((record) =>
    buildInsightPreview(record, previewLength),
  );
}

export function selectLatestInsightsByType(
  insights: MemoryInsight[],
  previewLength = DEFAULT_PREVIEW_LENGTH,
): Record<InsightType, InsightPreview | null> {
  return {
    hook: buildLatestInsightPreview(insights, "hook", previewLength),
    weakness: buildLatestInsightPreview(insights, "weakness", previewLength),
    strategy: buildLatestInsightPreview(insights, "strategy", previewLength),
  };
}

export function buildRecentActivity(
  store: MemoryStore,
  limit = DEFAULT_ACTIVITY_LIMIT,
  previewLength = DEFAULT_PREVIEW_LENGTH,
): RecentActivityItem[] {
  const activity = [
    ...store.drafts.map((draft) => ({
      id: draft.id,
      kind: "draft" as const,
      createdAt: draft.createdAt,
      title: draft.hook,
      preview: createTextPreview(draft.body, previewLength),
    })),
    ...store.postResults.map((result) => ({
      id: result.id,
      kind: "postResult" as const,
      createdAt: result.createdAt,
      title: `${result.platform} result`,
      preview: createTextPreview(result.text, previewLength),
    })),
    ...store.insights.map((insight) => ({
      id: insight.id,
      kind: "insight" as const,
      createdAt: insight.createdAt,
      title: `${insight.type} insight`,
      preview: createTextPreview(insight.content, previewLength),
    })),
  ];

  return activity
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, normalizeLimit(limit, DEFAULT_ACTIVITY_LIMIT));
}

export function buildDashboardSnapshot(
  store: MemoryStore,
  query: DashboardQuery = {},
): DashboardSnapshot {
  const previewLength = normalizeLimit(
    query.previewLength,
    DEFAULT_PREVIEW_LENGTH,
  );
  const recentDrafts = listDraftPreviews(
    store.drafts,
    { limit: query.recentDraftLimit ?? DEFAULT_RECENT_LIMIT },
    previewLength,
  );
  const recentPostResults = listPostResultSummaries(
    store.postResults,
    { limit: query.recentPostResultLimit ?? DEFAULT_RECENT_LIMIT },
    previewLength,
  );
  const recentInsights = listInsightPreviews(
    store.insights,
    { limit: query.recentInsightLimit ?? DEFAULT_RECENT_LIMIT },
    previewLength,
  );
  const topPerformingResult = getTopPerformingResult(store.postResults);

  return {
    hasData:
      store.drafts.length > 0 ||
      store.postResults.length > 0 ||
      store.insights.length > 0,
    counts: {
      drafts: store.drafts.length,
      postResults: store.postResults.length,
      insights: store.insights.length,
    },
    insightCountsByType: countInsightsByType(store.insights),
    engagement: summarizeEngagement(store.postResults),
    latestDraft: recentDrafts[0] ?? null,
    topPerformingResult: topPerformingResult
      ? buildPostResultSummary(topPerformingResult, previewLength)
      : null,
    recentDrafts,
    recentPostResults,
    recentInsights,
    latestInsightsByType: selectLatestInsightsByType(
      store.insights,
      previewLength,
    ),
    recentActivity: buildRecentActivity(
      store,
      query.activityLimit ?? DEFAULT_ACTIVITY_LIMIT,
      previewLength,
    ),
  };
}

export function createTextPreview(
  value: string,
  maxLength = DEFAULT_PREVIEW_LENGTH,
): string {
  const normalized = normalizeText(value);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  if (maxLength <= 3) {
    return normalized.slice(0, maxLength);
  }

  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function buildLatestInsightPreview(
  insights: MemoryInsight[],
  type: InsightType,
  previewLength: number,
): InsightPreview | null {
  const latestInsight = insights.find((insight) => insight.type === type);

  return latestInsight ? buildInsightPreview(latestInsight, previewLength) : null;
}

function getTopPerformingResult(
  results: PostResultRecord[],
): PostResultRecord | null {
  if (results.length === 0) {
    return null;
  }

  return [...results].sort((left, right) => {
    if (right.totalEngagement !== left.totalEngagement) {
      return right.totalEngagement - left.totalEngagement;
    }

    if (right.engagementRate !== left.engagementRate) {
      return right.engagementRate - left.engagementRate;
    }

    return right.createdAt.localeCompare(left.createdAt);
  })[0] ?? null;
}

function sanitizeMetric(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value));
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeLimit(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.floor(value));
}

function roundTo(value: number, digits = 2): number {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
