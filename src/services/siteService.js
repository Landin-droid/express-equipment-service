import siteRepository from "../repositories/siteRepository.js";
import { NotFoundError } from "../errors/NotFoundError.js";

async function getSiteSummary(id) {
  const site = await siteRepository.findById(id);
  if (!site) {
    throw new NotFoundError(`Площадка с id=${id} не найдена`);
  }

  const [byStatus, byPriority, averageClosureHours] = await Promise.all([
    siteRepository.countByStatus(id),
    siteRepository.countByPriority(id),
    siteRepository.averageClosureHours(id),
  ]);

  return {
    siteId: site.id,
    siteName: site.name,
    requestsByStatus: byStatus,
    requestsByPriority: byPriority,
    averageClosureHours,
  };
}

export default { getSiteSummary };
