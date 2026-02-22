const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const { parsePagination, paginatedResponse, successResponse } = require('../utils/helpers');

const prisma = new PrismaClient();

exports.getExpenses = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { search, assetId, category, startDate, endDate, sortBy, sortOrder } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { vendor: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (assetId) where.assetId = parseInt(assetId);
    if (category) where.category = category;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const orderBy = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.date = 'desc';
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          asset: { select: { id: true, code: true, name: true, type: true } },
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.expense.count({ where }),
    ]);

    res.json(paginatedResponse(expenses, total, page, limit));
  } catch (error) {
    next(error);
  }
};

exports.getExpense = async (req, res, next) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        asset: { select: { id: true, code: true, name: true, type: true, locationCity: true } },
      },
    });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    }

    res.json(successResponse(expense));
  } catch (error) {
    next(error);
  }
};

exports.createExpense = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const { category, amount, date, assetId, description, vendor, reference, notes } = req.body;

    // Verify asset exists
    const asset = await prisma.asset.findUnique({ where: { id: parseInt(assetId) } });
    if (!asset || !asset.isActive) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    const expense = await prisma.expense.create({
      data: {
        category,
        amount: parseFloat(amount),
        date: new Date(date),
        description,
        vendor,
        reference,
        notes,
        assetId: parseInt(assetId),
      },
      include: {
        asset: { select: { id: true, code: true, name: true } },
      },
    });

    res.status(201).json(successResponse(expense, 'Expense recorded successfully.'));
  } catch (error) {
    next(error);
  }
};

exports.updateExpense = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const expenseId = parseInt(req.params.id);
    const existing = await prisma.expense.findUnique({ where: { id: expenseId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    }

    const data = { ...req.body };
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.asset;

    if (data.amount) data.amount = parseFloat(data.amount);
    if (data.date) data.date = new Date(data.date);
    if (data.assetId) data.assetId = parseInt(data.assetId);

    const expense = await prisma.expense.update({
      where: { id: expenseId },
      data,
      include: {
        asset: { select: { id: true, code: true, name: true } },
      },
    });

    res.json(successResponse(expense, 'Expense updated successfully.'));
  } catch (error) {
    next(error);
  }
};

exports.deleteExpense = async (req, res, next) => {
  try {
    const expenseId = parseInt(req.params.id);
    const existing = await prisma.expense.findUnique({ where: { id: expenseId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    }

    await prisma.expense.delete({ where: { id: expenseId } });

    res.json(successResponse(null, 'Expense deleted successfully.'));
  } catch (error) {
    next(error);
  }
};

exports.getAssetExpenseSummary = async (req, res, next) => {
  try {
    const assetId = parseInt(req.params.assetId);

    const [totalAgg, byCategory] = await Promise.all([
      prisma.expense.aggregate({
        where: { assetId },
        _sum: { amount: true },
      }),
      prisma.expense.groupBy({
        by: ['category'],
        where: { assetId },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const totalExpenses = totalAgg._sum.amount ? parseFloat(totalAgg._sum.amount) : 0;

    res.json(successResponse({
      totalExpenses,
      expensesByCategory: byCategory.map((item) => ({
        category: item.category,
        total: parseFloat(item._sum.amount || 0),
        count: item._count.id,
      })),
    }));
  } catch (error) {
    next(error);
  }
};

exports.getAssetProfitability = async (req, res, next) => {
  try {
    const assetId = parseInt(req.params.assetId);

    // Get revenue: proportional share from paid invoices for bookings containing this asset
    const [bookingsWithAsset, totalAgg, byCategory] = await Promise.all([
      prisma.bookingAsset.findMany({
        where: { assetId },
        include: {
          booking: {
            include: {
              bookingAssets: { select: { monthlyRate: true } },
              invoices: {
                where: { status: 'PAID' },
                select: { totalAmount: true },
              },
            },
          },
        },
      }),
      prisma.expense.aggregate({
        where: { assetId },
        _sum: { amount: true },
      }),
      prisma.expense.groupBy({
        by: ['category'],
        where: { assetId },
        _sum: { amount: true },
      }),
    ]);

    // Calculate proportional revenue for this asset
    let revenue = 0;
    for (const ba of bookingsWithAsset) {
      const booking = ba.booking;
      const totalBookingRate = booking.bookingAssets.reduce(
        (sum, item) => sum + parseFloat(item.monthlyRate), 0
      );
      if (totalBookingRate === 0) continue;
      const assetShare = parseFloat(ba.monthlyRate) / totalBookingRate;
      const paidTotal = booking.invoices.reduce(
        (sum, inv) => sum + parseFloat(inv.totalAmount), 0
      );
      revenue += paidTotal * assetShare;
    }
    const totalExpenses = totalAgg._sum.amount ? parseFloat(totalAgg._sum.amount) : 0;
    const netProfit = revenue - totalExpenses;
    const roi = totalExpenses > 0 ? ((netProfit / totalExpenses) * 100).toFixed(1) : 0;

    res.json(successResponse({
      totalRevenue: revenue,
      totalExpenses,
      netProfit,
      roi: parseFloat(roi),
      expensesByCategory: byCategory.map((item) => ({
        category: item.category,
        total: parseFloat(item._sum.amount || 0),
      })),
    }));
  } catch (error) {
    next(error);
  }
};
