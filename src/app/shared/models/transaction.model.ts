/**
 * Transaction model for tracking balance changes
 */
export interface Transaction {
    id: string;
    transactionType: TransactionType;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    tripId?: string;
    description: string;
    createdAt: Date;

    // Trip details (if transaction is related to a trip)
    patientName?: string;
    transferFrom?: string;
    transferTo?: string;
}

export type TransactionType = 'رحلة' | 'دفع' | 'سحب';
