import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Transaction } from '../models/transaction.model';
import { environment } from '../../../environments/environment';

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
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.type) httpParams = httpParams.set('type', params.type);
      if (params.startDate) httpParams = httpParams.set('startDate', params.startDate);
      if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);
    }

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
}
