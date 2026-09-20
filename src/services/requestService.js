import requestRepository from "../repositories/requestRepository.js";
import { HttpError } from "../errors/httpError.js";
import { canTransition } from "./statusTransitions.js";

const OPEN_STATUSES = ["new", "in_progress"];

function assertExists(request, id) {
  if (!request) {
    throw new HttpError(404, "NOT_FOUND", `Заявка с id=${id} не найдена`);
  }
}

function createRequest(data, equipmentRepository) {
  const equipment = equipmentRepository.findById(data.equipmentId);
  if (!equipment) {
    throw new HttpError(
      404,
      "NOT_FOUND",
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
    throw new HttpError(
      409,
      "INVALID_TRANSITION",
      `Переход из "${existing.status}" в "${newStatus}" недопустим`,
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

export default {
  createRequest,
  listRequests,
  getRequestById,
  listByEquipmentId,
  updateRequest,
  changeStatus,
  deleteRequest,
  hasOpenRequests,
};
