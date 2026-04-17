# DB Architecture & Execution Plan

## 문서 정보

- 문서명: DB Architecture & Execution Plan
- 상태: Draft v1
- 작성일: 2026-04-17
- 대상 프로젝트: HealthLog AI Marketing Team
- 문서 목적: 이 프로젝트의 DB 역할, Supabase 선택 이유, 환경별 DB 운영 방식, 실행 계획 정의
- 관련 문서:
  - [HealthLog AI Marketing Team PRD](./README.md)
  - [Mock to Real Transition Plan](./mock-to-real-transition-plan.md)

## 1. 이 프로젝트에서 DB의 역할

이 프로젝트에서 DB는 `AI가 생각하는 엔진`이 아니다.

DB의 역할은 아래 4가지다.

- Planner가 만든 주제 후보 저장
- Copywriter가 만든 초안 저장
- 게시 후 성과 데이터 저장
- Analyst가 만든 인사이트와 메모리 저장

즉 DB는 이 프로젝트의 `장기 기억`, `상태 저장소`, `운영 히스토리` 역할을 한다.

DB가 없으면 현재 세션이 끝나거나 서버가 재시작될 때 아래 정보가 사라진다.

- 어떤 주제가 생성되었는지
- 어떤 초안이 만들어졌는지
- 어떤 글이 실제로 반응이 좋았는지
- 다음 생성에 참고할 메모리가 무엇인지

## 2. 왜 Supabase인가

현재 프로젝트는 아래 조건을 만족해야 한다.

- 개발 초기 비용이 낮아야 한다.
- 로컬 메모리 저장보다 실제 영속 저장을 빨리 검증해야 한다.
- 나중에 운영 환경에서 always-on 구조로 전환 가능해야 한다.

Supabase가 맞는 이유는 아래와 같다.

- hosted Postgres를 바로 사용할 수 있다.
- 개발 단계에서는 Free 플랜으로 시작할 수 있다.
- 나중에 paid plan으로 올리면 운영형 구조로 전환하기 쉽다.
- migration 중심 워크플로를 갖추기 좋다.
- 현재 repository abstraction 구조와 잘 맞는다.

이 프로젝트에서는 Supabase를 우선 `호스팅된 Postgres`로 사용한다.

즉, 초기에는 Supabase Auth, Storage, Edge Functions보다 `DB` 기능이 우선 범위다.

## 3. 환경별 운영 원칙

### 개발 환경

- DB: Supabase Free
- 앱 서버: 로컬 Next.js
- AI: mock 또는 부분 real API

목적:

- 실제 영속 저장 검증
- 스키마와 migration 검증
- repository 교체 검증

주의:

- Free 플랜은 pause될 수 있다.
- 개발 중 첫 요청이 느릴 수 있다.

### 운영 환경

- DB: pause 없는 hosted Postgres
- 권장: Supabase paid plan 또는 동급의 always-on hosted Postgres
- 앱 서버: 배포된 Next.js 서버
- AI: OpenAI Responses API

목적:

- 사용자가 접속하지 않아도 데이터가 살아 있는 상태 유지
- 예약 작업, 반복 실행, 운영 로그 관리

## 4. 현재 코드 구조에서의 DB 위치

현재 저장소 진입점은 아래와 같다.

- `lib/db.ts`
- `lib/repositories/contracts.ts`
- `lib/repositories/index.ts`
- `lib/repositories/memory.ts`

현재 상태는 아래와 같다.

- persistence abstraction은 이미 적용되었다.
- route는 저장소 구현 세부를 직접 알지 않게 정리되었다.
- 지금 남은 일은 `memory repository` 대신 `postgres repository`를 붙이는 것이다.

목표 구조는 아래와 같다.

`app/api/* -> repository contract -> postgres adapter -> Supabase Postgres`

## 5. 기술 선택

현재 DB 연동은 아래 조합을 기본값으로 한다.

- DB: Supabase Postgres
- query layer: `pg`
- migration: Supabase CLI + SQL migration files
- seed: `supabase/seed.sql`

이번 단계에서는 `supabase-js`를 기본 DB 접근 수단으로 쓰지 않는다.

이유:

- 현재 앱은 서버에서 repository를 통해 DB 접근하는 구조다.
- `pg`를 사용하면 현재 구조를 거의 유지한 채 교체할 수 있다.
- SQL과 migration을 직접 관리하기 쉽다.

## 6. 연결 전략

Supabase는 환경에 따라 연결 문자열을 다르게 쓸 수 있다.

이 프로젝트의 권장 기준은 아래와 같다.

- 로컬 개발 서버: direct connection 또는 session pooler
- 서버리스 런타임: transaction pooler
- migration / DB 관리 명령: direct connection 우선

환경 변수 초안:

- `REPOSITORY_DRIVER=memory`
- `DATABASE_URL`
- `DATABASE_URL_DIRECT`
- `DATABASE_SSL=true`
- `SUPABASE_PROJECT_REF`

개발 초기에는 아래 두 모드를 번갈아 사용할 수 있어야 한다.

- `REPOSITORY_DRIVER=memory`
- `REPOSITORY_DRIVER=postgres`

## 7. 초기 스키마 범위

Phase 2에서 먼저 만드는 테이블은 아래 4개다.

### `content_ideas`

- id
- source_notes
- theme
- goal
- cta
- angle
- created_at

### `content_drafts`

- id
- idea_id
- platform
- hook
- body
- cta
- status
- created_at

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
- created_at

2차 확장 테이블:

- `agent_runs`

## 8. 실행 계획

### Step 1. Supabase 개발 프로젝트 준비

- Supabase Free 프로젝트를 만든다.
- `project ref`를 확보한다.
- DB 비밀번호와 연결 문자열을 확보한다.
- local `.env.local`에 연결 정보를 넣는다.

완료 기준:

- 로컬 앱에서 Supabase DB에 연결 가능한 상태가 된다.

### Step 2. migration 구조 도입

- `supabase/` 디렉터리를 만든다.
- `supabase/migrations/`를 만든다.
- `supabase/seed.sql`을 추가한다.
- Supabase CLI 초기화 및 프로젝트 링크를 진행한다.

권장 명령:

```bash
npx supabase init
npx supabase link --project-ref <project-ref>
```

완료 기준:

- 스키마 변경이 코드와 함께 버전 관리된다.

### Step 3. 초기 테이블 생성

- `content_ideas`
- `content_drafts`
- `post_results`
- `memory_insights`

위 4개 테이블을 migration SQL로 만든다.

완료 기준:

- `plan / generate / analyze` 흐름에 필요한 최소 테이블이 모두 존재한다.

### Step 4. postgres repository 구현

- `lib/postgres/client.ts`
- `lib/repositories/postgres.ts`

같은 파일을 추가한다.

여기서 아래 인터페이스를 Postgres로 구현한다.

- `IdeaRepository`
- `DraftRepository`
- `PostResultRepository`
- `InsightRepository`

완료 기준:

- `REPOSITORY_DRIVER=postgres`에서 repository contract가 정상 동작한다.

### Step 5. repository driver 전환

- `lib/repositories/index.ts`에서 환경 변수로 adapter를 선택한다.
- `memory`와 `postgres`를 모두 유지한다.

완료 기준:

- 환경 변수만 바꿔 저장소를 교체할 수 있다.

### Step 6. 시나리오 검증

검증 시나리오는 아래와 같다.

1. `/api/plan` 요청 시 `content_ideas` 저장
2. `/api/generate` 요청 시 `content_drafts` 저장
3. `/api/analyze` 요청 시 `post_results`와 `memory_insights` 저장
4. 서버 재시작 후에도 데이터 유지 확인

완료 기준:

- 현재 관리자 UI에서 기존 흐름이 깨지지 않는다.

## 9. 개발 중 운영 규칙

- 평소 개발은 `Supabase Free + postgres repository`를 우선 사용한다.
- Free 프로젝트가 pause되어 응답이 불안정하면 일시적으로 `memory` 모드로 전환한다.
- 스키마 변경은 Dashboard 수동 변경보다 migration 파일을 우선한다.
- seed 데이터는 최소한의 샘플만 유지한다.

## 10. 리스크와 대응

### 리스크 1. Free 플랜 pause

대응:

- 개발 단계에서만 사용한다.
- `memory` fallback을 유지한다.

### 리스크 2. migration 없이 Dashboard에서 직접 수정

대응:

- 반드시 migration 파일로 다시 반영한다.

### 리스크 3. route/service보다 DB 구현이 먼저 커져 구조가 흔들림

대응:

- repository contract 범위를 넘는 로직은 Postgres adapter에 넣지 않는다.

### 리스크 4. 운영 환경에서도 Free를 그대로 사용

대응:

- 운영 전환 시 paid plan 또는 always-on hosted Postgres로 이동한다.

## 11. 현재 결론

이 프로젝트의 DB 전략은 아래와 같이 정리한다.

- 개발: `Supabase Free`
- 운영: `always-on hosted Postgres`
- 구조: `repository abstraction + postgres adapter`
- 목표: `memory demo`를 `지속되는 학습 시스템`으로 전환

즉, 지금 단계에서는 `Supabase를 개발용 호스팅 Postgres`로 붙이는 것이 가장 현실적인 선택이다.
