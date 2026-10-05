import "dotenv/config";
import { Sequelize } from "sequelize";

const isTest = process.env.NODE_ENV === "test";
const database = isTest
  ? `${process.env.PGDATABASE}_test`
  : process.env.PGDATABASE;

export const sequelize = new Sequelize(
  database,
  process.env.PGUSER,
  process.env.PGPASSWORD,
  {
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT) || 5432,
    dialect: "postgres",
    logging:
      !isTest && process.env.NODE_ENV === "development" ? console.log : false,
    pool: { max: 10, idle: 30_000, acquire: 5_000 },
  },
);
