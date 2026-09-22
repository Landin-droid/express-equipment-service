import requestRepository from "../repositories/requestRepository.js";
import { canTransition } from "./statusTransitions.js";
import { ConflictError } from "../errors/ConflictError.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { createRequestSchema } from "../validators/requestValidators.js";

const OPEN_STATUSES = ["new", "in_progress"];

function assertExists(request, id) {
  if (!request) {
    throw new NotFoundError(`Заявка с id=${id} не найдена`);
  }
}

function createRequest(data, equipmentRepository) {
  const equipment = equipmentRepository.findById(data.equipmentId);
  if (!equipment) {
    throw new NotFoundError(
      `Оборудование с id=${data.equipmentId} не найдено`,
    );
  }
  const { status, ...rest } = data;
  return requestRepository.create(rest);
}

function listRequests(query) {
  const { status, priority, equipmentId, dateFrom, dateTo, sort, page, limit } =
    query;
  return requestRepository.findAll({
    filters: { status, priority, equipmentId, dateFrom, dateTo },
    sort,
    page,
    limit,
  });
}

function getRequestById(id) {
  const request = requestRepository.findById(id);
  assertExists(request, id);
  return request;
}

function listByEquipmentId(equipmentId) {
  return requestRepository.findByEquipmentId(equipmentId);
}

function updateRequest(id, patch) {
  const existing = requestRepository.findById(id);
  assertExists(existing, id);
  const { status, ...rest } = patch;
  return requestRepository.update(id, rest);
}

function changeStatus(id, newStatus) {
  const existing = requestRepository.findById(id);
  assertExists(existing, id);

  if (!canTransition(existing.status, newStatus)) {
    throw new ConflictError(
      `Переход из "${existing.status}" в "${newStatus}" недопустим`,
      "INVALID_TRANSITION",
    );
  }

  return requestRepository.update(id, { status: newStatus });
}

function deleteRequest(id) {
  const existing = requestRepository.findById(id);
  assertExists(existing, id);
  return requestRepository.remove(id);
}

function hasOpenRequests(equipmentId) {
  return requestRepository
    .findByEquipmentId(equipmentId)
    .some((r) => OPEN_STATUSES.includes(r.status));
}

function bulkCreateRequests(items, equipmentRepo) {
  return items.map((rawItem, index) => {
    const parsed = createRequestSchema.safeParse(rawItem);

    if (!parsed.success) {
      return {
        index,
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Некорректные данные записи",
          details: parsed.error.issues.map((issue) => ({
            field: issue.path.join(".") || "(root)",
            message: issue.message,
          })),
        },
      };
    }

    const equipment = equipmentRepo.findById(parsed.data.equipmentId);
    if (!equipment) {
      return {
        index,
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Оборудование с id=${parsed.data.equipmentId} не найдено`,
        },
      };
    }

    const { status, ...rest } = parsed.data;
    const created = requestRepository.create(rest);

    return { index, success: true, data: created };
  });
}

export default {
  createRequest,
  listRequests,
  getRequestById,
  listByEquipmentId,
  updateRequest,
  changeStatus,
  deleteRequest,
  hasOpenRequests,
  bulkCreateRequests,
};
