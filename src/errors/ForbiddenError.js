import { AppError } from "./AppError.js";

export class ForbiddenError extends AppError {
  constructor(message = "Недостаточно прав для выполнения операции") {
    super("FORBIDDEN", message, 403);
  }
}
