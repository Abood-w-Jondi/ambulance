/**
 * EQ Balance Models
 * Models for Company (الشركة) and Owner (المالك) financial tracking
 */

export interface CompanyBalance {
  id: string;
  balance: number;
  debtToOwner: number;
  updatedAt: Date | string;
}

export interface OwnerBalance {
  id: string;
  balance: number;
  updatedAt: Date | string;
}

export interface EQBalances {
  company: CompanyBalance;
  owner: OwnerBalance;
}

export interface EQTransaction {
  id: string;
  entityType: 'company' | 'owner';
  transactionType: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  tripId?: string;
  relatedTransactionId?: string;
  description: string;
  createdAt: Date | string;
}

export interface EQTransactionFilters {
  entityType?: 'company' | 'owner';
  transactionType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface EQSummary {
  month: number;
  year: number;
  company: {
    totalIncome: number;
    totalExpenses: number;
    transactionCount: number;
    netIncome: number;
  };
  owner: {
    totalIncome: number;
    totalExpenses: number;
    transactionCount: number;
    netIncome: number;
  };
}

// Transaction types for EQ entities
export type EQTransactionType =
  | 'trip_income'        // Income from trip shares
  | 'fuel_income'        // Fuel cost added back to company
  | 'payment_out'        // Payment to driver/paramedic/expense
  | 'debt_to_owner'      // Company borrowing from owner
  | 'debt_repayment'     // Company paying back owner
  | 'loan_to_company';   // Owner lending to company
