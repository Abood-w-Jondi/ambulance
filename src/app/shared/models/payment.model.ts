/**
 * Payment model for wallet transactions
 */
export interface Payment {
    // Basic Identification
    id: string;
    transactionId?: string;

    // User Reference
    userId: string;
    userType: 'driver' | 'paramedic';
    userName?: string; // For display

    // Payment Details
    paymentType: PaymentType;
    amount: number;

    // Trip Reference (if applicable)
    tripId?: string;

    // Status
    status: PaymentStatus;

    // Payment Method (for withdrawals)
    paymentMethod?: PaymentMethod;
    bankAccountNumber?: string;
    bankName?: string;

    // Dates
    paymentDate: Date;
    processedAt?: Date;
    completedAt?: Date;

    // Balance Tracking
    balanceBefore?: number;
    balanceAfter?: number;

    // Description
    description: string;
    notes?: string;
    receiptUrl?: string;

    // Audit
    processedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

export type PaymentType = 'إيداع' | 'سحب' | 'رحلة' | 'مكافأة' | 'خصم' | 'تعديل';
export type PaymentStatus = 'مكتمل' | 'معلق' | 'فاشل';
export type PaymentMethod = 'bank' | 'cash' | 'wallet';

/**
 * Wallet summary for drivers and paramedics
 */
export interface WalletSummary {
    currentBalance: number;
    pendingBalance: number;
    totalEarnings: number;
    totalWithdrawals: number;
    lastPaymentDate: Date | null;
}

/**
 * Withdrawal request
 */
export interface WithdrawalRequest {
    amount: number;
    paymentMethod: PaymentMethod;
    bankAccountNumber?: string;
    bankName?: string;
    notes?: string;
}
