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
      <section className="hero">
        <span className="eyebrow">HealthLog AI Marketing Team</span>
        <h1>헬스로그 마케팅 팀을 위한 첫 콘솔</h1>
        <p>
          Planner가 오늘의 주제를 정하고, Copywriter가 초안을 만들고,
          Analyst가 반응을 요약한다. 지금 버전은 mock 기반 MVP라서 외부 API
          없이도 흐름을 검증할 수 있다.
        </p>
        <div className="pill-list">
          <span className="pill">Planner</span>
          <span className="pill">Copywriter</span>
          <span className="pill">Analyst</span>
          <span className="pill">Manual Approval First</span>
        </div>
      </section>

      <section className="grid">
        <div className="column">
          <article className="card">
            <div className="section-head">
              <div>
                <h2>1. Source Notes</h2>
                <p>업데이트, 사용자 피드백, 관찰 메모를 넣으면 Planner가 주제를 뽑는다.</p>
              </div>
              <span className="hint">PRD Flow A</span>
            </div>
            <div className="field">
              <label htmlFor="notes">마케팅 입력 메모</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
            <div className="actions">
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

          <article className="card">
            <div className="section-head">
              <div>
                <h2>2. Planned Ideas</h2>
                <p>오늘 올릴 만한 콘텐츠 후보를 선택한다.</p>
              </div>
              <span className="hint">Planner Output</span>
            </div>
            {ideas.length === 0 ? (
              <div className="empty">아직 생성된 주제가 없다. 위에서 메모를 넣고 Planner를 실행해줘.</div>
            ) : (
              <div className="idea-list">
                {ideas.map((idea) => (
                  <label key={idea.id} className="idea">
                    <header>
                      <h3>{idea.theme}</h3>
                      <span className="tag">{idea.goal}</span>
                    </header>
                    <p>{idea.angle}</p>
                    <div className="meta">
                      <span>CTA: {idea.cta}</span>
                    </div>
                    <div className="actions">
                      <input
                        checked={selectedIdeaId === idea.id}
                        name="idea"
                        type="radio"
                        value={idea.id}
                        onChange={() => setSelectedIdeaId(idea.id)}
                      />
                      <span>이 주제를 선택</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div className="actions">
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

          <article className="card">
            <div className="section-head">
              <div>
                <h2>3. Drafts</h2>
                <p>Copywriter가 Threads 초안을 3개 제안한다.</p>
              </div>
              <span className="hint">Copywriter Output</span>
            </div>
            {drafts.length === 0 ? (
              <div className="empty">선택한 주제로 아직 생성된 초안이 없다.</div>
            ) : (
              <div className="draft-list">
                {drafts.map((draft) => (
                  <article key={draft.id} className="draft">
                    <header>
                      <h3>{draft.hook}</h3>
                      <span className="tag">{draft.platform}</span>
                    </header>
                    <div className="draft-body">{draft.body}</div>
                    <div className="meta">
                      <span>CTA: {draft.cta}</span>
                    </div>
                    <div className="actions">
                      <button
                        className="secondary"
                        type="button"
                        onClick={() =>
                          setMetricForm((current) => ({
                            ...current,
                            text: draft.body,
                          }))
                        }
                      >
                        성과 입력 대상으로 사용
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>
        </div>

        <div className="column">
          <article className="card">
            <div className="section-head">
              <div>
                <h2>4. Manual Result Input</h2>
                <p>게시 후 성과를 직접 적어주면 Analyst가 패턴을 정리한다.</p>
              </div>
              <span className="hint">Manual Loop MVP</span>
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
            <div className="summary-grid">
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
            <div className="actions">
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

          <article className="card">
            <div className="section-head">
              <div>
                <h2>5. Analyst Summary</h2>
                <p>최근 성과를 바탕으로 다음에 반복할 포맷을 잡는다.</p>
              </div>
              <span className="hint">Analyst Output</span>
            </div>
            {!analysis ? (
              <div className="empty">성과 데이터를 넣고 Analyst를 실행하면 요약이 여기에 쌓인다.</div>
            ) : (
              <>
                <div className="summary-grid">
                  <div className="summary-box">
                    <strong>Best Hook Pattern</strong>
                    <span>{analysis.bestHookPattern}</span>
                  </div>
                  <div className="summary-box">
                    <strong>Weak Pattern</strong>
                    <span>{analysis.weakPattern}</span>
                  </div>
                  <div className="summary-box">
                    <strong>Next Strategy</strong>
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
            {status ? <div className="status">{status}</div> : null}
          </article>
        </div>
      </section>
    </main>
  );
}

