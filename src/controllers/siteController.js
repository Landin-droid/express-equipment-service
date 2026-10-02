import siteService from "../services/siteService.js";

async function getSummary(req, res) {
  const summary = await siteService.getSiteSummary(req.valid.params.id);
  res.status(200).json(summary);
}

export default { getSummary };
