const { PrismaClient } = require('@prisma/client');
const { parsePagination, paginatedResponse, successResponse } = require('../utils/helpers');

const prisma = new PrismaClient();

// Full booking include used in detail views
const BOOKING_INCLUDE = {
  client: {
    select: { id: true, companyName: true, contactPerson: true, phone: true, address: true, city: true, gstNumber: true },
  },
  bookingAssets: {
    include: {
      asset: {
        select: {
          id: true, code: true, name: true, type: true,
          sizeWidth: true, sizeHeight: true,
          locationAddress: true, locationCity: true, locationDistrict: true,
          facingDirection: true, illumination: true,
          zone: { select: { name: true, city: true } },
        },
      },
    },
  },
};

// GET /api/work-orders
exports.getWorkOrders = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { type, status, bookingId, search } = req.query;

    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (bookingId) where.bookingId = parseInt(bookingId);
    if (search) {
      where.OR = [
        { workOrderNo: { contains: search, mode: 'insensitive' } },
        { assignedTo: { contains: search, mode: 'insensitive' } },
        { booking: { bookingCode: { contains: search, mode: 'insensitive' } } },
        { booking: { client: { companyName: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const [workOrders, total] = await Promise.all([
      prisma.workOrder.findMany({
        where,
        include: {
          booking: {
            select: {
              id: true, bookingCode: true, startDate: true, endDate: true, status: true,
              client: { select: { id: true, companyName: true } },
              bookingAssets: {
                include: { asset: { select: { id: true, code: true, name: true, locationCity: true } } },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.workOrder.count({ where }),
    ]);

    res.json(paginatedResponse(workOrders, total, page, limit));
  } catch (error) {
    next(error);
  }
};

// GET /api/work-orders/stats
exports.getStats = async (req, res, next) => {
  try {
    const [total, pendingMount, pendingDemount, inProgress, completed] = await Promise.all([
      prisma.workOrder.count(),
      prisma.workOrder.count({ where: { type: 'MOUNT', status: 'PENDING' } }),
      prisma.workOrder.count({ where: { type: 'DEMOUNT', status: 'PENDING' } }),
      prisma.workOrder.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.workOrder.count({ where: { status: 'COMPLETED' } }),
    ]);

    res.json(successResponse({ total, pendingMount, pendingDemount, inProgress, completed }));
  } catch (error) {
    next(error);
  }
};

// GET /api/work-orders/:id
exports.getWorkOrder = async (req, res, next) => {
  try {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { booking: { include: BOOKING_INCLUDE } },
    });
    if (!workOrder) return res.status(404).json({ success: false, message: 'Work order not found.' });
    res.json(successResponse(workOrder));
  } catch (error) {
    next(error);
  }
};

// PUT /api/work-orders/:id
exports.updateWorkOrder = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const {
      status, assignedTo, assignedPhone, scheduledDate, completedDate,
      flexSize, flexMaterial, flexCopies, flexDesignRef,
      specialInstructions, supervisorNotes,
    } = req.body;

    const existing = await prisma.workOrder.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Work order not found.' });

    const data = {};
    if (status !== undefined) data.status = status;
    if (assignedTo !== undefined) data.assignedTo = assignedTo;
    if (assignedPhone !== undefined) data.assignedPhone = assignedPhone;
    if (scheduledDate !== undefined) data.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
    if (flexSize !== undefined) data.flexSize = flexSize;
    if (flexMaterial !== undefined) data.flexMaterial = flexMaterial;
    if (flexCopies !== undefined) data.flexCopies = flexCopies ? parseInt(flexCopies) : null;
    if (flexDesignRef !== undefined) data.flexDesignRef = flexDesignRef;
    if (specialInstructions !== undefined) data.specialInstructions = specialInstructions;
    if (supervisorNotes !== undefined) data.supervisorNotes = supervisorNotes;

    // Auto-set completedDate when marking COMPLETED
    if (status === 'COMPLETED' && !existing.completedDate) {
      data.completedDate = completedDate ? new Date(completedDate) : new Date();
    }
    if (completedDate !== undefined) data.completedDate = completedDate ? new Date(completedDate) : null;

    const workOrder = await prisma.workOrder.update({
      where: { id },
      data,
      include: { booking: { include: BOOKING_INCLUDE } },
    });

    res.json(successResponse(workOrder, 'Work order updated successfully.'));
  } catch (error) {
    next(error);
  }
};
