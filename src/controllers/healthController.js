import { sequelize } from "../database/sequelize.js";

// Liveness: процесс жив и обрабатывает запросы — без обращения к внешним
// зависимостям.
async function live(req, res) {
  res.status(200).json({ status: "ok" });
}

// Readiness: процесс жив, но ещё и готов обслуживать реальный трафик
async function ready(req, res) {
  try {
    await sequelize.authenticate();
    res.status(200).json({ status: "ok", database: "up" });
  } catch {
    res.status(503).json({ status: "degraded", database: "down" });
  }
}

export default { live, ready };
