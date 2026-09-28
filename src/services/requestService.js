import requestRepository from "../repositories/requestRepository.js";
import { canTransition } from "./statusTransitions.js";
import { AppError } from "../errors/AppError.js";
import { ConflictError } from "../errors/ConflictError.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { createRequestSchema } from "../validators/requestValidators.js";

const OPEN_STATUSES = ["new", "in_progress"];

function assertExists(request, id) {
  if (!request) {
    throw new NotFoundError(`Заявка с id=${id} не найдена`);
  }
}

async function createRequest(data, equipmentRepository) {
  const equipment = await equipmentRepository.findById(data.equipmentId);
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

async function getRequestById(id) {
  const request = await requestRepository.findById(id);
  assertExists(request, id);
  return request;
}

function listByEquipmentId(equipmentId) {
  return requestRepository.findByEquipmentId(equipmentId);
}

async function updateRequest(id, patch) {
  const existing = await requestRepository.findById(id);
  assertExists(existing, id);
  const { status, ...rest } = patch;
  return requestRepository.update(id, rest);
}

async function changeStatus(id, newStatus) {
  const existing = await requestRepository.findById(id);
  assertExists(existing, id);

  if (!canTransition(existing.status, newStatus)) {
    throw new ConflictError(
      `Переход из "${existing.status}" в "${newStatus}" недопустим`,
      "INVALID_TRANSITION",
    );
  }

  return requestRepository.changeStatus(id, newStatus);
}

async function deleteRequest(id) {
  const existing = await requestRepository.findById(id);
  assertExists(existing, id);
  return requestRepository.remove(id);
}

async function hasOpenRequests(equipmentId) {
  const requests = await requestRepository.findByEquipmentId(equipmentId);
  return requests.some((r) => OPEN_STATUSES.includes(r.status));
}

async function bulkCreateRequests(items) {
  const results = [];
  // Последовательно, каждая запись в своей транзакции (внутри repository.create):
  // ошибка одной записи не влияет на остальные — это и есть частичный успех.
  for (const [index, rawItem] of items.entries()) {
    const parsed = createRequestSchema.safeParse(rawItem);
    if (!parsed.success) {
      results.push({
        index,
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Некорректные данные записи",
          details: parsed.error.issues.map((i) => ({
            field: i.path.join(".") || "(root)",
            message: i.message,
          })),
        },
      });
      continue;
    }
    try {
      results.push({
        index,
        success: true,
        data: await requestRepository.create(parsed.data),
      });
    } catch (err) {
      if (!(err instanceof AppError)) throw err; // непредвиденное -> 500, а не "тихий" провал записи
      results.push({
        index,
        success: false,
        error: { code: err.code, message: err.message },
      });
    }
  }
  return results;
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
