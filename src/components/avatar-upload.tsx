"use client";

import { useEffect, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { useTranslation } from "@/services/i18n/client";
import useAuth from "@/services/auth/use-auth";
import useAuthActions from "@/services/auth/use-auth-actions";
import {
  AvatarError,
  useDeleteAvatar,
  useUploadAvatar,
} from "@/services/api/services/onboarding";
import { User } from "@/services/api/types/user";

/**
 * Backend'in AVATAR_MAX_BYTES varsayilaninin aynasi (settings.py).
 *
 * Burada da bakiliyor ki 20 MB'lik bir dosya once yuklenip sonra
 * reddedilmesin. Son soz backend'in: ayar degistirilirse sunucu 413
 * donuyor ve ayni mesaj gosteriliyor.
 */
const AZAMI_BAYT = 8 * 1024 * 1024;

/** Backend'in kabul ettigi bicimler (services/user/avatar.py). */
const KABUL = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
};

function basHarfler(user: User | null): string {
  const ad = user?.display_name || user?.username || "";
  return (
    ad
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parca) => parca[0]!.toUpperCase())
      .join("") || "?"
  );
}

/**
 * Avatar yukleme ve kaldirma.
 *
 * Kendi basina kaydediyor: ayri bir "Kaydet" dugmesi beklemiyor. Dosya
 * secilince yukleniyor, sonuc oturumdaki kullaniciya (useAuth) yaziliyor;
 * gosterilen avatar da oradan okunuyor.
 *
 * Erisilebilirlik: surukle-birak alani yalnizca fare icin bir kolaylik.
 * Klavye ve ekran okuyucu "Fotograf sec" dugmesini kullaniyor; alan
 * sekme sirasina girmiyor (noKeyboard).
 */
export default function AvatarUpload() {
  const { t } = useTranslation("profile");
  const { user } = useAuth();
  const { setUser } = useAuthActions();
  const yukle = useUploadAvatar();
  const kaldir = useDeleteAvatar();

  const [onizleme, setOnizleme] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const mesgul = yukle.isPending || kaldir.isPending;
  const mevcut = user?.profile_image_url || null;

  // Yerel onizleme adresi bellekte bir nesneyi tutuyor; degisince ya da
  // bilesen kalkinca birakiliyor.
  useEffect(
    () => () => {
      if (onizleme) URL.revokeObjectURL(onizleme);
    },
    [onizleme]
  );

  const sunucuHatasi = (caught: unknown): string => {
    if (caught instanceof AvatarError) {
      if (caught.status === 413) return t("profile:avatar.errors.tooLarge");
      if (caught.status === 429) return t("profile:avatar.errors.tooMany");
      if (caught.status === 422) return t("profile:avatar.errors.invalid");
    }
    return t("profile:avatar.errors.generic");
  };

  const onDrop = async (kabul: File[], ret: FileRejection[]) => {
    setHata(null);

    if (ret.length > 0) {
      const kod = ret[0]?.errors[0]?.code;
      setHata(
        kod === "file-too-large"
          ? t("profile:avatar.errors.tooLarge")
          : t("profile:avatar.errors.invalid")
      );
      return;
    }

    const dosya = kabul[0];
    if (!dosya) return;

    setOnizleme(URL.createObjectURL(dosya));
    try {
      setUser(await yukle.mutateAsync(dosya));
    } catch (caught) {
      setHata(sunucuHatasi(caught));
    } finally {
      setOnizleme(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: KABUL,
    maxSize: AZAMI_BAYT,
    multiple: false,
    noKeyboard: true,
    disabled: mesgul,
  });

  const avatariKaldir = async () => {
    setHata(null);
    try {
      setUser(await kaldir.mutateAsync());
    } catch (caught) {
      setHata(sunucuHatasi(caught));
    }
  };

  const gosterilen = onizleme ?? mevcut;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div
          {...getRootProps({
            className: `relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed bg-surface-raised transition-colors ${
              isDragActive ? "border-purple-500" : "border-line-strong"
            }`,
          })}
          data-testid="avatar-dropzone"
        >
          <input {...getInputProps()} data-testid="avatar-input" />
          {gosterilen ? (
            // next/image degil: depo yerel disk ya da S3/CDN olabiliyor ve
            // next/image alan adlarinin onceden tanimlanmasini istiyor.
            <img
              src={gosterilen}
              alt={t("profile:avatar.alt")}
              className="h-full w-full object-cover"
              data-testid="avatar-image"
            />
          ) : (
            <span className="text-2xl font-semibold text-ink-muted">
              {basHarfler(user)}
            </span>
          )}
          {mesgul ? (
            <span className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2
                className="h-6 w-6 animate-spin text-white"
                aria-label={t("profile:avatar.uploading")}
              />
            </span>
          ) : null}
        </div>

        <div className="flex flex-col items-start gap-2">
          <button
            type="button"
            onClick={open}
            disabled={mesgul}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-line-strong px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-raised disabled:opacity-50"
            data-testid="avatar-choose"
          >
            <Camera className="h-4 w-4" aria-hidden />
            {mevcut
              ? t("profile:avatar.actions.change")
              : t("profile:avatar.actions.upload")}
          </button>

          {mevcut ? (
            <button
              type="button"
              onClick={avatariKaldir}
              disabled={mesgul}
              className="inline-flex min-h-[44px] items-center gap-2 px-1 text-sm text-ink-muted underline-offset-4 transition-colors hover:text-ink-soft hover:underline disabled:opacity-50"
              data-testid="avatar-remove"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              {t("profile:avatar.actions.remove")}
            </button>
          ) : null}
        </div>
      </div>

      <p className="text-xs text-ink-muted">{t("profile:avatar.hint")}</p>

      {hata ? (
        <p
          role="alert"
          className="text-sm text-red-500"
          data-testid="avatar-error"
        >
          {hata}
        </p>
      ) : null}
    </div>
  );
}
