# KGP PAWS — CMS Operations

Living document. Last updated **2026-07-17**. Companion to
[CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md) (design) and
[GOOGLE_SHEETS_SCHEMA.md](GOOGLE_SHEETS_SCHEMA.md) (column contract). This document covers the
operational side: the sync dashboard, how the schema evolves without breaking sync, and backup /
disaster recovery.

---

## 1. Sync Dashboard — `/admin/sync` (ships in M-CMS-6)

One page, four zones. Live-updating via a Supabase Realtime subscription to `sync_jobs` — jobs
stream in without refresh.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  Sync Dashboard                                        [Sync Everything ▸] [⟳]   │
├──────────────────────────────────────────────────────────────────────────────────┤
│  ZONE 1 — HEALTH STRIP                                                           │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐         │
│  │ LAST FULL      │ │ QUEUE          │ │ CONFLICTS     │ │ MEDIA         │        │
│  │ SWEEP          │ │ 2 queued       │ │ 3 open        │ │ 1 broken      │        │
│  │ 6 min ago  ✅  │ │ 1 running      │ │ ⚠ review      │ │ 4 unresolved  │        │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘         │
│  Each card links to the zone below it. Red state (❌) when: sweep > 1 h old,     │
│  queue > 20, any conflict > 24 h old, any broken media.                          │
├──────────────────────────────────────────────────────────────────────────────────┤
│  ZONE 2 — PER-TAB HEALTH                                    [filter: category ▾] │
│  ┌────────────────┬──────────┬─────────────┬─────────┬────────┬───────────────┐  │
│  │ Tab            │ Category │ Last success│ DB rows │ Status │ Actions       │  │
│  ├────────────────┼──────────┼─────────────┼─────────┼────────┼───────────────┤  │
│  │ Home           │ Content  │ 6 min ago   │ 8       │ ✅ OK  │ [Sync ▸][Full]│  │
│  │ Dogs           │ Master   │ 6 min ago   │ 9       │ ✅ OK  │ [Sync ▸][Full]│  │
│  │ Medical History│ Txn      │ 41 min ago  │ 11      │ ⚠ 2 ERR│ [Sync ▸][Full]│  │
│  │ Reports        │ Txn      │ 6 min ago   │ 2       │ ✅ OK  │ [Sync ▸]      │  │
│  │ …              │          │             │         │        │               │  │
│  └────────────────┴──────────┴─────────────┴─────────┴────────┴───────────────┘  │
│  "⚠ n ERR" = n rows currently carrying _sync_status=ERROR in the sheet; click    │
│  opens the row list with each _last_error. [Full] = Force full re-sync           │
│  (confirmation dialog: explains it re-reads every row).                          │
├──────────────────────────────────────────────────────────────────────────────────┤
│  ZONE 3 — JOB STREAM (live)                       [state: all ▾] [tab: all ▾]    │
│  ● running   Dogs · sheets_to_db · incremental · started 00:12 ago · cron        │
│  ✅ succeeded Home · sheets_to_db · 3 read / 1 written / 0 conflicts · 1.2 s     │
│  ❌ failed    Vaccination · attempt 2/4 · next retry in 8 min      [Retry now]   │
│     └─ expandable: last_error JSON, per-row errors, link to sheet row            │
│  ⚠ conflict  Reports · 1 row_version_mismatch                    [Open inbox]    │
│  … last 100 jobs, newest first; failed jobs pinned above succeeded ones          │
├──────────────────────────────────────────────────────────────────────────────────┤
│  ZONE 4 — CONFLICT INBOX (3 open)                                                │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │ Reports · PAWS-RESCUE-2026-00128 · row_version_mismatch · 2 h ago          │  │
│  │ ┌──────────── Sheet says ───────────┐  ┌──────────── DB says ────────────┐ │  │
│  │ │ Status: Resolved                  │  │ Status: Treatment Started       │ │  │
│  │ │ Assigned: Priya                   │  │ Assigned: Rahul                 │ │  │
│  │ └───────────────────────────────────┘  └─────────────────────────────────┘ │  │
│  │ Only differing fields shown.   [Keep Sheet]  [Keep DB]  [Dismiss]          │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│  Broken-media conflicts render the missing path + [Re-ingest] instead.           │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Interaction notes**

- **Sync Everything** enqueues one incremental job per enabled `sheets_to_db` tab (dedup makes
  double-clicks harmless).
- **Retry now** re-enqueues a failed job immediately (resets `next_run_at`), preserving the
  attempt counter. After `max_attempts`, only this button can revive a job — no infinite retry.
- **Resolve actions** call `POST /api/sync/resolve`; resolving as *Keep Sheet* applies the sheet
  payload and bumps `row_version`; *Keep DB* pushes the DB row back to the sheet.
- **Empty states**: fresh install shows "No sync jobs yet — press Sync Everything after sharing
  the spreadsheet with the service account", with the service-account email displayed for
  copy-paste.
- All data comes from `sync_jobs`, `sync_conflicts`, `tab_config`, and per-tab
  `count(*) where sync_status='error'` — no new tables needed for the dashboard.

---

## 2. Schema evolution strategy

The contract that keeps evolution safe: **business columns are matched by header name, not
position** (system columns A–H are positional; everything from column I is order-independent),
and the header check aborts a run on any unknown/missing name — so drift is always caught, never
silently mis-mapped.

### 2.1 Adding a column to an existing tab

Three phases, each independently deployable, in this order:

| Phase | Where | Action | Sync behavior during this phase |
|---|---|---|---|
| 1 | Supabase | Additive migration: `alter table … add column … null` (or with a default). | Unchanged — engine doesn't know the column yet. |
| 2 | Code | Update the tab's handler: add the column to the header spec as **optional**, extend the Zod schema and mapper. Deploy. | Engine now *accepts* the column but the sheet doesn't have it yet — missing optional headers are allowed (only *unknown* headers abort). |
| 3 | Sheet | Append the column at the end of the tab (never insert between existing columns). | Next sync picks it up. |

Rollback at any phase is the reverse order. A column added in the sheet *before* phase 2 ships
is an unknown header → `header_mismatch` → run aborts loudly. That's the tripwire working as
designed, not a failure mode to engineer away.

### 2.2 Removing a column

Never remove-in-place. Sequence: (1) handler marks the column deprecated (accepted, ignored,
logged); (2) after a release cycle, delete the sheet column; (3) handler drops it from the
spec; (4) DB column is dropped only after an audit-log review confirms nothing read it —
usually much later, since DB columns are cheap.

### 2.3 Renaming a column

A rename is an **add + migrate + remove**, never an in-place rename: add the new column
(§2.1), have the handler read old-or-new during the transition, backfill, then remove the old
one (§2.2). In-place renames break the header check by construction — treat that as a feature.

### 2.4 Adding a new tab

1. DB: migration creating the table(s) + `stg_` mirror + RLS + a `tab_config` seed row with
   `enabled = false`.
2. Code: tab handler (`lib/sync/tabs/<tab>.ts`) + registration; deploy.
3. Sheet: create the tab; the engine's first run writes headers + protected ranges.
4. Flip `tab_config.enabled = true` (one-row UPDATE — the kill switch doubles as the launch
   switch).

### 2.5 Retiring a tab

`tab_config.enabled = false` stops sync immediately (jobs for it fail fast with `tab_disabled`).
The DB table and sheet stay readable. Actual deletion is a deliberate later migration.

### 2.6 Enum / dropdown changes

Postgres enums are **additive-only** (`alter type … add value`). Sequence: DB migration → Zod
enum update → `Reference — *` tab row added (updates the sheet dropdown). Removing an enum
value follows §2.2's deprecate-first pattern.

### 2.7 Staging tables and the archive policy

- `stg_*` tables are recreated by the same migration that alters their live table (`drop` +
  `create … (like …)`) — they hold no durable data, so this is free.
- Archive policies live in `tab_config.archive_policy` (JSONB). Adding a new policy *kind*
  is a code change to the archival evaluator; changing a tab's policy is a one-row UPDATE.
  The engine treats an unknown `kind` as `manual` (safe default) and flags it in the dashboard.

### 2.8 Version markers

Every schema-affecting change increments the tab's header hash implicitly (the header row
changed). If a future need arises to coordinate multi-step rollouts, `tab_config` gains a
`schema_version int` compared by the handler — reserved, not built until needed.

---

## 3. Backup & disaster recovery

### 3.1 What is authoritative where (drives everything below)

| Data | Source of truth | Mirrored in | Consequence |
|---|---|---|---|
| Content + Master Data | Google Sheets | Supabase (full mirror via sync) | Either side can rebuild the other. |
| Transaction Data (public-submitted) | **Supabase only** | Sheets (workflow view) | **DB backups are the crown jewels** — applications, donations, reports exist nowhere else in full fidelity (sheet copies omit private fields). |
| Media originals | Google Drive | Supabase Storage (optimized variants) | Mutual backup: originals in Drive, derived in Storage, linked by `drive_assets` checksums. |
| Schema + config | Git (`supabase/migrations/`, `tab_config` seeds) | Live DB | A fresh project is reproducible from the repo. |
| Audit trail | `content_audit_log` (append-only) | — | Included in DB backups; enables point-in-time reconstruction of any content row. |

### 3.2 Backup mechanisms, RPO / RTO

| System | Mechanism | Frequency | Retention | RPO | RTO |
|---|---|---|---|---|---|
| Supabase Postgres | **(a)** Migrations in git (schema) — continuous. **(b)** Logical dump (`pg_dump`) to encrypted storage — the free tier has **no** guaranteed automated backups, so this is on us until the Pro upgrade. Scheduled via GitHub Actions once dep #1 (repo) lands; manual `supabase db dump` weekly until then. | nightly (target) | 30 days | ≤ 24 h | ~1 h (restore dump into fresh project + re-point env vars) |
| Google Sheets | **(a)** Native revision history (Google keeps fine-grained versions ~30 days). **(b)** Weekly snapshot: engine exports every tab as CSV to Supabase Storage `backups/sheets/<date>/`. **(c)** The DB itself is a live mirror of all content tabs. | continuous + weekly | 30 d (native) / 12 weeks (CSV) | minutes (native) | minutes (restore version) to ~1 h (rebuild from DB) |
| Google Drive media | **(a)** Google's own durability + Drive trash (30 days). **(b)** Optimized copies already in Supabase Storage. **(c)** `drive_assets` manifest (checksums + paths) makes loss *detectable* — the nightly broken-media job is also the backup-integrity check. | continuous | 30 d trash | 0 (copies exist) | re-ingest cycle (~15 min) |
| Supabase Storage | Derived data — losable by definition. Rebuilt from Drive originals via full re-ingest. | n/a | n/a | n/a | one full ingest run |
| Secrets (service-account key, cron secret, API keys) | Vercel env vars + owner's password manager. **Never in git.** Rotation runbook in [DEPLOYMENT.md](DEPLOYMENT.md); 90-day schedule. | on rotation | current + previous | — | minutes |

### 3.3 Disaster scenarios & runbooks

**S1 — Spreadsheet deleted or catastrophically mangled.**
Restore from Drive trash / version history (minutes). If unrecoverable: create a blank
spreadsheet, share it to the service account, run the **rebuild-from-DB exporter** (M-CMS-7
tool: writes headers, protected ranges, and every non-archived row from Supabase — possible
precisely because the DB fully mirrors content). Update `GOOGLE_SHEETS_SPREADSHEET_ID`. Loss: at
most edits made after the last successful sync.

**S2 — Bad bulk edit synced to production** (volunteer pastes over 50 rows; sync applies it).
The site now shows wrong content, but nothing is lost: every applied change is in
`content_audit_log` with old values. Runbook: identify the sync job in the dashboard → M-CMS-7's
revert tool replays the job's diffs backwards (or, before that tool exists: restore the sheet
rows via Sheets version history and force a full re-sync). Prevention is layered ahead of cure:
validation, protected ranges, and per-run row caps (a run touching > 30 % of a tab's rows
pauses as `conflict` for admin confirmation — M-CMS-7 hardening).

**S3 — Supabase project lost or corrupted.**
Create a new project → run migrations `0001`–`000N` from git → restore the latest logical dump
(transaction data + audit log) → force full re-sync of all content tabs from Sheets (content
returns from its source of truth) → full media re-ingest from Drive → update env vars in
Vercel. Transaction rows created after the last dump are lost — this is why the dump cadence
is the single most important number in this document, and why upgrading to Supabase Pro
(automated daily backups + PITR) is recommended before public launch (flagged in TASKS dep list).

**S4 — Storage bucket wiped.**
No data loss (originals in Drive). Run full ingest; `drive_assets` checksums make it exactly
reproducible. Public pages degrade to illustrated-portrait fallbacks in the meantime.

**S5 — Service-account key leaked.**
Revoke the key in Google Cloud console (invalidates it everywhere at once) → issue new key →
update `GOOGLE_SERVICE_ACCOUNT_JSON` in Vercel → redeploy. Blast radius by construction:
Editor on one spreadsheet, Viewer on media folders — no Gmail, no wider Drive, no Supabase
access. Audit Sheets revision history for the exposure window; `content_audit_log` shows
whether anything unexpected synced through.

### 3.4 Drills

M-CMS-7 includes one rehearsal of S1 and S3 against a scratch Supabase project + copy
spreadsheet, with timings recorded here. A backup that has never been restored is a hope, not
a backup.

## Change history

| Date | Change |
|---|---|
| 2026-07-17 | Initial version — architecture-review deliverables 5 (dashboard wireframe), 6 (schema evolution), 7 (backup & DR). |
