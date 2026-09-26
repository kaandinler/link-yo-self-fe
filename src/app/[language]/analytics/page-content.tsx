"use client";

import React, { useState } from "react";
import { BarChart3, Eye, Link2, MousePointerClick, Plus } from "lucide-react";
import Link from "next/link";
import {
  DEFAULT_RANGE,
  TIMESERIES_RANGES,
  rangeError,
  type SelectedRange,
  useAnalyticsSummary,
  useAnalyticsTimeseries,
  useLinkTimeseries,
  useBestTimes,
  useReferrers,
} from "@/services/api/services/analytics";
import ActivityChart, {
  ActivityLegend,
  ActivityTable,
} from "@/components/charts/activity-chart";
import LinkSparkline, {
  ButunLinklerTablosu,
  ortakTavan,
} from "@/components/charts/link-sparkline";
import ReferrerBars from "@/components/charts/referrer-bars";
import {
  HourBars,
  saatEtiketi,
  WeekdayBars,
} from "@/components/charts/time-bars";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import useLanguage from "@/services/i18n/use-language";
import { Trans, useTranslation } from "@/services/i18n/client";

const YUKLENIYOR = "—";

function IstatistikKarti({
  baslik,
  deger,
  yukleniyor,
  icon: Icon,
  renk,
}: {
  baslik: string;
  deger: number | undefined;
  yukleniyor: boolean;
  icon: React.ComponentType<{ className?: string }>;
  renk: string;
}) {
  return (
    <div className="bg-surface/50 backdrop-blur-sm border border-line rounded-2xl p-6">
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 ${renk} rounded-xl flex items-center justify-center shrink-0`}
        >
          <Icon className="h-6 w-6 text-ink" />
        </div>
        <div>
          <p className="text-ink-muted text-sm">{baslik}</p>
          <p className="text-2xl font-bold text-ink">
            {yukleniyor || deger === undefined
              ? YUKLENIYOR
              : deger.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Bugunun tarihi, <input type="date"> bicimiyle. */
function bugununTarihi(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Zaman araligi secici. Yalnizca altindaki bolumleri kapsiyor.
 *
 * Hazir araliklar ("son 7 gun") her gun kayiyor; serbest aralik sabit.
 * Ikisi ayri sorular oldugu icin serbest alanlar yalnizca "Custom"
 * secilince aciliyor -- aksi halde her zaman gorunen iki bos tarih
 * kutusu, hazir araligi kullanan herkese gereksiz gurultu olurdu.
 */
function AralikSecici({
  secili,
  sec,
}: {
  secili: SelectedRange;
  sec: (aralik: SelectedRange) => void;
}) {
  const { t } = useTranslation("analytics");
  const serbest = secili.kind === "custom";
  const [acik, setAcik] = useState(serbest);
  // IKISI DE BOS BASLIYOR. "son" bugunle baslatilinca yalnizca baslangici
  // secmek tamamlanmis bir aralik gibi gorunuyor ve kullanici daha bitis
  // tarihini yazmadan istek gidiyordu -- hem bosa bir istek hem de bir
  // an icin yanlis araligin verisi.
  const [bas, setBas] = useState(serbest ? secili.start : "");
  const [son, setSon] = useState(serbest ? secili.end : "");

  const hataAnahtari = acik ? rangeError(bas, son) : null;
  const hata = hataAnahtari ? t(hataAnahtari.key, hataAnahtari.params) : null;

  // Gecerli bir aralik girildiginde kendiliginden uygulaniyor: ayri bir
  // "Apply" dugmesi, tarihleri secip sonucu bekleyen kullaniciyi bos
  // ekranda birakiyordu.
  React.useEffect(() => {
    if (!acik || rangeError(bas, son)) return;
    sec({ kind: "custom", start: bas, end: son });
    // sec her render'da yeni bir referans olabilir; yalnizca tarihler
    // degisince calismali.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acik, bas, son]);

  return (
    <div className="space-y-2">
      <div
        role="group"
        aria-label={t("range.label")}
        className="inline-flex flex-wrap rounded-lg border border-line p-1"
      >
        {TIMESERIES_RANGES.map((gun) => {
          const seciliMi =
            !acik && secili.kind === "days" && secili.days === gun;
          return (
            <button
              key={gun}
              type="button"
              onClick={() => {
                setAcik(false);
                sec({ kind: "days", days: gun });
              }}
              aria-pressed={seciliMi}
              className={`min-h-[44px] px-3 py-1.5 text-sm rounded-md transition-colors ${
                seciliMi
                  ? "bg-purple-600 text-white"
                  : "text-ink-soft hover:bg-field"
              }`}
            >
              {t("range.lastDays", { days: gun })}
            </button>
          );
        })}
        <button
          type="button"
          data-testid="range-custom"
          onClick={() => setAcik(true)}
          aria-pressed={acik}
          className={`min-h-[44px] px-3 py-1.5 text-sm rounded-md transition-colors ${
            acik ? "bg-purple-600 text-white" : "text-ink-soft hover:bg-field"
          }`}
        >
          {t("range.custom")}
        </button>
      </div>

      {acik && (
        // TELEFONDA ALT ALTA, GENISTE YAN YANA. Tek satirda birakilinca
        // 393 piksellik bir telefonda ikinci alanin sag kenari kullanilabilir
        // alanin 0,1 pikseli kadar icinde kaliyordu -- bir karakter daha
        // genis bir tarih bicimi tasirdi. 360 pikselde ise alanlar sarip
        // hizasiz iki satira dusuyordu, cunku "From" ile "to" ayni
        // genislikte degil.
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            {/* Sabit etiket sutunu: iki satirin girdileri ayni yerden
                basliyor. */}
            <span className="w-10 shrink-0 sm:w-auto">{t("range.from")}</span>
            <input
              type="date"
              data-testid="range-start"
              value={bas}
              max={son || bugununTarihi()}
              onChange={(olay) => setBas(olay.target.value)}
              // h-11: 44 piksel, parmakla isabet ettirilebilen en kucuk
              // hedef. Onceki py-1 ile 32 pikseldi.
              className="h-11 w-full rounded-md border border-line bg-field px-2 text-ink sm:w-auto"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <span className="w-10 shrink-0 sm:w-auto">{t("range.to")}</span>
            <input
              type="date"
              data-testid="range-end"
              value={son}
              min={bas || undefined}
              onChange={(olay) => setSon(olay.target.value)}
              className="h-11 w-full rounded-md border border-line bg-field px-2 text-ink sm:w-auto"
            />
          </label>
          {hata && (
            // Istek gonderip 422 beklemek yerine burada soyleniyor;
            // yarim girilmis bir aralik icin istek de atilmiyor.
            //
            // Telefonda kendi satirinda: yan yana birakilinca ikinci
            // alanin sagina sikisip okunmaz hale geliyordu.
            <p
              data-testid="range-error"
              role="status"
              className="text-sm text-red-500"
            >
              {hata}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Analytics() {
  const { t } = useTranslation("analytics");
  const language = useLanguage();
  const { data, isLoading, isError } = useAnalyticsSummary();
  const [aralik, setAralik] = useState<SelectedRange>(DEFAULT_RANGE);
  const {
    data: seri,
    isLoading: seriYukleniyor,
    isFetching: seriTazeleniyor,
    isError: seriHatasi,
  } = useAnalyticsTimeseries(aralik);
  const {
    data: linkSerisi,
    isLoading: linkSerisiYukleniyor,
    isError: linkSerisiHatasi,
  } = useLinkTimeseries(aralik);
  const {
    data: kaynaklar,
    isLoading: kaynaklarYukleniyor,
    isError: kaynaklarHatasi,
  } = useReferrers(aralik);
  const {
    data: zamanlar,
    isLoading: zamanlarYukleniyor,
    isError: zamanlarHatasi,
  } = useBestTimes(aralik);

  const links = data?.links ?? [];
  const enCokTiklanan = links[0]?.click_count ?? 0;
  const noktalar = seri?.points ?? [];
  const aralikBos =
    !!seri && seri.total_clicks === 0 && seri.total_profile_views === 0;
  const linkSerileri = linkSerisi?.links ?? [];
  const linkTavani = ortakTavan(linkSerileri);

  return (
    <div className="min-h-screen bg-gradient-to-br from-page via-page-accent to-page p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-ink">{t("title")}</h1>
          <p className="text-ink-muted mt-1">{t("subtitle")}</p>
        </div>

        {isError ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
            <p className="text-red-300">{t("loadFailed")}</p>
          </div>
        ) : (
          <>
            {/* Ozetteki sayilar hesabin tum gecmisini kapsiyor; asagidaki
                grafik yalnizca secili araligi. Ikisi birbirini tutmak zorunda
                degil, bu yuzden basliklari ayri. */}
            <h2 className="text-lg font-semibold text-ink">{t("allTime")}</h2>

            {/* Telefonda 2 sutun: tek sutunda dort kart ekranin tamamini
                yiyor ve altindaki grafik hic gorunmuyordu. */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <IstatistikKarti
                baslik={t("stats.profileViews")}
                deger={data?.profile_view_count}
                yukleniyor={isLoading}
                icon={Eye}
                renk="bg-green-500"
              />
              <IstatistikKarti
                baslik={t("stats.totalClicks")}
                deger={data?.total_clicks}
                yukleniyor={isLoading}
                icon={MousePointerClick}
                renk="bg-blue-500"
              />
              <IstatistikKarti
                baslik={t("stats.totalLinks")}
                deger={data?.total_links}
                yukleniyor={isLoading}
                icon={Link2}
                renk="bg-purple-500"
              />
              <IstatistikKarti
                baslik={t("stats.activeLinks")}
                deger={data?.active_links}
                yukleniyor={isLoading}
                icon={BarChart3}
                renk="bg-orange-500"
              />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
              <h2 className="text-lg font-semibold text-ink">
                {t("overTime")}
              </h2>
              <AralikSecici secili={aralik} sec={setAralik} />
            </div>

            <div className="bg-surface/50 backdrop-blur-sm border border-line rounded-2xl p-6 space-y-4">
              {seriHatasi ? (
                <p className="text-red-300">{t("activity.error")}</p>
              ) : seriYukleniyor ? (
                <p className="text-ink-muted">{t("loading")}</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <ActivityLegend />
                    <p className="text-sm text-ink-muted">
                      <Trans
                        i18nKey="analytics:activity.summary"
                        values={{
                          clicks: seri?.total_clicks.toLocaleString(),
                          views: seri?.total_profile_views.toLocaleString(),
                        }}
                        components={[
                          <span
                            key="clicks"
                            className="text-ink font-semibold tabular-nums"
                          />,
                          <span
                            key="views"
                            className="text-ink font-semibold tabular-nums"
                          />,
                        ]}
                      />
                    </p>
                  </div>

                  <ActivityChart points={noktalar} soluk={seriTazeleniyor} />

                  {aralikBos && (
                    /* Bos grafik "hic olmadi" demiyor: gunluk kayit yeni
                       basladi, ondan oncesi yalnizca toplamlarda duruyor. */
                    <p className="text-sm text-ink-muted">
                      {t("activity.empty")}
                    </p>
                  )}

                  <details className="group">
                    <summary
                      data-testid="activity-table-toggle"
                      className="cursor-pointer text-sm text-ink-muted hover:text-ink-soft"
                    >
                      {t("showDataTable")}
                    </summary>
                    <div className="mt-3 overflow-x-auto">
                      <ActivityTable points={noktalar} />
                    </div>
                  </details>
                </>
              )}
            </div>

            {/* Link kirilimi da secili araliga bagli; ayni AralikSecici'nin
                altinda duruyor ki sayilar ust taraftaki grafikle ayni donemi
                anlatsin. */}
            <div className="bg-surface/50 backdrop-blur-sm border border-line rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-ink">
                {t("linkBreakdown.title")}
              </h2>

              {linkSerisiHatasi ? (
                <p className="text-red-300">{t("linkBreakdown.error")}</p>
              ) : linkSerisiYukleniyor ? (
                <p className="text-ink-muted">{t("loading")}</p>
              ) : linkSerileri.length === 0 ? (
                <p className="text-ink-muted">{t("linkBreakdown.empty")}</p>
              ) : (
                <>
                  <ul className="space-y-3">
                    {linkSerileri.map((link) => (
                      // Telefonda satir alt alta: yan yana dizilince 140
                      // piksellik egri basliga yer birakmiyor ve baslik
                      // "Portfolyo s..." diye kirpiliyordu. Sayi ile egri
                      // ayni satirda kaliyor -- birbirlerini anlatiyorlar.
                      <li
                        key={link.id}
                        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                      >
                        <div className="min-w-0">
                          <p className="text-ink font-medium truncate">
                            {link.title}
                            {!link.is_active && (
                              <span className="ml-2 text-xs text-ink-muted font-normal">
                                {t("inactive")}
                              </span>
                            )}
                          </p>
                          <p className="text-ink-muted text-sm truncate">
                            {link.url}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-4 shrink-0 sm:justify-end">
                          <p className="text-ink font-medium tabular-nums w-12 text-right">
                            {link.total_clicks.toLocaleString()}
                          </p>
                          <LinkSparkline link={link} tavan={linkTavani} />
                        </div>
                      </li>
                    ))}
                  </ul>

                  <details>
                    <summary
                      data-testid="link-table-toggle"
                      className="cursor-pointer text-sm text-ink-muted hover:text-ink-soft"
                    >
                      {t("showDataTable")}
                    </summary>
                    <div className="mt-3 overflow-x-auto">
                      <ButunLinklerTablosu links={linkSerileri} />
                    </div>
                  </details>
                </>
              )}
            </div>

            {/* Kaynak dagilimi da secili araliga bagli: ustteki grafikle ayni
                donemi anlatmasi icin AralikSecici'nin altinda kaliyor. */}
            <div className="bg-surface/50 backdrop-blur-sm border border-line rounded-2xl p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-ink">
                  {t("referrers.title")}
                </h2>
                <p className="text-ink-muted text-sm mt-1">
                  {t("referrers.subtitle")}
                </p>
              </div>

              {kaynaklarHatasi ? (
                <p className="text-red-300">{t("referrers.error")}</p>
              ) : kaynaklarYukleniyor ? (
                <p className="text-ink-muted">{t("loading")}</p>
              ) : (
                <>
                  <ReferrerBars
                    sources={kaynaklar?.sources ?? []}
                    totalClicks={kaynaklar?.total_clicks ?? 0}
                  />

                  {/* "Direct" bir kaynak degil, kaynagin bilinmedigi durum.
                      Bunu yazmazsak yuksek bir Direct payi "dogrudan cok
                      ziyaretcim var" diye okunuyor. */}
                  <p className="text-sm text-ink-muted">
                    {t("referrers.note")}
                  </p>
                </>
              )}
            </div>

            {/* Kaynak dagiliminin hemen ardindan: biri "nereden", digeri
                "ne zaman" sorusunu cevapliyor. */}
            <div className="bg-surface/50 backdrop-blur-sm border border-line rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-ink">
                  {t("times.title")}
                </h2>
                <p className="text-ink-muted text-sm mt-1">
                  {zamanlar?.timezone
                    ? t("times.subtitleWithZone", { zone: zamanlar.timezone })
                    : t("times.subtitlePlain")}
                </p>
              </div>

              {zamanlarHatasi ? (
                <p className="text-red-300">{t("times.error")}</p>
              ) : zamanlarYukleniyor ? (
                <p className="text-ink-muted">{t("loading")}</p>
              ) : !zamanlar || zamanlar.total_clicks === 0 ? (
                <p className="text-ink-muted">{t("times.empty")}</p>
              ) : (
                <>
                  {/* Cumlenin kendisi zirveyi soyluyor: cubuklarda rengi
                      degistirmek tek kanal olurdu. enough_data false iken
                      bu bir cikarim degil, yalnizca "su ana kadar". */}
                  <p className="text-sm text-ink-soft">
                    {zamanlar.enough_data ? (
                      <Trans
                        i18nKey="analytics:times.peak"
                        values={{
                          day:
                            zamanlar.peak_weekday !== null
                              ? t(`weekdays.${zamanlar.peak_weekday}`)
                              : "—",
                          hour:
                            zamanlar.peak_hour !== null
                              ? saatEtiketi(zamanlar.peak_hour)
                              : "—",
                        }}
                        components={[
                          <span key="day" className="font-semibold text-ink" />,
                          <span
                            key="hour"
                            className="font-semibold text-ink"
                          />,
                        ]}
                      />
                    ) : (
                      <>{t("times.notEnough")}</>
                    )}
                  </p>

                  {zamanlar.days < 14 && (
                    /* Yedi gunluk bir aralikta her haftaguno bir kez
                       gecer; "hangi gun daha iyi" sorusu sorulamaz.
                       Gun sayisi yanittan okunuyor: serbest aralikta
                       secimin kac gun ettigini sunucu soyluyor. */
                    <p className="text-sm text-ink-muted">
                      {t("times.shortRange", { days: zamanlar.days })}
                    </p>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-ink-soft mb-3">
                      {t("times.byWeekday")}
                    </h3>
                    <WeekdayBars buckets={zamanlar.by_weekday} />
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-ink-soft mb-3">
                      {t("times.byHour")}
                    </h3>
                    <HourBars buckets={zamanlar.by_hour} />
                  </div>
                </>
              )}
            </div>

            <div className="bg-surface/50 backdrop-blur-sm border border-line rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-ink mb-4">
                {t("allTimeLinks.title")}
              </h2>

              {isLoading ? (
                <p className="text-ink-muted">{t("loading")}</p>
              ) : links.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-ink-muted mb-4">
                    {t("linkBreakdown.empty")}
                  </p>
                  <Link
                    href={`/${language}/links?new=1`}
                    className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 min-h-[44px] rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    {t("allTimeLinks.addFirst")}
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {links.map((link) => (
                    <div key={link.id} className="space-y-1">
                      <div className="flex items-baseline justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-ink font-medium truncate">
                            {link.title}
                            {!link.is_active && (
                              <span className="ml-2 text-xs text-ink-muted font-normal">
                                {t("inactive")}
                              </span>
                            )}
                          </p>
                          <p className="text-ink-muted text-sm truncate">
                            {link.url}
                          </p>
                        </div>
                        <p className="text-ink font-medium shrink-0">
                          {link.click_count.toLocaleString()}
                        </p>
                      </div>
                      {/* Cubuk en cok tiklanan linke gore olcekleniyor;
                          hicbir tiklama yoksa bos kaliyor. */}
                      <div className="h-2 bg-field rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                          style={{
                            width:
                              enCokTiklanan > 0
                                ? `${(link.click_count / enCokTiklanan) * 100}%`
                                : "0%",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default withPageRequiredAuth(Analytics);
