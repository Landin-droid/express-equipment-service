import { DataTypes, Model } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export class Technician extends Model {}

Technician.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    firstName: {
      type: DataTypes.STRING(60),
      allowNull: false,
      field: "first_name",
    },
    lastName: {
      type: DataTypes.STRING(60),
      allowNull: false,
      field: "last_name",
    },
    patronymic: { type: DataTypes.STRING(60), allowNull: true },
    specialization: { type: DataTypes.STRING(100), allowNull: true },
    employeeNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      field: "employee_number",
    },
  },
  {
    sequelize,
    modelName: "Technician",
    tableName: "technicians",
    underscored: true,
    timestamps: true,
  },
);
