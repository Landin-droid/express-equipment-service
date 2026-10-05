import { ValidationError } from "../errors/ValidationError.js";

export function assertValidAssigneeComposition(assignees) {
  const technicianIds = assignees.map((a) => a.technicianId);
  const hasDuplicates = new Set(technicianIds).size !== technicianIds.length;
  if (hasDuplicates) {
    return { valid: false, reason: "DUPLICATE_TECHNICIAN" };
  }

  const leadCount = assignees.filter((a) => a.role === "lead").length;
  if (leadCount !== 1) {
    return { valid: false, reason: "INVALID_LEAD_COUNT" };
  }

  return { valid: true };
}
