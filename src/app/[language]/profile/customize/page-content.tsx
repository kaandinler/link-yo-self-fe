"use client";

import React, { useEffect, useState } from "react";
import NextLink from "next/link";
import { ExternalLink, Image as ImageIcon, Palette } from "lucide-react";
import {
  ProfileUpdateData,
  useProfile,
  useUpdateProfile,
} from "@/services/api/services/onboarding";
import useAuthActions from "@/services/auth/use-auth-actions";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useSnackbar } from "@/hooks/use-snackbar";
import useLanguage from "@/services/i18n/use-language";
import {
  BACKGROUND_TYPES,
  BackgroundType,
  DEFAULT_BACKGROUND,
  DEFAULT_THEME_COLOR,
  HEX_COLOR,
  resolveTheme,
  safeImageUrl,
} from "@/services/profile-theme";

const TYPE_LABELS: Record<BackgroundType, string> = {
  color: "Solid color",
  gradient: "Gradient",
  image: "Image",
};

const TYPE_HINTS: Record<BackgroundType, string> = {
  color: "One flat color behind your page.",
  gradient: "Fades from the background color into your theme color.",
  image: "Your page sits on top of an image from the web.",
};

function isBackgroundType(value: unknown): value is BackgroundType {
  return BACKGROUND_TYPES.includes(value as BackgroundType);
}

function Customize() {
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

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!HEX_COLOR.test(themeColor)) {
      setError("Theme color must be a hex code like #1383eb.");
      return;
    }

    if (backgroundType === "image") {
      if (!safeImageUrl(backgroundImage)) {
        setError(
          "Background image must be an http(s) address without quotes or parentheses."
        );
        return;
      }
    } else if (!HEX_COLOR.test(backgroundColor)) {
      setError("Background color must be a hex code like #ffffff.");
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
      enqueueSnackbar("Your page appearance has been saved.", {
        variant: "success",
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Your changes could not be saved."
      );
    }
  };

  const inputClass =
    "w-full bg-overlay/60 border border-line-strong focus:border-purple-400 outline-none text-ink rounded-lg px-3 py-2";

  return (
    <div className="min-h-screen bg-gradient-to-br from-page via-page-accent to-page p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-ink">Customize Profile</h1>
            <p className="text-ink-muted mt-1">
              Choose how your public page looks
            </p>
          </div>

          {profile?.username && (
            <NextLink
              href={`/${language}/${profile.username}`}
              className="inline-flex items-center gap-2 bg-field hover:bg-field-strong text-ink px-4 py-2 rounded-lg transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              View public page
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
                Theme color
              </label>
              <p className="text-xs text-ink-muted">
                Used for your links and the second half of a gradient.
              </p>
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
                  aria-label="Theme color hex"
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
                Background
              </span>
              <div className="grid grid-cols-3 gap-2">
                {BACKGROUND_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setBackgroundType(type)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      backgroundType === type
                        ? "bg-purple-600 text-white"
                        : "bg-field text-ink-soft hover:bg-field-strong"
                    }`}
                  >
                    {TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
              <p className="text-xs text-ink-muted">
                {TYPE_HINTS[backgroundType]}
              </p>
            </div>

            {backgroundType === "image" ? (
              <div className="space-y-2">
                <label
                  htmlFor="background-image"
                  className="flex items-center gap-2 text-sm font-medium text-ink-soft"
                >
                  <ImageIcon className="h-4 w-4" />
                  Image URL
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
                    Must start with http:// or https:// and contain no quotes or
                    parentheses.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label
                  htmlFor="background-color"
                  className="block text-sm font-medium text-ink-soft"
                >
                  Background color
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
                    aria-label="Background color hex"
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
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {updateProfile.isPending ? "Saving…" : "Save appearance"}
            </button>
          </form>

          {/* Onizleme */}
          <div className="space-y-2">
            <p className="text-sm text-ink-muted">Preview</p>
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

              <p className={`font-semibold ${preview.textColor}`}>
                {profile?.display_name ?? profile?.username ?? "Your name"}
              </p>
              <p className={`text-sm ${preview.mutedTextColor}`}>
                {profile?.bio ?? "Your bio shows up here"}
              </p>

              <div className="w-full max-w-xs space-y-2 pt-2">
                {["Your first link", "Another link"].map((title) => (
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
            <p className="text-xs text-ink-faint">
              The preview uses the same rules as your public page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withPageRequiredAuth(Customize);
