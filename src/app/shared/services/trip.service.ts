import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Trip, TransferStatus } from '../models';
import { PatientLoan, PatientLoanFilters } from '../models/patient-loan.model';
import { PaginatedResponse } from './driver.service';
import { buildHttpParams } from '../utils/http-params.util';

export interface TripQueryParams {
  page?: number;
  limit?: number;
  status?: TransferStatus | 'All';
  driverId?: string;
  paramedicId?: string;
  vehicleId?: string;
  patientName?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private readonly API_URL = `${environment.apiEndpoint}/trips`;

  constructor(private http: HttpClient) {}

  getTrips(params?: TripQueryParams): Observable<PaginatedResponse<Trip>> {
    const httpParams = buildHttpParams(params);
    return this.http.get<PaginatedResponse<Trip>>(this.API_URL, { params: httpParams });
  }

  getTripById(id: string): Observable<Trip> {
    return this.http.get<Trip>(`${this.API_URL}/${id}`);
  }

  createTrip(trip: Partial<Trip>): Observable<Trip> {
    return this.http.post<Trip>(this.API_URL, trip);
  }

  updateTrip(id: string, trip: Partial<Trip>): Observable<Trip> {
    return this.http.put<Trip>(`${this.API_URL}/${id}`, trip);
  }

  deleteTrip(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  updateStatus(id: string, status: TransferStatus): Observable<Trip> {
    return this.http.patch<Trip>(`${this.API_URL}/${id}/status`, { status });
  }

  getTripStats(): Observable<any> {
    return this.http.get(`${this.API_URL}/stats`);
  }

  /**
   * Mark patient loan as collected
   */
  markLoanCollected(tripId: string, notes: string): Observable<any> {
    return this.http.patch<{ success: boolean; data: any; message: string }>(
      `${this.API_URL}/${tripId}/loan-collected`, 
      { notes }
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Update patient loan amount
   */
  updateLoanAmount(tripId: string, amount: number, notes?: string): Observable<any> {
    return this.http.patch<{ success: boolean; data: any; message: string }>(
      `${this.API_URL}/${tripId}/loan-amount`, 
      { amount, notes }
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get patient loans for a driver
   */
getPatientLoans(driverId: string, filters?: PatientLoanFilters): Observable<PatientLoan[]> {
  const httpParams = buildHttpParams(filters);

  return this.http.get<{ success: boolean; data: PatientLoan[] }>(
    `${environment.apiEndpoint}/drivers/${driverId}/patient-loans`,
    { params: httpParams }
  ).pipe(
    map((response: any) => response)
  );
}

  // NEW METHODS FOR TRIP CLOSURE AND ACCEPTANCE

  /**
   * Get available trips for a driver (assigned to their vehicle with status "لم يتم النقل")
   */
  getAvailableTrips(vehicleId: string): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${environment.apiEndpoint}/vehicles/${vehicleId}/available-trips`);
  }

  /**
   * Driver accepts a trip
   */
  acceptTrip(tripId: string, driverId: string): Observable<any> {
    return this.http.post(`${this.API_URL}/${tripId}/accept`, { driverId });
  }

  /**
   * Close a trip - marks it as finished editing
   * Driver can close at any status to indicate they're done
   * Admin can force-close any trip
   */
  closeTrip(tripId: string, transferStatus: TransferStatus): Observable<any> {
    return this.http.post(`${this.API_URL}/${tripId}/close`, { transferStatus });
  }

  /**
   * Reopen a closed trip - allows editing again (Admin only)
   * Admin can reopen a trip so driver can edit it
   */
  uncloseTrip(tripId: string): Observable<any> {
    return this.http.post(`${this.API_URL}/${tripId}/unclose`, {});
  }

  /**
   * Driver creates their own trip (auto-assigned to their vehicle and auto-accepted)
   */
  createDriverTrip(driverId: string, trip: Partial<Trip>): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${environment.apiEndpoint}/drivers/${driverId}/trips`, trip);
  }

  /**
   * Get driver's active trips (non-final status trips)
   */
  getDriverActiveTrips(driverId: string): Observable<Trip[]> {
    const httpParams = buildHttpParams({ driverId });
    return this.http.get<PaginatedResponse<Trip>>(this.API_URL, {
      params: httpParams
    }).pipe(
      map(response => response.data.filter(trip =>
        !['تم النقل', 'رفض النقل', 'بلاغ كاذب'].includes(trip.transferStatus)
      ))
    );
  }

  /**
   * Get driver's historical trips (final status trips)
   */
  getDriverHistoricalTrips(driverId: string): Observable<Trip[]> {
    const httpParams = buildHttpParams({ driverId, limit: '1000' });
    return this.http.get<PaginatedResponse<Trip>>(this.API_URL, {
      params: httpParams
    }).pipe(
      map(response => response.data.filter(trip =>
        ['تم النقل', 'رفض النقل', 'بلاغ كاذب'].includes(trip.transferStatus)
      ))
    );
  }

  /**
   * Get vehicle's historical trips (all trips for a vehicle with final status)
   */
  getVehicleHistoricalTrips(vehicleId: string): Observable<Trip[]> {
    const httpParams = buildHttpParams({ vehicleId, limit: '1000' });
    return this.http.get<PaginatedResponse<Trip>>(this.API_URL, {
      params: httpParams
    }).pipe(
      map(response => response.data.filter(trip =>
        ['تم النقل', 'رفض النقل', 'بلاغ كاذب'].includes(trip.transferStatus)
      ))
    );
  }

  /**
   * Get all trips for a driver (both closed and unclosed)
   */
  getDriverTrips(driverId: string): Observable<Trip[]> {
    const httpParams = buildHttpParams({ driverId, limit: '1000', sortOrder: 'DESC' });
    return this.http.get<PaginatedResponse<Trip>>(this.API_URL, {
      params: httpParams
    }).pipe(
      map(response => response.data || response as any)
    );
  }

  /**
   * Get all trips for a vehicle (both closed and unclosed)
   */
  getVehicleTrips(vehicleId: string): Observable<Trip[]> {
    const httpParams = buildHttpParams({ vehicleId, limit: '1000', sortOrder: 'DESC' });
    return this.http.get<PaginatedResponse<Trip>>(this.API_URL, {
      params: httpParams
    }).pipe(
      map(response => response.data || response as any)
    );
  }

  /**
   * Create trip for a vehicle
   */
  createVehicleTrip(vehicleId: string, trip: Partial<Trip>): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${environment.apiEndpoint}/vehicles/${vehicleId}/trips`, trip);
  }

  /**
   * Get all trips for export (with high limit to get all matching trips)
   * Applies same filters as getTrips() but returns all results
   */
  getAllTripsForExport(params?: TripQueryParams): Observable<Trip[]> {
    const exportParams = { ...params, limit: 99999 };
    const httpParams = buildHttpParams(exportParams);
    return this.http.get<PaginatedResponse<Trip>>(this.API_URL, { params: httpParams }).pipe(
      map(response => response.data)
    );
  }
}
