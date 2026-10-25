# LinkYoSelf — frontend (CLAUDE.md)

Linktree benzeri "link in bio" servisinin Next.js (App Router, MUI,
react-query, TR/EN) frontend'i. Backend ayri depoda: `link-yo-self-be`
(FastAPI). Iki depo yan yana duruyor; butun yigin backend deposundaki
`docker-compose.yml` ile kalkiyor.

**Yonetim backend deposunda:** is listesi `../link-yo-self-be/docs/ROADMAP.md`,
agent sistemi `../link-yo-self-be/docs/AGENTS.md`.

Calistirma ve ortam degiskenleri: `README.md` ve `docs/`. Ozellikle
`NEXT_PUBLIC_*` (derleme aninda) ile `API_URL` (calisma aninda) farki.

## Komutlar

```bash
npm ci
npm run lint && npm run typecheck   # PR oncesi zorunlu
npm run dev
npx playwright test                 # gercek backend ayakta olmali (bkz. .github/workflows/e2e.yml)
```

## Dal, commit, PR

- Akis: `claude/<kisa-ad>` dali -> PR -> `dev` -> (insan) `main`.
- Backend'de ayni adli dal varsa e2e CI ona karsi kosuyor; iki depoya
  dokunan islerde dal adlarini ayni tut.
- Commit mesajlari Turkce, ASCII, conventional prefix (`feat(...)`, `fix(...)` ...).
  commitlint husky kancasinda kontrol ediyor.
- PR aciklamasi: ne, NEDEN, nasil test edildi.

## KESIN KURALLAR

- `main`'e push yok, force push yok, deploy yok, SSH yok.
- `.env.local` ve gercek secret okunmaz/yazilmaz; `example.env.local` ornek dosya.
- Domain hardcode edilmez (`NEXT_PUBLIC_SITE_URL` vb.).
- Guvenlik davranisi gevsetilmez: CSRF kontrolu, oturum cerezi ayarlari,
  OG kartinin yalnizca kendi medyamizi indirmesi.
- Bir testi gecirmek icin testi silme/atlama yok.
