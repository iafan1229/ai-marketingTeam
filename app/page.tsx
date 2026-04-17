"use client";

import { useState, useTransition } from "react";
import type {
  AnalysisSummary,
  GeneratedDraft,
  PlannedIdea,
} from "@/lib/types";

interface MetricForm {
  text: string;
  platform: string;
  likes: string;
  comments: string;
  saves: string;
  impressions: string;
  notes: string;
}

const defaultMetricForm: MetricForm = {
  text: "",
  platform: "threads",
  likes: "0",
  comments: "0",
  saves: "0",
  impressions: "0",
  notes: "",
};

export default function HomePage() {
  const [notes, setNotes] = useState(
    "최근 업데이트:\n- 세트 입력 UX 단순화\n- 쉬는시간 기록 흐름 개선\n\n사용자 피드백:\n- 운동 기록 앱은 너무 복잡하다\n- 한 손으로 빠르게 기록하고 싶다",
  );
  const [ideas, setIdeas] = useState<PlannedIdea[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState("");
  const [drafts, setDrafts] = useState<GeneratedDraft[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisSummary | null>(null);
  const [metricForm, setMetricForm] = useState<MetricForm>(defaultMetricForm);
  const [status, setStatus] = useState("");
  const [isPlanning, startPlanning] = useTransition();
  const [isGenerating, startGenerating] = useTransition();
  const [isAnalyzing, startAnalyzing] = useTransition();

  const selectedIdea = ideas.find((idea) => idea.id === selectedIdeaId);
  const selectedDraft = drafts.find((draft) => draft.body === metricForm.text);
  const noteLineCount = notes
    .split("\n")
    .filter((line) => line.trim().length > 0).length;
  const totalEngagement =
    Number(metricForm.likes || 0) +
    Number(metricForm.comments || 0) +
    Number(metricForm.saves || 0);
  const impressionCount = Number(metricForm.impressions || 0);
  const engagementRate =
    impressionCount > 0
      ? ((totalEngagement / impressionCount) * 100).toFixed(1)
      : null;
  const workflowStages = [
    {
      id: "planner",
      step: "01",
      role: "Planner",
      title: "메모를 오늘의 후보 주제로 정리",
      summary: "업데이트와 사용자 피드백에서 지금 올릴 만한 소재를 추린다.",
      state: isPlanning ? "active" : ideas.length > 0 ? "complete" : "ready",
      stateLabel: isPlanning
        ? "실행 중"
        : ideas.length > 0
          ? "후보 준비됨"
          : "입력 대기",
      detail:
        ideas.length > 0
          ? `${ideas.length}개 후보 생성`
          : `${noteLineCount}줄 메모 로드됨`,
    },
    {
      id: "copywriter",
      step: "02",
      role: "Copywriter",
      title: "선택 주제를 게시글 초안으로 확장",
      summary: "선택된 angle과 CTA를 바탕으로 여러 버전의 카피를 제안한다.",
      state: isGenerating
        ? "active"
        : drafts.length > 0
          ? "complete"
          : selectedIdea
            ? "ready"
            : "blocked",
      stateLabel: isGenerating
        ? "작성 중"
        : drafts.length > 0
          ? "초안 준비됨"
          : selectedIdea
            ? "주제 선택됨"
            : "주제 필요",
      detail: drafts.length > 0
        ? `${drafts.length}개 초안 대기`
        : selectedIdea
          ? `목표: ${selectedIdea.goal}`
          : "Planner handoff 대기",
    },
    {
      id: "analyst",
      step: "03",
      role: "Analyst",
      title: "실제 반응을 읽고 다음 실험 제안",
      summary: "사람이 입력한 성과 수치를 바탕으로 반복할 포맷을 정리한다.",
      state: isAnalyzing
        ? "active"
        : analysis
          ? "complete"
          : metricForm.text.trim()
            ? "ready"
            : "blocked",
      stateLabel: isAnalyzing
        ? "분석 중"
        : analysis
          ? "요약 완료"
          : metricForm.text.trim()
            ? "입력 준비됨"
            : "텍스트 필요",
      detail: analysis
        ? `${analysis.insightBullets.length}개 인사이트 정리`
        : selectedDraft
          ? "Copywriter 초안 연결됨"
          : metricForm.text.trim()
            ? "직접 입력 텍스트 사용"
            : "성과 입력 대기",
    },
  ];

  const requestPlan = () => {
    startPlanning(async () => {
      setStatus("");
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes }),
      });

      const data = (await response.json()) as { ideas: PlannedIdea[] };
      setIdeas(data.ideas);
      setSelectedIdeaId(data.ideas[0]?.id ?? "");
      setDrafts([]);
      setAnalysis(null);
      setStatus("Planner가 오늘의 주제 후보를 정리했다.");
    });
  };

  const requestDrafts = () => {
    if (!selectedIdea) {
      setStatus("먼저 주제를 하나 선택해줘.");
      return;
    }

    startGenerating(async () => {
      setStatus("");
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idea: selectedIdea }),
      });

      const data = (await response.json()) as { drafts: GeneratedDraft[] };
      setDrafts(data.drafts);
      setMetricForm((current) => ({
        ...current,
        text: data.drafts[0]?.body ?? current.text,
      }));
      setStatus("Copywriter가 게시글 초안을 만들었다.");
    });
  };

  const requestAnalysis = () => {
    startAnalyzing(async () => {
      setStatus("");
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: metricForm.text,
          platform: metricForm.platform,
          likes: Number(metricForm.likes),
          comments: Number(metricForm.comments),
          saves: Number(metricForm.saves),
          impressions: Number(metricForm.impressions),
          notes: metricForm.notes,
        }),
      });

      const data = (await response.json()) as { summary: AnalysisSummary };
      setAnalysis(data.summary);
      setStatus("Analyst가 최근 성과를 요약했다.");
    });
  };

  return (
    <main className="shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">HealthLog AI Marketing Team</span>
          <h1>Planner -&gt; Copywriter -&gt; Analyst handoff를 한 화면에서 관리</h1>
          <p>
            Planner가 메모를 주제로 정리하고, Copywriter가 초안을 만들고,
            Analyst가 반응을 읽는다. 지금 버전은 mock 기반 수동 루프라서 외부
            API 없이도 사람이 각 단계를 검토하며 흐름을 검증할 수 있다.
          </p>
          <div className="pill-list">
            <span className="pill">Planner</span>
            <span className="pill">Copywriter</span>
            <span className="pill">Analyst</span>
            <span className="pill">Manual Approval First</span>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <strong>{noteLineCount}</strong>
              <span>메모 줄 수</span>
            </div>
            <div className="hero-stat">
              <strong>{ideas.length}</strong>
              <span>추천 주제</span>
            </div>
            <div className="hero-stat">
              <strong>{drafts.length}</strong>
              <span>생성 초안</span>
            </div>
            <div className="hero-stat">
              <strong>{analysis ? analysis.insightBullets.length : 0}</strong>
              <span>분석 인사이트</span>
            </div>
          </div>
        </div>

        <aside className="hero-board">
          <div className="section-head">
            <div className="section-heading">
              <span className="section-index">Manual Loop</span>
              <h2>오늘의 운영 상태</h2>
              <p>
                자동 게시보다 사람 검토를 우선하는 MVP다. 각 단계 출력물을 확인한
                뒤 다음 단계로 넘긴다.
              </p>
            </div>
            <span className="hint">Human in the loop</span>
          </div>

          <div className="workflow-track">
            {workflowStages.map((stage) => (
              <article
                key={stage.id}
                className={`workflow-node is-${stage.state}`}
              >
                <div className="workflow-step">{stage.step}</div>
                <div className="workflow-body">
                  <div className="workflow-meta">
                    <span className="workflow-role">{stage.role}</span>
                    <span className="workflow-state">{stage.stateLabel}</span>
                  </div>
                  <strong>{stage.title}</strong>
                  <p>{stage.summary}</p>
                  <span className="workflow-detail">{stage.detail}</span>
                </div>
              </article>
            ))}
          </div>

          <div
            aria-live="polite"
            className={`status-panel${status ? "" : " is-muted"}`}
          >
            <span className="micro-label">
              {status ? "Latest update" : "Current mode"}
            </span>
            <strong>
              {status ||
                "수동 승인 중심으로 흐름을 검증하는 중이다. Planner 출력물을 고르고, Copywriter 초안을 연결한 뒤, Analyst에게 실제 반응을 넘긴다."}
            </strong>
          </div>
        </aside>
      </section>

      <section className="grid">
        <div className="column">
          <article className="card card-tone-planner">
            <div className="section-head">
              <div className="section-heading">
                <span className="section-index">단계 01</span>
                <h2>1. 메모 입력</h2>
                <p>
                  업데이트, 사용자 피드백, 관찰 메모를 모아 Planner에게 오늘의
                  주제 후보를 맡긴다.
                </p>
              </div>
              <span className="hint">입력 메모</span>
            </div>
            <div className="field">
              <label htmlFor="notes">마케팅 입력 메모</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
            <div className="card-foot">
              <p className="foot-note">
                {noteLineCount}줄의 메모가 로드되어 있다. 짧은 bullet만 넣어도
                Planner 흐름을 바로 테스트할 수 있다.
              </p>
              <button
                className="primary"
                type="button"
                disabled={isPlanning}
                onClick={requestPlan}
              >
                {isPlanning ? "주제 정리 중..." : "주제 추천 받기"}
              </button>
            </div>
          </article>

          <article className="card card-tone-planner">
            <div className="section-head">
              <div className="section-heading">
                <span className="section-index">단계 02</span>
                <h2>2. 추천 주제</h2>
                <p>오늘 올릴 만한 콘텐츠 후보를 고르고 Copywriter로 넘긴다.</p>
              </div>
              <span className="hint">추천 결과</span>
            </div>
            {selectedIdea ? (
              <div className="selected-brief">
                <div className="selected-brief-head">
                  <div>
                    <span className="micro-label">선택한 주제</span>
                    <strong>{selectedIdea.theme}</strong>
                  </div>
                  <span className="tag">{selectedIdea.goal}</span>
                </div>
                <p>{selectedIdea.angle}</p>
                <div className="brief-meta">
                  <span>CTA</span>
                  <strong>{selectedIdea.cta}</strong>
                </div>
              </div>
            ) : null}
            {ideas.length === 0 ? (
              <div className="empty">
                아직 생성된 주제가 없다. 위에서 메모를 넣고 Planner를 실행해줘.
              </div>
            ) : (
              <div className="idea-list">
                {ideas.map((idea, index) => (
                  <label
                    key={idea.id}
                    className={`idea${
                      selectedIdeaId === idea.id ? " is-selected" : ""
                    }`}
                  >
                    <input
                      checked={selectedIdeaId === idea.id}
                      className="idea-radio"
                      name="idea"
                      type="radio"
                      value={idea.id}
                      onChange={() => setSelectedIdeaId(idea.id)}
                    />
                    <div className="idea-topline">
                      <span className="idea-badge">후보 {index + 1}</span>
                      <span className="tag">{idea.goal}</span>
                    </div>
                    <header>
                      <h3>{idea.theme}</h3>
                    </header>
                    <p>{idea.angle}</p>
                    <div className="meta">
                      <span>CTA: {idea.cta}</span>
                    </div>
                    <div className="choice-row">
                      <span className="choice-dot" aria-hidden="true" />
                      <span>
                        {selectedIdeaId === idea.id
                          ? "이 주제가 Copywriter 입력으로 연결된다."
                          : "이 주제로 진행"}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div className="card-foot">
              <p className="foot-note">
                {selectedIdea
                  ? "선택한 브리프가 바로 Copywriter 입력으로 넘어간다."
                  : "Planner 후보를 하나 고르면 Copywriter를 실행할 수 있다."}
              </p>
              <button
                className="secondary"
                type="button"
                disabled={isGenerating || !selectedIdea}
                onClick={requestDrafts}
              >
                {isGenerating ? "초안 생성 중..." : "초안 생성하기"}
              </button>
            </div>
          </article>

          <article className="card card-tone-copy">
            <div className="section-head">
              <div className="section-heading">
                <span className="section-index">단계 03</span>
                <h2>3. 초안 목록</h2>
                <p>
                  Copywriter가 선택한 주제를 여러 버전의 Threads 초안으로 풀어낸다.
                </p>
              </div>
              <span className="hint">초안 결과</span>
            </div>
            <div className="selected-brief draft-context">
              <div className="selected-brief-head">
                <div>
                  <span className="micro-label">초안 기준</span>
                  <strong>{selectedIdea?.theme ?? "주제 선택 대기"}</strong>
                </div>
                <span className="tag">
                  {selectedIdea?.goal ?? "주제 필요"}
                </span>
              </div>
              <p>
                {selectedIdea?.angle ??
                  "Planner에서 오늘의 주제를 하나 선택하면 이 영역에서 초안을 만들 수 있다."}
              </p>
            </div>
            {drafts.length === 0 ? (
              <div className="empty">선택한 주제로 아직 생성된 초안이 없다.</div>
            ) : (
              <div className="draft-list">
                {drafts.map((draft, index) => (
                  <article
                    key={draft.id}
                    className={`draft${
                      selectedDraft?.id === draft.id ? " is-linked" : ""
                    }`}
                  >
                    <div className="draft-topline">
                      <span className="idea-badge">초안 {index + 1}</span>
                      <div className="tag-cluster">
                        <span className="tag">{draft.platform}</span>
                        {selectedDraft?.id === draft.id ? (
                          <span className="tag tag-success">분석 연결됨</span>
                        ) : null}
                      </div>
                    </div>
                    <header>
                      <h3>{draft.hook}</h3>
                    </header>
                    <div className="draft-body">{draft.body}</div>
                    <div className="meta">
                      <span>CTA: {draft.cta}</span>
                    </div>
                    <div className="actions">
                      <button
                        aria-pressed={selectedDraft?.id === draft.id}
                        className="secondary"
                        type="button"
                        onClick={() =>
                          setMetricForm((current) => ({
                            ...current,
                            text: draft.body,
                          }))
                        }
                      >
                        {selectedDraft?.id === draft.id
                          ? "분석 입력에 연결됨"
                          : "분석 입력에 연결"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>
        </div>

        <div className="column column-side">
          <article className="card card-tone-analyst">
            <div className="section-head">
              <div className="section-heading">
                <span className="section-index">단계 04</span>
                <h2>4. 성과 입력</h2>
                <p>게시 후 성과를 직접 적어주면 Analyst가 패턴을 정리한다.</p>
              </div>
              <span className="hint">분석 입력</span>
            </div>
            <div className="snapshot-strip">
              <div className="mini-stat">
                <span>분석 대상</span>
                <strong>
                  {selectedDraft
                    ? "Copywriter 연결됨"
                    : metricForm.text.trim()
                      ? "직접 입력"
                      : "미정"}
                </strong>
              </div>
              <div className="mini-stat">
                <span>가시 반응 합계</span>
                <strong>{totalEngagement.toLocaleString()}</strong>
              </div>
              <div className="mini-stat">
                <span>참여율 추정</span>
                <strong>{engagementRate ? `${engagementRate}%` : "계산 대기"}</strong>
              </div>
            </div>
            <div className="selected-brief analysis-target">
              <div className="selected-brief-head">
                <div>
                  <span className="micro-label">현재 분석 대상</span>
                  <strong>
                    {selectedDraft
                      ? selectedDraft.hook
                      : metricForm.text.trim()
                        ? "직접 입력한 게시글"
                        : "아직 연결된 게시글 없음"}
                  </strong>
                </div>
                <span className="tag">{metricForm.platform}</span>
              </div>
              <p>
                {selectedDraft
                  ? "선택한 초안이 텍스트 필드에 반영되어 있다. 게시 후 실제 수치만 추가하면 된다."
                  : "직접 작성한 텍스트를 붙여넣어도 Analyst 흐름을 테스트할 수 있다."}
              </p>
            </div>
            <div className="field">
              <label htmlFor="text">게시글 텍스트</label>
              <textarea
                id="text"
                value={metricForm.text}
                onChange={(event) =>
                  setMetricForm((current) => ({
                    ...current,
                    text: event.target.value,
                  }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="platform">플랫폼</label>
              <select
                id="platform"
                value={metricForm.platform}
                onChange={(event) =>
                  setMetricForm((current) => ({
                    ...current,
                    platform: event.target.value,
                  }))
                }
              >
                <option value="threads">Threads</option>
                <option value="instagram">Instagram</option>
                <option value="x">X</option>
              </select>
            </div>
            <div className="metric-grid">
              <div className="field">
                <label htmlFor="likes">좋아요</label>
                <input
                  id="likes"
                  type="number"
                  value={metricForm.likes}
                  onChange={(event) =>
                    setMetricForm((current) => ({
                      ...current,
                      likes: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="field">
                <label htmlFor="comments">댓글</label>
                <input
                  id="comments"
                  type="number"
                  value={metricForm.comments}
                  onChange={(event) =>
                    setMetricForm((current) => ({
                      ...current,
                      comments: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="field">
                <label htmlFor="saves">저장</label>
                <input
                  id="saves"
                  type="number"
                  value={metricForm.saves}
                  onChange={(event) =>
                    setMetricForm((current) => ({
                      ...current,
                      saves: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="field">
                <label htmlFor="impressions">노출 수</label>
                <input
                  id="impressions"
                  type="number"
                  value={metricForm.impressions}
                  onChange={(event) =>
                    setMetricForm((current) => ({
                      ...current,
                      impressions: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="memo">관찰 메모</label>
              <textarea
                id="memo"
                value={metricForm.notes}
                onChange={(event) =>
                  setMetricForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
              />
            </div>
            <div className="card-foot">
              <p className="foot-note">
                댓글 톤, 저장 이유, 게시 타이밍 같은 정성 메모를 함께 남기면
                Analyst 요약이 훨씬 더 유용해진다.
              </p>
              <button
                className="primary"
                type="button"
                disabled={isAnalyzing}
                onClick={requestAnalysis}
              >
                {isAnalyzing ? "분석 중..." : "분석 요약 받기"}
              </button>
            </div>
          </article>

          <article className="card card-tone-analyst">
            <div className="section-head">
              <div className="section-heading">
                <span className="section-index">단계 05</span>
                <h2>5. 분석 요약</h2>
                <p>최근 성과를 바탕으로 다음에 반복할 포맷을 잡는다.</p>
              </div>
              <span className="hint">분석 결과</span>
            </div>
            {!analysis ? (
              <div className="empty">
                성과 데이터를 넣고 Analyst를 실행하면, 반복할 패턴과 다음 전략이
                여기에 정리된다.
              </div>
            ) : (
              <>
                <div className="snapshot-strip compact">
                  <div className="mini-stat">
                    <span>분석 기반 노출</span>
                    <strong>{impressionCount.toLocaleString()}</strong>
                  </div>
                  <div className="mini-stat">
                    <span>반응 행동 합계</span>
                    <strong>{totalEngagement.toLocaleString()}</strong>
                  </div>
                  <div className="mini-stat">
                    <span>도출 인사이트</span>
                    <strong>{analysis.insightBullets.length}</strong>
                  </div>
                </div>
                <div className="summary-grid">
                  <div className="summary-box">
                    <strong>잘된 훅 패턴</strong>
                    <span>{analysis.bestHookPattern}</span>
                  </div>
                  <div className="summary-box">
                    <strong>약한 패턴</strong>
                    <span>{analysis.weakPattern}</span>
                  </div>
                  <div className="summary-box">
                    <strong>다음 전략</strong>
                    <span>{analysis.nextStrategy}</span>
                  </div>
                </div>
                <div className="insight-list" style={{ marginTop: 14 }}>
                  {analysis.insightBullets.map((item) => (
                    <div key={item} className="insight">
                      {item}
                    </div>
                  ))}
                </div>
              </>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}
