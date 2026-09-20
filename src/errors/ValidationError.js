import { AppError } from "./AppError.js";

export class ValidationError extends AppError {
  constructor(zodError) {
    const details = zodError.issues.map((issue) => ({
      field: issue.path.join(".") || "(root)",
      message: issue.message,
    }));
    super("VALIDATION_ERROR", "Некорректные данные запроса", 422, details);
  }
}
