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
import healthController from "./controllers/healthController.js";
import equipmentRoutes from "./routes/equipmentRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import siteRoutes from "./routes/siteRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import metricsRoutes from "./routes/metricsRoutes.js";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import * as yaml from "js-yaml";
import { authenticate } from "./middlewares/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const openapiPath = path.resolve(__dirname, "../docs/openapi.yaml");
const openapiDocument = yaml.load(readFileSync(openapiPath, "utf-8"));

const app = express();
app.set("trust proxy", 1);

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
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

app.use("/api", apiRateLimiter);

app.use("/api/auth", authRoutes);

app.use("/api", authenticate);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/sites", siteRoutes);
app.use("/api/reports", reportRoutes);


app.use(notFoundHandler);

app.use(errorHandler);

export default app;
