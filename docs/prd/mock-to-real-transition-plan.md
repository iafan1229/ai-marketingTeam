# Mock to Real Transition Plan

## 문서 정보

- 문서명: Mock to Real Transition Plan
- 상태: Draft v1
- 작성일: 2026-04-17
- 대상 프로젝트: HealthLog AI Marketing Team
- 문서 목적: 현재 mock 기반 MVP를 실제 AI API/DB 기반 구조로 전환하기 위한 실행 계획 정의
- 관련 문서:
  - [HealthLog AI Marketing Team PRD](./README.md)
  - [Codex Multi-Agent Working Plan](./codex-multi-agent-workflow.md)

## 1. 배경

현재 MVP는 수동 검증에 맞춘 mock 구조로 동작한다.

- `POST /api/plan`
- `POST /api/generate`
- `POST /api/analyze`

현재 코드 기준 특징은 아래와 같다.

- Planner, Copywriter, Analyst 로직은 함수 단위로 분리되어 있다.
- API route는 request validation과 orchestration을 함께 담당한다.
- 저장소는 `lib/db.ts`의 in-memory store를 사용한다.
- 응답 메타에는 `mockMode: true`가 고정되어 있다.
- 관리자 UI는 이미 manual loop 기준으로 동작한다.

즉, 지금 단계의 핵심 과제는 UI를 새로 만드는 것이 아니라 `mock implementation을 실제 인프라로 안전하게 치환하는 것`이다.

## 2. 전환 목표

- 기존 `plan -> generate -> analyze` 흐름을 유지한 채 실제 저장소를 연결한다.
- OpenAI Responses API 기반의 실제 생성 로직을 도입한다.
- 게시 성과, 초안, 인사이트를 재시작 이후에도 유지되는 형태로 저장한다.
- 수동 승인 중심의 MVP 운영 방식은 그대로 유지한다.
- 이후 발행 큐, 예약 발행, 채널 확장으로 이어질 수 있는 구조를 만든다.

## 3. 전환 범위

이번 전환에서 포함하는 범위는 아래와 같다.

- 실제 DB 연결
- repository interface 분리
- service 계층 도입
- Planner / Copywriter의 실제 AI 호출
- Analyst 결과 및 memory insight 저장
- 운영용 환경 변수 및 에러 처리 정비

이번 전환에서 제외하는 범위는 아래와 같다.

- 완전 자동 발행
- 외부 SNS API 직접 연동
- 멀티 브랜드 지원
- 고급 권한 체계
- 복잡한 분석 대시보드

## 4. 전환 원칙

- API contract first: 프론트가 기대하는 request/response shape를 먼저 고정한다.
- DB first, AI second: 저장 구조를 먼저 실제화하고 생성 로직은 그다음 연결한다.
- Route thin, service thick: Route Handler는 얇게 유지하고 실제 흐름은 service 계층으로 이동한다.
- Mock fallback 유지: 초기 전환 단계에서는 mock adapter를 제거하지 않고 fallback 또는 비교 기준으로 남긴다.
- Human approval 유지: 초안 생성 이후 사람 승인 프로세스는 유지한다.
- Observability 기본 확보: request id, model, latency, failure reason을 추적 가능하게 남긴다.

## 5. 현재 구조 요약

현재 구조를 기준으로 보면 아래 파일이 전환 핵심 지점이다.

- `app/api/plan/route.ts`
- `app/api/generate/route.ts`
- `app/api/analyze/route.ts`
- `lib/agents/planner.ts`
- `lib/agents/copywriter.ts`
- `lib/agents/analyst.ts`
- `lib/agents/http.ts`
- `lib/db.ts`
- `lib/server/manual-loop-memory.ts`
- `app/page.tsx`

현재 문제를 정리하면 아래와 같다.

- 저장소가 메모리 기반이라 서버 재시작 시 데이터가 사라진다.
- route가 validation, orchestration, persistence를 함께 처리한다.
- mock 여부가 응답 메타에 고정되어 있어 real 환경으로 전환해도 응답 구조를 다시 손봐야 한다.
- Planner / Copywriter / Analyst가 아직 실제 AI 호출이나 장기 메모리 활용 구조와 직접 연결되어 있지 않다.

## 6. 목표 아키텍처

전환 후 기본 구조는 아래와 같이 잡는 것을 권장한다.

- UI: Next.js App Router 기반 관리자 화면 유지
- Route: request parsing, auth placeholder, response mapping만 담당
- Service: 계획, 생성, 분석 흐름 orchestration 담당
- Repository: idea / draft / post result / insight 단위 persistence 담당
- AI Client: OpenAI Responses API 호출 담당
- DB: Postgres 우선 권장

권장 레이어 구조는 아래와 같다.

- `app/api/*`: HTTP entrypoint
- `lib/services/*`: use case orchestration
- `lib/repositories/*`: persistence interface + implementation
- `lib/agents/*`: prompt/template 또는 domain-level agent logic
- `lib/ai/*`: OpenAI client와 structured output handling
- `lib/db/*` 또는 `db/*`: schema, client, migration

## 7. 단계별 실행 계획

### Phase 0. 계약 고정

목표:

- 프론트와 route 사이 계약을 먼저 고정한다.

작업:

- `plan`, `generate`, `analyze` 요청/응답 shape를 문서화한다.
- 성공/실패 응답 포맷을 통일한다.
- `meta.mockMode`를 상수 고정이 아닌 환경 기반으로 바꿀 준비를 한다.
- 수동 검증용 fixture payload를 만든다.

산출물:

- API contract 문서
- fixture request/response 예시
- 회귀 확인용 수동 체크리스트

완료 기준:

- UI 코드 수정 없이 backend 구현을 교체할 수 있다.

### Phase 1. Persistence 추상화

목표:

- 현재 `lib/db.ts`의 메모리 저장 구현을 interface 중심 구조로 분리한다.

작업:

- repository contract를 정의한다.
- 아래 repository를 최소 단위로 분리한다.
  - `IdeaRepository`
  - `DraftRepository`
  - `PostResultRepository`
  - `InsightRepository`
- 기존 in-memory 구현은 `mock repository adapter`로 유지한다.
- route가 직접 저장소 세부 구현을 모르게 바꾼다.

산출물:

- repository interface
- memory adapter
- repository 주입 또는 factory 구조

완료 기준:

- 저장소 구현체를 교체해도 route와 UI는 그대로 유지된다.

### Phase 2. 실제 DB 도입

목표:

- 메모리 저장을 실제 영속 저장소로 대체한다.

권장 선택:

- 배포와 확장성을 고려해 `Postgres` 우선

작업:

- ORM 또는 query layer를 선택한다.
- schema와 migration 체계를 도입한다.
- `.env` 기반 DB connection 설정을 추가한다.
- 로컬 개발용 seed 또는 bootstrap 전략을 정한다.

우선 생성할 테이블:

- `content_ideas`
- `content_drafts`
- `post_results`
- `memory_insights`

추가 권장 테이블:

- `agent_runs`

`agent_runs`에 남기면 좋은 정보:

- agent type
- model
- prompt version
- status
- latency
- input/output summary
- request id
- created at

완료 기준:

- 서버 재시작 후에도 초안, 성과, 인사이트가 유지된다.

### Phase 3. Service 계층 도입

목표:

- route에서 비즈니스 흐름 조합 책임을 분리한다.

작업:

- `planContent`
- `generateDrafts`
- `analyzePostResults`

같은 service function을 도입한다.

각 service 책임은 아래와 같다.

- input validation 이후 domain 호출
- repository read/write orchestration
- AI 호출 및 fallback 처리
- 운영 메타 생성

route 책임은 아래 수준으로 축소한다.

- request body 읽기
- validation
- service 호출
- HTTP response 반환

완료 기준:

- route 파일에서 persistence 조합 로직이 빠진다.

### Phase 4. 실제 AI 연동

목표:

- mock 생성 함수를 실제 AI 호출로 대체한다.

우선순위:

1. Planner
2. Copywriter
3. Analyst

작업:

- OpenAI Responses API client를 서버 전용으로 추가한다.
- planner와 copywriter 출력은 structured JSON으로 받는다.
- model, prompt version, retry 정책을 명시한다.
- 실패 시 fallback 전략을 정의한다.

권장 방식:

- Planner: 최근 notes + 최근 insight를 입력으로 받아 topic 후보 3개 생성
- Copywriter: idea + tone guide + 최근 성과 insight 기반 draft 2~3개 생성
- Analyst: 초기에는 현재 규칙 기반 로직을 유지하고, 이후 LLM 요약을 보조적으로 도입

완료 기준:

- 실제 API key가 있는 환경에서 mock 없이도 주제 추천과 초안 생성이 가능하다.

### Phase 5. Memory 활용 강화

목표:

- 분석 결과가 다음 생성에 실제로 반영되게 만든다.

작업:

- 최근 `hook`, `weakness`, `strategy` insight를 planner/copywriter 입력에 포함한다.
- post result와 draft의 연결 관계를 저장한다.
- draft status를 분리한다.

권장 추가 필드:

- `content_drafts.status`
- `content_drafts.selected_at`
- `post_results.draft_id`
- `post_results.posted_at`
- `memory_insights.confidence`

완료 기준:

- Analyst가 만든 메모리가 다음 Planner / Copywriter 실행에 반영된다.

### Phase 6. 롤아웃과 운영 안정화

목표:

- 전환 이후 운영 리스크를 줄인다.

작업:

- `mock`, `hybrid`, `real` 모드를 환경 변수로 구분한다.
- staging에서 `real DB + mock AI` 조합을 먼저 검증한다.
- 이후 `real DB + real AI` 조합을 검증한다.
- request id 기준 로그 추적 체계를 정리한다.
- rate limit, timeout, malformed output 대응을 넣는다.

권장 롤아웃 순서:

1. local: real DB + mock agents
2. staging: real DB + mock agents
3. staging: real DB + real Planner/Copywriter
4. production: real DB + real Planner/Copywriter + analyst hybrid

완료 기준:

- 장애가 나도 mock fallback 또는 명확한 운영 로그로 원인 파악이 가능하다.

## 8. 권장 작업 분해

병렬 작업을 한다면 아래 분해를 권장한다.

#### Track 1. API / Service

담당:

- route 정리
- service 계층 추가
- response/meta 정리

예상 파일:

- `app/api/*`
- `lib/services/*`
- `lib/agents/http.ts`

#### Track 2. Data / Persistence

담당:

- schema
- migration
- repository
- seed/factory

예상 파일:

- `lib/db/*` 또는 `db/*`
- `lib/repositories/*`

#### Track 3. AI Integration

담당:

- OpenAI client
- prompt 구성
- structured output 처리
- fallback 전략

예상 파일:

- `lib/ai/*`
- `lib/agents/*`

#### Track 4. UI / QA / Docs

담당:

- 관리자 화면 회귀 확인
- 상태 문구와 에러 표시 보강
- 수동 검증 시나리오 문서화

예상 파일:

- `app/page.tsx`
- `docs/*`
- `tests/*`

## 9. 예상 데이터 모델 초안

### `content_ideas`

- id
- source_notes
- theme
- goal
- cta
- angle
- source_line_count
- created_at

### `content_drafts`

- id
- idea_id
- platform
- hook
- body
- cta
- status
- model
- prompt_version
- created_at
- selected_at

### `post_results`

- id
- draft_id
- platform
- text
- likes
- comments
- saves
- impressions
- notes
- posted_at
- created_at

### `memory_insights`

- id
- insight_type
- content
- confidence
- source_result_count
- created_at

### `agent_runs`

- id
- agent_type
- model
- prompt_version
- status
- latency_ms
- request_id
- input_summary
- output_summary
- error_code
- created_at

## 10. 리스크와 대응

### 리스크 1. DB부터 붙이기 전에 AI부터 붙여 구조가 꼬일 수 있다

대응:

- 반드시 repository 분리와 schema 정의를 먼저 끝낸다.

### 리스크 2. LLM 출력 포맷이 흔들릴 수 있다

대응:

- structured output과 server-side validation을 함께 사용한다.

### 리스크 3. 데이터가 적어 Analyst 품질이 흔들릴 수 있다

대응:

- 초기에는 현재 규칙 기반 분석을 fallback으로 유지한다.

### 리스크 4. mock 제거를 너무 빨리 하면 디버깅 기준선이 사라진다

대응:

- 최소 한동안은 mock adapter와 fixture를 유지한다.

### 리스크 5. route에 비즈니스 로직이 계속 남아 유지보수가 어려워질 수 있다

대응:

- service 계층 도입 완료 전에는 feature 확장을 멈추고 구조 정리를 먼저 한다.

## 11. 추천 착수 순서

실제 구현 착수 순서는 아래를 권장한다.

1. API contract 문서화 및 response meta 정리
2. repository interface 분리
3. Postgres 및 migration 도입
4. memory adapter와 real repository 병행 구성
5. service 계층 도입
6. Planner / Copywriter 실제 AI 연동
7. Analyst hybrid 구조 도입
8. staging 검증
9. production 컷오버

## 12. 현재 결론

이 전환 작업의 핵심은 `UI 재구축`이 아니다.

핵심은 아래 3가지다.

- 저장소를 메모리에서 영속 DB로 교체
- route 중심 구조를 service/repository 구조로 재배치
- mock agent를 실제 AI 호출로 단계적으로 치환

가장 안전한 전략은 `DB 먼저, AI 나중, mock fallback 유지`다.
