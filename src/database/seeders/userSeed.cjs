"use strict";
const bcrypt = require("bcrypt");

// Демонстрационные учётные записи
module.exports = {
  async up(queryInterface) {
    const {
      SEED_ADMIN_EMAIL,
      SEED_ADMIN_PASSWORD,
      SEED_TECHNICIAN_EMAIL,
      SEED_TECHNICIAN_PASSWORD,
    } = process.env;
    if (
      !SEED_ADMIN_EMAIL ||
      !SEED_ADMIN_PASSWORD ||
      !SEED_TECHNICIAN_EMAIL ||
      !SEED_TECHNICIAN_PASSWORD
    ) {
      throw new Error(
        "Set SEED_ADMIN_* and SEED_TECHNICIAN_* variables in .env before seeding",
      );
    }

    const [technicians] = await queryInterface.sequelize.query(
      "SELECT id FROM technicians ORDER BY created_at ASC LIMIT 1",
    );
    const now = new Date();

    await queryInterface.bulkInsert("users", [
      {
        email: SEED_ADMIN_EMAIL,
        password_hash: await bcrypt.hash(SEED_ADMIN_PASSWORD, 12),
        role: "admin",
        created_at: now,
        updated_at: now,
      },
      {
        email: SEED_TECHNICIAN_EMAIL,
        password_hash: await bcrypt.hash(SEED_TECHNICIAN_PASSWORD, 12),
        role: "technician",
        technician_id: technicians[0]?.id ?? null,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("users", {
      email: [process.env.SEED_ADMIN_EMAIL, process.env.SEED_TECHNICIAN_EMAIL],
    });
  },
};
