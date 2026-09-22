import { UnauthorizedError } from "../errors/UnauthorizedError.js";

export function apiKeyAuth(req, res, next) {
  const expectedKey = process.env.API_KEY;

  const providedKey = req.get("X-API-Key");

  if (!providedKey || providedKey !== expectedKey) {
    throw new UnauthorizedError();
  }

  next();
}
