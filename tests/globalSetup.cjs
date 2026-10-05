require("dotenv").config();
const { execSync } = require("child_process");
const { Client } = require("pg");

module.exports = async () => {
  const testDbName = `${process.env.PGDATABASE}_test`;

  const adminClient = new Client({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT) || 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.PGDATABASE,
  });
  await adminClient.connect();
  try {
    await adminClient.query(`CREATE DATABASE "${testDbName}"`);
  } catch (err) {
    if (err.code !== "42P04") throw err; // already exists
  }
  await adminClient.end();

  execSync("npx sequelize-cli db:migrate --env test", { stdio: "inherit" });

  const testDbClient = new Client({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT) || 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: testDbName,
  });
  await testDbClient.connect();
  await testDbClient.query(`
    GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public TO ${process.env.PGUSER};
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO ${process.env.PGUSER};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE ON TABLES TO ${process.env.PGUSER};
  `);
  await testDbClient.end();
};
