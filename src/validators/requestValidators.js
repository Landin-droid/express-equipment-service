import { z } from "zod";

const priorities = ["low", "medium", "high", "critical"];
const statuses = ["new", "in_progress", "done", "rejected"];

export const createRequestSchema = z.object({
  equipmentId: z.string().uuid("Некорректный формат equipmentId"),
  title: z.string().min(5).max(120),
  description: z.string().max(2000).optional(),
  priority: z.enum(priorities),
  plannedAt: z.string().datetime().optional(),
});

export const updateRequestSchema = z.object({
  title: z.string().min(5).max(120).optional(),
  description: z.string().max(2000).optional(),
  priority: z.enum(priorities).optional(),
  plannedAt: z.string().datetime().optional(),
});

export const changeStatusSchema = z.object({
  status: z.enum(statuses),
});

export const listRequestsQuerySchema = z.object({
  status: z.enum(statuses).optional(),
  priority: z.enum(priorities).optional(),
  equipmentId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sort: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
