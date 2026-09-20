import { NotFoundError } from "../errors/NotFoundError.js";

export function notFoundHandler(req, res, next) {
  next(new NotFoundError(`Маршрут ${req.method} ${req.originalUrl} не найден`));
}
