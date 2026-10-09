import authService from "../services/authService.js";

const isDevelopment = process.env.NODE_ENV === "development";

function setRefreshCookie(res, token) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: !isDevelopment,
    sameSite: "strict",
    maxAge:
      (Number(process.env.REFRESH_TOKEN_TTL_DAYS) || 7) * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });
}

async function register(req, res) {
  const user = await authService.register(req.valid.body);
  res.status(201).json(user);
}

async function login(req, res) {
  const { accessToken, refreshToken, user } = await authService.login(
    req.valid.body,
  );
  setRefreshCookie(res, refreshToken);
  res.status(200).json({ accessToken, user });
}

async function refresh(req, res) {
  const { accessToken, refreshToken } = await authService.refresh(
    req.cookies?.refreshToken,
  );
  setRefreshCookie(res, refreshToken);
  res.status(200).json({ accessToken });
}

async function logout(req, res) {
  await authService.logout(req.cookies?.refreshToken);
  res.clearCookie("refreshToken", { path: "/api/auth" });
  res.status(204).send();
}

async function me(req, res) {
  const user = await authService.getMe(req.user.id);
  res.status(200).json(user);
}

export default { register, login, refresh, logout, me };
