import tokenService from "../services/auth/tokenService.js";
import { UnauthorizedError } from "../errors/UnauthorizedError.js";
import { ForbiddenError } from "../errors/ForbiddenError.js";

export function authenticate(req, res, next) {
  const header = req.get("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    throw new UnauthorizedError("Требуется access-токен");
  }

  try {
    const payload = tokenService.verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      role: payload.role,
      technicianId: payload.technicianId,
    };
    next();
  } catch {
    throw new UnauthorizedError("Access-токен недействителен или истёк");
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError();
    }
    next();
  };
}
