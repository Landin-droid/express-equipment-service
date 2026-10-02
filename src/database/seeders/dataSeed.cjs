'use strict';

const id = (prefix, number) =>
  `${prefix}-0000-4000-8000-${String(number).padStart(12, '0')}`;

const siteIds = [id('10000000', 1), id('10000000', 2)];
const technicianIds = Array.from({ length: 5 }, (_, index) =>
  id('20000000', index + 1),
);
const equipmentIds = Array.from({ length: 6 }, (_, index) =>
  id('30000000', index + 1),
);
const requestIds = Array.from({ length: 20 }, (_, index) =>
  id('40000000', index + 1),
);

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (days) => new Date(Date.now() - days * DAY_MS).toISOString();
const dateDaysAgo = (days) => daysAgo(days).slice(0, 10);

const requests = [
  { equipment: 0, status: 'done', priority: 'critical', hours: 12, author: 0 },
  { equipment: 0, status: 'in_progress', priority: 'high', hours: 8, author: 1 },
  { equipment: 0, status: 'new', priority: 'medium', hours: 3, author: 2 },
  { equipment: 0, status: 'rejected', priority: 'low', hours: 2, author: 3 },
  { equipment: 1, status: 'done', priority: 'high', hours: 6, author: 4 },
  { equipment: 1, status: 'done', priority: 'medium', hours: 10, author: 0 },
  { equipment: 1, status: 'in_progress', priority: 'critical', hours: 16, author: 1 },
  { equipment: 2, status: 'new', priority: 'low', hours: 1.5, author: 2 },
  { equipment: 2, status: 'rejected', priority: 'high', hours: 5, author: 3 },
  { equipment: 2, status: 'done', priority: 'medium', hours: 7.25, author: 4 },
  { equipment: 3, status: 'in_progress', priority: 'medium', hours: 4, author: 0 },
  { equipment: 3, status: 'new', priority: 'high', hours: 6, author: 1 },
  { equipment: 3, status: 'rejected', priority: 'critical', hours: 9, author: 2 },
  { equipment: 4, status: 'done', priority: 'low', hours: 3.5, author: 3 },
  { equipment: 4, status: 'new', priority: 'medium', hours: 2, author: 4 },
  { equipment: 4, status: 'in_progress', priority: 'high', hours: 7, author: 0 },
  { equipment: 5, status: 'rejected', priority: 'medium', hours: 3, author: 1 },
  { equipment: 5, status: 'rejected', priority: 'critical', hours: 14, author: 2 },
  { equipment: 5, status: 'new', priority: 'low', hours: 1, author: 3 },
  { equipment: 5, status: 'in_progress', priority: 'medium', hours: 4.5, author: 4 },
];

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const now = new Date().toISOString();
      const sites = [
        {
          id: siteIds[0],
          name: 'North Wind Farm',
          code: 'DEMO-NORTH',
          region: 'North Region',
          latitude: 61.218,
          longitude: 28.745,
          created_at: now,
          updated_at: now,
        },
        {
          id: siteIds[1],
          name: 'South Wind Farm',
          code: 'DEMO-SOUTH',
          region: 'South Region',
          latitude: 55.751,
          longitude: 37.618,
          created_at: now,
          updated_at: now,
        },
      ];
      const technicians = [
        ['Alex', 'Morgan', 'Turbine maintenance'],
        ['Sam', 'Taylor', 'Electrical systems'],
        ['Jamie', 'Rivera', 'Instrumentation'],
        ['Casey', 'Kim', 'Power electronics'],
        ['Robin', 'Patel', 'Safety inspection'],
      ].map(([first_name, last_name, specialization], index) => ({
        id: technicianIds[index],
        first_name,
        last_name,
        patronymic: null,
        specialization,
        employee_number: `DEMO-${String(index + 1).padStart(3, '0')}`,
        created_at: now,
        updated_at: now,
      }));
      const equipment = [
        ['North Turbine 01', 'turbine', 'operational', 0],
        ['North Inverter 01', 'inverter', 'maintenance', 0],
        ['North Sensor 01', 'sensor', 'operational', 0],
        ['South Turbine 01', 'turbine', 'fault', 1],
        ['South Substation 01', 'substation', 'operational', 1],
        ['South Inverter 01', 'inverter', 'decommissioned', 1],
      ].map(([name, type, status, siteIndex], index) => ({
        id: equipmentIds[index],
        site_id: siteIds[siteIndex],
        name,
        type,
        serial_number: `DEMO-EQ-${String(index + 1).padStart(3, '0')}`,
        status,
        installed_at: '2022-01-01',
        created_at: now,
        updated_at: now,
      }));
      const passports = equipmentIds.map((equipment_id, index) => ({
        id: id('50000000', index + 1),
        equipment_id,
        manufacturer: ['Vestas', 'ABB', 'Siemens'][index % 3],
        model: `DEMO-MODEL-${index + 1}`,
        rated_power: (2.5 + index * 0.5).toFixed(2),
        last_inspection_at: dateDaysAgo(45 + index * 10),
        created_at: now,
        updated_at: now,
      }));
      const requestRows = requests.map((request, index) => {
        const createdAt = daysAgo(25 - index);
        const plannedAt = ['new', 'in_progress'].includes(request.status)
          ? new Date(Date.now() + (index + 1) * DAY_MS).toISOString()
          : null;

        return {
          id: requestIds[index],
          equipment_id: equipmentIds[request.equipment],
          created_by: technicianIds[request.author],
          title: `Demo maintenance request ${String(index + 1).padStart(2, '0')}`,
          description: `Demonstration request for ${equipment[request.equipment].name}.`,
          priority: request.priority,
          status: request.status,
          planned_at: plannedAt,
          created_at: createdAt,
          updated_at: createdAt,
        };
      });
      const assignees = requests.flatMap((request, index) => {
        const assigneeIds = [request.author];
        if (index % 2 === 0) {
          assigneeIds.push((request.author + 1) % technicianIds.length);
        }

        return assigneeIds.map((technicianIndex, assigneeIndex) => ({
          request_id: requestIds[index],
          technician_id: technicianIds[technicianIndex],
          role: assigneeIndex === 0 ? 'lead' : 'member',
          planned_hours: (request.hours / assigneeIds.length).toFixed(2),
          created_at: requestRows[index].created_at,
        }));
      });
      const statusHistory = [];
      let historyNumber = 1;

      requests.forEach((request, requestIndex) => {
        const statuses =
          request.status === 'done'
            ? ['new', 'in_progress', 'done']
            : request.status === 'in_progress'
              ? ['new', 'in_progress']
              : request.status === 'rejected'
                ? ['new', 'rejected']
                : ['new'];
        const createdTime = new Date(requestRows[requestIndex].created_at);

        statuses.forEach((new_status, statusIndex) => {
          statusHistory.push({
            id: id('60000000', historyNumber++),
            request_id: requestIds[requestIndex],
            changed_by:
              technicianIds[(request.author + statusIndex) % technicianIds.length],
            old_status: statusIndex === 0 ? null : statuses[statusIndex - 1],
            new_status,
            comment: statusIndex === 0 ? 'Request created from demo seed.' : null,
            changed_at: new Date(
              createdTime.getTime() + statusIndex * 60 * 60 * 1000,
            ).toISOString(),
          });
        });
      });

      await queryInterface.bulkInsert('sites', sites, { transaction });
      await queryInterface.bulkInsert('technicians', technicians, { transaction });
      await queryInterface.bulkInsert('equipment', equipment, { transaction });
      await queryInterface.bulkInsert('equipment_passports', passports, { transaction });
      await queryInterface.bulkInsert('maintenance_requests', requestRows, { transaction });
      await queryInterface.bulkInsert('request_assignees', assignees, { transaction });
      await queryInterface.bulkInsert('request_status_history', statusHistory, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.bulkDelete(
        'request_status_history',
        { request_id: requestIds },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'request_assignees',
        { request_id: requestIds },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'maintenance_requests',
        { id: requestIds },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'equipment_passports',
        { equipment_id: equipmentIds },
        { transaction },
      );
      await queryInterface.bulkDelete('equipment', { id: equipmentIds }, { transaction });
      await queryInterface.bulkDelete('sites', { id: siteIds }, { transaction });
      await queryInterface.bulkDelete('technicians', { id: technicianIds }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};