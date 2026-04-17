import type { CopywriterInput, GeneratedDraft } from "@/lib/types";

const endings = [
  "너도 쓰면서 제일 불편했던 순간 있었어?",
  "이런 방향이면 써보고 싶은지 궁금하다.",
  "다음에 넣었으면 하는 기능이 있으면 알려줘.",
];

export async function copywriterAgent(
  input: CopywriterInput,
): Promise<GeneratedDraft[]> {
  const { idea } = input;

  const hooks = [
    `${idea.theme} 얘기를 안 할 수가 없다.`,
    `운동 기록 앱 쓰다 보면 결국 여기서 막힌다.`,
    `광고보다 먼저, 왜 이걸 만들고 있는지부터 말하고 싶다.`,
  ];

  return hooks.map((hook, index) => ({
    id: crypto.randomUUID(),
    ideaId: idea.id,
    platform: "threads",
    hook,
    cta: idea.cta,
    body: [
      hook,
      "",
      `${idea.angle}`,
      "",
      `그래서 지금은 "${idea.theme}"를 중심으로 헬스로그를 다듬고 있다.`,
      `${idea.goal}이 목표라서 이번 글도 최대한 광고처럼 보이지 않게 적었다.`,
      "",
      endings[index],
    ].join("\n"),
  }));
}

