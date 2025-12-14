import { EducationLevel } from './driver.model';

/**
 * Complete Paramedic model with properties actually used in the application
 */
export interface Paramedic {
    // Basic Identification
    id: string;
    name: string;              // English name
    arabicName: string;        // Arabic name

    // Authentication
    username?: string;
    email?: string;

    // Status Information
    arabicStatus: 'متاح' | 'في رحلة' | 'غير متصل' | 'في إجازة';
    statusColor: string;
    isActive: boolean;        // Account active/disabled

    // Work Information
    tripsToday: number;

    // Financial Information
    amountOwed: number;
    isAccountCleared: boolean;

    // Display Information
    imageUrl: string;
    imageAlt: string;

    // New Profile Fields
    jobTitle?: string;                    // الوظيفة - Job title (free text)
    educationLevel?: EducationLevel;      // المستوى التعليمي
    phoneNumber?: string;                 // رقم الهاتف (Palestinian format)
    profileImageUrl?: string;             // Base64 encoded profile image
}

export type ParamedicStatus = 'متاح' | 'في رحلة' | 'غير متصل' | 'في إجازة';
export type ParamedicFilterStatus = ParamedicStatus | 'all';

/**
 * Simplified paramedic reference for use in dropdowns and references
 * Only includes essential display properties
 */
export interface ParamedicReference {
    id: string;
    name: string;
    arabicName?: string;
}
