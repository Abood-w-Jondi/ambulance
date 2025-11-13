/**
 * Complete Fuel Record model with properties actually used in the application
 */
export interface FuelRecord {
    // Basic Identification
    id: string;

    // Vehicle Information
    ambulanceName: string;     // Display name (e.g., 'إسعاف 04')
    ambulanceNumber: string;   // Vehicle ID (e.g., 'AMB-004')
    ambulanceId?: string;      // Internal vehicle ID for backend reference

    // Driver Information
    driverId: string;          // Driver display ID (e.g., 'D-124')
    driverName: string;        // Driver display name
    driverInternalId?: string; // Internal driver ID for backend reference

    // Date & Time
    date: Date;

    // Odometer Readings
    odometerBefore: number;    // Odometer reading before refueling
    odometerAfter: number;     // Odometer reading after refueling

    // Fuel Information
    fuelAmount: number;        // Fuel amount in liters
    cost: number;              // Total cost

    // Additional Information
    notes?: string;
}
