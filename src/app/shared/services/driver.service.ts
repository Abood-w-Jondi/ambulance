import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Driver, DriverStatus } from '../models';

/**
 * Pagination response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Query parameters for driver list
 */
export interface DriverQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: DriverStatus | 'all';
  minOwed?: number;
  maxOwed?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class DriverService {
  private readonly API_URL = `${environment.apiEndpoint}/drivers`;

  constructor(private http: HttpClient) {}

  /**
   * Get all drivers with pagination and filters
   */
  getDrivers(params?: DriverQueryParams): Observable<PaginatedResponse<Driver>> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof DriverQueryParams];
        if (value !== undefined && value !== null && value !== '' && value !== 'all') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<PaginatedResponse<Driver>>(this.API_URL, { params: httpParams });
  }

  /**
   * Get driver by ID
   */
  getDriverById(id: string): Observable<Driver> {
    return this.http.get<Driver>(`${this.API_URL}/${id}`);
  }

  /**
   * Create new driver
   */
  createDriver(driver: Partial<Driver>): Observable<Driver> {
    return this.http.post<Driver>(this.API_URL, driver);
  }

  /**
   * Update driver
   */
  updateDriver(id: string, driver: Partial<Driver>): Observable<Driver> {
    return this.http.put<Driver>(`${this.API_URL}/${id}`, driver);
  }

  /**
   * Delete driver
   */
  deleteDriver(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  /**
   * Update driver status
   */
  updateStatus(id: string, status: DriverStatus): Observable<Driver> {
    return this.http.patch<Driver>(`${this.API_URL}/${id}/status`, { status });
  }

  /**
   * Activate driver account
   */
  activateDriver(id: string): Observable<Driver> {
    return this.http.patch<Driver>(`${this.API_URL}/${id}/activate`, {});
  }

  /**
   * Deactivate driver account
   */
  deactivateDriver(id: string): Observable<Driver> {
    return this.http.patch<Driver>(`${this.API_URL}/${id}/deactivate`, {});
  }

  /**
   * Reduce driver balance
   */
  reduceBalance(id: string, amount: number): Observable<Driver> {
    return this.http.patch<Driver>(`${this.API_URL}/${id}/reduce-balance`, { amount });
  }

  /**
   * Clear driver balance (set to zero)
   */
  clearBalance(id: string): Observable<Driver> {
    return this.http.patch<Driver>(`${this.API_URL}/${id}/clear-balance`, {});
  }

  /**
   * Get driver's trips history
   */
  getDriverTrips(id: string, params?: { page?: number; limit?: number }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http.get(`${this.API_URL}/${id}/trips`, { params: httpParams });
  }

  /**
   * Get driver's earnings summary
   */
  getDriverEarnings(id: string): Observable<any> {
    return this.http.get(`${this.API_URL}/${id}/earnings`);
  }
}
