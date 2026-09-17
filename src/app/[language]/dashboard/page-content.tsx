"use client";

import React, { useState } from "react";
import {
  Plus,
  Eye,
  Edit3,
  BarChart3,
  Share2,
  Settings,
  Link2,
  Users,
  Copy,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useAnalyticsSummary } from "@/services/api/services/analytics";
import { useProfile } from "@/services/api/services/onboarding";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import useLanguage from "@/services/i18n/use-language";

/** Pano ilk acildiginda sayilar yerine bu gosteriliyor. */
const YUKLENIYOR = "—";

function formatSayi(deger: number | undefined, yukleniyor: boolean): string {
  if (yukleniyor || deger === undefined) return YUKLENIYOR;
  return deger.toLocaleString();
}

function Dashboard() {
  const [copied, setCopied] = useState(false);
  const language = useLanguage();

  // ONCEKI HALI TAMAMEN SAHTEYDI: kullanici "johndoe", 1247 tiklama, 8 link
  // ve uydurma bir "Recent Activity" listesi dosyaya gomuluydu. Panoyu acan
  // herkes ayni rakamlari goruyordu.
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: analytics, isLoading: analyticsLoading } =
    useAnalyticsSummary();

  const username = profile?.username ?? analytics?.username;
  const displayName =
    profile?.display_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    username;

  // Tam URL yalnizca tarayicida biliniyor; sunucuda render edilirken
  // origin yok, bu yuzden goruntulenen metin yola indirgeniyor.
  const profilePath = username ? `/${language}/${username}` : "";
  const profileUrl =
    typeof window !== "undefined" && username
      ? `${window.location.origin}${profilePath}`
      : profilePath;

  const links = analytics?.links ?? [];
  const recentLinks = links.slice(0, 5);

  const handleCopyProfile = async () => {
    if (!profileUrl) return;

    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Pano izni yoksa (veya guvenli baglam degilse) sessizce gec;
      // kullanici adresi elle kopyalayabilir.
    }
  };

  const handleShare = async () => {
    if (!profileUrl) return;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: displayName ?? "LinkYoSelf",
          url: profileUrl,
        });
        return;
      } catch {
        // Kullanici paylasimi iptal etti
        return;
      }
    }

    handleCopyProfile();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-page via-page-accent to-page p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-ink">
              {profileLoading
                ? "Welcome back!"
                : `Welcome back, ${displayName}! 👋`}
            </h1>
            <p className="text-ink-muted mt-1">
              Manage your links and track your performance
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={profilePath || `/${language}`}
              className="flex items-center gap-2 bg-surface-raised hover:bg-field text-ink px-4 py-2 rounded-lg border border-line-strong transition-colors"
            >
              <Eye className="h-4 w-4" />
              Preview Page
            </Link>
            <Link
              href={`/${language}/links?new=1`}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Link
            </Link>
          </div>
        </div>

        {/* Profile URL Card */}
        <div className="bg-surface/50 backdrop-blur-sm border border-line rounded-2xl p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold text-ink mb-2">
                Your Profile URL
              </h3>
              <div className="flex items-center gap-2 text-accent font-mono break-all">
                <Link2 className="h-4 w-4 shrink-0" />
                {username ? profileUrl : YUKLENIYOR}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopyProfile}
                disabled={!username}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={handleShare}
                disabled={!username}
                className="flex items-center gap-2 bg-field hover:bg-field-strong disabled:opacity-50 text-ink px-4 py-2 rounded-lg transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 md:gap-6">
          <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-ink" />
              </div>
              <div>
                <p className="text-ink-muted text-sm">Total Clicks</p>
                <p className="text-2xl font-bold text-ink">
                  {formatSayi(analytics?.total_clicks, analyticsLoading)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Link2 className="h-6 w-6 text-ink" />
              </div>
              <div>
                <p className="text-ink-muted text-sm">Active Links</p>
                <p className="text-2xl font-bold text-ink">
                  {formatSayi(analytics?.active_links, analyticsLoading)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-ink" />
              </div>
              <div>
                <p className="text-ink-muted text-sm">Profile Views</p>
                <p className="text-2xl font-bold text-ink">
                  {formatSayi(analytics?.profile_view_count, analyticsLoading)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-surface/50 backdrop-blur-sm border border-line rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-ink mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href={`/${language}/links?new=1`}
              className="flex flex-col items-center gap-2 p-4 bg-field/50 hover:bg-field-strong/50 rounded-xl transition-colors group"
            >
              <Plus className="h-6 w-6 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm text-ink-soft">Add Link</span>
            </Link>
            <Link
              href={`/${language}/profile/edit`}
              className="flex flex-col items-center gap-2 p-4 bg-field/50 hover:bg-field-strong/50 rounded-xl transition-colors group"
            >
              <Edit3 className="h-6 w-6 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm text-ink-soft">Edit Profile</span>
            </Link>
            <Link
              href={`/${language}/profile/customize`}
              className="flex flex-col items-center gap-2 p-4 bg-field/50 hover:bg-field-strong/50 rounded-xl transition-colors group"
            >
              <Settings className="h-6 w-6 text-green-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm text-ink-soft">Customize</span>
            </Link>
            <Link
              href={`/${language}/analytics`}
              className="flex flex-col items-center gap-2 p-4 bg-field/50 hover:bg-field-strong/50 rounded-xl transition-colors group"
            >
              <BarChart3 className="h-6 w-6 text-orange-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm text-ink-soft">Analytics</span>
            </Link>
          </div>
        </div>

        {/* Recent Links */}
        <div className="bg-surface/50 backdrop-blur-sm border border-line rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-ink">Your Links</h3>
            <Link
              href={`/${language}/links`}
              className="text-accent hover:text-accent transition-colors"
            >
              View All
            </Link>
          </div>

          {analyticsLoading ? (
            <p className="text-ink-muted">Loading your links…</p>
          ) : recentLinks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-ink-muted mb-4">
                You haven&apos;t added any links yet.
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
              {recentLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-4 bg-field/30 hover:bg-field/50 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-3 h-3 rounded-full shrink-0 ${link.is_active ? "bg-green-400" : "bg-gray-500"}`}
                    ></div>
                    <div className="min-w-0">
                      <p className="text-ink font-medium truncate">
                        {link.title}
                      </p>
                      <p className="text-ink-muted text-sm truncate">
                        {link.url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-ink font-medium">
                        {link.click_count.toLocaleString()}
                      </p>
                      <p className="text-ink-muted text-xs">clicks</p>
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${link.title}`}
                      className="text-ink-muted hover:text-ink transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NOT: Burada bir "Recent Activity" bolumu vardi ama tamamen
            uydurmaydi ("Your Instagram link got 25 new clicks - 2 hours
            ago"). Backend olay/zaman serisi tutmuyor; gercek veri olmadan
            bu bolum kullaniciyi yaniltiyordu, bu yuzden kaldirildi. */}
      </div>
    </div>
  );
}

export default withPageRequiredAuth(Dashboard);
