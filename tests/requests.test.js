import request from "supertest";
import app from "../src/app.js";

async function createEquipment() {
  const res = await request(app)
    .post("/api/equipment")
    .send({
      name: "Equipment For Requests",
      type: "sensor",
      serialNumber: `SN-REQ-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      location: { lat: 60.1, lon: 24.9 },
      status: "operational",
      installedAt: "2024-01-01",
    });
  return res.body.id;
}

describe("Maintenance Requests", () => {
  let equipmentId;
  let requestId;

  beforeAll(async () => {
    equipmentId = await createEquipment();
  });

  it('POST /api/requests creates request with default status "new"', async () => {
    const res = await request(app).post("/api/requests").send({
      equipmentId,
      title: "Замена подшипника",
      priority: "high",
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("new");
    requestId = res.body.id;
  });

  it("status field in body is ignored on create (always starts as new)", async () => {
    const res = await request(app).post("/api/requests").send({
      equipmentId,
      title: "Проверка игнорирования статуса",
      priority: "low",
      status: "done",
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("new");
    
    await request(app)
      .patch(`/api/requests/${res.body.id}/status`)
      .send({ status: "rejected" });
  });

  it("POST /api/requests with nonexistent equipmentId returns 404", async () => {
    const res = await request(app).post("/api/requests").send({
      equipmentId: "00000000-0000-4000-8000-000000000000",
      title: "Заявка в никуда",
      priority: "low",
    });

    expect(res.status).toBe(404);
  });

  it("GET /api/equipment/:id/requests returns nested requests", async () => {
    const res = await request(app).get(
      `/api/equipment/${equipmentId}/requests`,
    );
    expect(res.status).toBe(200);
    expect(res.body.data.some((r) => r.id === requestId)).toBe(true);
  });

  it("PATCH /api/requests/:id (regular) does not change status", async () => {
    const res = await request(app)
      .patch(`/api/requests/${requestId}`)
      .send({ title: "Обновлённый заголовок", status: "done" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Обновлённый заголовок");
    expect(res.body.status).toBe("new");
  });

  it("PATCH /api/requests/:id/status allows valid transition new -> in_progress", async () => {
    const res = await request(app)
      .patch(`/api/requests/${requestId}/status`)
      .send({ status: "in_progress" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("in_progress");
  });

  it("PATCH /api/requests/:id/status rejects invalid transition in_progress -> new", async () => {
    const res = await request(app)
      .patch(`/api/requests/${requestId}/status`)
      .send({ status: "new" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("INVALID_TRANSITION");
  });

  it("DELETE /api/equipment/:id is blocked while request is open", async () => {
    const res = await request(app).delete(`/api/equipment/${equipmentId}`);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("PATCH /api/requests/:id/status allows in_progress -> done, closing it", async () => {
    const res = await request(app)
      .patch(`/api/requests/${requestId}/status`)
      .send({ status: "done" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("done");
  });

  it("DELETE /api/equipment/:id now succeeds (no open requests left)", async () => {
    const res = await request(app).delete(`/api/equipment/${equipmentId}`);
    expect(res.status).toBe(204);
  });
});
