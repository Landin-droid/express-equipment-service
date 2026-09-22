import { Router } from "express";
import requestController from "../controllers/requestController.js";
import { validate } from "../middlewares/validate.js";
import {
  createRequestSchema,
  updateRequestSchema,
  changeStatusSchema,
  listRequestsQuerySchema,
  bulkCreateRequestSchema,
} from "../validators/requestValidators.js";
import { idParamSchema } from "../validators/equipmentValidators.js";
import { apiKeyAuth } from "../middlewares/apiKeyAuth.js";

const router = Router();

router.get(
  "/",
  validate({ query: listRequestsQuerySchema }),
  requestController.list,
);
router.post(
  "/",
  apiKeyAuth,
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
  apiKeyAuth,
  validate({ params: idParamSchema, body: updateRequestSchema }),
  requestController.update,
);
router.patch(
  "/:id/status",
  apiKeyAuth,
  validate({ params: idParamSchema, body: changeStatusSchema }),
  requestController.changeStatus,
);
router.delete(
  "/:id",
  apiKeyAuth,
  validate({ params: idParamSchema }),
  requestController.remove,
);
router.post(
  "/bulk",
  apiKeyAuth,
  validate({ body: bulkCreateRequestSchema }),
  requestController.bulkCreate,
);

export default router;
