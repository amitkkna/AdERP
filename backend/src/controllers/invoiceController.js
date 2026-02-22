const prisma = require('../lib/prisma');
const { validationResult } = require('express-validator');
const { parsePagination, paginatedResponse, successResponse } = require('../utils/helpers');

const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear().toString().slice(-2);
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const count = await prisma.invoice.count();
  const seq = String(count + 1).padStart(4, '0');
  return `INV-${year}${month}-${seq}`;
};

exports.getInvoices = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { search, status, bookingId, sortBy, sortOrder } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { booking: { bookingCode: { contains: search, mode: 'insensitive' } } },
        { booking: { client: { companyName: { contains: search, mode: 'insensitive' } } } },
      ];
    }
    if (status) where.status = status;
    if (bookingId) where.bookingId = parseInt(bookingId);

    // CLIENT role: restrict to their own invoices only
    if (req.user.role === 'CLIENT') {
      if (!req.user.clientId) return res.json(paginatedResponse([], 0, page, limit));
      where.booking = { clientId: req.user.clientId };
    }

    const orderBy = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.invoiceDate = 'desc';
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          booking: {
            include: {
              client: { select: { id: true, companyName: true, contactPerson: true } },
              bookingAssets: {
                include: {
                  asset: { select: { id: true, code: true, name: true } },
                },
              },
            },
          },
          _count: { select: { payments: true } },
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json(paginatedResponse(invoices, total, page, limit));
  } catch (error) {
    next(error);
  }
};

exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        booking: {
          include: {
            client: true,
            bookingAssets: {
              include: {
                asset: {
                  include: {
                    zone: { select: { id: true, name: true, city: true } },
                  },
                },
              },
            },
          },
        },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    res.json(successResponse(invoice));
  } catch (error) {
    next(error);
  }
};

exports.createInvoice = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const { bookingId, subtotal, taxRate, dueDate, notes } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) },
      include: { client: true },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const sub = parseFloat(subtotal);
    const tax = parseFloat(taxRate || 18);
    const taxAmount = (sub * tax) / 100;
    const totalAmount = sub + taxAmount;

    const invoiceNumber = await generateInvoiceNumber();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        dueDate: new Date(dueDate),
        subtotal: sub,
        taxRate: tax,
        taxAmount,
        totalAmount,
        notes,
        bookingId: parseInt(bookingId),
      },
      include: {
        booking: {
          include: {
            client: { select: { id: true, companyName: true } },
            bookingAssets: {
              include: {
                asset: { select: { id: true, code: true, name: true } },
              },
            },
          },
        },
      },
    });

    res.status(201).json(successResponse(invoice, 'Invoice created successfully.'));
  } catch (error) {
    next(error);
  }
};

exports.updateInvoice = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const invoiceId = parseInt(req.params.id);
    const { status, dueDate, subtotal, taxRate, notes } = req.body;

    const data = {};
    if (status) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (dueDate) data.dueDate = new Date(dueDate);

    if (subtotal || taxRate) {
      const existing = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      const sub = parseFloat(subtotal || existing.subtotal);
      const tax = parseFloat(taxRate || existing.taxRate);
      data.subtotal = sub;
      data.taxRate = tax;
      data.taxAmount = (sub * tax) / 100;
      data.totalAmount = sub + data.taxAmount;
    }

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data,
      include: {
        booking: {
          include: {
            client: { select: { id: true, companyName: true } },
            bookingAssets: {
              include: {
                asset: { select: { id: true, code: true, name: true } },
              },
            },
          },
        },
      },
    });

    res.json(successResponse(invoice, 'Invoice updated successfully.'));
  } catch (error) {
    next(error);
  }
};

// Payments
exports.addPayment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const invoiceId = parseInt(req.params.id);
    const { amount, method, transactionRef, paymentDate, notes } = req.body;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const paidSoFar = invoice.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const paymentAmount = parseFloat(amount);

    if (paidSoFar + paymentAmount > parseFloat(invoice.totalAmount)) {
      return res.status(400).json({
        success: false,
        message: `Payment exceeds invoice total. Remaining: ₹${(parseFloat(invoice.totalAmount) - paidSoFar).toFixed(2)}`,
      });
    }

    const payment = await prisma.payment.create({
      data: {
        amount: paymentAmount,
        method: method || 'BANK_TRANSFER',
        transactionRef,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        notes,
        invoiceId,
      },
    });

    // Update invoice status based on total payments
    const newPaidTotal = paidSoFar + paymentAmount;
    const invoiceTotal = parseFloat(invoice.totalAmount);
    let newStatus;
    if (newPaidTotal >= invoiceTotal) {
      newStatus = 'PAID';
    } else if (newPaidTotal > 0) {
      newStatus = 'PARTIALLY_PAID';
    }

    if (newStatus) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: newStatus },
      });
    }

    res.status(201).json(successResponse(payment, 'Payment recorded successfully.'));
  } catch (error) {
    next(error);
  }
};

exports.getPayments = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const where = {};
    if (req.query.invoiceId) where.invoiceId = parseInt(req.query.invoiceId);

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
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
                  client: { select: { id: true, companyName: true } },
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { paymentDate: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    res.json(paginatedResponse(payments, total, page, limit));
  } catch (error) {
    next(error);
  }
};
