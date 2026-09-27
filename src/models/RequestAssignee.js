import { DataTypes, Model } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export class RequestAssignee extends Model {}

RequestAssignee.init(
  {
    requestId: { type: DataTypes.UUID, primaryKey: true, field: "request_id" },
    technicianId: {
      type: DataTypes.UUID,
      primaryKey: true,
      field: "technician_id",
    },
    role: { type: DataTypes.ENUM("lead", "member"), allowNull: false },
    plannedHours: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0,
      field: "planned_hours",
    },
  },
  {
    sequelize,
    modelName: "RequestAssignee",
    tableName: "request_assignees",
    underscored: true,
    id: false,
    createdAt: "created_at",
    updatedAt: false,
  },
);
