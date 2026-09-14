"use client";

import React from "react";
import { BarChart3, Eye, Link2, MousePointerClick, Plus } from "lucide-react";
import Link from "next/link";
import { useAnalyticsSummary } from "@/services/api/services/analytics";
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
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 ${renk} rounded-xl flex items-center justify-center shrink-0`}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-gray-400 text-sm">{baslik}</p>
          <p className="text-2xl font-bold text-white">
            {yukleniyor || deger === undefined
              ? YUKLENIYOR
              : deger.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

function Analytics() {
  const language = useLanguage();
  const { data, isLoading, isError } = useAnalyticsSummary();

  const links = data?.links ?? [];
  const enCokTiklanan = links[0]?.click_count ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 mt-1">
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

            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Clicks by link
              </h2>

              {isLoading ? (
                <p className="text-gray-400">Loading…</p>
              ) : links.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">
                    No links yet — there is nothing to measure.
                  </p>
                  <Link
                    href={`/${language}/links/add`}
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
                          <p className="text-white font-medium truncate">
                            {link.title}
                            {!link.is_active && (
                              <span className="ml-2 text-xs text-gray-400 font-normal">
                                (inactive)
                              </span>
                            )}
                          </p>
                          <p className="text-gray-400 text-sm truncate">
                            {link.url}
                          </p>
                        </div>
                        <p className="text-white font-medium shrink-0">
                          {link.click_count.toLocaleString()}
                        </p>
                      </div>
                      {/* Cubuk en cok tiklanan linke gore olcekleniyor;
                          hicbir tiklama yoksa bos kaliyor. */}
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
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
