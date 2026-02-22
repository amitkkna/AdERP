const prisma = require('../lib/prisma');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const { parsePagination, paginatedResponse, successResponse } = require('../utils/helpers');

const generateEnquiryNo = async () => {
  const year = new Date().getFullYear().toString().slice(-2);
  const count = await prisma.enquiry.count();
  const seq = String(count + 1).padStart(4, '0');
  return `ENQ-${year}-${seq}`;
};

// GET /api/enquiries
exports.getEnquiries = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { search, status, sortBy, sortOrder } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { enquiryNo: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;

    const orderBy = {};
    orderBy[sortBy || 'createdAt'] = sortOrder === 'asc' ? 'asc' : 'desc';

    const [enquiries, total] = await Promise.all([
      prisma.enquiry.findMany({
        where,
        include: {
          client: { select: { id: true, companyName: true } },
          createdBy: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
          booking: { select: { id: true, bookingCode: true } },
          enquiryAssets: {
            include: { asset: { select: { id: true, code: true, name: true, locationCity: true, sizeWidth: true, sizeHeight: true, monthlyRate: true } } },
          },
          _count: { select: { activities: true } },
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.enquiry.count({ where }),
    ]);

    res.json(paginatedResponse(enquiries, total, page, limit));
  } catch (error) {
    next(error);
  }
};

// GET /api/enquiries/stats
exports.getStats = async (req, res, next) => {
  try {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const [total, newCount, wonCount, lostCount, followUpToday] = await Promise.all([
      prisma.enquiry.count(),
      prisma.enquiry.count({ where: { status: 'NEW' } }),
      prisma.enquiry.count({ where: { status: 'WON' } }),
      prisma.enquiry.count({ where: { status: 'LOST' } }),
      prisma.enquiry.count({
        where: { followUpDate: { gte: todayStart, lt: todayEnd } },
      }),
    ]);

    const decided = wonCount + lostCount;
    const winRate = decided > 0 ? Math.round((wonCount / decided) * 100) : 0;

    res.json(
      successResponse({ total, new: newCount, won: wonCount, lost: lostCount, winRate, followUpToday })
    );
  } catch (error) {
    next(error);
  }
};

// GET /api/enquiries/:id
exports.getEnquiry = async (req, res, next) => {
  try {
    const enquiry = await prisma.enquiry.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        client: true,
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true } },
        booking: { select: { id: true, bookingCode: true, status: true } },
        enquiryAssets: {
          include: { asset: { select: { id: true, code: true, name: true, locationCity: true, sizeWidth: true, sizeHeight: true, monthlyRate: true, type: true, zone: { select: { name: true } } } } },
        },
        activities: {
          include: { createdBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }

    res.json(successResponse(enquiry));
  } catch (error) {
    next(error);
  }
};

// POST /api/enquiries
exports.createEnquiry = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const {
      clientId,
      clientName,
      contactPerson,
      phone,
      email,
      locationPreference,
      requirementNotes,
      startDate,
      endDate,
      budget,
      source,
      followUpDate,
      notes,
      assignedToId,
      assetIds,
    } = req.body;

    const enquiryNo = await generateEnquiryNo();

    const enquiry = await prisma.$transaction(async (tx) => {
      const newEnquiry = await tx.enquiry.create({
        data: {
          enquiryNo,
          clientId: clientId ? parseInt(clientId) : null,
          clientName,
          contactPerson,
          phone,
          email: email || null,
          locationPreference: locationPreference || null,
          requirementNotes: requirementNotes || null,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          budget: budget ? parseFloat(budget) : null,
          source: source || null,
          followUpDate: followUpDate ? new Date(followUpDate) : null,
          notes: notes || null,
          assignedToId: assignedToId ? parseInt(assignedToId) : null,
          createdById: req.user.id,
        },
      });

      // Link selected assets
      if (assetIds && assetIds.length > 0) {
        await tx.enquiryAsset.createMany({
          data: assetIds.map((id) => ({ enquiryId: newEnquiry.id, assetId: parseInt(id) })),
        });
      }

      await tx.enquiryActivity.create({
        data: {
          enquiryId: newEnquiry.id,
          type: 'NOTE',
          description: 'Enquiry created.',
          createdById: req.user.id,
        },
      });

      return newEnquiry;
    });

    const full = await prisma.enquiry.findUnique({
      where: { id: enquiry.id },
      include: {
        client: { select: { id: true, companyName: true } },
        createdBy: { select: { id: true, name: true } },
        enquiryAssets: {
          include: { asset: { select: { id: true, code: true, name: true, locationCity: true, sizeWidth: true, sizeHeight: true, monthlyRate: true } } },
        },
        activities: { include: { createdBy: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
      },
    });

    res.status(201).json(successResponse(full, 'Enquiry created successfully.'));
  } catch (error) {
    next(error);
  }
};

// PUT /api/enquiries/:id
exports.updateEnquiry = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const enquiryId = parseInt(req.params.id);
    const existing = await prisma.enquiry.findUnique({ where: { id: enquiryId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }

    const {
      clientId,
      clientName,
      contactPerson,
      phone,
      email,
      locationPreference,
      requirementNotes,
      startDate,
      endDate,
      budget,
      source,
      status,
      lostReason,
      followUpDate,
      notes,
      assignedToId,
      assetIds,
    } = req.body;

    if (status === 'LOST' && !lostReason) {
      return res.status(400).json({ success: false, message: 'Lost reason is required when marking an enquiry as Lost.' });
    }

    const data = {};
    if (clientId !== undefined) data.clientId = clientId ? parseInt(clientId) : null;
    if (clientName !== undefined) data.clientName = clientName;
    if (contactPerson !== undefined) data.contactPerson = contactPerson;
    if (phone !== undefined) data.phone = phone;
    if (email !== undefined) data.email = email || null;
    if (locationPreference !== undefined) data.locationPreference = locationPreference || null;
    if (requirementNotes !== undefined) data.requirementNotes = requirementNotes || null;
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
    if (budget !== undefined) data.budget = budget ? parseFloat(budget) : null;
    if (source !== undefined) data.source = source || null;
    if (followUpDate !== undefined) data.followUpDate = followUpDate ? new Date(followUpDate) : null;
    if (notes !== undefined) data.notes = notes || null;
    if (assignedToId !== undefined) data.assignedToId = assignedToId ? parseInt(assignedToId) : null;
    if (lostReason !== undefined) data.lostReason = lostReason || null;

    const statusChanged = status && status !== existing.status;
    if (status) data.status = status;

    const enquiry = await prisma.$transaction(async (tx) => {
      const updated = await tx.enquiry.update({
        where: { id: enquiryId },
        data,
        include: {
          client: { select: { id: true, companyName: true } },
          createdBy: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
          booking: { select: { id: true, bookingCode: true, status: true } },
          enquiryAssets: {
            include: { asset: { select: { id: true, code: true, name: true, locationCity: true, sizeWidth: true, sizeHeight: true, monthlyRate: true } } },
          },
          activities: {
            include: { createdBy: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      // Sync linked assets if provided
      if (assetIds !== undefined) {
        await tx.enquiryAsset.deleteMany({ where: { enquiryId } });
        if (assetIds.length > 0) {
          await tx.enquiryAsset.createMany({
            data: assetIds.map((id) => ({ enquiryId, assetId: parseInt(id) })),
          });
        }
      }

      if (statusChanged) {
        let description = `Status changed from ${existing.status} to ${status}.`;
        if (status === 'WON') description = 'Enquiry marked as Won.';
        if (status === 'LOST') description = `Enquiry marked as Lost. Reason: ${lostReason}`;

        await tx.enquiryActivity.create({
          data: {
            enquiryId,
            type: 'STATUS_CHANGE',
            description,
            createdById: req.user.id,
          },
        });
      }

      return updated;
    });

    res.json(successResponse(enquiry, 'Enquiry updated successfully.'));
  } catch (error) {
    next(error);
  }
};

// DELETE /api/enquiries/:id
exports.deleteEnquiry = async (req, res, next) => {
  try {
    const enquiryId = parseInt(req.params.id);
    const existing = await prisma.enquiry.findUnique({ where: { id: enquiryId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }

    if (existing.bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an enquiry that has been converted to a booking.',
      });
    }

    await prisma.enquiry.delete({ where: { id: enquiryId } });

    res.json(successResponse(null, 'Enquiry deleted successfully.'));
  } catch (error) {
    next(error);
  }
};

// POST /api/enquiries/:id/activities
exports.addActivity = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const enquiryId = parseInt(req.params.id);
    const enquiry = await prisma.enquiry.findUnique({ where: { id: enquiryId } });
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }

    const { type, description } = req.body;

    const activity = await prisma.enquiryActivity.create({
      data: {
        enquiryId,
        type,
        description,
        createdById: req.user.id,
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    res.status(201).json(successResponse(activity, 'Activity logged successfully.'));
  } catch (error) {
    next(error);
  }
};

// POST /api/enquiries/:id/convert
exports.convertToBooking = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const enquiryId = parseInt(req.params.id);
    const enquiry = await prisma.enquiry.findUnique({ where: { id: enquiryId } });
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }
    if (enquiry.status !== 'WON') {
      return res.status(400).json({ success: false, message: 'Only Won enquiries can be converted to bookings.' });
    }
    if (enquiry.bookingId) {
      return res.status(400).json({ success: false, message: 'This enquiry has already been converted to a booking.' });
    }

    const { clientId, assets: assetEntries, startDate, endDate, notes } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return res.status(400).json({ success: false, message: 'End date must be after start date.' });
    }

    // Validate each asset and check for overlapping bookings
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
            AND: [{ startDate: { lte: end } }, { endDate: { gte: start } }],
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

    // Generate booking code
    const year = new Date().getFullYear().toString().slice(-2);
    const bookingCount = await prisma.booking.count();
    const bookingCode = `BK-${year}-${String(bookingCount + 1).padStart(4, '0')}`;

    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          bookingCode,
          startDate: start,
          endDate: end,
          totalAmount,
          notes: notes || null,
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
            include: { asset: { select: { id: true, code: true, name: true } } },
          },
        },
      });

      // Update asset statuses to BOOKED
      await Promise.all(
        assetEntries.map((entry) =>
          tx.asset.update({
            where: { id: parseInt(entry.assetId) },
            data: { status: 'BOOKED' },
          })
        )
      );

      // Link booking to enquiry
      await tx.enquiry.update({
        where: { id: enquiryId },
        data: { bookingId: newBooking.id },
      });

      // Log activity
      await tx.enquiryActivity.create({
        data: {
          enquiryId,
          type: 'STATUS_CHANGE',
          description: `Converted to booking ${bookingCode}.`,
          createdById: req.user.id,
        },
      });

      return newBooking;
    });

    res.status(201).json(successResponse(booking, `Booking ${bookingCode} created successfully.`));
  } catch (error) {
    next(error);
  }
};

// GET /api/enquiries/:id/campaign
exports.getCampaignData = async (req, res, next) => {
  try {
    const enquiry = await prisma.enquiry.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        client: true,
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true } },
        enquiryAssets: {
          include: {
            asset: {
              include: {
                zone: { select: { name: true, city: true } },
                images: { orderBy: { isPrimary: 'desc' } },
              },
            },
          },
        },
      },
    });

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }

    // Convert image files to base64 data URIs
    const enrichedAssets = await Promise.all(
      enquiry.enquiryAssets.map(async (ea) => {
        const imagesWithBase64 = await Promise.all(
          ea.asset.images.map(async (img) => {
            try {
              const filePath = path.join(__dirname, '..', '..', 'uploads', path.basename(img.url));
              if (fs.existsSync(filePath)) {
                const buffer = fs.readFileSync(filePath);
                const ext = path.extname(filePath).replace('.', '').toLowerCase();
                const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
                const mime = mimeMap[ext] || 'image/jpeg';
                return { ...img, base64: `data:${mime};base64,${buffer.toString('base64')}` };
              }
              return { ...img, base64: null };
            } catch {
              return { ...img, base64: null };
            }
          })
        );
        return { ...ea, asset: { ...ea.asset, images: imagesWithBase64 } };
      })
    );

    res.json(successResponse({ ...enquiry, enquiryAssets: enrichedAssets }));
  } catch (error) {
    next(error);
  }
};
