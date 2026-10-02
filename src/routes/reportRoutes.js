import { Router } from "express";
import reportController from "../controllers/reportController.js";
import { validate } from "../middlewares/validate.js";
import { equipmentLoadQuerySchema } from "../validators/reportValidators.js";

const router = Router();

router.get(
  "/equipment-load",
  validate({ query: equipmentLoadQuerySchema }),
  reportController.getEquipmentLoad,
);

export default router;