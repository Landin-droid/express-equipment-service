// Временная реализация. В ветке feat/validation-errors будет заменена на
// NotFoundError/ValidationError/ConflictError, наследующие от этого класса.
export class HttpError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
