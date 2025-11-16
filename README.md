# CaseFlow

“Import → Validate → Fix → Submit → Track” — a full-stack reference implementation that lets operations teams bulk-create cases safely.

## Architecture overview

```mermaid
graph TD
  subgraph Client
    UI[React + Vite]
    State[Zustand stores]
    Grid[Virtualized grid (TanStack Table + React Virtual)]
  end

  subgraph API
    Express[Express + Prisma]
    Auth[JWT auth + refresh tokens]
    Imports[Chunked import service]
    Cases[Cases service w/ pagination]
  end

  subgraph Infra
    Postgres[(PostgreSQL)]
    Queue[CaseImport audit tables]
    Logging[Structured logging + Sentry]
  end

  UI -->|REST / JSON| Express
  Express -->|ORM| Postgres
  Imports --> Queue
  Express --> Logging
```

- **Frontend** (Vite + React + TS) handles CSV parsing, schema mapping, validation, grid editing, chunked uploads, cases list/detail, and i18n scaffolding.
- **Backend** (Express + Prisma + PostgreSQL) exposes auth, import, and case APIs, enforces validation, chunks import processing, and records audit trails.
- **State**: Zustand (auth/import), React Query (cases/import jobs), TanStack Table + Virtual for 50k-row grids.
- **Observability**: Structured logs (Pino), health endpoint (`/api/health`), optional Sentry DSN hook.
- **CI/CD**: GitHub Actions runs lint, type-check, tests, build on every push/PR. Dockerfiles for FE/BE + `docker-compose` for one-command local spin-up.

## Local development

1. **Prereqs**: Node 20+, npm 10+, Docker.
2. **One-command start** (preferred):
   ```bash
   docker compose up --build
   ```
   - Frontend → http://localhost:5173
   - Backend → http://localhost:4000/api
   - Postgres → localhost:5432 (`caseflow` / `caseflow`).
3. **Manual dev** (hot reload):
   ```bash
   npm install          # installs workspace deps
   npm run dev --workspace app/backend &
   npm run dev --workspace app/frontend
   ```
4. Seed an admin user via Prisma Studio or SQL insert (see `prisma/schema.prisma`).

## Design decisions & tradeoffs

- **Headless grid**: TanStack Table + Virtual instead of heavyweight AG Grid to keep bundle lean, all styling accessible, and full control over editing/virtualization. Drag/drop column order can be layered later via `@dnd-kit` if needed.
- **Chunked imports**: Frontend validates + normalizes rows, backend re-validates and enforces uniqueness/audit per chunk. Simpler than streaming uploads yet resilient (chunk retries supported client-side).
- **Validation**: Shared Zod schemas server-side; client mirrors rules to deliver instant feedback. Backend remains source of truth.
- **State separation**: Auth in persisted Zustand store; import workspace in dedicated store to avoid React re-renders. React Query handles server data pagination/cache.
- **Auth**: Stateless JWT access tokens + short-lived refresh tokens stored in DB for revocation. Could be swapped for session cookies if needed.
- **Infra**: Docker-first; Compose wires frontend/backend/postgres. Terraform/CDK hooks can be layered later for AWS deployments.

## Performance notes

- Virtualized grid renders only visible rows (~40px each) enabling smooth scrolling past 50k rows.
- CSV parsing runs in a Web Worker via PapaParse to keep UI thread responsive.
- Client-side fix helpers trim/title-case/normalize in batches to avoid re-validation loops.
- Backend chunk handler processes rows inside a single Prisma transaction per chunk with batched inserts + case upserts.
- Cursor-based pagination keeps `/cases` queries O(page-size) regardless of table size.

## Security notes

- Strong password hashing (bcrypt) + env-configurable JWT secrets.
- Refresh tokens stored server-side (revocable) with TTL + rotation.
- CORS locked down via `ALLOWED_ORIGINS`; HTTP-only cookies optionally carry tokens for browsers.
- Helmet, compression, rate-limiting ready (middleware stubbed for extension), and OWASP-friendly input validation everywhere (Zod + Prisma).
- Audit trail stored per import (`CaseImport`, `CaseImportRow`, `CaseImportError`, `ImportAudit`) capturing who imported what and when.
- Optional Sentry DSN for error tracing; structured logs for all requests/errors.

## Testing strategy

| Layer      | Tools / Coverage |
|------------|------------------|
| Backend    | Vitest unit tests for schema/normalization, Prisma-driven service layer stubs. Future work: add integration tests hitting an ephemeral Postgres (see CI service). |
| Frontend   | Vitest + RTL for stores/components, Playwright E2E smoke (`npm run e2e`). |
| CI         | `.github/workflows/ci.yml` runs lint → typecheck → test → build for every push/PR with Postgres service. |

Run locally:
```bash
npm run lint
npm run typecheck
npm run test
npm run e2e # requires dev server running
```

## Deployment

- **Frontend**: Build `app/frontend` and ship `/dist` to S3+CloudFront or Vercel (Dockerfile ready for any registry).
- **Backend**: Build `app/backend` image → push to AWS ECS/Fargate/Render. Entry command already runs `prisma migrate deploy` before `node dist/index.js`.
- **Database**: PostgreSQL 16+ (managed RDS/Supabase). Apply migrations via `npx prisma migrate deploy`.
- **Env vars**:
  - `DATABASE_URL`
  - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
  - `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL`
  - `ALLOWED_ORIGINS`
  - `SENTRY_DSN` (optional)

## API & tooling

- REST base: `/api`
- Auth: `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/register`, `/auth/me`
- Imports: `/imports`, `/imports/:id`, `/imports/:id/chunks`, `/imports/:id/errors`
- Cases: `/cases`, `/cases/:id`, `/cases/:id/notes`
- Health: `/health`
- OpenAPI: `app/backend/openapi.yml` (import into Postman/Insomnia).

## Sample data

- Clean dataset → `data/sample-clean.csv`
- Error dataset → `data/sample-errors.csv`

Use them with the import UI to verify validation/fix flows.

## Observability

- `GET /api/health` for liveness.
- Structured logging via Pino (JSON) — forward to CloudWatch/ELK.
- Sentry hook for error tracing by setting `SENTRY_DSN`.

## Roadmap / next steps

1. Add optimistic UI & retry queue for chunk submissions + background workers.
2. Expand test coverage (backend service integration, grid interactions, E2E import flow once backend is available in CI).
3. Terraform/CDK to provision AWS infra (ECS + RDS + CloudFront) with IaC review.
4. Dark mode + localization extraction (strings already namespaced in i18n setup).
5. Case assignment workflows + notifications (WebSocket/SSE) for real-time tracking.
