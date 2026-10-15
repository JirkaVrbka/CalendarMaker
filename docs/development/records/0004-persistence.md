# 0004 — IndexedDB persistence (Dexie)
Date: 2026-10-13

## Assignment
Remember the user's single current calendar automatically — settings (title, start month/year, language,
weekStart, pageSize) AND each page's uploaded photo — so a reload restores everything. Changes autosave;
a "New / Reset" action starts fresh. All local, no accounts/server. (Full spec:
`.claude/assignments.local/0004-persistence.md`.)

## Approach
- **Dexie DB** (`src/features/storage/db.ts`): a single-row `project` table (`{id:'current', version, config}`)
  + an `images` table keyed by slot (`{slot, blob, transform}`).
- **Pure mapping/validation** (`src/features/storage/mapping.ts`, unit-tested, no IndexedDB): serialize ↔
  record, Zod-validate + version-check a loaded record → config or `null` (never throws), map images ↔ records
  (drop malformed). The stored config omits `pages` (rebuilt on load from startMonth/startYear).
- **Thin Dexie service** (`service.ts`): loadAll / saveProjectConfig / putImage / putImageTransform (partial
  update, Blob untouched) / deleteImage / clearAll.
- **Store** gained `hydrate(persisted)` (config → rebuild pages; images → fresh object-URLs), `resetProject()`,
  and a `hydrated` flag. **App** loads on boot → hydrates → shows a loading spinner until done; a store
  subscription debounce-saves config; image blobs persist on add/remove, transforms on a per-slot debounce.

## Key decisions
- Single current calendar + debounced autosave + auto-load (user-chosen); multi-calendar library deferred.
- Manual Dexie integration (not Zustand `persist` middleware) — needed for Blobs + async hydration.
- No new dependency (did NOT add `fake-indexeddb`); risky logic lives in pure functions/store actions that are
  unit-tested; the thin Dexie wrapper is covered by typecheck/build + manual/e2e.

## Outcome & deviations
- **Done, all green:** `npm run test:run` **90/90**, `npm run lint` clean, `npm run build` succeeds (only the
  pre-existing >500 kB chunk advisory).
- Verified by two independent reviewers (gate+fidelity PASS; code review PASS WITH COMMENTS — the critical
  autosave-before-hydrate guard confirmed correct end-to-end incl. StrictMode double-mount; `service.ts` table
  ops and object-URL lifecycle confirmed) and re-run by the manager.
- Post-review fixes applied: **(1)** two transform-save races fixed — per-slot debounce timers (no longer one
  shared timer that dropped a slot's pending save on page switch) + cancel the pending save when a photo is
  replaced/removed + clear timers on unmount; **(2)** storage tidy — Reset no longer wipes-then-re-saves
  (suppress-once), stored config strips the redundant `pages` (tolerant schema), stale comments/docstrings
  fixed; **(3)** added `src/App.test.tsx` covering the boot loading→loaded transition and the New/Reset flow
  (86 → 90 tests).
- Known/deferred: the thin Dexie wrapper has no unit test (jsdom lacks IndexedDB; no dep added) — real
  read/write is verified manually and a candidate for a later Playwright e2e; multi-calendar library remains a
  future slice.
- No commit made — changes staged for the user.
