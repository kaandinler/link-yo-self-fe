import type { Metadata } from "next";
import { getServerTranslation } from "@/services/i18n";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "home");

  return {
    title: t("home:metadata.title"),
    description: t("home:metadata.description"),
  };
}

export default async function Home(props: Props) {
  const params = await props.params;
  
  // Redirect to landing page
  redirect(`/${params.language}/landing-page`);
  return null;
}
