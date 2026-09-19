import { useCallback } from "react";
import { toast } from "react-toastify";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { FetchJsonResponse } from "@/services/api/types/fetch-json-response";
import {
  BaseResponseModel,
  ResponseStatus,
} from "@/services/api/types/base-response";

export function useSnackbar() {
  const enqueueSnackbar = useCallback(
    (
      message: string,
      config?: { variant?: ResponseStatus; autoHideDuration?: number }
    ) => {
      toast(
        message,
        config
          ? {
              type: config.variant,
              autoClose: config.autoHideDuration,
            }
          : undefined
      );
    },
    []
  );

  // BaseResponseModel için snackbar gösterme (FastAPI için)
  const showApiResponse = useCallback(
    (
      response: BaseResponseModel,
      options?: {
        autoHideDuration?: number;
        onlyShowOnError?: boolean;
        customMessage?: string;
        showFieldErrors?: boolean; // Field errors'ları ayrı snackbar'larda göster
      }
    ) => {
      const { status, message, errors } = response;
      const {
        onlyShowOnError = false,
        customMessage,
        autoHideDuration,
        showFieldErrors = false,
      } = options || {};

      if (onlyShowOnError && status !== "error") {
        return;
      }

      // Ana mesajı göster
      const displayMessage = customMessage || message;
      if (displayMessage) {
        toast(displayMessage, {
          type: status,
          autoClose: autoHideDuration,
        });
      }

      // Field errors'ları ayrı ayrı göster (opsiyonel)
      if (showFieldErrors && errors && status === "error") {
        Object.entries(errors).forEach(([fieldName, errorMessage]) => {
          setTimeout(() => {
            toast(`${fieldName}: ${errorMessage}`, {
              type: "error",
              autoClose: autoHideDuration,
            });
          }, 300); // Ana mesajdan sonra göster
        });
      }
    },
    []
  );

  // Mevcut FetchJsonResponse için snackbar gösterme
  const showFetchResponse = useCallback(
    <T>(
      response: FetchJsonResponse<T>,
      options?: {
        autoHideDuration?: number;
        onlyShowOnError?: boolean;
        customMessage?: string;
        successMessage?: string; // Başarılı durumlar için özel mesaj
      }
    ) => {
      const { status, data } = response;
      const {
        onlyShowOnError = false,
        customMessage,
        autoHideDuration = 5000,
        successMessage,
      } = options || {};

      let variant: ResponseStatus = "info";
      let message: string = customMessage || "";

      // HTTP status koduna göre variant belirleme
      if (status === HTTP_CODES_ENUM.OK || status === HTTP_CODES_ENUM.CREATED) {
        variant = "success";
        if (!message) {
          message =
            successMessage ||
            (data && typeof data === "object" && "message" in data
              ? (data.message as string)
              : null) ||
            "İşlem başarıyla tamamlandı";
        }
      } else if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        variant = "error";
        if (!message) {
          message =
            (data && typeof data === "object" && "message" in data
              ? (data.message as string)
              : null) || "Girdiğiniz bilgilerde hata var";
        }
      } else if (
        status === HTTP_CODES_ENUM.INTERNAL_SERVER_ERROR ||
        status === HTTP_CODES_ENUM.SERVICE_UNAVAILABLE
      ) {
        variant = "error";
        if (!message) {
          message = "Sunucu hatası oluştu. Lütfen tekrar deneyin";
        }
      } else {
        variant = "error";
        if (!message) {
          message =
            (data && typeof data === "object" && "message" in data
              ? (data.message as string)
              : null) || "Bir hata oluştu";
        }
      }

      // Sadece hata durumlarında gösterilmesi isteniyorsa ve başarılı ise çık
      if (onlyShowOnError && variant === "success") {
        return;
      }

      toast(message, {
        type: variant,
        autoClose: autoHideDuration,
      });
    },
    []
  );

  return {
    enqueueSnackbar,
    showApiResponse,
    showFetchResponse,
  };
}
