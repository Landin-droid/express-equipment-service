import { AppError } from "./AppError.js";

export class ConflictError extends AppError {
  constructor(message) {
    super("CONFLICT", message, 409);
  }
}
