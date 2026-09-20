import { AppError } from "./AppError.js";

export class ValidationError extends AppError {
  constructor(message, details) {
    super("VALIDATION_ERROR", message, 422, details);
  }
}
