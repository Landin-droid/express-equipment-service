import reportService from "../services/reportService.js";

async function getEquipmentLoad(req, res) {
  const { limit, offset } = req.valid.query;
  const result = await reportService.getEquipmentLoad(req.valid.query);
  res.status(200).json({
    data: result.data,
    meta: { total: result.total, limit, offset },
  });
}

export default { getEquipmentLoad };