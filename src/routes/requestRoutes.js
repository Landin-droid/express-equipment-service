import { Router } from "express";
import requestController from "../controllers/requestController.js";
import { validate } from "../middlewares/validate.js";
import {
  createRequestSchema,
  bulkCreateRequestSchema,
  updateRequestSchema,
  changeStatusSchema,
  listRequestsQuerySchema,
} from "../validators/requestValidators.js";
import { idParamSchema } from "../validators/equipmentValidators.js";
import {
  replaceAssigneesSchema,
  assigneeParamsSchema,
} from "../validators/requestValidators.js";
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
router.post(
  "/bulk",
  apiKeyAuth,
  validate({ body: bulkCreateRequestSchema }),
  requestController.bulkCreate,
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
  "/:id/assignees",
  apiKeyAuth,
  validate({ params: idParamSchema, body: replaceAssigneesSchema }),
  requestController.replaceAssignees,
);
router.delete(
  "/:id/assignees/:userId",
  apiKeyAuth,
  validate({ params: assigneeParamsSchema }),
  requestController.removeAssignee,
);
router.get(
  "/:id/history",
  validate({ params: idParamSchema }),
  requestController.getHistory,
);

export default router;
