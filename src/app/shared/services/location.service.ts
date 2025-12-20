import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Location, LocationTag, LocationType, CreateLocationRequest, LocationReference } from '../models/location.model';
import { PaginatedResponse } from './driver.service';
import { buildHttpParams } from '../utils/http-params.util';

export interface LocationQueryParams {
  page?: number;
  limit?: number;
  locationType?: LocationTag;
  type?: LocationType;
  searchTerm?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private readonly API_URL = `${environment.apiEndpoint}/locations`;

  constructor(private http: HttpClient) {}

  /**
   * Get paginated list of locations
   */
  getLocations(params?: LocationQueryParams): Observable<PaginatedResponse<Location>> {
    const httpParams = buildHttpParams(params);
    return this.http.get<PaginatedResponse<Location>>(this.API_URL, { params: httpParams });
  }

  /**
   * Get all common locations (for dropdown)
   */
  getCommonLocations(): Observable<LocationReference[]> {
    return this.http.get<{success: boolean, data: LocationReference[]}>(`${this.API_URL}/common`)
      .pipe(map(response => response.data || []));
  }

  /**
   * Get all custom locations (non-common)
   */
  getCustomLocations(): Observable<LocationReference[]> {
    return this.http.get<{success: boolean, data: LocationReference[]}>(`${this.API_URL}/custom`)
      .pipe(map(response => response.data || []));
  }

  /**
   * Search locations by name
   */
  searchLocations(searchTerm: string): Observable<LocationReference[]> {
    const httpParams = buildHttpParams({ searchTerm });
    return this.http.get<{success: boolean, data: LocationReference[]}>(`${this.API_URL}/search`, { params: httpParams })
      .pipe(map((response:any) => response || []));
  }

  /**
   * Get location by ID
   */
  getLocationById(id: string): Observable<Location> {
    return this.http.get<{success: boolean, data: Location}>(`${this.API_URL}/${id}`)
      .pipe(map(response => response.data));
  }

  /**
   * Create new location
   */
  createLocation(location: CreateLocationRequest): Observable<Location> {
    return this.http.post<{success: boolean, data: {id: string}}>(this.API_URL, location)
      .pipe(map(response => ({ id: response.data.id, ...location } as Location)));
  }

  /**
   * Update existing location
   */
  updateLocation(id: string, location: Partial<Location>): Observable<Location> {
    return this.http.put<{success: boolean, message: string}>(`${this.API_URL}/${id}`, location)
      .pipe(map(response => ({ id, ...location } as Location)));
  }

  /**
   * Delete location
   */
  deleteLocation(id: string): Observable<void> {
    return this.http.delete<{success: boolean, message: string}>(`${this.API_URL}/${id}`)
      .pipe(map((): void => undefined));
  }

  /**
   * Toggle location active status
   */
  toggleLocationStatus(id: string): Observable<Location> {
    return this.http.patch<{success: boolean, message: string}>(`${this.API_URL}/${id}/toggle-status`, {})
      .pipe(map(response => ({ id } as Location)));
  }
}
