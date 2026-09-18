# Architecture of the project

## Table of Contents <!-- omit in toc -->

- [Architecture of the project](#architecture-of-the-project)
  - [Introduction](#introduction)
  - [Folder structure](#folder-structure)
  - [Pages](#pages)
  - [Public profile: sharing and search](#public-profile-sharing-and-search)
  - [Public profile: caching and invalidation](#public-profile-caching-and-invalidation)

## Introduction

As far as this boilerplate uses [Next.js](https://nextjs.org/) framework for building React applications, the folders are used as routes. This means the more folders you add to your app folder, the more routes you will get. Additionally, if you create a new folder inside of another folder, you will get nested routes. To better understand these concepts, we suggest looking at the image below.

<img src="https://github.com/brocoders/extensive-react-boilerplate/assets/72293912/25dc524e-b2e2-41cf-b1af-99f729ee9c2f" width="450"/>

## Folder structure

```txt
.
├── playwright-tests <-- Here are your E2E tests
├── public
└── src
    ├── app
    │   └── [language] <-- Here are your pages (routes)
    │       ├── admin-panel
    │       ├── confirm-email
    │       ├── forgot-password
    │       ├── password-change
    │       ├── profile
    │       ├── sign-in
    │       └── sign-up
    ├── components <-- Here are your common components (Forms, Tables, etc.)
    │   ├── confirm-dialog
    │   ├── form
    │   └── table
    └── services <-- Here are your services (Auth, API calls, I18N, etc.)
        ├── api
        ├── auth
        ├── helpers
        ├── i18n
        │   └── locales
        ├── leave-page
        ├── react-query
        └── social-auth
            ├── facebook
            └── google
```

## Pages

Pages are located in the `src/app/[language]` folder. We use `[language]` directory to support internationalization with ability generate static website (`output: export`). Example [here](https://github.com/i18next/next-13-app-dir-i18next-example).

## Public profile: sharing and search

`/[language]/[username]` is the page the product is actually shared as, so what
a scraper sees there is part of the feature, not an afterthought.

- **`opengraph-image.tsx`** renders a 1200×630 card per profile — avatar (or
  initials), display name, handle and bio, on the profile's own theme. It exists
  because handing the avatar over as the card image failed twice: a profile with
  no avatar produced no image at all and dropped Twitter to a small `summary`
  card, and a profile with one had a square image stretched across a wide frame.
  The filename is a Next.js convention; it is what emits `og:image` and its
  width/height/alt, which is why `generateMetadata` deliberately sets no
  `openGraph.images`.

  The avatar is downloaded here, with a timeout, and embedded as a data URI. Its
  URL is whatever the user typed, and passing it straight to `<img src>` means an
  unreachable host takes the whole card down with it. When the download fails the
  card falls back to initials.

- **`NEXT_PUBLIC_SITE_URL`** has to be the real domain in production. `canonical`,
  `og:url` and the card's own address are built from it, and the value is baked in
  at build time — a build with the default points every shared link at localhost.

- **Structured data** (`ProfilePage` / `Person`) carries `sameAs`. Linking a
  person to their accounts elsewhere is what this page means to a search engine,
  and it cannot be inferred from the text. The URLs come from
  `src/services/social-links.ts`, the same module the rendered icons use, so the
  two cannot drift apart.

- **`robots.ts`** keeps crawlers on public profiles. The app's own screens are
  guarded on the client, so a crawler only ever sees an empty shell there; indexed,
  those shells would compete with the profiles. It also points at the sitemap.

- **`sitemap.ts`** lists the profiles. Nothing public links to them — profiles
  don't link to each other and the app has no public directory — so without a
  sitemap a profile is only discovered if someone outside links to it, which is
  exactly what a new user doesn't have. The list comes from the backend's
  `GET /v1/p/sitemap/profiles`, which returns **only profiles with at least one
  visible link**: telling a search engine "these are my important pages" and
  filling it with empty ones costs the whole site. `lastmod` is the newest change
  across the profile _and_ its links.

  The sitemap is **sharded** — one file caps at 50,000 URLs by spec, and
  `SITEMAP_SHARD_SIZE` (default 10,000) sets how many go in each. The shard count
  comes from one call to `GET /v1/p/sitemap/count`; counting by reading the list
  would mean fetching the whole list for every shard. Both numbers live in
  `src/services/sitemap-shards.ts` so the index and the shards cannot disagree.

  **There is no `/sitemap.xml`.** With `generateSitemaps` Next only produces
  `/sitemap/0.xml`, `/sitemap/1.xml`, … and `/sitemap.xml` returns the app's 404
  page with **HTTP 200** — a crawler pointed there gets HTML and nothing reports
  an error. So `robots.txt` points at `/sitemap-index.xml`, a hand-written index
  listing the shards.

  One trap worth knowing: Next passes the shard `id` as a **string** even though
  the type says `number`. `id === 0` is therefore always false, which silently
  dropped the landing page from the sitemap while types, build and the XML's
  shape all stayed valid.

- **Caching.** The page itself stays `no-store` on purpose: an edit has to show
  up immediately. The card image is the opposite — expensive to produce and
  requested again on every share — so it is served with a one-hour
  `cache-control`. The trade is that a changed avatar can take up to an hour to
  appear in previews, while the page updates at once.

## Public profile: caching and invalidation

The public page is cached for a short window and purged the moment its owner
saves. The page itself is fast either way; what this buys is one backend query
per window instead of one per visit — measured at **five visits: 5 backend calls
→ 1**.

- **The page fetch** (`getPublicProfile`) carries `revalidate` plus a
  `profil:<username>` tag. The share card fetches the same endpoint with
  `?count_view=false`, which is a _different_ cache entry, so it carries its own
  `kart:<username>` tag and its own one-hour window. Purging only the page tag
  left the card byte-for-byte identical after an edit — measured.

- **`POST /api/revalidate-profile`** purges both tags. `use-fetch.ts` calls it
  after every successful mutation, which is why no individual save site has to
  remember to. For `DELETE` it also purges _before_ the request: the endpoint
  resolves "who is this" through the backend, and after you close your own
  account your token no longer resolves, so the after-purge would 401 and your
  page would stay up. It takes a username in the body only from an admin, so the
  panel can close someone else's page immediately.

  The endpoint caches token → identity for ten seconds. Without it, one client
  produced **61 backend identity lookups for 60 purge requests**. The purge
  itself still runs on every call: dropping one, or answering 429, would leave
  the user looking at their own stale page.

### Diagnostics on the purge endpoint

A successful purge answers with `x-kimlik-kaynagi` (whether the identity came
from the backend or the ten-second cache) and `x-profil-onbellek-saniye` (the
window in force). These ship in production on purpose, for the same reason a CDN
ships `x-cache: HIT/MISS` — when the page is stale, which layer answered is the
first thing worth knowing, and turning that off by environment would remove it
exactly where it is needed.

The boundary was measured: the headers appear only on the caller's own `200`,
never on the `401`, and they describe that caller's own request. The endpoint is
also not an existence oracle — a non-admin asking for someone else's username and
asking for one that does not exist get byte-identical `403`s.

### One instance is assumed

`revalidateTag` only invalidates the Next.js instance that handled the call.
Two instances of the same build, on the same disk, were measured: purging
through `:3000` refreshed `:3000` and left `:3001` serving the old name until
its window expired.

Nothing is wrong on a single instance, which is how this deploys today. Behind a
load balancer it is not: the staleness ceiling becomes `PROFILE_CACHE_SECONDS`
(default 60) rather than zero, and the purge helps only the instance it lands
on. `PROFILE_CACHE_SECONDS` exists so that ceiling can be lowered without a code
change — the effective value comes back on every purge as
`x-profil-onbellek-saniye`. The real fix is a cache handler shared between
instances (`cacheHandler` in `next.config.js`), which needs storage this
repository does not have.

---

Previous: [Installing and Running](installing-and-running.md)

Next: [Auth](auth.md)
