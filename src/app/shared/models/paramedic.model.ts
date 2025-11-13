/**
 * Complete Paramedic model with properties actually used in the application
 */
export interface Paramedic {
    // Basic Identification
    id: string;
    name: string;              // Display name (can be English or Arabic)
    arabicName?: string;       // Arabic name if needed

    // Status Information
    status?: ParamedicStatus;
    isActive?: boolean;        // Account active/disabled

    // Work Information
    tripsToday?: number;
}

export type ParamedicStatus = 'متاح' | 'في رحلة' | 'غير متصل' | 'في إجازة';

/**
 * Simplified paramedic reference for use in dropdowns and references
 * Only includes essential display properties
 */
export interface ParamedicReference {
    id: string;
    name: string;
    arabicName?: string;
}
