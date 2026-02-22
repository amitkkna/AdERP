const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const { parsePagination, paginatedResponse, successResponse } = require('../utils/helpers');

const prisma = new PrismaClient();

exports.getUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { search, role } = req.query;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, role: true, phone: true, isActive: true, createdAt: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json(paginatedResponse(users, total, page, limit));
  } catch (error) {
    next(error);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: { id: true, name: true, email: true, role: true, phone: true, isActive: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json(successResponse(user));
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const { name, email, role, phone, isActive, password } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) updateData.password = await bcrypt.hash(password, 12);

    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, phone: true, isActive: true },
    });

    res.json(successResponse(user, 'User updated successfully.'));
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    if (userId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate your own account.' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    res.json(successResponse(null, 'User deactivated successfully.'));
  } catch (error) {
    next(error);
  }
};
