import { assertValidAssigneeComposition } from "../../src/services/assigneeValidation.js";

describe("assertValidAssigneeComposition", () => {
  it("accepts exactly one lead and distinct technicians", () => {
    const result = assertValidAssigneeComposition([
      { technicianId: "a", role: "lead" },
      { technicianId: "b", role: "member" },
    ]);
    expect(result.valid).toBe(true);
  });

  it("rejects zero leads", () => {
    const result = assertValidAssigneeComposition([
      { technicianId: "a", role: "member" },
    ]);
    expect(result).toEqual({ valid: false, reason: "INVALID_LEAD_COUNT" });
  });

  it("rejects two leads", () => {
    const result = assertValidAssigneeComposition([
      { technicianId: "a", role: "lead" },
      { technicianId: "b", role: "lead" },
    ]);
    expect(result).toEqual({ valid: false, reason: "INVALID_LEAD_COUNT" });
  });

  it("rejects duplicate technician", () => {
    const result = assertValidAssigneeComposition([
      { technicianId: "a", role: "lead" },
      { technicianId: "a", role: "member" },
    ]);
    expect(result).toEqual({ valid: false, reason: "DUPLICATE_TECHNICIAN" });
  });
});
