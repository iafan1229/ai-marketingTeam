import { NextResponse } from "next/server";
import type {
  ContentGoal,
  CopywriterInput,
  PlannerInput,
  PlannedIdea,
  PostResultInput,
} from "@/lib/types";

interface ValidationIssue {
  field: string;
  message: string;
}

type JsonRecord = Record<string, unknown>;

const CONTENT_GOALS: ContentGoal[] = [
  "댓글 유도",
  "공감 확보",
  "업데이트 공유",
  "설치 관심 유도",
];

const ANALYSIS_PLATFORMS = ["threads", "instagram", "x"] as const;

const DEFAULT_HEADERS = {
  "Cache-Control": "no-store",
  "X-HealthLog-Mock": "true",
};

class ApiRouteError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ValidationIssue[];

  constructor(
    status: number,
    code: string,
    message: string,
    details: ValidationIssue[] = [],
  ) {
    super(message);
    this.name = "ApiRouteError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiRouteError(
      400,
      "INVALID_JSON",
      "Request body must be valid JSON.",
    );
  }
}

export function countMeaningfulLines(input: string) {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean).length;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(
  value: unknown,
  field: string,
  issues: ValidationIssue[],
  options: {
    required?: boolean;
    allowEmpty?: boolean;
    maxLength: number;
  },
) {
  if (value === undefined || value === null) {
    if (options.required) {
      issues.push({ field, message: "This field is required." });
    }

    return "";
  }

  if (typeof value !== "string") {
    issues.push({ field, message: "Expected a string." });
    return "";
  }

  const trimmed = value.trim();

  if (!options.allowEmpty && trimmed.length === 0) {
    issues.push({ field, message: "This field cannot be empty." });
  }

  if (trimmed.length > options.maxLength) {
    issues.push({
      field,
      message: `Must be ${options.maxLength} characters or fewer.`,
    });
  }

  return trimmed;
}

function getInteger(
  value: unknown,
  field: string,
  issues: ValidationIssue[],
  defaultValue = 0,
) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    issues.push({ field, message: "Expected a finite number." });
    return defaultValue;
  }

  if (!Number.isInteger(parsed)) {
    issues.push({ field, message: "Expected an integer." });
    return defaultValue;
  }

  if (parsed < 0) {
    issues.push({ field, message: "Must be zero or greater." });
    return defaultValue;
  }

  return parsed;
}

function ensureRecord(value: unknown, message = "Request body must be a JSON object.") {
  if (!isRecord(value)) {
    throw new ApiRouteError(400, "INVALID_REQUEST", message);
  }

  return value;
}

function throwIfIssues(issues: ValidationIssue[]) {
  if (issues.length > 0) {
    throw new ApiRouteError(
      400,
      "INVALID_REQUEST",
      "Request validation failed.",
      issues,
    );
  }
}

function parseGoal(
  value: unknown,
  field: string,
  issues: ValidationIssue[],
): ContentGoal {
  const goal = getString(value, field, issues, {
    required: true,
    allowEmpty: false,
    maxLength: 40,
  });

  if (!CONTENT_GOALS.includes(goal as ContentGoal)) {
    issues.push({
      field,
      message: `Expected one of: ${CONTENT_GOALS.join(", ")}.`,
    });
  }

  return goal as ContentGoal;
}

function parseIdea(value: unknown, field = "idea"): PlannedIdea {
  if (!isRecord(value)) {
    throw new ApiRouteError(400, "INVALID_REQUEST", "idea must be an object.", [
      { field, message: "Expected an object." },
    ]);
  }

  const issues: ValidationIssue[] = [];

  const idea: PlannedIdea = {
    id: getString(value.id, `${field}.id`, issues, {
      required: true,
      allowEmpty: false,
      maxLength: 120,
    }),
    theme: getString(value.theme, `${field}.theme`, issues, {
      required: true,
      allowEmpty: false,
      maxLength: 140,
    }),
    goal: parseGoal(value.goal, `${field}.goal`, issues),
    cta: getString(value.cta, `${field}.cta`, issues, {
      required: true,
      allowEmpty: false,
      maxLength: 200,
    }),
    angle: getString(value.angle, `${field}.angle`, issues, {
      required: true,
      allowEmpty: false,
      maxLength: 280,
    }),
  };

  throwIfIssues(issues);

  return idea;
}

export function parsePlannerInput(body: unknown): PlannerInput {
  const record = ensureRecord(body);
  const issues: ValidationIssue[] = [];

  const notes = getString(record.notes, "notes", issues, {
    required: true,
    allowEmpty: true,
    maxLength: 4000,
  });

  throwIfIssues(issues);

  return { notes };
}

export function parseCopywriterInput(body: unknown): CopywriterInput {
  const record = ensureRecord(body);

  return {
    idea: parseIdea(record.idea),
  };
}

export function parsePostResultInput(body: unknown): PostResultInput {
  const record = ensureRecord(body);
  const issues: ValidationIssue[] = [];

  const text = getString(record.text, "text", issues, {
    required: true,
    allowEmpty: false,
    maxLength: 5000,
  });

  const platform = getString(record.platform, "platform", issues, {
    required: true,
    allowEmpty: false,
    maxLength: 40,
  });

  if (
    platform.length > 0 &&
    !ANALYSIS_PLATFORMS.includes(
      platform as (typeof ANALYSIS_PLATFORMS)[number],
    )
  ) {
    issues.push({
      field: "platform",
      message: `Expected one of: ${ANALYSIS_PLATFORMS.join(", ")}.`,
    });
  }

  const notes = getString(record.notes, "notes", issues, {
    required: false,
    allowEmpty: true,
    maxLength: 1000,
  });

  const input: PostResultInput = {
    text,
    platform,
    likes: getInteger(record.likes, "likes", issues),
    comments: getInteger(record.comments, "comments", issues),
    saves: getInteger(record.saves, "saves", issues),
    impressions: getInteger(record.impressions, "impressions", issues),
    notes,
  };

  throwIfIssues(issues);

  return input;
}

export function successResponse<T extends JsonRecord>(
  payload: T,
  meta: JsonRecord = {},
  status = 200,
) {
  return NextResponse.json(
    {
      ok: true,
      requestId: crypto.randomUUID(),
      ...payload,
      data: payload,
      meta: {
        generatedAt: new Date().toISOString(),
        mockMode: true,
        version: "manual-loop-mvp-v2",
        ...meta,
      },
    },
    {
      status,
      headers: DEFAULT_HEADERS,
    },
  );
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiRouteError) {
    return NextResponse.json(
      {
        ok: false,
        requestId: crypto.randomUUID(),
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      {
        status: error.status,
        headers: DEFAULT_HEADERS,
      },
    );
  }

  console.error(error);

  return NextResponse.json(
    {
      ok: false,
      requestId: crypto.randomUUID(),
      error: {
        code: "INTERNAL_ERROR",
        message: "Unexpected server error.",
      },
    },
    {
      status: 500,
      headers: DEFAULT_HEADERS,
    },
  );
}
