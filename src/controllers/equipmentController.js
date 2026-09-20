import equipmentService from "../services/equipmentService.js";
import weatherService from "../services/weatherService.js";

function create(req, res, next) {
  try {
    const equipment = equipmentService.createEquipment(req.body);
    res.status(201).location(`/api/equipment/${equipment.id}`).json(equipment);
  } catch (err) {
    next(err);
  }
}

function list(req, res, next) {
  try {
    const { type, status, sort, page = 1, limit = 20 } = req.query;
    const result = equipmentService.listEquipment({
      type,
      status,
      sort,
      page: Number(page),
      limit: Number(limit),
    });
    res.status(200).json({
      data: result.items,
      meta: { total: result.total, page: result.page, limit: result.limit },
    });
  } catch (err) {
    next(err);
  }
}

function getById(req, res, next) {
  try {
    const equipment = equipmentService.getEquipmentById(req.params.id);
    res.status(200).json(equipment);
  } catch (err) {
    next(err);
  }
}

function update(req, res, next) {
  try {
    const equipment = equipmentService.updateEquipment(req.params.id, req.body);
    res.status(200).json(equipment);
  } catch (err) {
    next(err);
  }
}

function remove(req, res, next) {
  try {
    equipmentService.deleteEquipment(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function getWeather(req, res, next) {
  try {
    const equipment = equipmentService.getEquipmentById(req.params.id);
    const days = req.query.days ? Number(req.query.days) : 3;
    const forecast = await weatherService.getForecastForLocation(
      equipment.location,
      days,
    );
    res.status(200).json({
      equipmentId: equipment.id,
      location: equipment.location,
      forecast,
    });
  } catch (err) {
    next(err);
  }
}

export default { create, list, getById, update, remove, getWeather };
