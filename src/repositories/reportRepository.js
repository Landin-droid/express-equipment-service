import { sequelize } from "../database/sequelize.js";

const reportCtes = `
  WITH request_metrics AS (
    SELECT
      mr.equipment_id,
      COUNT(*)::int AS request_count,
      COUNT(*) FILTER (WHERE mr.status IN ('done', 'rejected'))::int
        AS closed_request_count,
      MAX(service.last_service_at) AS last_service_at
    FROM maintenance_requests mr
    LEFT JOIN (
      SELECT request_id, MAX(changed_at) AS last_service_at
      FROM request_status_history
      WHERE new_status = 'done'
      GROUP BY request_id
    ) service ON service.request_id = mr.id
    WHERE ($dateFrom::timestamptz IS NULL OR mr.created_at >= $dateFrom::timestamptz)
      AND ($dateTo::timestamptz IS NULL OR mr.created_at <= $dateTo::timestamptz)
    GROUP BY mr.equipment_id
  ), labor_metrics AS (
    SELECT mr.equipment_id, COALESCE(SUM(ra.planned_hours), 0) AS planned_hours
    FROM maintenance_requests mr
    LEFT JOIN request_assignees ra ON ra.request_id = mr.id
    WHERE ($dateFrom::timestamptz IS NULL OR mr.created_at >= $dateFrom::timestamptz)
      AND ($dateTo::timestamptz IS NULL OR mr.created_at <= $dateTo::timestamptz)
    GROUP BY mr.equipment_id
  )
`;

const sortColumns = {
  equipmentName: "e.name",
  requestCount: "request_metrics.request_count",
  closedRequestCount: "request_metrics.closed_request_count",
  plannedHours: "labor_metrics.planned_hours",
  lastServiceAt: "request_metrics.last_service_at",
};

async function getEquipmentLoad(query) {
  const { dateFrom, dateTo, minRequests, sort, direction, limit, offset } =
    query;
  const bind = {
    dateFrom: dateFrom ?? null,
    dateTo: dateTo ?? null,
    minRequests,
    limit,
    offset,
  };
  const equipmentJoins = `
    FROM equipment e
    LEFT JOIN request_metrics ON request_metrics.equipment_id = e.id
    LEFT JOIN labor_metrics ON labor_metrics.equipment_id = e.id
    WHERE COALESCE(request_metrics.request_count, 0) >= $minRequests
  `;

  const rows = await sequelize.query(
    `${reportCtes}
    SELECT
      e.id AS "equipmentId",
      e.name AS "equipmentName",
      e.serial_number AS "serialNumber",
      COALESCE(request_metrics.request_count, 0) AS "requestCount",
      COALESCE(request_metrics.closed_request_count, 0) AS "closedRequestCount",
      COALESCE(labor_metrics.planned_hours, 0) AS "plannedHours",
      request_metrics.last_service_at AS "lastServiceAt"
    ${equipmentJoins}
    ORDER BY ${sortColumns[sort]} ${direction} NULLS LAST, e.id ASC
    LIMIT $limit OFFSET $offset`,
    { bind, type: sequelize.QueryTypes.SELECT },
  );

  const [totalResult] = await sequelize.query(
    `${reportCtes}
    SELECT COUNT(*)::int AS total
    ${equipmentJoins}`,
    { bind, type: sequelize.QueryTypes.SELECT },
  );

  return {
    data: rows.map((row) => ({
      ...row,
      requestCount: Number(row.requestCount),
      closedRequestCount: Number(row.closedRequestCount),
      plannedHours: Number(row.plannedHours),
    })),
    total: Number(totalResult.total),
  };
}

export default { getEquipmentLoad };
