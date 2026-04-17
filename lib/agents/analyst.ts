import type { AnalysisSummary, PostResult } from "@/lib/types";

type ResultTag =
  | "question-cta"
  | "founder-story"
  | "update-context"
  | "pain-led"
  | "simplicity-benefit";

interface ScoredResult {
  result: PostResult;
  commentRate: number;
  saveRate: number;
  score: number;
  tags: ResultTag[];
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function rate(value: number, impressions: number) {
  if (impressions <= 0) {
    return 0;
  }

  return value / impressions;
}

function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function detectTags(result: PostResult): ResultTag[] {
  const text = result.text.toLowerCase();
  const combined = `${result.text}\n${result.notes ?? ""}`.toLowerCase();
  const tags: ResultTag[] = [];

  if (/[?？]|궁금|어때|어떤|언제|뭐|왜/.test(text)) {
    tags.push("question-cta");
  }

  if (/(직접 만들|만들고 있|만드는 이유|헬스로그)/.test(combined)) {
    tags.push("founder-story");
  }

  if (/(업데이트|개선|수정|고쳤|바꿨|손봤)/.test(combined)) {
    tags.push("update-context");
  }

  if (/(불편|복잡|막히|귀찮|헷갈|끊기)/.test(combined)) {
    tags.push("pain-led");
  }

  if (/(한 손|빠르게|간단|단순|줄이|가볍)/.test(combined)) {
    tags.push("simplicity-benefit");
  }

  return tags;
}

function scoreResult(result: PostResult): ScoredResult {
  const commentRate = rate(result.comments, result.impressions);
  const saveRate = rate(result.saves, result.impressions);
  const tags = detectTags(result);

  return {
    result,
    commentRate,
    saveRate,
    tags,
    score:
      result.comments * 5 +
      result.saves * 6 +
      result.likes * 1.5 +
      commentRate * 120 +
      saveRate * 160,
  };
}

function countTaggedResults(results: ScoredResult[], tag: ResultTag) {
  return results.filter((item) => item.tags.includes(tag)).length;
}

function pickBestResult(results: ScoredResult[]) {
  const [first, ...rest] = results;

  if (!first) {
    throw new Error("pickBestResult requires at least one result.");
  }

  return rest.reduce(
    (best, candidate) =>
      candidate.score > best.score ? candidate : best,
    first,
  );
}

function summarizeOpening(text: string) {
  return truncate(text.replace(/\s+/g, " ").trim(), 64);
}

function buildBestHookPattern(
  best: ScoredResult,
  sampleSize: number,
  questionCount: number,
) {
  const prefix =
    sampleSize >= 3 ? "" : "표본이 아직 적지만, 현재 데이터에서는 ";

  if (best.tags.includes("question-cta") && best.commentRate >= 0.02) {
    return `${prefix}마지막 질문으로 닫는 공감형 오프닝이 댓글 반응을 가장 잘 만들었다.`;
  }

  if (best.tags.includes("founder-story") && best.tags.includes("pain-led")) {
    return `${prefix}왜 직접 만들고 있는지 밝히는 문제 공감형 훅이 가장 안정적으로 반응을 받았다.`;
  }

  if (best.tags.includes("update-context") && best.saveRate >= best.commentRate) {
    return `${prefix}무엇을 왜 고쳤는지 설명하는 업데이트 맥락이 저장 반응을 끌어올렸다.`;
  }

  if (questionCount > 0) {
    return `${prefix}짧은 문제 제기 뒤 한 줄 질문을 붙인 포맷이 가장 자연스럽게 대화를 열었다.`;
  }

  return `${prefix}사용자가 겪는 불편을 첫 두 줄 안에 넣는 훅이 가장 안정적이었다.`;
}

function buildWeakPattern(
  results: ScoredResult[],
  averageCommentRate: number,
  averageSaveRate: number,
) {
  const questionCount = countTaggedResults(results, "question-cta");

  if (questionCount === 0 || averageCommentRate < 0.015) {
    return "질문 없이 설명만 이어지는 글은 댓글이 붙기 전에 흐름이 끊기기 쉽다.";
  }

  if (averageSaveRate < 0.01) {
    return "기능 설명만 나열하고 before/after 장면이 약한 글은 저장 이유가 부족하다.";
  }

  return "한 글에 여러 기능을 한꺼번에 담으면 핵심 메시지가 흐려질 가능성이 높다.";
}

function buildNextStrategy(
  sampleSize: number,
  averageCommentRate: number,
  averageSaveRate: number,
) {
  if (sampleSize < 3) {
    return "다음 3개 게시물은 모두 '불편 장면 1줄 -> 왜 고쳤는지 1줄 -> 바뀐 흐름 1줄 -> 질문 1줄' 구조로 맞춰서 비교해보자.";
  }

  if (averageSaveRate < averageCommentRate) {
    return "공감 오프닝은 유지하되, 중간에 바뀐 전후 장면을 한 줄 더 넣어 저장 유인을 키우는 방향이 좋다.";
  }

  return "첫 두 줄에는 사용자 불편을, 중간에는 한 가지 업데이트만, 마지막에는 질문 한 줄만 남기는 짧은 포맷을 반복하자.";
}

export async function analystAgent(results: PostResult[]): Promise<AnalysisSummary> {
  if (results.length === 0) {
    return {
      bestHookPattern: "아직 분석할 데이터가 없다.",
      weakPattern: "성과 데이터가 없으면 약한 패턴도 특정하기 어렵다.",
      nextStrategy: "게시 결과 1건 이상을 먼저 쌓아서 기준선을 만들자.",
      insightBullets: ["분석 가능한 post result가 아직 없다."],
    };
  }

  const scored = results.map(scoreResult);
  const averageComments = average(results.map((item) => item.comments));
  const averageSaves = average(results.map((item) => item.saves));
  const averageImpressions = average(results.map((item) => item.impressions));
  const averageCommentRate = average(scored.map((item) => item.commentRate));
  const averageSaveRate = average(scored.map((item) => item.saveRate));
  const best = pickBestResult(scored);
  const questionCount = countTaggedResults(scored, "question-cta");
  const updateCount = countTaggedResults(scored, "update-context");

  return {
    bestHookPattern: buildBestHookPattern(best, results.length, questionCount),
    weakPattern: buildWeakPattern(scored, averageCommentRate, averageSaveRate),
    nextStrategy: buildNextStrategy(
      results.length,
      averageCommentRate,
      averageSaveRate,
    ),
    insightBullets: [
      `최근 ${results.length}건 기준 평균 댓글 수는 ${averageComments.toFixed(1)}개, 저장 수는 ${averageSaves.toFixed(1)}개다.`,
      `평균 댓글률은 ${(averageCommentRate * 100).toFixed(1)}%, 저장률은 ${(averageSaveRate * 100).toFixed(1)}%, 평균 노출 수는 ${averageImpressions.toFixed(1)}회다.`,
      `가장 반응이 좋았던 글은 "${summarizeOpening(best.result.text)}"로 시작했고 댓글 ${best.result.comments}개, 저장 ${best.result.saves}개를 기록했다.`,
      `질문형 마무리가 들어간 글은 ${questionCount}건, 업데이트 맥락이 드러난 글은 ${updateCount}건이었다.`,
    ],
  };
}
