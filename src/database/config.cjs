require("dotenv").config();

// Sequelize CLI подключается суперпользователем (POSTGRES_USER)
const base = {
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  dialect: "postgres",
};

module.exports = {
  development: base,
  test: { ...base, database: `${process.env.PGDATABASE}_test` },
  production: base,
};
