import {
  jest,
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
} from "@jest/globals";
import request from "supertest";
import app from "../src/app.js";

function mockOpenMeteoResponse() {
  return {
    ok: true,
    json: async () => ({
      daily: {
        time: ["2026-09-21"],
        temperature_2m_max: [15],
        temperature_2m_min: [8],
        precipitation_sum: [0],
        wind_speed_10m_max: [10],
      },
    }),
  };
}

describe("GET /api/equipment/:id/weather", () => {
  let equipmentId;
  let fetchSpy;

  beforeAll(async () => {
    const res = await request(app)
      .post("/api/equipment")
      .send({
        name: "Weather Test Equipment",
        type: "sensor",
        serialNumber: `SN-WEATHER-${Date.now()}`,
        location: { lat: 60.1, lon: 24.9 },
        status: "operational",
        installedAt: "2024-01-01",
      });
    equipmentId = res.body.id;
  });

  beforeEach(() => {
    fetchSpy = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(mockOpenMeteoResponse());
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("returns forecast with suitableForOutdoorWork when weather API succeeds", async () => {
    const res = await request(app).get(`/api/equipment/${equipmentId}/weather`);

    expect(res.status).toBe(200);
    expect(res.body.forecast[0]).toEqual(
      expect.objectContaining({ suitableForOutdoorWork: true }),
    );
  });

  it("returns 503 when weather API is unavailable, service does not crash", async () => {
    fetchSpy.mockRejectedValue(new Error("network down"));

    const res = await request(app).get(`/api/equipment/${equipmentId}/weather`);

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("WEATHER_UNAVAILABLE");
  });
});
