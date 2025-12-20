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
    totalOwnerShare: number;
    companyBalance: number;
    companyDebtToOwner: number;
    ownerBalance: number;
    netDriverPosition: number;      // Positive = collect from drivers, Negative = pay to drivers
    netParamedicPosition: number;   // Positive = collect from paramedics, Negative = pay to paramedics
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

  /**
   * Get statistics with caching support (NEW - uses statistics.php endpoint)
   * @param useCache Whether to use cached data (default: true)
   * @param cacheMinutes Cache validity in minutes (default: 5)
   */
  getStatistics(useCache: boolean = true, cacheMinutes: number = 5): Observable<any> {
    const params = {
      cache: useCache.toString(),
      cacheMinutes: cacheMinutes.toString()
    };
    return this.http.get(`${environment.apiEndpoint}/statistics`, { params });
  }
}
