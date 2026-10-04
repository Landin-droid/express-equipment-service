import { Router } from "express";
import equipmentController from "../controllers/equipmentController.js";
import { validate } from "../middlewares/validate.js";
import {
  createEquipmentSchema,
  updateEquipmentSchema,
  listEquipmentQuerySchema,
  idParamSchema,
} from "../validators/equipmentValidators.js";
import { authenticate, requireRole } from "../middlewares/auth.js";

const router = Router();

router.get(
  "/",
  authenticate,
  validate({ query: listEquipmentQuerySchema }),
  equipmentController.list,
);
router.post(
  "/",
  authenticate,
  requireRole("admin"),
  validate({ body: createEquipmentSchema }),
  equipmentController.create,
);
router.get(
  "/:id",
  authenticate,
  validate({ params: idParamSchema }),
  equipmentController.getById,
);
router.patch(
  "/:id",
  authenticate,
  requireRole("admin"),
  validate({ params: idParamSchema, body: updateEquipmentSchema }),
  equipmentController.update,
);
router.delete(
  "/:id",
  authenticate,
  requireRole("admin"),
  validate({ params: idParamSchema }),
  equipmentController.remove,
);
router.get(
  "/:id/requests",
  authenticate,
  validate({ params: idParamSchema }),
  equipmentController.getRequests,
);
router.get(
  "/:id/weather",
  authenticate,
  validate({ params: idParamSchema }),
  equipmentController.getWeather,
);

export default router;
