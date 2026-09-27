'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('request_status_history', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      request_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'maintenance_requests', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      changed_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'technicians', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      old_status: { type: 'request_status_enum', allowNull: true },
      new_status: { type: 'request_status_enum', allowNull: false },
      comment: { type: Sequelize.TEXT, allowNull: true },
      changed_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('request_status_history');
  }
};
