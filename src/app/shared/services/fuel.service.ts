import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FuelRecord } from '../models';
import { PaginatedResponse } from './driver.service';

export interface FuelQueryParams {
  page?: number;
  limit?: number;
  vehicleId?: string;
  driverId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class FuelService {
  private readonly API_URL = `${environment.apiEndpoint}/fuel`;

  constructor(private http: HttpClient) {}

  /**
   * Get all fuel records with pagination and filters
   */
  getFuelRecords(params?: FuelQueryParams): Observable<PaginatedResponse<FuelRecord>> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof FuelQueryParams];
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<PaginatedResponse<FuelRecord>>(this.API_URL, { params: httpParams });
  }

  /**
   * Get fuel record by ID
   */
  getFuelRecordById(id: string): Observable<FuelRecord> {
    return this.http.get<FuelRecord>(`${this.API_URL}/${id}`);
  }

  /**
   * Create new fuel record
   */
  createFuelRecord(record: Partial<FuelRecord>): Observable<FuelRecord> {
    // Map frontend fields to backend fields
    const payload = this.mapToBackendFormat(record);
    return this.http.post<FuelRecord>(this.API_URL, payload);
  }

  /**
   * Update fuel record
   */
  updateFuelRecord(id: string, record: Partial<FuelRecord>): Observable<FuelRecord> {
    // Map frontend fields to backend fields
    const payload = this.mapToBackendFormat(record);
    return this.http.put<FuelRecord>(`${this.API_URL}/${id}`, payload);
  }

  /**
   * Delete fuel record
   */
  deleteFuelRecord(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  /**
   * Map frontend FuelRecord format to backend API format
   */
  private mapToBackendFormat(record: Partial<FuelRecord>): any {
    const payload: any = {};

    // Map vehicle fields
    if (record.ambulanceId !== undefined) {
      payload.vehicleId = record.ambulanceId;
    }

    // Map driver fields
    if (record.driverInternalId !== undefined) {
      payload.driverId = record.driverInternalId;
    }

    // Map date field - convert Date to YYYY-MM-DD string
    if (record.date) {
      const date = record.date instanceof Date ? record.date : new Date(record.date);
      payload.date = date.toISOString().split('T')[0];
    }

    // Map odometer fields
    if (record.odometerBefore !== undefined) {
      payload.odometerBefore = record.odometerBefore;
    }
    if (record.odometerAfter !== undefined) {
      payload.odometerAfter = record.odometerAfter;
    }

    // Map fuel fields
    if (record.fuelAmount !== undefined) {
      payload.fuelAmount = record.fuelAmount;
    }
    if (record.cost !== undefined) {
      payload.cost = record.cost;
    }

    // Map notes
    if (record.notes !== undefined) {
      payload.notes = record.notes;
    }

    return payload;
  }
}
