import { AppError } from "./AppError.js";

export class ServiceUnavailableError extends AppError {
  constructor(code, message) {
    super(code, message, 503);
  }
}
