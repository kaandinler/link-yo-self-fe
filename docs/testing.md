# Testing

---

## Table of Contents <!-- omit in toc -->

- [Testing](#testing)
  - [Introduction](#introduction)
  - [What the suite covers](#what-the-suite-covers)
  - [Requirements](#requirements)
  - [Running tests](#running-tests)
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

| File                                               | Covers                                                   |
| -------------------------------------------------- | -------------------------------------------------------- |
| `playwright-tests/auth/sign-up.spec.ts`            | Registration, password rules, duplicate username         |
| `playwright-tests/auth/sign-in.spec.ts`            | Sign in, post-login routing, wrong password, guest guard |
| `playwright-tests/auth/email-verification.spec.ts` | Confirmation link, invalid token, settings warning       |
| `playwright-tests/auth/password-reset.spec.ts`     | Forgot password → email → new password → sign in         |
| `playwright-tests/profile/public-profile.spec.ts`  | Public page, 404, profile view counter                   |
| `playwright-tests/profile/links.spec.ts`           | Empty state, creating a link, `?new=1`, auth guard       |
| `playwright-tests/profile/onboarding.spec.ts`      | Where the wizard sends you when it ends                  |
| `playwright-tests/profile/activity-chart.spec.ts`  | Daily activity chart, range switch, table view, keyboard |
| `playwright-tests/profile/link-breakdown.spec.ts`  | Per-link sparklines, shared scale, table view            |
| `playwright-tests/profile/customize.spec.ts`       | Theme/background, preview, validation                    |
| `playwright-tests/profile/profile-edit.spec.ts`    | Name, password change, email change flow                 |
| `playwright-tests/profile/profile-fields.spec.ts`  | Display name, bio, page details, social links            |
| `playwright-tests/profile/account.spec.ts`         | Closing your own account                                 |
| `playwright-tests/profile/dashboard.spec.ts`       | Dashboard and analytics summaries                        |
| `playwright-tests/navigation.spec.ts`              | Language prefix, landing page, signed-in redirects       |

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

1. Browsers:

   ```bash
   npx playwright install
   ```

## Running tests

```bash
npm run dev          # Playwright also starts this itself if it is not running
npx playwright test  # or: npx playwright test --ui
```

## How the helpers work

- `helpers/api.ts` — talks to the backend directly (register, log in, create
  links, update the profile). Use it for setup; drive the UI only for what the
  test is actually about.
- `helpers/auth.ts` — `signInAsNewUser()` creates a user and writes the auth
  cookie, which is what `AuthProvider` reads on start. `signInThroughUi()` /
  `signUpThroughUi()` go through the forms.
- `helpers/mail.ts` — reads the verification / reset token out of the backend
  log.
- `helpers/ui.ts` — `fillField()` and `checkBox()` wait for React to hydrate
  before typing. Without that a `fill()` lands in the DOM while React state
  stays empty, and the form submits blank.

## CI

`.github/workflows/e2e.yml` starts a `postgres:16` service, checks out the
backend repository, runs `alembic upgrade head`, starts uvicorn, then builds the
frontend and runs the suite. On failure the Playwright report and the backend
log are uploaded as artifacts.

---

Previous: [Auth](auth.md)

Next: [Forms](forms.md)
