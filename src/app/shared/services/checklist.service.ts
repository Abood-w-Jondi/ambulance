import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  VehicleDriverSession,
  VehicleChecklist,
  ChecklistReminderStatus
} from '../models/checklist.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChecklistService {
  private readonly API_URL = `${environment.apiEndpoint}/vehicle-checklists`;

  constructor(private http: HttpClient) {}

  /**
   * Get or create current driver-vehicle session
   */
  createSession(vehicleId: string, driverId: string): Observable<ApiResponse<VehicleDriverSession>> {
    return this.http.post<ApiResponse<VehicleDriverSession>>(
      `${this.API_URL}/sessions`,
      { vehicleId, driverId }
    );
  }

  /**
   * Get current active session
   */
  getCurrentSession(vehicleId?: string): Observable<ApiResponse<VehicleDriverSession>> {
    let params = new HttpParams();
    if (vehicleId) {
      params = params.set('vehicleId', vehicleId);
    }

    return this.http.get<ApiResponse<VehicleDriverSession>>(
      `${this.API_URL}/sessions/current`,
      { params }
    );
  }

  /**
   * Dismiss checklist reminder
   */
  dismissReminder(sessionId: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(
      `${this.API_URL}/dismiss`,
      { sessionId }
    );
  }

  /**
   * Submit completed checklist
   */
  submitChecklist(checklist: VehicleChecklist): Observable<ApiResponse<{ checklistId: string; completedAt: string }>> {
    return this.http.post<ApiResponse<{ checklistId: string; completedAt: string }>>(
      this.API_URL,
      checklist
    );
  }

  /**
   * Get checklists with filtering (admin)
   */
  getChecklists(params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    vehicleId?: string;
    driverId?: string;
    completionStatus?: 'completed' | 'pending' | 'all';
  }): Observable<PaginatedResponse<VehicleChecklist>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<PaginatedResponse<VehicleChecklist>>(
      this.API_URL,
      { params: httpParams }
    );
  }

  /**
   * Get single checklist by ID
   */
  getChecklistById(id: string): Observable<ApiResponse<VehicleChecklist>> {
    return this.http.get<ApiResponse<VehicleChecklist>>(
      `${this.API_URL}/${id}`
    );
  }

  /**
   * Check reminder status
   */
  getReminderStatus(sessionId: string): Observable<ApiResponse<ChecklistReminderStatus>> {
    return this.http.get<ApiResponse<ChecklistReminderStatus>>(
      `${this.API_URL}/sessions/${sessionId}/reminder-status`
    );
  }
}
