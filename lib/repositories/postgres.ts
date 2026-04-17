import type { PoolClient } from "pg";
import type { GeneratedDraft, PlannedIdea, PostResult } from "@/lib/types";
import {
  INSIGHT_TYPES,
  buildDashboardSnapshot,
  createPostResultRecord,
  listDraftPreviews,
  listInsightPreviews,
  listPostResultSummaries,
  selectLatestInsightsByType,
  summarizeEngagement,
  toDraft,
  toPostResult,
  type DashboardQuery,
  type DashboardSnapshot,
  type DraftQuery,
  type DraftRecord,
  type InsightQuery,
  type InsightType,
  type MemoryInsight,
  type PostResultQuery,
  type PostResultRecord,
  type RecentActivityItem,
} from "@/lib/server/manual-loop-memory";
import { query, withTransaction } from "@/lib/postgres/client";
import type {
  HealthlogRepository,
  IdeaQuery,
  IdeaRecord,
  IdeaWriteContext,
  RepositorySnapshot,
} from "@/lib/repositories/contracts";

interface CountRow {
  count: string;
}

interface IdeaRow {
  id: string;
  source_notes: string;
  theme: string;
  goal: PlannedIdea["goal"];
  cta: string;
  angle: string;
  created_at: string;
}

interface DraftRow {
  id: string;
  idea_id: string;
  hook: string;
  body: string;
  cta: string;
  platform: GeneratedDraft["platform"];
  created_at: string;
}

interface PostResultRow {
  id: string;
  text: string;
  platform: string;
  likes: number;
  comments: number;
  saves: number;
  impressions: number;
  notes: string | null;
  created_at: string;
}

interface InsightRow {
  id: string;
  insight_type: InsightType;
  content: string;
  created_at: string;
}

function normalizeLimit(limit: number | undefined) {
  if (limit === undefined) {
    return undefined;
  }

  if (!Number.isFinite(limit)) {
    return undefined;
  }

  return Math.max(0, Math.floor(limit));
}

function appendWhereClause(
  clauses: string[],
  sql: string,
) {
  if (clauses.length === 0) {
    return sql;
  }

  return `${sql} where ${clauses.join(" and ")}`;
}

function appendLimit(
  sql: string,
  values: unknown[],
  limit: number | undefined,
) {
  if (limit === undefined) {
    return sql;
  }

  values.push(limit);
  return `${sql} limit $${values.length}`;
}

function mapIdeaRowToRecord(row: IdeaRow): IdeaRecord {
  return {
    id: row.id,
    sourceNotes: row.source_notes,
    theme: row.theme,
    goal: row.goal,
    cta: row.cta,
    angle: row.angle,
    createdAt: row.created_at,
  };
}

function mapDraftRowToRecord(row: DraftRow): DraftRecord {
  return {
    id: row.id,
    ideaId: row.idea_id,
    hook: row.hook,
    body: row.body,
    cta: row.cta,
    platform: row.platform,
    createdAt: row.created_at,
  };
}

function mapPostResultRowToResult(row: PostResultRow): PostResult {
  return {
    id: row.id,
    createdAt: row.created_at,
    text: row.text,
    platform: row.platform,
    likes: row.likes,
    comments: row.comments,
    saves: row.saves,
    impressions: row.impressions,
    notes: row.notes ?? "",
  };
}

function mapPostResultRowToRecord(row: PostResultRow): PostResultRecord {
  return createPostResultRecord(mapPostResultRowToResult(row));
}

function mapInsightRowToRecord(row: InsightRow): MemoryInsight {
  return {
    id: row.id,
    type: row.insight_type,
    content: row.content,
    createdAt: row.created_at,
  };
}

async function countRows(tableName: string) {
  const result = await query<CountRow>(
    `select count(*)::text as count from ${tableName}`,
  );

  return Number(result.rows[0]?.count ?? "0");
}

async function listIdeaRecords(queryOptions: IdeaQuery = {}) {
  const values: unknown[] = [];
  const clauses: string[] = [];

  if (queryOptions.goal) {
    values.push(queryOptions.goal);
    clauses.push(`goal = $${values.length}`);
  }

  let sql = appendWhereClause(
    clauses,
    `
      select id, source_notes, theme, goal, cta, angle, created_at
      from content_ideas
    `,
  );

  sql += " order by created_at desc";
  sql = appendLimit(sql, values, normalizeLimit(queryOptions.limit));

  const result = await query<IdeaRow>(sql, values);
  return result.rows.map(mapIdeaRowToRecord);
}

async function listDraftRecordRows(queryOptions: DraftQuery = {}) {
  const values: unknown[] = [];
  const clauses: string[] = [];

  if (queryOptions.ideaId) {
    values.push(queryOptions.ideaId);
    clauses.push(`idea_id = $${values.length}`);
  }

  let sql = appendWhereClause(
    clauses,
    `
      select id, idea_id, hook, body, cta, platform, created_at
      from content_drafts
    `,
  );

  sql += " order by created_at desc";
  sql = appendLimit(sql, values, normalizeLimit(queryOptions.limit));

  const result = await query<DraftRow>(sql, values);
  return result.rows.map(mapDraftRowToRecord);
}

async function listPostResultRecordRows(queryOptions: PostResultQuery = {}) {
  const values: unknown[] = [];
  const clauses: string[] = [];

  if (queryOptions.platform) {
    values.push(queryOptions.platform);
    clauses.push(`platform = $${values.length}`);
  }

  let sql = appendWhereClause(
    clauses,
    `
      select id, text, platform, likes, comments, saves, impressions, notes, created_at
      from post_results
    `,
  );

  sql += " order by created_at desc";
  sql = appendLimit(sql, values, normalizeLimit(queryOptions.limit));

  const result = await query<PostResultRow>(sql, values);
  return result.rows.map(mapPostResultRowToRecord);
}

async function listInsightRecordRows(queryOptions: InsightQuery = {}) {
  const values: unknown[] = [];
  const clauses: string[] = [];

  if (queryOptions.type) {
    values.push(queryOptions.type);
    clauses.push(`insight_type = $${values.length}`);
  }

  let sql = appendWhereClause(
    clauses,
    `
      select id, insight_type, content, created_at
      from memory_insights
    `,
  );

  sql += " order by created_at desc";
  sql = appendLimit(sql, values, normalizeLimit(queryOptions.limit));

  const result = await query<InsightRow>(sql, values);
  return result.rows.map(mapInsightRowToRecord);
}

async function insertIdea(
  client: PoolClient,
  idea: PlannedIdea,
  context: IdeaWriteContext,
  createdAt: string,
) {
  const result = await client.query<IdeaRow>(
    `
      insert into content_ideas (
        id,
        source_notes,
        theme,
        goal,
        cta,
        angle,
        created_at
      )
      values ($1, $2, $3, $4, $5, $6, $7)
      on conflict (id) do update
      set
        source_notes = excluded.source_notes,
        theme = excluded.theme,
        goal = excluded.goal,
        cta = excluded.cta,
        angle = excluded.angle,
        created_at = excluded.created_at
      returning id, source_notes, theme, goal, cta, angle, created_at
    `,
    [
      idea.id,
      context.sourceNotes?.trim() ?? "",
      idea.theme,
      idea.goal,
      idea.cta,
      idea.angle,
      createdAt,
    ],
  );

  return mapIdeaRowToRecord(result.rows[0]);
}

async function insertDraft(
  client: PoolClient,
  draft: GeneratedDraft,
  createdAt: string,
) {
  const result = await client.query<DraftRow>(
    `
      insert into content_drafts (
        id,
        idea_id,
        platform,
        hook,
        body,
        cta,
        status,
        created_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8)
      on conflict (id) do update
      set
        idea_id = excluded.idea_id,
        platform = excluded.platform,
        hook = excluded.hook,
        body = excluded.body,
        cta = excluded.cta,
        status = excluded.status,
        created_at = excluded.created_at
      returning id, idea_id, hook, body, cta, platform, created_at
    `,
    [
      draft.id,
      draft.ideaId,
      draft.platform,
      draft.hook,
      draft.body,
      draft.cta,
      "generated",
      createdAt,
    ],
  );

  return mapDraftRowToRecord(result.rows[0]);
}

async function insertPostResult(client: PoolClient, result: PostResult) {
  const normalized = createPostResultRecord(result);
  const queryResult = await client.query<PostResultRow>(
    `
      insert into post_results (
        id,
        draft_id,
        platform,
        text,
        likes,
        comments,
        saves,
        impressions,
        notes,
        posted_at,
        created_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      on conflict (id) do update
      set
        draft_id = excluded.draft_id,
        platform = excluded.platform,
        text = excluded.text,
        likes = excluded.likes,
        comments = excluded.comments,
        saves = excluded.saves,
        impressions = excluded.impressions,
        notes = excluded.notes,
        posted_at = excluded.posted_at,
        created_at = excluded.created_at
      returning id, text, platform, likes, comments, saves, impressions, notes, created_at
    `,
    [
      normalized.id,
      null,
      normalized.platform,
      normalized.text,
      normalized.likes,
      normalized.comments,
      normalized.saves,
      normalized.impressions,
      normalized.notes ?? "",
      null,
      normalized.createdAt,
    ],
  );

  return mapPostResultRowToRecord(queryResult.rows[0]);
}

async function insertInsight(
  client: PoolClient,
  type: InsightType,
  content: string,
) {
  const createdAt = new Date().toISOString();
  const id = crypto.randomUUID();
  const queryResult = await client.query<InsightRow>(
    `
      insert into memory_insights (
        id,
        insight_type,
        content,
        confidence,
        created_at
      )
      values ($1, $2, $3, $4, $5)
      returning id, insight_type, content, created_at
    `,
    [id, type, content.trim(), null, createdAt],
  );

  return mapInsightRowToRecord(queryResult.rows[0]);
}

export function createPostgresHealthlogRepository(): HealthlogRepository {
  return {
    ideas: {
      async saveMany(
        ideas: PlannedIdea[],
        context: IdeaWriteContext = {},
      ): Promise<IdeaRecord[]> {
        const createdAt = context.createdAt ?? new Date().toISOString();

        return withTransaction(async (client) => {
          const inserted: IdeaRecord[] = [];

          for (const idea of ideas) {
            inserted.push(await insertIdea(client, idea, context, createdAt));
          }

          return inserted;
        });
      },
      async list(queryOptions: IdeaQuery = {}) {
        const records = await listIdeaRecords(queryOptions);
        return records.map(({ sourceNotes, createdAt, ...idea }) => {
          void sourceNotes;
          void createdAt;
          return idea;
        });
      },
      async listRecords(queryOptions: IdeaQuery = {}) {
        return listIdeaRecords(queryOptions);
      },
      async count() {
        return countRows("content_ideas");
      },
    },
    drafts: {
      async saveMany(drafts: GeneratedDraft[]) {
        const createdAt = new Date().toISOString();

        return withTransaction(async (client) => {
          const inserted: DraftRecord[] = [];

          for (const draft of drafts) {
            inserted.push(await insertDraft(client, draft, createdAt));
          }

          return inserted;
        });
      },
      async list(queryOptions: DraftQuery = {}) {
        const records = await listDraftRecordRows(queryOptions);
        return records.map((record) => toDraft({ ...record }));
      },
      async listRecords(queryOptions: DraftQuery = {}) {
        return listDraftRecordRows(queryOptions);
      },
      async listPreviews(queryOptions: DraftQuery = {}, previewLength?: number) {
        const records = await listDraftRecordRows(queryOptions);
        return listDraftPreviews(records, queryOptions, previewLength);
      },
      async findLatestByIdea(ideaId: string) {
        const records = await listDraftRecordRows({ ideaId, limit: 1 });
        return records[0] ?? null;
      },
      async count() {
        return countRows("content_drafts");
      },
    },
    postResults: {
      async save(result: PostResult) {
        return withTransaction(async (client) => insertPostResult(client, result));
      },
      async list(queryOptions: PostResultQuery = {}) {
        const records = await listPostResultRecordRows(queryOptions);
        return records.map((record) => toPostResult({ ...record }));
      },
      async listRecords(queryOptions: PostResultQuery = {}) {
        return listPostResultRecordRows(queryOptions);
      },
      async listSummaries(
        queryOptions: PostResultQuery = {},
        previewLength?: number,
      ) {
        const records = await listPostResultRecordRows(queryOptions);
        return listPostResultSummaries(records, queryOptions, previewLength);
      },
      async summarize() {
        const records = await listPostResultRecordRows();
        return summarizeEngagement(records);
      },
      async count() {
        return countRows("post_results");
      },
    },
    insights: {
      async save(type: InsightType, content: string) {
        return withTransaction(async (client) => insertInsight(client, type, content));
      },
      async list(queryOptions: InsightQuery = {}) {
        return listInsightRecordRows(queryOptions);
      },
      async listPreviews(queryOptions: InsightQuery = {}, previewLength?: number) {
        const records = await listInsightRecordRows(queryOptions);
        return listInsightPreviews(records, queryOptions, previewLength);
      },
      async latestByType(previewLength?: number) {
        const records = await listInsightRecordRows();
        return selectLatestInsightsByType(records, previewLength);
      },
      async count() {
        return countRows("memory_insights");
      },
    },
    dashboard: {
      async getSnapshot(queryOptions: DashboardQuery = {}): Promise<DashboardSnapshot> {
        const [drafts, postResults, insights] = await Promise.all([
          listDraftRecordRows(),
          listPostResultRecordRows(),
          listInsightRecordRows(),
        ]);

        return buildDashboardSnapshot(
          {
            drafts,
            postResults,
            insights,
          },
          queryOptions,
        );
      },
      async getRecentActivity(
        queryOptions: Pick<DashboardQuery, "activityLimit" | "previewLength"> = {},
      ): Promise<RecentActivityItem[]> {
        return (await this.getSnapshot(queryOptions)).recentActivity;
      },
    },
    async getSnapshot(): Promise<RepositorySnapshot> {
      const [ideas, drafts, postResults, insights] = await Promise.all([
        listIdeaRecords(),
        listDraftRecordRows(),
        listPostResultRecordRows(),
        listInsightRecordRows(),
      ]);

      return {
        ideas,
        drafts,
        postResults,
        insights,
      };
    },
  };
}

export { INSIGHT_TYPES };
