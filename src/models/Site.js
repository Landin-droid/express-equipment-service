import { DataTypes, Model } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export class Site extends Model {}

Site.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: { type: DataTypes.STRING(100), allowNull: false },
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    region: { type: DataTypes.STRING(100), allowNull: true },
    latitude: { type: DataTypes.DECIMAL(7, 5), allowNull: false },
    longitude: { type: DataTypes.DECIMAL(7, 5), allowNull: false },
  },
  {
    sequelize,
    modelName: "Site",
    tableName: "sites",
    underscored: true,
    timestamps: true,
  },
);
