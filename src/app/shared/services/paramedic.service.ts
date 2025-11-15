import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Paramedic, ParamedicStatus } from '../models';
import { PaginatedResponse } from './driver.service';

/**
 * Query parameters for paramedic list
 */
export interface ParamedicQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ParamedicStatus | 'all';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  minOwed?: number;
  maxOwed?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ParamedicService {
  private readonly API_URL = `${environment.apiEndpoint}/paramedics`;

  constructor(private http: HttpClient) {}

  /**
   * Get all paramedics with pagination and filters
   */
  getParamedics(params?: ParamedicQueryParams): Observable<PaginatedResponse<Paramedic>> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof ParamedicQueryParams];
        if (value !== undefined && value !== null && value !== '' && value !== 'all') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<PaginatedResponse<Paramedic>>(this.API_URL, { params: httpParams });
  }

  /**
   * Get paramedic by ID
   */
  getParamedicById(id: string): Observable<Paramedic> {
    return this.http.get<Paramedic>(`${this.API_URL}/${id}`);
  }

  /**
   * Create new paramedic
   */
  createParamedic(paramedic: Partial<Paramedic>): Observable<Paramedic> {
    return this.http.post<Paramedic>(this.API_URL, paramedic);
  }

  /**
   * Update paramedic
   */
  updateParamedic(id: string, paramedic: Partial<Paramedic>): Observable<Paramedic> {
    return this.http.put<Paramedic>(`${this.API_URL}/${id}`, paramedic);
  }

  /**
   * Delete paramedic
   */
  deleteParamedic(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  /**
   * Update paramedic status
   */
  updateStatus(id: string, status: ParamedicStatus): Observable<Paramedic> {
    return this.http.patch<Paramedic>(`${this.API_URL}/${id}/status`, { status });
  }

  /**
   * Activate paramedic account
   */
  activateParamedic(id: string): Observable<Paramedic> {
    return this.http.patch<Paramedic>(`${this.API_URL}/${id}/activate`, {});
  }

  /**
   * Deactivate paramedic account
   */
  deactivateParamedic(id: string): Observable<Paramedic> {
    return this.http.patch<Paramedic>(`${this.API_URL}/${id}/deactivate`, {});
  }

  /**
   * Get paramedic's trips history
   */
  getParamedicTrips(id: string, params?: { page?: number; limit?: number }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http.get(`${this.API_URL}/${id}/trips`, { params: httpParams });
  }

  /**
   * Get paramedic's earnings summary
   */
  getParamedicEarnings(id: string): Observable<any> {
    return this.http.get(`${this.API_URL}/${id}/earnings`);
  }

  /**
   * Reduce paramedic's balance by specified amount
   */
  reduceBalance(id: string, amount: number): Observable<Paramedic> {
    return this.http.patch<Paramedic>(`${this.API_URL}/${id}/reduce-balance`, { amount });
  }

  /**
   * Clear paramedic's balance completely
   */
  clearBalance(id: string): Observable<Paramedic> {
    return this.http.patch<Paramedic>(`${this.API_URL}/${id}/clear-balance`, {});
  }
}
