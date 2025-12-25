import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Transaction, CollectionSummary, AdjustmentHistory } from '../models/transaction.model';
import { environment } from '../../../environments/environment';
import { buildHttpParams } from '../utils/http-params.util';

export interface TransactionQueryParams {
  page?: number;
  limit?: number;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = `${environment.apiEndpoint}/transactions`;

  constructor(private http: HttpClient) { }

  /**
   * Get transaction history for a user (driver or paramedic)
   */
  getUserTransactions(userId: string, params?: TransactionQueryParams): Observable<PaginatedResponse<Transaction>> {
    const httpParams = buildHttpParams(params);
    return this.http.get<PaginatedResponse<Transaction>>(`${this.apiUrl}/${userId}`, { params: httpParams });
  }

  /**
   * Process a payment for a user (admin only)
   */
  processPayment(userId: string, amount: number, description?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${userId}/pay`, {
      amount,
      description
    });
  }

  /**
   * Create an adjustment transaction (admin only)
   */
  createAdjustment(
    originalTransactionId: string,
    adjustmentAmount: number,
    adjustmentReason: string
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/adjustments`, {
      originalTransactionId,
      adjustmentAmount,
      adjustmentReason
    });
  }

  /**
   * Mark a transaction as collected
   */
  markAsCollected(
    transactionId: string,
    collectionNotes: string,
    receiptUrl?: string
  ): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${transactionId}/collect`, {
      collectionNotes,
      receiptUrl
    });
  }

  /**
   * Get adjustment history for a transaction
   */
  getAdjustmentHistory(transactionId: string): Observable<AdjustmentHistory> {
    return this.http.get<AdjustmentHistory>(`${this.apiUrl}/${transactionId}/adjustments`);
  }

  /**
   * Get collection summary for a user
   */
  getCollectionSummary(userId: string): Observable<CollectionSummary> {
    return this.http.get<CollectionSummary>(`${this.apiUrl}/collection-summary/${userId}`);
  }
  inverseTransaction(transactionId: string, reason?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${transactionId}/inverse`, {
      reason
    });
  }
}
