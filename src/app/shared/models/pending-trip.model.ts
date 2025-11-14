/**
 * Pending Trip model for unassigned trips awaiting driver acceptance
 */
export interface PendingTrip {
    // Basic Identification
    id: string;

    // Patient Information
    patientName: string;
    patientAge: number;
    patientPhone?: string;
    diagnosis: string;

    // Locations
    pickupLocation: string;
    pickupLatitude?: number;
    pickupLongitude?: number;
    dropoffLocation: string;
    dropoffLatitude?: number;
    dropoffLongitude?: number;

    // Scheduling
    pickupTime: Date;
    requestedAt: Date;

    // Estimates
    estimatedDistance: number;   // in kilometers
    estimatedDuration: number;   // in minutes
    estimatedEarnings: number;

    // Priority & Status
    priority: TripPriority;
    status: PendingTripStatus;

    // Assignment (when accepted)
    assignedDriverId?: string;
    assignedDriverName?: string;
    assignedParamedicId?: string;
    assignedParamedicName?: string;
    assignedVehicleId?: string;
    assignedVehicleName?: string;
    acceptedAt?: Date;
    rejectedAt?: Date;
    rejectionReason?: string;

    // Conversion
    convertedToTripId?: string;

    // Metadata
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
}

export type TripPriority = 'عادي' | 'عاجل' | 'طارئ';
export type PendingTripStatus = 'معلق' | 'مقبول' | 'مرفوض';

/**
 * Request to create a new pending trip
 */
export interface CreatePendingTripRequest {
    patientName: string;
    patientAge: number;
    patientPhone?: string;
    diagnosis: string;
    pickupLocation: string;
    pickupLatitude?: number;
    pickupLongitude?: number;
    dropoffLocation: string;
    dropoffLatitude?: number;
    dropoffLongitude?: number;
    pickupTime: Date;
    priority: TripPriority;
    notes?: string;
}

/**
 * Response when driver accepts/rejects a trip
 */
export interface TripActionResponse {
    success: boolean;
    message: string;
    trip?: PendingTrip;
}
