'use strict';

const recreateFk = (action) => `
  DO $$
  DECLARE fk_name text;
  BEGIN
    SELECT tc.constraint_name INTO fk_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'maintenance_requests'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'equipment_id';

    EXECUTE format('ALTER TABLE maintenance_requests DROP CONSTRAINT %I', fk_name);
    EXECUTE format(
      'ALTER TABLE maintenance_requests ADD CONSTRAINT %I FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE ${action} ON UPDATE CASCADE',
      fk_name
    );
  END $$;
`;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(recreateFk("CASCADE"));
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query(recreateFk("RESTRICT"));
  },
};
