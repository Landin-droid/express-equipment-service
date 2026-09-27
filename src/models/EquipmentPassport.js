import { DataTypes, Model } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export class EquipmentPassport extends Model {}

EquipmentPassport.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    equipmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: "equipment_id",
    },
    manufacturer: { type: DataTypes.STRING(150), allowNull: false },
    model: { type: DataTypes.STRING(150), allowNull: false },
    ratedPower: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "rated_power",
    },
    lastInspectionAt: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "last_inspection_at",
    },
  },
  {
    sequelize,
    modelName: "EquipmentPassport",
    tableName: "equipment_passports",
    underscored: true,
    timestamps: true,
  },
);
