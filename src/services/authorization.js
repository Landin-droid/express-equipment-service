export function canManageEquipment(role) {
  return role === "admin";
}

export function canCreateOrEditRequest(role) {
  return role === "technician" || role === "admin";
}

export function canManageAssignees(role) {
  return role === "admin";
}

export function canChangeRequestStatus(role, { isAssignedTechnician }) {
  if (role === "admin") return true;
  if (role === "technician") return isAssignedTechnician === true;
  return false;
}
