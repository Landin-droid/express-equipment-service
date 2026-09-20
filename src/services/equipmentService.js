import equipmentRepository from "../repositories/equipmentRepository.js";
import requestService from "./requestService.js";
import { ConflictError } from "../errors/ConflictError.js";
import { NotFoundError } from "../errors/NotFoundError.js";

function assertExists(equipment, id) {
  if (!equipment) {
    throw new NotFoundError(`Оборудование с id=${id} не найдено`);
  }
}

function createEquipment(data) {
  const existing = equipmentRepository.findBySerialNumber(data.serialNumber);
  if (existing) {
    throw new ConflictError(
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
      throw new ConflictError(
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
    throw new ConflictError(
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
