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
    driver: string;            // Driver name (display) - populated by driver
    driverId?: string;         // Driver ID (backend reference) - auto-filled from vehicle
    paramedic: string;         // Paramedic name (display) - chosen by driver
    paramedicId?: string;      // Paramedic ID (backend reference) - chosen by driver

    // Location Information (always populated from database joins)
    transferFrom: string;      // Starting location name (from locations table join)
    transferFromId?: string;   // Starting location ID (reference to locations table)
    transferFromTag?: string;  // Location tag: 'common' or 'custom'
    transferTo: string;        // Destination location name (from locations table join)
    transferToId?: string;     // Destination location ID (reference to locations table)
    transferToTag?: string;    // Location tag: 'common' or 'custom'

    // Time & Distance
    start: number;             // Start odometer reading
    end: number;               // End odometer reading

    // Fuel
    diesel: number;            // Fuel used in liters
    calculatedFuelCost?: number; // Auto-calculated: (end - start) * 1 NIS/km

    // Patient Information
    patientName: string;
    patientAge: number;
    patientContact?: string;   // Contact number for sick person (format: 05xx xxx xxx)

    // Medical Information
    diagnosis: string;         // Medical diagnosis/reason for transfer (legacy field)
    transportationTypeId?: string;   // Transportation type ID (FK to transportation_types)
    transportationTypeName?: string; // Transportation type name (populated from join)

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
    paramedicPaidAmount?: number; // Amount actually paid to paramedic on spot
    driverShare: number;       // Driver's share
    eqShare: number;           // Equipment/Company share (DEPRECATED - split into companyShare and ownerShare)
    companyShare: number;      // Company (الشركة) share
    ownerShare: number;        // Owner (المالك) share

    // Loan Tracking (when patient owes driver money)
    isLoan: boolean;           // True if patient took loan from driver
    loanAmount: number;        // Amount patient owes driver (totalPrice - paidPrice)
    loanCollected: boolean;    // True when driver has collected the loan from patient
    loanCollectedAt?: Date;    // When loan was collected
    loanCollectionNotes?: string; // Notes about loan collection

    // General Trip Notes
    tripNotes?: string;        // General notes about the trip (editable by admin and driver when trip is open)

    // Vehicle Information (assigned by admin, name populated from database join)
    vehicleId?: string;        // Vehicle assigned to the trip (by admin)
    vehicleName?: string;      // Vehicle name (always populated from vehicles table join)

    // Trip Timestamps (NEW - for tracking)
    acceptedAt?: Date;         // When driver accepted the trip
    completedAt?: Date;        // When trip status changed to final status

    // Trip Closure System
    isClosed: boolean;         // Trip closed by driver (finished editing)
    closedAt?: Date;           // When trip was closed
    closedBy?: string;         // User ID who closed the trip

    // Trip populated mostly by driver after accepting
    populatedByDriver?: boolean;  // Flag to indicate if driver has filled the data
}

export type TransferStatus = 'ميداني' | 'تم النقل' | 'بلاغ كاذب' | 'ينقل' | 'لم يتم النقل' | 'رفض النقل' | 'اخرى';
export type FilterStatus = 'All' | TransferStatus;
export type TripType = 'داخلي' | 'وسط' | 'خارجي' | 'اخرى';
