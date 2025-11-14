import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PendingTrip, TripPriority, PendingTripStatus, CreatePendingTripRequest, TripActionResponse } from '../models';
import { PaginatedResponse } from './driver.service';

export interface PendingTripQueryParams {
  page?: number;
  limit?: number;
  status?: PendingTripStatus;
  priority?: TripPriority;
  driverId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class PendingTripService {
  private readonly API_URL = `${environment.apiEndpoint}/pending-trips`;

  constructor(private http: HttpClient) {}

  getPendingTrips(params?: PendingTripQueryParams): Observable<PaginatedResponse<PendingTrip>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof PendingTripQueryParams];
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return this.http.get<PaginatedResponse<PendingTrip>>(this.API_URL, { params: httpParams });
  }

  getPendingTripById(id: string): Observable<PendingTrip> {
    return this.http.get<PendingTrip>(`${this.API_URL}/${id}`);
  }

  createPendingTrip(trip: CreatePendingTripRequest): Observable<PendingTrip> {
    return this.http.post<PendingTrip>(this.API_URL, trip);
  }

  updatePendingTrip(id: string, trip: Partial<PendingTrip>): Observable<PendingTrip> {
    return this.http.put<PendingTrip>(`${this.API_URL}/${id}`, trip);
  }

  deletePendingTrip(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  acceptTrip(tripId: string): Observable<TripActionResponse> {
    return this.http.post<TripActionResponse>(`${this.API_URL}/${tripId}/accept`, {});
  }

  rejectTrip(tripId: string, reason?: string): Observable<TripActionResponse> {
    return this.http.post<TripActionResponse>(`${this.API_URL}/${tripId}/reject`, { reason });
  }

  getTripsForDriver(driverId: string): Observable<PendingTrip[]> {
    return this.http.get<PendingTrip[]>(`${this.API_URL}/driver/${driverId}`);
  }

  assignTripToDriver(tripId: string, driverId: string, paramedicId?: string, vehicleId?: string): Observable<PendingTrip> {
    return this.http.patch<PendingTrip>(`${this.API_URL}/${tripId}/assign`, {
      driverId,
      paramedicId,
      vehicleId
    });
  }
}
