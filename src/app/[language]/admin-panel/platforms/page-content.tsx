"use client";

/**
 * Platform yonetimi.
 *
 * ONCEDEN YOKTU: 20 platform bir seed migration'iyla gelmisti ve yeni
 * bir platform eklemek yeni bir migration yazip dagitim yapmak
 * demekti.
 *
 * SILME YERINE "EMEKLIYE AYIRMA" -- ve bu bir kelime oyunu degil:
 * backend gercekten silmiyor, cunku social_accounts.platform_id
 * FOREIGN KEY ve ondelete CASCADE. Satiri silmek o platformdaki butun
 * kullanicilarin sosyal hesaplarini yok ederdi. Arayuzun bunu dogru
 * anlatmasi onemli; "Sil" yazsaydi yonetici yapmadigi bir seyi yaptigini
 * sanirdi.
 */

import { useCallback, useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useTranslation } from "@/services/i18n/client";
import { useSnackbar } from "@/hooks/use-snackbar";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  PlatformAdmin,
  useCreatePlatformService,
  useGetPlatformsService,
  useRetirePlatformService,
  useUpdatePlatformService,
} from "@/services/api/services/platforms";

function Platforms() {
  const { t } = useTranslation("admin-panel-platforms");
  const { enqueueSnackbar } = useSnackbar();
  const { confirmDialog } = useConfirmDialog();

  const getPlatforms = useGetPlatformsService();
  const createPlatform = useCreatePlatformService();
  const updatePlatform = useUpdatePlatformService();
  const retirePlatform = useRetirePlatformService();

  const [platformlar, setPlatformlar] = useState<PlatformAdmin[] | null>(null);
  const [hata, setHata] = useState(false);
  const [yeniAd, setYeniAd] = useState("");
  const [yeniGosterim, setYeniGosterim] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [duzenlenen, setDuzenlenen] = useState<number | null>(null);
  const [duzenlenenAd, setDuzenlenenAd] = useState("");

  const yukle = useCallback(async () => {
    const { status, data } = await getPlatforms();
    if (status === HTTP_CODES_ENUM.OK) {
      setPlatformlar(data.data);
      setHata(false);
      return;
    }
    setHata(true);
  }, [getPlatforms]);

  useEffect(() => {
    yukle();
  }, [yukle]);

  const ekle = async () => {
    setGonderiliyor(true);
    const { status } = await createPlatform({
      name: yeniAd,
      display_name: yeniGosterim || null,
    });
    setGonderiliyor(false);

    if (status === HTTP_CODES_ENUM.CREATED) {
      setYeniAd("");
      setYeniGosterim("");
      enqueueSnackbar(t("add.success"), { variant: "success" });
      await yukle();
      return;
    }

    // 409: ayni adli ETKIN bir platform var. Emekli olani zaten backend
    // geri getiriyor, yani bu mesaj yalnizca gercek cakismada cikiyor.
    enqueueSnackbar(
      status === HTTP_CODES_ENUM.CONFLICT ? t("add.duplicate") : t("error"),
      { variant: "error" }
    );
  };

  const kaydet = async (platform: PlatformAdmin) => {
    const { status } = await updatePlatform(platform.id, {
      display_name: duzenlenenAd || null,
    });

    if (status === HTTP_CODES_ENUM.OK) {
      setDuzenlenen(null);
      enqueueSnackbar(t("edit.success"), { variant: "success" });
      await yukle();
      return;
    }
    enqueueSnackbar(t("error"), { variant: "error" });
  };

  const emekliyeAyir = async (platform: PlatformAdmin) => {
    // Onay metni ne olacagini ACIKCA soyluyor: hesaplarin SILINMEDIGINI
    // soylemeyen bir onay, yoneticiye yapmadigi bir seyi yaptigini
    // dusundururdu. Kac hesabin etkilendigi de metinde.
    const onaylandi = await confirmDialog({
      title: t("retire.title"),
      message: `${t("retire.message")} ${t("retire.inUse", {
        count: platform.account_count,
      })}`,
      successButtonText: t("retire.confirm"),
      cancelButtonText: t("retire.cancel"),
    });
    if (!onaylandi) return;

    const { status } = await retirePlatform(platform.id);
    if (status === HTTP_CODES_ENUM.NO_CONTENT) {
      enqueueSnackbar(t("retire.success"), { variant: "success" });
      await yukle();
      return;
    }
    enqueueSnackbar(t("error"), { variant: "error" });
  };

  const geriGetir = async (platform: PlatformAdmin) => {
    // Geri getirmenin ucu yok; ayni adla ekleme backend'de "geri getir"
    // anlamina geliyor (bkz. service.create_platform).
    const { status } = await createPlatform({
      name: platform.name,
      display_name: platform.display_name,
    });

    if (status === HTTP_CODES_ENUM.CREATED) {
      enqueueSnackbar(t("restore.success"), { variant: "success" });
      await yukle();
      return;
    }
    enqueueSnackbar(t("error"), { variant: "error" });
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t("title")}
      </Typography>
      <Typography color="text.secondary" paragraph>
        {t("description")}
      </Typography>

      <section aria-labelledby="platform-ekle-basligi">
        <Typography
          id="platform-ekle-basligi"
          variant="h6"
          component="h2"
          sx={{ mt: 4 }}
          gutterBottom
        >
          {t("add.title")}
        </Typography>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <TextField
            label={t("add.name")}
            helperText={t("add.nameHelp")}
            value={yeniAd}
            onChange={(olay) => setYeniAd(olay.target.value)}
            inputProps={{ "data-testid": "platform-name" }}
            size="small"
            fullWidth
          />
          <TextField
            label={t("add.displayName")}
            helperText={t("add.displayNameHelp")}
            value={yeniGosterim}
            onChange={(olay) => setYeniGosterim(olay.target.value)}
            inputProps={{ "data-testid": "platform-display-name" }}
            size="small"
            fullWidth
          />
          <Button
            variant="contained"
            onClick={ekle}
            disabled={!yeniAd.trim() || gonderiliyor}
            data-testid="platform-submit"
            sx={{ minHeight: 44, whiteSpace: "nowrap" }}
          >
            {t("add.submit")}
          </Button>
        </div>
      </section>

      <section aria-labelledby="platform-listesi-basligi">
        <Typography
          id="platform-listesi-basligi"
          variant="h6"
          component="h2"
          sx={{ mt: 5 }}
          gutterBottom
        >
          {t("table.name")}
        </Typography>

        {hata && <Typography color="error">{t("error")}</Typography>}

        {platformlar?.length === 0 && (
          <Typography color="text.secondary">{t("empty")}</Typography>
        )}

        <ul className="m-0 list-none p-0" data-testid="platform-list">
          {platformlar?.map((platform) => (
            <li
              key={platform.id}
              data-testid={`platform-row-${platform.name}`}
              className="flex flex-wrap items-center gap-3 border-b border-line py-3"
            >
              <span className="font-mono text-sm">{platform.name}</span>

              {duzenlenen === platform.id ? (
                <>
                  <TextField
                    value={duzenlenenAd}
                    onChange={(olay) => setDuzenlenenAd(olay.target.value)}
                    inputProps={{ "data-testid": "platform-edit-input" }}
                    size="small"
                  />
                  <Button
                    onClick={() => kaydet(platform)}
                    data-testid="platform-edit-save"
                    sx={{ minHeight: 44 }}
                  >
                    {t("edit.submit")}
                  </Button>
                  <Button
                    onClick={() => setDuzenlenen(null)}
                    sx={{ minHeight: 44 }}
                  >
                    {t("edit.cancel")}
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1">{platform.display_name ?? "—"}</span>
                  <span className="text-sm text-ink-soft">
                    {t("accountCount", { count: platform.account_count })}
                  </span>
                  <span className="text-sm">
                    {platform.is_retired
                      ? t("status.retired")
                      : t("status.active")}
                  </span>
                  <Button
                    onClick={() => {
                      setDuzenlenen(platform.id);
                      setDuzenlenenAd(platform.display_name ?? "");
                    }}
                    sx={{ minHeight: 44 }}
                  >
                    {t("edit.submit")}
                  </Button>
                  {platform.is_retired ? (
                    <Button
                      onClick={() => geriGetir(platform)}
                      data-testid={`platform-restore-${platform.name}`}
                      sx={{ minHeight: 44 }}
                    >
                      {t("restore.action")}
                    </Button>
                  ) : (
                    <Button
                      color="error"
                      onClick={() => emekliyeAyir(platform)}
                      data-testid={`platform-retire-${platform.name}`}
                      sx={{ minHeight: 44 }}
                    >
                      {t("retire.action")}
                    </Button>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}

export default withPageRequiredAuth(Platforms, { requireAdmin: true });
