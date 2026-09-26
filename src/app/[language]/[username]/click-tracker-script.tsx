// Tiklama kaydini React'e bagli olmaktan cikaran satir ici betik.
//
// NEDEN VAR: Link listesi sunucuda render ediliyor. Ziyaretci sayfayi React
// ona baglanmadan once de goruyor ve tiklayabiliyor -- baglanti gercek bir
// <a>, tarayici gorevini yapiyor ve ziyaretci hedefe gidiyor. Ama tiklama
// kaydi React'in onClick'ine bagliysa o tiklama hicbir yere yazilmiyor:
// sayac artmiyor, kaynak dagiliminda gorunmuyor. Yavas bir baglantida ya da
// JS parcalari hic yuklenemediginde olcumun bir kismi sessizce kayboluyor.
//
// Betik, olayi <a> yerine document uzerinde ve capture asamasinda
// dinliyor. Bu sayede:
//  - HTML ayrastirildigi anda hazir, React'i beklemiyor,
//  - baglantilar sonradan degisse bile calisiyor (delegasyon),
//  - varsayilan yonlendirme baslamadan once kaydi gonderiyor.
//
// Tek kaydedici bu: page-content.tsx'teki onClick bilincli olarak
// kaldirildi, aksi halde hidrasyondan sonraki tiklamalar iki kez sayilirdi.
//
// KAPSAM: `click` ve `auxclick` birlikte dinleniyor.
//  - `click`: sol tik, dokunma ve klavyeyle (Enter) etkinlestirme.
//  - `auxclick`: yalnizca orta tik. Orta tik gercek bir ziyaret --
//    ziyaretci linke gidiyor, yalnizca sekmeyi arkada aciyor -- ama
//    tarayici bunun icin `click` uretmiyor, dolayisiyla sadece `click`
//    dinleyen bir kaydedici onu hic gormuyor.
//
// Sag tik de `auxclick` uretiyor ve bilerek elenmis: menuyu acmak bir
// ziyaret degil. Sag tiktan sonra "yeni sekmede ac" secilse bile bunu
// buradan bilmenin yolu yok, o yuzden saymak fazla sayardi.

/**
 * <a> uzerindeki bu oznitelik, kaydedilecek link kimligini tasiyor.
 *
 * Karsiligi page-content.tsx icindeki `data-link-id`. Ikisi ayrisirsa
 * traffic-sources.spec.ts'teki "React hic yuklenmese bile" testi duser.
 */
const LINK_ID_ATTRIBUTE = "data-link-id";

/**
 * Sunucuda uretilen betik metni.
 *
 * ES5 sozdizimi: satir ici betik hicbir derlemeden gecmiyor, tarayiciya
 * yazildigi gibi gidiyor.
 */
function betik(apiUrl: string): string {
  return `(function () {
  var api = ${guvenliMetin(apiUrl)};

  function kaydet(olay) {
    var hedef = olay.target;
    if (!hedef || !hedef.closest) return;
    var baglanti = hedef.closest("[${LINK_ID_ATTRIBUTE}]");
    if (!baglanti) return;
    var id = baglanti.getAttribute("${LINK_ID_ATTRIBUTE}");
    if (!id) return;
    try {
      fetch(api + "/v1/links/" + encodeURIComponent(id) + "/click", {
        method: "POST",
        // Ziyaretci ayni anda hedefe gidiyor; keepalive, sayfa arkada
        // kalsa bile istegin tamamlanmasini sagliyor.
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        // document.referrer: ziyaretci bu sayfaya gelmeden once neredeydi.
        // Istegin kendi Referer basligi bunun yerine gecemiyor -- o her
        // zaman bu sayfayi gosterir.
        body: JSON.stringify({ referrer: document.referrer || null }),
      }).catch(function () {});
    } catch (hata) {
      // Yut: olcum, ziyaretcinin linke gitmesini engellememeli.
    }
  }

  document.addEventListener(
    "click",
    function (olay) {
      // 0 = birincil dugme; undefined = fare olmayan sentetik bir olay.
      // Birincil olmayan bir dugme burayi da tetikleyen eski bir
      // tarayicida, ayni tiklama auxclick'te de gorunup iki kez
      // sayilabilirdi; bu eleme onu engelliyor.
      if (olay.button) return;
      kaydet(olay);
    },
    true
  );

  document.addEventListener(
    "auxclick",
    function (olay) {
      // Yalnizca orta tik. 2 (sag tik) bir ziyaret degil.
      if (olay.button !== 1) return;
      kaydet(olay);
    },
    true
  );
})();`;
}

/**
 * Metni betik govdesine gomulebilir hale getirir.
 *
 * `<` kacisi onemli: aksi halde deger icindeki bir "</script>" dizisi betigi
 * erken kapatirdi. Deger kendi ortam degiskenimizden geliyor ama bu, satir
 * ici betik yazarken atlanmamasi gereken bir adim.
 */
function guvenliMetin(deger: string): string {
  return JSON.stringify(deger).replace(/</g, "\\u003c");
}

/**
 * Tiklama kaydedicisini sayfaya koyar.
 *
 * API adresi tanimli degilse hicbir sey basilmiyor: kaydedecek bir yer yok.
 */
export default function ClickTrackerScript() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;

  return (
    <script
      // Icerik sunucuda ve istemcide ayni oldugu icin React hidrasyonda
      // betigi yeniden calistirmiyor.
      dangerouslySetInnerHTML={{ __html: betik(apiUrl) }}
    />
  );
}
