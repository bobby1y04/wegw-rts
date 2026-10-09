import { NextResponse } from "next/server";
import { ZodError } from "zod";

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: unknown,
) {
  return NextResponse.json<ApiErrorBody>(
    { error: { code, message, ...(details === undefined ? {} : { details }) } },
    { status },
  );
}

export function validationError(error: ZodError) {
  return apiError(
    "VALIDATION_ERROR",
    "Bitte prüfe deine Eingaben.",
    400,
    error.flatten(),
  );
}
