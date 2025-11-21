import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; name: string; code: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  saveFcmToken: (token: string) => api.post('/auth/fcm-token', { token }),
  getFirebaseToken: () => api.get('/auth/firebase-token'),
};

// Verification API
export const verificationApi = {
  sendCode: (email: string) => 
    api.post('/auth/send-verification', { email }),
  verifyCode: (email: string, code: string) => 
    api.post('/auth/verify-code', { email, code }),
  resendCode: (email: string) => 
    api.post('/auth/resend-verification', { email }),
};

// Trips API
export const tripsApi = {
  getAll: (status?: string) =>
    api.get('/trips', { params: { status } }),
  getOne: (id: string) => api.get(`/trips/${id}`),
  create: (data: any) => api.post('/trips', data),
  update: (id: string, data: any) => api.put(`/trips/${id}`, data),
  delete: (id: string) => api.delete(`/trips/${id}`),
};

// Members API
export const membersApi = {
  getAll: (tripId: string) => api.get(`/trips/${tripId}/members`),
  searchByEmail: (email: string) => 
    api.get(`/members/search`, { params: { email } }),
  // New invitation system
  invite: (tripId: string, email: string) =>
    api.post(`/trips/${tripId}/members/invite`, { email }),
  getPendingInvitations: (tripId: string) =>
    api.get(`/trips/${tripId}/members/invitations`),
  // Legacy
  create: (tripId: string, data: any) =>
    api.post(`/trips/${tripId}/members`, data),
  update: (tripId: string, id: string, data: any) =>
    api.put(`/trips/${tripId}/members/${id}`, data),
  delete: (tripId: string, id: string) =>
    api.delete(`/trips/${tripId}/members/${id}`),
};

// Invitations API
export const invitationsApi = {
  getMy: () => api.get('/invitations/my'),
  accept: (id: string) => api.post(`/invitations/${id}/accept`),
  reject: (id: string) => api.post(`/invitations/${id}/reject`),
  cancel: (id: string) => api.delete(`/invitations/${id}`),
};

// Notifications API
export const notificationsApi = {
  getAll: (unreadOnly = false) =>
    api.get('/notifications', { params: { unreadOnly: unreadOnly ? 'true' : 'false' } }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
  deleteAll: () => api.delete('/notifications'),
};

// Expenses API
export const expensesApi = {
  getAll: (tripId: string) => api.get(`/trips/${tripId}/expenses`),
  getOne: (id: string) => api.get(`/expenses/${id}`),
  create: (tripId: string, data: any) =>
    api.post(`/trips/${tripId}/expenses`, data),
  update: (id: string, data: any) => api.put(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
};

// Itinerary API
export const itineraryApi = {
  getAll: (tripId: string) => api.get(`/trips/${tripId}/itinerary`),
  getOne: (id: string) => api.get(`/itinerary/${id}`),
  create: (tripId: string, data: any) =>
    api.post(`/trips/${tripId}/itinerary`, data),
  update: (id: string, data: any) => api.put(`/itinerary/${id}`, data),
  delete: (id: string) => api.delete(`/itinerary/${id}`),
};

// Settlements API
export const settlementsApi = {
  getAll: (tripId: string) =>
    api.get(`/trips/${tripId}/settlements`),
  getDetail: (tripId: string, memberId: string) =>
    api.get(`/trips/${tripId}/settlements/${memberId}`),
  recalculate: (tripId: string) =>
    api.post(`/trips/${tripId}/settlements/recalculate`),
};
