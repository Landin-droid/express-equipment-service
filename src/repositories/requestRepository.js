import {
  Op,
  ForeignKeyConstraintError,
  UniqueConstraintError,
} from "sequelize";
import {
  sequelize,
  MaintenanceRequest,
  RequestStatusHistory,
  RequestAssignee,
} from "../models/index.js";
import { resolveTechnicianId } from "./systemTechnician.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";
import { ValidationError } from "../errors/ValidationError.js";
import { canTransition } from "../services/statusTransitions.js";
import { assertValidAssigneeComposition } from "../services/assigneeValidation.js";

const REQUEST_ATTRIBUTES = [
  "id",
  "equipmentId",
  "createdBy",
  "title",
  "description",
  "priority",
  "status",
  "plannedAt",
  "createdAt",
  "updatedAt",
];
const ASSIGNEE_INCLUDE = {
  association: "assignees",
  attributes: ["id", "firstName", "lastName", "specialization"],
  through: { attributes: ["role", "plannedHours"] },
};

const HISTORY_ATTRIBUTES = ['id', 'requestId', 'changedBy', 'oldStatus', 'newStatus', 'comment', 'changedAt'];
const HISTORY_AUTHOR_INCLUDE = {
  association: 'changedByTechnician',
  attributes: ['id', 'firstName', 'lastName', 'specialization'],
};

function toApiShape(instance, { withAssignees = false } = {}) {
  const plain = instance.get({ plain: true });
  const shape = {
    id: plain.id,
    equipmentId: plain.equipmentId,
    createdBy: plain.createdBy,
    title: plain.title,
    description: plain.description,
    priority: plain.priority,
    status: plain.status,
    plannedAt: plain.plannedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
  if (withAssignees) {
    shape.assignees = (plain.assignees || []).map((a) => ({
      id: a.id,
      firstName: a.firstName,
      lastName: a.lastName,
      specialization: a.specialization,
      role: a.RequestAssignee?.role,
      plannedHours: a.RequestAssignee?.plannedHours,
    }));
  }
  return shape;
}

function foreignKeyErrorMessage(err) {
  const column = err.fields ? Object.keys(err.fields)[0] : null;
  if (column === "equipment_id") return "Оборудование не найдено";
  if (column === "created_by" || column === "changed_by")
    return "Указанный специалист не найден";
  return "Связанная запись не найдена";
}

async function create(data) {
  const createdBy = await resolveTechnicianId(data.createdBy);

  try {
    const created = await sequelize.transaction(async (t) => {
      const request = await MaintenanceRequest.create(
        {
          equipmentId: data.equipmentId,
          createdBy,
          title: data.title,
          description: data.description,
          priority: data.priority,
          plannedAt: data.plannedAt,
        },
        { transaction: t },
      );

      await RequestStatusHistory.create(
        {
          requestId: request.id,
          changedBy: createdBy,
          oldStatus: null,
          newStatus: "new",
          comment: "Заявка создана",
        },
        { transaction: t },
      );

      return request;
    });

    return findById(created.id);
  } catch (err) {
    if (err instanceof ForeignKeyConstraintError) {
      throw new NotFoundError(foreignKeyErrorMessage(err));
    }
    throw err;
  }
}

async function findById(id) {
  const request = await MaintenanceRequest.findByPk(id, {
    attributes: REQUEST_ATTRIBUTES,
    include: [ASSIGNEE_INCLUDE],
  });
  return request ? toApiShape(request, { withAssignees: true }) : null;
}

async function findByEquipmentId(equipmentId) {
  const requests = await MaintenanceRequest.findAll({
    where: { equipmentId },
    attributes: REQUEST_ATTRIBUTES,
    include: [ASSIGNEE_INCLUDE],
    order: [["createdAt", "DESC"]],
  });
  return requests.map((r) => toApiShape(r, { withAssignees: true }));
}

async function findAll({ filters = {}, sort, page = 1, limit = 20 } = {}) {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.equipmentId) where.equipmentId = filters.equipmentId;
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt[Op.gte] = filters.dateFrom;
    if (filters.dateTo) where.createdAt[Op.lte] = filters.dateTo;
  }

  const order = sort
    ? [[sort.replace(/^-/, ""), sort.startsWith("-") ? "DESC" : "ASC"]]
    : [["createdAt", "DESC"]];

  const { rows, count } = await MaintenanceRequest.findAndCountAll({
    where,
    order,
    limit,
    offset: (page - 1) * limit,
    attributes: REQUEST_ATTRIBUTES,
  });

  return { items: rows.map((r) => toApiShape(r)), total: count, page, limit };
}

async function update(id, patch) {
  const request = await MaintenanceRequest.findByPk(id);
  if (!request) return null;

  await request.update({
    ...(patch.title !== undefined && { title: patch.title }),
    ...(patch.description !== undefined && { description: patch.description }),
    ...(patch.priority !== undefined && { priority: patch.priority }),
    ...(patch.plannedAt !== undefined && { plannedAt: patch.plannedAt }),
  });

  return findById(id);
}

async function changeStatus(id, newStatus, { changedBy, comment } = {}) {
  const changedByResolved = await resolveTechnicianId(changedBy);

  let updated;

  try {
    updated = await sequelize.transaction(async (t) => {
      const request = await MaintenanceRequest.findByPk(id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!request) {
        throw new NotFoundError(`Заявка с id=${id} не найдена`);
      }

      if (!canTransition(request.status, newStatus)) {
        throw new ConflictError(
          `Переход из "${request.status}" в "${newStatus}" недопустим`,
          "INVALID_TRANSITION",
        );
      }

      if (newStatus === "in_progress") {
        const assigneeCount = await RequestAssignee.count({
          where: { requestId: id },
          transaction: t,
        });
        if (assigneeCount === 0) {
          throw new ConflictError(
            "Нельзя изменить статус заявки без назначенных исполнителей",
            "ASSIGNEES_REQUIRED",
          );
        }
      }
      
      const oldStatus = request.status;
      await request.update({ status: newStatus }, { transaction: t });

      await RequestStatusHistory.create(
        {
          requestId: id,
          changedBy: changedByResolved,
          oldStatus,
          newStatus,
          comment: comment ?? null,
        },
        { transaction: t },
      );

      return request;
    });
  } catch (err) {
    if (err instanceof ForeignKeyConstraintError) {
      throw new NotFoundError(foreignKeyErrorMessage(err));
    }
    throw err;
  }
  return findById(updated.id);
}

async function remove(id) {
  const deletedCount = await MaintenanceRequest.destroy({ where: { id } });
  return deletedCount > 0;
}

async function replaceAssignees(requestId, assignees) {
  const composition = assertValidAssigneeComposition(assignees);
  if (!composition.valid) {
    throw new ValidationError({
      issues: [
        {
          path: ["assignees"],
          message:
            composition.reason === "DUPLICATE_TECHNICIAN"
              ? "Специалист указан в бригаде более одного раза"
              : "В бригаде должен быть ровно один специалист с ролью lead",
        },
      ],
    });
  }

  try {
    await sequelize.transaction(async (t) => {
      const request = await MaintenanceRequest.findByPk(requestId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!request)
        throw new NotFoundError(`Заявка с id=${requestId} не найдена`);

      await RequestAssignee.destroy({ where: { requestId }, transaction: t });
      await RequestAssignee.bulkCreate(
        assignees.map((a) => ({
          requestId,
          technicianId: a.technicianId,
          role: a.role,
          plannedHours: a.plannedHours ?? 0,
        })),
        { transaction: t },
      );

      const leadCount = await RequestAssignee.count({
        where: { requestId, role: "lead" },
        transaction: t,
      });
      if (leadCount !== 1) {
        throw new ValidationError({
          issues: [
            {
              path: ["assignees"],
              message:
                "В бригаде должен быть ровно один специалист с ролью lead",
            },
          ],
        });
      }
    });
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      throw new ConflictError("Специалист указан в бригаде более одного раза");
    }
    if (err instanceof ForeignKeyConstraintError) {
      throw new NotFoundError("Указанный специалист не найден");
    }
    throw err;
  }
  return findById(requestId);
}

async function removeAssignee(requestId, technicianId) {
  await sequelize.transaction(async (t) => {
    const request = await MaintenanceRequest.findByPk(requestId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!request)
      throw new NotFoundError(`Заявка с id=${requestId} не найдена`);

    const deleted = await RequestAssignee.destroy({
      where: { requestId, technicianId },
      transaction: t,
    });
    if (deleted === 0)
      throw new NotFoundError("Специалист не назначен на эту заявку");
  });
  return findById(requestId);
}

async function findHistoryByRequestId(requestId) {
  const history = await RequestStatusHistory.findAll({
    where: { requestId },
    attributes: HISTORY_ATTRIBUTES,
    include: [HISTORY_AUTHOR_INCLUDE],
    order: [['changedAt', 'ASC']],
  });

  return history.map((h) => {
    const plain = h.get({ plain: true });
    return {
      id: plain.id,
      oldStatus: plain.oldStatus,
      newStatus: plain.newStatus,
      comment: plain.comment,
      changedAt: plain.changedAt,
      changedBy: plain.changedByTechnician
        ? {
            id: plain.changedByTechnician.id,
            firstName: plain.changedByTechnician.firstName,
            lastName: plain.changedByTechnician.lastName,
            specialization: plain.changedByTechnician.specialization,
          }
        : null,
    };
  });
}

export default {
  create,
  findById,
  findByEquipmentId,
  findAll,
  update,
  changeStatus,
  remove,
  replaceAssignees,
  removeAssignee,
  findHistoryByRequestId,
};
