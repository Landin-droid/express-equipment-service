import "dotenv/config";
import app from "./app.js";
import { sequelize } from "./database/sequelize.js";
import { logger } from "./config/logger.js";

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    logger.info("Database connection established");
  } catch (err) {
    logger.error({ err }, "Unable to connect to the database");
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    logger.info({port: PORT}, "Server running");
  });

  const shutdown = async (signal) => {
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
