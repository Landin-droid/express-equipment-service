import {
  canManageEquipment,
  canCreateOrEditRequest,
  canChangeRequestStatus,
} from "../../src/services/authorization.js";

describe("authorization", () => {
  it("only admin manages equipment", () => {
    expect(canManageEquipment("admin")).toBe(true);
    expect(canManageEquipment("technician")).toBe(false);
    expect(canManageEquipment("viewer")).toBe(false);
  });

  it("technician and admin can create/edit requests, viewer cannot", () => {
    expect(canCreateOrEditRequest("technician")).toBe(true);
    expect(canCreateOrEditRequest("admin")).toBe(true);
    expect(canCreateOrEditRequest("viewer")).toBe(false);
  });

  it("admin changes any request status", () => {
    expect(
      canChangeRequestStatus("admin", { isAssignedTechnician: false }),
    ).toBe(true);
  });

  it("technician changes status only when assigned", () => {
    expect(
      canChangeRequestStatus("technician", { isAssignedTechnician: true }),
    ).toBe(true);
    expect(
      canChangeRequestStatus("technician", { isAssignedTechnician: false }),
    ).toBe(false);
  });

  it("viewer never changes status", () => {
    expect(
      canChangeRequestStatus("viewer", { isAssignedTechnician: true }),
    ).toBe(false);
  });
});
