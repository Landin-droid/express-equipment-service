import { randomUUID } from "crypto";

export function requestId(req, res, next) {
  req.requestId = randomUUID().slice(0, 8);
  res.setHeader("X-Request-Id", req.requestId);
  next();
}
