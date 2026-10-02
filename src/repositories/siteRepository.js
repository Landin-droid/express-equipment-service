import { fn, col } from "sequelize";
import { sequelize, Site, MaintenanceRequest } from "../models/index.js";

async function findById(id) {
  return Site.findByPk(id, {
    attributes: ["id", "name", "code", "region", "latitude", "longitude"],
  });
}

async function countByStatus(siteId) {
  const rows = await MaintenanceRequest.findAll({
    attributes: [
      [col("MaintenanceRequest.status"), "status"],
      [fn("COUNT", col("MaintenanceRequest.id")), "count"],
    ],
    include: [{ association: "equipment", attributes: [], where: { siteId } }],
    group: [col("MaintenanceRequest.status")],
    raw: true,
  });
  return Object.fromEntries(rows.map((r) => [r.status, Number(r.count)]));
}

async function countByPriority(siteId) {
  const rows = await MaintenanceRequest.findAll({
    attributes: [
      [col("MaintenanceRequest.priority"), "priority"],
      [fn("COUNT", col("MaintenanceRequest.id")), "count"],
    ],
    include: [{ association: "equipment", attributes: [], where: { siteId } }],
    group: [col("MaintenanceRequest.priority")],
    raw: true,
  });
  return Object.fromEntries(rows.map((r) => [r.priority, Number(r.count)]));
}

async function averageClosureHours(siteId) {
  const [result] = await sequelize.query(
    `
    SELECT AVG(EXTRACT(EPOCH FROM (rsh.changed_at - mr.created_at)) / 3600) AS avg_hours
    FROM maintenance_requests mr
    JOIN equipment e ON e.id = mr.equipment_id
    JOIN request_status_history rsh
      ON rsh.request_id = mr.id AND rsh.new_status IN ('done', 'rejected')
    WHERE e.site_id = $1
    `,
    { bind: [siteId], type: sequelize.QueryTypes.SELECT },
  );
  return result.avg_hours !== null ? Number(result.avg_hours) : null;
}

export default {
  findById,
  countByStatus,
  countByPriority,
  averageClosureHours,
};
