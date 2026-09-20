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
  validate({ query: listEquipmentQuerySchema }),
  equipmentController.list,
);
router.post(
  "/",
  validate({ body: createEquipmentSchema }),
  equipmentController.create,
);
router.get(
  "/:id",
  validate({ params: idParamSchema }),
  equipmentController.getById,
);
router.patch(
  "/:id",
  validate({ params: idParamSchema, body: updateEquipmentSchema }),
  equipmentController.update,
);
router.delete(
  "/:id",
  validate({ params: idParamSchema }),
  equipmentController.remove,
);
router.get(
  "/:id/requests",
  validate({ params: idParamSchema }),
  equipmentController.getRequests,
);
router.get(
  "/:id/weather",
  validate({ params: idParamSchema }),
  equipmentController.getWeather,
);

export default router;
