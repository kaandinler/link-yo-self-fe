import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerTranslation } from "@/services/i18n";
import OnboardingWizard from "./page-content";

type Props = {
  params: Promise<{ language: string; step: string }>;
};

const TOTAL_STEPS = 4;

function parseStep(raw: string): number | null {
  // Yalnizca "1".."4"; "01" veya "1.5" gibi degerler kabul edilmiyor.
  if (!/^[1-9]\d*$/.test(raw)) return null;

  const step = Number(raw);
  return step >= 1 && step <= TOTAL_STEPS ? step : null;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "onboarding");
  const step = parseStep(params.step);

  if (step === null) notFound();

  return { title: t(`steps.${step}.title`) };
}

export default async function Page(props: Props) {
  const params = await props.params;
  const step = parseStep(params.step);

  // /onboarding/5 veya /onboarding/abc gibi adresler 404 olmali.
  if (step === null) notFound();

  return <OnboardingWizard step={step} />;
}
