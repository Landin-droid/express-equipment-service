import { sequelize } from "../database/sequelize.js";
import { Site } from "./Site.js";
import { Equipment } from "./Equipment.js";
import { EquipmentPassport } from "./EquipmentPassport.js";
import { Technician } from "./Technician.js";

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

export { sequelize, Site, Equipment, EquipmentPassport, Technician };
