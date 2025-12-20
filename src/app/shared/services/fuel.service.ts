import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { FuelRecord } from '../models';
import { PaginatedResponse } from './driver.service';
import { buildHttpParams } from '../utils/http-params.util';

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
    const httpParams = buildHttpParams(params);

    return this.http.get<PaginatedResponse<any>>(this.API_URL, { params: httpParams }).pipe(
      map(response => ({
        ...response,
        data: response.data.map((record: any) => ({
          ...record,
          date: new Date(record.date)
        }))
      }))
    );
  }

  /**
   * Get fuel record by ID
   */
  getFuelRecordById(id: string): Observable<FuelRecord> {
    return this.http.get<any>(`${this.API_URL}/${id}`).pipe(
      map(record => ({
        ...record,
        date: new Date(record.date)
      }))
    );
  }

  /**
   * Create new fuel record
   */
  createFuelRecord(record: Partial<FuelRecord>): Observable<FuelRecord> {
    // Map frontend fields to backend fields
    const payload = this.mapToBackendFormat(record);
    return this.http.post<any>(this.API_URL, payload).pipe(
      map(result => ({
        ...result,
        date: new Date(result.date)
      }))
    );
  }

  /**
   * Update fuel record
   */
  updateFuelRecord(id: string, record: Partial<FuelRecord>): Observable<FuelRecord> {
    // Map frontend fields to backend fields
    const payload = this.mapToBackendFormat(record);
    return this.http.put<any>(`${this.API_URL}/${id}`, payload).pipe(
      map(result => ({
        ...result,
        date: new Date(result.date)
      }))
    );
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
