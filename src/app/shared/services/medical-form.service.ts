import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  MedicalForm,
  MedicalFormData,
  MedicalFormFilters,
  ApiResponse,
  PaginatedResponse
} from '../models/medical-form.model';
import { buildHttpParams } from '../utils/http-params.util';

@Injectable({
  providedIn: 'root'
})
export class MedicalFormService {
  private readonly API_URL = `${environment.apiEndpoint}/medical-forms`;

  constructor(private http: HttpClient) {}

  /**
   * Get medical form for a specific trip
   * Auto-creates empty form if doesn't exist
   */
  getMedicalForm(tripId: string): Observable<MedicalForm> {
    return this.http.get<ApiResponse<MedicalForm>>(`${this.API_URL}/${tripId}`)
      .pipe(map((response:any) => response))
  }

  /**
   * Update medical form (partial save allowed)
   */
  updateMedicalForm(tripId: string, formData: MedicalFormData): Observable<MedicalForm> {
    return this.http.put<ApiResponse<MedicalForm>>(
      `${this.API_URL}/${tripId}`,
      { formData }
    ).pipe(map(response => response.data!));
  }

  /**
   * Mark form as complete and lock it
   * Once locked, only admins can edit
   */
  completeMedicalForm(tripId: string, formData: MedicalFormData): Observable<MedicalForm> {
    return this.http.post<ApiResponse<MedicalForm>>(
      `${this.API_URL}/${tripId}/complete`,
      { formData }
    ).pipe(map(response => response.data!));
  }

  /**
   * Unlock a locked form (Admin only)
   */
  unlockMedicalForm(tripId: string): Observable<MedicalForm> {
    return this.http.post<ApiResponse<MedicalForm>>(
      `${this.API_URL}/${tripId}/unlock`,
      {}
    ).pipe(map(response => response.data!));
  }

  /**
   * Get all medical forms with filters (Admin only)
   */
  getMedicalForms(filters?: MedicalFormFilters): Observable<PaginatedResponse<MedicalForm>> {
    const params = buildHttpParams(filters);
    return this.http.get<PaginatedResponse<MedicalForm>>(
      this.API_URL,
      { params }
    );
  }

  /**
   * Calculate completion percentage locally (for real-time updates)
   * Counts filled fields vs total fields recursively
   */
  calculateCompletionPercentage(formData: MedicalFormData, template: MedicalFormData): number {
    const totalFields = this.countFields(template);
    const filledFields = this.countFilledFields(formData);

    if (totalFields === 0) {
      return 0;
    }

    return Math.round((filledFields / totalFields) * 100 * 100) / 100; // Round to 2 decimals
  }

  /**
   * Recursively count all fields in the template
   */
  private countFields(obj: any): number {
    if (!obj || typeof obj !== 'object') {
      return 1;
    }

    let count = 0;

    if (Array.isArray(obj)) {
      // Indexed array - count as 1 field
      return 1;
    }

    // Object - recurse through properties
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          // Nested object - recurse
          count += this.countFields(value);
        } else {
          // Primitive or array - count as 1
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Recursively count filled fields in form data
   */
  private countFilledFields(obj: any): number {
    if (!obj || typeof obj !== 'object') {
      return this.isFilled(obj) ? 1 : 0;
    }

    let count = 0;

    if (Array.isArray(obj)) {
      // Array - check if any element is filled
      return obj.some(item => this.isFilled(item)) ? 1 : 0;
    }

    // Object - recurse through properties
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          // Nested object - recurse
          count += this.countFilledFields(value);
        } else {
          // Primitive or array - check if filled
          if (this.isFilled(value)) {
            count++;
          }
        }
      }
    }

    return count;
  }

  /**
   * Check if a value is considered "filled"
   */
  private isFilled(value: any): boolean {
    if (value === null || value === undefined || value === '') {
      return false;
    }

    if (value === false) {
      return false; // Unchecked checkbox
    }

    if (Array.isArray(value)) {
      // Array is filled if it has at least one non-empty element
      return value.some(item => this.isFilled(item));
    }

    return true;
  }

  /**
   * Load H.json template for empty forms
   */
  loadTemplate(): Observable<MedicalFormData> {
    return this.http.get<MedicalFormData>('/H.json');
  }

  /**
   * Check if form exists for a trip
   */
  checkFormExists(tripId: string): Observable<boolean> {
    return this.getMedicalForm(tripId).pipe(
      map(form => !!form && !!form.id)
    );
  }

  /**
   * Get completion status for a trip (for quick checks)
   */
  getCompletionStatus(tripId: string): Observable<{ isComplete: boolean; percentage: number }> {
    return this.getMedicalForm(tripId).pipe(
      map(form => ({
        isComplete: form.isComplete,
        percentage: form.completionPercentage
      }))
    );
  }
}
