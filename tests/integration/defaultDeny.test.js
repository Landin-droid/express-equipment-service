import request from "supertest";
import app from "../../src/app.js";

const ID = "00000000-0000-4000-8000-000000000000";

const protectedEndpoints = [
  ["get", "/api/equipment"],
  ["post", "/api/equipment"],
  ["get", `/api/equipment/${ID}`],
  ["patch", `/api/equipment/${ID}`],
  ["delete", `/api/equipment/${ID}`],
  ["get", `/api/equipment/${ID}/requests`],
  ["get", `/api/equipment/${ID}/weather`],
  ["get", "/api/requests"],
  ["post", "/api/requests"],
  ["post", "/api/requests/bulk"],
  ["get", `/api/requests/${ID}`],
  ["patch", `/api/requests/${ID}`],
  ["delete", `/api/requests/${ID}`],
  ["patch", `/api/requests/${ID}/status`],
  ["get", `/api/requests/${ID}/history`],
  ["post", `/api/requests/${ID}/assignees`],
  ["delete", `/api/requests/${ID}/assignees/${ID}`],
  ["get", `/api/sites/${ID}/summary`],
  ["get", "/api/reports/equipment-load"],
  ["get", "/api/auth/me"],
];

describe("default-deny: every non-public endpoint requires a token", () => {
  it.each(protectedEndpoints)(
    "%s %s -> 401 without token",
    async (method, path) => {
      const res = await request(app)[method](path);
      expect(res.status).toBe(401);
    },
  );

  it.each(["/api/health/live", "/api/health/ready", "/api/docs/"])(
    "public %s is reachable",
    async (path) => {
      const res = await request(app).get(path);
      expect(res.status).not.toBe(401);
    },
  );
});
