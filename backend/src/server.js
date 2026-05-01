require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createStorage, createUserDocument, publicUser, verifyPassword, buildLoyaltyCard } = require('./storage');

const app = express();
const PORT = Number(process.env.PORT || 10000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

app.use(cors({ origin: CLIENT_ORIGIN === '*' ? true : CLIENT_ORIGIN }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));


const defaultCatalogProducts = [
  { id: 'product-apple', name: 'Apple', price: 1.5, category: 'Groceries' },
  { id: 'product-milk', name: 'Milk', price: 2.2, category: 'Groceries' },
  { id: 'product-coffee', name: 'Coffee', price: 6.1, category: 'Beverages' },
  { id: 'product-bread', name: 'Bread', price: 3.1, category: 'Bakery' },
  { id: 'product-banana', name: 'Banana', price: 1.9, category: 'Groceries' },
  { id: 'product-orange-juice', name: 'Orange Juice', price: 2.8, category: 'Beverages' },
  { id: 'product-eggs', name: 'Eggs 12 pcs', price: 4.1, category: 'Groceries' },
  { id: 'product-blueberries', name: 'Blueberries 250g', price: 4.8, category: 'Groceries' }
];

function toSafeStore(store) {
  return {
    id: store.id || store._id,
    name: store.name,
    address: store.address,
    openingHours: store.openingHours,
    phone: store.phone,
    email: store.email,
    latitude: store.latitude,
    longitude: store.longitude,
    mapLink: store.mapLink
  };
}

function toSafeOffer(offer) {
  return {
    id: offer.id || offer._id,
    name: offer.name,
    image: offer.image,
    validityPeriod: offer.validityPeriod,
    validFrom: offer.validFrom,
    validTo: offer.validTo,
    description: offer.description,
    couponCode: offer.couponCode
  };
}

function toSafeReceipt(receipt) {
  return {
    id: receipt.id || receipt._id,
    username: receipt.username,
    storeId: receipt.storeId,
    storeName: receipt.storeName,
    purchasedAt: receipt.purchasedAt,
    total: receipt.total,
    currency: receipt.currency,
    integrationSource: receipt.integrationSource,
    fileUrl: receipt.fileUrl,
    lines: receipt.lines || []
  };
}

function toSafeProduct(product) {
  return {
    id: product.id || product._id,
    name: product.name,
    price: Number(product.price || 0),
    category: product.category || 'General'
  };
}


function mergeCatalogProducts(products) {
  const map = new Map(defaultCatalogProducts.map((product) => [product.id, product]));
  (products || []).forEach((product) => {
    const safe = toSafeProduct(product);
    map.set(safe.id, safe);
  });
  return Array.from(map.values());
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function sanitizeShoppingList(items) {
  if (!Array.isArray(items)) return [];
  const aggregated = new Map();

  items.forEach((item) => {
    const productId = String(item?.productId || '').trim();
    const qty = Number(item?.qty || 0);
    if (!productId || !Number.isFinite(qty) || qty <= 0) return;
    aggregated.set(productId, (aggregated.get(productId) || 0) + Math.floor(qty));
  });

  return Array.from(aggregated.entries()).map(([productId, qty]) => ({
    productId,
    qty,
    addedAt: new Date().toISOString()
  }));
}

function buildShoppingListPayload(user, products) {
  const safeProducts = products.map(toSafeProduct);
  const productMap = new Map(safeProducts.map((product) => [product.id, product]));
  const items = sanitizeShoppingList(user?.shoppingList || []);

  const enrichedItems = items.map((item) => {
    const product = productMap.get(item.productId);
    return {
      productId: item.productId,
      qty: item.qty,
      name: product?.name || 'Unknown product',
      price: Number(product?.price || 0),
      category: product?.category || 'General',
      lineTotal: Number(product?.price || 0) * item.qty
    };
  });

  return {
    success: true,
    items,
    enrichedItems,
    totalItems: items.reduce((sum, item) => sum + item.qty, 0),
    estimatedTotal: enrichedItems.reduce((sum, item) => sum + item.lineTotal, 0)
  };
}

async function bootstrap() {
  const storage = await createStorage();

  app.get('/health', async (_req, res) => {
    res.json({ ok: true, storage: await storage.getMode() });
  });

  app.get('/api/health', async (_req, res) => {
    res.json({ ok: true, storage: await storage.getMode() });
  });

  app.post('/api/auth/register', async (req, res) => {
    const payload = req.body || {};
    const username = String(payload.username || '').trim();
    const password = String(payload.password || '');
    const email = String(payload.email || '').trim().toLowerCase();

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }
    if (!payload.privacyAccepted) {
      return res.status(400).json({ success: false, message: 'Privacy consent is required.' });
    }

    const users = await storage.listUsers();
    const exists = users.find((user) => user.username === username || (email && user.email === email));
    if (exists) {
      return res.status(409).json({ success: false, message: 'User already exists.' });
    }

    const newUser = createUserDocument(payload);
    users.push(newUser);
    await storage.saveUsers(users);

    return res.status(201).json({ success: true, user: publicUser(newUser) });
  });

  app.post('/api/auth/login', async (req, res) => {
    const payload = req.body || {};
    const identifier = String(payload.identifier || payload.username || '').trim().toLowerCase();
    const password = String(payload.password || '');

    const users = await storage.listUsers();
    const user = users.find(
      (entry) => entry.username.toLowerCase() === identifier || (entry.email || '').toLowerCase() === identifier
    );

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    return res.json({ success: true, user: publicUser(user) });
  });

  app.get('/api/user/:username', async (req, res) => {
    const users = await storage.listUsers();
    const user = users.find((entry) => entry.username === req.params.username);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json(publicUser(user));
  });

  app.put('/api/user/:username', async (req, res) => {
    const users = await storage.listUsers();
    const index = users.findIndex((entry) => entry.username === req.params.username);
    if (index === -1) return res.status(404).json({ success: false, message: 'User not found.' });

    const current = users[index];
    users[index] = {
      ...current,
      displayName: typeof req.body.displayName === 'string' && req.body.displayName.trim()
        ? req.body.displayName.trim()
        : current.displayName,
      email: typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : current.email,
      phone: typeof req.body.phone === 'string' ? req.body.phone.trim() : current.phone,
      favoriteStoreId: typeof req.body.favoriteStoreId === 'string' ? req.body.favoriteStoreId : current.favoriteStoreId,
      consent: {
        privacyAccepted:
          typeof req.body.privacyAccepted === 'boolean'
            ? req.body.privacyAccepted
            : current.consent?.privacyAccepted || false,
        marketing:
          typeof req.body.marketingConsent === 'boolean'
            ? req.body.marketingConsent
            : current.consent?.marketing || false
      },
      auth: {
        ...(current.auth || {}),
        mode: req.body.authMode || current.auth?.mode || 'password',
        strongAuthReady: true,
        otpReady: true
      }
    };

    await storage.saveUsers(users);
    return res.json({ success: true, user: publicUser(users[index]) });
  });

  app.get('/api/loyalty/:username', async (req, res) => {
    const users = await storage.listUsers();
    const user = users.find((entry) => entry.username === req.params.username);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const loyaltyCard = user.loyaltyCard || buildLoyaltyCard(user.username);
    return res.json({
      success: true,
      loyaltyCard,
      customerIdentifier: loyaltyCard.barcode,
      note: 'Apple Wallet / Google Wallet and NFC support are prepared in the data model for future implementation.'
    });
  });

  app.post('/api/verify-loyalty', async (req, res) => {
    const barcode = String(req.body.barcode || '').trim();
    if (!/^\d{13}$/.test(barcode)) {
      return res.status(400).json({ success: false, message: 'Barcode must be 13 digits.' });
    }
    const users = await storage.listUsers();
    const matchedUser = users.find((user) => user.loyaltyCard?.barcode === barcode);
    if (!matchedUser) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }
    return res.json({ success: true, username: matchedUser.username, memberId: matchedUser.loyaltyCard.memberId });
  });

  app.get('/api/stores', async (_req, res) => {
    const stores = await storage.listStores();
    res.json(stores.map(toSafeStore));
  });

  app.get('/api/stores/nearest', async (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ success: false, message: 'lat and lng are required.' });
    }
    const stores = await storage.listStores();
    if (!stores.length) {
      return res.status(404).json({ success: false, message: 'No stores available.' });
    }

    const nearest = stores
      .map((store) => ({ ...toSafeStore(store), distanceKm: haversineDistance(lat, lng, store.latitude, store.longitude) }))
      .sort((a, b) => a.distanceKm - b.distanceKm)[0];

    res.json(nearest);
  });

  app.get('/api/offers', async (req, res) => {
    const username = String(req.query.username || '').trim();
    const offers = (await storage.listOffers()).map(toSafeOffer);
    if (!username) {
      return res.json(offers.map((offer) => ({ ...offer, isActivated: false })));
    }
    const users = await storage.listUsers();
    const user = users.find((entry) => entry.username === username);
    const activatedOffers = new Set(user?.activatedOffers || []);
    return res.json(offers.map((offer) => ({ ...offer, isActivated: activatedOffers.has(offer.id) })));
  });

  app.post('/api/offers/:offerId/activate', async (req, res) => {
    const username = String(req.body.username || '').trim();
    if (!username) return res.status(400).json({ success: false, message: 'username is required.' });

    const users = await storage.listUsers();
    const offers = await storage.listOffers();
    const userIndex = users.findIndex((entry) => entry.username === username);
    const offer = offers.find((entry) => String(entry.id || entry._id) === req.params.offerId);

    if (userIndex === -1) return res.status(404).json({ success: false, message: 'User not found.' });
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found.' });

    const next = new Set(users[userIndex].activatedOffers || []);
    next.add(req.params.offerId);
    users[userIndex].activatedOffers = Array.from(next);
    await storage.saveUsers(users);

    return res.json({ success: true, activatedOffers: users[userIndex].activatedOffers });
  });

  app.get('/api/coupons', async (req, res) => {
    const username = String(req.query.username || '').trim();
    const offers = (await storage.listOffers()).map(toSafeOffer);
    if (!username) return res.json(offers);
    const users = await storage.listUsers();
    const user = users.find((entry) => entry.username === username);
    const activated = new Set(user?.activatedOffers || []);
    return res.json(offers.map((offer) => ({ ...offer, isActivated: activated.has(offer.id) })));
  });

  app.get('/api/products', async (_req, res) => {
    const safeProducts = mergeCatalogProducts(await storage.listProducts()).sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.name.localeCompare(b.name);
    });
    return res.json(safeProducts);
  });

  app.get('/api/shopping-list/:username', async (req, res) => {
    const users = await storage.listUsers();
    const user = users.find((entry) => entry.username === req.params.username);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    return res.json(buildShoppingListPayload(user, mergeCatalogProducts(await storage.listProducts())));
  });

  app.put('/api/shopping-list/:username', async (req, res) => {
    const users = await storage.listUsers();
    const userIndex = users.findIndex((entry) => entry.username === req.params.username);
    if (userIndex === -1) return res.status(404).json({ success: false, message: 'User not found.' });

    const nextItems = sanitizeShoppingList(req.body?.items || []);
    users[userIndex].shoppingList = nextItems;
    await storage.saveUsers(users);

    return res.json(buildShoppingListPayload(users[userIndex], mergeCatalogProducts(await storage.listProducts())));
  });

  app.get('/api/receipts/:username', async (req, res) => {
    const receipts = (await storage.listReceipts())
      .filter((receipt) => receipt.username === req.params.username)
      .map(toSafeReceipt)
      .sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
    return res.json(receipts);
  });

  app.get('/api/receipt/:receiptId', async (req, res) => {
    const receipts = await storage.listReceipts();
    const receipt = receipts.find((entry) => String(entry.id || entry._id) === req.params.receiptId);
    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found.' });
    return res.json(toSafeReceipt(receipt));
  });

  app.get('/api/receipts/file/:receiptId', async (req, res) => {
    const receipts = await storage.listReceipts();
    const receipt = receipts.find((entry) => String(entry.id || entry._id) === req.params.receiptId);
    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found.' });
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="${req.params.receiptId}.json"`);
    return res.send(JSON.stringify(toSafeReceipt(receipt), null, 2));
  });

  app.get('/api/home/:username', async (req, res) => {
    const username = req.params.username;
    const users = await storage.listUsers();
    const user = users.find((entry) => entry.username === username);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const stores = (await storage.listStores()).map(toSafeStore);
    const offers = (await storage.listOffers()).map(toSafeOffer);
    const receipts = (await storage.listReceipts())
      .filter((receipt) => receipt.username === username)
      .map(toSafeReceipt)
      .sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
    const favoriteStore = stores.find((store) => store.id === user.favoriteStoreId) || null;

    return res.json({
      success: true,
      greetingName: user.displayName || user.username,
      favoriteStore,
      summary: {
        storesCount: stores.length,
        offersCount: offers.length,
        activatedOffers: (user.activatedOffers || []).length,
        latestReceiptTotal: receipts[0]?.total || 0,
        latestReceiptDate: receipts[0]?.purchasedAt || null,
        favoriteStoreId: user.favoriteStoreId || null
      },
      recentReceipts: receipts.slice(0, 2)
    });
  });

  app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });

  const server = app.listen(PORT, () => {
    console.log(`Retail app backend running on http://localhost:${PORT}`);
  });

  const close = async () => {
    await storage.close();
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', close);
  process.on('SIGTERM', close);
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
