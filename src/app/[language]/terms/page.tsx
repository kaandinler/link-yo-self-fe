import type { Metadata } from "next";
import { getServerTranslation } from "@/services/i18n";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import MuiLink from "@mui/material/Link";

/**
 * Kullanim kosullari.
 *
 * NEDEN VAR: tanitim sayfasinin footer'i /terms'e baglaniyordu ve o
 * sayfa yoktu; baglanti 404'e gidiyordu ve kaldirilmisti. Kayitta da
 * kullaniciya hicbir kosul gosterilmiyordu.
 *
 * METIN URUNE DAYANIYOR, gizlilik politikasi gibi. Her kural kodda bir
 * karsiligi olan bir seyi anlatiyor:
 *   - 13 yas: gizlilik politikasinin "Children" bolumuyle ayni.
 *   - Kullanici adi kurali: core/validators.py (3-30 karakter, izinli
 *     karakterler, ayrilmis adlar) ve kapatilan hesabin adinin ayrili
 *     kalmasi (soft delete).
 *   - Hesap kapatilabilir: yonetici ucu DELETE /v1/users/{id}.
 *   - +18 uyarisi: sayfa ayarlarindaki adult_warning_enabled.
 *   - Otomatik deneme yasagi: hiz siniri zaten uyguluyor.
 *
 * BILEREK YAZILMAYANLAR: isletmecinin tuzel kisiligi, uygulanacak hukuk,
 * yetkili mahkeme, sorumluluk sinirlamasi. Bunlar isletmecinin (ve bir
 * hukukcunun) vermesi gereken kararlar; uydurmak, gizlilik
 * politikasinda canlida BASKA BIR SIRKETI anlatan boilerplate'in
 * yaptiginin aynisi olurdu.
 *
 * ADRES: gizlilik politikasi ve iletisim sayfasiyla ayni olmali.
 */

const CONTACT_EMAIL = "support@linkyoself.com";

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "terms");

  return {
    title: t("title"),
  };
}

function Madde({ children }: { children: React.ReactNode }) {
  return <ListItem sx={{ display: "list-item" }}>{children}</ListItem>;
}

function Bolum({
  baslik,
  children,
}: {
  baslik: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Typography component="h2" variant="h4" gutterBottom sx={{ mt: 6 }}>
        {baslik}
      </Typography>
      {children}
    </>
  );
}

async function Terms(props: Props) {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "terms");

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography
        variant="h2"
        component="h1"
        data-testid="terms-title"
        gutterBottom
        sx={{ fontWeight: "bold" }}
      >
        {t("title")}
      </Typography>
      <Typography gutterBottom paragraph>
        {t("lastUpdated")}
      </Typography>
      <Typography gutterBottom paragraph>
        {t("intro.p1")}
      </Typography>
      <Typography gutterBottom paragraph>
        {t("intro.p2")}{" "}
        {/* Ic Link bileseni degil: o istemci bileseni (useContext) ve
            burasi sunucu bileseni. Dil oneki elle. */}
        <MuiLink href={`/${params.language}/privacy-policy`}>
          {t("privacyLink")}
        </MuiLink>
      </Typography>

      <Bolum baslik={t("account.title")}>
        <List sx={{ listStyleType: "disc", pl: 5 }}>
          <Madde>{t("account.item1")}</Madde>
          <Madde>{t("account.item2")}</Madde>
          <Madde>{t("account.item3")}</Madde>
          <Madde>{t("account.item4")}</Madde>
        </List>
      </Bolum>

      <Bolum baslik={t("content.title")}>
        <Typography gutterBottom paragraph>
          {t("content.p1")}
        </Typography>
        <Typography gutterBottom paragraph>
          {t("content.p2")}
        </Typography>
      </Bolum>

      <Bolum baslik={t("rules.title")}>
        <List sx={{ listStyleType: "disc", pl: 5 }} data-testid="terms-rules">
          <Madde>{t("rules.item1")}</Madde>
          <Madde>{t("rules.item2")}</Madde>
          <Madde>{t("rules.item3")}</Madde>
          <Madde>{t("rules.item4")}</Madde>
          <Madde>{t("rules.item5")}</Madde>
          <Madde>{t("rules.item6")}</Madde>
        </List>
      </Bolum>

      <Bolum baslik={t("enforcement.title")}>
        <Typography gutterBottom paragraph>
          {t("enforcement.p1")}
        </Typography>
        <Typography gutterBottom paragraph>
          {t("enforcement.p2")}
        </Typography>
      </Bolum>

      <Bolum baslik={t("closing.title")}>
        <Typography gutterBottom paragraph>
          {t("closing.p1")}
        </Typography>
      </Bolum>

      <Bolum baslik={t("service.title")}>
        <Typography gutterBottom paragraph>
          {t("service.p1")}
        </Typography>
      </Bolum>

      <Bolum baslik={t("changes.title")}>
        <Typography gutterBottom paragraph>
          {t("changes.p1")}
        </Typography>
      </Bolum>

      <Bolum baslik={t("contact.title")}>
        <Typography gutterBottom paragraph>
          {t("contact.p1")}{" "}
          <MuiLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</MuiLink>
        </Typography>
      </Bolum>
    </Container>
  );
}

export default Terms;
