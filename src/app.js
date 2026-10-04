import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { requestId } from "./middlewares/requestId.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { corsOptions } from "./config/corsConfig.js";
import { apiRateLimiter } from "./config/rateLimitConfig.js";
import { metricsMiddleware } from "./middlewares/metrics.js";
import { logger } from "./config/logger.js";
import healthController from "./controllers/healthController.js";
import equipmentRoutes from "./routes/equipmentRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import siteRoutes from "./routes/siteRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import metricsRoutes from "./routes/metricsRoutes.js";
import { sequelize } from "./database/sequelize.js";

const app = express();

app.use(requestId);

app.use(helmet());
app.use(cookieParser());

app.use(cors(corsOptions));

app.use(requestLogger);

app.use(metricsMiddleware);

app.use(express.json({ limit: "100kb" }));

app.use(express.static("public"));

app.get("/api/health", healthController.ready);
app.use("/api/health", healthRoutes);
app.use("/metrics", metricsRoutes);

app.use("/api", apiRateLimiter);

app.use("/api/equipment", equipmentRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/sites", siteRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/auth", authRoutes);

app.use(notFoundHandler);

app.use(errorHandler);

export default app;
