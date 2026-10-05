import tokenService from "../../src/services/auth/tokenService.js";
import { User, Technician } from "../../src/models/index.js";

export async function createUserWithToken(role, { technicianId } = {}) {
  const user = await User.create({
    email: `${role}-${Date.now()}@test.com`,
    passwordHash: "unused-in-these-tests",
    role,
    technicianId: technicianId ?? null,
  });
  const accessToken = tokenService.signAccessToken(user);
  return { user, accessToken };
}

export async function createTechnicianUser() {
  const technician = await Technician.create({
    firstName: "Test",
    lastName: "Tech",
    employeeNumber: `T-${Date.now()}`,
  });
  return createUserWithToken("technician", { technicianId: technician.id });
}
