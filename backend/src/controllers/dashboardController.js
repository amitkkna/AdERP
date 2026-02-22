const prisma = require('../lib/prisma');
const { successResponse } = require('../utils/helpers');

exports.getStats = async (req, res, next) => {
  try {
    // Batch 1: Simple counts
    const [
      totalAssets,
      availableAssets,
      bookedAssets,
      maintenanceAssets,
      totalClients,
      totalBookings,
      activeBookings,
      pendingInvoices,
    ] = await Promise.all([
      prisma.asset.count({ where: { isActive: true } }),
      prisma.asset.count({ where: { isActive: true, status: 'AVAILABLE' } }),
      prisma.asset.count({ where: { isActive: true, status: 'BOOKED' } }),
      prisma.asset.count({ where: { isActive: true, status: 'UNDER_MAINTENANCE' } }),
      prisma.client.count({ where: { isActive: true } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: { in: ['ACTIVE', 'CONFIRMED'] } } }),
      prisma.invoice.count({ where: { status: { in: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'] } } }),
    ]);

    // Batch 2: Aggregates and group queries
    const [
      assetsByType,
      assetsByZone,
      revenueData,
      expenseTotal,
    ] = await Promise.all([
      prisma.asset.groupBy({
        by: ['type'],
        where: { isActive: true },
        _count: { id: true },
      }),
      prisma.zone.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          city: true,
          _count: { select: { assets: { where: { isActive: true } } } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.invoice.aggregate({
        where: { status: 'PAID' },
        _sum: { totalAmount: true },
      }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
    ]);

    // Batch 3: Complex queries with includes
    const [
      upcomingExpiries,
      recentBookings,
      upcomingPaymentDues,
    ] = await Promise.all([
      prisma.asset.findMany({
        where: {
          isActive: true,
          permissionExpiry: {
            not: null,
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            gte: new Date(),
          },
        },
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
          locationCity: true,
          permissionExpiry: true,
        },
        orderBy: { permissionExpiry: 'asc' },
        take: 10,
      }),
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, companyName: true } },
          bookingAssets: {
            include: {
              asset: { select: { id: true, code: true, name: true } },
            },
          },
        },
      }),
      prisma.recurringExpense.findMany({
        where: {
          isActive: true,
          nextDueDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        },
        include: {
          asset: { select: { id: true, code: true, name: true, type: true, locationCity: true } },
        },
        orderBy: { nextDueDate: 'asc' },
        take: 10,
      }),
    ]);

    const occupancyRate = totalAssets > 0
      ? ((bookedAssets / totalAssets) * 100).toFixed(1)
      : 0;

    const totalRevenue = revenueData._sum.totalAmount
      ? parseFloat(revenueData._sum.totalAmount)
      : 0;

    const totalExpenses = expenseTotal._sum.amount ? parseFloat(expenseTotal._sum.amount) : 0;
    const netProfit = totalRevenue - totalExpenses;

    res.json(successResponse({
      summary: {
        totalAssets,
        availableAssets,
        bookedAssets,
        maintenanceAssets,
        blockedAssets: totalAssets - availableAssets - bookedAssets - maintenanceAssets,
        occupancyRate: parseFloat(occupancyRate),
        totalClients,
        totalBookings,
        activeBookings,
        pendingInvoices,
        totalRevenue,
        totalExpenses,
        netProfit,
      },
      assetsByType: assetsByType.map((item) => ({
        type: item.type,
        count: item._count.id,
      })),
      assetsByZone: assetsByZone.map((zone) => ({
        id: zone.id,
        name: zone.name,
        city: zone.city,
        assetCount: zone._count.assets,
      })),
      upcomingExpiries,
      upcomingPaymentDues: upcomingPaymentDues.map((item) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(item.nextDueDate);
        due.setHours(0, 0, 0, 0);
        const isOverdue = due < today;
        const daysUntilDue = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
        return {
          id: item.id,
          assetCode: item.asset.code,
          assetName: item.asset.name,
          category: item.category,
          frequency: item.frequency,
          amount: parseFloat(item.amount),
          nextDueDate: item.nextDueDate,
          status: isOverdue ? 'OVERDUE' : daysUntilDue <= 7 ? 'DUE_SOON' : 'UPCOMING',
          daysUntilDue,
        };
      }),
      recentBookings: recentBookings.map((b) => {
        const codes = b.bookingAssets.map(ba => ba.asset.code);
        const names = b.bookingAssets.map(ba => ba.asset.name);
        return {
          id: b.id,
          bookingCode: b.bookingCode,
          clientName: b.client.companyName,
          assetCode: codes[0] + (codes.length > 1 ? ` (+${codes.length - 1})` : ''),
          assetName: names[0] + (names.length > 1 ? ` (+${names.length - 1})` : ''),
          assetCount: codes.length,
          startDate: b.startDate,
          endDate: b.endDate,
          status: b.status,
          totalAmount: b.totalAmount,
        };
      }),
    }));
  } catch (error) {
    next(error);
  }
};
