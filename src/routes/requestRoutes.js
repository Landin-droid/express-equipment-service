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
import { authenticate, requireRole } from "../middlewares/auth.js";

const router = Router();

router.get(
  "/",
  authenticate,
  validate({ query: listRequestsQuerySchema }),
  requestController.list,
);
router.post(
  "/",
  authenticate,
  requireRole("technician", "admin"),
  validate({ body: createRequestSchema }),
  requestController.create,
);
router.post(
  "/bulk",
  authenticate,
  requireRole("technician", "admin"),
  validate({ body: bulkCreateRequestSchema }),
  requestController.bulkCreate,
);
router.get(
  "/:id",
  authenticate,
  validate({ params: idParamSchema }),
  requestController.getById,
);
router.patch(
  "/:id",
  authenticate,
  requireRole("technician", "admin"),
  validate({ params: idParamSchema, body: updateRequestSchema }),
  requestController.update,
);
router.patch(
  "/:id/status",
  authenticate,
  requireRole("technician","admin"),
  validate({ params: idParamSchema, body: changeStatusSchema }),
  requestController.changeStatus,
);
router.delete(
  "/:id",
  authenticate,
  requireRole("admin"),
  validate({ params: idParamSchema }),
  requestController.remove,
);
router.post(
  "/:id/assignees",
  authenticate,
  requireRole("admin"),
  validate({ params: idParamSchema, body: replaceAssigneesSchema }),
  requestController.replaceAssignees,
);
router.delete(
  "/:id/assignees/:userId",
  authenticate,
  requireRole("admin"),
  validate({ params: assigneeParamsSchema }),
  requestController.removeAssignee,
);
router.get(
  "/:id/history",
  authenticate,
  validate({ params: idParamSchema }),
  requestController.getHistory,
);

export default router;
