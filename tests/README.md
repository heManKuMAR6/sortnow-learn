# Tests

Four suites. None is part of `npm test` yet; run them by hand before a release.

| Suite | What it proves | Needs |
| --- | --- | --- |
| `unit/logic.test.mjs` | Timezone days, streak maths, redirect validator | Node 22 |
| `db/schema.test.mjs` | `supabase/schema.sql` on a real Postgres engine: tamper-proofing, rewards graded and paid only through the catalog, timezone lock, jobs admin-only, delete account, safe to re-run | `@electric-sql/pglite` |
| `db/rpc-contract.test.mjs` | The real `supabase-js` client against the schema: argument names, result shapes, error messages the app maps to 404/400 | `@electric-sql/pglite` |
| `e2e/*.mjs` | Browser journeys in preview mode: `regression` (sign-up to profile), `jobs` (public vs admin), `security` (forged cookies, redirects, coach, progress isolation, challenge claim, deletion, midnight) | `playwright`, the app running |

```bash
npm i --no-save @electric-sql/pglite playwright

node --experimental-strip-types --no-warnings tests/unit/logic.test.mjs
node tests/db/schema.test.mjs
node tests/db/rpc-contract.test.mjs

# e2e: build, then start with the preview login switched on (it is off in production by default)
npm run build
ALLOW_DEMO_MODE=1 ADMIN_EMAILS=admin@example.com npx next start -p 3100 &
node tests/e2e/regression.mjs
node tests/e2e/jobs.mjs
node tests/e2e/security.mjs      # takes a few minutes; the coach test makes 24 calls
```

`BASE_URL` points the e2e suites at another address. `SHOTS=/some/dir` saves screenshots. The e2e suites write test accounts to `data/` (gitignored).

Not covered: real email delivery, OAuth, hosted avatar upload, video playback, a live Supabase project, and a full accessibility audit.
