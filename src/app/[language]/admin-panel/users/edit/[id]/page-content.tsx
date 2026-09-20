"use client";

import Button from "@mui/material/Button";
import { useForm, FormProvider, useFormState } from "react-hook-form";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import FormTextInput from "@/components/form/text-input/form-text-input";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useEffect } from "react";
import { useSnackbar } from "@/hooks/use-snackbar";
import Link from "@/components/link";
import useLeavePage from "@/services/leave-page/use-leave-page";
import Box from "@mui/material/Box";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "@/services/i18n/client";
import {
  useGetUserService,
  usePatchUserService,
  UserPostRequest,
} from "@/services/api/services/users";
import { useParams } from "next/navigation";
import FormSelectInput from "@/components/form/select/form-select";
import { getErrorMessage, getFieldErrors } from "@/services/api/api-errors";
import { passwordSchema } from "@/services/api/password-schema";

/** Backend'de rol tablosu yok; yetki tek bir is_admin bayragi. */
type AccessOption = { id: "user" | "admin" };

const ACCESS_OPTIONS: AccessOption[] = [{ id: "user" }, { id: "admin" }];

type EditUserFormData = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  access: AccessOption;
};

type ChangeUserPasswordFormData = {
  password: string;
  passwordConfirmation: string;
};

const useValidationEditUserSchema = () => {
  const { t } = useTranslation("admin-panel-users-edit");

  return yup.object().shape({
    username: yup
      .string()
      .min(3, t("admin-panel-users-edit:inputs.username.validation.min"))
      .max(30, t("admin-panel-users-edit:inputs.username.validation.max"))
      .matches(
        /^[a-zA-Z0-9_.-]+$/,
        t("admin-panel-users-edit:inputs.username.validation.invalid")
      )
      .required(
        t("admin-panel-users-edit:inputs.username.validation.required")
      ),
    email: yup
      .string()
      .email(t("admin-panel-users-edit:inputs.email.validation.invalid"))
      .required(t("admin-panel-users-edit:inputs.email.validation.required")),
    firstName: yup.string().default(""),
    lastName: yup.string().default(""),
    access: yup
      .object()
      .shape({
        id: yup.mixed<AccessOption["id"]>().oneOf(["user", "admin"]).required(),
      })
      .required(),
  });
};

const useValidationChangePasswordSchema = () => {
  const { t } = useTranslation("admin-panel-users-edit");

  return yup.object().shape({
    password: passwordSchema(
      t("admin-panel-users-edit:inputs.password.validation.required"),
      t
    ),
    passwordConfirmation: yup
      .string()
      .oneOf(
        [yup.ref("password")],
        t("admin-panel-users-edit:inputs.passwordConfirmation.validation.match")
      )
      .required(
        t(
          "admin-panel-users-edit:inputs.passwordConfirmation.validation.required"
        )
      ),
  });
};

function EditUserFormActions() {
  const { t } = useTranslation("admin-panel-users-edit");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button
      variant="contained"
      color="primary"
      type="submit"
      disabled={isSubmitting}
    >
      {t("admin-panel-users-edit:actions.submit")}
    </Button>
  );
}

function ChangePasswordUserFormActions() {
  const { t } = useTranslation("admin-panel-users-edit");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button
      variant="contained"
      color="primary"
      type="submit"
      disabled={isSubmitting}
    >
      {t("admin-panel-users-edit:actions.submit")}
    </Button>
  );
}

function FormEditUser() {
  const params = useParams<{ id: string }>();
  const userId = Number(params.id);
  const fetchGetUser = useGetUserService();
  const fetchPatchUser = usePatchUserService();
  const { t } = useTranslation("admin-panel-users-edit");
  const validationSchema = useValidationEditUserSchema();
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<EditUserFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      access: { id: "user" },
    },
  });

  const { handleSubmit, setError, reset, getFieldState } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    // Backend PATCH semantigi uyguluyor: gonderilmeyen alan degistirilmez.
    // Degismemis alanlari govdeye koymazsak gereksiz benzersizlik kontrolu
    // ve catisma riski de olusmuyor.
    const body: Partial<UserPostRequest> = {
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      is_admin: formData.access.id === "admin",
    };

    if (getFieldState("username").isDirty) body.username = formData.username;
    if (getFieldState("email").isDirty) body.email = formData.email;

    const { data, status } = await fetchPatchUser({ id: userId, data: body });

    if (status === HTTP_CODES_ENUM.OK) {
      reset(formData);
      enqueueSnackbar(t("admin-panel-users-edit:alerts.user.success"), {
        variant: "success",
      });
      return;
    }

    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      const fieldErrors = getFieldErrors(data);
      const keys = Object.keys(fieldErrors) as Array<keyof EditUserFormData>;

      if (keys.length > 0) {
        keys.forEach((key) => {
          setError(key, { type: "manual", message: fieldErrors[key] });
        });
        return;
      }
    }

    // 422 alan hatasi degilse (orn. admin kendi yetkisini indirmeye
    // calisiyorsa) ve 409/404 durumlarinda backend'in mesaji gosteriliyor.
    enqueueSnackbar(
      getErrorMessage(data, t("admin-panel-users-edit:alerts.user.error")),
      { variant: "error" }
    );
  });

  useEffect(() => {
    if (!Number.isFinite(userId)) return;

    const getInitialDataForEdit = async () => {
      const { status, data } = await fetchGetUser({ id: userId });

      if (status === HTTP_CODES_ENUM.OK) {
        const user = data.data;
        reset({
          username: user?.username ?? "",
          email: user?.email ?? "",
          firstName: user?.first_name ?? "",
          lastName: user?.last_name ?? "",
          access: { id: user?.is_admin ? "admin" : "user" },
        });
      }
    };

    getInitialDataForEdit();
  }, [userId, reset, fetchGetUser]);

  return (
    <FormProvider {...methods}>
      <Container maxWidth="xs">
        <form onSubmit={onSubmit}>
          <Grid container spacing={2} mb={3} mt={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6">
                {t("admin-panel-users-edit:title1")}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<EditUserFormData>
                name="username"
                testId="username"
                label={t("admin-panel-users-edit:inputs.username.label")}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<EditUserFormData>
                name="email"
                testId="email"
                label={t("admin-panel-users-edit:inputs.email.label")}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<EditUserFormData>
                name="firstName"
                testId="first-name"
                label={t("admin-panel-users-edit:inputs.firstName.label")}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<EditUserFormData>
                name="lastName"
                testId="last-name"
                label={t("admin-panel-users-edit:inputs.lastName.label")}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormSelectInput<EditUserFormData, AccessOption>
                name="access"
                testId="access"
                label={t("admin-panel-users-edit:inputs.access.label")}
                options={ACCESS_OPTIONS}
                keyValue="id"
                renderOption={(option) =>
                  t(`admin-panel-users-edit:inputs.access.options.${option.id}`)
                }
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <EditUserFormActions />
              <Box ml={1} component="span">
                <Button
                  variant="contained"
                  color="inherit"
                  LinkComponent={Link}
                  href="/admin-panel/users"
                >
                  {t("admin-panel-users-edit:actions.cancel")}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Container>
    </FormProvider>
  );
}

function FormChangePasswordUser() {
  const params = useParams<{ id: string }>();
  const userId = Number(params.id);
  const fetchPatchUser = usePatchUserService();
  const { t } = useTranslation("admin-panel-users-edit");
  const validationSchema = useValidationChangePasswordSchema();
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<ChangeUserPasswordFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      password: "",
      passwordConfirmation: "",
    },
  });

  const { handleSubmit, setError, reset } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchPatchUser({
      id: userId,
      // passwordConfirmation yalnizca istemci tarafi kontrolu; backend'de
      // boyle bir alan yok ve gonderilirse 422 alinir.
      data: { password: formData.password },
    });

    if (status === HTTP_CODES_ENUM.OK) {
      reset();
      enqueueSnackbar(t("admin-panel-users-edit:alerts.password.success"), {
        variant: "success",
      });
      return;
    }

    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      const fieldErrors = getFieldErrors(data);
      const keys = Object.keys(fieldErrors) as Array<
        keyof ChangeUserPasswordFormData
      >;

      if (keys.length > 0) {
        keys.forEach((key) => {
          setError(key, { type: "manual", message: fieldErrors[key] });
        });
        return;
      }
    }

    enqueueSnackbar(
      getErrorMessage(data, t("admin-panel-users-edit:alerts.password.error")),
      { variant: "error" }
    );
  });

  return (
    <FormProvider {...methods}>
      <Container maxWidth="xs">
        <form onSubmit={onSubmit}>
          <Grid container spacing={2} mb={3} mt={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6">
                {t("admin-panel-users-edit:title2")}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<ChangeUserPasswordFormData>
                name="password"
                type="password"
                label={t("admin-panel-users-edit:inputs.password.label")}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<ChangeUserPasswordFormData>
                name="passwordConfirmation"
                label={t(
                  "admin-panel-users-edit:inputs.passwordConfirmation.label"
                )}
                type="password"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <ChangePasswordUserFormActions />
              <Box ml={1} component="span">
                <Button
                  variant="contained"
                  color="inherit"
                  LinkComponent={Link}
                  href="/admin-panel/users"
                >
                  {t("admin-panel-users-edit:actions.cancel")}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Container>
    </FormProvider>
  );
}

function EditUser() {
  return (
    <>
      <FormEditUser />
      <FormChangePasswordUser />
    </>
  );
}

// Bu sayfa admin uclarina yaziyor; guard da admin istemeli.
export default withPageRequiredAuth(EditUser, { requireAdmin: true });
