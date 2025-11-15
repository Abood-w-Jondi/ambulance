import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MaintenanceRecord, MaintenanceStatus } from '../models';
import { PaginatedResponse } from './driver.service';

export interface MaintenanceQueryParams {
  page?: number;
  limit?: number;
  vehicleId?: string;
  status?: MaintenanceStatus;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class MaintenanceService {
  private readonly API_URL = `${environment.apiEndpoint}/maintenance`;

  constructor(private http: HttpClient) {}

  /**
   * Get all maintenance records with pagination and filters
   */
  getMaintenanceRecords(params?: MaintenanceQueryParams): Observable<PaginatedResponse<MaintenanceRecord>> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof MaintenanceQueryParams];
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<PaginatedResponse<MaintenanceRecord>>(this.API_URL, { params: httpParams });
  }

  /**
   * Get maintenance record by ID
   */
  getMaintenanceRecordById(id: string): Observable<MaintenanceRecord> {
    return this.http.get<MaintenanceRecord>(`${this.API_URL}/${id}`);
  }

  /**
   * Create new maintenance record
   */
  createMaintenanceRecord(record: Partial<MaintenanceRecord>): Observable<MaintenanceRecord> {
    return this.http.post<MaintenanceRecord>(this.API_URL, record);
  }

  /**
   * Update maintenance record
   */
  updateMaintenanceRecord(id: string, record: Partial<MaintenanceRecord>): Observable<MaintenanceRecord> {
    return this.http.put<MaintenanceRecord>(`${this.API_URL}/${id}`, record);
  }

  /**
   * Delete maintenance record
   */
  deleteMaintenanceRecord(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
