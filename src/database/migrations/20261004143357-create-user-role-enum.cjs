"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `CREATE TYPE "user_role_enum" AS ENUM ('viewer', 'technician', 'admin');`,
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "user_role_enum";`,
    );
  },
};
