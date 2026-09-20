import { AppError } from "./AppError.js";

export class ConflictError extends AppError {
  constructor(message, code = "CONFLICT") {
    super(code, message, 409);
  }
}
