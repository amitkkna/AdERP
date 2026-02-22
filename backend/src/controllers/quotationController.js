const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const { parsePagination, paginatedResponse, successResponse } = require('../utils/helpers');

const prisma = new PrismaClient();

const generateQuotationNo = async () => {
  const yy = String(new Date().getFullYear()).slice(-2);
  const count = await prisma.quotation.count();
  return `QT-${yy}-${String(count + 1).padStart(4, '0')}`;
};

const CLIENT_SELECT = {
  id: true, companyName: true, contactPerson: true, email: true,
  phone: true, address: true, city: true, state: true,
  gstNumber: true, panNumber: true,
};

const ITEM_INCLUDE = {
  items: {
    include: { asset: { select: { id: true, code: true, name: true, locationCity: true } } },
    orderBy: { id: 'asc' },
  },
};

exports.getQuotations = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { search, status } = req.query;

    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { quotationNo: { contains: search, mode: 'insensitive' } },
        { client: { companyName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // CLIENT role: restrict to their own quotations only
    if (req.user.role === 'CLIENT') {
      if (!req.user.clientId) return res.json(paginatedResponse([], 0, page, limit));
      where.clientId = req.user.clientId;
    }

    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        include: { client: { select: { id: true, companyName: true, contactPerson: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.quotation.count({ where }),
    ]);

    res.json(paginatedResponse(quotations, total, page, limit));
  } catch (error) {
    next(error);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const [total, draft, sent, accepted, rejected, expired] = await Promise.all([
      prisma.quotation.count(),
      prisma.quotation.count({ where: { status: 'DRAFT' } }),
      prisma.quotation.count({ where: { status: 'SENT' } }),
      prisma.quotation.count({ where: { status: 'ACCEPTED' } }),
      prisma.quotation.count({ where: { status: 'REJECTED' } }),
      prisma.quotation.count({ where: { status: 'EXPIRED' } }),
    ]);

    const conversionRate = (sent + accepted + rejected) > 0
      ? Math.round((accepted / (accepted + rejected)) * 100)
      : 0;

    res.json(successResponse({ total, draft, sent, accepted, rejected, expired, conversionRate }));
  } catch (error) {
    next(error);
  }
};

exports.getQuotation = async (req, res, next) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { client: { select: CLIENT_SELECT }, ...ITEM_INCLUDE },
    });

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }

    // CLIENT: can only view their own quotations
    if (req.user.role === 'CLIENT' && quotation.clientId !== req.user.clientId) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    res.json(successResponse(quotation));
  } catch (error) {
    next(error);
  }
};

exports.createQuotation = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const { clientId, validUntil, taxRate = 18, notes, terms, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required.' });
    }

    const quotationNo = await generateQuotationNo();
    const tax = parseFloat(taxRate);

    const subtotal = items.reduce((sum, item) => {
      return sum + (parseFloat(item.monthlyRate) * parseInt(item.months || 1));
    }, 0);

    const taxAmount = Math.round((subtotal * tax) / 100 * 100) / 100;
    const totalAmount = subtotal + taxAmount;

    const quotation = await prisma.quotation.create({
      data: {
        quotationNo,
        clientId: parseInt(clientId),
        validUntil: new Date(validUntil),
        taxRate: tax,
        subtotal,
        taxAmount,
        totalAmount,
        notes,
        terms,
        items: {
          create: items.map((item) => ({
            description: item.description,
            location: item.location || null,
            size: item.size || null,
            assetId: item.assetId ? parseInt(item.assetId) : null,
            monthlyRate: parseFloat(item.monthlyRate),
            months: parseInt(item.months || 1),
            amount: parseFloat(item.monthlyRate) * parseInt(item.months || 1),
          })),
        },
      },
      include: { client: { select: CLIENT_SELECT }, ...ITEM_INCLUDE },
    });

    res.status(201).json(successResponse(quotation, 'Quotation created successfully.'));
  } catch (error) {
    next(error);
  }
};

exports.updateQuotation = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const id = parseInt(req.params.id);
    const { clientId, validUntil, taxRate, status, notes, terms, items } = req.body;

    const existing = await prisma.quotation.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }

    const updateData = {};
    if (clientId) updateData.clientId = parseInt(clientId);
    if (validUntil) updateData.validUntil = new Date(validUntil);
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (terms !== undefined) updateData.terms = terms;

    // Recalculate totals if items provided
    if (items && items.length > 0) {
      const tax = parseFloat(taxRate || existing.taxRate);
      const subtotal = items.reduce((sum, item) => {
        return sum + (parseFloat(item.monthlyRate) * parseInt(item.months || 1));
      }, 0);
      const taxAmount = Math.round((subtotal * tax) / 100 * 100) / 100;
      updateData.taxRate = tax;
      updateData.subtotal = subtotal;
      updateData.taxAmount = taxAmount;
      updateData.totalAmount = subtotal + taxAmount;
    }

    const quotation = await prisma.$transaction(async (tx) => {
      if (items && items.length > 0) {
        await tx.quotationItem.deleteMany({ where: { quotationId: id } });
        updateData.items = {
          create: items.map((item) => ({
            description: item.description,
            location: item.location || null,
            size: item.size || null,
            assetId: item.assetId ? parseInt(item.assetId) : null,
            monthlyRate: parseFloat(item.monthlyRate),
            months: parseInt(item.months || 1),
            amount: parseFloat(item.monthlyRate) * parseInt(item.months || 1),
          })),
        };
      }

      return tx.quotation.update({
        where: { id },
        data: updateData,
        include: { client: { select: CLIENT_SELECT }, ...ITEM_INCLUDE },
      });
    });

    res.json(successResponse(quotation, 'Quotation updated successfully.'));
  } catch (error) {
    next(error);
  }
};

exports.deleteQuotation = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.quotation.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }

    // Cascade deletes items via onDelete: Cascade
    await prisma.quotation.delete({ where: { id } });
    res.json(successResponse(null, 'Quotation deleted successfully.'));
  } catch (error) {
    next(error);
  }
};
