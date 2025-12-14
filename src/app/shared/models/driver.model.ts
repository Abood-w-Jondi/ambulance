/**
 * Education level enum matching database values
 */
export type EducationLevel = 'EMI' | 'B' | 'I' | 'P';

/**
 * Complete Driver model with properties actually used in the application
 */
export interface Driver {
    // Basic Identification
    id: string;
    name: string;              // English name
    arabicName: string;        // Arabic name
    username?: string;
    email?: string;

    // Status Information
    arabicStatus: DriverStatus;
    statusColor: string;       // Hex color code for status display
    isActive: boolean;         // Account active/disabled

    // Work & Financial Information
    tripsToday: number;
    amountOwed: number;        // Amount driver owes to company
    isAccountCleared: boolean; // Whether balance is zero

    // Profile Media
    imageUrl: string;
    imageAlt: string;
    driver_status: DriverStatus;

    // New Profile Fields
    jobTitle?: string;                    // الوظيفة - Job title (free text)
    educationLevel?: EducationLevel;      // المستوى التعليمي
    phoneNumber?: string;                 // رقم الهاتف (Palestinian format)
    profileImageUrl?: string;             // Base64 encoded profile image
}

export type DriverStatus = 'متاح' | 'في رحلة' | 'غير متصل';
export type DriverFilterStatus = 'all' | DriverStatus;

/**
 * Simplified driver reference for use in dropdowns and references
 * Only includes essential display properties
 */
export interface DriverReference {
    id: string;
    name: string;
    arabicName?: string;
}
