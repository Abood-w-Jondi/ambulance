import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * HTTP Interceptor that adds authentication token to requests
 * and handles authentication errors
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Get the auth token
  const token = authService.getAccessToken();

  // Clone the request and add the authorization header if token exists
  let authReq = req;
  if (token && !req.url.includes('/auth/login') && !req.url.includes('/auth/refresh')) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Handle the request and catch errors
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized errors
      if (error.status === 401) {
        // Token expired or invalid
        authService.logout().subscribe();
        router.navigate(['/login']);
      }

      // Handle 403 Forbidden errors
      if (error.status === 403) {
        console.error('Access forbidden');
      }

      return throwError(() => error);
    })
  );
};
