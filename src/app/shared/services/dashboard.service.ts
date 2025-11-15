import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  drivers: {
    total: number;
    active: number;
    available: number;
    onTrip: number;
    offline: number;
  };
  paramedics: {
    total: number;
    active: number;
    available: number;
    onTrip: number;
  };
  vehicles: {
    total: number;
    available: number;
    inService: number;
    maintenance: number;
  };
  trips: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
  };
  tripsByStatus: {
    [key: string]: number;
  };
  pendingTrips: {
    total: number;
    accepted: number;
    rejected: number;
  };
  financial: {
    totalRevenue: number;
    totalDriverShare: number;
    totalParamedicShare: number;
    totalCompanyShare: number;
  };
  fuel: {
    totalAmount: number;
    totalCost: number;
    recordsCount: number;
  };
  maintenance: {
    totalCost: number;
    completed: number;
    scheduled: number;
    inProgress: number;
  };
  recentTrips: any[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly API_URL = `${environment.apiEndpoint}/dashboard`;

  constructor(private http: HttpClient) {}

  /**
   * Get comprehensive dashboard statistics
   */
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(this.API_URL);
  }
}
