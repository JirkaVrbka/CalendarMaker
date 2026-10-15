# Testing Conventions

- **TDD:** no production code before a failing test exists (red → green → refactor).
- **Behaviour-named tests:** `highlights Saturday and Sunday in the month grid`, not `test_grid`.
- Test behaviour (calendar/date math, weekend highlighting, start-month shifting, saved-project
  serialization, PDF page assembly), not framework glue; mock external/browser deps only where needed.
- One logical assertion per test; no shared mutable state.
- Apply SOLID/DRY at the **refactor** step; Rule of Three before abstracting.

## Commands

- Unit/component (Vitest + React Testing Library): `npm run test` (watch) · `npm run test:run` (once).
- End-to-end key flows (Playwright): `npm run e2e` — browsers installed once via `npx playwright install`.
- Definition of done: `npm run test:run`, `npm run lint`, and `npm run build` all green.
