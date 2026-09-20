import express from "express";
import equipmentRoutes from "./routes/equipmentRoutes.js";

const app = express();

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/equipment", equipmentRoutes);

// Временный error handler. Будет заменён в feat/validation-errors
// на полноценный формат { error: { code, message, details, requestId } }.
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: {
      code: err.code || "INTERNAL_ERROR",
      message: err.message || "Внутренняя ошибка сервера",
    },
  });
});

export default app;
