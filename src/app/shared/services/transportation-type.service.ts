import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface TransportationTypeReference {
    id: string;
    name: string;
    description?: string;
    isActive?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class TransportationTypeService {
    private API_URL = `${environment.apiEndpoint}/transportation-types`;

    constructor(private http: HttpClient) {}

    searchTransportationTypes(searchTerm: string): Observable<TransportationTypeReference[]> {
        const params = new HttpParams().set('searchTerm', searchTerm);
        return this.http.get<{success: boolean, data: TransportationTypeReference[]}>(`${this.API_URL}/search`, { params })
            .pipe(map((response:any) => response || []));
    }

    getTransportationTypes(queryParams?: any): Observable<any> {
        return this.http.get<any>(this.API_URL, { params: queryParams });
    }

    createTransportationType(data: any): Observable<any> {
        return this.http.post<any>(this.API_URL, data);
    }

    updateTransportationType(id: string, data: any): Observable<any> {
        return this.http.put<any>(`${this.API_URL}/${id}`, data);
    }

    deleteTransportationType(id: string): Observable<any> {
        return this.http.delete<any>(`${this.API_URL}/${id}`);
    }

    toggleTransportationTypeStatus(id: string): Observable<any> {
        // Fetch current status, then update
        return this.http.get<any>(`${this.API_URL}/${id}`).pipe(
            map((response: any) => {
                const currentStatus = response.isActive;
                return this.http.put<any>(`${this.API_URL}/${id}`, { isActive: !currentStatus });
            })
        );
    }
}
