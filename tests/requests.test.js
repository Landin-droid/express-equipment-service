import request from "supertest";
import app from "../src/app.js";
import { resetDb } from "./helpers/resetDB.js";
import { createUserWithToken, createTechnicianUser } from "./helpers/authFixtures.js";

function buildEquipmentPayload(overrides = {}) {
  return {
    name: "Request Equipment",
    type: "sensor",
    serialNumber: `SN-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    location: { lat: 60.1, lon: 24.9 },
    status: "operational",
    installedAt: "2024-01-01",
    ...overrides,
  };
}

describe("Maintenance Requests", () => {
  let adminToken;
  let technicianToken;
  let technicianId;

  beforeEach(async () => {
    await resetDb();
    adminToken = (await createUserWithToken("admin")).accessToken;
    const technician = await createTechnicianUser();
    technicianToken = technician.accessToken;
    technicianId = technician.user.technicianId;
  });

  async function createEquipment() {
    const res = await request(app)
      .post("/api/equipment")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(buildEquipmentPayload());
    expect(res.status).toBe(201);
    return res.body.id;
  }

  async function createRequest(equipmentId, overrides = {}) {
    const res = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${technicianToken}`)
      .send({
        equipmentId,
        title: "Maintenance request",
        priority: "medium",
        ...overrides,
      });
    expect(res.status).toBe(201);
    return res;
  }

  it('POST /api/requests creates a request with default status "new"', async () => {
    const equipmentId = await createEquipment();
    const res = await createRequest(equipmentId, {
      title: "Замена подшипника",
      priority: "high",
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("new");
  });

  it("PATCH /api/requests/:id/status allows assigned technician to move through valid transitions", async () => {
    const equipmentId = await createEquipment();
    const requestRes = await createRequest(equipmentId, { title: "Assigned request" });

    const assignRes = await request(app)
      .post(`/api/requests/${requestRes.body.id}/assignees`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        assignees: [{ technicianId, role: "lead", plannedHours: 4 }],
      });

    expect(assignRes.status).toBe(200);

    const inProgressRes = await request(app)
      .patch(`/api/requests/${requestRes.body.id}/status`)
      .set("Authorization", `Bearer ${technicianToken}`)
      .send({ status: "in_progress" });

    expect(inProgressRes.status).toBe(200);
    expect(inProgressRes.body.status).toBe("in_progress");

    const doneRes = await request(app)
      .patch(`/api/requests/${requestRes.body.id}/status`)
      .set("Authorization", `Bearer ${technicianToken}`)
      .send({ status: "done" });

    expect(doneRes.status).toBe(200);
    expect(doneRes.body.status).toBe("done");
  });

  it("PATCH /api/requests/:id/status rejects invalid transition", async () => {
    const equipmentId = await createEquipment();
    const requestRes = await createRequest(equipmentId, {
      title: "Invalid transition request",
    });

    const assignRes = await request(app)
      .post(`/api/requests/${requestRes.body.id}/assignees`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        assignees: [{ technicianId, role: "lead", plannedHours: 4 }],
      });

    expect(assignRes.status).toBe(200);

    const inProgressRes = await request(app)
      .patch(`/api/requests/${requestRes.body.id}/status`)
      .set("Authorization", `Bearer ${technicianToken}`)
      .send({ status: "in_progress" });

    expect(inProgressRes.status).toBe(200);

    const invalidRes = await request(app)
      .patch(`/api/requests/${requestRes.body.id}/status`)
      .set("Authorization", `Bearer ${technicianToken}`)
      .send({ status: "new" });

    expect(invalidRes.status).toBe(409);
    expect(invalidRes.body.error.code).toBe("INVALID_TRANSITION");
  });

  it("GET /api/equipment/:id/requests returns nested requests", async () => {
    const equipmentId = await createEquipment();
    const requestRes = await createRequest(equipmentId, { title: "Nested request" });

    const res = await request(app)
      .get(`/api/equipment/${equipmentId}/requests`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.some((item) => item.id === requestRes.body.id)).toBe(true);
  });

  it("PATCH /api/requests/:id updates title but keeps current status unchanged", async () => {
    const equipmentId = await createEquipment();
    const requestRes = await createRequest(equipmentId, { title: "Before update" });

    const res = await request(app)
      .patch(`/api/requests/${requestRes.body.id}`)
      .set("Authorization", `Bearer ${technicianToken}`)
      .send({ title: "After update", status: "done" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("After update");
    expect(res.body.status).toBe("new");
  });

  it("DELETE /api/equipment/:id is blocked while request is open", async () => {
    const equipmentId = await createEquipment();
    await createRequest(equipmentId, { title: "Open request" });

    const res = await request(app)
      .delete(`/api/equipment/${equipmentId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("DELETE /api/equipment/:id succeeds after all open requests are closed", async () => {
    const equipmentId = await createEquipment();
    const requestRes = await createRequest(equipmentId, { title: "Closed request" });

    const assignRes = await request(app)
      .post(`/api/requests/${requestRes.body.id}/assignees`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        assignees: [{ technicianId, role: "lead", plannedHours: 4 }],
      });

    expect(assignRes.status).toBe(200);

    const inProgressRes = await request(app)
      .patch(`/api/requests/${requestRes.body.id}/status`)
      .set("Authorization", `Bearer ${technicianToken}`)
      .send({ status: "in_progress" });

    expect(inProgressRes.status).toBe(200);

    const transitionRes = await request(app)
      .patch(`/api/requests/${requestRes.body.id}/status`)
      .set("Authorization", `Bearer ${technicianToken}`)
      .send({ status: "done" });

    expect(transitionRes.status).toBe(200);

    const deleteRes = await request(app)
      .delete(`/api/equipment/${equipmentId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(204);
  });
});
