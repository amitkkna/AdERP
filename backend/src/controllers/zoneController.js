const prisma = require('../lib/prisma');
const { validationResult } = require('express-validator');
const { parsePagination, paginatedResponse, successResponse } = require('../utils/helpers');

exports.getZones = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { search, all } = req.query;

    const where = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { district: { contains: search, mode: 'insensitive' } },
      ];
    }

    // If 'all' param is passed, return all zones without pagination (for dropdowns)
    if (all === 'true') {
      const zones = await prisma.zone.findMany({
        where,
        include: { _count: { select: { assets: true } } },
        orderBy: { name: 'asc' },
      });
      return res.json(successResponse(zones));
    }

    const [zones, total] = await Promise.all([
      prisma.zone.findMany({
        where,
        include: { _count: { select: { assets: true } } },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.zone.count({ where }),
    ]);

    res.json(paginatedResponse(zones, total, page, limit));
  } catch (error) {
    next(error);
  }
};

exports.getZone = async (req, res, next) => {
  try {
    const zone = await prisma.zone.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { _count: { select: { assets: true } } },
    });

    if (!zone) {
      return res.status(404).json({ success: false, message: 'Zone not found.' });
    }

    res.json(successResponse(zone));
  } catch (error) {
    next(error);
  }
};

exports.createZone = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const { name, city, district, state, description } = req.body;

    const zone = await prisma.zone.create({
      data: { name, city, district, state: state || 'Chhattisgarh', description },
    });

    res.status(201).json(successResponse(zone, 'Zone created successfully.'));
  } catch (error) {
    next(error);
  }
};

exports.updateZone = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const { name, city, district, state, description, isActive } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (city) updateData.city = city;
    if (district) updateData.district = district;
    if (state) updateData.state = state;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    const zone = await prisma.zone.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
    });

    res.json(successResponse(zone, 'Zone updated successfully.'));
  } catch (error) {
    next(error);
  }
};

exports.deleteZone = async (req, res, next) => {
  try {
    const zoneId = parseInt(req.params.id);

    const assetCount = await prisma.asset.count({ where: { zoneId } });
    if (assetCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete zone. ${assetCount} asset(s) are linked to this zone.`,
      });
    }

    await prisma.zone.delete({ where: { id: zoneId } });

    res.json(successResponse(null, 'Zone deleted successfully.'));
  } catch (error) {
    next(error);
  }
};
