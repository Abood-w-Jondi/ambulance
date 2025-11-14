import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Vehicle, VehicleStatus } from '../models';
import { PaginatedResponse } from './driver.service';

export interface VehicleQueryParams {
  page?: number;
  limit?: number;
  status?: VehicleStatus | 'All';
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  private readonly API_URL = `${environment.apiEndpoint}/vehicles`;

  constructor(private http: HttpClient) {}

  getVehicles(params?: VehicleQueryParams): Observable<PaginatedResponse<Vehicle>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof VehicleQueryParams];
        if (value !== undefined && value !== null && value !== '' && value !== 'All') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
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

  updateStatus(id: string, status: VehicleStatus): Observable<Vehicle> {
    return this.http.patch<Vehicle>(`${this.API_URL}/${id}/status`, { status });
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
}
