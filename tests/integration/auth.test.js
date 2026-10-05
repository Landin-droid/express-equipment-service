import request from "supertest";
import app from "../../src/app.js";
import { resetDb } from "../helpers/resetDB.js";
import { createUserWithToken } from "../helpers/authFixtures.js";

beforeEach(resetDb);

describe("Auth flow", () => {
  const credentials = { email: "user@test.com", password: "password123" };

  it("registers a new user with default role viewer", async () => {
    const res = await request(app).post("/api/auth/register").send(credentials);
    expect(res.status).toBe(201);
    expect(res.body.role).toBe("viewer");
    expect(res.body.password).toBeUndefined();
    expect(res.body.passwordHash).toBeUndefined();
  });

  it("rejects duplicate email with 409", async () => {
    await request(app).post("/api/auth/register").send(credentials);
    const res = await request(app).post("/api/auth/register").send(credentials);
    expect(res.status).toBe(409);
  });

  it("logs in and sets refresh cookie", async () => {
    await request(app).post("/api/auth/register").send(credentials);
    const res = await request(app).post("/api/auth/login").send(credentials);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.headers["set-cookie"][0]).toMatch(/refreshToken=.*HttpOnly/);
  });

  it("returns identical message for wrong password and unknown email", async () => {
    await request(app).post("/api/auth/register").send(credentials);
    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .send({ ...credentials, password: "wrong" });
    const unknownEmail = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@test.com", password: "x" });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error.message).toBe(
      unknownEmail.body.error.message,
    );
  });

  it("refreshes access token via cookie and rotates refresh token", async () => {
    await request(app).post("/api/auth/register").send(credentials);
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send(credentials);
    const cookie = loginRes.headers["set-cookie"];

    const refreshRes = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", cookie);
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.accessToken).toEqual(expect.any(String));

    const reuseRes = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", cookie);
    expect(reuseRes.status).toBe(401);
  });

  it("logout revokes refresh token", async () => {
    await request(app).post("/api/auth/register").send(credentials);
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send(credentials);
    const cookie = loginRes.headers["set-cookie"];

    await request(app).post("/api/auth/logout").set("Cookie", cookie);
    const refreshRes = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", cookie);
    expect(refreshRes.status).toBe(401);
  });

  it("GET /me requires a valid access token", async () => {
    const withoutToken = await request(app).get("/api/auth/me");
    expect(withoutToken.status).toBe(401);

    const { accessToken, user } = await createUserWithToken("viewer");

    const withToken = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer " + accessToken);
    expect(withToken.status).toBe(200);
    expect(withToken.body.email).toBe(user.email);
  });
});
