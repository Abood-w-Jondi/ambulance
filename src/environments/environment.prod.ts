/**
 * Production Environment Configuration
 */
export const environment = {
  production: true,
  apiUrl: 'https://api.ambulance.sa/api',  // Production API URL - UPDATE THIS
  apiVersion: 'v1',

  // Full API endpoint
  get apiEndpoint() {
    return `${this.apiUrl}`;
  },

  // JWT Configuration
  jwt: {
    tokenKey: 'ambulance_auth_token',
    refreshTokenKey: 'ambulance_refresh_token',
    tokenExpiryKey: 'ambulance_token_expiry',
  },

  // File Upload Configuration
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/jpg'],
    allowedDocTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },

  // App Configuration
  app: {
    name: 'نظام إدارة الإسعاف',
    version: '1.0.0',
    defaultLanguage: 'ar',
    itemsPerPage: 10,
    autoRefreshInterval: 30000,
  },

  // Feature Flags
  features: {
    realTimeUpdates: true,
    notifications: true,
    fileUpload: true,
  },
};
