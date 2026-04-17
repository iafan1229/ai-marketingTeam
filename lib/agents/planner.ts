import type { PlannedIdea, PlannerInput } from "@/lib/types";

function summarizeNotes(notes: string) {
  const lines = notes
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.length > 0 ? lines : ["운동 기록이 불편해서 직접 만들고 있는 앱"];
}

export async function plannerAgent(input: PlannerInput): Promise<PlannedIdea[]> {
  const sources = summarizeNotes(input.notes);
  const first = sources[0];
  const second = sources[1] ?? "사용자 피드백을 제품 개선으로 연결하고 싶다";
  const third = sources[2] ?? "기존 운동 기록 앱의 복잡함을 더 단순하게 풀고 싶다";

  return [
    {
      id: crypto.randomUUID(),
      theme: `왜 헬스로그를 직접 만들게 됐는지`,
      goal: "공감 확보",
      cta: "운동 기록 앱 쓰면서 제일 답답한 점이 뭐였는지 물어본다.",
      angle: first,
    },
    {
      id: crypto.randomUUID(),
      theme: `최근 업데이트를 만든 이유`,
      goal: "업데이트 공유",
      cta: "다음에 손보고 싶은 기능을 댓글로 받는다.",
      angle: second,
    },
    {
      id: crypto.randomUUID(),
      theme: `복잡한 운동 기록 경험을 더 단순하게 바꾸는 시도`,
      goal: "댓글 유도",
      cta: "지금 쓰는 앱에서 불편한 순간을 질문한다.",
      angle: third,
    },
  ];
}

