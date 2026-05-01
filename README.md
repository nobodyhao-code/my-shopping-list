# Kokkola Retail App

A polished first-version retail consumer app for **iOS + Android (Expo / React Native)** with a matching Node.js backend.

## What is included

### Mobile features
- Register / login screen on app launch
- Digital loyalty card with a unique checkout identifier
- Barcode-based membership card UI
- Store finder with geolocation
- 3 simulated stores in the **Kokkola** area
- Offers and coupon activation
- User profile with lightweight authentication data
- Consent settings for privacy / marketing
- Digital receipts and purchase history (structured data version)

### Backend features
- Atlas-ready MongoDB integration
- Automatic fallback to local JSON files when Atlas is not configured
- Seeded demo data for users, stores, offers, and receipts
- APIs prepared for stronger authentication and future wallet / NFC expansion

## Project structure

- `backend/` → Node.js + Express API
- `mobile-app/` → Expo React Native app

## Default demo account

- Username: `demoUser`
- Password: `123456`

## Colors used

- Yellow: `#f6da40`
- Dark: `#323e48`
- Pink: `#ed5393`

## 1. Start backend

```bash
cd backend
npm install
npm start
```

Backend runs by default on:

```bash
http://localhost:10000
```

## 2. Start mobile app

```bash
cd mobile-app
npm install
npx expo start
```

### API base URL note

The mobile app reads:

- `EXPO_PUBLIC_API_URL` if you provide it
- otherwise it uses:
  - Android emulator: `http://10.0.2.2:10000/api`
  - iOS simulator / web: `http://localhost:10000/api`

If you test on a **real phone**, set your computer LAN IP before starting Expo:

```bash
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:10000/api npx expo start
```

Example:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.23:10000/api npx expo start
```

## MongoDB Atlas setup

Right now the backend is already coded to use Atlas **as soon as you provide a real connection string**.

### Important
The link you gave is an **Atlas dashboard URL**, not a MongoDB connection string. So the project cannot directly connect with only that URL.

### Backend env file

Create `backend/.env` from `backend/.env.example` and fill in:

```env
PORT=10000
CLIENT_ORIGIN=*
MONGODB_URI=mongodb+srv://<dbUser>:<dbPassword>@<cluster-host>/?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DB_NAME=kokkola_retail_app
```

### After filling `.env`

Run:

```bash
cd backend
npm install
npm run seed
npm start
```

If `MONGODB_URI` is present, the backend will:
- connect to Atlas
- use database name `kokkola_retail_app`
- create / use these collections automatically when empty:
  - `users`
  - `stores`
  - `offers`
  - `receipts`
  - `products`
- insert demo seed data automatically

## If you need to create the Atlas database manually

Inside MongoDB Atlas:

1. Open your project
2. Create or choose a cluster
3. Create a database user
4. Add your current IP to Network Access / IP Access List
5. Open **Data Explorer**
6. Create database: `kokkola_retail_app`
7. Create collections:
   - `users`
   - `stores`
   - `offers`
   - `receipts`
   - `products`
8. Then copy the **connection string** from **Connect > Drivers**
9. Put that string into `backend/.env`
10. Run:

```bash
npm run seed
```

That will fill the collections with sample data.

## Current implementation decisions

### Loyalty card
Implemented now:
- digital loyalty card screen
- unique customer identifier
- barcode visualization
- backend verification endpoint

Prepared for future:
- QR wallet pass delivery
- Apple Wallet / Google Wallet integration
- NFC integration

### User profile
Implemented now:
- lightweight registration
- essential profile fields only
- email
- phone
- consent settings

Prepared for future:
- OTP auth
- stronger national e-identification flow

### Store finder
Implemented now:
- 3 virtual Kokkola-area stores
- address
- opening hours
- phone
- email
- map link
- nearest store lookup by geolocation

### Offers and coupons
Implemented now:
- active offers list
- offer image
- validity period
- description
- activation button

### Digital receipts / purchase history
Implemented now:
- receipt list
- expandable receipt details
- structured receipt file endpoint

Prepared for future:
- direct Receipt Hero integration
- PDF receipt generation / attachment flow

## Key API routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/user/:username`
- `PUT /api/user/:username`
- `GET /api/loyalty/:username`
- `POST /api/verify-loyalty`
- `GET /api/stores`
- `GET /api/stores/nearest?lat=...&lng=...`
- `GET /api/offers?username=...`
- `POST /api/offers/:offerId/activate`
- `GET /api/receipts/:username`
- `GET /api/receipt/:receiptId`
- `GET /api/receipts/file/:receiptId`
- `GET /api/home/:username`

## Notes

- If Atlas is not configured, the backend still runs using local JSON data in `backend/src/data/`.
- The app is designed so you can later add stronger auth and deeper receipt integration without changing the UI structure too much.
