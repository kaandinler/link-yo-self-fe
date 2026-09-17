"use client";

import React, { useState } from "react";
import { BarChart3, Eye, Link2, MousePointerClick, Plus } from "lucide-react";
import Link from "next/link";
import {
  TIMESERIES_RANGES,
  type TimeseriesRange,
  useAnalyticsSummary,
  useAnalyticsTimeseries,
  useLinkTimeseries,
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
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import useLanguage from "@/services/i18n/use-language";

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

/** Zaman araligi secici. Yalnizca altindaki grafigi ve tabloyu kapsiyor. */
function AralikSecici({
  secili,
  sec,
}: {
  secili: TimeseriesRange;
  sec: (gun: TimeseriesRange) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Date range"
      className="inline-flex rounded-lg border border-line p-1"
    >
      {TIMESERIES_RANGES.map((gun) => (
        <button
          key={gun}
          type="button"
          onClick={() => sec(gun)}
          aria-pressed={secili === gun}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            secili === gun
              ? "bg-purple-600 text-white"
              : "text-ink-soft hover:bg-field"
          }`}
        >
          Last {gun} days
        </button>
      ))}
    </div>
  );
}

function Analytics() {
  const language = useLanguage();
  const { data, isLoading, isError } = useAnalyticsSummary();
  const [gun, setGun] = useState<TimeseriesRange>(7);
  const {
    data: seri,
    isLoading: seriYukleniyor,
    isFetching: seriTazeleniyor,
    isError: seriHatasi,
  } = useAnalyticsTimeseries(gun);
  const {
    data: linkSerisi,
    isLoading: linkSerisiYukleniyor,
    isError: linkSerisiHatasi,
  } = useLinkTimeseries(gun);
  const {
    data: kaynaklar,
    isLoading: kaynaklarYukleniyor,
    isError: kaynaklarHatasi,
  } = useReferrers(gun);

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
          <h1 className="text-3xl font-bold text-ink">Analytics</h1>
          <p className="text-ink-muted mt-1">
            How your profile and links are performing
          </p>
        </div>

        {isError ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
            <p className="text-red-300">
              Analytics could not be loaded. Please try again later.
            </p>
          </div>
        ) : (
          <>
            {/* Ozetteki sayilar hesabin tum gecmisini kapsiyor; asagidaki
                grafik yalnizca secili araligi. Ikisi birbirini tutmak zorunda
                degil, bu yuzden basliklari ayri. */}
            <h2 className="text-lg font-semibold text-ink">All time</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <IstatistikKarti
                baslik="Profile Views"
                deger={data?.profile_view_count}
                yukleniyor={isLoading}
                icon={Eye}
                renk="bg-green-500"
              />
              <IstatistikKarti
                baslik="Total Clicks"
                deger={data?.total_clicks}
                yukleniyor={isLoading}
                icon={MousePointerClick}
                renk="bg-blue-500"
              />
              <IstatistikKarti
                baslik="Total Links"
                deger={data?.total_links}
                yukleniyor={isLoading}
                icon={Link2}
                renk="bg-purple-500"
              />
              <IstatistikKarti
                baslik="Active Links"
                deger={data?.active_links}
                yukleniyor={isLoading}
                icon={BarChart3}
                renk="bg-orange-500"
              />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
              <h2 className="text-lg font-semibold text-ink">Over time</h2>
              <AralikSecici secili={gun} sec={setGun} />
            </div>

            <div className="bg-surface/50 backdrop-blur-sm border border-line rounded-2xl p-6 space-y-4">
              {seriHatasi ? (
                <p className="text-red-300">
                  The activity chart could not be loaded.
                </p>
              ) : seriYukleniyor ? (
                <p className="text-ink-muted">Loading…</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <ActivityLegend />
                    <p className="text-sm text-ink-muted">
                      <span className="text-ink font-semibold tabular-nums">
                        {seri?.total_clicks.toLocaleString()}
                      </span>{" "}
                      clicks ·{" "}
                      <span className="text-ink font-semibold tabular-nums">
                        {seri?.total_profile_views.toLocaleString()}
                      </span>{" "}
                      profile views in this range
                    </p>
                  </div>

                  <ActivityChart points={noktalar} soluk={seriTazeleniyor} />

                  {aralikBos && (
                    /* Bos grafik "hic olmadi" demiyor: gunluk kayit yeni
                       basladi, ondan oncesi yalnizca toplamlarda duruyor. */
                    <p className="text-sm text-ink-muted">
                      No activity recorded in this range. Daily history starts
                      from the day activity tracking was added, so older visits
                      only appear in the all-time totals above.
                    </p>
                  )}

                  <details className="group">
                    <summary
                      data-testid="activity-table-toggle"
                      className="cursor-pointer text-sm text-ink-muted hover:text-ink-soft"
                    >
                      Show data table
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
                Clicks by link in this range
              </h2>

              {linkSerisiHatasi ? (
                <p className="text-red-300">
                  The link breakdown could not be loaded.
                </p>
              ) : linkSerisiYukleniyor ? (
                <p className="text-ink-muted">Loading…</p>
              ) : linkSerileri.length === 0 ? (
                <p className="text-ink-muted">
                  No links yet — there is nothing to measure.
                </p>
              ) : (
                <>
                  <ul className="space-y-3">
                    {linkSerileri.map((link) => (
                      <li
                        key={link.id}
                        className="flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <p className="text-ink font-medium truncate">
                            {link.title}
                            {!link.is_active && (
                              <span className="ml-2 text-xs text-ink-muted font-normal">
                                (inactive)
                              </span>
                            )}
                          </p>
                          <p className="text-ink-muted text-sm truncate">
                            {link.url}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
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
                      Show data table
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
                  Traffic sources
                </h2>
                <p className="text-ink-muted text-sm mt-1">
                  Where visitors were before they landed on your page and
                  clicked a link.
                </p>
              </div>

              {kaynaklarHatasi ? (
                <p className="text-red-300">
                  Traffic sources could not be loaded.
                </p>
              ) : kaynaklarYukleniyor ? (
                <p className="text-ink-muted">Loading…</p>
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
                    “Direct or unknown” covers visits typed straight into the
                    address bar, apps that hide the referrer, and navigation
                    from within this site. Source tracking starts from the day
                    it was added, so older clicks are counted there too.
                  </p>
                </>
              )}
            </div>

            <div className="bg-surface/50 backdrop-blur-sm border border-line rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-ink mb-4">
                Clicks by link, all time
              </h2>

              {isLoading ? (
                <p className="text-ink-muted">Loading…</p>
              ) : links.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-ink-muted mb-4">
                    No links yet — there is nothing to measure.
                  </p>
                  <Link
                    href={`/${language}/links?new=1`}
                    className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add your first link
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
                                (inactive)
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
