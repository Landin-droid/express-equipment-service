'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('equipment', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      site_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'sites', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      name: { type: Sequelize.STRING(150), allowNull: false },
      type: { type: 'equipment_type_enum', allowNull: false },
      serial_number: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      status: {
        type: 'equipment_status_enum',
        allowNull: false,
        defaultValue: 'operational',
      },
      installed_at: { type: Sequelize.DATEONLY, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('equipment');
  }
};
