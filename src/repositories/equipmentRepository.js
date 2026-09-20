import { randomUUID } from "crypto";
import { createJsonFileStore } from "./storage/jsonFileStore.js";

const store = createJsonFileStore("equipment.json");

let equipment = store.load();

function persist() {
  store.save(equipment);
}

function create(data) {
  const id = randomUUID();
  const now = new Date().toISOString();
  const entity = { id, ...data, createdAt: now, updatedAt: now };
  equipment.push(entity);
  persist();
  return entity;
}

function findById(id) {
  return equipment.find((e) => e.id === id) ?? null;
}

function findBySerialNumber(serialNumber) {
  return equipment.find((e) => e.serialNumber === serialNumber) ?? null;
}

function findAll({ filters = {}, sort, page = 1, limit = 20 } = {}) {
  let items = [...equipment];

  if (filters.type) items = items.filter((e) => e.type === filters.type);
  if (filters.status) items = items.filter((e) => e.status === filters.status);

  if (sort) {
    const [field, direction] = sort.startsWith("-")
      ? [sort.slice(1), -1]
      : [sort, 1];
    items.sort((a, b) =>
      a[field] > b[field] ? direction : a[field] < b[field] ? -direction : 0,
    );
  }

  const total = items.length;
  const start = (page - 1) * limit;
  const paged = items.slice(start, start + limit);

  return { items: paged, total, page, limit };
}

function update(id, patch) {
  const idx = equipment.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  const updated = {
    ...equipment[idx],
    ...patch,
    id: equipment[idx].id,
    updatedAt: new Date().toISOString(),
  };
  equipment[idx] = updated;
  persist();
  return updated;
}

function remove(id) {
  const idx = equipment.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  equipment.splice(idx, 1);
  persist();
  return true;
}

export default {
  create,
  findById,
  findBySerialNumber,
  findAll,
  update,
  remove,
};
