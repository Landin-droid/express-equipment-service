import {
  httpRequestsTotal,
  httpRequestDurationSeconds,
} from "../config/metrics.js";

export function metricsMiddleware(req, res, next) {
  const endTimer = httpRequestDurationSeconds.startTimer();

  res.on("finish", () => {
    // req.route?.path даёт шаблон пути (/api/equipment/:id), а не req.path
    // с реальным id — иначе у каждой карточки оборудования была бы своя
    // уникальная метрика, и кардинальность лейблов росла бы неограниченно.
    const route = req.route?.path
      ? `${req.baseUrl}${req.route.path}`
      : "unmatched";
    const labels = { method: req.method, route, status_code: res.statusCode };

    httpRequestsTotal.inc(labels);
    endTimer(labels);
  });

  next();
}
