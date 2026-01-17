# Testing

## Quick Commands

- Lint: `npm run lint`
- E2E (Playwright): `npm run test:e2e`

## Playwright Notes

- The Playwright config starts the Vite dev server automatically on `http://127.0.0.1:5173`.
- Tests live in `tests/e2e` and use Playwright's `baseURL` for navigation.
- If a run fails locally, try:
  - `npx playwright install`
  - `npx playwright test --debug`
