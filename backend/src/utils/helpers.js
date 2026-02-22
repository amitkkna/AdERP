const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const paginatedResponse = (data, total, page, limit) => {
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const successResponse = (data, message = 'Success') => {
  return { success: true, message, data };
};

const generateAssetCode = (type, city, sequence) => {
  const typePrefixes = {
    BILLBOARD: 'BLB',
    UNIPOLE: 'UNP',
    HOARDING: 'HRD',
    GANTRY: 'GNT',
    OTHER: 'OTH',
  };

  const cityCode = city
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z]/g, 'X');

  const prefix = typePrefixes[type] || 'OTH';
  const seq = String(sequence).padStart(3, '0');
  return `${prefix}-${cityCode}-${seq}`;
};

module.exports = {
  parsePagination,
  paginatedResponse,
  successResponse,
  generateAssetCode,
};
