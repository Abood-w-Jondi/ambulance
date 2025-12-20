// Transfer/Trip Status Constants
export const TRANSFER_STATUS = {
  FIELD: 'ميداني',
  COMPLETED: 'تم النقل',
  FALSE_REPORT: 'بلاغ كاذب',
  IN_TRANSFER: 'ينقل', // Fixed typo from 'يتقل'
  NOT_COMPLETED: 'لم يتم النقل',
  MAINTENANCE: 'صيانة',
  REFUSED: 'رفض النقل',
  OTHER: 'اخرى'
} as const;

export type TransferStatus = typeof TRANSFER_STATUS[keyof typeof TRANSFER_STATUS];

// Transfer Status Colors
export const TRANSFER_STATUS_COLORS: Record<string, string> = {
  [TRANSFER_STATUS.COMPLETED]: '#28A745',
  [TRANSFER_STATUS.FIELD]: '#17A2B8',
  [TRANSFER_STATUS.IN_TRANSFER]: '#FFC107',
  [TRANSFER_STATUS.FALSE_REPORT]: '#DC3545',
  [TRANSFER_STATUS.NOT_COMPLETED]: '#DC3545',
  [TRANSFER_STATUS.REFUSED]: '#DC3545',
  [TRANSFER_STATUS.MAINTENANCE]: '#6C757D',
  [TRANSFER_STATUS.OTHER]: '#6C757D'
};

// Vehicle Status Constants (NEW: Expanded to 7 statuses)
export const VEHICLE_STATUS = {
  AVAILABLE: 'متاحة',                          // Available
  ON_WAY_TO_PATIENT: 'في الطريق للمريض',      // On way to patient
  AT_LOCATION: 'في الموقع',                   // At location
  ON_WAY_TO_HOSPITAL: 'في الطريق للمستشفى',   // On way to hospital
  AT_DESTINATION: 'في الوجهة',                // At destination
  OUT_OF_SERVICE: 'خارج الخدمة',              // Out of service
  END_SERVICE: 'إنهاء الخدمة'                 // End of service
} as const;

export type VehicleStatus = typeof VEHICLE_STATUS[keyof typeof VEHICLE_STATUS];

// Vehicle Status Colors
export const VEHICLE_STATUS_COLORS: Record<string, string> = {
  [VEHICLE_STATUS.AVAILABLE]: '#28A745',               // Green
  [VEHICLE_STATUS.ON_WAY_TO_PATIENT]: '#FFC107',       // Yellow
  [VEHICLE_STATUS.AT_LOCATION]: '#17A2B8',             // Cyan
  [VEHICLE_STATUS.ON_WAY_TO_HOSPITAL]: '#007BFF',      // Blue
  [VEHICLE_STATUS.AT_DESTINATION]: '#6F42C1',          // Purple
  [VEHICLE_STATUS.OUT_OF_SERVICE]: '#DC3545',          // Red
  [VEHICLE_STATUS.END_SERVICE]: '#6C757D'              // Gray
};

// Driver Status Constants
export const DRIVER_STATUS = {
  AVAILABLE: 'متاح',
  ON_TRIP: 'في رحلة',
  OFFLINE: 'غير متصل'
} as const;

export type DriverStatus = typeof DRIVER_STATUS[keyof typeof DRIVER_STATUS];

// Driver Status Colors
export const DRIVER_STATUS_COLORS: Record<string, string> = {
  [DRIVER_STATUS.AVAILABLE]: '#10B981',
  [DRIVER_STATUS.ON_TRIP]: '#3B82F6',
  [DRIVER_STATUS.OFFLINE]: '#6B7280'
};

// Paramedic Status Constants
export const PARAMEDIC_STATUS = {
  AVAILABLE: 'متاحة',
  ON_TRIP: 'في رحلة',
  OFFLINE: 'غير متصل',
  ON_LEAVE: 'في إجازة'
} as const;

export type ParamedicStatus = typeof PARAMEDIC_STATUS[keyof typeof PARAMEDIC_STATUS];

// Paramedic Status Colors
export const PARAMEDIC_STATUS_COLORS: Record<string, string> = {
  [PARAMEDIC_STATUS.AVAILABLE]: '#10B981',
  [PARAMEDIC_STATUS.ON_TRIP]: '#3B82F6',
  [PARAMEDIC_STATUS.OFFLINE]: '#6B7280',
  [PARAMEDIC_STATUS.ON_LEAVE]: '#F59E0B'
};

// Maintenance Status Constants
export const MAINTENANCE_STATUS = {
  COMPLETED: 'مكتملة',
  SCHEDULED: 'مجدولة',
  IN_PROGRESS: 'قيد التنفيذ'
} as const;

export type MaintenanceStatus = typeof MAINTENANCE_STATUS[keyof typeof MAINTENANCE_STATUS];

// Maintenance Status Colors
export const MAINTENANCE_STATUS_COLORS: Record<string, string> = {
  [MAINTENANCE_STATUS.COMPLETED]: '#34C759',
  [MAINTENANCE_STATUS.SCHEDULED]: '#007AFF',
  [MAINTENANCE_STATUS.IN_PROGRESS]: '#FF9500'
};

// Payment/Wallet Status Constants
export const PAYMENT_STATUS = {
  COMPLETED: 'مكتمل',
  PENDING: 'معلق',
  FAILED: 'فاشل'
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

// Payment Status CSS Classes
export const PAYMENT_STATUS_CLASSES: Record<string, string> = {
  [PAYMENT_STATUS.COMPLETED]: 'bg-success',
  [PAYMENT_STATUS.PENDING]: 'bg-warning',
  [PAYMENT_STATUS.FAILED]: 'bg-danger'
};

// Pending Trip Status Constants
export const PENDING_TRIP_STATUS = {
  PENDING: 'معلق',
  ACCEPTED: 'مقبول',
  REJECTED: 'مرفوض'
} as const;

export type PendingTripStatus = typeof PENDING_TRIP_STATUS[keyof typeof PENDING_TRIP_STATUS];

// Trip Priority Constants
export const TRIP_PRIORITY = {
  NORMAL: 'عادي',
  URGENT: 'عاجل',
  EMERGENCY: 'طارئ'
} as const;

export type TripPriority = typeof TRIP_PRIORITY[keyof typeof TRIP_PRIORITY];

// Trip Priority CSS Classes
export const TRIP_PRIORITY_CLASSES: Record<string, string> = {
  [TRIP_PRIORITY.NORMAL]: 'bg-secondary',
  [TRIP_PRIORITY.URGENT]: 'bg-warning',
  [TRIP_PRIORITY.EMERGENCY]: 'bg-danger'
};

// Helper Functions
export function getStatusColor(status: string, type: 'transfer' | 'vehicle' | 'driver' | 'maintenance' | 'paramedic'): string {
  switch (type) {
    case 'transfer':
      return TRANSFER_STATUS_COLORS[status] || '#6C757D';
    case 'vehicle':
      return VEHICLE_STATUS_COLORS[status] || '#6C757D';
    case 'driver':
      return DRIVER_STATUS_COLORS[status] || '#6B7280';
    case 'paramedic':
      return PARAMEDIC_STATUS_COLORS[status] || '#6B7280';
    case 'maintenance':
      return MAINTENANCE_STATUS_COLORS[status] || '#6C757D';
    default:
      return '#6C757D';
  }
}
