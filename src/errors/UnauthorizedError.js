import { AppError } from "./AppError.js";

export class UnauthorizedError extends AppError {
  constructor(message = "Требуется корректный API-ключ") {
    super("UNAUTHORIZED", message, 401);
  }
}
