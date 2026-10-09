# link-yo-self-fe

## Docker

Butun yigin (Postgres, Redis, API ve bu frontend) backend deposundaki
`docker-compose.yml` ile kalkiyor; ayrintilar orada, README'nin
"Docker ile" bolumunde.

Yalnizca bu imaji derlemek icin:

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.linkyoself.com/api \
  --build-arg NEXT_PUBLIC_SITE_URL=https://linkyoself.com \
  -t linkyoself-web .
docker run -e API_URL=http://api:8000/api -p 3000:3000 linkyoself-web
```

- `NEXT_PUBLIC_*` **derleme aninda** gomuluyor; degistirmek yeniden
  derleme istiyor. `NEXT_PUBLIC_API_URL` tarayicinin backend'e ulastigi
  adres, verilmezse derleme duruyor.
- `API_URL` **calisma aninda** okunuyor: Next sunucusunun backend'e
  ulastigi adres (vekil, oturum, profil sayfasi). Konteynerde
  `localhost` konteynerin kendisi oldugu icin genellikle ayri verilmesi
  gerekiyor.
- `NEXT_PUBLIC_MEDIA_URL` (derleme aninda, istege bagli): avatarlarin
  sunuldugu kok. Yalnizca backend `STORAGE_BACKEND=s3` ise verilmeli
  (kovanin/CDN'in adresi). Bossa API'nin `/media` yolu varsayiliyor.
  Paylasim karti avatari sunucuda indiriyor ve yalnizca bu kokten
  indiriyor (bkz. `src/services/media-url.ts`).
- Imaj `output: "standalone"` ile derleniyor (`NEXT_OUTPUT=standalone`);
  yerel gelistirme ve e2e `next dev` / `next start` ile eskisi gibi.
