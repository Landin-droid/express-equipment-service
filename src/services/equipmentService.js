import equipmentRepository from "../repositories/equipmentRepository.js";
import requestService from "./requestService.js";
import { ConflictError } from "../errors/ConflictError.js";
import { NotFoundError } from "../errors/NotFoundError.js";

function assertExists(equipment, id) {
  if (!equipment) {
    throw new NotFoundError(`Оборудование с id=${id} не найдено`);
  }
}

async function createEquipment(data) {
  const existing = await equipmentRepository.findBySerialNumber(data.serialNumber);
  if (existing) {
    throw new ConflictError(
      `Оборудование с серийным номером "${data.serialNumber}" уже существует`,
    );
  }
  return equipmentRepository.create(data);
}

async function listEquipment(query) {
  const { type, status, sort, page, limit } = query;
  return equipmentRepository.findAll({
    filters: { type, status },
    sort,
    page,
    limit,
  });
}

async function getEquipmentById(id) {
  const equipment = await equipmentRepository.findById(id);
  assertExists(equipment, id);
  return equipment;
}

async function updateEquipment(id, patch) {
  const existing = await equipmentRepository.findById(id);
  assertExists(existing, id);

  if (patch.serialNumber && patch.serialNumber !== existing.serialNumber) {
    const clash = await equipmentRepository.findBySerialNumber(patch.serialNumber);
    if (clash) {
      throw new ConflictError(
        `Серийный номер "${patch.serialNumber}" уже занят`,
      );
    }
  }

  return equipmentRepository.update(id, patch);
}

async function deleteEquipment(id) {
  const existing = await equipmentRepository.findById(id);
  assertExists(existing, id);
  return equipmentRepository.remove(id);
}

export default {
  createEquipment,
  listEquipment,
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
};
