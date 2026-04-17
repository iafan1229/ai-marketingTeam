import type { AnalysisSummary, PostResult } from "@/lib/types";

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export async function analystAgent(results: PostResult[]): Promise<AnalysisSummary> {
  const averageComments = average(results.map((item) => item.comments));
  const averageSaves = average(results.map((item) => item.saves));
  const averageImpressions = average(results.map((item) => item.impressions));

  const bestHookPattern =
    averageComments >= 5
      ? "질문형 마무리와 공감형 오프닝이 댓글을 더 잘 만든다."
      : "직접 만들게 된 이유를 먼저 말하는 후킹이 가장 안정적이다.";

  const weakPattern =
    averageSaves < 3
      ? "기능 설명만 길게 이어지는 글은 저장 유인이 약하다."
      : "CTA 없이 끝나는 글은 반응이 끊길 가능성이 높다.";

  const nextStrategy =
    averageImpressions >= 100
      ? "업데이트 소개보다 사용자의 불편 공감을 먼저 꺼내고, 마지막에 한 가지 질문으로 닫는다."
      : "짧은 경험담 중심 포맷을 늘리고 첫 두 줄의 밀도를 더 높인다.";

  return {
    bestHookPattern,
    weakPattern,
    nextStrategy,
    insightBullets: [
      `최근 평균 댓글 수는 ${averageComments.toFixed(1)}개다.`,
      `최근 평균 저장 수는 ${averageSaves.toFixed(1)}개다.`,
      `최근 평균 노출 수는 ${averageImpressions.toFixed(1)}회다.`,
    ],
  };
}

