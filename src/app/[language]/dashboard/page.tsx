// src/app/[language]/dashboard/page.tsx
import type { Metadata } from "next";
import { getServerTranslation } from "@/services/i18n";
import Dashboard from "./page-content";

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "common");

  return {
    title: `${t("pageTitles.dashboard")} - ${t("app-name")}`,
  };
}

export default function Page() {
  return <Dashboard />;
}
