'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
   await queryInterface.sequelize.query(`
      DO $$
      DECLARE
        fk_name text;
      BEGIN
        SELECT tc.constraint_name INTO fk_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'request_status_history'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'request_id';

        EXECUTE format('ALTER TABLE request_status_history DROP CONSTRAINT %I', fk_name);
        EXECUTE format(
          'ALTER TABLE request_status_history ADD CONSTRAINT %I FOREIGN KEY (request_id) REFERENCES maintenance_requests(id) ON DELETE CASCADE ON UPDATE CASCADE',
          fk_name
        );
      END $$;
    `);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DO $$
      DECLARE
        fk_name text;
      BEGIN
        SELECT tc.constraint_name INTO fk_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'request_status_history'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'request_id';

        EXECUTE format('ALTER TABLE request_status_history DROP CONSTRAINT %I', fk_name);
        EXECUTE format(
          'ALTER TABLE request_status_history ADD CONSTRAINT %I FOREIGN KEY (request_id) REFERENCES maintenance_requests(id) ON DELETE RESTRICT ON UPDATE CASCADE',
          fk_name
        );
      END $$;
    `);
  }
};
