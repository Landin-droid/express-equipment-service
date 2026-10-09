import request from "supertest";
import app from "../src/app.js";
import { resetDb } from "./helpers/resetDB.js";
import { createUserWithToken, createTechnicianUser } from "./helpers/authFixtures.js";

function buildEquipmentPayload(overrides = {}) {
  return {
    name: "Equipment Load Report",
    type: "sensor",
    serialNumber: `SN-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    location: { lat: 60.1, lon: 24.9 },
    status: "operational",
    installedAt: "2024-01-01",
    ...overrides,
  };
}

describe("Equipment load report", () => {
  let adminToken;
  let technician;

  beforeEach(async () => {
    await resetDb();
    adminToken = (await createUserWithToken("admin")).accessToken;
    technician = await createTechnicianUser();
  });

  async function createEquipment() {
    const equipRes = await request(app)
      .post("/api/equipment")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(buildEquipmentPayload());
    expect(equipRes.status).toBe(201);
    return equipRes.body.id;
  }

  async function createRequest(equipmentId, { title, plannedHours = 3, status = "new" } = {}) {
    const requestRes = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ equipmentId, title, priority: "medium" });

    expect(requestRes.status).toBe(201);

    const assignRes = await request(app)
      .post(`/api/requests/${requestRes.body.id}/assignees`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        assignees: [{
          technicianId: technician.user.technicianId,
          role: "lead",
          plannedHours,
        }],
      });

    expect(assignRes.status).toBe(200);

    if (status === "done") {
      const inProgressRes = await request(app)
        .patch(`/api/requests/${requestRes.body.id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "in_progress" });
      expect(inProgressRes.status).toBe(200);

      const doneRes = await request(app)
        .patch(`/api/requests/${requestRes.body.id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "done" });
      expect(doneRes.status).toBe(200);
    }

    return requestRes.body;
  }

  it("requires authentication", async () => {
    const response = await request(app).get("/api/reports/equipment-load");
    expect(response.status).toBe(401);
  });

  it("aggregates request counts, planned hours, and last service time", async () => {
    const equipmentId = await createEquipment();
    await createRequest(equipmentId, {
      title: "Closed report request",
      plannedHours: 2.5,
      status: "done",
    });
    await createRequest(equipmentId, {
      title: "Open report request",
      plannedHours: 5,
      status: "new",
    });

    const response = await request(app)
    .get(
      "/api/reports/equipment-load?minRequests=2&sort=plannedHours&direction=DESC",
    )
    .set("Authorization", `Bearer ${adminToken}`)

    expect(response.status).toBe(200);
    const row = response.body.data.find((item) => item.equipmentId === equipmentId);
    expect(row).toEqual(
      expect.objectContaining({
        equipmentName: "Equipment Load Report",
        requestCount: 2,
        closedRequestCount: 1,
        plannedHours: 7.5,
      }),
    );
    expect(row.lastServiceAt).toEqual(expect.any(String));
    expect(response.body.meta).toEqual(
      expect.objectContaining({ limit: 50, offset: 0 }),
    );
  });

  it("filters equipment-load report by date range", async () => {
    const equipmentId = await createEquipment();
    await createRequest(equipmentId, {
      title: "Filter request",
      plannedHours: 3,
      status: "new",
    });

    const response = await request(app)
    .get(
      "/api/reports/equipment-load?dateFrom=2099-01-01T00:00:00.000Z&minRequests=1",
    )
    .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.some((item) => item.equipmentId === equipmentId)).toBe(false);
  });

  it.each([
    "limit=0",
    "limit=101",
    "offset=-1",
    "minRequests=-1",
    "sort=requestCount%3BDROP%20TABLE%20equipment",
    "direction=SIDEWAYS",
  ])("rejects invalid query parameter: %s", async (query) => {
    const response = await request(app)
    .get(`/api/reports/equipment-load?${query}`)
    .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
