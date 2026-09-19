"use client";

import React from "react";
import NextLink from "next/link";
import {
  ExternalLink,
  Globe,
  Instagram,
  Link2,
  Linkedin,
  Mail,
  Palette,
  Pencil,
  Twitter,
} from "lucide-react";
import { useProfile } from "@/services/api/services/onboarding";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useTranslation } from "@/services/i18n/client";
import useLanguage from "@/services/i18n/use-language";

/** Ad/soyad bos olabilir; @username her zaman var. */
function displayNameOf(profile: {
  display_name?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
}): string | undefined {
  return (
    profile.display_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.username
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function Profile() {
  const { t } = useTranslation("profile");
  const language = useLanguage();

  // ONCEDEN useAuth().user okunuyordu: o nesne oturum acilisinda bir kez
  // yukleniyor ve profil baska bir ekrandan degistiginde bayat kalabiliyordu.
  // /v1/profile/me her zaman guncel.
  const { data: profile, isLoading } = useProfile();

  const name = profile ? displayNameOf(profile) : undefined;
  const completion = profile?.profile_completion_percentage ?? 0;

  const socials = [
    {
      key: "twitter",
      handle: profile?.twitter_username,
      href: "https://twitter.com/",
      Icon: Twitter,
    },
    {
      key: "instagram",
      handle: profile?.instagram_username,
      href: "https://instagram.com/",
      Icon: Instagram,
    },
    {
      key: "linkedin",
      handle: profile?.linkedin_username,
      href: "https://linkedin.com/in/",
      Icon: Linkedin,
    },
  ].filter((social) => Boolean(social.handle));

  const actionClass =
    "inline-flex items-center gap-2 bg-field hover:bg-field-strong text-ink px-4 py-2 rounded-lg transition-colors";

  return (
    <div className="min-h-screen bg-gradient-to-br from-page via-page-accent to-page p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-ink">{t("profile:title")}</h1>
          <p className="text-ink-muted mt-1">
            {t("profile:overview.subtitle")}
          </p>
        </div>

        <div className="bg-surface/50 backdrop-blur-sm border border-line rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row gap-5">
            {profile?.profile_image_url ? (
              <img
                src={profile.profile_image_url}
                alt={name ?? ""}
                data-testid="user-icon"
                className="h-24 w-24 rounded-full object-cover shrink-0"
              />
            ) : (
              <div
                data-testid="user-icon"
                className="h-24 w-24 rounded-full bg-purple-600 text-white flex items-center justify-center text-2xl font-semibold shrink-0"
              >
                {name ? initials(name) : "?"}
              </div>
            )}

            <div className="min-w-0 space-y-2">
              <h2
                data-testid="user-name"
                className="text-2xl font-semibold text-ink truncate"
              >
                {isLoading ? "—" : (name ?? t("profile:overview.noName"))}
              </h2>

              {profile?.username && (
                <p className="flex items-center gap-2 text-accent font-mono text-sm break-all">
                  <Link2 className="h-4 w-4 shrink-0" />/{language}/
                  {profile.username}
                </p>
              )}

              <p
                data-testid="user-email"
                className="flex items-center gap-2 text-ink-soft text-sm break-all"
              >
                <Mail className="h-4 w-4 shrink-0 text-ink-muted" />
                {profile?.email ?? "—"}
                {profile && (
                  <span
                    className={`text-xs shrink-0 ${
                      profile.email_verified
                        ? "text-green-400"
                        : "text-amber-400"
                    }`}
                  >
                    {profile.email_verified
                      ? t("profile:overview.emailVerified")
                      : t("profile:overview.emailUnverified")}
                  </span>
                )}
              </p>

              <p className="text-ink-soft">
                {profile?.bio || (
                  <span className="text-ink-faint">
                    {t("profile:overview.noBio")}
                  </span>
                )}
              </p>

              {profile?.website && (
                <a
                  href={
                    /^https?:\/\//i.test(profile.website)
                      ? profile.website
                      : `https://${profile.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink break-all"
                >
                  <Globe className="h-4 w-4 shrink-0 text-ink-muted" />
                  {profile.website}
                </a>
              )}

              {socials.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-1">
                  {socials.map(({ key, handle, href, Icon }) => (
                    <a
                      key={key}
                      // Backend PUT /profile/update'te bastaki @'i temizlemiyor;
                      // adrese oldugu gibi konursa link kirilir.
                      href={`${href}${(handle ?? "").replace(/^@+/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
                    >
                      <Icon className="h-4 w-4" />
                      {handle}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profil tamamlanma orani backend'den geliyor (UserRead) */}
        <div className="bg-surface/50 backdrop-blur-sm border border-line rounded-2xl p-6 space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-ink">
              {t("profile:overview.completion")}
            </h2>
            <span className="text-ink font-medium">{completion}%</span>
          </div>
          <div className="h-2 bg-field rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
          {completion < 100 && (
            <p className="text-xs text-ink-muted">
              {t("profile:overview.completionHint")}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <NextLink
            href={`/${language}/profile/edit`}
            data-testid="edit-profile"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Pencil className="h-4 w-4" />
            {t("profile:actions.edit")}
          </NextLink>
          <NextLink
            href={`/${language}/profile/customize`}
            className={actionClass}
          >
            <Palette className="h-4 w-4" />
            {t("profile:actions.customize")}
          </NextLink>
          <NextLink href={`/${language}/links`} className={actionClass}>
            <Link2 className="h-4 w-4" />
            {t("profile:actions.manageLinks")}
          </NextLink>
          {profile?.username && (
            <NextLink
              href={`/${language}/${profile.username}`}
              className={actionClass}
            >
              <ExternalLink className="h-4 w-4" />
              {t("profile:actions.viewPublic")}
            </NextLink>
          )}
        </div>
      </div>
    </div>
  );
}

export default withPageRequiredAuth(Profile);
