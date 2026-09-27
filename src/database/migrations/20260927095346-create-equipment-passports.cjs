'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
   await queryInterface.createTable('equipment_passports', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      equipment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'equipment', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      manufacturer: { type: Sequelize.STRING(150), allowNull: false },
      model: { type: Sequelize.STRING(150), allowNull: false },
      rated_power: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      last_inspection_at: { type: Sequelize.DATEONLY, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('equipment_passports');
  }
};
