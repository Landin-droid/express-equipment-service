import { z } from "zod";

const equipmentLoadSortFields = [
  "equipmentName",
  "requestCount",
  "closedRequestCount",
  "plannedHours",
  "lastServiceAt",
];

export const equipmentLoadQuerySchema = z
  .object({
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    minRequests: z.coerce.number().int().min(0).max(1_000_000).default(1),
    sort: z.enum(equipmentLoadSortFields).default("requestCount"),
    direction: z.enum(["ASC", "DESC"]).default("DESC"),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).max(100_000).default(0),
  })
  .refine(
    ({ dateFrom, dateTo }) =>
      !dateFrom || !dateTo || Date.parse(dateFrom) <= Date.parse(dateTo),
    { message: "dateFrom должен быть не позже dateTo", path: ["dateTo"] },
  );