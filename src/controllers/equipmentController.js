import equipmentService from "../services/equipmentService.js";
import requestService from "../services/requestService.js";
import weatherService from "../services/weatherService.js";

async function create(req, res) {
  const equipment = equipmentService.createEquipment(req.valid.body);
  res.status(201).location(`/api/equipment/${equipment.id}`).json(equipment);
}

async function list(req, res) {
  const { type, status, sort, page = 1, limit = 20 } = req.valid.query;
  const result = equipmentService.listEquipment({
    type,
    status,
    sort,
    page,
    limit,
  });
  res
    .status(200)
    .json({
      data: result.items,
      meta: { total: result.total, page: result.page, limit: result.limit },
    });
}

async function getById(req, res) {
  const equipment = equipmentService.getEquipmentById(req.valid.params.id);
  res.status(200).json(equipment);
}

async function update(req, res) {
  const equipment = equipmentService.updateEquipment(
    req.valid.params.id,
    req.valid.body,
  );
  res.status(200).json(equipment);
}

async function remove(req, res) {
  equipmentService.deleteEquipment(req.valid.params.id);
  res.status(204).send();
}

async function getWeather(req, res) {
  const equipment = equipmentService.getEquipmentById(req.valid.params.id);
  // days не входит в валидируемую схему params — это некритичный опциональный
  // query-параметр, читаем его напрямую из req.query (он не мутировался).
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
  equipmentService.getEquipmentById(req.valid.params.id);
  const requests = requestService.listByEquipmentId(req.valid.params.id);
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
