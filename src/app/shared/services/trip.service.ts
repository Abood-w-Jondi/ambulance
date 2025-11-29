import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Trip, TransferStatus } from '../models';
import { PatientLoan, PatientLoanFilters } from '../models/patient-loan.model';
import { PaginatedResponse } from './driver.service';

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
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof TripQueryParams];
        if (value !== undefined && value !== null && value !== '' && value !== 'All') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
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
    return this.http.patch(`${this.API_URL}/${tripId}/loan-collected`, { notes });
  }

  /**
   * Get patient loans for a driver
   */
  getPatientLoans(driverId: string, filters?: PatientLoanFilters): Observable<PatientLoan[]> {
    let httpParams = new HttpParams();

    if (filters) {
      if (filters.status) httpParams = httpParams.set('status', filters.status);
      if (filters.startDate) httpParams = httpParams.set('startDate', filters.startDate);
      if (filters.endDate) httpParams = httpParams.set('endDate', filters.endDate);
    }

    return this.http.get<PatientLoan[]>(
      `${environment.apiEndpoint}/drivers/${driverId}/patient-loans`,
      { params: httpParams }
    );
  }
}
