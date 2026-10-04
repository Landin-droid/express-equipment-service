import { Router } from "express";
import authController from "../controllers/authController.js";
import { validate } from "../middlewares/validate.js";
import { authenticate } from "../middlewares/auth.js";
import { loginRateLimiter } from "../config/rateLimitConfig.js";
import { registerSchema, loginSchema } from "../validators/authValidators.js";

const router = Router();

router.post(
  "/register",
  validate({ body: registerSchema }),
  authController.register,
);
router.post(
  "/login",
  loginRateLimiter,
  validate({ body: loginSchema }),
  authController.login,
);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", authenticate, authController.me);

export default router;
