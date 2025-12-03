import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface StatisticsResponse {
  drivers: {
    total: number;
    available: number;
    busy: number;
    offline: number;
    totalOwed: number;
  };
  trips: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    completed: number;
    inProgress: number;
    refused: number;
    notCompleted: number;
  };
  revenue: {
    totalRevenue: number;
    totalPayed: number;
    totalDriverShare: number;
    totalParamedicShare: number;
    totalCompanyShare: number;
    loanCount: number;
    totalLoanAmount: number;
  };
  fuel: {
    totalAmount: number;
    totalCost: number;
    recordsCount: number;
    avgPricePerLiter: number;
  };
  maintenance: {
    totalCost: number;
    recordsCount: number;
  };
  vehicles: {
    total: number;
    available: number;
    busy: number;
    maintenance: number;
  };
  dateRange: {
    requested: {
      period: string;
      startDate: string | null;
      endDate: string | null;
    };
    effective: {
      startDate: string;
      endDate: string;
    };
    legacyCutoff: string;
  };
  generatedAt: string;
  _cached?: boolean;
  _expiresAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private readonly API_URL = `${environment.apiEndpoint}/statistics`;

  constructor(private http: HttpClient) {}

  /**
   * Get statistics with optional date range filtering
   * @param params Query parameters for filtering
   * @returns Observable of statistics data
   */
  getStatistics(params?: {
    period?: 'week' | 'month' | 'custom';
    startDate?: string;
    endDate?: string;
    cache?: boolean;
    cacheMinutes?: number;
  }): Observable<StatisticsResponse> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.period) {
        httpParams = httpParams.set('period', params.period);
      }
      if (params.startDate) {
        httpParams = httpParams.set('startDate', params.startDate);
      }
      if (params.endDate) {
        httpParams = httpParams.set('endDate', params.endDate);
      }
      if (params.cache !== undefined) {
        httpParams = httpParams.set('cache', params.cache.toString());
      }
      if (params.cacheMinutes !== undefined) {
        httpParams = httpParams.set('cacheMinutes', params.cacheMinutes.toString());
      }
    }

    return this.http.get<StatisticsResponse>(this.API_URL, { params: httpParams });
  }

  /**
   * Get statistics for the last 7 days
   */
  getWeeklyStats(): Observable<StatisticsResponse> {
    return this.getStatistics({ period: 'week' });
  }

  /**
   * Get statistics for the last 30 days
   */
  getMonthlyStats(): Observable<StatisticsResponse> {
    return this.getStatistics({ period: 'month' });
  }

  /**
   * Get statistics for a custom date range
   */
  getCustomRangeStats(startDate: string, endDate: string): Observable<StatisticsResponse> {
    return this.getStatistics({
      period: 'custom',
      startDate,
      endDate
    });
  }
}
