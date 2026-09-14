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
import { useSnackbar } from "@/hooks/use-snackbar";
import Link from "@/components/link";
import useLeavePage from "@/services/leave-page/use-leave-page";
import Box from "@mui/material/Box";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "@/services/i18n/client";
import { usePostUserService } from "@/services/api/services/users";
import { useRouter } from "next/navigation";
import FormSelectInput from "@/components/form/select/form-select";
import { getErrorMessage, getFieldErrors } from "@/services/api/api-errors";

/** Backend'de rol tablosu yok; yetki tek bir is_admin bayragi. */
type AccessOption = { id: "user" | "admin" };

const ACCESS_OPTIONS: AccessOption[] = [{ id: "user" }, { id: "admin" }];

type CreateFormData = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  passwordConfirmation: string;
  access: AccessOption;
};

const useValidationSchema = () => {
  const { t } = useTranslation("admin-panel-users-create");

  return yup.object().shape({
    // Backend kurallari: 3-30 karakter, harf/rakam/_.- ve rezerve adlar
    // yasak. Buradaki kontrol yalnizca erken geri bildirim; son soz
    // backend'in (core/validators.py).
    username: yup
      .string()
      .min(3, t("admin-panel-users-create:inputs.username.validation.min"))
      .max(30, t("admin-panel-users-create:inputs.username.validation.max"))
      .matches(
        /^[a-zA-Z0-9_.-]+$/,
        t("admin-panel-users-create:inputs.username.validation.invalid")
      )
      .required(
        t("admin-panel-users-create:inputs.username.validation.required")
      ),
    email: yup
      .string()
      .email(t("admin-panel-users-create:inputs.email.validation.invalid"))
      .required(t("admin-panel-users-create:inputs.email.validation.required")),
    firstName: yup.string().default(""),
    lastName: yup.string().default(""),
    password: yup
      .string()
      .min(6, t("admin-panel-users-create:inputs.password.validation.min"))
      .required(
        t("admin-panel-users-create:inputs.password.validation.required")
      ),
    passwordConfirmation: yup
      .string()
      .oneOf(
        [yup.ref("password")],
        t(
          "admin-panel-users-create:inputs.passwordConfirmation.validation.match"
        )
      )
      .required(
        t(
          "admin-panel-users-create:inputs.passwordConfirmation.validation.required"
        )
      ),
    access: yup
      .object()
      .shape({
        id: yup.mixed<AccessOption["id"]>().oneOf(["user", "admin"]).required(),
      })
      .required(),
  });
};

function CreateUserFormActions() {
  const { t } = useTranslation("admin-panel-users-create");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button
      variant="contained"
      color="primary"
      type="submit"
      disabled={isSubmitting}
    >
      {t("admin-panel-users-create:actions.submit")}
    </Button>
  );
}

function FormCreateUser() {
  const router = useRouter();
  const fetchPostUser = usePostUserService();
  const { t } = useTranslation("admin-panel-users-create");
  const validationSchema = useValidationSchema();

  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<CreateFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      passwordConfirmation: "",
      access: { id: "user" },
    },
  });

  const { handleSubmit, setError } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchPostUser({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      // Bos birakilan ad/soyad backend'e hic gonderilmiyor.
      first_name: formData.firstName.trim() || undefined,
      last_name: formData.lastName.trim() || undefined,
      is_admin: formData.access.id === "admin",
    });

    if (status === HTTP_CODES_ENUM.CREATED) {
      enqueueSnackbar(t("admin-panel-users-create:alerts.user.success"), {
        variant: "success",
      });
      router.push("/admin-panel/users");
      return;
    }

    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      // Backend FastAPI'nin {detail:[{loc, msg}]} yapisini donuyor; alan
      // adlari snake_case oldugu icin form adlarina cevriliyor.
      const fieldErrors = getFieldErrors(data);
      const keys = Object.keys(fieldErrors) as Array<keyof CreateFormData>;

      if (keys.length > 0) {
        keys.forEach((key) => {
          setError(key, { type: "manual", message: fieldErrors[key] });
        });
        return;
      }
    }

    // 409 (kullanici adi/e-posta zaten var) ve digerleri: backend'in mesaji
    // hangi alanin cakistigini zaten soyluyor.
    enqueueSnackbar(
      getErrorMessage(data, t("admin-panel-users-create:alerts.user.error")),
      { variant: "error" }
    );
  });

  return (
    <FormProvider {...methods}>
      <Container maxWidth="xs">
        <form onSubmit={onSubmit} autoComplete="create-new-user">
          <Grid container spacing={2} mb={3} mt={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6">
                {t("admin-panel-users-create:title")}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<CreateFormData>
                name="username"
                testId="new-user-username"
                autoComplete="new-user-username"
                label={t("admin-panel-users-create:inputs.username.label")}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<CreateFormData>
                name="email"
                testId="new-user-email"
                autoComplete="new-user-email"
                label={t("admin-panel-users-create:inputs.email.label")}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<CreateFormData>
                name="password"
                type="password"
                testId="new-user-password"
                autoComplete="new-user-password"
                label={t("admin-panel-users-create:inputs.password.label")}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<CreateFormData>
                name="passwordConfirmation"
                testId="new-user-password-confirmation"
                label={t(
                  "admin-panel-users-create:inputs.passwordConfirmation.label"
                )}
                type="password"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<CreateFormData>
                name="firstName"
                testId="first-name"
                label={t("admin-panel-users-create:inputs.firstName.label")}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<CreateFormData>
                name="lastName"
                testId="last-name"
                label={t("admin-panel-users-create:inputs.lastName.label")}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormSelectInput<CreateFormData, AccessOption>
                name="access"
                testId="access"
                label={t("admin-panel-users-create:inputs.access.label")}
                options={ACCESS_OPTIONS}
                keyValue="id"
                renderOption={(option) =>
                  t(
                    `admin-panel-users-create:inputs.access.options.${option.id}`
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <CreateUserFormActions />
              <Box ml={1} component="span">
                <Button
                  variant="contained"
                  color="inherit"
                  LinkComponent={Link}
                  href="/admin-panel/users"
                >
                  {t("admin-panel-users-create:actions.cancel")}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Container>
    </FormProvider>
  );
}

function CreateUser() {
  return <FormCreateUser />;
}

// Bu sayfa admin uclarina yaziyor; guard da admin istemeli.
// Onceki hali yalnizca "giris yapmis" kontrolu yapiyordu.
export default withPageRequiredAuth(CreateUser, { requireAdmin: true });
