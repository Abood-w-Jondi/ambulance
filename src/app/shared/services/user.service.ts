import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { GlobalVarsService } from '../../global-vars.service';
import { tap } from 'rxjs/operators';
export interface UpdateProfileRequest {
  id? : string;
  arabicName?: string;
  fullName?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  jobTitle?: string;
  educationLevel?: 'EMI' | 'B' | 'I' | 'P';
  profileImageUrl?: string | null;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  arabicName: string;
  phoneNumber: string;
  jobTitle: string;
  educationLevel: 'EMI' | 'B' | 'I' | 'P' | null;
  role: 'admin' | 'driver';
  isActive: boolean;
  isEmailVerified: boolean;
  profileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  // Role-specific read-only fields for drivers
  driverId?: string;
  amountOwed?: number;
  driverStatus?: string;
  isAccountCleared?: boolean;
  profile_image_url ?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = environment.apiEndpoint;
  injectedVars = inject(GlobalVarsService);
  constructor(
    private http: HttpClient
  ) { }

  /**
   * Get current user profile
   * Includes role-specific read-only fields
   */
  getCurrentUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.API_URL}/auth/me`).pipe(
      tap((response) => {
              response.profileImageUrl = response.profileImageUrl !== undefined 
    ? response.profileImageUrl 
    : response.profile_image_url;
        this.injectedVars.setCurrentIMG(response.profileImageUrl || '/assets/default-avatar.png');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Update current user profile
   * Users can only update their own profile, not role-specific fields
   */
  updateProfile(profileData: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.API_URL}/auth/me`, profileData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Change user password
   * User must provide current password for verification
   */
  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/auth/change-password`, {
      oldPassword,
      newPassword
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'حدث خطأ غير متوقع';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `خطأ: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 400) {
        errorMessage = error.error?.message || 'بيانات غير صحيحة';
      } else if (error.status === 401) {
        errorMessage = 'غير مصرح. يرجى تسجيل الدخول مرة أخرى';
      } else if (error.status === 403) {
        errorMessage = 'ليس لديك صلاحية للقيام بهذا الإجراء';
      } else if (error.status === 404) {
        errorMessage = 'المستخدم غير موجود';
      } else if (error.status === 409) {
        errorMessage = error.error?.message || 'هذا البيان موجود بالفعل';
      } else if (error.status === 500) {
        errorMessage = 'خطأ في الخادم. يرجى المحاولة لاحقاً';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
