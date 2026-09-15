"use client";
import Button from "@mui/material/Button";
import withPageRequiredGuest from "@/services/auth/with-page-required-guest";
import { useForm, FormProvider, useFormState } from "react-hook-form";
import { useAuthForgotPasswordService } from "@/services/api/services/auth";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import FormTextInput from "@/components/form/text-input/form-text-input";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useSnackbar } from "@/hooks/use-snackbar";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { getErrorMessage, getFieldErrors } from "@/services/api/api-errors";
import { useTranslation } from "@/services/i18n/client";

type ForgotPasswordFormData = {
  email: string;
};

const useValidationSchema = () => {
  const { t } = useTranslation("forgot-password");

  return yup.object().shape({
    email: yup
      .string()
      .email(t("forgot-password:inputs.email.validation.invalid"))
      .required(t("forgot-password:inputs.email.validation.required")),
  });
};

function FormActions() {
  const { t } = useTranslation("forgot-password");
  const { isSubmitting } = useFormState();

  return (
    <Button
      variant="contained"
      color="primary"
      type="submit"
      disabled={isSubmitting}
      data-testid="send-email"
    >
      {t("forgot-password:actions.submit")}
    </Button>
  );
}

function Form() {
  const { enqueueSnackbar } = useSnackbar();
  const fetchAuthForgotPassword = useAuthForgotPasswordService();
  const { t } = useTranslation("forgot-password");
  const validationSchema = useValidationSchema();

  const methods = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      email: "",
    },
  });

  const { handleSubmit, setError } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchAuthForgotPassword(formData);

    if (status === HTTP_CODES_ENUM.NO_CONTENT) {
      enqueueSnackbar(t("forgot-password:alerts.success"), {
        variant: "success",
      });
      return;
    }

    // Backend dogrulama hatalarini FastAPI'nin {detail:[{loc,msg}]} yapisiyla
    // donuyor; onceki hal boilerplate'in {errors:{alan:kod}} yapisini
    // okudugu icin her zaman Object.keys(undefined) ile patliyordu.
    const fieldErrors = getFieldErrors(data);
    const keys = Object.keys(fieldErrors) as Array<
      keyof ForgotPasswordFormData
    >;

    if (keys.length > 0) {
      keys.forEach((key) => {
        setError(key, { type: "manual", message: fieldErrors[key] });
      });
      return;
    }

    enqueueSnackbar(getErrorMessage(data, t("forgot-password:alerts.error")), {
      variant: "error",
    });
  });

  return (
    <FormProvider {...methods}>
      <Container maxWidth="xs">
        <form onSubmit={onSubmit}>
          <Grid container spacing={2} mb={2}>
            <Grid size={{ xs: 12 }} mt={3}>
              <Typography variant="h6">{t("forgot-password:title")}</Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormTextInput<ForgotPasswordFormData>
                name="email"
                label={t("forgot-password:inputs.email.label")}
                type="email"
                testId="email"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormActions />
            </Grid>
          </Grid>
        </form>
      </Container>
    </FormProvider>
  );
}

function ForgotPassword() {
  return <Form />;
}

export default withPageRequiredGuest(ForgotPassword);
