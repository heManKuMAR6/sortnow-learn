# Tests

Four suites. None is part of `npm test` yet; run them by hand before a release.

| Suite | What it proves | Needs |
| --- | --- | --- |
| `unit/logic.test.mjs` | Timezone days, streak maths, redirect validator | Node 22 |
| `db/schema.test.mjs` | `supabase/schema.sql` on a real Postgres engine: tamper-proofing, rewards graded and paid only through the catalog, timezone lock, jobs admin-only, delete account, safe to re-run | `@electric-sql/pglite` |
| `db/rpc-contract.test.mjs` | The real `supabase-js` client against the schema: argument names, result shapes, error messages the app maps to 404/400 | `@electric-sql/pglite` |
| `e2e/*.mjs` | Browser journeys in preview mode: `regression` (lead form to profile), `jobs` (members-only board, full JD, admin), `security` (forged cookies, redirects, coach, progress isolation, tries and streak, deletion, midnight), `audience` (notes gate, consent, admin console and exports, unsubscribe, audit events) | `playwright`, the app running |

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
node tests/e2e/audience.mjs      # run after regression: it needs the leads that suite saves
# no browser installed? CHROMIUM=/path/to/chromium node tests/e2e/...
# audience.mjs also starts a stand-in mail server on port 4010; start the app with
#   RESEND_API_KEY=testkey12345 NEWSLETTER_FROM='Test <news@example.com>' RESEND_API_URL=http://localhost:4010 ALLOW_DEMO_MODE=1 ADMIN_EMAILS=admin@example.com npx next start -p 3100
```

`BASE_URL` points the e2e suites at another address. `SHOTS=/some/dir` saves screenshots. The e2e suites write test accounts to `data/` (gitignored).

Not covered: real email delivery, OAuth, hosted avatar upload, video playback, a live Supabase project, and a full accessibility audit.
