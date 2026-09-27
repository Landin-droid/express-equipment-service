import { DataTypes, Model } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export class MaintenanceRequest extends Model {}

MaintenanceRequest.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    equipmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "equipment_id",
    },
    createdBy: { type: DataTypes.UUID, allowNull: false, field: "created_by" },
    title: { type: DataTypes.STRING(120), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    priority: {
      type: DataTypes.ENUM("low", "medium", "high", "critical"),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("new", "in_progress", "done", "rejected"),
      allowNull: false,
      defaultValue: "new",
    },
    plannedAt: { type: DataTypes.DATE, allowNull: true, field: "planned_at" },
  },
  {
    sequelize,
    modelName: "MaintenanceRequest",
    tableName: "maintenance_requests",
    underscored: true,
    timestamps: true,
  },
);
