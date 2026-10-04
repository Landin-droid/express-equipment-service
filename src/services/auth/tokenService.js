import jwt from "jsonwebtoken";
import crypto from "crypto";
import { RefreshToken } from "../../models/index.js";

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS) || 7;

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, technicianId: user.technicianId },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL },
  );
}

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

// Refresh-токен — непрозрачная случайная строка, а не JWT: отзыв делается
// просто удалением/пометкой строки в БД, не нужен отдельный секрет на подпись,
// и скомпрометированный JWT-refresh нельзя было бы отозвать до истечения срока.
async function issueRefreshToken(userId) {
  const rawToken = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date(
    Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  await RefreshToken.create({
    userId,
    tokenHash: hashToken(rawToken),
    expiresAt,
  });
  return rawToken;
}

async function rotateRefreshToken(rawToken) {
  const tokenHash = hashToken(rawToken);
  const existing = await RefreshToken.findOne({ where: { tokenHash } });

  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    return null;
  }

  await existing.update({ revokedAt: new Date() });
  const newRawToken = await issueRefreshToken(existing.userId);
  return { userId: existing.userId, rawToken: newRawToken };
}

async function revokeRefreshToken(rawToken) {
  const tokenHash = hashToken(rawToken);
  await RefreshToken.update(
    { revokedAt: new Date() },
    { where: { tokenHash, revokedAt: null } },
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
}

export default {
  signAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  verifyAccessToken,
};
