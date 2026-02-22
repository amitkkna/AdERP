const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const { parsePagination, paginatedResponse, successResponse } = require('../utils/helpers');

const prisma = new PrismaClient();

exports.getClients = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { search, city, sortBy, sortOrder } = req.query;

    const where = { isActive: true };

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { gstNumber: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (city) where.city = { contains: city, mode: 'insensitive' };

    const orderBy = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          _count: { select: { bookings: true } },
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.client.count({ where }),
    ]);

    res.json(paginatedResponse(clients, total, page, limit));
  } catch (error) {
    next(error);
  }
};

exports.getClient = async (req, res, next) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        bookings: {
          include: {
            bookingAssets: {
              include: {
                asset: { select: { id: true, code: true, name: true, type: true, locationCity: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { bookings: true } },
      },
    });

    if (!client || !client.isActive) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    res.json(successResponse(client));
  } catch (error) {
    next(error);
  }
};

exports.createClient = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const {
      companyName, contactPerson, email, phone, alternatePhone,
      address, city, state, pincode, gstNumber, panNumber, notes,
    } = req.body;

    const client = await prisma.client.create({
      data: {
        companyName, contactPerson, email, phone, alternatePhone,
        address, city, state: state || 'Chhattisgarh',
        pincode, gstNumber, panNumber, notes,
      },
    });

    res.status(201).json(successResponse(client, 'Client created successfully.'));
  } catch (error) {
    next(error);
  }
};

exports.updateClient = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const data = { ...req.body };
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;

    const client = await prisma.client.update({
      where: { id: parseInt(req.params.id) },
      data,
    });

    res.json(successResponse(client, 'Client updated successfully.'));
  } catch (error) {
    next(error);
  }
};

exports.deleteClient = async (req, res, next) => {
  try {
    const clientId = parseInt(req.params.id);

    // Check for active bookings
    const activeBookings = await prisma.booking.count({
      where: { clientId, status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] } },
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete client with active bookings.',
      });
    }

    await prisma.client.update({
      where: { id: clientId },
      data: { isActive: false },
    });

    res.json(successResponse(null, 'Client deleted successfully.'));
  } catch (error) {
    next(error);
  }
};

exports.getAllClients = async (req, res, next) => {
  try {
    const clients = await prisma.client.findMany({
      where: { isActive: true },
      select: { id: true, companyName: true, contactPerson: true },
      orderBy: { companyName: 'asc' },
    });

    res.json(successResponse(clients));
  } catch (error) {
    next(error);
  }
};
