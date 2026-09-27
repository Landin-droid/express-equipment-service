import { DataTypes, Model } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export class Equipment extends Model {}

Equipment.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    siteId: { type: DataTypes.UUID, allowNull: false, field: "site_id" },
    name: { type: DataTypes.STRING(150), allowNull: false },
    type: {
      type: DataTypes.ENUM("turbine", "inverter", "sensor", "substation"),
      allowNull: false,
    },
    serialNumber: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      field: "serial_number",
    },
    status: {
      type: DataTypes.ENUM(
        "operational",
        "maintenance",
        "fault",
        "decommissioned",
      ),
      allowNull: false,
      defaultValue: "operational",
    },
    installedAt: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "installed_at",
    },
  },
  {
    sequelize,
    modelName: "Equipment",
    tableName: "equipment",
    underscored: true,
    timestamps: true,
  },
);
