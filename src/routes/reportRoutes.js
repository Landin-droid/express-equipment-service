import { Router } from "express";
import reportController from "../controllers/reportController.js";
import { validate } from "../middlewares/validate.js";
import { equipmentLoadQuerySchema } from "../validators/reportValidators.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

router.get(
  "/equipment-load",
  authenticate,
  validate({ query: equipmentLoadQuerySchema }),
  reportController.getEquipmentLoad,
);

export default router;