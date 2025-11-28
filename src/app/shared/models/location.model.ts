/**
 * Location model for managing common and custom locations
 */
export interface Location {
    // Basic Identification
    id: string;
    name: string;

    // Location Type/Tag
    locationType: LocationTag;  // Common or custom location

    // Optional details (from common-locations component)
    address?: string;
    city?: string;
    type?: LocationType;  // hospital, clinic, emergency, other
    phoneNumber?: string;
    isActive?: boolean;

    // Metadata
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Location tag to differentiate common vs non-common locations
 */
export type LocationTag = 'common' | 'custom';

// Import from settings.model for backward compatibility
import type { LocationType, CommonLocation } from './settings.model';
export type { LocationType, CommonLocation };

/**
 * Location reference for use in dropdowns and searches
 */
export interface LocationReference {
    id: string;
    name: string;
    locationType: LocationTag;
    type?: LocationType;
}

/**
 * Request to create a new location
 */
export interface CreateLocationRequest {
    name: string;
    locationType: LocationTag;
    address?: string;
    city?: string;
    type?: LocationType;
    phoneNumber?: string;
}
