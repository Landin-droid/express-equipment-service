import requestRepository from "../repositories/requestRepository.js";
import { canTransition } from "./statusTransitions.js";
import { ConflictError } from "../errors/ConflictError.js";
import { NotFoundError } from "../errors/NotFoundError.js";

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
