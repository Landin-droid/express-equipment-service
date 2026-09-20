import { Router } from "express";
import equipmentController from "../controllers/equipmentController.js";
import { validate } from "../middlewares/validate.js";
import {
  createEquipmentSchema,
  updateEquipmentSchema,
  listEquipmentQuerySchema,
  idParamSchema,
} from "../validators/equipmentValidators.js";

const router = Router();

router.get(
  "/",
  validate(listEquipmentQuerySchema, "query"),
  equipmentController.list,
);
router.post(
  "/",
  validate(createEquipmentSchema, "body"),
  equipmentController.create,
);
router.get(
  "/:id",
  validate(idParamSchema, "params"),
  equipmentController.getById,
);
router.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateEquipmentSchema, "body"),
  equipmentController.update,
);
router.delete(
  "/:id",
  validate(idParamSchema, "params"),
  equipmentController.remove,
);

router.get(
  "/:id/requests",
  validate(idParamSchema, "params"),
  equipmentController.getRequests,
);

router.get(
  "/:id/weather",
  validate(idParamSchema, "params"),
  equipmentController.getWeather,
);

export default router;
