import request from "supertest";
import app from "../src/app.js";
import { resetDb } from "./helpers/resetDB.js";
import { createUserWithToken, createTechnicianUser } from "./helpers/authFixtures.js";

function buildEquipmentPayload(overrides = {}) {
  return {
    name: "Test Equipment",
    type: "sensor",
    serialNumber: `SN-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    location: { lat: 60.1, lon: 24.9 },
    status: "operational",
    installedAt: "2024-01-01",
    ...overrides,
  };
}

describe("Equipment CRUD", () => {
  let adminToken;

  beforeEach(async () => {
    await resetDb();
    adminToken = (await createUserWithToken("admin")).accessToken;
  });

  async function createEquipment(token = adminToken, payload = {}) {
    const res = await request(app)
      .post("/api/equipment")
      .set("Authorization", `Bearer ${token}`)
      .send(buildEquipmentPayload(payload));
    expect(res.status).toBe(201);
    return res;
  }

  it("POST /api/equipment creates equipment for admin", async () => {
    const res = await createEquipment();

    expect(res.status).toBe(201);
    expect(res.headers.location).toBe(`/api/equipment/${res.body.id}`);
    expect(res.body.id).toEqual(expect.any(String));
    expect(res.body.status).toBe("operational");
  });

  it("POST /api/equipment rejects requests without a valid token", async () => {
    const res = await request(app).post("/api/equipment").send(buildEquipmentPayload());

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("POST /api/equipment with duplicate serialNumber returns 409", async () => {
    const payload = buildEquipmentPayload();

    const firstRes = await request(app)
      .post("/api/equipment")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);
    expect(firstRes.status).toBe(201);

    const res = await request(app)
      .post("/api/equipment")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("POST /api/equipment validates required fields", async () => {
    const res = await request(app)
      .post("/api/equipment")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ type: "turbine" });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "name" })]),
    );
  });

  it("GET /api/equipment/:id returns equipment card", async () => {
    const created = await createEquipment();

    const res = await request(app)
      .get(`/api/equipment/${created.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
    expect(res.body.location).toEqual({ lat: 60.1, lon: 24.9 });
    expect(res.body.passport).toBeNull();
  });

  it("GET /api/equipment/:id invalid uuid returns 422", async () => {
    const res = await request(app)
      .get("/api/equipment/not-a-uuid")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(422);
  });

  it("GET /api/equipment returns paginated list with meta", async () => {
    await createEquipment();
    const res = await request(app)
      .get("/api/equipment?page=1&limit=10")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toEqual(
      expect.objectContaining({ total: expect.any(Number), page: 1, limit: 10 }),
    );
  });

  it("PATCH /api/equipment/:id updates equipment", async () => {
    const created = await createEquipment();

    const res = await request(app)
      .patch(`/api/equipment/${created.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "maintenance" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("maintenance");
    expect(res.body.id).toBe(created.body.id);
  });

  it("DELETE /api/equipment/:id is blocked while request is open", async () => {
    const created = await createEquipment();
    const technicianToken = (await createTechnicianUser()).accessToken;

    const requestRes = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${technicianToken}`)
      .send({
        equipmentId: created.body.id,
        title: "Open maintenance request",
        priority: "medium",
      });

    expect(requestRes.status).toBe(201);

    const res = await request(app)
      .delete(`/api/equipment/${created.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("DELETE /api/equipment/:id succeeds after all requests are closed", async () => {
    const created = await createEquipment();
    const techUser = await createTechnicianUser();

    const requestRes = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${techUser.accessToken}`)
      .send({
        equipmentId: created.body.id,
        title: "Closed maintenance request",
        priority: "high",
      });

    const assignRes = await request(app)
      .post(`/api/requests/${requestRes.body.id}/assignees`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        assignees: [{
          technicianId: techUser.user.technicianId,
          role: "lead",
          plannedHours: 4,
        }],
      });

    expect(assignRes.status).toBe(200);

    const inProgressRes = await request(app)
      .patch(`/api/requests/${requestRes.body.id}/status`)
      .set("Authorization", `Bearer ${techUser.accessToken}`)
      .send({ status: "in_progress" });
    expect(inProgressRes.status).toBe(200);

    const statusRes = await request(app)
      .patch(`/api/requests/${requestRes.body.id}/status`)
      .set("Authorization", `Bearer ${techUser.accessToken}`)
      .send({ status: "done" });

    expect(statusRes.status).toBe(200);

    const deleteRes = await request(app)
      .delete(`/api/equipment/${created.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(204);

    const getRes = await request(app)
      .get(`/api/equipment/${created.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(getRes.status).toBe(404);
  });
});
