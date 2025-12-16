import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Driver, DriverStatus } from '../models';
import { buildHttpParams } from '../utils/http-params.util';
import { GlobalVarsService } from '../../global-vars.service';
import { tap } from 'rxjs';

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
  injectedVars = inject(GlobalVarsService);
  constructor(private http: HttpClient) {}

  /**
   * Get all drivers with pagination and filters
   */
  getDrivers(params?: DriverQueryParams): Observable<PaginatedResponse<Driver>> {
    const httpParams = buildHttpParams(params);
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
    const httpParams = buildHttpParams(params);
    return this.http.get(`${this.API_URL}/${id}/trips`, { params: httpParams });
  }

  /**
   * Get driver's earnings summary
   */
  getDriverEarnings(id: string): Observable<any> {
    return this.http.get(`${this.API_URL}/${id}/earnings`);
  }

  /**
   * Get driver record by user ID
   */
  getDriverByUserId(userId: string): Observable<Driver> {
    return this.http.get<Driver>(`${this.API_URL}/user/${userId}`);
  }

  /**
   * Get current logged-in driver's record
   */
  getCurrentDriver(): Observable<Driver> {
  return this.http.get<Driver>(`${this.API_URL}/me`).pipe(
    tap((response) => {
      response.profileImageUrl = response.profileImageUrl !== undefined 
    ? response.profileImageUrl 
    : response.profile_image_url;
      this.injectedVars.setCurrentIMG(response.profileImageUrl || '/assets/default-avatar.png');
    })
  );
}

  /**
   * Get all drivers (for dropdowns/selects)
   */
  getAllDrivers(): Observable<{ data: Driver[]; total: number }> {
    return this.http.get<{ data: Driver[]; total: number }>(`${this.API_URL}?limit=1000`);
  }
}
