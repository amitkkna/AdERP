const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const { successResponse } = require('../utils/helpers');

const prisma = new PrismaClient();

// GET /api/portal/dashboard — stats for the logged-in client
exports.getDashboard = async (req, res, next) => {
  try {
    if (!req.user.clientId) {
      return res.json(successResponse({
        linked: false,
        bookings: { active: 0, total: 0 },
        invoices: { pending: 0, overdue: 0, totalPaid: 0 },
        quotations: { open: 0, accepted: 0 },
      }));
    }

    const clientId = req.user.clientId;

    const [
      activeBookings, totalBookings,
      pendingInvoices, overdueInvoices, paidInvoices,
      openQuotations, acceptedQuotations,
      recentBookings, recentInvoices,
    ] = await Promise.all([
      prisma.booking.count({ where: { clientId, status: { in: ['ACTIVE', 'CONFIRMED'] } } }),
      prisma.booking.count({ where: { clientId } }),
      prisma.invoice.count({ where: { booking: { clientId }, status: { in: ['SENT', 'PARTIALLY_PAID'] } } }),
      prisma.invoice.count({ where: { booking: { clientId }, status: 'OVERDUE' } }),
      prisma.invoice.aggregate({ where: { booking: { clientId }, status: 'PAID' }, _sum: { totalAmount: true } }),
      prisma.quotation.count({ where: { clientId, status: { in: ['DRAFT', 'SENT'] } } }),
      prisma.quotation.count({ where: { clientId, status: 'ACCEPTED' } }),
      prisma.booking.findMany({
        where: { clientId },
        include: {
          bookingAssets: {
            include: { asset: { select: { code: true, name: true, locationCity: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.invoice.findMany({
        where: { booking: { clientId } },
        include: { booking: { select: { bookingCode: true } } },
        orderBy: { invoiceDate: 'desc' },
        take: 5,
      }),
    ]);

    res.json(successResponse({
      linked: true,
      bookings: { active: activeBookings, total: totalBookings },
      invoices: {
        pending: pendingInvoices,
        overdue: overdueInvoices,
        totalPaid: Number(paidInvoices._sum.totalAmount || 0),
      },
      quotations: { open: openQuotations, accepted: acceptedQuotations },
      recentBookings,
      recentInvoices,
    }));
  } catch (error) {
    next(error);
  }
};

// PUT /api/portal/link-client — Admin links a user account to a client
exports.linkClient = async (req, res, next) => {
  try {
    const { userId, clientId } = req.body;

    // Unlink any existing link for this user
    await prisma.client.updateMany({
      where: { userId: parseInt(userId) },
      data: { userId: null },
    });

    if (clientId) {
      // Unlink this client from any existing user first
      await prisma.client.updateMany({
        where: { id: parseInt(clientId), userId: { not: null } },
        data: { userId: null },
      });

      await prisma.client.update({
        where: { id: parseInt(clientId) },
        data: { userId: parseInt(userId) },
      });
    }

    res.json(successResponse(null, 'Client linked to user successfully.'));
  } catch (error) {
    next(error);
  }
};
