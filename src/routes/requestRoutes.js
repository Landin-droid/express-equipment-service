import { Router } from "express";
import requestController from "../controllers/requestController.js";
import { validate } from "../middlewares/validate.js";
import {
  createRequestSchema,
  updateRequestSchema,
  changeStatusSchema,
  listRequestsQuerySchema,
} from "../validators/requestValidators.js";
import { idParamSchema } from "../validators/equipmentValidators.js";

const router = Router();

router.get(
  "/",
  validate(listRequestsQuerySchema, "query"),
  requestController.list,
);
router.post(
  "/",
  validate(createRequestSchema, "body"),
  requestController.create,
);
router.get(
  "/:id",
  validate(idParamSchema, "params"),
  requestController.getById,
);
router.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateRequestSchema, "body"),
  requestController.update,
);
router.patch(
  "/:id/status",
  validate(idParamSchema, "params"),
  validate(changeStatusSchema, "body"),
  requestController.changeStatus,
);
router.delete(
  "/:id",
  validate(idParamSchema, "params"),
  requestController.remove,
);

export default router;
