import "dotenv/config";
import app from "./app.js";
import { sequelize } from "./database/sequelize.js";
import { logger } from "./config/logger.js";

const PORT = process.env.PORT || 3000;
let shuttingDown = false;

async function waitForDatabase() {
  for (let attempt = 1; !shuttingDown; attempt += 1) {
    try {
      await sequelize.authenticate();
      logger.info({ attempt }, "Database connection established");
      return;
    } catch (err) {
      logger.warn(
        { attempt, error: err.message },
        "Database is not available yet, retrying",
      );
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(2000 * attempt, 10_000)),
      );
    }
  }
}

function start() {
  const server = app.listen(PORT, () => {
    logger.info({port: PORT}, "Server running");
  });
  waitForDatabase();

  const shutdown = (signal) => {
    shuttingDown = true;
    logger.info({signal}, "Shutting down gracefully");
    server.close(async () => {
      await sequelize.close();
      logger.info("Database connection closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start();
