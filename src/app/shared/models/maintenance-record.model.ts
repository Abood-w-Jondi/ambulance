/**
 * Complete Maintenance Record model with properties actually used in the application
 */
export interface MaintenanceRecord {
    // Basic Identification
    id: string;

    // Vehicle Information
    vehicleId: string;         // Vehicle display ID or name
    vehicleInternalId?: string; // Internal vehicle ID for backend reference

    // Date & Time
    date: Date;

    // Maintenance Details
    type: string;              // Dynamic maintenance type from database

    // Cost Information
    cost: number;              // Total cost

    // Service Provider
    serviceLocation: string;   // Service center name or location

    // Odometer Information
    odometerBefore: number;    // Odometer reading before service
    odometerAfter: number;     // Odometer reading after service

    // Documentation
    notes: string;             // General notes

    // Status
    status: MaintenanceStatus;
}

export type MaintenanceStatus = 'مكتملة' | 'مجدولة' | 'قيد التنفيذ';
