/**
 * api.js – Roommie API Client
 * Load order: api.js → common-*.js → <page>.js
 *
 * This file provides ONLY:
 *   • Auth  – token / user storage helpers
 *   • apiRequest / apiRequestForm – HTTP helpers
 *   • RoommieAPI – all backend API methods
 *
 * UI logic (modals, header, toasts) lives in the common-*.js files.
 */

const BASE_URL = window.location.origin;
const API      = BASE_URL + '/api';

// ════════════════════════════════════════════════════════════════
//  Auth – localStorage helpers
// ════════════════════════════════════════════════════════════════
const Auth = {
  getToken() {
    return localStorage.getItem('roommie_token');
  },
  setToken(token) {
    localStorage.setItem('roommie_token', token);
  },
  getUser() {
    try {
      return JSON.parse(localStorage.getItem('roommie_user') || 'null');
    } catch { return null; }
  },
  setUser(user) {
    localStorage.setItem('roommie_user', JSON.stringify(user));
  },
  isLoggedIn() {
    return !!this.getToken() && !!this.getUser();
  },
  /** Clears stored credentials. Does NOT touch the UI – call doLogout() for that. */
  removeToken() {
    localStorage.removeItem('roommie_token');
    localStorage.removeItem('roommie_user');
  },
  logout() {
    this.removeToken();
  }
};

// ════════════════════════════════════════════════════════════════
//  HTTP Helpers
// ════════════════════════════════════════════════════════════════

/** JSON request (GET / POST / PUT / DELETE) */
async function apiRequest(path, options = {}) {
  const token   = Auth.getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API + path, { ...options, headers });

  let data;
  try { data = await res.json(); } catch { data = {}; }

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

/** FormData request – used for file uploads (no Content-Type header so browser sets boundary) */
async function apiRequestForm(path, formData, method = 'POST') {
  const token   = Auth.getToken();
  const headers = {};
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API + path, { method, headers, body: formData });

  let data;
  try { data = await res.json(); } catch { data = {}; }

  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// ════════════════════════════════════════════════════════════════
//  RoommieAPI – all backend endpoints
// ════════════════════════════════════════════════════════════════
const RoommieAPI = {

  // ── Auth ────────────────────────────────────────────────────

  /** Step 1: sends OTP to email. Does NOT create the account. */
  async sendVerification(email, password, firstName, lastName) {
    return apiRequest('/auth/send-verification', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName })
    });
  },

  /** Step 2: verifies the OTP and creates the account. */
  async verifyEmail(email, code) {
    const data = await apiRequest('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code })
    });
    Auth.setToken(data.token);
    Auth.setUser(data.user);
    return data;
  },

  async login(email, password) {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    Auth.setToken(data.token);
    Auth.setUser(data.user);
    return data;
  },

  async getMe() {
    return apiRequest('/auth/me');
  },

  async updatePassword(currentPassword, newPassword) {
    return apiRequest('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },

  async requestPasswordReset(email) {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  async resetPassword(email, code, newPassword) {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword })
    });
  },

  async requestEmailChange(newEmail) {
    return apiRequest('/auth/email/change/request', {
      method: 'POST',
      body: JSON.stringify({ newEmail })
    });
  },

  async confirmEmailChange(newEmail, code) {
    return apiRequest('/auth/email/change/confirm', {
      method: 'PUT',
      body: JSON.stringify({ newEmail, code })
    });
  },

  async deleteAccount() {
    return apiRequest('/auth/account', { method: 'DELETE' });
  },

  // ── Listings ────────────────────────────────────────────────
  async getListings(params = {}) {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
      )
    ).toString();
    return apiRequest('/listings' + (qs ? '?' + qs : ''));
  },

  async getFeatured() {
    return apiRequest('/listings/featured');
  },

  async getListing(id) {
    return apiRequest('/listings/' + id);
  },

  async createListing(formData) {
    return apiRequestForm('/listings', formData, 'POST');
  },

  async updateListing(id, formData) {
    return apiRequestForm('/listings/' + id, formData, 'PUT');
  },

  async deleteListing(id) {
    return apiRequest('/listings/' + id, { method: 'DELETE' });
  },

  // ── Users ────────────────────────────────────────────────────
  async getUser(id) {
    return apiRequest('/users/' + id);
  },

  async updateProfile(data) {
    return apiRequest('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // ── Saved ────────────────────────────────────────────────────
  async getSaved() {
    return apiRequest('/saved');
  },

  async saveListing(id) {
    return apiRequest('/saved/' + id, { method: 'POST' });
  },

  async unsaveListing(id) {
    return apiRequest('/saved/' + id, { method: 'DELETE' });
  },

  async checkSaved(id) {
    return apiRequest('/saved/check/' + id);
  }
};
