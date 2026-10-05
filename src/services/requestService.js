import requestRepository from "../repositories/requestRepository.js";
import { canTransition } from "./statusTransitions.js";
import { AppError } from "../errors/AppError.js";
import { ConflictError } from "../errors/ConflictError.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { createRequestSchema } from "../validators/requestValidators.js";
import { RequestAssignee } from "../models/index.js";
import { ForbiddenError } from "../errors/ForbiddenError.js";
import { canChangeRequestStatus } from "./authorization.js";

function assertExists(request, id) {
  if (!request) {
    throw new NotFoundError(`Заявка с id=${id} не найдена`);
  }
}

async function createRequest(data) {
  return requestRepository.create(data);
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

async function changeStatus(id, newStatus, meta, actingUser) {
  const existing = await requestRepository.findById(id);
  assertExists(existing, id);

  let isAssignedTechnician = false;
  if (actingUser.role === "technician") {
    const assignment = await RequestAssignee.findOne({
      where: { requestId: id, technicianId: actingUser.technicianId },
    });
    isAssignedTechnician = Boolean(assignment);
  }

  if (!canChangeRequestStatus(actingUser.role, { isAssignedTechnician })) {
    throw new ForbiddenError("Вы не назначены на эту заявку");
  }
  
  if (!canTransition(existing.status, newStatus)) {
    throw new ConflictError(
      `Переход из "${existing.status}" в "${newStatus}" недопустим`,
      "INVALID_TRANSITION",
    );
  }

  return requestRepository.changeStatus(id, newStatus, meta);
}

async function deleteRequest(id) {
  const existing = await requestRepository.findById(id);
  assertExists(existing, id);
  return requestRepository.remove(id);
}

async function bulkCreateRequests(items) {
  const results = [];
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
      if (!(err instanceof AppError)) throw err;
      results.push({
        index,
        success: false,
        error: { code: err.code, message: err.message },
      });
    }
  }
  return results;
}

async function replaceAssignees(id, assignees) {
  return requestRepository.replaceAssignees(id, assignees);
}

async function removeAssignee(id, technicianId) {
  return requestRepository.removeAssignee(id, technicianId);
}

async function getRequestHistory(id) {
  const existing = await requestRepository.findById(id);
  assertExists(existing, id);
  return requestRepository.findHistoryByRequestId(id);
}

export default {
  createRequest,
  listRequests,
  getRequestById,
  listByEquipmentId,
  updateRequest,
  changeStatus,
  deleteRequest,
  bulkCreateRequests,
  replaceAssignees,
  removeAssignee,
  getRequestHistory,
};
