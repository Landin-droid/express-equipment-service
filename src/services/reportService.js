import reportRepository from "../repositories/reportRepository.js";

async function getEquipmentLoad(query) {
  return reportRepository.getEquipmentLoad(query);
}

export default { getEquipmentLoad };