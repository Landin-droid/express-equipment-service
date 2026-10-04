import { logger } from "../config/logger.js";
import { AppError } from "../errors/AppError.js";

export function errorHandler(err, req, res, next) {
  const isKnownError = err instanceof AppError;
  const statusCode = isKnownError ? err.statusCode : 500;
  const code = isKnownError ? err.code : "INTERNAL_ERROR";

  const isProduction = process.env.NODE_ENV === "production";
  const message =
    isKnownError || !isProduction ? err.message : "Внутренняя ошибка сервера";

  if (!isKnownError) {
    logger.error({ requestId: req.requestId, err }, "Unexpected error");
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(isKnownError && err.details ? { details: err.details } : {}),
      requestId: req.requestId,
    },
  });
}
