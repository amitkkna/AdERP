const prisma = require('../lib/prisma');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const { parsePagination, paginatedResponse, successResponse, generateAssetCode } = require('../utils/helpers');

exports.getAssets = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { search, type, status, zoneId, city, sortBy, sortOrder } = req.query;

    const where = { isActive: true };

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { locationAddress: { contains: search, mode: 'insensitive' } },
        { locationCity: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (type) where.type = type;
    if (status) where.status = status;
    if (zoneId) where.zoneId = parseInt(zoneId);
    if (city) where.locationCity = { contains: city, mode: 'insensitive' };

    const orderBy = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: {
          zone: { select: { id: true, name: true, city: true } },
          images: { where: { isPrimary: true }, take: 1 },
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.asset.count({ where }),
    ]);

    res.json(paginatedResponse(assets, total, page, limit));
  } catch (error) {
    next(error);
  }
};

exports.getAsset = async (req, res, next) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        zone: true,
        images: { orderBy: { isPrimary: 'desc' } },
      },
    });

    if (!asset || !asset.isActive) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    res.json(successResponse(asset));
  } catch (error) {
    next(error);
  }
};

exports.createAsset = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const {
      name, type, sizeWidth, sizeHeight, locationAddress, locationCity, locationDistrict,
      latitude, longitude, facingDirection, illumination, material, installationDate,
      condition, ownership, status, monthlyRate, quarterlyRate, yearlyRate,
      permissionNumber, permissionExpiry, zoneId, notes,
    } = req.body;

    // Generate unique asset code
    const count = await prisma.asset.count({ where: { type, locationCity } });
    const code = generateAssetCode(type, locationCity, count + 1);

    const asset = await prisma.asset.create({
      data: {
        code, name, type,
        sizeWidth: parseFloat(sizeWidth),
        sizeHeight: parseFloat(sizeHeight),
        locationAddress, locationCity, locationDistrict,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        facingDirection,
        illumination: illumination || 'NONLIT',
        material,
        installationDate: installationDate ? new Date(installationDate) : null,
        condition: condition || 'GOOD',
        ownership: ownership || 'OWNED',
        status: status || 'AVAILABLE',
        monthlyRate: parseFloat(monthlyRate),
        quarterlyRate: quarterlyRate ? parseFloat(quarterlyRate) : null,
        yearlyRate: yearlyRate ? parseFloat(yearlyRate) : null,
        permissionNumber,
        permissionExpiry: permissionExpiry ? new Date(permissionExpiry) : null,
        zoneId: parseInt(zoneId),
        notes,
      },
      include: { zone: true, images: true },
    });

    res.status(201).json(successResponse(asset, 'Asset created successfully.'));
  } catch (error) {
    next(error);
  }
};

exports.updateAsset = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const assetId = parseInt(req.params.id);
    const data = { ...req.body };

    // Parse numeric fields
    if (data.sizeWidth) data.sizeWidth = parseFloat(data.sizeWidth);
    if (data.sizeHeight) data.sizeHeight = parseFloat(data.sizeHeight);
    if (data.latitude) data.latitude = parseFloat(data.latitude);
    if (data.longitude) data.longitude = parseFloat(data.longitude);
    if (data.monthlyRate) data.monthlyRate = parseFloat(data.monthlyRate);
    if (data.quarterlyRate) data.quarterlyRate = parseFloat(data.quarterlyRate);
    if (data.yearlyRate) data.yearlyRate = parseFloat(data.yearlyRate);
    if (data.zoneId) data.zoneId = parseInt(data.zoneId);
    if (data.installationDate) data.installationDate = new Date(data.installationDate);
    if (data.permissionExpiry) data.permissionExpiry = new Date(data.permissionExpiry);

    // Remove fields that shouldn't be updated directly
    delete data.id;
    delete data.code;
    delete data.createdAt;
    delete data.updatedAt;

    const asset = await prisma.asset.update({
      where: { id: assetId },
      data,
      include: { zone: true, images: true },
    });

    res.json(successResponse(asset, 'Asset updated successfully.'));
  } catch (error) {
    next(error);
  }
};

exports.deleteAsset = async (req, res, next) => {
  try {
    await prisma.asset.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: false },
    });

    res.json(successResponse(null, 'Asset deleted successfully.'));
  } catch (error) {
    next(error);
  }
};

exports.uploadImages = async (req, res, next) => {
  try {
    const assetId = parseInt(req.params.id);

    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded.' });
    }

    const existingImages = await prisma.assetImage.count({ where: { assetId } });

    const images = await Promise.all(
      req.files.map((file, index) =>
        prisma.assetImage.create({
          data: {
            assetId,
            url: `/uploads/${file.filename}`,
            caption: req.body.captions?.[index] || null,
            isPrimary: existingImages === 0 && index === 0,
          },
        })
      )
    );

    res.status(201).json(successResponse(images, 'Images uploaded successfully.'));
  } catch (error) {
    next(error);
  }
};

exports.updateImage = async (req, res, next) => {
  try {
    const imageId = parseInt(req.params.imageId);
    const assetId = parseInt(req.params.id);
    const { caption, isPrimary } = req.body;

    const image = await prisma.assetImage.findUnique({ where: { id: imageId } });
    if (!image || image.assetId !== assetId) {
      return res.status(404).json({ success: false, message: 'Image not found.' });
    }

    const data = {};
    if (caption !== undefined) data.caption = caption || null;

    if (isPrimary === true) {
      await prisma.assetImage.updateMany({ where: { assetId, isPrimary: true }, data: { isPrimary: false } });
      data.isPrimary = true;
    }

    const updated = await prisma.assetImage.update({ where: { id: imageId }, data });
    res.json(successResponse(updated, 'Image updated successfully.'));
  } catch (error) {
    next(error);
  }
};

exports.deleteImage = async (req, res, next) => {
  try {
    const image = await prisma.assetImage.findUnique({
      where: { id: parseInt(req.params.imageId) },
    });

    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found.' });
    }

    // Delete file from disk
    const filePath = path.join(__dirname, '..', '..', 'uploads', path.basename(image.url));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.assetImage.delete({ where: { id: image.id } });

    res.json(successResponse(null, 'Image deleted successfully.'));
  } catch (error) {
    next(error);
  }
};

// GET /api/assets/:id/availability?year=2026&month=2
exports.getAvailability = async (req, res, next) => {
  try {
    const assetId = parseInt(req.params.id);
    const year  = parseInt(req.query.year)  || new Date().getFullYear();
    const month = parseInt(req.query.month) || (new Date().getMonth() + 1);

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: { id: true, code: true, name: true, status: true },
    });
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found.' });

    // First and last day of the requested month
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd   = new Date(year, month, 0, 23, 59, 59);

    // All active bookings that overlap with this month
    const bookings = await prisma.booking.findMany({
      where: {
        status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
        bookingAssets: { some: { assetId } },
        startDate: { lte: monthEnd },
        endDate:   { gte: monthStart },
      },
      include: {
        client: { select: { companyName: true } },
        bookingAssets: { where: { assetId }, select: { monthlyRate: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    // Build a day-by-day map for the month
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const booking = bookings.find(
        (b) => new Date(b.startDate) <= date && new Date(b.endDate) >= date
      );
      days.push({
        day: d,
        date: date.toISOString().substring(0, 10),
        status: booking ? 'BOOKED' : 'AVAILABLE',
        bookingCode: booking?.bookingCode || null,
        clientName:  booking?.client?.companyName || null,
        bookingId:   booking?.id || null,
      });
    }

    res.json(successResponse({
      asset,
      year,
      month,
      daysInMonth,
      bookings: bookings.map((b) => ({
        id: b.id,
        bookingCode: b.bookingCode,
        clientName: b.client.companyName,
        startDate: b.startDate,
        endDate: b.endDate,
        status: b.status,
      })),
      days,
    }));
  } catch (error) {
    next(error);
  }
};

// GET /api/assets/availability/matrix?year=2026&month=2&zoneId=1
exports.getAvailabilityMatrix = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || (new Date().getMonth() + 1);
    const zoneId = req.query.zoneId ? parseInt(req.query.zoneId) : undefined;

    const daysInMonth = new Date(year, month, 0).getDate();
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    const assetWhere = { isActive: true };
    if (zoneId) assetWhere.zoneId = zoneId;

    const assets = await prisma.asset.findMany({
      where: assetWhere,
      select: {
        id: true, code: true, name: true, status: true, type: true,
        locationCity: true, sizeWidth: true, sizeHeight: true,
        zone: { select: { id: true, name: true } },
        bookingAssets: {
          where: {
            booking: {
              status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
              startDate: { lte: monthEnd },
              endDate: { gte: monthStart },
            },
          },
          select: {
            booking: {
              select: {
                id: true, bookingCode: true, status: true,
                startDate: true, endDate: true,
                client: { select: { companyName: true } },
              },
            },
          },
        },
      },
      orderBy: [{ zone: { name: 'asc' } }, { code: 'asc' }],
    });

    const result = assets.map((asset) => {
      const days = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month - 1, d);
        const ba = asset.bookingAssets.find(
          (ba) =>
            new Date(ba.booking.startDate) <= date &&
            new Date(ba.booking.endDate) >= date
        );
        const dayStatus = ba
          ? 'BOOKED'
          : asset.status === 'UNDER_MAINTENANCE'
          ? 'MAINTENANCE'
          : asset.status === 'BLOCKED'
          ? 'BLOCKED'
          : 'AVAILABLE';
        days.push({
          day: d,
          status: dayStatus,
          bookingCode: ba?.booking?.bookingCode || null,
          clientName: ba?.booking?.client?.companyName || null,
          bookingId: ba?.booking?.id || null,
        });
      }
      const bookedDays = days.filter((d) => d.status === 'BOOKED').length;
      return {
        id: asset.id,
        code: asset.code,
        name: asset.name,
        type: asset.type,
        zone: asset.zone,
        locationCity: asset.locationCity,
        sizeWidth: asset.sizeWidth,
        sizeHeight: asset.sizeHeight,
        assetStatus: asset.status,
        days,
        bookedDays,
        availableDays: daysInMonth - bookedDays,
        occupancy: Math.round((bookedDays / daysInMonth) * 100),
      };
    });

    const avgOccupancy = result.length
      ? Math.round(result.reduce((s, a) => s + a.occupancy, 0) / result.length)
      : 0;

    res.json(successResponse({
      year,
      month,
      daysInMonth,
      summary: {
        total: result.length,
        fullyBooked: result.filter((a) => a.bookedDays === daysInMonth).length,
        partiallyBooked: result.filter((a) => a.bookedDays > 0 && a.bookedDays < daysInMonth).length,
        fullyFree: result.filter((a) => a.bookedDays === 0).length,
        avgOccupancy,
      },
      assets: result,
    }));
  } catch (error) {
    next(error);
  }
};

// POST /api/assets/check-availability
// Body: { assetIds: [1,2,3], startDate: '2026-03-01', endDate: '2026-03-31' }
exports.checkAvailability = async (req, res, next) => {
  try {
    const { assetIds, startDate, endDate } = req.body;

    if (!assetIds?.length || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'assetIds, startDate, and endDate are required.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const results = await Promise.all(
      assetIds.map(async (assetId) => {
        const id = parseInt(assetId);

        // Find overlapping active bookings for this asset in the date range
        const conflicts = await prisma.bookingAsset.findMany({
          where: {
            assetId: id,
            booking: {
              status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
              startDate: { lte: end },
              endDate: { gte: start },
            },
          },
          select: {
            booking: {
              select: {
                bookingCode: true,
                startDate: true,
                endDate: true,
                client: { select: { companyName: true } },
              },
            },
          },
        });

        return {
          assetId: id,
          available: conflicts.length === 0,
          conflicts: conflicts.map((c) => ({
            bookingCode: c.booking.bookingCode,
            clientName: c.booking.client?.companyName,
            startDate: c.booking.startDate,
            endDate: c.booking.endDate,
          })),
        };
      })
    );

    res.json(successResponse(results));
  } catch (error) {
    next(error);
  }
};

// GET /api/assets/occupancy?search=&type=&zoneId=&city=&status=
exports.getOccupancy = async (req, res, next) => {
  try {
    const { search, type, zoneId, city, status } = req.query;

    const where = { isActive: true };
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { locationAddress: { contains: search, mode: 'insensitive' } },
        { locationCity: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (type) where.type = type;
    if (status) where.status = status;
    if (zoneId) where.zoneId = parseInt(zoneId);
    if (city) where.locationCity = { contains: city, mode: 'insensitive' };

    const assets = await prisma.asset.findMany({
      where,
      include: {
        zone: { select: { id: true, name: true, city: true } },
        images: { where: { isPrimary: true }, take: 1 },
        bookingAssets: {
          where: {
            booking: { status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] } },
          },
          select: {
            monthlyRate: true,
            booking: {
              select: {
                id: true, bookingCode: true, startDate: true, endDate: true, status: true,
                client: { select: { id: true, companyName: true, contactPerson: true } },
              },
            },
          },
        },
      },
      orderBy: [{ zone: { name: 'asc' } }, { code: 'asc' }],
    });

    const now = new Date();
    const result = assets.map((asset) => {
      const currentBooking = asset.bookingAssets.find(
        (ba) => new Date(ba.booking.startDate) <= now && new Date(ba.booking.endDate) >= now
      );
      const bookings = asset.bookingAssets.map((ba) => ({
        bookingCode: ba.booking.bookingCode,
        startDate: ba.booking.startDate,
        endDate: ba.booking.endDate,
        status: ba.booking.status,
        clientName: ba.booking.client.companyName,
      }));

      return {
        id: asset.id, code: asset.code, name: asset.name, type: asset.type,
        locationAddress: asset.locationAddress, locationCity: asset.locationCity,
        locationDistrict: asset.locationDistrict, latitude: asset.latitude, longitude: asset.longitude,
        sizeWidth: asset.sizeWidth, sizeHeight: asset.sizeHeight,
        sqft: Math.round(asset.sizeWidth * asset.sizeHeight),
        illumination: asset.illumination, facingDirection: asset.facingDirection,
        condition: asset.condition, ownership: asset.ownership, status: asset.status,
        monthlyRate: asset.monthlyRate, zone: asset.zone,
        primaryImage: asset.images[0]?.url || null,
        occupiedFrom: currentBooking?.booking.startDate || null,
        occupiedTo: currentBooking?.booking.endDate || null,
        currentClient: currentBooking?.booking.client.companyName || null,
        currentBookingCode: currentBooking?.booking.bookingCode || null,
        bookings,
      };
    });

    res.json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

// POST /api/assets/campaign-data  Body: { assetIds: [1,2,3] }
exports.getCampaignData = async (req, res, next) => {
  try {
    const { assetIds } = req.body;
    if (!assetIds?.length) {
      return res.status(400).json({ success: false, message: 'assetIds array is required.' });
    }

    const assets = await prisma.asset.findMany({
      where: { id: { in: assetIds.map((id) => parseInt(id)) }, isActive: true },
      include: {
        zone: { select: { name: true, city: true } },
        images: { orderBy: { isPrimary: 'desc' } },
      },
      orderBy: { code: 'asc' },
    });

    const enrichedAssets = await Promise.all(
      assets.map(async (asset) => {
        const imagesWithBase64 = await Promise.all(
          asset.images.map(async (img) => {
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
            } catch { return { ...img, base64: null }; }
          })
        );
        return { ...asset, images: imagesWithBase64 };
      })
    );

    res.json(successResponse(enrichedAssets));
  } catch (error) {
    next(error);
  }
};
