const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@advertiserp.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@advertiserp.com',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '9876543210',
    },
  });
  console.log('Admin user created:', admin.email);

  // Create manager user
  const managerPassword = await bcrypt.hash('manager123', 12);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@advertiserp.com' },
    update: {},
    create: {
      name: 'Rahul Sharma',
      email: 'manager@advertiserp.com',
      password: managerPassword,
      role: 'MANAGER',
      phone: '9876543211',
    },
  });
  console.log('Manager user created:', manager.email);

  // Create zones for Chhattisgarh
  const zonesData = [
    { name: 'Raipur Central', city: 'Raipur', district: 'Raipur', description: 'Central Raipur covering main roads and commercial areas' },
    { name: 'Raipur Highway', city: 'Raipur', district: 'Raipur', description: 'NH-6 and NH-200 highway stretch near Raipur' },
    { name: 'Bilaspur City', city: 'Bilaspur', district: 'Bilaspur', description: 'Bilaspur city area including Vyapar Vihar and Link Road' },
    { name: 'Durg-Bhilai', city: 'Durg', district: 'Durg', description: 'Durg-Bhilai twin city commercial belt' },
    { name: 'Korba Industrial', city: 'Korba', district: 'Korba', description: 'Korba industrial and commercial zone' },
    { name: 'Jagdalpur Town', city: 'Jagdalpur', district: 'Bastar', description: 'Jagdalpur town and surrounding areas' },
    { name: 'Rajnandgaon City', city: 'Rajnandgaon', district: 'Rajnandgaon', description: 'Rajnandgaon city main market and bypass road' },
    { name: 'Raigarh City', city: 'Raigarh', district: 'Raigarh', description: 'Raigarh city commercial area' },
  ];

  const zones = [];
  for (const zoneData of zonesData) {
    const zone = await prisma.zone.create({ data: zoneData });
    zones.push(zone);
  }
  console.log(`${zones.length} zones created.`);

  // Create sample assets
  const assetsData = [
    {
      code: 'BLB-RAI-001', name: 'Telibandha Lake Road Billboard', type: 'BILLBOARD',
      sizeWidth: 40, sizeHeight: 20, locationAddress: 'Near Telibandha Lake, Marine Drive',
      locationCity: 'Raipur', locationDistrict: 'Raipur', latitude: 21.2514, longitude: 81.6296,
      facingDirection: 'North', illumination: 'FRONTLIT', material: 'Steel + Flex',
      condition: 'GOOD', ownership: 'OWNED', status: 'BOOKED',
      monthlyRate: 45000, quarterlyRate: 120000, yearlyRate: 450000,
      permissionNumber: 'RMC/ADV/2024/0156', permissionExpiry: new Date('2026-03-15'),
      zoneId: zones[0].id,
    },
    {
      code: 'UNP-RAI-001', name: 'VIP Road Unipole', type: 'UNIPOLE',
      sizeWidth: 20, sizeHeight: 10, locationAddress: 'VIP Road, Near Airport',
      locationCity: 'Raipur', locationDistrict: 'Raipur', latitude: 21.1904, longitude: 81.7388,
      facingDirection: 'East', illumination: 'BACKLIT', material: 'Steel + Vinyl',
      condition: 'GOOD', ownership: 'OWNED', status: 'AVAILABLE',
      monthlyRate: 30000, quarterlyRate: 80000, yearlyRate: 300000,
      permissionNumber: 'RMC/ADV/2024/0203', permissionExpiry: new Date('2026-06-20'),
      zoneId: zones[0].id,
    },
    {
      code: 'BLB-RAI-002', name: 'NH-6 Highway Billboard', type: 'BILLBOARD',
      sizeWidth: 60, sizeHeight: 30, locationAddress: 'NH-6 Near Dhamtari Turn',
      locationCity: 'Raipur', locationDistrict: 'Raipur', latitude: 21.2100, longitude: 81.5900,
      facingDirection: 'South', illumination: 'LED', material: 'Steel + LED Panel',
      condition: 'GOOD', ownership: 'OWNED', status: 'BOOKED',
      monthlyRate: 75000, quarterlyRate: 200000, yearlyRate: 750000,
      permissionNumber: 'NHAI/CG/2024/0087', permissionExpiry: new Date('2026-12-31'),
      zoneId: zones[1].id,
    },
    {
      code: 'HRD-BSP-001', name: 'Vyapar Vihar Hoarding', type: 'HOARDING',
      sizeWidth: 30, sizeHeight: 15, locationAddress: 'Vyapar Vihar Main Road',
      locationCity: 'Bilaspur', locationDistrict: 'Bilaspur', latitude: 22.0797, longitude: 82.1391,
      facingDirection: 'West', illumination: 'FRONTLIT', material: 'Steel + Flex',
      condition: 'FAIR', ownership: 'LEASED', status: 'AVAILABLE',
      monthlyRate: 25000, quarterlyRate: 65000, yearlyRate: 240000,
      permissionNumber: 'BMC/ADV/2024/0045', permissionExpiry: new Date('2026-02-28'),
      zoneId: zones[2].id,
    },
    {
      code: 'UNP-BSP-001', name: 'Link Road Unipole Bilaspur', type: 'UNIPOLE',
      sizeWidth: 15, sizeHeight: 10, locationAddress: 'Link Road Near Bus Stand',
      locationCity: 'Bilaspur', locationDistrict: 'Bilaspur', latitude: 22.0735, longitude: 82.1498,
      facingDirection: 'North', illumination: 'NONLIT', material: 'Steel + Flex',
      condition: 'GOOD', ownership: 'OWNED', status: 'UNDER_MAINTENANCE',
      monthlyRate: 18000, quarterlyRate: 48000, yearlyRate: 180000,
      zoneId: zones[2].id,
    },
    {
      code: 'BLB-DUR-001', name: 'Bhilai Supela Chowk Billboard', type: 'BILLBOARD',
      sizeWidth: 40, sizeHeight: 20, locationAddress: 'Supela Chowk, Main Road',
      locationCity: 'Durg', locationDistrict: 'Durg', latitude: 21.2167, longitude: 81.3833,
      facingDirection: 'East', illumination: 'BACKLIT', material: 'Steel + Vinyl',
      condition: 'GOOD', ownership: 'OWNED', status: 'BOOKED',
      monthlyRate: 35000, quarterlyRate: 95000, yearlyRate: 360000,
      permissionNumber: 'DMC/ADV/2024/0078', permissionExpiry: new Date('2026-04-10'),
      zoneId: zones[3].id,
    },
    {
      code: 'GNT-DUR-001', name: 'Power House Chowk Gantry', type: 'GANTRY',
      sizeWidth: 50, sizeHeight: 8, locationAddress: 'Power House Chowk, Bhilai',
      locationCity: 'Durg', locationDistrict: 'Durg', latitude: 21.2097, longitude: 81.3785,
      facingDirection: 'Both', illumination: 'LED', material: 'Steel + LED',
      condition: 'GOOD', ownership: 'OWNED', status: 'AVAILABLE',
      monthlyRate: 60000, quarterlyRate: 160000, yearlyRate: 600000,
      permissionNumber: 'DMC/ADV/2024/0092', permissionExpiry: new Date('2026-08-15'),
      zoneId: zones[3].id,
    },
    {
      code: 'BLB-KOR-001', name: 'NTPC Road Billboard Korba', type: 'BILLBOARD',
      sizeWidth: 30, sizeHeight: 15, locationAddress: 'NTPC Road, Near Main Gate',
      locationCity: 'Korba', locationDistrict: 'Korba', latitude: 22.3595, longitude: 82.7501,
      facingDirection: 'South', illumination: 'FRONTLIT', material: 'Steel + Flex',
      condition: 'FAIR', ownership: 'LEASED', status: 'AVAILABLE',
      monthlyRate: 20000, quarterlyRate: 55000, yearlyRate: 200000,
      zoneId: zones[4].id,
    },
    {
      code: 'UNP-JAG-001', name: 'Jagdalpur Bus Stand Unipole', type: 'UNIPOLE',
      sizeWidth: 15, sizeHeight: 10, locationAddress: 'Near Main Bus Stand',
      locationCity: 'Jagdalpur', locationDistrict: 'Bastar', latitude: 19.0784, longitude: 82.0217,
      facingDirection: 'North', illumination: 'NONLIT', material: 'Steel + Flex',
      condition: 'GOOD', ownership: 'OWNED', status: 'AVAILABLE',
      monthlyRate: 12000, quarterlyRate: 32000, yearlyRate: 120000,
      zoneId: zones[5].id,
    },
    {
      code: 'BLB-RJN-001', name: 'Rajnandgaon Bypass Billboard', type: 'BILLBOARD',
      sizeWidth: 40, sizeHeight: 20, locationAddress: 'NH-6 Bypass Road',
      locationCity: 'Rajnandgaon', locationDistrict: 'Rajnandgaon', latitude: 21.0974, longitude: 81.0282,
      facingDirection: 'West', illumination: 'FRONTLIT', material: 'Steel + Flex',
      condition: 'GOOD', ownership: 'OWNED', status: 'BLOCKED',
      monthlyRate: 22000, quarterlyRate: 60000, yearlyRate: 220000,
      notes: 'Blocked due to municipal election code of conduct',
      zoneId: zones[6].id,
    },
    {
      code: 'HRD-RAG-001', name: 'Raigarh Station Road Hoarding', type: 'HOARDING',
      sizeWidth: 25, sizeHeight: 12, locationAddress: 'Station Road, Near Railway Station',
      locationCity: 'Raigarh', locationDistrict: 'Raigarh', latitude: 21.8974, longitude: 83.3950,
      facingDirection: 'East', illumination: 'NONLIT', material: 'Steel + Flex',
      condition: 'POOR', ownership: 'THIRD_PARTY', status: 'UNDER_MAINTENANCE',
      monthlyRate: 15000, quarterlyRate: 40000, yearlyRate: 150000,
      notes: 'Structure repair in progress',
      zoneId: zones[7].id,
    },
    {
      code: 'UNP-RAI-002', name: 'Shankar Nagar Unipole', type: 'UNIPOLE',
      sizeWidth: 12, sizeHeight: 8, locationAddress: 'Shankar Nagar Main Road',
      locationCity: 'Raipur', locationDistrict: 'Raipur', latitude: 21.2365, longitude: 81.6190,
      facingDirection: 'South', illumination: 'BACKLIT', material: 'Steel + Vinyl',
      condition: 'GOOD', ownership: 'OWNED', status: 'AVAILABLE',
      monthlyRate: 22000, quarterlyRate: 60000, yearlyRate: 220000,
      permissionNumber: 'RMC/ADV/2025/0012', permissionExpiry: new Date('2027-01-15'),
      zoneId: zones[0].id,
    },
  ];

  const assets = [];
  for (const assetData of assetsData) {
    const asset = await prisma.asset.create({ data: assetData });
    assets.push(asset);
  }
  console.log(`${assets.length} assets created.`);

  // Create sample clients
  const clientsData = [
    {
      companyName: 'Chhattisgarh Motors Pvt Ltd',
      contactPerson: 'Rajesh Agrawal',
      email: 'rajesh@cgmotors.com',
      phone: '9876500001',
      address: 'Fafadih Chowk, GE Road',
      city: 'Raipur',
      gstNumber: '22AAACC1234A1Z5',
      panNumber: 'AAACC1234A',
    },
    {
      companyName: 'Bhilai Steel Traders',
      contactPerson: 'Sunil Tiwari',
      email: 'sunil@bhilaisteeltraders.com',
      phone: '9876500002',
      address: 'Nehru Nagar, Sector 6',
      city: 'Durg',
      gstNumber: '22AABCB5678B1Z3',
      panNumber: 'AABCB5678B',
    },
    {
      companyName: 'Raipur Real Estate Group',
      contactPerson: 'Priya Sharma',
      email: 'priya@raipurrealestate.com',
      phone: '9876500003',
      alternatePhone: '9876500004',
      address: 'Shankar Nagar, Behind City Mall',
      city: 'Raipur',
      gstNumber: '22AADCR9012C1Z1',
      panNumber: 'AADCR9012C',
    },
    {
      companyName: 'Korba Power Solutions',
      contactPerson: 'Amit Verma',
      email: 'amit@korbapowersolutions.com',
      phone: '9876500005',
      address: 'NTPC Colony, Main Road',
      city: 'Korba',
    },
    {
      companyName: 'Jagdalpur Ayurveda Centre',
      contactPerson: 'Dr. Meena Kashyap',
      email: 'meena@jagayurveda.com',
      phone: '9876500006',
      address: 'Dharampura, Main Bazaar',
      city: 'Jagdalpur',
      state: 'Chhattisgarh',
    },
  ];

  const clients = [];
  for (const clientData of clientsData) {
    const client = await prisma.client.create({ data: clientData });
    clients.push(client);
  }
  console.log(`${clients.length} clients created.`);

  // Create sample bookings with BookingAsset junction
  const bookingsData = [
    {
      bookingCode: 'BK-26-0001',
      startDate: new Date('2025-12-01'),
      endDate: new Date('2026-05-31'),
      totalAmount: 270000,
      status: 'ACTIVE',
      clientId: clients[0].id,
      assets: [{ assetId: assets[0].id, monthlyRate: 45000 }],
    },
    {
      bookingCode: 'BK-26-0002',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      totalAmount: 900000,
      status: 'ACTIVE',
      clientId: clients[2].id,
      assets: [{ assetId: assets[2].id, monthlyRate: 75000 }],
    },
    {
      bookingCode: 'BK-26-0003',
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-07-14'),
      totalAmount: 210000,
      status: 'CONFIRMED',
      clientId: clients[1].id,
      assets: [{ assetId: assets[5].id, monthlyRate: 35000 }],
    },
    {
      bookingCode: 'BK-26-0004',
      startDate: new Date('2025-10-01'),
      endDate: new Date('2025-12-31'),
      totalAmount: 90000,
      status: 'COMPLETED',
      clientId: clients[0].id,
      assets: [{ assetId: assets[1].id, monthlyRate: 30000 }],
      notes: 'Campaign completed successfully',
    },
    {
      bookingCode: 'BK-26-0005',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-06-30'),
      totalAmount: 320000, // (60000 + 20000) * 4 months
      status: 'PENDING',
      clientId: clients[3].id,
      assets: [
        { assetId: assets[6].id, monthlyRate: 60000 },
        { assetId: assets[7].id, monthlyRate: 20000 },
      ],
      notes: 'Multi-site campaign across Durg and Korba',
    },
  ];

  const bookings = [];
  for (const { assets: assetEntries, ...bookingData } of bookingsData) {
    const booking = await prisma.booking.create({
      data: {
        ...bookingData,
        bookingAssets: {
          create: assetEntries.map((a) => ({
            assetId: a.assetId,
            monthlyRate: a.monthlyRate,
          })),
        },
      },
    });
    bookings.push(booking);
  }
  console.log(`${bookings.length} bookings created.`);

  // Create sample invoices
  const invoicesData = [
    {
      invoiceNumber: 'INV-2601-0001',
      invoiceDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-15'),
      subtotal: 135000,
      taxRate: 18,
      taxAmount: 24300,
      totalAmount: 159300,
      status: 'PAID',
      bookingId: bookings[0].id,
    },
    {
      invoiceNumber: 'INV-2602-0002',
      invoiceDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-15'),
      subtotal: 135000,
      taxRate: 18,
      taxAmount: 24300,
      totalAmount: 159300,
      status: 'SENT',
      bookingId: bookings[0].id,
    },
    {
      invoiceNumber: 'INV-2601-0003',
      invoiceDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-20'),
      subtotal: 225000,
      taxRate: 18,
      taxAmount: 40500,
      totalAmount: 265500,
      status: 'PAID',
      bookingId: bookings[1].id,
    },
    {
      invoiceNumber: 'INV-2601-0004',
      invoiceDate: new Date('2026-01-15'),
      dueDate: new Date('2026-02-15'),
      subtotal: 105000,
      taxRate: 18,
      taxAmount: 18900,
      totalAmount: 123900,
      status: 'PARTIALLY_PAID',
      bookingId: bookings[2].id,
    },
    {
      invoiceNumber: 'INV-2512-0005',
      invoiceDate: new Date('2025-12-01'),
      dueDate: new Date('2025-12-15'),
      subtotal: 90000,
      taxRate: 18,
      taxAmount: 16200,
      totalAmount: 106200,
      status: 'PAID',
      bookingId: bookings[3].id,
    },
  ];

  const invoices = [];
  for (const invoiceData of invoicesData) {
    const invoice = await prisma.invoice.create({ data: invoiceData });
    invoices.push(invoice);
  }
  console.log(`${invoices.length} invoices created.`);

  // Create sample payments
  const paymentsData = [
    {
      amount: 159300,
      paymentDate: new Date('2026-01-12'),
      method: 'BANK_TRANSFER',
      transactionRef: 'NEFT/2026/RAI/001234',
      invoiceId: invoices[0].id,
    },
    {
      amount: 265500,
      paymentDate: new Date('2026-01-18'),
      method: 'CHEQUE',
      transactionRef: 'CHQ-567890',
      notes: 'SBI Cheque',
      invoiceId: invoices[2].id,
    },
    {
      amount: 60000,
      paymentDate: new Date('2026-02-01'),
      method: 'UPI',
      transactionRef: 'UPI/2026/FEB/098765',
      notes: 'Partial payment',
      invoiceId: invoices[3].id,
    },
    {
      amount: 106200,
      paymentDate: new Date('2025-12-10'),
      method: 'BANK_TRANSFER',
      transactionRef: 'NEFT/2025/RAI/009876',
      invoiceId: invoices[4].id,
    },
  ];

  for (const paymentData of paymentsData) {
    await prisma.payment.create({ data: paymentData });
  }
  console.log(`${paymentsData.length} payments created.`);

  // Create sample expenses (CAPEX + OPEX)
  const expensesData = [
    // CAPEX — Construction costs
    {
      category: 'CONSTRUCTION',
      type: 'CAPEX',
      amount: 350000,
      date: new Date('2024-06-15'),
      description: 'Billboard structure construction',
      vendor: 'CG Steel Fabricators',
      reference: 'CSF/INV/2024/045',
      assetId: assets[0].id,
    },
    {
      category: 'INSTALLATION',
      type: 'CAPEX',
      amount: 75000,
      date: new Date('2024-06-25'),
      description: 'Flex installation and wiring',
      vendor: 'Raipur Sign Works',
      reference: 'RSW/2024/089',
      assetId: assets[0].id,
    },
    {
      category: 'CONSTRUCTION',
      type: 'CAPEX',
      amount: 550000,
      date: new Date('2024-08-10'),
      description: 'Highway billboard structure with LED panel',
      vendor: 'National Steel Structures',
      reference: 'NSS/INV/2024/112',
      assetId: assets[2].id,
    },
    {
      category: 'CONSTRUCTION',
      type: 'CAPEX',
      amount: 280000,
      date: new Date('2024-09-01'),
      description: 'Unipole structure erection',
      vendor: 'CG Steel Fabricators',
      reference: 'CSF/INV/2024/067',
      assetId: assets[1].id,
    },
    // OPEX — Monthly rent
    {
      category: 'RENT',
      type: 'OPEX',
      amount: 8000,
      date: new Date('2026-01-05'),
      description: 'Monthly land rent - January 2026',
      vendor: 'Telibandha Land Owner',
      reference: 'RENT/JAN/2026',
      assetId: assets[0].id,
    },
    {
      category: 'RENT',
      type: 'OPEX',
      amount: 8000,
      date: new Date('2026-02-05'),
      description: 'Monthly land rent - February 2026',
      vendor: 'Telibandha Land Owner',
      reference: 'RENT/FEB/2026',
      assetId: assets[0].id,
    },
    {
      category: 'RENT',
      type: 'OPEX',
      amount: 12000,
      date: new Date('2026-01-05'),
      description: 'Highway land lease - January 2026',
      vendor: 'NHAI Land Lease',
      reference: 'NHAI/LEASE/JAN/2026',
      assetId: assets[2].id,
    },
    // OPEX — Municipal tax
    {
      category: 'MUNICIPAL_TAX',
      type: 'OPEX',
      amount: 15000,
      date: new Date('2026-01-10'),
      description: 'Annual municipal advertisement tax - Raipur',
      vendor: 'Raipur Municipal Corporation',
      reference: 'RMC/TAX/2026/0156',
      assetId: assets[0].id,
    },
    {
      category: 'MUNICIPAL_TAX',
      type: 'OPEX',
      amount: 25000,
      date: new Date('2026-01-10'),
      description: 'Annual municipal advertisement tax - Highway',
      vendor: 'Raipur Municipal Corporation',
      reference: 'RMC/TAX/2026/0203',
      assetId: assets[2].id,
    },
    // OPEX — Electricity
    {
      category: 'ELECTRICITY',
      type: 'OPEX',
      amount: 3500,
      date: new Date('2026-01-20'),
      description: 'Frontlit electricity bill - January',
      vendor: 'CSPDCL',
      reference: 'CSPDCL/JAN/2026/4521',
      assetId: assets[0].id,
    },
    {
      category: 'ELECTRICITY',
      type: 'OPEX',
      amount: 8500,
      date: new Date('2026-01-20'),
      description: 'LED panel electricity bill - January',
      vendor: 'CSPDCL',
      reference: 'CSPDCL/JAN/2026/4522',
      assetId: assets[2].id,
    },
    // OPEX — Maintenance
    {
      category: 'MAINTENANCE',
      type: 'OPEX',
      amount: 5000,
      date: new Date('2026-01-25'),
      description: 'Flex replacement and cleaning',
      vendor: 'Local Signage Repairs',
      reference: 'LSR/2026/003',
      assetId: assets[5].id,
    },
    // OPEX — Permission fee
    {
      category: 'PERMISSION_FEE',
      type: 'OPEX',
      amount: 20000,
      date: new Date('2025-12-15'),
      description: 'Annual permission renewal fee',
      vendor: 'Raipur Municipal Corporation',
      reference: 'RMC/PERM/2025/0156',
      assetId: assets[0].id,
    },
  ];

  for (const expenseData of expensesData) {
    await prisma.expense.create({ data: expenseData });
  }
  console.log(`${expensesData.length} expenses created.`);

  // Create recurring expense schedules
  const recurringData = [
    // BLB-RAI-001: Rent monthly, Electricity monthly, Municipal tax yearly
    {
      category: 'RENT',
      frequency: 'MONTHLY',
      amount: 8000,
      description: 'Monthly land rent - Telibandha',
      startDate: new Date('2025-01-01'),
      nextDueDate: new Date('2026-02-01'),
      assetId: assets[0].id,
    },
    {
      category: 'ELECTRICITY',
      frequency: 'MONTHLY',
      amount: 3500,
      description: 'Frontlit electricity bill',
      startDate: new Date('2025-01-01'),
      nextDueDate: new Date('2026-02-15'),
      assetId: assets[0].id,
    },
    {
      category: 'MUNICIPAL_TAX',
      frequency: 'YEARLY',
      amount: 15000,
      description: 'Annual municipal ad tax - Raipur',
      startDate: new Date('2025-01-01'),
      nextDueDate: new Date('2026-01-10'),
      assetId: assets[0].id,
    },
    // BLB-RAI-002: Rent monthly, Electricity monthly
    {
      category: 'RENT',
      frequency: 'MONTHLY',
      amount: 15000,
      description: 'Monthly land rent - GE Road NH',
      startDate: new Date('2025-01-01'),
      nextDueDate: new Date('2026-02-05'),
      assetId: assets[2].id,
    },
    {
      category: 'ELECTRICITY',
      frequency: 'MONTHLY',
      amount: 8500,
      description: 'LED panel electricity bill',
      startDate: new Date('2025-01-01'),
      nextDueDate: new Date('2026-02-20'),
      assetId: assets[2].id,
    },
    // UNP-RAI-001: Rent quarterly
    {
      category: 'RENT',
      frequency: 'QUARTERLY',
      amount: 30000,
      description: 'Quarterly land rent - VIP Road',
      startDate: new Date('2025-01-01'),
      nextDueDate: new Date('2026-04-01'),
      assetId: assets[1].id,
    },
    // BLB-DUR-001: Rent monthly (overdue for testing)
    {
      category: 'RENT',
      frequency: 'MONTHLY',
      amount: 10000,
      description: 'Monthly land rent - Durg Station Road',
      startDate: new Date('2025-01-01'),
      nextDueDate: new Date('2026-01-15'),
      assetId: assets[5].id,
    },
    // BLB-DUR-001: Municipal tax half-yearly (overdue for testing)
    {
      category: 'MUNICIPAL_TAX',
      frequency: 'HALF_YEARLY',
      amount: 12000,
      description: 'Half-yearly municipal ad tax - Durg',
      startDate: new Date('2025-01-01'),
      nextDueDate: new Date('2026-01-01'),
      assetId: assets[5].id,
    },
  ];

  for (const data of recurringData) {
    await prisma.recurringExpense.create({ data });
  }
  console.log(`${recurringData.length} recurring expense schedules created.`);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
