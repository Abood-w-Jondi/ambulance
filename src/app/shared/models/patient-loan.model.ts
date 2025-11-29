/**
 * Patient Loan model for tracking money patients owe drivers
 */
export interface PatientLoan {
    tripId: string;
    tripDate: Date;
    patientName: string;
    patientContact?: string;
    totalPrice: number;
    payedPrice: number;
    loanAmount: number;        // totalPrice - payedPrice
    isCollected: boolean;
    collectedAt?: Date;
    collectionNotes?: string;
    daysSinceLoan: number;     // Aging indicator
    transferFrom: string;
    transferTo: string;
}

/**
 * Patient loan filter options
 */
export interface PatientLoanFilters {
    status?: 'collected' | 'uncollected' | 'all';
    startDate?: string;
    endDate?: string;
}
