import type { PlannedIdea, PlannerInput } from "@/lib/types";

interface NoteBuckets {
  lines: string[];
  updates: string[];
  pains: string[];
  desires: string[];
  proof: string[];
}

const fallbackLines = [
  "운동 기록 앱이 복잡해서 기록 흐름이 자주 끊긴다",
  "한 손으로 빠르게 기록할 수 있는 경험이 필요하다",
  "사용자 피드백을 바탕으로 작은 업데이트를 계속 만들고 있다",
];

function cleanLine(line: string) {
  return line
    .replace(/^[-*•\d.\)\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(lines: string[]) {
  return Array.from(new Set(lines));
}

function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function quoteForTheme(text: string) {
  return `"${truncate(text.replace(/[.!?]+$/g, ""), 28)}"`;
}

function summarizeNotes(notes: string): NoteBuckets {
  const rawLines = notes
    .split("\n")
    .map(cleanLine)
    .filter(Boolean);

  const lines = rawLines.length > 0 ? unique(rawLines) : fallbackLines;

  const buckets: NoteBuckets = {
    lines,
    updates: [],
    pains: [],
    desires: [],
    proof: [],
  };

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (/(업데이트|개선|수정|추가|변경|출시|ux|흐름|기능)/.test(lower)) {
      buckets.updates.push(line);
    }

    if (/(불편|복잡|막히|귀찮|헷갈|어렵|번거|느리|끊기)/.test(lower)) {
      buckets.pains.push(line);
    }

    if (/(원하|싶다|빠르게|간단|한 손|바로|쉽게|줄이)/.test(lower)) {
      buckets.desires.push(line);
    }

    if (/(피드백|사용자|댓글|반응|요청|질문)/.test(lower)) {
      buckets.proof.push(line);
    }
  }

  return buckets;
}

function pickPrimary(...groups: string[][]) {
  for (const group of groups) {
    if (group.length > 0) {
      return group[0];
    }
  }

  return fallbackLines[0];
}

export async function plannerAgent(input: PlannerInput): Promise<PlannedIdea[]> {
  const buckets = summarizeNotes(input.notes);

  const pain = pickPrimary(buckets.pains, buckets.lines);
  const desire = pickPrimary(buckets.desires, buckets.lines);
  const update = pickPrimary(buckets.updates, buckets.lines);
  const proof = pickPrimary(buckets.proof, buckets.lines);

  return [
    {
      id: crypto.randomUUID(),
      theme: truncate(
        `${quoteForTheme(pain)} 피드백에서 출발해 헬스로그를 다듬는 이유`,
        140,
      ),
      goal: "공감 확보",
      cta: "운동 기록하다가 흐름이 끊기는 순간이 언제인지 댓글로 알려줘.",
      angle: truncate(
        `${pain} 같은 메모가 반복돼서, 헬스로그는 기능을 더 붙이기보다 ${desire} 경험을 먼저 지키는 방향으로 정리하고 있다.`,
        280,
      ),
    },
    {
      id: crypto.randomUUID(),
      theme: truncate(
        `${quoteForTheme(update)}를 이번 업데이트에서 먼저 손본 이유`,
        140,
      ),
      goal: "업데이트 공유",
      cta: "다음 업데이트에서 먼저 줄였으면 하는 단계가 있다면 말해줘.",
      angle: truncate(
        `${update}를 우선순위로 올린 배경은 단순하다. ${pain}가 계속 나와서, 새 기능 소개보다 막히는 지점을 줄이는 데 집중했다.`,
        280,
      ),
    },
    {
      id: crypto.randomUUID(),
      theme: truncate(
        `${quoteForTheme(desire)} 흐름을 만들기 위한 제품 메모`,
        140,
      ),
      goal: "댓글 유도",
      cta: "지금 쓰는 기록 앱에서 딱 하나 없앨 수 있다면 뭐부터 빼고 싶은지 궁금하다.",
      angle: truncate(
        `${desire}라는 기대가 분명해서, 헬스로그는 화려한 기능보다 기록이 끊기지 않는 흐름을 우선순위에 둔다. 최근에는 ${proof} 같은 신호를 다음 실험의 기준으로 삼고 있다.`,
        280,
      ),
    },
  ];
}
