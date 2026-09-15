"use client";
import Button from "@mui/material/Button";
import { useForm, FormProvider, useFormState } from "react-hook-form";
import { useUpdateProfile } from "@/services/api/services/onboarding";
import useAuthActions from "@/services/auth/use-auth-actions";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import FormTextInput from "@/components/form/text-input/form-text-input";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useEffect } from "react";
import useAuth from "@/services/auth/use-auth";
import { useSnackbar } from "@/hooks/use-snackbar";
import Link from "@/components/link";
import useLeavePage from "@/services/leave-page/use-leave-page";
import Box from "@mui/material/Box";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "@/services/i18n/client";
import {
  useAuthChangeEmailService,
  useAuthChangePasswordService,
} from "@/services/api/services/auth";
import useAuthTokens from "@/services/auth/use-auth-tokens";
import { getErrorMessage, getFieldErrors } from "@/services/api/api-errors";
import { passwordSchema } from "@/services/api/password-schema";

type EditProfileBasicInfoFormData = {
  firstName: string;
  lastName: string;
  displayName: string;
  bio: string;
  profileImageUrl: string;
};

type EditProfilePageFormData = {
  pageTitle: string;
  pageDescription: string;
  website: string;
};

type EditProfileSocialFormData = {
  twitterUsername: string;
  instagramUsername: string;
  linkedinUsername: string;
};

type EditProfileChangePasswordFormData = {
  oldPassword: string;
  password: string;
  passwordConfirmation: string;
};

type EditProfileChangeEmailFormData = {
  email: string;
  emailConfirmation: string;
  /**
   * Backend sifre onayi istiyor: e-posta, sifirlama baglantisinin adresi.
   *
   * Alan adi bilerek "password" DEGIL: sifre degistirme formundaki yeni sifre
   * alani da o adi kullaniyor ve ayni sayfada iki input ayni name ile
   * bulununca hem tarayici otomatik doldurmasi hem sifre yoneticileri yanlis
   * alani hedefliyor.
   */
  currentPassword: string;
};

const useValidationBasicInfoSchema = () => {
  const { t } = useTranslation("profile");

  return yup.object().shape({
    firstName: yup
      .string()
      .required(t("profile:inputs.firstName.validation.required")),
    lastName: yup
      .string()
      .required(t("profile:inputs.lastName.validation.required")),
    // .defined(): yup'un opsiyonel string'i `string | undefined` uretiyor ve
    // form tipiyle uyusmuyor. Alanlar zaten bos string ile basliyor.
    displayName: yup.string().defined(),
    bio: yup.string().defined(),
    // Backend de ayni kurali uyguluyor (core/validators.py); burasi sunucuya
    // gitmeden geri bildirim vermek icin, son soz backend'in.
    profileImageUrl: yup
      .string()
      .defined()
      .test(
        "http",
        t("profile:inputs.profileImageUrl.validation.url"),
        (value) => !value || /^https?:\/\//.test(value)
      ),
  });
};

const useValidationPageSchema = () =>
  yup.object().shape({
    pageTitle: yup.string().defined(),
    pageDescription: yup.string().defined(),
    // Sema eksikse backend https:// ekliyor, bu yuzden burada zorunlu degil.
    website: yup.string().defined(),
  });

const useValidationSocialSchema = () =>
  yup.object().shape({
    twitterUsername: yup.string().defined(),
    instagramUsername: yup.string().defined(),
    linkedinUsername: yup.string().defined(),
  });

const useValidationChangeEmailSchema = () => {
  const { t } = useTranslation("profile");
  const { user } = useAuth();

  return yup.object().shape({
    email: yup
      .string()
      .notOneOf(
        [user?.email],
        t("profile:inputs.email.validation.currentEmail")
      )
      .email(t("profile:inputs.email.validation.email"))
      .required(t("profile:inputs.email.validation.required")),
    emailConfirmation: yup
      .string()
      .oneOf(
        [yup.ref("email")],
        t("profile:inputs.emailConfirmation.validation.match")
      )
      .required(t("profile:inputs.emailConfirmation.validation.required")),
    currentPassword: yup
      .string()
      .required(t("profile:inputs.currentPassword.validation.required")),
  });
};

const useValidationChangePasswordSchema = () => {
  const { t } = useTranslation("profile");

  return yup.object().shape({
    // Mevcut sifre eski kuralla belirlenmis olabilir; burada yalnizca
    // dolu olmasi yeterli, dogrulamayi backend yapiyor.
    oldPassword: yup
      .string()
      .required(t("profile:inputs.oldPassword.validation.required")),
    password: passwordSchema(t("profile:inputs.password.validation.required")),
    passwordConfirmation: yup
      .string()
      .oneOf(
        [yup.ref("password")],
        t("profile:inputs.passwordConfirmation.validation.match")
      )
      .required(t("profile:inputs.passwordConfirmation.validation.required")),
  });
};

function BasicInfoFormActions() {
  const { t } = useTranslation("profile");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button
      variant="contained"
      color="primary"
      type="submit"
      disabled={isSubmitting}
      data-testid="save-profile"
    >
      {t("profile:actions.submit")}
    </Button>
  );
}

function FormBasicInfo() {
  const { setUser } = useAuthActions();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const { t } = useTranslation("profile");
  const validationSchema = useValidationBasicInfoSchema();
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<EditProfileBasicInfoFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      displayName: "",
      bio: "",
      profileImageUrl: "",
    },
  });

  const { handleSubmit, setError, reset } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    try {
      // Form alanlari camelCase, backend snake_case bekliyor.
      const updated = await updateProfile.mutateAsync({
        first_name: formData.firstName,
        last_name: formData.lastName,
        display_name: formData.displayName,
        bio: formData.bio,
        profile_image_url: formData.profileImageUrl,
      });

      setUser(updated);
      enqueueSnackbar(t("profile:alerts.profile.success"), {
        variant: "success",
      });
    } catch (caught) {
      setError("firstName", {
        type: "manual",
        message:
          caught instanceof Error
            ? caught.message
            : t("profile:alerts.profile.success"),
      });
    }
  });

  useEffect(() => {
    reset({
      firstName: user?.first_name ?? "",
      lastName: user?.last_name ?? "",
      displayName: user?.display_name ?? "",
      bio: user?.bio ?? "",
      profileImageUrl: user?.profile_image_url ?? "",
    });
  }, [user, reset]);

  return (
    <FormProvider {...methods}>
      <Container maxWidth="xs">
        <form onSubmit={onSubmit}>
          <Grid container spacing={2} mb={3} mt={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6">{t("profile:title1")}</Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<EditProfileBasicInfoFormData>
                name="firstName"
                label={t("profile:inputs.firstName.label")}
                testId="first-name"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<EditProfileBasicInfoFormData>
                name="lastName"
                label={t("profile:inputs.lastName.label")}
                testId="last-name"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<EditProfileBasicInfoFormData>
                name="displayName"
                label={t("profile:inputs.displayName.label")}
                helperText={t("profile:inputs.displayName.helper")}
                testId="display-name"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<EditProfileBasicInfoFormData>
                name="bio"
                label={t("profile:inputs.bio.label")}
                helperText={t("profile:inputs.bio.helper")}
                multiline
                minRows={2}
                maxRows={5}
                testId="bio"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<EditProfileBasicInfoFormData>
                name="profileImageUrl"
                label={t("profile:inputs.profileImageUrl.label")}
                testId="profile-image-url"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <BasicInfoFormActions />
              <Box ml={1} component="span">
                <Button
                  variant="contained"
                  color="inherit"
                  LinkComponent={Link}
                  href="/profile"
                  data-testid="cancel-edit-profile"
                >
                  {t("profile:actions.cancel")}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Container>
    </FormProvider>
  );
}

/**
 * Herkese acik sayfanin ayarlari ve sosyal baglantilar.
 *
 * NEDEN VAR: bu alanlar yalnizca onboarding sihirbazinda toplaniyordu.
 * Sihirbaz bir kez calisiyor ve bir daha acilmiyor, dolayisiyla yanlis
 * yazilan bir kullanici adi ya da sonradan degisen bir web sitesi
 * duzeltilemiyordu. Backend ucu (PUT /v1/profile/update) hepsini zaten
 * kabul ediyordu; eksik olan arayuzdu.
 */
function SectionFormActions({ testId }: { testId: string }) {
  const { t } = useTranslation("profile");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button
      variant="contained"
      color="primary"
      type="submit"
      disabled={isSubmitting}
      data-testid={testId}
    >
      {t("profile:actions.submit")}
    </Button>
  );
}

function FormPublicPage() {
  const { setUser } = useAuthActions();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const { t } = useTranslation("profile");
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<EditProfilePageFormData>({
    resolver: yupResolver(useValidationPageSchema()),
    defaultValues: { pageTitle: "", pageDescription: "", website: "" },
  });

  const { handleSubmit, setError, reset } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    try {
      const updated = await updateProfile.mutateAsync({
        page_title: formData.pageTitle,
        page_description: formData.pageDescription,
        website: formData.website,
      });

      setUser(updated);
      // Backend adresi normalize ediyor (sema ekliyor); kaydedilen degeri
      // forma geri yaziyoruz ki kullanici ne saklandigini gorsun.
      reset({
        pageTitle: updated.page_title ?? "",
        pageDescription: updated.page_description ?? "",
        website: updated.website ?? "",
      });
      enqueueSnackbar(t("profile:alerts.page.success"), { variant: "success" });
    } catch (caught) {
      setError("website", {
        type: "manual",
        message:
          caught instanceof Error
            ? caught.message
            : t("profile:alerts.page.error"),
      });
    }
  });

  useEffect(() => {
    reset({
      pageTitle: user?.page_title ?? "",
      pageDescription: user?.page_description ?? "",
      website: user?.website ?? "",
    });
  }, [user, reset]);

  return (
    <FormProvider {...methods}>
      <Container maxWidth="xs">
        <form onSubmit={onSubmit}>
          <Grid container spacing={2} mb={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6">{t("profile:title4")}</Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<EditProfilePageFormData>
                name="pageTitle"
                label={t("profile:inputs.pageTitle.label")}
                helperText={t("profile:inputs.pageTitle.helper")}
                testId="page-title"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<EditProfilePageFormData>
                name="pageDescription"
                label={t("profile:inputs.pageDescription.label")}
                helperText={t("profile:inputs.pageDescription.helper")}
                multiline
                minRows={2}
                maxRows={5}
                testId="page-description"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<EditProfilePageFormData>
                name="website"
                label={t("profile:inputs.website.label")}
                helperText={t("profile:inputs.website.helper")}
                testId="website"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <SectionFormActions testId="save-page" />
            </Grid>
          </Grid>
        </form>
      </Container>
    </FormProvider>
  );
}

function FormSocialLinks() {
  const { setUser } = useAuthActions();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const { t } = useTranslation("profile");
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<EditProfileSocialFormData>({
    resolver: yupResolver(useValidationSocialSchema()),
    defaultValues: {
      twitterUsername: "",
      instagramUsername: "",
      linkedinUsername: "",
    },
  });

  const { handleSubmit, setError, reset } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    try {
      const updated = await updateProfile.mutateAsync({
        twitter_username: formData.twitterUsername,
        instagram_username: formData.instagramUsername,
        linkedin_username: formData.linkedinUsername,
      });

      setUser(updated);
      // Backend bastaki @ isaretini kirpiyor; temizlenmis hali forma donuyor.
      reset({
        twitterUsername: updated.twitter_username ?? "",
        instagramUsername: updated.instagram_username ?? "",
        linkedinUsername: updated.linkedin_username ?? "",
      });
      enqueueSnackbar(t("profile:alerts.social.success"), {
        variant: "success",
      });
    } catch (caught) {
      setError("twitterUsername", {
        type: "manual",
        message:
          caught instanceof Error
            ? caught.message
            : t("profile:alerts.social.error"),
      });
    }
  });

  useEffect(() => {
    reset({
      twitterUsername: user?.twitter_username ?? "",
      instagramUsername: user?.instagram_username ?? "",
      linkedinUsername: user?.linkedin_username ?? "",
    });
  }, [user, reset]);

  return (
    <FormProvider {...methods}>
      <Container maxWidth="xs">
        <form onSubmit={onSubmit}>
          <Grid container spacing={2} mb={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6">{t("profile:title5")}</Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<EditProfileSocialFormData>
                name="twitterUsername"
                label={t("profile:inputs.twitterUsername.label")}
                helperText={t("profile:inputs.twitterUsername.helper")}
                testId="twitter-username"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<EditProfileSocialFormData>
                name="instagramUsername"
                label={t("profile:inputs.instagramUsername.label")}
                helperText={t("profile:inputs.instagramUsername.helper")}
                testId="instagram-username"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<EditProfileSocialFormData>
                name="linkedinUsername"
                label={t("profile:inputs.linkedinUsername.label")}
                helperText={t("profile:inputs.linkedinUsername.helper")}
                testId="linkedin-username"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <SectionFormActions testId="save-social" />
            </Grid>
          </Grid>
        </form>
      </Container>
    </FormProvider>
  );
}

function ChangeEmailFormActions() {
  const { t } = useTranslation("profile");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button
      variant="contained"
      color="primary"
      type="submit"
      disabled={isSubmitting}
      data-testid="save-email"
    >
      {t("profile:actions.submit")}
    </Button>
  );
}

/**
 * E-posta degistirme TALEBI.
 *
 * Adres bu formla degismiyor: backend yeni adrese dogrulama baglantisi
 * gonderiyor (202) ve degisiklik ancak kullanici o baglantiya tikladiginda
 * uygulaniyor. Bu yuzden burada setUser cagrilmiyor -- kullanicinin adresi
 * hala eski.
 */
function FormChangeEmail() {
  const { t } = useTranslation("profile");
  const validationSchema = useValidationChangeEmailSchema();
  const { enqueueSnackbar } = useSnackbar();
  const changeEmail = useAuthChangeEmailService();

  const methods = useForm<EditProfileChangeEmailFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      email: "",
      emailConfirmation: "",
      currentPassword: "",
    },
  });

  const { handleSubmit, setError, reset } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { status, data } = await changeEmail({
      password: formData.currentPassword,
      new_email: formData.email,
    });

    // 202: adres HENUZ degismedi; yeni adrese dogrulama baglantisi gitti.
    if (status === HTTP_CODES_ENUM.ACCEPTED) {
      reset();
      enqueueSnackbar(
        t("profile:alerts.email.success", { email: data.data.pending_email }),
        { variant: "success" }
      );
      return;
    }

    if (status === HTTP_CODES_ENUM.FORBIDDEN) {
      // Backend yanlis sifreyi 403 ile bildiriyor; hatayi ilgili alana koy.
      setError("currentPassword", {
        type: "manual",
        message: t("profile:inputs.currentPassword.validation.incorrect"),
      });
      return;
    }

    if (status === HTTP_CODES_ENUM.CONFLICT) {
      setError("email", {
        type: "manual",
        message: t("profile:inputs.email.validation.server.emailExists"),
      });
      return;
    }

    const fieldErrors = getFieldErrors(data);
    if (fieldErrors.email) {
      setError("email", { type: "manual", message: fieldErrors.email });
      return;
    }

    enqueueSnackbar(getErrorMessage(data, t("profile:alerts.email.error")), {
      variant: "error",
    });
  });

  return (
    <FormProvider {...methods}>
      <Container maxWidth="xs">
        <form onSubmit={onSubmit}>
          <Grid container spacing={2} mb={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6">{t("profile:title2")}</Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<EditProfileChangeEmailFormData>
                name="email"
                label={t("profile:inputs.email.label")}
                testId="email"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<EditProfileChangeEmailFormData>
                name="emailConfirmation"
                label={t("profile:inputs.emailConfirmation.label")}
                testId="email-confirmation"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<EditProfileChangeEmailFormData>
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                label={t("profile:inputs.currentPassword.label")}
                testId="email-current-password"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <ChangeEmailFormActions />
            </Grid>
          </Grid>
        </form>
      </Container>
    </FormProvider>
  );
}

function ChangePasswordFormActions() {
  const { t } = useTranslation("profile");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button
      variant="contained"
      color="primary"
      type="submit"
      disabled={isSubmitting}
      data-testid="save-password"
    >
      {t("profile:actions.submit")}
    </Button>
  );
}

/**
 * Sifre degistirme.
 *
 * Backend diger cihazlardaki oturumlari kapatip bu oturum icin yeni bir
 * token cifti donuyor; token'lari saklamazsak kullanici bir sonraki
 * yenilemede oturumdan duserdi.
 */
function FormChangePassword() {
  const { t } = useTranslation("profile");
  const validationSchema = useValidationChangePasswordSchema();
  const { enqueueSnackbar } = useSnackbar();
  const { setTokensInfo } = useAuthTokens();
  const changePassword = useAuthChangePasswordService();

  const methods = useForm<EditProfileChangePasswordFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      oldPassword: "",
      password: "",
      passwordConfirmation: "",
    },
  });

  const { handleSubmit, setError, reset } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { status, data } = await changePassword({
      current_password: formData.oldPassword,
      new_password: formData.password,
    });

    if (status === HTTP_CODES_ENUM.OK) {
      setTokensInfo({
        token: data.data.access_token,
        refreshToken: data.data.refresh_token,
        // Backend ACCESS_TOKEN_EXPIRE_MINUTES varsayilani 30 dakika;
        // giris akisi da ayni varsayimi kullaniyor.
        tokenExpires: Date.now() + 30 * 60 * 1000,
      });
      reset();
      enqueueSnackbar(t("profile:alerts.password.success"), {
        variant: "success",
      });
      return;
    }

    if (status === HTTP_CODES_ENUM.FORBIDDEN) {
      setError("oldPassword", {
        type: "manual",
        message: t(
          "profile:inputs.oldPassword.validation.server.incorrectOldPassword"
        ),
      });
      return;
    }

    const fieldErrors = getFieldErrors(data);
    if (fieldErrors.new_password) {
      setError("password", {
        type: "manual",
        message: fieldErrors.new_password,
      });
      return;
    }

    enqueueSnackbar(getErrorMessage(data, t("profile:alerts.password.error")), {
      variant: "error",
    });
  });

  return (
    <FormProvider {...methods}>
      <Container maxWidth="xs">
        <form onSubmit={onSubmit}>
          <Grid container spacing={2} mb={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6">{t("profile:title3")}</Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<EditProfileChangePasswordFormData>
                name="oldPassword"
                type="password"
                autoComplete="current-password"
                label={t("profile:inputs.oldPassword.label")}
                testId="old-password"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<EditProfileChangePasswordFormData>
                name="password"
                type="password"
                autoComplete="new-password"
                label={t("profile:inputs.password.label")}
                testId="new-password"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<EditProfileChangePasswordFormData>
                name="passwordConfirmation"
                type="password"
                autoComplete="new-password"
                label={t("profile:inputs.passwordConfirmation.label")}
                testId="password-confirmation"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <ChangePasswordFormActions />
            </Grid>
          </Grid>
        </form>
      </Container>
    </FormProvider>
  );
}

function EditProfile() {
  return (
    <>
      <FormBasicInfo />
      <FormPublicPage />
      <FormSocialLinks />
      <FormChangeEmail />
      <FormChangePassword />
    </>
  );
}

export default withPageRequiredAuth(EditProfile);
