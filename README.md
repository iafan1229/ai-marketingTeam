# HealthLog AI Marketing Team

HealthLog AI Marketing Team의 초기 MVP 저장소다.

현재 포함된 내용:

- PRD 문서
- Codex 메인/서브 에이전트 작업 분담 문서
- Next.js App Router 기반 초기 구조
- `plan / generate / analyze` API
- 수동 루프 검증용 관리자 화면

관련 문서:

- [PRD](./docs/prd/README.md)
- [Codex Multi-Agent Working Plan](./docs/prd/codex-multi-agent-workflow.md)
- [Mock to Real Transition Plan](./docs/prd/mock-to-real-transition-plan.md)
- [DB Architecture & Execution Plan](./docs/prd/db.md)

## 프로젝트가 하는 일

이 프로젝트는 아래 흐름을 한 화면에서 검증하는 도구다.

1. Planner가 메모를 읽고 오늘 올릴 주제 후보를 만든다.
2. Copywriter가 선택한 주제로 게시글 초안을 만든다.
3. Analyst가 성과 수치를 읽고 다음 전략을 요약한다.

현재는 `AI 생성 로직은 mock 함수 기반`, `저장소는 memory 또는 Supabase Postgres` 중 선택 가능한 상태다.

## 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 저장소 모드 선택

가장 빨리 확인하려면 `memory` 모드로 시작하면 된다.

프로젝트 루트에 `.env.local`을 만들고 아래 중 하나를 넣는다.

`memory` 모드:

```env
REPOSITORY_DRIVER=memory
```

`postgres` 모드:

```env
REPOSITORY_DRIVER=postgres
DATABASE_URL=...
DATABASE_URL_DIRECT=...
DATABASE_SSL=true
SUPABASE_PROJECT_REF=...
```

### 3. Supabase를 쓰는 경우 첫 1회 DB 준비

`postgres` 모드라면 migration을 먼저 올려야 한다.

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npm run db:push
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`을 연다.

## 화면 사용 방법

화면은 아래 순서로 쓰면 된다.

### 1. Source Notes 입력

- 앱 업데이트
- 사용자 피드백
- 관찰 메모

를 textarea에 적는다.

예시:

```text
최근 업데이트:
- 세트 입력 UX 단순화
- 쉬는시간 기록 흐름 개선

사용자 피드백:
- 운동 기록 앱은 너무 복잡하다
- 한 손으로 빠르게 기록하고 싶다
```

그 다음 `주제 추천 받기`를 누른다.

### 2. Planned Ideas 선택

Planner가 추천한 주제 3개 중 하나를 고른다.

그 다음 `초안 생성하기`를 누른다.

### 3. Drafts 확인

Copywriter가 만든 초안 목록이 나온다.

- 원하는 초안을 읽는다.
- `분석 입력에 연결` 버튼으로 Analyst 입력 텍스트에 붙인다.

### 4. 성과 수치 입력

오른쪽 Analyst 입력 영역에서 아래 값을 넣는다.

- `platform`
- `likes`
- `comments`
- `saves`
- `impressions`
- `notes`

그 다음 분석 실행 버튼을 누른다.

### 5. Analysis 확인

Analyst가 아래 내용을 요약한다.

- 잘된 훅 패턴
- 약한 패턴
- 다음 전략

## 저장소 모드 설명

### `memory`

- 가장 빠르게 데모를 확인할 수 있다.
- 서버를 재시작하면 데이터가 사라진다.
- UI 흐름 검증용으로 적합하다.

### `postgres`

- Supabase Postgres에 데이터를 저장한다.
- 서버를 재시작해도 데이터가 남는다.
- 실제 영속 저장, migration, repository 교체를 검증할 수 있다.

## 자주 쓰는 명령어

```bash
npm run dev
npm run lint
npm run db:push
npm run db:reset
npm run db:status
```

## 현재 상태

이 버전은 `운영 자동화`보다 `manual loop 검증`에 초점을 둔 scaffold다.

현재 기준:

- Planner / Copywriter / Analyst 로직은 mock 함수 기반
- 저장소는 `memory` 또는 `Supabase Postgres`
- 관리자 UI에서 handoff 흐름을 직접 검증 가능

다음 단계:

- OpenAI Responses API 연결
- Supabase Postgres 연결
- 게시 성과 히스토리 조회
- 발행 큐 또는 예약 발행
