import { randomUUID } from "crypto";
import { createJsonFileStore } from "./storage/jsonFileStore.js";

const store = createJsonFileStore("requests.json");
let requests = store.load();

function persist() {
  store.save(requests);
}

function create(data) {
  const id = randomUUID();
  const now = new Date().toISOString();
  const entity = {
    id,
    status: "new",
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  requests.push(entity);
  persist();
  return entity;
}

function findById(id) {
  return requests.find((r) => r.id === id) ?? null;
}

function findByEquipmentId(equipmentId) {
  return requests.filter((r) => r.equipmentId === equipmentId);
}

function findAll({ filters = {}, sort, page = 1, limit = 20 } = {}) {
  let items = [...requests];

  if (filters.status) items = items.filter((r) => r.status === filters.status);
  if (filters.priority)
    items = items.filter((r) => r.priority === filters.priority);
  if (filters.equipmentId)
    items = items.filter((r) => r.equipmentId === filters.equipmentId);
  if (filters.dateFrom)
    items = items.filter((r) => r.createdAt >= filters.dateFrom);
  if (filters.dateTo)
    items = items.filter((r) => r.createdAt <= filters.dateTo);

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
  const idx = requests.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const updated = {
    ...requests[idx],
    ...patch,
    id: requests[idx].id,
    updatedAt: new Date().toISOString(),
  };
  requests[idx] = updated;
  persist();
  return updated;
}

function remove(id) {
  const idx = requests.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  requests.splice(idx, 1);
  persist();
  return true;
}

export default { create, findById, findByEquipmentId, findAll, update, remove };
