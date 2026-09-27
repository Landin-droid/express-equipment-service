import { DataTypes, Model } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export class RequestStatusHistory extends Model {}

RequestStatusHistory.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    requestId: { type: DataTypes.UUID, allowNull: false, field: "request_id" },
    changedBy: { type: DataTypes.UUID, allowNull: false, field: "changed_by" },
    oldStatus: {
      type: DataTypes.ENUM("new", "in_progress", "done", "rejected"),
      allowNull: true,
      field: "old_status",
    },
    newStatus: {
      type: DataTypes.ENUM("new", "in_progress", "done", "rejected"),
      allowNull: false,
      field: "new_status",
    },
    comment: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    modelName: "RequestStatusHistory",
    tableName: "request_status_history",
    underscored: true,
    createdAt: "changed_at",
    updatedAt: false,
  },
);
