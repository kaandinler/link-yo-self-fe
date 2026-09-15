import HTTP_CODES_ENUM from "./http-codes";
import { ApiErrorResponse } from "./validation-errors";

export type FetchJsonResponse<T> =
  | {
      // 202: istek kabul edildi ama islem henuz tamamlanmadi
      // (orn. e-posta degisikligi onay bekliyor).
      status:
        | HTTP_CODES_ENUM.OK
        | HTTP_CODES_ENUM.CREATED
        | HTTP_CODES_ENUM.ACCEPTED;
      data: T;
    }
  | { status: HTTP_CODES_ENUM.NO_CONTENT; data: undefined }
  | {
      status:
        | HTTP_CODES_ENUM.INTERNAL_SERVER_ERROR
        | HTTP_CODES_ENUM.SERVICE_UNAVAILABLE;
      data: undefined;
    }
  | ApiErrorResponse;
