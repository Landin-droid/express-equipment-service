import { Router } from "express";
import requestController from "../controllers/requestController.js";

const router = Router();

router.get("/", requestController.list);
router.post("/", requestController.create);
router.get("/:id", requestController.getById);
router.patch("/:id", requestController.update);
router.patch("/:id/status", requestController.changeStatus);
router.delete("/:id", requestController.remove);

export default router;
