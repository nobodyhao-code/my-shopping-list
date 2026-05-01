import { Platform } from 'react-native';

const fallbackHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${fallbackHost}:10000/api`;

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(payload?.message || 'Request failed');
  }

  return payload;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getHome: (username) => request(`/home/${encodeURIComponent(username)}`),
  getProfile: (username) => request(`/user/${encodeURIComponent(username)}`),
  updateProfile: (username, payload) =>
    request(`/user/${encodeURIComponent(username)}`, { method: 'PUT', body: JSON.stringify(payload) }),
  getLoyaltyCard: (username) => request(`/loyalty/${encodeURIComponent(username)}`),
  verifyLoyalty: (barcode) => request('/verify-loyalty', { method: 'POST', body: JSON.stringify({ barcode }) }),
  getStores: () => request('/stores'),
  getNearestStore: (lat, lng) => request(`/stores/nearest?lat=${lat}&lng=${lng}`),
  getOffers: (username) => request(`/offers?username=${encodeURIComponent(username)}`),
  activateOffer: (offerId, username) =>
    request(`/offers/${encodeURIComponent(offerId)}/activate`, { method: 'POST', body: JSON.stringify({ username }) }),
  getProducts: () => request('/products'),
  getShoppingList: (username) => request(`/shopping-list/${encodeURIComponent(username)}`),
  saveShoppingList: (username, items) =>
    request(`/shopping-list/${encodeURIComponent(username)}`, { method: 'PUT', body: JSON.stringify({ items }) }),
  getReceipts: (username) => request(`/receipts/${encodeURIComponent(username)}`),
  getReceipt: (receiptId) => request(`/receipt/${encodeURIComponent(receiptId)}`),
  getReceiptFileUrl: (receiptId) => `${BASE_URL}/receipts/file/${encodeURIComponent(receiptId)}`
};
