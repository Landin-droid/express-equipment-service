import { Router } from "express";
import siteController from "../controllers/siteController.js";
import { validate } from "../middlewares/validate.js";
import { idParamSchema } from "../validators/siteValidators.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

router.get(
  "/:id/summary",
  authenticate,
  validate({ params: idParamSchema }),
  siteController.getSummary,
);

export default router;
