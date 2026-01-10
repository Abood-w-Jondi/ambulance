import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { buildHttpParams } from '../utils/http-params.util';

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
    payedRevenue: number;
    totalDriverShare: number;
    totalParamedicShare: number;
    totalCompanyShare: number;
    totalOwnerShare: number;
    totalOtherExpenses: number;
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

export interface MonthlyBreakdown {
  year: number;
  month: number;
  monthName: string;
  fuel: {
    totalLiters: number;
    totalCost: number;
    recordsCount: number;
  };
  maintenance: {
    totalCost: number;
    recordsCount: number;
  };
  trips: {
    total: number;
    statusBreakdown: { [status: string]: number };
  };
  revenue: {
    totalRevenue: number;
    totalParamedicShare: number;
    totalDriverShare: number;
    totalCompanyShare: number;
    totalOwnerShare: number;
    totalOtherExpenses: number;
    loanAmount: number;
  };
  odometer?: {
    startReading: number;
    endReading: number;
    totalKm: number;
  };
}

export interface MonthlyBreakdownResponse {
  monthlyBreakdown: MonthlyBreakdown[];
  totals: {
    fuel: {
      totalLiters: number;
      totalCost: number;
    };
    maintenance: {
      totalCost: number;
    };
    trips: {
      total: number;
      statusBreakdown: { [status: string]: number };
    };
    revenue: {
      totalRevenue: number;
      totalParamedicShare: number;
      totalDriverShare: number;
      totalCompanyShare: number;
      totalOwnerShare: number;
      totalOtherExpenses: number;
      loanAmount: number;
    };
  };
  period: {
    startDate: string;
    endDate: string;
  };
  vehicleId: string | null;
  generatedAt: string;
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
    const httpParams = buildHttpParams(params);
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

  /**
   * Get monthly breakdown for annual export
   * @param params Query parameters
   * @returns Observable of monthly breakdown data
   */
  getMonthlyBreakdown(params: {
    period?: 'yearly' | 'custom';
    startDate?: string;
    endDate?: string;
    year?: number;
    vehicleId?: string;
  }): Observable<MonthlyBreakdownResponse> {
    const httpParams = buildHttpParams({ ...params, export: 'monthly' });
    return this.http.get<MonthlyBreakdownResponse>(this.API_URL, { params: httpParams });
  }

  /**
   * Get monthly breakdown for a specific year
   */
  getYearlyBreakdown(year: number, vehicleId?: string): Observable<MonthlyBreakdownResponse> {
    return this.getMonthlyBreakdown({
      period: 'yearly',
      year,
      vehicleId
    });
  }

  /**
   * Get monthly breakdown for a custom date range
   */
  getCustomRangeBreakdown(startDate: string, endDate: string, vehicleId?: string): Observable<MonthlyBreakdownResponse> {
    return this.getMonthlyBreakdown({
      period: 'custom',
      startDate,
      endDate,
      vehicleId
    });
  }
}
