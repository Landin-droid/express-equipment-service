import requestService from "../services/requestService.js";

async function create(req, res) {
  const request = await requestService.createRequest(req.valid.body);
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
  const result = await requestService.listRequests({
    status,
    priority,
    equipmentId,
    dateFrom,
    dateTo,
    sort,
    page,
    limit,
  });
  res.status(200).json({
    data: result.items,
    meta: { total: result.total, page: result.page, limit: result.limit },
  });
}

async function getById(req, res) {
  const request = await requestService.getRequestById(req.valid.params.id);
  res.status(200).json(request);
}

async function update(req, res) {
  const request = await requestService.updateRequest(
    req.valid.params.id,
    req.valid.body,
  );
  res.status(200).json(request);
}

async function changeStatus(req, res) {
  const request = await requestService.changeStatus(
    req.valid.params.id,
    req.valid.body.status,
    {
      changedBy: req.valid.body.changedBy,
      comment: req.valid.body.comment,
    },
    req.user
  );
  res.status(200).json(request);
}

async function remove(req, res) {
  await requestService.deleteRequest(req.valid.params.id);
  res.status(204).send();
}

async function bulkCreate(req, res) {
  const results = await requestService.bulkCreateRequests(
    req.valid.body.items,
    equipmentRepository,
  );

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.length - successCount;

  res.status(207).json({
    summary: {
      total: results.length,
      succeeded: successCount,
      failed: failureCount,
    },
    results,
  });
}

async function replaceAssignees(req, res) {
  const request = await requestService.replaceAssignees(
    req.valid.params.id,
    req.valid.body.assignees,
  );
  res.status(200).json(request);
}

async function removeAssignee(req, res) {
  await requestService.removeAssignee(
    req.valid.params.id,
    req.valid.params.userId,
  );
  res.status(204).send();
}

async function getHistory(req, res) {
  const history = await requestService.getRequestHistory(req.valid.params.id);
  res.status(200).json({ data: history, meta: { total: history.length } });
}

export default {
  create,
  list,
  getById,
  update,
  changeStatus,
  remove,
  bulkCreate,
  replaceAssignees,
  removeAssignee,
  getHistory,
};
