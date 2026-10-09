import {
  httpRequestsTotal,
  httpRequestDurationSeconds,
} from "../config/metrics.js";

export function metricsMiddleware(req, res, next) {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1e9;
    const route = req.route?.path
      ? `${req.baseUrl}${req.route.path}`
      : "unmatched";
    const labels = { method: req.method, route, status_code: res.statusCode };

    httpRequestsTotal.inc(labels);
    // requestId = идентификатор из Nginx: он попадёт в exemplar и будет виден на графике
    httpRequestDurationSeconds.observe({
      labels,
      value: durationSeconds,
      exemplarLabels: { requestId: req.requestId },
    });
  });

  next();
}
