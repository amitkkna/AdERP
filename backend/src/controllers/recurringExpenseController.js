const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const { parsePagination, paginatedResponse, successResponse } = require('../utils/helpers');

const prisma = new PrismaClient();

const assetSelect = { id: true, code: true, name: true, type: true, locationCity: true };

// GET /recurring-expenses
exports.getRecurringExpenses = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { assetId, category, status } = req.query;

    const where = { isActive: true };
    if (assetId) where.assetId = parseInt(assetId);
    if (category) where.category = category;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (status === 'overdue') {
      where.nextDueDate = { lt: today };
    } else if (status === 'upcoming') {
      where.nextDueDate = {
        gte: today,
        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
    }

    const [items, total] = await Promise.all([
      prisma.recurringExpense.findMany({
        where,
        include: { asset: { select: assetSelect } },
        skip,
        take: limit,
        orderBy: { nextDueDate: 'asc' },
      }),
      prisma.recurringExpense.count({ where }),
    ]);

    res.json(paginatedResponse(items, total, page, limit));
  } catch (error) {
    next(error);
  }
};

// POST /recurring-expenses
exports.createRecurringExpense = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const { assetId, category, frequency, amount, description, startDate } = req.body;

    const asset = await prisma.asset.findUnique({ where: { id: parseInt(assetId) } });
    if (!asset || !asset.isActive) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    const item = await prisma.recurringExpense.create({
      data: {
        assetId: parseInt(assetId),
        category,
        frequency,
        amount: parseFloat(amount),
        description,
        startDate: new Date(startDate),
        nextDueDate: new Date(startDate),
      },
      include: { asset: { select: assetSelect } },
    });

    res.status(201).json(successResponse(item, 'Recurring schedule created successfully.'));
  } catch (error) {
    next(error);
  }
};

// PUT /recurring-expenses/:id
exports.updateRecurringExpense = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const id = parseInt(req.params.id);
    const { amount, frequency, description, isActive } = req.body;

    const data = {};
    if (amount !== undefined) data.amount = parseFloat(amount);
    if (frequency) data.frequency = frequency;
    if (description !== undefined) data.description = description;
    if (isActive !== undefined) data.isActive = isActive;

    const item = await prisma.recurringExpense.update({
      where: { id },
      data,
      include: { asset: { select: assetSelect } },
    });

    res.json(successResponse(item, 'Recurring schedule updated successfully.'));
  } catch (error) {
    next(error);
  }
};

// DELETE /recurring-expenses/:id (soft delete)
exports.deleteRecurringExpense = async (req, res, next) => {
  try {
    await prisma.recurringExpense.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: false },
    });

    res.json(successResponse(null, 'Recurring schedule deleted successfully.'));
  } catch (error) {
    next(error);
  }
};

// POST /recurring-expenses/:id/mark-paid
exports.markAsPaid = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.recurringExpense.findUnique({ where: { id } });

    if (!existing || !existing.isActive) {
      return res.status(404).json({ success: false, message: 'Recurring schedule not found.' });
    }

    const current = new Date(existing.nextDueDate);
    let next;

    switch (existing.frequency) {
      case 'MONTHLY':
        next = new Date(current);
        next.setMonth(next.getMonth() + 1);
        break;
      case 'QUARTERLY':
        next = new Date(current);
        next.setMonth(next.getMonth() + 3);
        break;
      case 'HALF_YEARLY':
        next = new Date(current);
        next.setMonth(next.getMonth() + 6);
        break;
      case 'YEARLY':
        next = new Date(current);
        next.setFullYear(next.getFullYear() + 1);
        break;
      default:
        next = new Date(current);
        next.setMonth(next.getMonth() + 1);
    }

    const item = await prisma.recurringExpense.update({
      where: { id },
      data: { nextDueDate: next },
      include: { asset: { select: assetSelect } },
    });

    res.json(successResponse(item, `Marked as paid. Next due: ${next.toISOString().split('T')[0]}`));
  } catch (error) {
    next(error);
  }
};

// GET /recurring-expenses/upcoming
exports.getUpcomingDues = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const items = await prisma.recurringExpense.findMany({
      where: {
        isActive: true,
        nextDueDate: { lte: thirtyDaysFromNow },
      },
      include: { asset: { select: assetSelect } },
      orderBy: { nextDueDate: 'asc' },
    });

    const overdue = [];
    const upcoming = [];

    for (const item of items) {
      const due = new Date(item.nextDueDate);
      due.setHours(0, 0, 0, 0);
      if (due < today) {
        overdue.push({ ...item, status: 'OVERDUE', daysOverdue: Math.ceil((today - due) / (1000 * 60 * 60 * 24)) });
      } else {
        const daysUntilDue = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
        upcoming.push({ ...item, status: daysUntilDue <= 7 ? 'DUE_SOON' : 'UPCOMING', daysUntilDue });
      }
    }

    const overdueTotal = overdue.reduce((sum, i) => sum + parseFloat(i.amount), 0);
    const upcomingTotal = upcoming.reduce((sum, i) => sum + parseFloat(i.amount), 0);

    res.json(successResponse({
      summary: {
        overdueCount: overdue.length,
        overdueTotal: Math.round(overdueTotal),
        upcomingCount: upcoming.length,
        upcomingTotal: Math.round(upcomingTotal),
        totalCount: items.length,
        totalAmount: Math.round(overdueTotal + upcomingTotal),
      },
      overdue,
      upcoming,
    }));
  } catch (error) {
    next(error);
  }
};
