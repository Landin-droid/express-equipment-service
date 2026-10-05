import request from "supertest";
import app from "../../src/app.js";
import { resetDb } from "../helpers/resetDB.js";
import {
  createUserWithToken,
  createTechnicianUser,
} from "../helpers/authFixtures.js";
import { Site, Equipment } from "../../src/models/index.js";

beforeEach(resetDb);

async function seedEquipment() {
  const site = await Site.create({
    name: "Site",
    code: "C-" + Date.now(),
    latitude: 60,
    longitude: 24,
  });
  return Equipment.create({
    siteId: site.id,
    name: "Eq",
    type: "sensor",
    serialNumber: "SN-" + Date.now(),
    status: "operational",
    installedAt: "2024-01-01",
  });
}

describe("Role-based access control", () => {
  it("GET /api/equipment without token -> 401", async () => {
    const res = await request(app).get("/api/equipment");
    expect(res.status).toBe(401);
  });

  it("viewer can read but not create equipment", async () => {
    const { accessToken } = await createUserWithToken("viewer");
    const readRes = await request(app)
      .get("/api/equipment")
      .set("Authorization", "Bearer " + accessToken);
    expect(readRes.status).toBe(200);

    const writeRes = await request(app)
      .post("/api/equipment")
      .set("Authorization", "Bearer " + accessToken)
      .send({});
    expect(writeRes.status).toBe(403);
  });

  it("technician can create requests but not manage equipment", async () => {
    const { accessToken } = await createTechnicianUser();
    const equipment = await seedEquipment();

    const createRequestRes = await request(app)
      .post("/api/requests")
      .set("Authorization", "Bearer " + accessToken)
      .send({
        equipmentId: equipment.id,
        title: "Проверка доступа",
        priority: "low",
      });
    expect(createRequestRes.status).toBe(201);

    const deleteEquipmentRes = await request(app)
      .delete("/api/equipment/" + equipment.id)
      .set("Authorization", "Bearer " + accessToken);
    expect(deleteEquipmentRes.status).toBe(403);
  });

  it("technician cannot change status of a request they are not assigned to", async () => {
    const { accessToken } = await createTechnicianUser();
    const equipment = await seedEquipment();

    const createRes = await request(app)
      .post("/api/requests")
      .set("Authorization", "Bearer " + accessToken)
      .send({
        equipmentId: equipment.id,
        title: "Чужая заявка",
        priority: "low",
      });

    const statusRes = await request(app)
      .patch("/api/requests/" + createRes.body.id + "/status")
      .set("Authorization", "Bearer " + accessToken)
      .send({ status: "rejected" });
    expect(statusRes.status).toBe(403);
  });

  it("admin can manage equipment and assignees", async () => {
    const { accessToken } = await createUserWithToken("admin");
    const res = await request(app)
      .post("/api/equipment")
      .set("Authorization", "Bearer " + accessToken)
      .send({
        name: "Admin Eq",
        type: "sensor",
        serialNumber: "SN-ADMIN-" + Date.now(),
        location: { lat: 60, lon: 24 },
        status: "operational",
        installedAt: "2024-01-01",
      });
    expect(res.status).toBe(201);
  });
});
