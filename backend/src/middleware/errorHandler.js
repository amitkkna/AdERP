const config = require('../config');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  if (config.nodeEnv === 'development') {
    console.error(err.stack);
  }

  // Prisma known errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: `Duplicate value for field: ${err.meta?.target?.join(', ')}`,
    });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found.',
    });
  }

  // Express-validator errors
  if (err.array && typeof err.array === 'function') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: err.array(),
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error.',
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
