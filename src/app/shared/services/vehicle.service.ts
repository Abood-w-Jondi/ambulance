import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Vehicle, VehicleStatus } from '../models';
import { PaginatedResponse } from './driver.service';
import { buildHttpParams } from '../utils/http-params.util';

export interface VehicleQueryParams {
  page?: number;
  limit?: number;
  status?: VehicleStatus | 'All';
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface VehicleLocation {
  id: string;
  vehicleId: string;
  vehicleName: string;
  type: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  lastLocationUpdate: string | null;
  driverName: string | null;
  driverId: string | null;
  driverStatus: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  private readonly API_URL = `${environment.apiEndpoint}/vehicles`;

  constructor(private http: HttpClient) {}

  getVehicles(params?: VehicleQueryParams): Observable<PaginatedResponse<Vehicle>> {
    const httpParams = buildHttpParams(params);
    return this.http.get<PaginatedResponse<Vehicle>>(this.API_URL, { params: httpParams });
  }

  getVehicleById(id: string): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${this.API_URL}/${id}`);
  }

  createVehicle(vehicle: Partial<Vehicle>): Observable<Vehicle> {
    return this.http.post<Vehicle>(this.API_URL, vehicle);
  }

  updateVehicle(id: string, vehicle: Partial<Vehicle>): Observable<Vehicle> {
    return this.http.put<Vehicle>(`${this.API_URL}/${id}`, vehicle);
  }

  deleteVehicle(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  /**
   * Update vehicle status with optional manual override
   * @param id Vehicle ID
   * @param status New vehicle status
   * @param manualOverride Set to true to prevent automatic trip status update
   */
  updateStatus(id: string, status: VehicleStatus, manualOverride: boolean = false): Observable<Vehicle> {
    return this.http.patch<Vehicle>(`${this.API_URL}/${id}/status`, { status, manualOverride });
  }

  assignDriver(vehicleId: string, driverId: string): Observable<Vehicle> {
    return this.http.patch<Vehicle>(`${this.API_URL}/${vehicleId}/assign-driver`, { driverId });
  }

  unassignDriver(vehicleId: string): Observable<Vehicle> {
    return this.http.patch<Vehicle>(`${this.API_URL}/${vehicleId}/unassign-driver`, {});
  }

  getVehicleMaintenance(id: string): Observable<any> {
    return this.http.get(`${this.API_URL}/${id}/maintenance`);
  }

  getVehicleFuel(id: string): Observable<any> {
    return this.http.get(`${this.API_URL}/${id}/fuel`);
  }

  /**
   * Update vehicle's current GPS location
   */
  updateLocation(vehicleId: string, latitude: number, longitude: number): Observable<any> {
    return this.http.patch(`${this.API_URL}/${vehicleId}/location`, { latitude, longitude });
  }

  /**
   * Get all vehicle locations for real-time map (admin only)
   */
  getAllVehicleLocations(): Observable<VehicleLocation[]> {
    return this.http.get<VehicleLocation[]>(`${this.API_URL}/locations`);
  }
}
