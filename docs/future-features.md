# Gelecek Ozellik Arastirmasi

Bu belge LinkYoSelf icin kullanicilarin hosuna gidebilecek ozellik onerilerini ve
her biri icin uygulama planini toplar. Kod degil, planlama belgesidir.

## Kapsam ve varsayimlar

- **Backend ROADMAP'i okunamadi.** `../link-yo-self-be/docs/ROADMAP.md` bu
  ortamda yok. Planli isler ile cakisma kontrolu YAPILMADI; backend gerektiren
  maddeler "Backend: GEREKLI" diye isaretli ve backend deposunda ayri is olarak
  acilmali. ROADMAP'e tasima insana birakildi.
- Mevcut durum koddan okundu. Zaten VAR olanlar tekrar onerilmedi:
  - Link surukle-birak siralama ve ok dugmeleri (`links/page-content.tsx`,
    `useReorderLinks`), aktif/pasif.
  - Analitik: ozet, zaman serisi, link bazli seri, trafik kaynaklari
    (referrer), en iyi saatler, serbest tarih araligi
    (`services/api/services/analytics.ts`, `components/charts/*`).
  - Tema rengi ve arka plan (renk / gradyan / gorsel)
    (`services/profile-theme.ts`, `profile/customize`).
  - Acik/koyu mod (`components/theme/*`), yetiskin icerik uyarisi, OG kart
    (`[username]/opengraph-image.tsx`), sitemap parcalari
    (`services/sitemap-shards.ts`), TR/EN.
- Her oneri sunlari korur: CSRF kontrolu, oturum cerezi ayarlari
  (`services/auth/session-cookie.ts`, `api/proxy`), OG kartin yalnizca kendi
  medyamizi indirmesi (`services/media-url.ts`). Domain hardcode edilmez
  (`NEXT_PUBLIC_SITE_URL`, `services/site-url.ts`). Tum yeni kullaniciya donuk
  metinler TR ve EN olarak `services/i18n/locales/{tr,en}/` altina eklenir
  (`playwright-tests/i18n/locale-keys.spec.ts` anahtar esitligini denetler).
- Testler Playwright ile, GERCEK backend ayakta olarak kosar
  ([testing.md](testing.md)); mock yok.

Efor: S (<= 2 gun), M (3-7 gun), L (> 1 hafta). Risk: dusuk / orta / yuksek.

---

## 1. Link zamanlama (planli yayin / bitis)

- **Sorun / deger:** Kampanya linkleri belirli saatte acilip kapanmali; simdi
  kullanici elle aktif/pasif yapmak zorunda.
- **Etkilenen:** `links/add`, `links/page-content.tsx` (rozet: "Planli"),
  `services/api/services/links.ts` (`Link`, `CreateLinkRequest`,
  `UpdateLinkRequest`), `[username]/page-content.tsx` (gorunurluk sunucuda
  filtrelenir, istemci saatine guvenilmez).
- **Backend: GEREKLI** — `publish_at` / `expire_at` alanlari, migration, public
  profil uc noktasinda sunucu saatine gore filtre ve profil onbellegi
  gecersizleme (zaman gelince). Ayri backend isi.
- **Efor / risk:** M / orta (onbellek: sayfa yayin aninda guncel olmali;
  `api/revalidate-profile` ve `profile-cache-purge.ts` zamanlayiciyla
  tetiklenmeli).
- **Adimlar:** (1) backend alanlari + filtre; (2) tipleri genislet; (3) form
  alanlari (`DateTimePicker` zaten `components/form/date-pickers` icinde);
  (4) liste rozeti; (5) TR/EN metinler; (6) profil sayfasi revalidate suresini
  en yakin zamanlanmis olaya gore ayarla.
- **Test:** Playwright: gecmis `expire_at`'li link public sayfada gorunmez,
  gelecek `publish_at`'li gorunmez, panelde "Planli" rozeti var. Zaman
  ilerletme backend test kancasi gerektirir.

## 2. QR kod uretimi ve paylasim

- **Sorun / deger:** Fiziksel dunyada (kartvizit, etkinlik) profile gecis
  yolu yok. Tek tikla indirilebilir QR yuksek deger, dusuk maliyet.
- **Etkilenen:** `dashboard/page-content.tsx` ve `profile/page-content.tsx`
  (paylas karti), yeni `components/qr-code.tsx`, `services/site-url.ts`
  (adres her zaman buradan; hardcode yok).
- **Backend: GEREKMEZ** (istemcide uretilir). Yeni dependency ISTENMIYOR:
  kucuk bir QR kodlayici bagimlilik onayi ile eklenmeli ya da bagimlilik
  gerektirmeyen yerel bir uretici yazilmali — karar insana ait.
- **Efor / risk:** S / dusuk. Not: QR icindeki adres `?utm`-benzeri bir kaynak
  parametresi tasirsa analitikte "QR" kaynagi ayrisir (ozellik 3 ile birlikte).
- **Adimlar:** (1) bilesen (SVG cikti); (2) PNG/SVG indir dugmesi;
  (3) panelde gosterim; (4) TR/EN metin ve `aria-label`.
- **Test:** Playwright: dugme gorunur, indirme olayi tetiklenir, QR
  verisi `NEXT_PUBLIC_SITE_URL` + `/username` ile baslar. Birim: kodlayici.

## 3. Analitik derinlestirme: kampanya kaynagi, cihaz/ulke, CSV disa aktarim

- **Sorun / deger:** Referrer var ama kullanici hangi paylasimin ise
  yaradigini (kampanya etiketi), hangi cihaz/ulkeden geldigini goremiyor;
  veriyi disari alamiyor.
- **Etkilenen:** `analytics/page-content.tsx`, `analytics.ts` (yeni
  `useDevices`, `useCountries` kancalari, mevcut `rangeQuery` /
  `SelectedRange` yeniden kullanilir), `components/charts/referrer-bars.tsx`
  (ayni bilesen yeni kirilimlara uyar).
- **Backend: GEREKLI** — tiklama olayinda cihaz sinifi ve ulke (IP'den
  turetilir, ham IP saklanmaz; `fix(auth)` ile iletilen istemci adresi
  zaten vekilden geciyor), `utm_*` yakalama, yeni `/v1/analytics/devices`,
  `/countries`, CSV uc noktasi. **Gizlilik:** KVKK/GDPR icin
  `privacy-policy` metni (TR/EN) guncellenmeli; karar insana ait.
- **Efor / risk:** L / orta (gizlilik + veri modeli). CSV yalnizca frontend ile
  de verilebilir (S): mevcut `timeseries` verisinden istemcide uretilir.
- **Adimlar:** (1) once istemci tarafi CSV (backend'siz); (2) backend
  kirilimlari; (3) yeni kartlar; (4) gizlilik metni; (5) TR/EN.
- **Test:** `traffic-sources.spec.ts` kalibinda: tiklama uret, kirilimin
  dogru gorundugunu dogrula; CSV icerigini indirilen dosyadan kontrol et.

## 4. Link gruplama, baslik ayiraci ve one cikan link

- **Sorun / deger:** Cok linkli profiller karmasik; gruplar ("Sosyal",
  "Magaza") ve tek bir vurgulu link donusumu arttirir.
- **Etkilenen:** `Link` tipi (`links.ts`, `public-profile.ts` `PublicLink`),
  `links/page-content.tsx` (liste ve siralama), `[username]/page-content.tsx`,
  `profile/customize` onizleme. Siralama mantigi (`order_index`,
  `ReorderLinksRequest`) baslik ogelerini de tasimali.
- **Backend: GEREKLI** — `kind` (`link|header`), `is_featured`, veri modeli
  degisikligi + migration. **Mimari karar** (baslik ayri tablo mu, ayni tablo
  mu).
- **Efor / risk:** M / orta (siralama uclari ve mevcut verinin geriye uyumu).
- **Adimlar:** (1) karar notu (ADR); (2) backend; (3) form ve liste; (4) public
  sayfa cizimi; (5) TR/EN.
- **Test:** `links.spec.ts` uzerine: baslik ekle, sirala, public sayfada
  sirayla gorunur; one cikan link vurgu sinifi.

## 5. Tema galerisi, font ve buton stili

- **Sorun / deger:** Renk + arka plan var, ama kullanici hazir bir gorunumle
  bir tikla baslamak ve yazi tipi/buton bicimi secmek istiyor.
- **Etkilenen:** `services/profile-theme.ts` (TEK KAYNAK; yeni hazir ayarlar
  burada tanimlanir ve hem yayin hem onizleme kullanir),
  `profile/customize`, `[username]/page-content.tsx`, `next/font` ile
  onceden belirlenmis kucuk bir font listesi.
- **Backend: KISMEN** — hazir sablonlar yalnizca istemci sabiti olarak
  mevcut alanlara (`theme_color`, `background_type/value`) yazilabilir
  (backend'siz, S). Font/buton stili yeni alan ister
  (`extra_settings` JSON'u var, ama dogrulama backend'de eklenmeli).
- **Efor / risk:** M / dusuk-orta. Kural: kullanici verisi CSS'e girerse
  `safeColor` / `safeImageUrl` gibi beyaz liste (stil enjeksiyonu); serbest
  font adi KABUL EDILMEZ, yalniz listeden secim. Okunabilirlik: metin rengi
  kontrastini hesaplayan yardimci (arka plana gore) ayni modulde.
- **Adimlar:** (1) sablon sabitleri; (2) galeri UI; (3) font/buton alanlari +
  backend dogrulamasi; (4) TR/EN.
- **Test:** `customize.spec.ts`: sablon sec, kaydet, public sayfada ayni
  renkler; kontrast birim testi (`playwright-tests/unit`).

## 6. E-posta / abone toplama blogu

- **Sorun / deger:** Takipcileri profil disinda bir listeye almak
  yaraticilar icin ana ihtiyac.
- **Etkilenen:** `[username]/page-content.tsx` (form blogu),
  `links` yonetimi (blok ekle), yeni `analytics` kartı (abone sayisi),
  `api/proxy` (public POST; **CSRF**: public form oturumsuz oldugu icin
  bot korumasi/oran siniri sunucuda).
- **Backend: GEREKLI** — abone tablosu, dogrulama e-postasi (double opt-in),
  oran siniri, disa aktarim. **Mimari + hukuki karar** (KVKK/GDPR riza
  metni).
- **Efor / risk:** L / yuksek (spam, kisisel veri).
- **Adimlar:** ADR, backend, form blogu, onay e-postasi akisi, yonetim listesi,
  TR/EN.
- **Test:** Playwright + `helpers/mail.ts`: abone ol, onay e-postasini al,
  listede gorun; oran siniri 429.

## 7. Link sagligi (kirik link kontrolu) ve onizleme

- **Sorun / deger:** Kirik link ziyaretciyi kaybettirir; kullanici fark etmez.
- **Etkilenen:** `links/page-content.tsx` (uyari rozeti), `analytics.ts`
  (isteğe bagli).
- **Backend: GEREKLI** — periyodik kontrol isi, `last_check_status` alani.
  **Guvenlik:** giden istek yapan her yeni ozellik SSRF riski tasir; yalniz
  backend'de, ic aglara karsi engelli olarak yapilmali. Frontend asla
  kullanicinin verdigi adrese sunucu tarafi istek atmaz (OG kart kisitiyla
  ayni ilke).
- **Efor / risk:** M / yuksek (SSRF, maliyet).
- **Adimlar:** backend isi + SSRF korumasi; rozet; TR/EN.
- **Test:** Playwright: backend'in kirik isaretledigi link icin rozet gorunur.

## 8. PWA ve cevrimdisi kabuk

- **Sorun / deger:** Panel mobil kullaniliyor (`*-mobile.spec.ts`);
  ana ekrana eklenebilir uygulama deneyimi.
- **Etkilenen:** `app/manifest.ts` (yeni), `public/` ikonlari, `app/layout.tsx`
  meta. Service worker onbellegi **kimlikli API cevaplarini ve `/api/proxy`
  cagrilarini ASLA onbellege almamali** (oturum guvenligi).
- **Backend: GEREKMEZ.**
- **Efor / risk:** S (yalniz manifest) / dusuk; service worker M / orta.
- **Adimlar:** (1) manifest + ikonlar, adres `site-url.ts`'den; (2) yuklenebilirlik
  testi; (3) SW'yi ancak gercek ihtiyac olursa ekle.
- **Test:** Playwright: `/manifest.webmanifest` 200 ve `start_url` dogru.

## 9. Erisilebilirlik ve performans iyilestirmeleri

- **Sorun / deger:** Public sayfa herkese acik giris kapisi; klavye, ekran
  okuyucu, kontrast ve Core Web Vitals SEO'yu ve kapsayiciligi etkiler.
- **Etkilenen:** `[username]/page-content.tsx`, `profile-theme.ts` (kontrast),
  `a11y/headings.spec.ts` (genisletilir), gorseller (`next/image`,
  `media-url.ts`), `adult-warning.tsx` (odak tuzagi).
- **Backend: GEREKMEZ.**
- **Efor / risk:** S-M / dusuk.
- **Adimlar:** (1) axe benzeri denetim (yeni dependency onayi gerekir; yoksa
  elle kontrol listesi); (2) odak halkalari, `aria-label`'lar; (3) kontrast
  uyarisi customize ekraninda; (4) LCP gorseli `priority`; (5) TR/EN.
- **Test:** `a11y/` altinda klavye gezinme ve baslik sirasi testleri.

## 10. Ozel alan adi

- **Sorun / deger:** Profesyonel kullanicilar `links.markam.com` ister.
- **Etkilenen:** `middleware.ts` (Host'a gore yonlendirme), `site-url.ts`,
  `sitemap`, `robots`, OG kart, `settings` (alan adi ekranı).
- **Backend: GEREKLI** — alan adi tablosu, DNS dogrulama, TLS sertifikasi
  (altyapi). **Mimari karar (ADR zorunlu):** SSL otomasyonu, cerez kapsami
  (oturum cerezi YALNIZ ana alan adinda kalir; ozel alan yalniz public
  okuma), CSRF/origin kontrolleri ve OG kartin medya kisiti etkilenmemeli.
- **Efor / risk:** L / yuksek.
- **Adimlar:** ADR; backend + altyapi; middleware; ayarlar UI; TR/EN.
- **Test:** Host basligiyla Playwright istegi; sahte alan adi 404.

---

## Etki / efor oncelik tablosu

| #   | Ozellik                               | Etki        | Efor   | Risk       | Backend |
| --- | ------------------------------------- | ----------- | ------ | ---------- | ------- |
| 2   | QR kod                                | Orta-yuksek | S      | dusuk      | Hayir   |
| 8   | PWA manifest                          | Dusuk-orta  | S      | dusuk      | Hayir   |
| 5   | Tema galerisi (sablonlar)             | Yuksek      | M      | dusuk-orta | Kismen  |
| 9   | Erisilebilirlik/performans            | Orta        | S-M    | dusuk      | Hayir   |
| 3   | Analitik (CSV once, sonra kirilimlar) | Yuksek      | S -> L | orta       | Kismen  |
| 1   | Link zamanlama                        | Yuksek      | M      | orta       | Evet    |
| 4   | Gruplama / one cikan                  | Orta-yuksek | M      | orta       | Evet    |
| 7   | Link sagligi                          | Orta        | M      | yuksek     | Evet    |
| 6   | Abone toplama                         | Yuksek      | L      | yuksek     | Evet    |
| 10  | Ozel alan adi                         | Yuksek      | L      | yuksek     | Evet    |

**Mimari karar gerektirenler (ADR yazilmadan baslanmaz):** 4 (veri modeli),
6 (kisisel veri/hukuki), 10 (alan adi/cerez/TLS), 3'un backend kismi
(gizlilik).

## Onerilen ilk 3 ozellik ve sira

1. **QR kod (2)** — backend'siz, kucuk, hemen deger; bagimlilik karari insanda.
2. **Tema sablonlari (5, yalniz istemci sabiti kismi)** — mevcut
   `profile-theme.ts` tek kaynagi uzerine kurulur, backend'siz baslar.
3. **Analitik CSV disa aktarim (3, istemci kismi)** — mevcut zaman serisi
   verisiyle backend'siz; ardindan link zamanlama (1) icin backend isi
   acilip paralel yurutulebilir.

Backend gerektiren maddeler (1, 3-kirilimlar, 4, 6, 7, 10) `link-yo-self-be`
deposunda ayri is olarak acilmali ve dal adlari iki depoda ayni tutulmali.
