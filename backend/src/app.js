const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const config = require('./config');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const zoneRoutes = require('./routes/zones');
const assetRoutes = require('./routes/assets');
const clientRoutes = require('./routes/clients');
const bookingRoutes = require('./routes/bookings');
const invoiceRoutes = require('./routes/invoices');
const expenseRoutes = require('./routes/expenses');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports');
const recurringExpenseRoutes = require('./routes/recurringExpenses');
const enquiryRoutes = require('./routes/enquiries');
const pdcRoutes = require('./routes/pdcs');
const quotationRoutes = require('./routes/quotations');
const portalRoutes = require('./routes/portal');
const workOrderRoutes = require('./routes/workOrders');

const app = express();

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/recurring-expenses', recurringExpenseRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/pdcs', pdcRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/work-orders', workOrderRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
