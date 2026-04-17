# HealthLog AI Marketing Team

HealthLog AI Marketing Team의 초기 MVP 저장소다.

현재 포함된 내용:

- PRD 문서
- Codex 메인/서브 에이전트 작업 분담 문서
- Next.js App Router 기반 초기 구조
- mock 기반 `plan / generate / analyze` API
- 수동 루프 검증용 관리자 화면

관련 문서:

- [PRD](./docs/prd/README.md)
- [Codex Multi-Agent Working Plan](./docs/prd/codex-multi-agent-workflow.md)
- [Mock to Real Transition Plan](./docs/prd/mock-to-real-transition-plan.md)
- [DB Architecture & Execution Plan](./docs/prd/db.md)

## 시작 방법

1. 의존성을 설치한다.
2. 개발 서버를 실행한다.

```bash
npm install
npm run dev
```

## 현재 상태

이 버전은 외부 AI API 없이 흐름을 검증하기 위한 scaffold다.

다음 단계:

- OpenAI Responses API 연결
- Supabase Postgres 연결
- 게시 성과 히스토리 조회
- 발행 큐 또는 예약 발행
