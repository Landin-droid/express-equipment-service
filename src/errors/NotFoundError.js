import { AppError } from "./AppError.js";

export class NotFoundError extends AppError {
  constructor(message) {
    super("NOT_FOUND", message, 404);
  }
}
