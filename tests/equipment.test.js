import request from "supertest";
import app from "../src/app.js";

function makeEquipmentPayload(overrides = {}) {
  return {
    name: "Turbine Test",
    type: "turbine",
    serialNumber: `SN-TEST-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    location: { lat: 60.1, lon: 24.9 },
    status: "operational",
    installedAt: "2024-01-01",
    ...overrides,
  };
}

describe("Equipment CRUD", () => {
  let createdId;
  let createdSerialNumber;

  it("POST /api/equipment creates equipment and returns 201 with Location header", async () => {
    const payload = makeEquipmentPayload();
    const res = await request(app).post("/api/equipment").send(payload);

    expect(res.status).toBe(201);
    expect(res.headers.location).toBe(`/api/equipment/${res.body.id}`);
    expect(res.body.id).toEqual(expect.any(String));
    expect(res.body.status).toBe("operational");

    createdId = res.body.id;
    createdSerialNumber = payload.serialNumber;
  });

  it("POST /api/equipment with missing required fields returns 422 with details", async () => {
    const res = await request(app)
      .post("/api/equipment")
      .send({ type: "turbine" });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "name" })]),
    );
  });

  it("POST /api/equipment with duplicate serialNumber returns 409", async () => {
    const res = await request(app)
      .post("/api/equipment")
      .send(makeEquipmentPayload({ serialNumber: createdSerialNumber }));

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("GET /api/equipment/:id returns the created equipment", async () => {
    const res = await request(app).get(`/api/equipment/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdId);
  });

  it("GET /api/equipment/:id with nonexistent id returns 404", async () => {
    const res = await request(app).get(
      "/api/equipment/00000000-0000-4000-8000-000000000000",
    );
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("GET /api/equipment/:id with invalid uuid returns 422", async () => {
    const res = await request(app).get("/api/equipment/not-a-uuid");
    expect(res.status).toBe(422);
  });

  it("PATCH /api/equipment/:id updates status", async () => {
    const res = await request(app)
      .patch(`/api/equipment/${createdId}`)
      .send({ status: "maintenance" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("maintenance");
    expect(res.body.id).toBe(createdId);
  });

  it("GET /api/equipment returns paginated list with meta", async () => {
    const res = await request(app).get("/api/equipment?page=1&limit=10");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toEqual(
      expect.objectContaining({
        total: expect.any(Number),
        page: 1,
        limit: 10,
      }),
    );
    expect(res.body.data.some((e) => e.id === createdId)).toBe(true);
  });

  it("DELETE /api/equipment/:id removes equipment without open requests", async () => {
    const res = await request(app).delete(`/api/equipment/${createdId}`);
    expect(res.status).toBe(204);

    const getRes = await request(app).get(`/api/equipment/${createdId}`);
    expect(getRes.status).toBe(404);
  });
});
