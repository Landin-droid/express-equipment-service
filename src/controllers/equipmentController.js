import equipmentService from "../services/equipmentService.js";
import requestService from "../services/requestService.js";
import weatherService from "../services/weatherService.js";

async function create(req, res) {
  const equipment = equipmentService.createEquipment(req.body);
  res.status(201).location(`/api/equipment/${equipment.id}`).json(equipment);
}

async function list(req, res) {
  const { type, status, sort, page = 1, limit = 20 } = req.query;
  const result = equipmentService.listEquipment({
    type,
    status,
    sort,
    page: Number(page),
    limit: Number(limit),
  });
  res
    .status(200)
    .json({
      data: result.items,
      meta: { total: result.total, page: result.page, limit: result.limit },
    });
}

async function getById(req, res) {
  const equipment = equipmentService.getEquipmentById(req.params.id);
  res.status(200).json(equipment);
}

async function update(req, res) {
  const equipment = equipmentService.updateEquipment(req.params.id, req.body);
  res.status(200).json(equipment);
}

async function remove(req, res) {
  equipmentService.deleteEquipment(req.params.id);
  res.status(204).send();
}

async function getWeather(req, res) {
  const equipment = equipmentService.getEquipmentById(req.params.id);
  const days = req.query.days ? Number(req.query.days) : 3;
  const forecast = await weatherService.getForecastForLocation(
    equipment.location,
    days,
  );
  res
    .status(200)
    .json({
      equipmentId: equipment.id,
      location: equipment.location,
      forecast,
    });
}

async function getRequests(req, res) {
  equipmentService.getEquipmentById(req.params.id);
  const requests = requestService.listByEquipmentId(req.params.id);
  res.status(200).json({ data: requests, meta: { total: requests.length } });
}

export default {
  create,
  list,
  getById,
  update,
  remove,
  getWeather,
  getRequests,
};
