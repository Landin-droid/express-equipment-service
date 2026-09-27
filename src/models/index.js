import { sequelize } from "../database/sequelize.js";
import { Site } from "./Site.js";
import { Equipment } from "./Equipment.js";
import { EquipmentPassport } from "./EquipmentPassport.js";
import { Technician } from "./Technician.js";
import { MaintenanceRequest } from "./MaintenanceRequest.js";
import { RequestStatusHistory } from "./RequestStatusHistory.js";
import { RequestAssignee } from "./RequestAssignee.js";

Site.hasMany(Equipment, { foreignKey: "siteId", as: "equipment" });
Equipment.belongsTo(Site, { foreignKey: "siteId", as: "site" });

Equipment.hasOne(EquipmentPassport, {
  foreignKey: "equipmentId",
  as: "passport",
});
EquipmentPassport.belongsTo(Equipment, {
  foreignKey: "equipmentId",
  as: "equipment",
});

Equipment.hasMany(MaintenanceRequest, {
  foreignKey: "equipmentId",
  as: "requests",
});
MaintenanceRequest.belongsTo(Equipment, {
  foreignKey: "equipmentId",
  as: "equipment",
});

Technician.hasMany(MaintenanceRequest, {
  foreignKey: "createdBy",
  as: "createdRequests",
});
MaintenanceRequest.belongsTo(Technician, {
  foreignKey: "createdBy",
  as: "author",
});

MaintenanceRequest.hasMany(RequestStatusHistory, {
  foreignKey: "requestId",
  as: "statusHistory",
});
RequestStatusHistory.belongsTo(MaintenanceRequest, {
  foreignKey: "requestId",
  as: "request",
});

Technician.hasMany(RequestStatusHistory, {
  foreignKey: "changedBy",
  as: "statusChanges",
});
RequestStatusHistory.belongsTo(Technician, {
  foreignKey: "changedBy",
  as: "changedByTechnician",
});

MaintenanceRequest.belongsToMany(Technician, {
  through: RequestAssignee,
  foreignKey: "requestId",
  otherKey: "technicianId",
  as: "assignees",
});
Technician.belongsToMany(MaintenanceRequest, {
  through: RequestAssignee,
  foreignKey: "technicianId",
  otherKey: "requestId",
  as: "assignedRequests",
});

MaintenanceRequest.hasMany(RequestAssignee, {
  foreignKey: "requestId",
  as: "assigneeLinks",
});
RequestAssignee.belongsTo(MaintenanceRequest, {
  foreignKey: "requestId",
  as: "request",
});
Technician.hasMany(RequestAssignee, {
  foreignKey: "technicianId",
  as: "assignmentLinks",
});
RequestAssignee.belongsTo(Technician, {
  foreignKey: "technicianId",
  as: "technician",
});

export {
  sequelize,
  Site,
  Equipment,
  EquipmentPassport,
  Technician,
  MaintenanceRequest,
  RequestStatusHistory,
  RequestAssignee,
};
