import express from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import { requestId } from "./middlewares/requestId.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { corsOptions } from "./config/corsConfig.js";
import { apiRateLimiter } from "./config/rateLimitConfig.js";
import equipmentRoutes from "./routes/equipmentRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";

const app = express();

app.use(requestId);

app.use(helmet());

app.use(cors(corsOptions));

morgan.token("id", (req) => req.requestId);
app.use(morgan(":id :method :url :status :response-time ms"));

app.use(express.json({ limit: "100kb" }));

app.use(express.static("public"));

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", apiRateLimiter);

app.use("/api/equipment", equipmentRoutes);
app.use("/api/requests", requestRoutes);

app.use(notFoundHandler);

app.use(errorHandler);

export default app;
