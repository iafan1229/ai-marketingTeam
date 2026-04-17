import type { ContentGoal, CopywriterInput, GeneratedDraft } from "@/lib/types";

function cleanSentence(text: string) {
  return text.replace(/\s+/g, " ").trim().replace(/[.!?]+$/g, "");
}

function goalBridge(goal: ContentGoal) {
  switch (goal) {
    case "공감 확보":
      return "먼저 비슷한 불편을 겪는 사람이 있다는 감각부터 만드는 게 중요하다고 생각했다.";
    case "업데이트 공유":
      return "그래서 이번 글은 기능 자랑보다 무엇을 왜 고쳤는지 설명하는 쪽에 가깝다.";
    case "설치 관심 유도":
      return "당장 설치를 권하기보다, 왜 이런 흐름이 필요했는지부터 납득되게 만들고 싶다.";
    case "댓글 유도":
    default:
      return "정답을 말하기보다 실제 사용 장면을 더 많이 수집하는 쪽이 지금 단계에 더 중요하다.";
  }
}

function productLine(goal: ContentGoal) {
  switch (goal) {
    case "업데이트 공유":
      return "헬스로그는 업데이트를 많이 하는 앱보다, 기록을 멈추게 하는 마찰을 빨리 걷어내는 앱에 가깝게 만들고 있다.";
    case "설치 관심 유도":
      return "헬스로그를 처음 보는 사람도 한 번에 이해할 수 있게, 설명보다 체감 장면이 먼저 떠오르는 문장으로 적고 있다.";
    case "공감 확보":
      return "헬스로그를 만드는 이유도 거창한 비전보다 운동 기록이 끊기지 않게 하려는 문제 해결에 더 가깝다.";
    case "댓글 유도":
    default:
      return "헬스로그는 기록을 더 많이 시키는 앱보다, 기록을 포기하지 않게 만드는 흐름을 먼저 만들고 싶다.";
  }
}

export async function copywriterAgent(
  input: CopywriterInput,
): Promise<GeneratedDraft[]> {
  const { idea } = input;
  const theme = cleanSentence(idea.theme);
  const angle = cleanSentence(idea.angle);
  const bridge = goalBridge(idea.goal);
  const product = productLine(idea.goal);

  const variants = [
    {
      hook: `${theme} 이야기를 하면 결국 사용자 불편부터 꺼내게 된다.`,
      lines: [
        "운동 기록은 꾸준함이 중요한데, 기록 과정이 복잡해지면 루틴부터 먼저 끊긴다.",
        angle,
        product,
        bridge,
      ],
    },
    {
      hook: `이번엔 기능 자랑보다 왜 ${theme}를 먼저 손봤는지부터 말하고 싶다.`,
      lines: [
        "최근 메모를 다시 읽어보면 결국 반복되는 건 화려한 요청보다 막히는 순간이었다.",
        angle,
        "그래서 이번 초안도 무엇을 추가했는지보다 어디서 멈췄는지를 먼저 보여주는 구조로 잡았다.",
        bridge,
      ],
    },
    {
      hook: `운동 기록 앱은 기능보다 흐름이 먼저라는 생각이 점점 더 강해진다.`,
      lines: [
        angle,
        "기록이 쉬워지면 운동이 이어지고, 기록이 귀찮아지면 앱은 금방 닫히기 때문이다.",
        product,
        bridge,
      ],
    },
  ];

  return variants.map((variant) => ({
    id: crypto.randomUUID(),
    ideaId: idea.id,
    platform: "threads",
    hook: variant.hook,
    cta: idea.cta,
    body: [variant.hook, "", ...variant.lines, "", idea.cta].join("\n"),
  }));
}
