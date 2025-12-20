/**
 * Transaction model for tracking balance changes
 */
export interface Transaction {
    id: string;
    userId: string;
    userType: 'driver' | 'paramedic';
    transactionType: TransactionType;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    tripId?: string;
    description: string;
    createdAt: Date;

    // Collection tracking
    collectionStatus: CollectionStatus;
    collectedAt?: Date;
    collectedBy?: string;
    collectionReceiptUrl?: string;
    collectionNotes?: string;

    // Adjustment tracking
    relatedTransactionId?: string;
    adjustmentReason?: string;
    isAdjustment: boolean;
    createdBy?: string;
    createdByName?: string; // For display purposes

    // Expense linking
    fuelRecordId?: string;
    maintenanceRecordId?: string;

    // Transaction direction (NEW - for corrected financial logic)
    transactionDirection?: TransactionDirection;

    // Trip details (if transaction is related to a trip)
    patientName?: string;
    transferFrom?: string;
    transferTo?: string;
}

export type TransactionDirection = 'receivable' | 'payable' | 'neutral';

export type TransactionType = 'رحلة' | 'دفع' | 'سحب' | 'تعديل' | 'وقود' | 'صيانة' | 'مكافأة' | 'خصم';

export type CollectionStatus = 'pending_collection' | 'collected' | 'rejected' | 'n/a';

/**
 * Collection summary for a user
 */
export interface CollectionSummary {
    pendingCollection: number;
    pendingCount: number;
    oldestPendingDate?: Date;
    collected: number;
    collectedCount: number;
}

/**
 * Adjustment history response
 */
export interface AdjustmentHistory {
    original: {
        id: string;
        amount: number;
        transactionType: TransactionType;
        description: string;
        createdAt: Date;
    };
    adjustments: Transaction[];
    netAmount: number;
    adjustmentCount: number;
}
