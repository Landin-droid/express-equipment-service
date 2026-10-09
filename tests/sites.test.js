import request from "supertest";
import app from "../src/app.js";
import { resetDb } from "./helpers/resetDB.js";
import { createUserWithToken } from "./helpers/authFixtures.js";
import { Site } from "../src/models/index.js";

describe("GET /api/sites/:id/summary", () => {
  let viewerToken;
  let adminToken;
  let site;

  beforeEach(async () => {
    await resetDb();
    viewerToken = (await createUserWithToken("viewer")).accessToken;
    adminToken = (await createUserWithToken("admin")).accessToken;
    site = await Site.create({
      name: "Summary Site",
      code: `S-${Date.now()}`,
      latitude: 60,
      longitude: 24,
    });
  });

  it("requires authentication", async () => {
    const res = await request(app).get(`/api/sites/${site.id}/summary`);
    expect(res.status).toBe(401);
  });

  it("returns empty summary for a site without requests", async () => {
    const res = await request(app)
      .get(`/api/sites/${site.id}/summary`)
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.requestsByStatus).toEqual({});
    expect(res.body.averageClosureHours).toBeNull();
  });

  it("counts requests by status and priority", async () => {
    const equipmentRes = await request(app)
      .post("/api/equipment")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Summary Equipment",
        type: "sensor",
        serialNumber: `SN-SUM-${Date.now()}`,
        siteId: site.id,
        status: "operational",
        installedAt: "2024-01-01",
      });
    expect(equipmentRes.status).toBe(201);

    const requestRes = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        equipmentId: equipmentRes.body.id,
        title: "Summary request",
        priority: "high",
      });
    expect(requestRes.status).toBe(201);

    const res = await request(app)
      .get(`/api/sites/${site.id}/summary`)
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.requestsByStatus).toEqual({ new: 1 });
    expect(res.body.requestsByPriority).toEqual({ high: 1 });
  });

  it("returns 404 for an unknown site", async () => {
    const res = await request(app)
      .get("/api/sites/00000000-0000-4000-8000-000000000000/summary")
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.status).toBe(404);
  });
});
