const REQUEST_SORT_FIELDS = [
  "title",
  "priority",
  "status",
  "plannedAt",
  "createdAt",
];

export const createRequestSchema = z.object({
  equipmentId: z.string().uuid("Некорректный формат equipmentId"),
  title: z.string().min(5).max(120),
  description: z.string().max(2000).optional(),
  priority: z.enum(priorities),
  plannedAt: z.string().datetime().optional(),
  createdBy: z.string().uuid().optional(),
});

export const changeStatusSchema = z.object({
  status: z.enum(statuses),
  changedBy: z.string().uuid().optional(),
  comment: z.string().max(1000).optional(),
});

export const listRequestsQuerySchema = z.object({
  status: z.enum(statuses).optional(),
  priority: z.enum(priorities).optional(),
  equipmentId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sort: z
    .enum([...REQUEST_SORT_FIELDS, ...REQUEST_SORT_FIELDS.map((f) => `-${f}`)])
    .optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
