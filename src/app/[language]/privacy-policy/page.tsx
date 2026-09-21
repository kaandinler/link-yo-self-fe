import type { Metadata } from "next";
import { getServerTranslation } from "@/services/i18n";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import MuiLink from "@mui/material/Link";

/**
 * Gizlilik politikasi.
 *
 * NEDEN BASTAN YAZILDI: bu sayfa boilerplate'ten gelmisti ve canlida
 * BASKA BIR SIRKETI anlatiyordu -- "the Company ... refers to BC
 * Boilerplates", iletisim olarak brocoders'in e-postasi, sitesi, GitHub
 * tartismalari ve Discord kanali; ustelik ilk iki paragraf hala "This is
 * the first description text." yer tutucusuydu. Yani kullanicilara
 * verilerinin kim tarafindan nasil islendigine dair yanlis bir metin
 * gosteriliyordu.
 *
 * METIN KODA DAYANIYOR: buradaki her iddia denetlendi -- hangi kolonlar
 * yaziliyor (models.py), hangi cerezler kuruluyor, hangi ucuncu taraflar
 * cagriliyor, hesap kapatilinca ne oluyor. Ozellikle iki nokta
 * suslenmeden yazildi: analytics_events ziyaretciyi HIC tanimlamiyor
 * (IP yok, kimlik yok, yalnizca referrer'in host'u), ve hesap kapatma
 * bir SOFT DELETE -- kayit siliniyor degil, kapali isaretleniyor.
 *
 * ADRES: support@linkyoself.com; iletisim sayfasindaki adresle ayni
 * olmali, iki sayfa farkli adres gosterirse hangisinin dogru oldugu
 * belirsiz kalir.
 */

const CONTACT_EMAIL = "support@linkyoself.com";

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "privacy-policy");

  return {
    title: t("title"),
  };
}

async function PrivacyPolicy(props: Props) {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "privacy-policy");

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography
        variant="h2"
        component="h1"
        data-testid="privacy-policy-title"
        gutterBottom
        sx={{ fontWeight: "bold" }}
      >
        {t("title")}
      </Typography>
      <Typography gutterBottom paragraph>
        {t("lastUpdated")}
      </Typography>
      <Typography
        data-testid="privacy-policy-description"
        gutterBottom
        paragraph
      >
        {t("intro.p1")}
      </Typography>
      <Typography gutterBottom paragraph>
        {t("intro.p2")}
      </Typography>

      <Typography component="h2" variant="h4" gutterBottom sx={{ mt: 6 }}>
        {t("summary.title")}
      </Typography>
      <List sx={{ listStyleType: "disc", pl: 5 }}>
        <ListItem sx={{ display: "list-item" }}>{t("summary.item1")}</ListItem>
        <ListItem sx={{ display: "list-item" }}>{t("summary.item2")}</ListItem>
        <ListItem sx={{ display: "list-item" }}>{t("summary.item3")}</ListItem>
        <ListItem sx={{ display: "list-item" }}>{t("summary.item4")}</ListItem>
        <ListItem sx={{ display: "list-item" }}>{t("summary.item5")}</ListItem>
      </List>

      <Typography component="h2" variant="h4" gutterBottom sx={{ mt: 6 }}>
        {t("yourData.title")}
      </Typography>
      <List sx={{ listStyleType: "disc", pl: 5 }}>
        <ListItem sx={{ display: "list-item" }}>
          <strong>{t("yourData.accountTitle")}</strong>{" "}
          {t("yourData.accountDescription")}
        </ListItem>
        <ListItem sx={{ display: "list-item" }}>
          <strong>{t("yourData.profileTitle")}</strong>{" "}
          {t("yourData.profileDescription")}
        </ListItem>
        <ListItem sx={{ display: "list-item" }}>
          <strong>{t("yourData.linksTitle")}</strong>{" "}
          {t("yourData.linksDescription")}
        </ListItem>
        <ListItem sx={{ display: "list-item" }}>
          <strong>{t("yourData.settingsTitle")}</strong>{" "}
          {t("yourData.settingsDescription")}
        </ListItem>
      </List>
      <Typography gutterBottom paragraph>
        {t("yourData.publicNote")}
      </Typography>

      <Typography component="h2" variant="h4" gutterBottom sx={{ mt: 6 }}>
        {t("automatic.title")}
      </Typography>
      <Typography gutterBottom paragraph>
        {t("automatic.description")}
      </Typography>
      <List sx={{ listStyleType: "disc", pl: 5 }}>
        <ListItem sx={{ display: "list-item" }}>
          {t("automatic.item1")}
        </ListItem>
        <ListItem sx={{ display: "list-item" }}>
          {t("automatic.item2")}
        </ListItem>
        <ListItem sx={{ display: "list-item" }}>
          {t("automatic.item3")}
        </ListItem>
        <ListItem sx={{ display: "list-item" }}>
          {t("automatic.item4")}
        </ListItem>
      </List>
      <Typography gutterBottom paragraph>
        {t("automatic.referrerNote")}
      </Typography>
      <Typography component="h3" variant="h5" gutterBottom sx={{ mt: 4 }}>
        {t("automatic.notCollectedTitle")}
      </Typography>
      <Typography
        data-testid="privacy-policy-not-collected"
        gutterBottom
        paragraph
      >
        {t("automatic.notCollected")}
      </Typography>
      <Typography component="h3" variant="h5" gutterBottom sx={{ mt: 4 }}>
        {t("automatic.abuseTitle")}
      </Typography>
      <Typography data-testid="privacy-policy-abuse" gutterBottom paragraph>
        {t("automatic.abuse")}
      </Typography>

      <Typography component="h2" variant="h4" gutterBottom sx={{ mt: 6 }}>
        {t("cookies.title")}
      </Typography>
      <Typography gutterBottom paragraph>
        {t("cookies.description")}
      </Typography>
      <List sx={{ listStyleType: "disc", pl: 5 }}>
        <ListItem sx={{ display: "list-item" }}>
          <strong>{t("cookies.authTitle")}</strong>{" "}
          {t("cookies.authDescription")}
        </ListItem>
        <ListItem sx={{ display: "list-item" }}>
          <strong>{t("cookies.languageTitle")}</strong>{" "}
          {t("cookies.languageDescription")}
        </ListItem>
        <ListItem sx={{ display: "list-item" }}>
          <strong>{t("cookies.themeTitle")}</strong>{" "}
          {t("cookies.themeDescription")}
        </ListItem>
        <ListItem sx={{ display: "list-item" }}>
          <strong>{t("cookies.adultTitle")}</strong>{" "}
          {t("cookies.adultDescription")}
        </ListItem>
      </List>
      <Typography gutterBottom paragraph>
        {t("cookies.controlNote")}
      </Typography>

      <Typography component="h2" variant="h4" gutterBottom sx={{ mt: 6 }}>
        {t("use.title")}
      </Typography>
      <List sx={{ listStyleType: "disc", pl: 5 }}>
        <ListItem sx={{ display: "list-item" }}>{t("use.item1")}</ListItem>
        <ListItem sx={{ display: "list-item" }}>{t("use.item2")}</ListItem>
        <ListItem sx={{ display: "list-item" }}>{t("use.item3")}</ListItem>
        <ListItem sx={{ display: "list-item" }}>{t("use.item4")}</ListItem>
      </List>
      <Typography gutterBottom paragraph>
        {t("use.notUsed")}
      </Typography>

      <Typography component="h2" variant="h4" gutterBottom sx={{ mt: 6 }}>
        {t("emails.title")}
      </Typography>
      <Typography gutterBottom paragraph>
        {t("emails.description")}
      </Typography>

      <Typography component="h2" variant="h4" gutterBottom sx={{ mt: 6 }}>
        {t("thirdParties.title")}
      </Typography>
      <Typography gutterBottom paragraph>
        {t("thirdParties.description")}
      </Typography>
      <List sx={{ listStyleType: "disc", pl: 5 }}>
        <ListItem sx={{ display: "list-item" }}>
          <strong>{t("thirdParties.hostingTitle")}</strong>{" "}
          {t("thirdParties.hostingDescription")}
        </ListItem>
        <ListItem sx={{ display: "list-item" }}>
          <strong>{t("thirdParties.emailTitle")}</strong>{" "}
          {t("thirdParties.emailDescription")}
        </ListItem>
        <ListItem sx={{ display: "list-item" }}>
          <strong>{t("thirdParties.imagesTitle")}</strong>{" "}
          {t("thirdParties.imagesDescription")}
        </ListItem>
        <ListItem sx={{ display: "list-item" }}>
          <strong>{t("thirdParties.linksTitle")}</strong>{" "}
          {t("thirdParties.linksDescription")}
        </ListItem>
      </List>

      <Typography component="h2" variant="h4" gutterBottom sx={{ mt: 6 }}>
        {t("retention.title")}
      </Typography>
      <Typography component="h3" variant="h5" gutterBottom sx={{ mt: 4 }}>
        {t("retention.accountTitle")}
      </Typography>
      <Typography gutterBottom paragraph>
        {t("retention.accountDescription")}
      </Typography>
      <Typography component="h3" variant="h5" gutterBottom sx={{ mt: 4 }}>
        {t("retention.closedTitle")}
      </Typography>
      <Typography
        data-testid="privacy-policy-account-closure"
        gutterBottom
        paragraph
      >
        {t("retention.closedDescription")}
      </Typography>
      <Typography component="h3" variant="h5" gutterBottom sx={{ mt: 4 }}>
        {t("retention.tokensTitle")}
      </Typography>
      <Typography gutterBottom paragraph>
        {t("retention.tokensDescription")}
      </Typography>
      <Typography component="h3" variant="h5" gutterBottom sx={{ mt: 4 }}>
        {t("retention.eventsTitle")}
      </Typography>
      <Typography gutterBottom paragraph>
        {t("retention.eventsDescription")}
      </Typography>

      <Typography component="h2" variant="h4" gutterBottom sx={{ mt: 6 }}>
        {t("rights.title")}
      </Typography>
      <List sx={{ listStyleType: "disc", pl: 5 }}>
        <ListItem sx={{ display: "list-item" }}>{t("rights.item1")}</ListItem>
        <ListItem sx={{ display: "list-item" }}>{t("rights.item2")}</ListItem>
        <ListItem sx={{ display: "list-item" }}>{t("rights.item3")}</ListItem>
        <ListItem sx={{ display: "list-item" }}>{t("rights.item4")}</ListItem>
      </List>
      <Typography gutterBottom paragraph>
        {t("rights.note")}
      </Typography>

      <Typography component="h2" variant="h4" gutterBottom sx={{ mt: 6 }}>
        {t("security.title")}
      </Typography>
      <Typography gutterBottom paragraph>
        {t("security.description")}
      </Typography>

      <Typography component="h2" variant="h4" gutterBottom sx={{ mt: 6 }}>
        {t("children.title")}
      </Typography>
      <Typography gutterBottom paragraph>
        {t("children.description")}
      </Typography>

      <Typography component="h2" variant="h4" gutterBottom sx={{ mt: 6 }}>
        {t("transfers.title")}
      </Typography>
      <Typography gutterBottom paragraph>
        {t("transfers.description")}
      </Typography>

      <Typography component="h2" variant="h4" gutterBottom sx={{ mt: 6 }}>
        {t("changes.title")}
      </Typography>
      <Typography gutterBottom paragraph>
        {t("changes.description")}
      </Typography>

      <Typography component="h2" variant="h4" gutterBottom sx={{ mt: 6 }}>
        {t("contact.title")}
      </Typography>
      <Typography gutterBottom paragraph>
        {t("contact.description")}{" "}
        <MuiLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</MuiLink>
      </Typography>
    </Container>
  );
}

export default PrivacyPolicy;
