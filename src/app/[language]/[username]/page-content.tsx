"use client";

import React from "react";
import { Globe, Instagram, Linkedin, Twitter } from "lucide-react";
import { useTranslation } from "@/services/i18n/client";
import {
  PublicLink,
  PublicProfile,
} from "@/services/api/services/public-profile";
import {
  isLightColor,
  resolveTheme,
  safeColor,
} from "@/services/profile-theme";

/**
 * Dis baglanti adresini mutlak hale getirir.
 *
 * Backend'in PUT /profile/update ucu website alanini normalize etmiyor
 * (ProfileCompletionStep2'deki validator orada yok), bu yuzden "ornek.com"
 * gibi semasiz degerler gelebiliyor. Boyle bir deger href'e oldugu gibi
 * konursa tarayici onu goreli yol sayar ve link kirilir.
 */
function toAbsoluteUrl(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

/**
 * Sosyal medya kullanici adindan bastaki @ isaretini temizler.
 * Backend step-3 ucunda temizliyor ama /profile/update ucunda temizlemiyor.
 */
function cleanHandle(value: string): string {
  return value.replace(/^@+/, "");
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type Props = {
  profile: PublicProfile;
};

const PublicProfilePage: React.FC<Props> = ({ profile }) => {
  const { t } = useTranslation("public-profile");

  // Tema kurallari ortak modulde; duzenleme ekranindaki onizleme ayni
  // fonksiyonu kullaniyor, boylece onizleme ile yayindaki sayfa ayrisamiyor.
  const { themeColor, pageStyle, textColor, mutedTextColor } =
    resolveTheme(profile);

  const socials = [
    { key: "twitter", base: "https://twitter.com/", Icon: Twitter },
    { key: "instagram", base: "https://instagram.com/", Icon: Instagram },
    { key: "linkedin", base: "https://linkedin.com/in/", Icon: Linkedin },
  ]
    .map((social) => {
      const raw = {
        twitter: profile.twitter_username,
        instagram: profile.instagram_username,
        linkedin: profile.linkedin_username,
      }[social.key];
      const handle = raw ? cleanHandle(raw) : "";
      return { ...social, handle, href: `${social.base}${handle}` };
    })
    .filter((social) => social.handle.length > 0);

  return (
    <main className="min-h-screen px-4 py-12" style={pageStyle}>
      <div className="mx-auto w-full max-w-xl">
        <header className="flex flex-col items-center text-center">
          {profile.profile_image_url ? (
            // next/image yerine <img>: profil gorseli kullanicinin verdigi
            // rastgele bir dis URL ve next/image icin alan adlarinin
            // next.config.js'te onceden tanimli olmasi gerekiyor.
            <img
              src={profile.profile_image_url}
              alt={profile.display_name}
              className="h-24 w-24 rounded-full object-cover shadow-lg"
            />
          ) : (
            <div
              // text-white sabit: bu sayfanin renkleri ziyaretcinin degil, profil
              // sahibinin sectigi temadan geliyor (asagidaki themeColor).
              // Ziyaretcinin acik/koyu tercihi burayi etkilememeli.
              className="flex h-24 w-24 items-center justify-center rounded-full text-2xl font-semibold text-white shadow-lg"
              style={{ backgroundColor: themeColor }}
              aria-hidden="true"
            >
              {initials(profile.display_name)}
            </div>
          )}

          <h1 className={`mt-4 text-2xl font-bold ${textColor}`}>
            {profile.display_name}
          </h1>
          <p className={`text-sm ${mutedTextColor}`}>@{profile.username}</p>

          {profile.bio ? (
            <p className={`mt-3 whitespace-pre-line text-sm ${mutedTextColor}`}>
              {profile.bio}
            </p>
          ) : null}

          {socials.length > 0 || profile.website ? (
            <nav
              // gap-4 -> gap-1: asagidaki baglantilara dokunma hedefi icin
              // dolgu eklendi (20 piksellik ikon 44 piksellik alan
              // icinde). Aralik daraltilmasa ikonlar birbirinden kopardi;
              // gorunen bosluk boylece ayni kaliyor.
              className="mt-3 flex items-center gap-1"
              aria-label={t("socialLinks")}
            >
              {profile.website ? (
                <a
                  href={toAbsoluteUrl(profile.website)}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className={`p-3 transition-opacity hover:opacity-70 ${textColor}`}
                  aria-label={t("website")}
                >
                  <Globe className="h-5 w-5" />
                </a>
              ) : null}
              {socials.map(({ key, href, Icon }) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className={`p-3 transition-opacity hover:opacity-70 ${textColor}`}
                  aria-label={key}
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </nav>
          ) : null}
        </header>

        <section className="mt-8 flex flex-col gap-3" aria-label={t("links")}>
          {profile.links.length === 0 ? (
            <p className={`text-center text-sm ${mutedTextColor}`}>
              {t("noLinks")}
            </p>
          ) : (
            profile.links.map((link) => (
              <LinkButton key={link.id} link={link} themeColor={themeColor} />
            ))
          )}
        </section>

        <footer className={`mt-12 text-center text-xs ${mutedTextColor}`}>
          {t("poweredBy")}
        </footer>
      </div>
    </main>
  );
};

type LinkButtonProps = {
  link: PublicLink;
  themeColor: string;
};

const LinkButton: React.FC<LinkButtonProps> = ({ link, themeColor }) => {
  const background = safeColor(link.background_color, themeColor);
  const color = safeColor(
    link.text_color,
    isLightColor(background) ? "#111827" : "#ffffff"
  );

  return (
    // Gercek bir <a> kullaniyoruz: orta tik / yeni sekmede ac gibi tarayici
    // davranislari korunsun.
    //
    // Tiklama kaydi burada bir onClick degil: baglanti sunucuda render
    // edildigi icin React baglanmadan once de tiklanabiliyor ve o tiklama
    // kaybolurdu. Kaydi, sayfaya satir ici konan bir betik ustleniyor
    // (bkz. click-tracker-script.tsx); ona gereken tek sey asagidaki
    // data-link-id. Iki taraf ayrisirsa traffic-sources.spec.ts'teki
    // "React hic yuklenmese bile" testi duser.
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      data-link-id={link.id}
      className="block px-5 py-4 text-center font-medium shadow-sm transition-transform hover:scale-[1.02]"
      style={{
        backgroundColor: background,
        color,
        borderRadius: `${link.border_radius}px`,
      }}
    >
      <span className="flex items-center justify-center gap-2">
        {link.icon_url ? (
          // next/image yerine <img>: kullanicinin verdigi dis ikon URL'i
          <img src={link.icon_url} alt="" className="h-5 w-5 object-contain" />
        ) : null}
        <span>{link.title}</span>
      </span>
      {link.description ? (
        <span className="mt-1 block text-xs opacity-80">
          {link.description}
        </span>
      ) : null}
    </a>
  );
};

export default PublicProfilePage;
