import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface MaintenanceTypeReference {
    id: string;
    name: string;
    description?: string;
    estimatedCost?: number;
    estimatedDuration?: number;
    isActive?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class MaintenanceTypeService {
    private API_URL = `${environment.apiEndpoint}/maintenance-types`;

    constructor(private http: HttpClient) {}

    searchMaintenanceTypes(searchTerm: string): Observable<MaintenanceTypeReference[]> {
        const params = new HttpParams().set('searchTerm', searchTerm);
        return this.http.get<{success: boolean, data: MaintenanceTypeReference[]}>(`${this.API_URL}/search`, { params })
            .pipe(map((response :any) => response || []));
    }

    getMaintenanceTypes(queryParams?: any): Observable<any> {
        return this.http.get<any>(this.API_URL, { params: queryParams });
    }

    createMaintenanceType(data: any): Observable<any> {
        return this.http.post<any>(this.API_URL, data);
    }

    updateMaintenanceType(id: string, data: any): Observable<any> {
        return this.http.put<any>(`${this.API_URL}/${id}`, data);
    }

    deleteMaintenanceType(id: string): Observable<any> {
        return this.http.delete<any>(`${this.API_URL}/${id}`);
    }

    toggleMaintenanceTypeStatus(id: string): Observable<any> {
        // Fetch current status, then update
        return this.http.get<any>(`${this.API_URL}/${id}`).pipe(
            map((response: any) => {
                const currentStatus = response.isActive;
                return this.http.put<any>(`${this.API_URL}/${id}`, { isActive: !currentStatus });
            })
        );
    }
}
