import { sequelize } from "../../src/database/sequelize.js";

export async function resetDb() {
  await sequelize.query(`
    TRUNCATE users, refresh_tokens, sites, equipment, equipment_passports,
      technicians, maintenance_requests, request_status_history, request_assignees
    RESTART IDENTITY CASCADE;
  `);
}
