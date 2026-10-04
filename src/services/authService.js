import bcrypt from "bcrypt";
import { User } from "../models/index.js";
import tokenService from "./auth/tokenService.js";
import { ConflictError } from "../errors/ConflictError.js";
import { UnauthorizedError } from "../errors/UnauthorizedError.js";

const SALT_ROUNDS = 12;
const INVALID_CREDENTIALS_MESSAGE = "Неверный email или пароль";

async function register({ email, password }) {
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new ConflictError("Пользователь с таким email уже существует");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ email, passwordHash, role: "viewer" });
  return { id: user.id, email: user.email, role: user.role };
}

async function login({ email, password }) {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
  }

  const accessToken = tokenService.signAccessToken(user);
  const refreshToken = await tokenService.issueRefreshToken(user.id);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, role: user.role },
  };
}

async function refresh(rawRefreshToken) {
  if (!rawRefreshToken) {
    throw new UnauthorizedError("Требуется refresh-токен");
  }

  const rotated = await tokenService.rotateRefreshToken(rawRefreshToken);
  if (!rotated) {
    throw new UnauthorizedError("Refresh-токен недействителен или истёк");
  }

  const user = await User.findByPk(rotated.userId);
  if (!user) {
    throw new UnauthorizedError("Пользователь не найден");
  }

  return {
    accessToken: tokenService.signAccessToken(user),
    refreshToken: rotated.rawToken,
  };
}

async function logout(rawRefreshToken) {
  if (rawRefreshToken) {
    await tokenService.revokeRefreshToken(rawRefreshToken);
  }
}

async function getMe(userId) {
  const user = await User.findByPk(userId, {
    attributes: ["id", "email", "role"],
  });
  if (!user) {
    throw new UnauthorizedError("Пользователь не найден");
  }
  return { id: user.id, email: user.email, role: user.role };
}

export default { register, login, refresh, logout, getMe };
