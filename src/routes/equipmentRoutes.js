import { Router } from "express";
import equipmentController from "../controllers/equipmentController.js";

const router = Router();

router.get("/", equipmentController.list);
router.post("/", equipmentController.create);
router.get("/:id", equipmentController.getById);
router.patch("/:id", equipmentController.update);
router.delete("/:id", equipmentController.remove);

// GET /api/equipment/:id/requests и /:id/weather будут добавлены в feat/requests-crud

export default router;
