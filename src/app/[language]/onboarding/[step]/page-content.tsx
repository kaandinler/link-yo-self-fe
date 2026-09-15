"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { useTranslation } from "@/services/i18n/client";
import useLanguage from "@/services/i18n/use-language";
import {
  StepData,
  TOTAL_STEPS,
  useCompleteOnboarding,
  useCompleteStep,
  useOnboardingStatus,
  useProfile,
  useSkipOnboarding,
} from "@/services/api/services/onboarding";
import useAuth from "@/services/auth/use-auth";

/** Her adimda hangi profil alanlarinin duzenlendigi. */
const STEP_FIELDS: Record<number, readonly string[]> = {
  1: ["first_name", "last_name", "display_name", "bio", "profile_image_url"],
  2: ["page_title", "page_description", "website"],
  3: ["twitter_username", "instagram_username", "linkedin_username"],
  4: ["theme_color", "background_type", "background_value"],
};

const BACKGROUND_TYPES = ["color", "gradient", "image"] as const;

type FormState = Record<string, string>;

type Props = {
  step: number;
};

export default function OnboardingWizard({ step }: Props) {
  const { t } = useTranslation("onboarding");
  const router = useRouter();
  const language = useLanguage();
  const { user, isLoaded } = useAuth();

  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: status } = useOnboardingStatus();
  const completeStep = useCompleteStep();
  const completeOnboarding = useCompleteOnboarding();
  const skipOnboarding = useSkipOnboarding();

  const fields = useMemo(() => STEP_FIELDS[step] ?? [], [step]);
  const [form, setForm] = useState<FormState>({});
  const [error, setError] = useState<string | null>(null);

  // Giris yapmamis kullaniciyi sign-in'e gonderiyoruz.
  //
  // NOT: Bu sayfa withPageRequiredAuth HOC'unu kullanmiyor. O HOC boilerplate'ten
  // geliyor ve user.role.id bekliyor; FastAPI backend'inin UserRead modelinde
  // rol alani yok, dolayisiyla giris yapmis kullaniciyi bile disari atardi.
  useEffect(() => {
    if (isLoaded && !user) {
      router.replace(`/${language}/sign-in`);
    }
  }, [isLoaded, user, router, language]);

  // Alanlari mevcut profil degerleriyle dolduruyoruz: kullanici geri gelip
  // bir adimi yeniden actiginda daha once girdigi seyleri gormeli.
  useEffect(() => {
    if (!profile) return;

    const initial: FormState = {};
    for (const field of fields) {
      const value = (profile as unknown as Record<string, unknown>)[field];
      initial[field] = typeof value === "string" ? value : "";
    }
    setForm(initial);
    setError(null);
  }, [profile, fields]);

  const isLastStep = step === TOTAL_STEPS;
  const busy =
    completeStep.isPending ||
    completeOnboarding.isPending ||
    skipOnboarding.isPending;

  const goTo = (path: string) => router.push(`/${language}${path}`);

  const handleChange = (field: string, value: string) =>
    setForm((previous) => ({ ...previous, [field]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    // Bos alanlari gondermiyoruz: backend adim DTO'larinda tum alanlar
    // opsiyonel, bos string gondermek mevcut degeri silerdi.
    const payload: StepData = Object.fromEntries(
      Object.entries(form).filter(([, value]) => value.trim() !== "")
    ) as StepData;

    try {
      await completeStep.mutateAsync({ step, data: payload });

      if (isLastStep) {
        await completeOnboarding.mutateAsync();
        goTo("/links?new=1");
        return;
      }

      goTo(`/onboarding/${step + 1}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("errors.generic"));
    }
  };

  const handleSkip = async () => {
    setError(null);
    try {
      await skipOnboarding.mutateAsync();
      goTo("/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("errors.generic"));
    }
  };

  if (!isLoaded || !user || profileLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" aria-label={t("loading")} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 px-4 py-12">
      <div className="mx-auto w-full max-w-xl">
        <ProgressBar
          step={step}
          completionPercentage={status?.profile_completion_percentage}
          t={t}
        />

        <h1 className="mt-6 text-2xl font-bold text-white">
          {t(`steps.${step}.title`)}
        </h1>
        <p className="mt-2 text-sm text-gray-300">
          {t(`steps.${step}.description`)}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          {fields.map((field) => (
            <Field
              key={field}
              name={field}
              label={t(`fields.${field}`)}
              value={form[field] ?? ""}
              onChange={(value) => handleChange(field, value)}
            />
          ))}

          {error ? (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => goTo(`/onboarding/${step - 1}`)}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-600 px-5 py-3 font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("actions.back")}
              </button>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isLastStep ? (
                <Check className="h-4 w-4" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {isLastStep ? t("actions.finish") : t("actions.next")}
            </button>

            {status?.can_skip !== false ? (
              <button
                type="button"
                onClick={handleSkip}
                disabled={busy}
                className="ml-auto text-sm text-gray-400 underline underline-offset-4 transition-colors hover:text-gray-200 disabled:opacity-50"
              >
                {t("actions.skip")}
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </main>
  );
}

type ProgressBarProps = {
  step: number;
  completionPercentage?: number;
  t: (key: string, options?: Record<string, unknown>) => string;
};

function ProgressBar({ step, completionPercentage, t }: ProgressBarProps) {
  return (
    <div>
      <div
        className="flex items-center gap-2"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={TOTAL_STEPS}
        aria-label={t("progress.label")}
      >
        {Array.from({ length: TOTAL_STEPS }, (_, index) => (
          <span
            key={index}
            className={`h-2 flex-1 rounded-full ${
              index < step ? "bg-purple-500" : "bg-gray-600"
            }`}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-400">
        {t("progress.step", { current: step, total: TOTAL_STEPS })}
        {typeof completionPercentage === "number"
          ? ` · ${t("progress.completion", { percent: completionPercentage })}`
          : null}
      </p>
    </div>
  );
}

type FieldProps = {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function Field({ name, label, value, onChange }: FieldProps) {
  const id = `onboarding-${name}`;
  const shared =
    "w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500";

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-gray-300">
        {label}
      </label>

      {name === "bio" || name === "page_description" ? (
        <textarea
          id={id}
          rows={3}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={shared}
        />
      ) : name === "background_type" ? (
        <select
          id={id}
          value={value || "color"}
          onChange={(event) => onChange(event.target.value)}
          className={shared}
        >
          {BACKGROUND_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      ) : name === "theme_color" ? (
        // Renk secici: backend hex bekliyor, type="color" tam da onu uretiyor.
        <input
          id={id}
          type="color"
          value={value || "#1383eb"}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-24 cursor-pointer rounded-lg border border-gray-700 bg-gray-800"
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={shared}
        />
      )}
    </div>
  );
}
