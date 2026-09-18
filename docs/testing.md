# Testing

---

## Table of Contents <!-- omit in toc -->

- [Testing](#testing)
  - [Introduction](#introduction)
  - [What the suite covers](#what-the-suite-covers)
  - [Requirements](#requirements)
  - [Running tests](#running-tests)
  - [Before you commit](#before-you-commit)
  - [How the helpers work](#how-the-helpers-work)
  - [CI](#ci)

---

## Introduction

E2E tests use [Playwright](https://playwright.dev/) and run against a **real
backend** ([link-yo-self-be](https://github.com/kaandinler/link-yo-self-be)) on
a real PostgreSQL database. Nothing is mocked: a failing test means the product
is broken, not that a fixture drifted.

Every test creates its own user through the API, so the suite runs in parallel
and no test depends on data left behind by another.

## What the suite covers

| File                                                     | Covers                                                            |
| -------------------------------------------------------- | ----------------------------------------------------------------- |
| `playwright-tests/auth/sign-up.spec.ts`                  | Registration, password rules, duplicate username                  |
| `playwright-tests/auth/sign-in.spec.ts`                  | Sign in, post-login routing, wrong password, guest guard          |
| `playwright-tests/auth/email-verification.spec.ts`       | Confirmation link, invalid token, settings warning                |
| `playwright-tests/auth/password-reset.spec.ts`           | Forgot password → email → new password → sign in                  |
| `playwright-tests/profile/public-profile.spec.ts`        | Public page, 404, profile view counter                            |
| `playwright-tests/profile/public-profile-mobile.spec.ts` | Phone width: measured text contrast, touch targets, no overflow   |
| `playwright-tests/profile/public-profile-seo.spec.ts`    | Rendered head: canonical, og:url, generated card, JSON-LD, robots |
| `playwright-tests/profile/sitemap-shards.spec.ts`        | Sitemap index and shards serve XML, not an HTML 404               |
| `playwright-tests/profile/links.spec.ts`                 | Empty state, creating a link, `?new=1`, auth guard                |
| `playwright-tests/profile/onboarding.spec.ts`            | Where the wizard sends you when it ends                           |
| `playwright-tests/profile/activity-chart.spec.ts`        | Daily activity chart, range switch, table view, keyboard          |
| `playwright-tests/profile/link-breakdown.spec.ts`        | Per-link sparklines, shared scale, table view                     |
| `playwright-tests/profile/analytics-mobile.spec.ts`      | Phone width: axis labels, link titles, no overflow                |
| `playwright-tests/profile/links-mobile.spec.ts`          | Phone width: titles, arrow reordering, sticky modal footer        |
| `playwright-tests/profile/traffic-sources.spec.ts`       | Referrer in a real browser; clicks with JS blocked; middle click  |
| `playwright-tests/profile/best-times.spec.ts`            | Weekday/hour bars, browser time zone, no claim on thin data       |
| `playwright-tests/profile/date-range.spec.ts`            | Custom range: request query, echoed range, refused input          |
| `playwright-tests/profile/customize.spec.ts`             | Theme/background, preview, validation                             |
| `playwright-tests/profile/profile-edit.spec.ts`          | Name, password change, email change flow                          |
| `playwright-tests/profile/profile-fields.spec.ts`        | Display name, bio, page details, social links                     |
| `playwright-tests/profile/account.spec.ts`               | Closing your own account                                          |
| `playwright-tests/profile/dashboard.spec.ts`             | Dashboard and analytics summaries                                 |
| `playwright-tests/navigation.spec.ts`                    | Language prefix, landing page, signed-in redirects                |
| `playwright-tests/theme.spec.ts`                         | Theme switch flips MUI + Tailwind together, persists, public page |

## Requirements

1. PostgreSQL, with the backend migrated against it:

   ```bash
   cd ../link-yo-self-be
   DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/linkyoself \
     alembic upgrade head
   ```

1. The backend running, **with its output redirected to a file**:

   ```bash
   DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/linkyoself \
   SECRET_KEY=dev-secret \
     uvicorn main:app --port 8000 > /tmp/linkyoself-backend.log 2>&1
   ```

   SMTP is intentionally left unconfigured: `EmailSender` then writes the email
   body to the log instead of sending it, and the verification / password reset
   tests read the token from there.

1. `.env.local` in this repo (copy `example.env.local`), where
   `E2E_BACKEND_LOG` points at that log file.

1. An admin account, for the admin-panel tests:

   ```bash
   cd ../link-yo-self-be
   ADMIN_USERNAME=e2eadmin ADMIN_EMAIL=e2eadmin@example.com \
   ADMIN_PASSWORD='E2eAdmin.Parola1' python -m scripts.create_admin
   ```

   The sign-up endpoint deliberately cannot create admins — `is_admin` is not
   on it, otherwise anyone could promote themselves — so the panel needs an
   account seeded out of band. Running the command again is safe.

   `signInAsAdmin()` reads `E2E_ADMIN_USERNAME` / `E2E_ADMIN_EMAIL` /
   `E2E_ADMIN_PASSWORD` and falls back to the values above. If the account is
   missing the admin tests **fail with that command in the message** rather
   than skipping: a silently skipped test would hide the fact that the panel
   is never scanned.

1. Browsers:

   ```bash
   npx playwright install
   ```

## Running tests

```bash
npm run dev          # Playwright also starts this itself if it is not running
npx playwright test  # or: npx playwright test --ui
```

## Before you commit

`.husky/pre-commit` runs `npm run check` — the exact command the lint workflow
runs (`eslint . && prettier --check . && tsc --noEmit`). If it passes, that
workflow will too; if it fails, the commit stops and the message names the fix
(`npm run format` or `npm run lint:fix`). It takes about twelve seconds.

It deliberately does **not** fix anything. The hook used to run `lint:fix` and
`format`, which looked like it worked and did not: prettier rewrote the file on
disk while the commit took the already-staged, unformatted version. The commit
went out broken, the working tree was left dirty, and the lint workflow went red
— measured, on this repository. Re-staging what the hook fixed is not the answer
either: with a file staged in pieces via `git add -p`, the unstaged rest would be
swept into the commit.

## How the helpers work

- `helpers/api.ts` — talks to the backend directly (register, log in, create
  links, update the profile). Use it for setup; drive the UI only for what the
  test is actually about.
- `helpers/auth.ts` — `signInAsNewUser()` creates a user and writes the auth
  cookie, which is what `AuthProvider` reads on start. `signInAsAdmin()` logs
  in as the seeded admin (see Requirements). `signInThroughUi()` /
  `signUpThroughUi()` go through the forms.
- `helpers/mail.ts` — reads the verification / reset token out of the backend
  log.
- `helpers/ui.ts` — `fillField()` and `checkBox()` wait for React to hydrate
  before typing. Without that a `fill()` lands in the DOM while React state
  stays empty, and the form submits blank.

## CI

`.github/workflows/e2e.yml` starts a `postgres:16` service, checks out the
backend repository, runs `alembic upgrade head`, seeds the admin account with
`python -m scripts.create_admin`, starts uvicorn, builds the frontend and runs
the suite. On failure the Playwright report and the backend
log are uploaded as artifacts.

The frontend build runs **in the background**, kicked off right after `npm ci`,
so the backend setup and the browser download happen while it compiles. That is
also why `playwright.config.ts` only starts `npm run start` on CI instead of
building first: running `CI=1 npx playwright test` by hand needs a `.next`
directory already in place.

Both workflows run on `pull_request`, and on `push` only for `dev` and `main`.
With `on: [push, pull_request]` a branch with an open PR ran everything twice on
the same commit, and a merge into `dev` ran it three times. They also cancel a
superseded run on the same branch — only the newest commit's result matters.

`.github/workflows/lint.yml` runs two jobs in parallel:

- **lint** — `eslint .` and `prettier . --check`
- **typecheck** — `npm run typecheck` (`tsc --noEmit`)

They are separate jobs on purpose. As steps in one job, a failing ESLint run
would stop the job before the type check ran, and a type error would stay
hidden until the next push.

Locally, `npm run check` runs all three at once.

---

Previous: [Auth](auth.md)

Next: [Forms](forms.md)
