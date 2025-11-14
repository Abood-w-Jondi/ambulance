/**
 * Settings-related models for dynamic configuration data
 * These are managed through the admin settings pages
 */

/**
 * Maintenance Type - Dynamic configuration for types of vehicle maintenance
 */
export interface MaintenanceTypeConfig {
    id: string;
    name: string;                  // Display name (e.g., 'صيانة دورية')
    description: string;           // Description of the maintenance type
    estimatedCost: number;         // Estimated cost
    estimatedDuration: number;     // Estimated duration in hours
    isActive: boolean;             // Whether this type is active/available
    createdAt: Date;               // When this type was created
}

/**
 * Transportation Type - Dynamic configuration for types of patient transfers
 */
export interface TransportationTypeConfig {
    id: string;
    name: string;                  // Display name (e.g., 'نقل طوارئ')
    description: string;           // Description of the transportation type
    isActive: boolean;             // Whether this type is active/available
    createdAt: Date;               // When this type was created
}

/**
 * Common Location - Frequently used locations for transfers
 */
export interface CommonLocation {
    id: string;
    name: string;                  // Location name (e.g., 'مستشفى الملك فيصل')
    address: string;               // Street address
    city: string;                  // City name
    type: LocationType;            // Type of location
    phoneNumber: string;           // Contact phone number
    isActive: boolean;             // Whether this location is active
    createdAt: Date;               // When this location was added
}

export type LocationType = 'hospital' | 'clinic' | 'emergency' | 'other';
