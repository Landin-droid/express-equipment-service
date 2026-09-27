'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const types = [
      ["equipment_type_enum", ["turbine", "inverter", "sensor", "substation"]],
      [
        "equipment_status_enum",
        ["operational", "maintenance", "fault", "decommissioned"],
      ],
      ["request_priority_enum", ["low", "medium", "high", "critical"]],
      ["request_status_enum", ["new", "in_progress", "done", "rejected"]],
      ["assignee_role_enum", ["lead", "member"]],
    ];

    for (const [name, values] of types) {
      await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "${name}" AS ENUM (${values.map((v) => `'${v}'`).join(", ")});
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    }
  },

  async down (queryInterface, Sequelize) {
    const names = [
      "assignee_role_enum",
      "request_status_enum",
      "request_priority_enum",
      "equipment_status_enum",
      "equipment_type_enum",
    ];

    for (const name of names) {
      await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${name}";`);
    }
  }
};
