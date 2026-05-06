// utils/authUtils.ts
// Simple utilities for authentication

import type { UserRole } from '../../types';

const API_BASE = 'https://localhost:7002/api';

/** Map Identity/JWT role names to app `UserRole` (localStorage uses these lowercase values). */
export function normalizeUserRole(raw: string | null | undefined): UserRole {
  if (raw == null || raw === '') return 'manager';
  const r = raw.trim().toLowerCase();
  if (r === 'admin') return 'admin';
  if (r === 'risk manager' || r === 'riskmanager') return 'manager';
  if (r === 'manager') return 'manager';
  if (r === 'initiator' || r === 'initi') return 'initiator';
  if (r.includes('admin')) return 'admin';
  if (r.includes('initiat') || r === 'initi') return 'initiator';
  if (r.includes('risk') || r.includes('manager')) return 'manager';
  return 'manager';
}

/**
 * Check if token is expired and logout if needed
 */
export const checkTokenExpiry = (): boolean => {
  const tokenExpiry = localStorage.getItem('tokenExpiry');
  
  if (!tokenExpiry) return false;
  
  const expiryTime = parseInt(tokenExpiry);
  
  if (Date.now() >= expiryTime) {
    console.log('🔒 Token expired, logging out...');
    logout();
    return true;
  }
  
  return false;
};

/**
 * Logout user
 */
export const logout = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('username');
  localStorage.removeItem('userRole');
  localStorage.removeItem('tokenExpiry');
  localStorage.removeItem('isLoggedIn');
  
  window.location.href = '/login';
};

/**
 * Get auth token
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

/**
 * Refresh the access token
 */
export const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    console.error('No refresh token available');
    return false;
  }
  
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: refreshToken
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }
    
    const data = await response.json();
    
    // Update tokens
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    
    // Update expiry time
    const expiryTime = Date.now() + (data.expiresAt * 1000);
    localStorage.setItem('tokenExpiry', expiryTime.toString());
    
    console.log('✅ Token refreshed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Error refreshing token:', error);
    logout();
    return false;
  }
};

/**
 * Make authenticated API request with automatic token refresh
 */
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  // Check if token is expired first
  if (checkTokenExpiry()) {
    throw new Error('Session expired');
  }
  
  const token = getAuthToken();
  
  if (!token) {
    logout();
    throw new Error('No authentication token');
  }
  
  // Add authorization header
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    // If token expired (401), try to refresh
    if (response.status === 401) {
      console.log('Token expired, attempting refresh...');
      const refreshed = await refreshAccessToken();
      
      if (refreshed) {
        // Retry request with new token
        const newToken = getAuthToken();
        headers['Authorization'] = `Bearer ${newToken}`;
        return await fetch(url, { ...options, headers });
      } else {
        throw new Error('Session expired');
      }
    }
    
    return response;
    
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Get current user info
 */
export const getCurrentUser = () => {
  const rawRole = localStorage.getItem('userRole');
  return {
    username: localStorage.getItem('username'),
    role: normalizeUserRole(rawRole),
    isLoggedIn: localStorage.getItem('isLoggedIn') === 'true'
  };
};
