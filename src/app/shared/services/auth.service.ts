import { Injectable, signal, computed, Inject, PLATFORM_ID } from '@angular/core'; // Added Inject, PLATFORM_ID
import { isPlatformBrowser } from '@angular/common'; // Added isPlatformBrowser
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User, LoginCredentials, LoginResponse, UserRole, TokenPayload } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiEndpoint;
  private readonly TOKEN_KEY = environment.jwt.tokenKey;
  private readonly REFRESH_TOKEN_KEY = environment.jwt.refreshTokenKey;
  private isBrowser: boolean; // Flag to track environment

  // Signals for reactive state
  // We initialize with null first to be safe for SSR
  currentUser = signal<User | null>(null);
  
  isAuthenticated = computed(() => this.currentUser() !== null);
  userRole = computed(() => this.currentUser()?.role || null);
  isAdmin = computed(() => this.userRole() === 'admin');
  isDriver = computed(() => this.userRole() === 'driver');
  isParamedic = computed(() => this.userRole() === 'paramedic');

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object // Inject Platform ID
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    // Only try to read from storage if we are in a real browser
    this.initializeAuth();
  }

  /**
   * Initialize authentication state from storage
   */
  private initializeAuth(): void {
    if (this.isBrowser) {
      const user = this.getUserFromStorage();
      if (user) {
        this.currentUser.set(user);
      }
    }
  }

  /**
   * Login with username/email and password
   */
  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, credentials).pipe(
      tap(response => {
        this.handleLoginSuccess(response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Logout current user
   */
  logout(): Observable<void> {
    const token = this.getAccessToken();

    if (token) {
      return this.http.post<void>(`${this.API_URL}/auth/logout`, {}).pipe(
        tap(() => {
          this.clearAuthData();
          this.router.navigate(['/login']);
        }),
        catchError(() => {
          this.clearAuthData();
          this.router.navigate(['/login']);
          return throwError(() => new Error('Logout failed'));
        })
      );
    } else {
      this.clearAuthData();
      this.router.navigate(['/login']);
      return new Observable(observer => {
        observer.next();
        observer.complete();
      });
    }
  }

  /**
   * Logout without calling API (for use in interceptor)
   */
  logoutLocal(): void {
    this.clearAuthData();
  }

  /**
   * Refresh access token using refresh token
   */
  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<LoginResponse>(`${this.API_URL}/auth/refresh`, { refreshToken }).pipe(
      tap(response => {
        this.handleLoginSuccess(response);
      }),
      catchError(error => {
        this.clearAuthData();
        return throwError(() => error);
      })
    );
  }

  /**
   * Get current user profile from server
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/auth/me`).pipe(
      tap(user => {
        this.setUser(user);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Change password
   */
  changePassword(oldPassword: string, newPassword: string): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/auth/change-password`, {
      oldPassword,
      newPassword
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Request password reset
   */
  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/auth/forgot-password`, { email }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Reset password with token
   */
  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/auth/reset-password`, {
      token,
      newPassword
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: UserRole): boolean {
    return this.userRole() === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: UserRole[]): boolean {
    const userRole = this.userRole();
    return userRole !== null && roles.includes(userRole);
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }
    return null;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    try {
      const payload = this.decodeToken(token);
      const expiryTime = payload.exp * 1000;
      return Date.now() >= expiryTime;
    } catch {
      return true;
    }
  }

  /**
   * Decode JWT token
   */
  private decodeToken(token: string): TokenPayload {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  }

  /**
   * Handle successful login
   */
  private handleLoginSuccess(response: LoginResponse): void {
    if (this.isBrowser) {
      localStorage.setItem(this.TOKEN_KEY, response.accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
      localStorage.setItem('ambulance_user', JSON.stringify(response.user));
    }
    this.setUser(response.user);
  }

  /**
   * Set current user
   */
  private setUser(user: User): void {
    this.currentUser.set(user);
    if (this.isBrowser) {
      localStorage.setItem('ambulance_user', JSON.stringify(user));
    }
  }

  /**
   * Get user from storage
   */
  private getUserFromStorage(): User | null {
    if (!this.isBrowser) return null; // Added safe check

    try {
      const userJson = localStorage.getItem('ambulance_user');
      if (userJson) {
        return JSON.parse(userJson);
      }
    } catch (error) {
      console.error('Error parsing user from storage', error);
    }
    return null;
  }

  /**
   * Clear all authentication data
   */
  public clearAuthData(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem('ambulance_user');
    }
    this.currentUser.set(null);
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = error.message || 'حدث خطأ غير متوقع';
    if (typeof ErrorEvent !== 'undefined' && error.error instanceof ErrorEvent) {
      errorMessage = `خطأ: ${error.error.message}`;
    } else {
      if (error.status === 401) {
        errorMessage = 'اسم المستخدم أو كلمة المرور غير صحيحة';
      } else if (error.status === 403) {
        errorMessage = 'ليس لديك صلاحية للوصول';
      } else if (error.status === 404) {
        errorMessage = 'المورد المطلوب غير موجود';
      } else if (error.status === 500) {
        errorMessage = 'خطأ في الخادم';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}