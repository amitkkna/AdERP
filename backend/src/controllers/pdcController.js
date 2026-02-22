const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const { parsePagination, paginatedResponse, successResponse } = require('../utils/helpers');

const prisma = new PrismaClient();

// GET /api/pdcs  — list with filters
exports.getPDCs = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { search, status, sortBy, sortOrder } = req.query;

    const where = {};
    if (search) {
      where.OR = [
        { chequeNumber: { contains: search, mode: 'insensitive' } },
        { bankName: { contains: search, mode: 'insensitive' } },
        { invoice: { invoiceNumber: { contains: search, mode: 'insensitive' } } },
        { invoice: { booking: { client: { companyName: { contains: search, mode: 'insensitive' } } } } },
      ];
    }
    if (status) where.status = status;

    const orderBy = {};
    orderBy[sortBy || 'chequeDate'] = sortOrder === 'asc' ? 'asc' : 'desc';

    const [pdcs, total] = await Promise.all([
      prisma.pDC.findMany({
        where,
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              totalAmount: true,
              booking: {
                select: {
                  bookingCode: true,
                  client: { select: { id: true, companyName: true, contactPerson: true, phone: true } },
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.pDC.count({ where }),
    ]);

    res.json(paginatedResponse(pdcs, total, page, limit));
  } catch (error) {
    next(error);
  }
};

// GET /api/pdcs/stats
exports.getStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const [held, deposited, cleared, bounced, dueThisWeek, totalHeldAmount] = await Promise.all([
      prisma.pDC.count({ where: { status: 'HELD' } }),
      prisma.pDC.count({ where: { status: 'DEPOSITED' } }),
      prisma.pDC.count({ where: { status: 'CLEARED' } }),
      prisma.pDC.count({ where: { status: 'BOUNCED' } }),
      prisma.pDC.count({
        where: { status: 'HELD', chequeDate: { gte: today, lte: sevenDaysLater } },
      }),
      prisma.pDC.aggregate({
        where: { status: 'HELD' },
        _sum: { amount: true },
      }),
    ]);

    res.json(successResponse({
      held,
      deposited,
      cleared,
      bounced,
      dueThisWeek,
      totalHeldAmount: parseFloat(totalHeldAmount._sum.amount || 0),
    }));
  } catch (error) {
    next(error);
  }
};

// GET /api/pdcs/:id
exports.getPDC = async (req, res, next) => {
  try {
    const pdc = await prisma.pDC.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        invoice: {
          include: {
            booking: {
              include: {
                client: true,
                bookingAssets: { include: { asset: { select: { code: true, name: true } } } },
              },
            },
          },
        },
      },
    });

    if (!pdc) return res.status(404).json({ success: false, message: 'PDC not found.' });

    res.json(successResponse(pdc));
  } catch (error) {
    next(error);
  }
};

// POST /api/pdcs
exports.createPDC = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const { invoiceId, chequeNumber, bankName, branchName, chequeDate, amount, notes } = req.body;

    // Verify invoice exists
    const invoice = await prisma.invoice.findUnique({ where: { id: parseInt(invoiceId) } });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

    const pdc = await prisma.pDC.create({
      data: {
        invoiceId: parseInt(invoiceId),
        chequeNumber,
        bankName,
        branchName: branchName || null,
        chequeDate: new Date(chequeDate),
        amount: parseFloat(amount),
        notes: notes || null,
        status: 'HELD',
      },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            booking: { select: { bookingCode: true, client: { select: { companyName: true } } } },
          },
        },
      },
    });

    res.status(201).json(successResponse(pdc, 'PDC recorded successfully.'));
  } catch (error) {
    next(error);
  }
};

// PUT /api/pdcs/:id
exports.updatePDC = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const pdcId = parseInt(req.params.id);
    const existing = await prisma.pDC.findUnique({ where: { id: pdcId } });
    if (!existing) return res.status(404).json({ success: false, message: 'PDC not found.' });

    const {
      chequeNumber, bankName, branchName, chequeDate, amount,
      status, depositedDate, clearedDate, bouncedDate, bounceReason, penaltyAmount, notes,
    } = req.body;

    const data = {};
    if (chequeNumber !== undefined)  data.chequeNumber  = chequeNumber;
    if (bankName !== undefined)      data.bankName      = bankName;
    if (branchName !== undefined)    data.branchName    = branchName || null;
    if (chequeDate !== undefined)    data.chequeDate    = new Date(chequeDate);
    if (amount !== undefined)        data.amount        = parseFloat(amount);
    if (notes !== undefined)         data.notes         = notes || null;
    if (status !== undefined)        data.status        = status;

    // Status-specific date fields
    if (depositedDate !== undefined) data.depositedDate = depositedDate ? new Date(depositedDate) : null;
    if (clearedDate !== undefined)   data.clearedDate   = clearedDate   ? new Date(clearedDate)   : null;
    if (bouncedDate !== undefined)   data.bouncedDate   = bouncedDate   ? new Date(bouncedDate)   : null;
    if (bounceReason !== undefined)  data.bounceReason  = bounceReason  || null;
    if (penaltyAmount !== undefined) data.penaltyAmount = penaltyAmount ? parseFloat(penaltyAmount) : null;

    // Auto-set dates when status changes
    const now = new Date();
    if (status === 'DEPOSITED' && !data.depositedDate && !existing.depositedDate) data.depositedDate = now;
    if (status === 'CLEARED'   && !data.clearedDate   && !existing.clearedDate)   data.clearedDate   = now;
    if (status === 'BOUNCED'   && !data.bouncedDate   && !existing.bouncedDate)   data.bouncedDate   = now;

    const pdc = await prisma.pDC.update({
      where: { id: pdcId },
      data,
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            booking: { select: { bookingCode: true, client: { select: { companyName: true } } } },
          },
        },
      },
    });

    res.json(successResponse(pdc, 'PDC updated successfully.'));
  } catch (error) {
    next(error);
  }
};

// DELETE /api/pdcs/:id
exports.deletePDC = async (req, res, next) => {
  try {
    const pdcId = parseInt(req.params.id);
    const existing = await prisma.pDC.findUnique({ where: { id: pdcId } });
    if (!existing) return res.status(404).json({ success: false, message: 'PDC not found.' });

    if (['CLEARED', 'DEPOSITED'].includes(existing.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a cheque that has been deposited or cleared.',
      });
    }

    await prisma.pDC.delete({ where: { id: pdcId } });
    res.json(successResponse(null, 'PDC deleted successfully.'));
  } catch (error) {
    next(error);
  }
};
