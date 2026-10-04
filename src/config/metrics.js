import client from "prom-client";

client.collectDefaultMetrics();

export const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Общее количество HTTP-запросов",
  labelNames: ["method", "route", "status_code"],
});

export const httpRequestDurationSeconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Длительность обработки HTTP-запроса в секундах",
  labelNames: ["method", "route", "status_code"],
  // Границы подобраны под API, чтобы охватить
  // большинство случаев, включая редкие медленные запросы.
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

export const register = client.register;
