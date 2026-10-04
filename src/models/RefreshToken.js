import { DataTypes, Model } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export class RefreshToken extends Model {}

RefreshToken.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: { type: DataTypes.UUID, allowNull: false, field: "user_id" },
    tokenHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      field: "token_hash",
    },
    expiresAt: { type: DataTypes.DATE, allowNull: false, field: "expires_at" },
    revokedAt: { type: DataTypes.DATE, allowNull: true, field: "revoked_at" },
  },
  {
    sequelize,
    modelName: "RefreshToken",
    tableName: "refresh_tokens",
    underscored: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);
