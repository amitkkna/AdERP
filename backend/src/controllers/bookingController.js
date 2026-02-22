const prisma = require('../lib/prisma');
const { validationResult } = require('express-validator');
const { parsePagination, paginatedResponse, successResponse } = require('../utils/helpers');

const generateBookingCode = async () => {
  const year = new Date().getFullYear().toString().slice(-2);
  const count = await prisma.booking.count();
  const seq = String(count + 1).padStart(4, '0');
  return `BK-${year}-${seq}`;
};

const generateWorkOrderNo = async () => {
  const year = new Date().getFullYear().toString().slice(-2);
  const count = await prisma.workOrder.count();
  const seq = String(count + 1).padStart(4, '0');
  return `WO-${year}-${seq}`;
};

// Auto-create work orders on booking status transitions
const triggerWorkOrder = async (bookingId, type) => {
  const existing = await prisma.workOrder.findFirst({ where: { bookingId, type } });
  if (existing) return; // already exists — don't duplicate
  const workOrderNo = await generateWorkOrderNo();
  await prisma.workOrder.create({ data: { workOrderNo, type, bookingId } });
};

exports.getBookings = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { search, status, clientId, assetId, sortBy, sortOrder } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { bookingCode: { contains: search, mode: 'insensitive' } },
        { client: { companyName: { contains: search, mode: 'insensitive' } } },
        { bookingAssets: { some: { asset: { name: { contains: search, mode: 'insensitive' } } } } },
        { bookingAssets: { some: { asset: { code: { contains: search, mode: 'insensitive' } } } } },
      ];
    }
    if (status) where.status = status;
    if (clientId) where.clientId = parseInt(clientId);
    if (assetId) where.bookingAssets = { some: { assetId: parseInt(assetId) } };

    // CLIENT role: restrict to their own bookings only
    if (req.user.role === 'CLIENT') {
      if (!req.user.clientId) return res.json(paginatedResponse([], 0, page, limit));
      where.clientId = req.user.clientId;
    }

    const orderBy = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          client: { select: { id: true, companyName: true, contactPerson: true, phone: true } },
          bookingAssets: {
            include: {
              asset: { select: { id: true, code: true, name: true, type: true, locationCity: true } },
            },
          },
          _count: { select: { invoices: true } },
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.booking.count({ where }),
    ]);

    res.json(paginatedResponse(bookings, total, page, limit));
  } catch (error) {
    next(error);
  }
};

exports.getBooking = async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        client: true,
        bookingAssets: {
          include: {
            asset: {
              include: {
                zone: { select: { id: true, name: true, city: true } },
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
        invoices: {
          include: {
            _count: { select: { payments: true } },
          },
          orderBy: { invoiceDate: 'desc' },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    res.json(successResponse(booking));
  } catch (error) {
    next(error);
  }
};

exports.createBooking = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const { clientId, assets: assetEntries, startDate, endDate, notes } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate each asset: exists, is active, and has no overlapping bookings
    for (const entry of assetEntries) {
      const asset = await prisma.asset.findUnique({ where: { id: parseInt(entry.assetId) } });
      if (!asset || !asset.isActive) {
        return res.status(404).json({
          success: false,
          message: `Asset ${asset ? asset.code : `ID ${entry.assetId}`} not found or inactive.`,
        });
      }

      const overlapping = await prisma.bookingAsset.findFirst({
        where: {
          assetId: parseInt(entry.assetId),
          booking: {
            status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
            AND: [
              { startDate: { lte: end } },
              { endDate: { gte: start } },
            ],
          },
        },
        include: { booking: { select: { bookingCode: true } } },
      });

      if (overlapping) {
        return res.status(400).json({
          success: false,
          message: `Asset ${asset.code} is already booked (${overlapping.booking.bookingCode}) for the requested period.`,
        });
      }
    }

    // Calculate total amount
    const months = Math.max(1, Math.ceil((end - start) / (30 * 24 * 60 * 60 * 1000)));
    const totalMonthlyRate = assetEntries.reduce((sum, e) => sum + parseFloat(e.monthlyRate), 0);
    const totalAmount = totalMonthlyRate * months;

    const bookingCode = await generateBookingCode();

    // Create booking and booking assets in a transaction
    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          bookingCode,
          startDate: start,
          endDate: end,
          totalAmount,
          notes,
          clientId: parseInt(clientId),
          bookingAssets: {
            create: assetEntries.map((entry) => ({
              assetId: parseInt(entry.assetId),
              monthlyRate: parseFloat(entry.monthlyRate),
            })),
          },
        },
        include: {
          client: { select: { id: true, companyName: true } },
          bookingAssets: {
            include: {
              asset: { select: { id: true, code: true, name: true } },
            },
          },
        },
      });

      // Update all asset statuses to BOOKED
      await Promise.all(
        assetEntries.map((entry) =>
          tx.asset.update({
            where: { id: parseInt(entry.assetId) },
            data: { status: 'BOOKED' },
          })
        )
      );

      return newBooking;
    });

    res.status(201).json(successResponse(booking, 'Booking created successfully.'));
  } catch (error) {
    next(error);
  }
};

exports.updateBooking = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const bookingId = parseInt(req.params.id);
    const { status, notes, startDate, endDate } = req.body;

    const existing = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { bookingAssets: { select: { assetId: true, monthlyRate: true } } },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const data = {};
    if (notes !== undefined) data.notes = notes;
    if (status) data.status = status;
    if (startDate) data.startDate = new Date(startDate);
    if (endDate) data.endDate = new Date(endDate);

    // Recalculate total if dates changed
    if (startDate || endDate) {
      const s = new Date(startDate || existing.startDate);
      const e = new Date(endDate || existing.endDate);
      const months = Math.max(1, Math.ceil((e - s) / (30 * 24 * 60 * 60 * 1000)));
      const totalMonthlyRate = existing.bookingAssets.reduce(
        (sum, ba) => sum + parseFloat(ba.monthlyRate), 0
      );
      data.totalAmount = totalMonthlyRate * months;
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data,
      include: {
        client: { select: { id: true, companyName: true } },
        bookingAssets: {
          include: {
            asset: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });

    // Auto-trigger work orders on status transitions
    if (status && status !== existing.status) {
      if (status === 'ACTIVE') {
        await triggerWorkOrder(bookingId, 'MOUNT');
      }
      if (status === 'COMPLETED') {
        await triggerWorkOrder(bookingId, 'DEMOUNT');
      }
    }

    // If booking is completed or cancelled, free up assets with no other active bookings
    if (status === 'COMPLETED' || status === 'CANCELLED') {
      for (const ba of existing.bookingAssets) {
        const otherActive = await prisma.bookingAsset.count({
          where: {
            assetId: ba.assetId,
            bookingId: { not: bookingId },
            booking: {
              status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
            },
          },
        });

        if (otherActive === 0) {
          await prisma.asset.update({
            where: { id: ba.assetId },
            data: { status: 'AVAILABLE' },
          });
        }
      }
    }

    res.json(successResponse(booking, 'Booking updated successfully.'));
  } catch (error) {
    next(error);
  }
};
