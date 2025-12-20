import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MaintenanceTypeConfig, TransportationTypeConfig, CommonLocation } from '../models';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly API_URL = `${environment.apiEndpoint}/settings`;

  constructor(private http: HttpClient) {}

  // Maintenance Types
  getMaintenanceTypes(): Observable<MaintenanceTypeConfig[]> {
    return this.http.get<MaintenanceTypeConfig[]>(`${this.API_URL}/maintenance-types`);
  }

  getMaintenanceTypeById(id: string): Observable<MaintenanceTypeConfig> {
    return this.http.get<MaintenanceTypeConfig>(`${this.API_URL}/maintenance-types/${id}`);
  }

  createMaintenanceType(type: Partial<MaintenanceTypeConfig>): Observable<MaintenanceTypeConfig> {
    return this.http.post<MaintenanceTypeConfig>(`${this.API_URL}/maintenance-types`, type);
  }

  updateMaintenanceType(id: string, type: Partial<MaintenanceTypeConfig>): Observable<MaintenanceTypeConfig> {
    return this.http.put<MaintenanceTypeConfig>(`${this.API_URL}/maintenance-types/${id}`, type);
  }

  deleteMaintenanceType(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/maintenance-types/${id}`);
  }

  // Transportation Types
  getTransportationTypes(): Observable<TransportationTypeConfig[]> {
    return this.http.get<TransportationTypeConfig[]>(`${this.API_URL}/transportation-types`);
  }

  getTransportationTypeById(id: string): Observable<TransportationTypeConfig> {
    return this.http.get<TransportationTypeConfig>(`${this.API_URL}/transportation-types/${id}`);
  }

  createTransportationType(type: Partial<TransportationTypeConfig>): Observable<TransportationTypeConfig> {
    return this.http.post<TransportationTypeConfig>(`${this.API_URL}/transportation-types`, type);
  }

  updateTransportationType(id: string, type: Partial<TransportationTypeConfig>): Observable<TransportationTypeConfig> {
    return this.http.put<TransportationTypeConfig>(`${this.API_URL}/transportation-types/${id}`, type);
  }

  deleteTransportationType(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/transportation-types/${id}`);
  }

  // Common Locations
  getCommonLocations(type?: string): Observable<CommonLocation[]> {
    const url = type ? `${this.API_URL}/common-locations?type=${type}` : `${this.API_URL}/common-locations`;
    return this.http.get<CommonLocation[]>(url);
  }

  getCommonLocationById(id: string): Observable<CommonLocation> {
    return this.http.get<CommonLocation>(`${this.API_URL}/common-locations/${id}`);
  }

  createCommonLocation(location: Partial<CommonLocation>): Observable<CommonLocation> {
    return this.http.post<CommonLocation>(`${this.API_URL}/common-locations`, location);
  }

  updateCommonLocation(id: string, location: Partial<CommonLocation>): Observable<CommonLocation> {
    return this.http.put<CommonLocation>(`${this.API_URL}/common-locations/${id}`, location);
  }

  deleteCommonLocation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/common-locations/${id}`);
  }
}
