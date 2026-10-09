import request from "supertest";
import { jest } from "@jest/globals";
import app from "../src/app.js";
import { sequelize } from "../src/database/sequelize.js";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("health endpoints", () => {
  it("GET /api/health/live returns 200 without checking the database", async () => {
    const authenticate = jest
      .spyOn(sequelize, "authenticate")
      .mockRejectedValue(new Error("database unavailable"));

    const res = await request(app).get("/api/health/live");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(authenticate).not.toHaveBeenCalled();
  });

  it("GET /api/health/ready returns 503 when the database is unavailable", async () => {
    jest
      .spyOn(sequelize, "authenticate")
      .mockRejectedValue(new Error("database unavailable"));

    const res = await request(app).get("/api/health/ready");

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: "degraded", database: "down" });
  });

  it("GET /api/health/ready returns 200 when the database is available", async () => {
    jest.spyOn(sequelize, "authenticate").mockResolvedValue();

    const res = await request(app).get("/api/health/ready");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", database: "up" });
  });
});
