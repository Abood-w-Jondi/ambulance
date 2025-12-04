import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  EQBalances,
  EQTransaction,
  EQTransactionFilters,
  EQSummary
} from '../models/eq-balance.model';
import { PaginatedResponse } from '../models/paginated-response.model';

/**
 * EQ Balance Service
 * Manages financial balances and transactions for Company (الشركة) and Owner (المالك)
 */
@Injectable({
  providedIn: 'root'
})
export class EqBalanceService {
  private apiUrl = `${environment.apiUrl}/eq-balance`;

  constructor(private http: HttpClient) {}

  /**
   * Get current balances for both company and owner
   */
  getBalances(): Observable<EQBalances> {
    return this.http.get<EQBalances>(this.apiUrl);
  }

  /**
   * Get EQ transaction history with optional filters
   */
  getTransactions(filters?: EQTransactionFilters): Observable<PaginatedResponse<EQTransaction>> {
    let params = new HttpParams();

    if (filters) {
      if (filters.entityType) {
        params = params.set('entityType', filters.entityType);
      }
      if (filters.transactionType) {
        params = params.set('transactionType', filters.transactionType);
      }
      if (filters.startDate) {
        params = params.set('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params = params.set('endDate', filters.endDate);
      }
      if (filters.page) {
        params = params.set('page', filters.page.toString());
      }
      if (filters.limit) {
        params = params.set('limit', filters.limit.toString());
      }
    }

    return this.http.get<PaginatedResponse<EQTransaction>>(
      `${this.apiUrl}/transactions`,
      { params }
    );
  }

  /**
   * Get monthly summary of income/expenses for both entities
   */
  getSummary(month: number, year: number): Observable<EQSummary> {
    const params = new HttpParams()
      .set('month', month.toString())
      .set('year', year.toString());

    return this.http.get<EQSummary>(`${this.apiUrl}/summary`, { params });
  }

  /**
   * Get current month summary
   */
  getCurrentMonthSummary(): Observable<EQSummary> {
    const now = new Date();
    return this.getSummary(now.getMonth() + 1, now.getFullYear());
  }
}
