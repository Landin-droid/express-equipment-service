import { randomUUID } from "crypto";

export function requestId(req, res, next) {
  // Если через заголовок X-Request-Id передан ID запроса, используется он
  req.requestId = req.get("X-Request-Id") || randomUUID().slice(0, 8);
  res.setHeader("X-Request-Id", req.requestId);
  next();
}
