'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('request_assignees', {
      request_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: 'maintenance_requests', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      technician_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: 'technicians', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      role: { type: 'assignee_role_enum', allowNull: false },
      planned_hours: { type: Sequelize.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('request_assignees');
  }
};
