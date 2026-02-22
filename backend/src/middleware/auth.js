const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const config = require('../config');

const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid token or user deactivated.' });
    }

    req.user = user;

    // For CLIENT role, attach the linked clientId so controllers can scope data
    if (user.role === 'CLIENT') {
      const clientRecord = await prisma.client.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      req.user.clientId = clientRecord?.id || null;
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.' });
    }
    next(error);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this resource.' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
