import {
  parseSignUpResponse,
  convertFieldErrorsToFormErrors,
  mapBackendFieldsToFormFields,
  getSignUpErrorMessage,
  logSignUpAttempt,
} from "./sign-up-utils";
import { BaseResponseModel, API_STATUS } from "../types/base-response";

describe("parseSignUpResponse", () => {
  it("should parse success response correctly", () => {
    const mockResponse: BaseResponseModel<void> = {
      status: API_STATUS.SUCCESS,
      message: "Account created successfully!",
      data: undefined,
    };

    const result = parseSignUpResponse(mockResponse);

    expect(result.success).toBe(true);
    expect(result.message).toBe("Account created successfully!");
    expect(result.fieldErrors).toBeUndefined();
  });

  it("should use default message for success response when message is missing", () => {
    const mockResponse: BaseResponseModel<void> = {
      status: API_STATUS.SUCCESS,
      message: "",
      data: undefined,
    };

    const result = parseSignUpResponse(mockResponse);

    expect(result.success).toBe(true);
    expect(result.message).toBe(
      "Account created successfully! Please check your email for verification."
    );
  });

  it("should parse error response correctly", () => {
    const mockResponse: BaseResponseModel<void> = {
      status: API_STATUS.ERROR,
      message: "Registration failed",
      data: undefined,
      errors: {
        email: "Email already exists",
        username: "Username already taken",
      },
    };

    const result = parseSignUpResponse(mockResponse);

    expect(result.success).toBe(false);
    expect(result.message).toBe("Registration failed");
    expect(result.fieldErrors).toEqual({
      email: "Email already exists",
      username: "Username already taken",
    });
  });

  it("should handle unknown response format", () => {
    const mockResponse = {
      unknown: "format",
    } as unknown;

    const result = parseSignUpResponse(mockResponse);

    expect(result.success).toBe(false);
    expect(result.message).toBe("Unknown response format");
  });
});

describe("convertFieldErrorsToFormErrors", () => {
  it("should convert field errors to form errors format", () => {
    const mockResponse: BaseResponseModel<void> = {
      status: API_STATUS.ERROR,
      message: "Registration failed",
      data: undefined,
      errors: {
        email: "Email already exists",
        username: "Username already taken",
      },
    };

    const formErrors = convertFieldErrorsToFormErrors(mockResponse);

    expect(formErrors).toEqual({
      email: { type: "manual", message: "Email already exists" },
      username: { type: "manual", message: "Username already taken" },
    });
  });

  it("should return empty object when no errors exist", () => {
    const mockResponse: BaseResponseModel<void> = {
      status: API_STATUS.SUCCESS,
      message: "Success",
      data: undefined,
    };

    const formErrors = convertFieldErrorsToFormErrors(mockResponse);

    expect(formErrors).toEqual({});
  });
});

describe("mapBackendFieldsToFormFields", () => {
  it("should map backend field names to form field names", () => {
    const backendErrors = {
      first_name: "First name is required",
      last_name: "Last name is required",
      email: "Email is invalid",
      username: "Username is taken",
    };

    const mappedErrors = mapBackendFieldsToFormFields(backendErrors);

    expect(mappedErrors).toEqual({
      firstName: "First name is required",
      lastName: "Last name is required",
      email: "Email is invalid",
      username: "Username is taken",
    });
  });

  it("should keep original field names when no mapping is needed", () => {
    const backendErrors = {
      email: "Email is invalid",
      username: "Username is taken",
      password: "Password is too weak",
    };

    const mappedErrors = mapBackendFieldsToFormFields(backendErrors);

    expect(mappedErrors).toEqual({
      email: "Email is invalid",
      username: "Username is taken",
      password: "Password is too weak",
    });
  });
});

describe("getSignUpErrorMessage", () => {
  it("should return empty string for non-error response", () => {
    const mockResponse: BaseResponseModel<void> = {
      status: API_STATUS.SUCCESS,
      message: "Success",
      data: undefined,
    };

    expect(getSignUpErrorMessage(mockResponse)).toBe("");
  });

  it("should return backend message when available", () => {
    const mockResponse: BaseResponseModel<void> = {
      status: API_STATUS.ERROR,
      message: "Custom error message",
      data: undefined,
    };

    expect(getSignUpErrorMessage(mockResponse)).toBe("Custom error message");
  });

  it("should use translation for common errors when backend message matches", () => {
    const mockResponse: BaseResponseModel<void> = {
      status: API_STATUS.ERROR,
      message: "Email already registered",
      data: undefined,
    };

    expect(getSignUpErrorMessage(mockResponse)).toBe(
      "This email address is already registered"
    );
  });

  it("should use fallback message when no specific error is provided", () => {
    const mockResponse: BaseResponseModel<void> = {
      status: API_STATUS.ERROR,
      message: "",
      data: undefined,
    };

    expect(getSignUpErrorMessage(mockResponse)).toBe(
      "Registration failed. Please try again."
    );
  });
});

// Test for logSignUpAttempt function - just ensure it doesn't throw errors
describe("logSignUpAttempt", () => {
  beforeEach(() => {
    // Mock console methods
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should log success response without error", () => {
    const mockResponse: BaseResponseModel<void> = {
      status: API_STATUS.SUCCESS,
      message: "Success",
      data: undefined,
    };

    expect(() =>
      logSignUpAttempt("test@example.com", mockResponse)
    ).not.toThrow();
  });

  it("should log error response without error", () => {
    const mockResponse: BaseResponseModel<void> = {
      status: API_STATUS.ERROR,
      message: "Error",
      data: undefined,
      errors: { email: "Invalid email" },
    };

    expect(() =>
      logSignUpAttempt("test@example.com", mockResponse)
    ).not.toThrow();
  });

  it("should log unknown response without error", () => {
    const mockResponse = {
      unknown: "format",
    } as unknown;

    expect(() =>
      logSignUpAttempt("test@example.com", mockResponse)
    ).not.toThrow();
  });
});
