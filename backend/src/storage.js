const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dataDir = path.join(__dirname, 'data');

function createId(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}

function passwordHash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  if (!storedHash.includes(':')) return storedHash === password;
  const [salt, originalHash] = storedHash.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
}

function buildMemberNumber(username) {
  const digest = crypto.createHash('sha1').update(username).digest('hex').replace(/[^0-9a-f]/g, '');
  const digits = digest
    .split('')
    .map((char) => parseInt(char, 16) % 10)
    .join('')
    .slice(0, 12)
    .padEnd(12, '7');
  return `27${digits}`.slice(0, 13);
}

function buildLoyaltyCard(username) {
  const memberNumber = buildMemberNumber(username);
  return {
    memberId: `KKL-${memberNumber.slice(0, 4)}-${memberNumber.slice(4, 8)}-${memberNumber.slice(8, 13)}`,
    barcode: memberNumber,
    qrValue: `kokkola-retail://loyalty/${memberNumber}`,
    walletStatus: 'planned',
    nfcStatus: 'planned'
  };
}

function createUserDocument(payload = {}) {
  const username = String(payload.username || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();
  const phone = String(payload.phone || '').trim();
  const password = String(payload.password || '');
  const displayName = String(payload.displayName || username || 'Member').trim();
  return {
    id: createId('user'),
    username,
    displayName,
    email,
    phone,
    passwordHash: passwordHash(password),
    consent: {
      privacyAccepted: Boolean(payload.privacyAccepted),
      marketing: Boolean(payload.marketingConsent)
    },
    auth: {
      mode: 'password',
      otpReady: true,
      strongAuthReady: true
    },
    loyaltyCard: buildLoyaltyCard(username),
    activatedOffers: [],
    shoppingList: [],
    favoriteStoreId: payload.favoriteStoreId || null,
    createdAt: new Date().toISOString()
  };
}

function publicUser(user) {
  if (!user) return null;
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

const seedStores = [
  {
    id: 'store-kokkola-center',
    name: 'Kokkola Keskusta Market',
    address: 'Isokatu 12, 67100 Kokkola, Finland',
    openingHours: 'Mon-Sat 08:00-21:00, Sun 11:00-18:00',
    phone: '+358 6 810 2201',
    email: 'keskusta@kokkolaretail.demo',
    latitude: 63.8385,
    longitude: 23.1301,
    mapLink: 'https://maps.google.com/?q=63.8385,23.1301'
  },
  {
    id: 'store-kokkola-heinola',
    name: 'Kokkola Heinola Market',
    address: 'Heinolankaari 8, 67100 Kokkola, Finland',
    openingHours: 'Mon-Fri 09:00-21:00, Sat 09:00-19:00, Sun 12:00-18:00',
    phone: '+358 6 810 2202',
    email: 'heinola@kokkolaretail.demo',
    latitude: 63.8407,
    longitude: 23.1034,
    mapLink: 'https://maps.google.com/?q=63.8407,23.1034'
  },
  {
    id: 'store-kokkola-ykspihlaja',
    name: 'Kokkola Ykspihlaja Market',
    address: 'Satamakatu 4, 67900 Kokkola, Finland',
    openingHours: 'Mon-Sat 08:30-20:00, Sun 12:00-18:00',
    phone: '+358 6 810 2203',
    email: 'ykspihlaja@kokkolaretail.demo',
    latitude: 63.8331,
    longitude: 23.0818,
    mapLink: 'https://maps.google.com/?q=63.8331,23.0818'
  }
];

const seedOffers = [
  {
    id: 'offer-welcome-2',
    name: 'Welcome €2 Coupon',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80',
    validityPeriod: '2026-03-01 to 2026-06-30',
    validFrom: '2026-03-01',
    validTo: '2026-06-30',
    description: 'Save €2 on any basket over €15. Perfect for first-time sign-ins.',
    couponCode: 'WELCOME2'
  },
  {
    id: 'offer-weekend-5',
    name: 'Weekend Basket Deal',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80',
    validityPeriod: '2026-03-20 to 2026-05-31',
    validFrom: '2026-03-20',
    validTo: '2026-05-31',
    description: 'Get €5 off when your total is above €50 during the weekend.',
    couponCode: 'WEEKEND5'
  },
  {
    id: 'offer-coffee-combo',
    name: 'Coffee & Pastry Combo',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80',
    validityPeriod: '2026-03-15 to 2026-04-30',
    validFrom: '2026-03-15',
    validTo: '2026-04-30',
    description: 'Bundle offer for one coffee and one pastry at a sweeter price.',
    couponCode: 'CAFECOMBO'
  }
];

function buildReceiptFilePath(receiptId) {
  return `/api/receipts/file/${receiptId}`;
}

const seedReceipts = [
  {
    id: 'receipt-demo-001',
    username: 'demoUser',
    storeId: 'store-kokkola-center',
    storeName: 'Kokkola Keskusta Market',
    purchasedAt: '2026-03-24T14:18:00.000Z',
    total: 18.4,
    currency: 'EUR',
    integrationSource: 'simulated-receipt-hero',
    fileUrl: buildReceiptFilePath('receipt-demo-001'),
    lines: [
      { name: 'Milk 1L', qty: 2, unitPrice: 2.2, total: 4.4 },
      { name: 'Blueberries 250g', qty: 1, unitPrice: 4.8, total: 4.8 },
      { name: 'Bread', qty: 1, unitPrice: 3.1, total: 3.1 },
      { name: 'Coffee Beans 250g', qty: 1, unitPrice: 6.1, total: 6.1 }
    ]
  },
  {
    id: 'receipt-demo-002',
    username: 'demoUser',
    storeId: 'store-kokkola-heinola',
    storeName: 'Kokkola Heinola Market',
    purchasedAt: '2026-03-18T09:06:00.000Z',
    total: 32.7,
    currency: 'EUR',
    integrationSource: 'simulated-receipt-hero',
    fileUrl: buildReceiptFilePath('receipt-demo-002'),
    lines: [
      { name: 'Chicken Fillet', qty: 1, unitPrice: 9.5, total: 9.5 },
      { name: 'Rice 2kg', qty: 1, unitPrice: 5.9, total: 5.9 },
      { name: 'Orange Juice', qty: 2, unitPrice: 2.8, total: 5.6 },
      { name: 'Eggs 12 pcs', qty: 2, unitPrice: 4.1, total: 8.2 },
      { name: 'Bananas', qty: 1, unitPrice: 3.5, total: 3.5 }
    ]
  }
];

const seedProducts = [
  { id: 'product-apple', name: 'Apple', price: 1.5, category: 'Groceries' },
  { id: 'product-milk', name: 'Milk', price: 2.2, category: 'Groceries' },
  { id: 'product-coffee', name: 'Coffee', price: 6.1, category: 'Beverages' },
  { id: 'product-bread', name: 'Bread', price: 3.1, category: 'Bakery' },
  { id: 'product-banana', name: 'Banana', price: 1.9, category: 'Groceries' },
  { id: 'product-orange-juice', name: 'Orange Juice', price: 2.8, category: 'Beverages' },
  { id: 'product-eggs', name: 'Eggs 12 pcs', price: 4.1, category: 'Groceries' },
  { id: 'product-blueberries', name: 'Blueberries 250g', price: 4.8, category: 'Groceries' }
];

function getSeedDemoUser() {
  return createUserDocument({
    username: 'demoUser',
    displayName: 'Demo Member',
    email: 'demo@example.com',
    phone: '+358401234567',
    password: '123456',
    privacyAccepted: true,
    marketingConsent: true,
    favoriteStoreId: 'store-kokkola-center'
  });
}

function ensureFile(filePath, fallbackValue) {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(fallbackValue, null, 2));
  }
}

function readJson(filePath, fallbackValue) {
  ensureFile(filePath, fallbackValue);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_error) {
    fs.writeFileSync(filePath, JSON.stringify(fallbackValue, null, 2));
    return fallbackValue;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

class JsonStorage {
  constructor() {
    this.files = {
      users: path.join(dataDir, 'users.json'),
      stores: path.join(dataDir, 'stores.json'),
      offers: path.join(dataDir, 'offers.json'),
      receipts: path.join(dataDir, 'receipts.json'),
      products: path.join(dataDir, 'products.json')
    };
  }

  async init() {
    ensureFile(this.files.users, []);
    ensureFile(this.files.stores, seedStores);
    ensureFile(this.files.offers, seedOffers);
    ensureFile(this.files.receipts, seedReceipts);
    ensureFile(this.files.products, seedProducts);

    const users = readJson(this.files.users, []);
    if (!users.length) {
      writeJson(this.files.users, [getSeedDemoUser()]);
    }
    return this;
  }

  async getMode() {
    return 'json-fallback';
  }

  async listUsers() {
    return readJson(this.files.users, []);
  }

  async saveUsers(users) {
    writeJson(this.files.users, users);
  }

  async listStores() {
    return readJson(this.files.stores, seedStores);
  }

  async listOffers() {
    return readJson(this.files.offers, seedOffers);
  }

  async listReceipts() {
    return readJson(this.files.receipts, seedReceipts);
  }

  async listProducts() {
    return readJson(this.files.products, seedProducts);
  }

  async close() {}
}

class MongoStorage {
  constructor({ uri, dbName }) {
    this.uri = uri;
    this.dbName = dbName || 'kokkola_retail_app';
  }

  async init() {
    let MongoClient;
    try {
      ({ MongoClient } = require('mongodb'));
    } catch (error) {
      throw new Error('mongodb package is required when MONGODB_URI is set. Run npm install in backend first.');
    }
    this.client = new MongoClient(this.uri, {
      serverSelectionTimeoutMS: 10000
    });
    await this.client.connect();
    this.db = this.client.db(this.dbName);
    this.users = this.db.collection('users');
    this.stores = this.db.collection('stores');
    this.offers = this.db.collection('offers');
    this.receipts = this.db.collection('receipts');
    this.products = this.db.collection('products');

    await this.users.createIndex({ username: 1 }, { unique: true });
    await this.users.createIndex({ email: 1 }, { unique: true, sparse: true });
    await this.receipts.createIndex({ username: 1, purchasedAt: -1 });

    if ((await this.users.countDocuments()) === 0) {
      await this.users.insertOne(getSeedDemoUser());
    }
    if ((await this.stores.countDocuments()) === 0) {
      await this.stores.insertMany(seedStores);
    }
    if ((await this.offers.countDocuments()) === 0) {
      await this.offers.insertMany(seedOffers);
    }
    if ((await this.receipts.countDocuments()) === 0) {
      await this.receipts.insertMany(seedReceipts);
    }
    if ((await this.products.countDocuments()) === 0) {
      await this.products.insertMany(seedProducts);
    }

    return this;
  }

  async getMode() {
    return 'mongodb-atlas';
  }

  async listUsers() {
    return this.users.find({}).toArray();
  }

  async saveUsers(users) {
    await this.users.deleteMany({});
    if (users.length) await this.users.insertMany(users);
  }

  async listStores() {
    return this.stores.find({}).toArray();
  }

  async listOffers() {
    return this.offers.find({}).toArray();
  }

  async listReceipts() {
    return this.receipts.find({}).toArray();
  }

  async listProducts() {
    return this.products.find({}).toArray();
  }

  async close() {
    if (this.client) await this.client.close();
  }
}

async function createStorage() {
  const useMongo = Boolean(process.env.MONGODB_URI);
  if (!useMongo) {
    return new JsonStorage().init();
  }
  return new MongoStorage({ uri: process.env.MONGODB_URI, dbName: process.env.MONGODB_DB_NAME }).init();
}

module.exports = {
  createStorage,
  createUserDocument,
  publicUser,
  verifyPassword,
  buildLoyaltyCard,
  createId
};
