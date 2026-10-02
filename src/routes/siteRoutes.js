import { Router } from "express";
import siteController from "../controllers/siteController.js";
import { validate } from "../middlewares/validate.js";
import { idParamSchema } from "../validators/siteValidators.js";

const router = Router();

router.get(
  "/:id/summary",
  validate({ params: idParamSchema }),
  siteController.getSummary,
);

export default router;
