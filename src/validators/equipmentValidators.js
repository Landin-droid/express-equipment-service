import { z } from "zod";

const equipmentTypes = ["turbine", "inverter", "sensor", "substation"];
const equipmentStatuses = [
  "operational",
  "maintenance",
  "fault",
  "decommissioned",
];

const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

const notFutureDate = z
  .string()
  .refine(
    (val) => !isNaN(Date.parse(val)) && new Date(val).getTime() <= Date.now(),
    {
      message:
        "Дата не должна быть в будущем и должна быть корректной ISO-датой",
    },
  );

export const createEquipmentSchema = z.object({
  name: z.string().min(3).max(100),
  type: z.enum(equipmentTypes),
  serialNumber: z.string().min(1),
  location: locationSchema,
  status: z.enum(equipmentStatuses),
  installedAt: notFutureDate,
});

export const updateEquipmentSchema = createEquipmentSchema.partial();

export const listEquipmentQuerySchema = z.object({
  type: z.enum(equipmentTypes).optional(),
  status: z.enum(equipmentStatuses).optional(),
  sort: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid("Некорректный формат id"),
});
