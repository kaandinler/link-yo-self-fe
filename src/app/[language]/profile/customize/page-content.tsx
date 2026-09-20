"use client";

import React, { useEffect, useState } from "react";
import NextLink from "next/link";
import {
  EyeOff,
  ExternalLink,
  Image as ImageIcon,
  Palette,
} from "lucide-react";
import {
  ProfileUpdateData,
  useProfile,
  useUpdateProfile,
} from "@/services/api/services/onboarding";
import {
  usePageSettings,
  useUpdatePageSettings,
} from "@/services/api/services/page-settings";
import useAuthActions from "@/services/auth/use-auth-actions";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useSnackbar } from "@/hooks/use-snackbar";
import useLanguage from "@/services/i18n/use-language";
import { useTranslation } from "@/services/i18n/client";
import {
  BACKGROUND_TYPES,
  BackgroundType,
  DEFAULT_BACKGROUND,
  DEFAULT_THEME_COLOR,
  HEX_COLOR,
  resolveTheme,
  safeImageUrl,
} from "@/services/profile-theme";

function isBackgroundType(value: unknown): value is BackgroundType {
  return BACKGROUND_TYPES.includes(value as BackgroundType);
}

function Customize() {
  const { t } = useTranslation("customize");
  const language = useLanguage();
  const { setUser } = useAuthActions();
  const { enqueueSnackbar } = useSnackbar();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [themeColor, setThemeColor] = useState(DEFAULT_THEME_COLOR);
  const [backgroundType, setBackgroundType] = useState<BackgroundType>("color");
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BACKGROUND);
  const [backgroundImage, setBackgroundImage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // AYRI UC, AYRI KAYDETME: +18 uyarisi users tablosunda degil,
  // user_page_settings'te ve PUT /profile/page-settings ile
  // yonetiliyor. Ustteki forma karistirilsaydi tek tiklama iki ayri
  // ucu cagirirdi ve biri basarisiz olunca yarim kaydedilmis bir
  // durum kalirdi.
  const { data: pageSettings, isLoading: settingsLoading } = usePageSettings();
  const updatePageSettings = useUpdatePageSettings();
  const [adultWarning, setAdultWarning] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Renk ve gorsel ayri state'te tutuluyor: kullanici tip degistirip geri
  // donunce yazdigi degeri kaybetmesin.
  useEffect(() => {
    if (!profile) return;

    setThemeColor(profile.theme_color ?? DEFAULT_THEME_COLOR);

    const type = isBackgroundType(profile.background_type)
      ? profile.background_type
      : "color";
    setBackgroundType(type);

    if (type === "image") {
      setBackgroundImage(profile.background_value ?? "");
    } else {
      setBackgroundColor(profile.background_value ?? DEFAULT_BACKGROUND);
    }
  }, [profile]);

  const backgroundValue =
    backgroundType === "image" ? backgroundImage : backgroundColor;

  // Onizleme, yayindaki sayfayla ayni fonksiyondan geciyor.
  const preview = resolveTheme({
    theme_color: themeColor,
    background_type: backgroundType,
    background_value: backgroundValue,
  });

  const imageLooksValid =
    backgroundType !== "image" ||
    backgroundImage === "" ||
    safeImageUrl(backgroundImage) !== null;

  useEffect(() => {
    if (!pageSettings) return;
    setAdultWarning(pageSettings.adult_warning_enabled);
  }, [pageSettings]);

  const handleSaveSettings = async () => {
    setSettingsError(null);

    try {
      await updatePageSettings.mutateAsync({
        adult_warning_enabled: adultWarning,
      });
      enqueueSnackbar(t("contentWarning.saved"), {
        variant: "success",
      });
    } catch (caught) {
      setSettingsError(
        caught instanceof Error ? caught.message : t("errors.generic")
      );
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!HEX_COLOR.test(themeColor)) {
      setError(t("errors.themeColor"));
      return;
    }

    if (backgroundType === "image") {
      if (!safeImageUrl(backgroundImage)) {
        setError(t("errors.backgroundImage"));
        return;
      }
    } else if (!HEX_COLOR.test(backgroundColor)) {
      setError(t("errors.backgroundColor"));
      return;
    }

    const payload: ProfileUpdateData = {
      theme_color: themeColor,
      background_type: backgroundType,
      background_value: backgroundValue,
    };

    try {
      const updated = await updateProfile.mutateAsync(payload);
      setUser(updated);
      enqueueSnackbar(t("saved"), {
        variant: "success",
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("errors.generic"));
    }
  };

  // 44 piksel: parmakla isabet ettirilebilen en kucuk hedef (WCAG 2.5.5).
  // Olculdu: py-2 ile alanlar 42, arka plan tipi dugmeleri 36 pikseldi.
  //
  // KEYFI DEGER, min-h-11 DEGIL: sayisal min-h olcegi Tailwind 3.4'te
  // geldi, bu proje 3.3'te. "min-h-11" hic CSS uretmiyor -- derleme,
  // tip kontrolu ve lint temiz geciyor, sinif sessizce etkisiz kaliyor.
  const inputClass =
    "w-full min-h-[44px] bg-overlay/60 border border-line-strong focus:border-purple-400 outline-none text-ink rounded-lg px-3 py-2";

  return (
    <div className="min-h-screen bg-gradient-to-br from-page via-page-accent to-page p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-ink">{t("title")}</h1>
            <p className="text-ink-muted mt-1">{t("subtitle")}</p>
          </div>

          {profile?.username && (
            <NextLink
              href={`/${language}/${profile.username}`}
              className="inline-flex items-center gap-2 bg-field hover:bg-field-strong text-ink px-4 py-2 min-h-[44px] rounded-lg transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              {t("viewPublicPage")}
            </NextLink>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ayarlar */}
          <form
            onSubmit={handleSave}
            className="bg-surface/50 backdrop-blur-sm border border-line rounded-2xl p-6 space-y-6"
          >
            <div className="space-y-2">
              <label
                htmlFor="theme-color"
                className="flex items-center gap-2 text-sm font-medium text-ink-soft"
              >
                <Palette className="h-4 w-4" />
                {t("themeColor.label")}
              </label>
              <p className="text-xs text-ink-muted">{t("themeColor.hint")}</p>
              <div className="flex items-center gap-3">
                <input
                  id="theme-color"
                  name="themeColor"
                  type="color"
                  value={
                    HEX_COLOR.test(themeColor)
                      ? themeColor
                      : DEFAULT_THEME_COLOR
                  }
                  onChange={(event) => setThemeColor(event.target.value)}
                  className="h-11 w-16 cursor-pointer rounded-lg border border-line-strong bg-overlay"
                />
                <input
                  aria-label={t("themeColor.hexLabel")}
                  name="themeColorHex"
                  type="text"
                  value={themeColor}
                  onChange={(event) => setThemeColor(event.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-sm font-medium text-ink-soft">
                {t("background.label")}
              </span>
              <div className="grid grid-cols-3 gap-2">
                {BACKGROUND_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setBackgroundType(type)}
                    className={`min-h-[44px] px-3 py-2 rounded-lg text-sm transition-colors ${
                      backgroundType === type
                        ? "bg-purple-600 text-white"
                        : "bg-field text-ink-soft hover:bg-field-strong"
                    }`}
                  >
                    {t(`background.types.${type}`)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-ink-muted">
                {t(`background.hints.${backgroundType}`)}
              </p>
            </div>

            {backgroundType === "image" ? (
              <div className="space-y-2">
                <label
                  htmlFor="background-image"
                  className="flex items-center gap-2 text-sm font-medium text-ink-soft"
                >
                  <ImageIcon className="h-4 w-4" />
                  {t("background.imageUrl")}
                </label>
                <input
                  id="background-image"
                  name="backgroundImage"
                  type="url"
                  inputMode="url"
                  placeholder="https://example.com/background.jpg"
                  value={backgroundImage}
                  onChange={(event) => setBackgroundImage(event.target.value)}
                  className={inputClass}
                />
                {!imageLooksValid && (
                  <p className="text-amber-300 text-xs">
                    {t("background.imageInvalid")}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label
                  htmlFor="background-color"
                  className="block text-sm font-medium text-ink-soft"
                >
                  {t("background.colorLabel")}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="background-color"
                    name="backgroundColor"
                    type="color"
                    value={
                      HEX_COLOR.test(backgroundColor)
                        ? backgroundColor
                        : DEFAULT_BACKGROUND
                    }
                    onChange={(event) => setBackgroundColor(event.target.value)}
                    className="h-11 w-16 cursor-pointer rounded-lg border border-line-strong bg-overlay"
                  />
                  <input
                    aria-label={t("background.colorHexLabel")}
                    name="backgroundColorHex"
                    type="text"
                    value={backgroundColor}
                    onChange={(event) => setBackgroundColor(event.target.value)}
                    className={`${inputClass} font-mono`}
                  />
                </div>
              </div>
            )}

            {error && <p className="text-red-300 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={isLoading || updateProfile.isPending}
              data-testid="save-appearance"
              className="inline-flex min-h-[44px] items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {updateProfile.isPending ? t("saving") : t("save")}
            </button>
          </form>

          {/* Onizleme */}
          <div className="space-y-2">
            <p className="text-sm text-ink-muted">{t("preview.title")}</p>
            <div
              data-testid="theme-preview"
              className="rounded-2xl border border-line overflow-hidden min-h-[320px] p-6 flex flex-col items-center justify-center gap-4"
              style={preview.pageStyle}
            >
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center text-ink text-xl font-semibold"
                style={{ backgroundColor: preview.themeColor }}
              >
                {(profile?.display_name ?? profile?.username ?? "?")
                  .slice(0, 1)
                  .toUpperCase()}
              </div>

              <p className="font-semibold" style={preview.textStyle}>
                {profile?.display_name ??
                  profile?.username ??
                  t("preview.name")}
              </p>
              <p className="text-sm" style={preview.mutedTextStyle}>
                {profile?.bio ?? t("preview.bio")}
              </p>

              <div className="w-full max-w-xs space-y-2 pt-2">
                {[t("preview.link1"), t("preview.link2")].map((title) => (
                  <div
                    key={title}
                    className="w-full text-center py-2 rounded-lg text-ink text-sm"
                    style={{ backgroundColor: preview.themeColor }}
                  >
                    {title}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-ink-faint">{t("preview.note")}</p>
          </div>
        </div>

        {/* Gorunumden ayri: bu ayar users tablosunda degil. */}
        <div className="bg-surface/50 backdrop-blur-sm border border-line rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-ink-soft">
            <EyeOff className="h-4 w-4" />
            {t("contentWarning.title")}
          </div>

          <label
            htmlFor="adult-warning"
            className="flex min-h-[44px] cursor-pointer items-start gap-3"
          >
            {/*
              YUKLENENE KADAR KAPALI: asagidaki useEffect, ayarlar
              geldiginde kutuyu sunucudaki degere esitliyor. Kutu o ana
              kadar acik kalsaydi, erken isaretleyen kullanicinin secimi
              veri gelince sessizce geri alinirdi -- ve kaydete basarsa
              eski degeri kaydetmis olurdu. E2E'de tam olarak bu oldu:
              test izole gecip dolu kosuda dustu, cunku yuk altinda
              sorgu gec donuyordu.
            */}
            <input
              id="adult-warning"
              name="adultWarning"
              type="checkbox"
              checked={adultWarning}
              disabled={settingsLoading}
              onChange={(event) => setAdultWarning(event.target.checked)}
              className="mt-1 h-5 w-5 cursor-pointer accent-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <span className="text-sm text-ink-muted">
              {t("contentWarning.label")}
            </span>
          </label>

          {settingsError && (
            <p className="text-red-300 text-sm">{settingsError}</p>
          )}

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={settingsLoading || updatePageSettings.isPending}
            data-testid="save-page-settings"
            className="inline-flex min-h-[44px] items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {updatePageSettings.isPending
              ? t("contentWarning.saving")
              : t("contentWarning.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default withPageRequiredAuth(Customize);
