# Phase 1 Foundation — Verification Checklist

> Status as of 2026-04-19 (commit `4450212`)  
> Maintained by: repo steward. Update after each manual run.

---

## Repo-side checks (CI-verifiable, no local services needed)

| Check | Command | Status | Notes |
|---|---|---|---|
| Lockfile integrity | `pnpm install --frozen-lockfile` | ✅ Pass | All 9 workspaces, pnpm 9.15.9 |
| TypeScript compilation | `pnpm typecheck` | ✅ Pass | 7/7 tasks, 0 errors |
| Lint | `pnpm lint` | ⚠️ No-op | No `lint` scripts yet — expected (Phase 2) |
| Tests | `pnpm test` | ⚠️ No-op | No test scripts yet — expected (Phase 2) |

All green / expected warnings. Repo is valid scaffold.

---

## Manual local checks (require Docker + running services)

Run these once after cloning on a fresh machine or after pulling Phase 1 for the first time.

### 1. Start infrastructure

```bash
cp .env.example .env
# Fill in all values in .env (see comments in file)

docker compose up -d
```

Expected outcome:
- `wsp-postgres` container: healthy (pg_isready passes within ~10s)
- `wsp-n8n` container: running, starts only after postgres is healthy
- No `depends_on` errors in docker compose logs

### 2. Verify PostgreSQL

```bash
docker compose ps
# wsp-postgres should show "healthy"

docker compose exec postgres psql -U postgres -c "\l"
# Expected: databases "wsp_commerce" and "n8n" listed
```

`infra/postgres/01-init.sql` creates the `n8n` database automatically on first startup.

### 3. Verify n8n

```bash
# Open in browser:
http://localhost:5678
```

Expected: n8n setup/login page loads. No basic auth prompt (removed in F-2).  
First run: n8n will ask to create an owner account (one-time local setup).

> **Verify n8n image exists before first run:**  
> `docker pull n8nio/n8n:1.88.0`  
> If `1.88.0` is not available, check https://hub.docker.com/r/n8nio/n8n/tags and update `docker-compose.yml` to the latest `1.x` tag.

### 4. Verify CI pipeline

After pushing to `main`, check GitHub Actions:

```
Repository → Actions → "CI" workflow
```

Expected: `install → typecheck` passes. No push to `main` should be made with a red CI.

> **Manual GitHub action still pending:**  
> Set default branch from `master` to `main` (Repository Settings → Branches).  
> Delete `origin/master` once default branch is switched.

---

## Phase 1 task completion matrix

| ID | Task | Committed | Verified |
|---|---|---|---|
| A-1 | `pnpm-workspace.yaml` | ✅ | ✅ |
| A-2 | Workspace `package.json` stubs (8 packages) | ✅ | ✅ |
| B-1 | Branch rename `master → main`, push origin | ✅ | ✅ |
| C-1 | `turbo.json` — remove invalid keys, add `type-check` task | ✅ | ✅ |
| C-2 | Root `package.json` — `packageManager`, `typecheck` script | ✅ | ✅ |
| D-1 | `packages/config/tsconfig.base.json` — shared TS base | ✅ | ✅ |
| D-2 | All workspace `tsconfig.json` files extend base | ✅ | ✅ |
| E-1 | `.github/workflows/ci.yml` — trigger main, typecheck step | ✅ | ✅ (structure) |
| F-1 | `docker-compose.yml` — postgres healthcheck | ✅ | Manual |
| F-2 | `docker-compose.yml` — n8n pinned, depends_on healthy | ✅ | Manual |
| F-3 | `infra/postgres/01-init.sql` — CREATE DATABASE n8n | ✅ | Manual |
| G-1 | `.env.example` — all vars documented | ✅ | ✅ |
| H-1 | `docs/decisions/001-api-style.md` — ADR REST vs tRPC | ✅ | ✅ |
| H-2 | `docs/decisions/002-orm-strategy.md` — ADR Prisma | ✅ | ✅ |
| I-1 | `docs/product-model.md` — `product_type` enum + routing | ✅ | ✅ |
| J-1 | This checklist + basis-checks run | ✅ | ✅ |

**16/16 tasks committed. Manual checks (F-1, F-2, F-3, E-1 CI run) pending local execution.**
