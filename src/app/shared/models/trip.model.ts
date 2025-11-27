/**
 * Complete Trip model with properties actually used in the application
 */
export interface Trip {
    // Basic Identification
    id: string;

    // Date Information (Gregorian)
    day: number;
    month: number;
    year: number;

    // Personnel
    driver: string;            // Driver name (display)
    driverId?: string;         // Driver ID (backend reference)
    paramedic: string;         // Paramedic name (display)
    paramedicId?: string;      // Paramedic ID (backend reference)

    // Location Information
    transferFrom: string;      // Starting location
    transferTo: string;        // Destination location

    // Time & Distance
    start: number;             // Start odometer reading
    end: number;               // End odometer reading

    // Fuel
    diesel: number;            // Fuel used in liters

    // Patient Information
    patientName: string;
    patientAge: number;
    patientContact?: string;   // Contact number for sick person (format: 05xx xxx xxx)

    // Medical Information
    diagnosis: string;         // Medical diagnosis/reason for transfer

    // YMD fields (number 0-365 + period string: يوم/اسبوع/شهر/سنة)
    ymdValue?: number;         // Number between 0-365 (0 means not specified)
    ymdPeriod?: string;        // One of: يوم, اسبوع, شهر, سنة

    // Status & Type
    transferStatus: TransferStatus;

    // Trip Type & Expenses
    tripType?: TripType;       // Type of trip (داخلي, وسط, خارجي, اخرى)
    otherExpenses: number;     // Other expenses for the trip

    // Financial Information
    totalPrice: number;        // Total amount supposed to pay
    payedPrice: number;        // Amount already paid by patient
    paramedicShare: number;    // Paramedic's share (deducted first before splitting remaining)
    driverShare: number;       // Driver's share
    eqShare: number;           // Equipment/Company share

    // Vehicle Information (for backend reference)
    vehicleId?: string;        // Vehicle used for the trip
}

export type TransferStatus = 'ميداني' | 'تم النقل' | 'بلاغ كاذب' | 'ينقل' | 'لم يتم النقل' | 'صيانة' | 'رفض النقل' | 'اخرى';
export type FilterStatus = 'All' | TransferStatus;
export type TripType = 'داخلي' | 'وسط' | 'خارجي' | 'اخرى';
