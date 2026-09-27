'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable("technicians", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },
      first_name: { type: Sequelize.STRING(60), allowNull: false },
      last_name: { type: Sequelize.STRING(60), allowNull: false },
      patronymic: { type: Sequelize.STRING(60), allowNull: true },
      specialization: { type: Sequelize.STRING(100), allowNull: true },
      employee_number: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("now()"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("now()"),
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable("technicians");
  }
};
