import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import request from "supertest";
import app from "../src/app.js";
import { resetDb } from "./helpers/resetDB.js";
import { createUserWithToken } from "./helpers/authFixtures.js";

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
  let accessToken;

  beforeEach(async () => {
    await resetDb();
    accessToken = (await createUserWithToken("admin")).accessToken;

    const res = await request(app)
      .post("/api/equipment")
      .set("Authorization", "Bearer " + accessToken)
      .send({
        name: "Weather Test Equipment",
        type: "sensor",
        serialNumber: "SN-WEATHER-" + Date.now(),
        location: { lat: 60.1, lon: 24.9 },
        status: "operational",
        installedAt: "2024-01-01",
      });

    equipmentId = res.body.id;
    fetchSpy = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(mockOpenMeteoResponse());
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("returns forecast with suitableForOutdoorWork when weather API succeeds", async () => {
    const res = await request(app)
      .get("/api/equipment/" + equipmentId + "/weather")
      .set("Authorization", "Bearer " + accessToken);

    expect(res.status).toBe(200);
    expect(res.body.forecast[0]).toEqual(
      expect.objectContaining({ suitableForOutdoorWork: true }),
    );
  });

  it("returns 503 when weather API is unavailable, service does not crash", async () => {
    fetchSpy.mockRejectedValue(new Error("network down"));

    const res = await request(app)
      .get("/api/equipment/" + equipmentId + "/weather")
      .set("Authorization", "Bearer " + accessToken);

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("WEATHER_UNAVAILABLE");
  });
});
