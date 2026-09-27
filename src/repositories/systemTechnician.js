import { Technician } from "../models/index.js";

const SYSTEM_EMPLOYEE_NUMBER = "SYSTEM";

// Автор по умолчанию для запросов, где createdBy/changedBy не переданы —
// обратная совместимость со старым контрактом Кейса 2, где понятия "автор"
// не существовало, а атрибут в БД теперь NOT NULL.
export async function resolveTechnicianId(explicitId) {
  if (explicitId) return explicitId;

  const [technician] = await Technician.findOrCreate({
    where: { employeeNumber: SYSTEM_EMPLOYEE_NUMBER },
    defaults: {
      firstName: "System",
      lastName: "User",
      specialization: null,
      employeeNumber: SYSTEM_EMPLOYEE_NUMBER,
    },
  });

  return technician.id;
}
