import equipmentRepository from "../repositories/equipmentRepository.js";
import requestService from "./requestService.js";
import { HttpError } from "../errors/httpError.js";

function assertExists(equipment, id) {
  if (!equipment) {
    throw new HttpError(404, "NOT_FOUND", `Оборудование с id=${id} не найдено`);
  }
}

function createEquipment(data) {
  const existing = equipmentRepository.findBySerialNumber(data.serialNumber);
  if (existing) {
    throw new HttpError(
      409,
      "CONFLICT",
      `Оборудование с серийным номером "${data.serialNumber}" уже существует`,
    );
  }
  return equipmentRepository.create(data);
}

function listEquipment(query) {
  const { type, status, sort, page, limit } = query;
  return equipmentRepository.findAll({
    filters: { type, status },
    sort,
    page,
    limit,
  });
}

function getEquipmentById(id) {
  const equipment = equipmentRepository.findById(id);
  assertExists(equipment, id);
  return equipment;
}

function updateEquipment(id, patch) {
  const existing = equipmentRepository.findById(id);
  assertExists(existing, id);

  if (patch.serialNumber && patch.serialNumber !== existing.serialNumber) {
    const clash = equipmentRepository.findBySerialNumber(patch.serialNumber);
    if (clash) {
      throw new HttpError(
        409,
        "CONFLICT",
        `Серийный номер "${patch.serialNumber}" уже занят`,
      );
    }
  }

  return equipmentRepository.update(id, patch);
}

function deleteEquipment(id) {
  const existing = equipmentRepository.findById(id);
  assertExists(existing, id);

  if (requestService.hasOpenRequests(id)) {
    throw new HttpError(
      409,
      "CONFLICT",
      "Нельзя удалить оборудование, по которому есть незакрытые заявки",
    );
  }

  return equipmentRepository.remove(id);
}

export default {
  createEquipment,
  listEquipment,
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
};
