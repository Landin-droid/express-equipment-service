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
  validate({ query: listRequestsQuerySchema }),
  requestController.list,
);
router.post(
  "/",
  validate({ body: createRequestSchema }),
  requestController.create,
);
router.get(
  "/:id",
  validate({ params: idParamSchema }),
  requestController.getById,
);
router.patch(
  "/:id",
  validate({ params: idParamSchema, body: updateRequestSchema }),
  requestController.update,
);
router.patch(
  "/:id/status",
  validate({ params: idParamSchema, body: changeStatusSchema }),
  requestController.changeStatus,
);
router.delete(
  "/:id",
  validate({ params: idParamSchema }),
  requestController.remove,
);

export default router;
