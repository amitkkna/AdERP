const prisma = require('../lib/prisma');
const { successResponse } = require('../utils/helpers');

// 1. Asset-wise Profitability
exports.getAssetProfitability = async (req, res, next) => {
  try {
    const assets = await prisma.asset.findMany({
      where: { isActive: true },
      include: {
        zone: { select: { name: true } },
        bookingAssets: {
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
        },
        expenses: {
          select: { amount: true },
        },
      },
      orderBy: { code: 'asc' },
    });

    const result = assets.map((asset) => {
      // Proportional revenue from paid invoices
      let revenue = 0;
      for (const ba of asset.bookingAssets) {
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

      const totalExpenses = asset.expenses
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const netProfit = revenue - totalExpenses;
      const roi = totalExpenses > 0 ? parseFloat(((netProfit / totalExpenses) * 100).toFixed(1)) : 0;

      return {
        assetId: asset.id,
        code: asset.code,
        name: asset.name,
        type: asset.type,
        city: asset.locationCity,
        zone: asset.zone?.name || '-',
        revenue: Math.round(revenue),
        totalExpenses,
        netProfit: Math.round(netProfit),
        roi,
        totalBookings: asset.bookingAssets.length,
      };
    });

    // Sort by net profit descending
    result.sort((a, b) => b.netProfit - a.netProfit);

    res.json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

// 2. Monthly Revenue & Expenses
exports.getMonthlyRevenue = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const [revenueByMonth, expensesByMonth] = await Promise.all([
      prisma.$queryRaw`
        SELECT EXTRACT(MONTH FROM "invoiceDate")::int as month,
               SUM("totalAmount")::float as total
        FROM invoices
        WHERE status = 'PAID'
          AND EXTRACT(YEAR FROM "invoiceDate") = ${year}
        GROUP BY month
        ORDER BY month
      `,
      prisma.$queryRaw`
        SELECT EXTRACT(MONTH FROM "date")::int as month,
               SUM("amount")::float as total
        FROM expenses
        WHERE EXTRACT(YEAR FROM "date") = ${year}
        GROUP BY month
        ORDER BY month
      `,
    ]);

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const revenueMap = {};
    for (const r of revenueByMonth) revenueMap[r.month] = r.total;
    const expenseMap = {};
    for (const e of expensesByMonth) expenseMap[e.month] = e.total;

    const result = monthNames.map((name, idx) => {
      const month = idx + 1;
      const revenue = revenueMap[month] || 0;
      const expenses = expenseMap[month] || 0;
      return {
        month,
        monthName: name,
        revenue: Math.round(revenue),
        expenses: Math.round(expenses),
        net: Math.round(revenue - expenses),
      };
    });

    res.json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

// 3. Client-wise Revenue
exports.getClientRevenue = async (req, res, next) => {
  try {
    const clients = await prisma.client.findMany({
      where: { isActive: true },
      include: {
        bookings: {
          include: {
            invoices: {
              select: { totalAmount: true, status: true },
            },
          },
        },
      },
      orderBy: { companyName: 'asc' },
    });

    const result = clients.map((client) => {
      const totalBookings = client.bookings.length;
      const totalBookingValue = client.bookings.reduce(
        (sum, b) => sum + parseFloat(b.totalAmount), 0
      );

      let totalInvoiced = 0;
      let totalPaid = 0;
      for (const booking of client.bookings) {
        for (const inv of booking.invoices) {
          const amt = parseFloat(inv.totalAmount);
          totalInvoiced += amt;
          if (inv.status === 'PAID') totalPaid += amt;
        }
      }

      return {
        clientId: client.id,
        companyName: client.companyName,
        contactPerson: client.contactPerson,
        totalBookings,
        totalBookingValue: Math.round(totalBookingValue),
        totalInvoiced: Math.round(totalInvoiced),
        totalPaid: Math.round(totalPaid),
        outstanding: Math.round(totalInvoiced - totalPaid),
      };
    });

    // Sort by totalPaid descending
    result.sort((a, b) => b.totalPaid - a.totalPaid);

    res.json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

// 4. Occupancy Report
exports.getOccupancyReport = async (req, res, next) => {
  try {
    const assets = await prisma.asset.findMany({
      where: { isActive: true },
      include: {
        zone: { select: { name: true } },
        bookingAssets: {
          include: {
            booking: {
              select: { startDate: true, endDate: true, status: true },
            },
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    const today = new Date();

    const result = assets.map((asset) => {
      let totalBookedDays = 0;
      let activeBookings = 0;

      const validStatuses = ['ACTIVE', 'CONFIRMED', 'COMPLETED'];
      for (const ba of asset.bookingAssets) {
        if (!ba.booking || !validStatuses.includes(ba.booking.status)) continue;
        const start = new Date(ba.booking.startDate);
        const end = new Date(ba.booking.endDate);
        const days = Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
        totalBookedDays += days;
        if (ba.booking.status === 'ACTIVE' || ba.booking.status === 'CONFIRMED') {
          activeBookings++;
        }
      }

      const createdAt = new Date(asset.createdAt);
      const totalDays = Math.max(1, Math.ceil((today - createdAt) / (1000 * 60 * 60 * 24)));
      const utilization = parseFloat(Math.min(100, (totalBookedDays / totalDays) * 100).toFixed(1));

      return {
        assetId: asset.id,
        code: asset.code,
        name: asset.name,
        type: asset.type,
        city: asset.locationCity,
        zone: asset.zone?.name || '-',
        status: asset.status,
        totalBookedDays,
        totalDays,
        utilization,
        activeBookings,
      };
    });

    // Sort by utilization descending
    result.sort((a, b) => b.utilization - a.utilization);

    res.json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

// 5. Invoice Ageing
exports.getInvoiceAgeing = async (req, res, next) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { status: { in: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'] } },
      include: {
        booking: {
          include: {
            client: { select: { companyName: true } },
          },
        },
        payments: { select: { amount: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const today = new Date();
    const summary = { current: 0, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 0, total: 0 };

    const rows = invoices.map((inv) => {
      const paidAmount = inv.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const balance = parseFloat(inv.totalAmount) - paidAmount;
      const dueDate = new Date(inv.dueDate);
      const daysOverdue = Math.max(0, Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24)));

      let bucket;
      if (daysOverdue === 0) bucket = 'Current';
      else if (daysOverdue <= 30) bucket = '1-30 Days';
      else if (daysOverdue <= 60) bucket = '31-60 Days';
      else if (daysOverdue <= 90) bucket = '61-90 Days';
      else bucket = '90+ Days';

      // Accumulate summary
      if (daysOverdue === 0) summary.current += balance;
      else if (daysOverdue <= 30) summary.days1to30 += balance;
      else if (daysOverdue <= 60) summary.days31to60 += balance;
      else if (daysOverdue <= 90) summary.days61to90 += balance;
      else summary.days90plus += balance;
      summary.total += balance;

      return {
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        clientName: inv.booking.client.companyName,
        bookingCode: inv.booking.bookingCode,
        dueDate: inv.dueDate,
        totalAmount: parseFloat(inv.totalAmount),
        paidAmount: Math.round(paidAmount),
        balance: Math.round(balance),
        daysOverdue,
        bucket,
      };
    });

    // Round summary values
    for (const key of Object.keys(summary)) {
      summary[key] = Math.round(summary[key]);
    }

    res.json(successResponse({ summary, invoices: rows }));
  } catch (error) {
    next(error);
  }
};

// 6. Alerts — booking expiry + expense payment dues + permission renewals
exports.getAlerts = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fifteenDaysLater = new Date(today);
    fifteenDaysLater.setDate(fifteenDaysLater.getDate() + 15);

    const sixtyDaysLater = new Date(today);
    sixtyDaysLater.setDate(sixtyDaysLater.getDate() + 60);

    // ── Booking expiry alerts ──────────────────────────────────────────────
    // Include bookings already expired (no lower bound on endDate) so team sees past-due too
    const expiringBookings = await prisma.booking.findMany({
      where: {
        status: { in: ['ACTIVE', 'CONFIRMED', 'PENDING'] },
        endDate: { lte: fifteenDaysLater },
      },
      include: {
        client: { select: { companyName: true, contactPerson: true, phone: true } },
        bookingAssets: {
          include: {
            asset: { select: { code: true, name: true, locationCity: true } },
          },
        },
      },
      orderBy: { endDate: 'asc' },
    });

    const bookingAlerts = expiringBookings.map((b) => {
      const endDate = new Date(b.endDate);
      endDate.setHours(0, 0, 0, 0);
      const daysRemaining = Math.ceil((endDate - today) / (24 * 60 * 60 * 1000));

      let urgency;
      if (daysRemaining < 0) urgency = 'EXPIRED';
      else if (daysRemaining <= 7) urgency = 'CRITICAL';
      else urgency = 'WARNING';

      return {
        id: b.id,
        bookingCode: b.bookingCode,
        clientName: b.client.companyName,
        contactPerson: b.client.contactPerson,
        phone: b.client.phone,
        assets: b.bookingAssets.map((ba) => ({
          code: ba.asset.code,
          name: ba.asset.name,
          city: ba.asset.locationCity,
        })),
        startDate: b.startDate,
        endDate: b.endDate,
        daysRemaining,
        urgency,
        status: b.status,
      };
    });

    // ── Expense payment alerts (Rent, Municipal Tax, Electricity) ──────────
    const expenseDues = await prisma.recurringExpense.findMany({
      where: {
        isActive: true,
        category: { in: ['RENT', 'MUNICIPAL_TAX', 'ELECTRICITY'] },
        nextDueDate: { lte: fifteenDaysLater },
      },
      include: {
        asset: { select: { code: true, name: true, locationCity: true } },
      },
      orderBy: { nextDueDate: 'asc' },
    });

    const expenseAlerts = expenseDues.map((e) => {
      const dueDate = new Date(e.nextDueDate);
      dueDate.setHours(0, 0, 0, 0);
      const daysUntilDue = Math.ceil((dueDate - today) / (24 * 60 * 60 * 1000));

      let urgency;
      if (daysUntilDue < 0) urgency = 'OVERDUE';
      else if (daysUntilDue <= 7) urgency = 'CRITICAL';
      else urgency = 'WARNING';

      return {
        id: e.id,
        assetCode: e.asset.code,
        assetName: e.asset.name,
        assetCity: e.asset.locationCity,
        category: e.category,
        frequency: e.frequency,
        amount: parseFloat(e.amount),
        nextDueDate: e.nextDueDate,
        daysUntilDue,
        urgency,
        description: e.description,
      };
    });

    // ── PDC due for deposit this week ──────────────────────────────────────
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const pdcDueSoon = await prisma.pDC.findMany({
      where: { status: 'HELD', chequeDate: { gte: today, lte: sevenDaysLater } },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            booking: { select: { bookingCode: true, client: { select: { companyName: true, phone: true } } } },
          },
        },
      },
      orderBy: { chequeDate: 'asc' },
    });

    const pdcAlerts = pdcDueSoon.map((p) => {
      const chequeDate = new Date(p.chequeDate);
      chequeDate.setHours(0, 0, 0, 0);
      const daysUntilDeposit = Math.ceil((chequeDate - today) / (24 * 60 * 60 * 1000));
      return {
        id: p.id,
        chequeNumber: p.chequeNumber,
        bankName: p.bankName,
        amount: parseFloat(p.amount),
        chequeDate: p.chequeDate,
        daysUntilDeposit,
        clientName: p.invoice?.booking?.client?.companyName || '—',
        clientPhone: p.invoice?.booking?.client?.phone || '—',
        invoiceNumber: p.invoice?.invoiceNumber || '—',
      };
    });

    // ── Permission / licence renewal alerts (60-day window) ───────────────
    const permissionAssets = await prisma.asset.findMany({
      where: {
        isActive: true,
        permissionExpiry: { not: null, lte: sixtyDaysLater },
      },
      include: {
        zone: { select: { name: true, city: true } },
      },
      orderBy: { permissionExpiry: 'asc' },
    });

    const permissionAlerts = permissionAssets.map((a) => {
      const expDate = new Date(a.permissionExpiry);
      expDate.setHours(0, 0, 0, 0);
      const daysRemaining = Math.ceil((expDate - today) / (24 * 60 * 60 * 1000));

      let urgency;
      if (daysRemaining < 0)       urgency = 'EXPIRED';
      else if (daysRemaining <= 15) urgency = 'CRITICAL';
      else if (daysRemaining <= 30) urgency = 'WARNING';
      else                          urgency = 'UPCOMING';

      return {
        id: a.id,
        code: a.code,
        name: a.name,
        type: a.type,
        locationCity: a.locationCity,
        locationAddress: a.locationAddress,
        zone: a.zone?.name || '',
        permissionNumber: a.permissionNumber,
        permissionExpiry: a.permissionExpiry,
        daysRemaining,
        urgency,
      };
    });

    // ── Summary counts ─────────────────────────────────────────────────────
    const summary = {
      totalAlerts: bookingAlerts.length + expenseAlerts.length + permissionAlerts.length + pdcAlerts.length,
      bookingExpired:      bookingAlerts.filter((b) => b.urgency === 'EXPIRED').length,
      bookingCritical:     bookingAlerts.filter((b) => b.urgency === 'CRITICAL').length,
      bookingWarning:      bookingAlerts.filter((b) => b.urgency === 'WARNING').length,
      expenseOverdue:      expenseAlerts.filter((e) => e.urgency === 'OVERDUE').length,
      expenseCritical:     expenseAlerts.filter((e) => e.urgency === 'CRITICAL').length,
      expenseWarning:      expenseAlerts.filter((e) => e.urgency === 'WARNING').length,
      permissionExpired:   permissionAlerts.filter((p) => p.urgency === 'EXPIRED').length,
      permissionCritical:  permissionAlerts.filter((p) => p.urgency === 'CRITICAL').length,
      permissionWarning:   permissionAlerts.filter((p) => p.urgency === 'WARNING').length,
      permissionUpcoming:  permissionAlerts.filter((p) => p.urgency === 'UPCOMING').length,
      pdcDueThisWeek:      pdcAlerts.length,
    };

    res.json(successResponse({ summary, bookingAlerts, expenseAlerts, permissionAlerts, pdcAlerts }));
  } catch (error) {
    next(error);
  }
};
