import requestService from "../services/requestService.js";
import equipmentRepository from "../repositories/equipmentRepository.js";

async function create(req, res) {
  const request = requestService.createRequest(
    req.valid.body,
    equipmentRepository,
  );
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
  } = req.valid.query;
  const result = requestService.listRequests({
    status,
    priority,
    equipmentId,
    dateFrom,
    dateTo,
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
  const request = requestService.getRequestById(req.valid.params.id);
  res.status(200).json(request);
}

async function update(req, res) {
  const request = requestService.updateRequest(
    req.valid.params.id,
    req.valid.body,
  );
  res.status(200).json(request);
}

async function changeStatus(req, res) {
  const request = requestService.changeStatus(
    req.valid.params.id,
    req.valid.body.status,
  );
  res.status(200).json(request);
}

async function remove(req, res) {
  requestService.deleteRequest(req.valid.params.id);
  res.status(204).send();
}

export default { create, list, getById, update, changeStatus, remove };
