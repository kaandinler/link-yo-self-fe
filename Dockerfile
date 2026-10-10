# syntax=docker/dockerfile:1

# LinkYoSelf frontend imaji.
#
#   docker build \
#     --build-arg NEXT_PUBLIC_API_URL=https://api.linkyoself.com/api \
#     --build-arg NEXT_PUBLIC_SITE_URL=https://linkyoself.com \
#     -t linkyoself-web .
#   docker run -e API_URL=http://api:8000/api -p 3000:3000 linkyoself-web
#
# Butun yigin (backend, Postgres, Redis dahil) icin backend deposundaki
# docker-compose.yml'e bakin.

# Surum CI ile ayni (.github/workflows/*.yml).
ARG NODE_VERSION=20

# --- Bagimliliklar ----------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
# HUSKY=0: "prepare" betigi husky'yi kurmaya calisiyor; imajda .git yok
# ve git kancasinin bir anlami yok.
RUN HUSKY=0 npm ci

# --- Derleme ----------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* degerleri istemci paketine DERLEME ANINDA gomuluyor;
# calisma aninda ortam degiskeniyle degistirilemez. Bu yuzden build arg.
#
# NEXT_PUBLIC_API_URL: TARAYICININ backend'e ulastigi adres (tiklama
#   sayaci dogrudan buraya gidiyor), /api ile bitmeli.
# NEXT_PUBLIC_SITE_URL: sitenin herkese acik adresi (canonical, og:url).
# NEXT_PUBLIC_MEDIA_URL: avatarlarin sunuldugu kok. Yalnizca backend
#   STORAGE_BACKEND=s3 ise gerekli (kovanin/CDN'in adresi); bossa API'nin
#   /media yolu varsayiliyor (bkz. src/services/media-url.ts).
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_IS_SIGN_UP_ENABLED=true
ARG NEXT_PUBLIC_MEDIA_URL=

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_PUBLIC_IS_SIGN_UP_ENABLED=${NEXT_PUBLIC_IS_SIGN_UP_ENABLED} \
    NEXT_PUBLIC_MEDIA_URL=${NEXT_PUBLIC_MEDIA_URL} \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_OUTPUT=standalone

# API adresi olmadan derlenen imaj sessizce bozuk olurdu: tiklama sayaci
# hic basilmaz, profil sayfalari hata verir. Derleme burada dussun.
RUN test -n "$NEXT_PUBLIC_API_URL" \
    || { echo "NEXT_PUBLIC_API_URL build arg'i verilmeli" >&2; exit 1; }

RUN npm run build

# --- Calisma ----------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -S -g 10001 nextjs && adduser -S -u 10001 -G nextjs nextjs

COPY --from=builder /app/public ./public
# .next'in sahibi nextjs: Next'in veri onbellegi (profil sayfalari,
# sitemap) calisma aninda .next/cache'e yaziyor.
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Yonlendirme izlenmiyor: "/" dil sayfasina yonlendiriyor ve 3xx de
# sunucunun ayakta oldugunu gosteriyor.
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:3000/',{redirect:'manual'}).then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"]

# API_URL (calisma aninda): Next SUNUCUSUNUN backend'e ulastigi adres --
# vekil, oturum ucu ve profil sayfasi. Verilmezse NEXT_PUBLIC_API_URL
# kullaniliyor; konteynerde o adres cogu zaman erisilemez (localhost
# konteynerin kendisi), bu yuzden compose bunu yigin icinden veriyor.
CMD ["node", "server.js"]
