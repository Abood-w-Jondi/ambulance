/**
 * Complete Maintenance Record model with properties actually used in the application
 */
export interface MaintenanceRecord {
    // Basic Identification
    id: string;

    // Vehicle Information
    vehicleId: string;          // Vehicle ID (e.g., 'AMB-004')
    vehicleName?: string;       // Vehicle display name (e.g., 'إسعاف 04')
    vehicleInternalId?: string; // Internal vehicle ID for backend reference

    // Date & Time
    date: Date;

    // Maintenance Details
    type?: string;                     // Legacy maintenance type (for backward compatibility)
    maintenanceTypeId?: string;        // Maintenance type ID (FK to maintenance_types)
    maintenanceTypeName?: string;      // Maintenance type name (populated from join)

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
