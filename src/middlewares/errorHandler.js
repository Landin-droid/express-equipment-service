import { logger } from "../config/logger.js";
import { AppError } from "../errors/AppError.js";

export function errorHandler(err, req, res, next) {
  const isKnownError = err instanceof AppError;
  const statusCode = isKnownError ? err.statusCode : 500;
  const code = isKnownError ? err.code : "INTERNAL_ERROR";

  const exposeDetails = process.env.NODE_ENV === "development";
  const message =
    isKnownError || !exposeDetails ? err.message : "Внутренняя ошибка сервера";

  if (!isKnownError) {
    logger.error({ requestId: req.requestId, ip: req.ip, err }, "Unexpected error");
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
