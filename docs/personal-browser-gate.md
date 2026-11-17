# Kisisel tarayici kabul kapisi

Bu dar kapinin amaci gercek tarayicida ziyaretci arayuzunu dogrulamaktir.
Mevcut gercek backend gerektiren Playwright paketi korunur; onun yerine gecmez.

```sh
npm ci --ignore-scripts --no-audit
npm run check
NEXT_PUBLIC_API_URL=http://127.0.0.1:8088 NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 NEXT_PUBLIC_IS_SIGN_UP_ENABLED=true npm run build
NEXT_PUBLIC_API_URL=http://127.0.0.1:8088 NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 NEXT_PUBLIC_IS_SIGN_UP_ENABLED=true npm run test:acceptance
```

Node 24.22.3 ve Playwright 1.65.1 / Chromium ile alti kontrol gecti: masaustu
ve mobilde ziyaretci ana sayfasi, bos giris formunun istek gondermeden hata
gostermesi ve tema seciminin sayfa yenilendiginde korunmasi. API yanitlari
kontrollu 401 verisidir; gercek kullanici hesabi, e-posta, SMTP, CSRF veya
backend oturum akisinin uctan uca kabul testi yapilmis sayilmaz.

Gercek `.env.local` veya anahtar kullanilmaz. Yukaridaki adresler yalnizca
yerel test degerleridir. Eski tam yigin testleri ve guvenlik davranislari
degistirilmez. Gerekli lint, bicim ve tip denetimi commit kancasinda korunur.
