import { UniqueConstraintError, ForeignKeyConstraintError } from "sequelize";
import {
  Equipment,
  Site,
  MaintenanceRequest,
  sequelize,
} from "../models/index.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";
import crypto from "crypto";
import { Op } from "sequelize";

const EQUIPMENT_ATTRIBUTES = [
  "id",
  "siteId",
  "name",
  "type",
  "serialNumber",
  "status",
  "installedAt",
  "createdAt",
  "updatedAt",
];
const SITE_ATTRIBUTES = [
  "id",
  "name",
  "code",
  "region",
  "latitude",
  "longitude",
];
const SITE_INCLUDE = { association: "site", attributes: SITE_ATTRIBUTES };
const PASSPORT_ATTRIBUTES = [
  "manufacturer",
  "model",
  "ratedPower",
  "lastInspectionAt",
];

const PASSPORT_INCLUDE = {
  association: "passport",
  attributes: PASSPORT_ATTRIBUTES,
};

function toApiShape(instance) {
  const plain = instance.get({ plain: true });
  const site = plain.site;
  const passport = plain.passport;
  return {
    id: plain.id,
    siteId: plain.siteId,
    name: plain.name,
    type: plain.type,
    serialNumber: plain.serialNumber,
    location: site
      ? { lat: Number(site.latitude), lon: Number(site.longitude) }
      : null,
    status: plain.status,
    installedAt: plain.installedAt,
    passport: passport
      ? {
          id: passport.id,
          manufacturer: passport.manufacturer,
          model: passport.model,
          ratedPower: Number(passport.ratedPower),
          lastInspectionAt: passport.lastInspectionAt,
        }
      : null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

async function resolveSiteId({ siteId, location }) {
  if (siteId) return siteId;

  const codeSeed = crypto
    .createHash("sha1")
    .update(`${location.lat},${location.lon}`)
    .digest("hex")
    .slice(0, 10);

  const [site] = await Site.findOrCreate({
    where: { latitude: location.lat, longitude: location.lon },
    defaults: {
      name: `Автоплощадка (${location.lat}, ${location.lon})`,
      code: `AUTO-${codeSeed}`,
      region: null,
      latitude: location.lat,
      longitude: location.lon,
    },
  });

  return site.id;
}

async function create(data) {
  const siteId = await resolveSiteId(data);

  try {
    const created = await Equipment.create({
      siteId,
      name: data.name,
      type: data.type,
      serialNumber: data.serialNumber,
      status: data.status,
      installedAt: data.installedAt,
    });

    return findById(created.id);
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      throw new ConflictError(
        `Оборудование с серийным номером "${data.serialNumber}" уже существует`,
      );
    }
    if (err instanceof ForeignKeyConstraintError) {
      throw new NotFoundError("Указанная площадка не найдена");
    }
    throw err;
  }
}

async function findById(id) {
  const equipment = await Equipment.findByPk(id, {
    attributes: EQUIPMENT_ATTRIBUTES,
    include: [SITE_INCLUDE, PASSPORT_INCLUDE],
  });
  return equipment ? toApiShape(equipment) : null;
}

async function findBySerialNumber(serialNumber) {
  const equipment = await Equipment.findOne({
    where: { serialNumber },
    attributes: EQUIPMENT_ATTRIBUTES,
    include: [SITE_INCLUDE, PASSPORT_INCLUDE],
  });
  return equipment ? toApiShape(equipment) : null;
}

async function findAll({ filters = {}, sort, page = 1, limit = 20 } = {}) {
  const where = {};
  if (filters.type) where.type = filters.type;
  if (filters.status) where.status = filters.status;

  const order = sort
    ? [[sort.replace(/^-/, ""), sort.startsWith("-") ? "DESC" : "ASC"]]
    : [["createdAt", "DESC"]];

  const { rows, count } = await Equipment.findAndCountAll({
    where,
    order,
    limit,
    offset: (page - 1) * limit,
    attributes: EQUIPMENT_ATTRIBUTES,
    include: [SITE_INCLUDE, PASSPORT_INCLUDE],
    distinct: true,
  });

  return { items: rows.map(toApiShape), total: count, page, limit };
}

async function update(id, patch) {
  const equipment = await Equipment.findByPk(id);
  if (!equipment) return null;

  const needsSiteResolve =
    patch.siteId !== undefined || patch.location !== undefined;
  const nextSiteId = needsSiteResolve ? await resolveSiteId(patch) : undefined;

  try {
    await equipment.update({
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.type !== undefined && { type: patch.type }),
      ...(patch.serialNumber !== undefined && {
        serialNumber: patch.serialNumber,
      }),
      ...(patch.status !== undefined && { status: patch.status }),
      ...(patch.installedAt !== undefined && {
        installedAt: patch.installedAt,
      }),
      ...(nextSiteId !== undefined && { siteId: nextSiteId }),
    });
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      throw new ConflictError(
        `Серийный номер "${patch.serialNumber}" уже занят`,
      );
    }

    if (err instanceof ForeignKeyConstraintError) {
      throw new NotFoundError("Указанная площадка не найдена");
    }

    throw err;
  }

  return findById(id);
}

async function remove(id) {
  return sequelize.transaction(async (t) => {
    const equipment = await Equipment.findByPk(id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!equipment) return false;

    const openCount = await MaintenanceRequest.count({
      where: { equipmentId: id, status: { [Op.in]: ["new", "in_progress"] } },
      transaction: t,
    });
    if (openCount > 0) {
      throw new ConflictError(
        "Нельзя удалить оборудование с незакрытыми заявками",
      );
    }

    await equipment.destroy({ transaction: t });
    return true;
  });
}

export default {
  create,
  findById,
  findBySerialNumber,
  findAll,
  update,
  remove,
};
