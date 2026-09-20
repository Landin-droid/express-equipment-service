import requestService from "../services/requestService.js";
import equipmentRepository from "../repositories/equipmentRepository.js";

async function create(req, res) {
  const request = requestService.createRequest(req.body, equipmentRepository);
  res.status(201).location(`/api/requests/${request.id}`).json(request);
}

async function list(req, res) {
  const {
    status,
    priority,
    equipmentId,
    dateFrom,
    dateTo,
    sort,
    page = 1,
    limit = 20,
  } = req.query;
  const result = requestService.listRequests({
    status,
    priority,
    equipmentId,
    dateFrom,
    dateTo,
    sort,
    page: Number(page),
    limit: Number(limit),
  });
  res.status(200).json({
    data: result.items,
    meta: { total: result.total, page: result.page, limit: result.limit },
  });
}

async function getById(req, res) {
  const request = requestService.getRequestById(req.params.id);
  res.status(200).json(request);
}

async function update(req, res) {
  const request = requestService.updateRequest(req.params.id, req.body);
  res.status(200).json(request);
}

async function changeStatus(req, res) {
  const request = requestService.changeStatus(req.params.id, req.body.status);
  res.status(200).json(request);
}

async function remove(req, res) {
  requestService.deleteRequest(req.params.id);
  res.status(204).send();
}

export default { create, list, getById, update, changeStatus, remove };
