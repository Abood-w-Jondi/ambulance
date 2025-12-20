import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { buildHttpParams } from '../utils/http-params.util';

/**
 * Audit Log Entry
 */
export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  actionType: string;
  userId: string | null;
  userRole: string;
  userName: string | null;
  changedFields: string[];
  oldValues: Record<string, any>;
  newValues: Record<string, any>;
  isFinancialChange: boolean;
  financialImpact: number;
  notes: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Query parameters for audit logs
 */
export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  entityType?: string;
  actionType?: string;
  userId?: string;
  isFinancialChange?: boolean;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private readonly API_URL = `${environment.apiEndpoint}/audit-logs`;

  constructor(private http: HttpClient) {}

  /**
   * Get audit logs with filtering and pagination
   */
  getAuditLogs(params?: AuditLogQueryParams): Observable<PaginatedResponse<AuditLog>> {
    const httpParams = buildHttpParams(params);
    return this.http.get<PaginatedResponse<AuditLog>>(this.API_URL, { params: httpParams });
  }

  /**
   * Get driver activity logs
   */
  getDriverActivityLogs(driverId: string, startDate?: string, endDate?: string): Observable<PaginatedResponse<AuditLog>> {
    return this.getAuditLogs({
      entityType: 'driver',
      userId: driverId,
      startDate,
      endDate,
      sortBy: 'created_at',
      sortOrder: 'DESC'
    });
  }

  /**
   * Get trip change logs
   */
  getTripChangeLogs(tripId: string): Observable<PaginatedResponse<AuditLog>> {
    return this.getAuditLogs({
      entityType: 'trip',
      // Note: Using entityType, not entityId - would need API adjustment
      sortBy: 'created_at',
      sortOrder: 'DESC'
    });
  }

  /**
   * Get financial change logs only
   */
  getFinancialChangeLogs(startDate?: string, endDate?: string): Observable<PaginatedResponse<AuditLog>> {
    return this.getAuditLogs({
      isFinancialChange: true,
      startDate,
      endDate,
      sortBy: 'created_at',
      sortOrder: 'DESC'
    });
  }
}
