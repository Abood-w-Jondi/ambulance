import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core'; // Added PLATFORM_ID
import { isPlatformBrowser } from '@angular/common'; // Added isPlatformBrowser
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID); // Inject the platform ID
  const isBrowser = isPlatformBrowser(platformId);

  // Get the auth token (Ensure getAccessToken handles non-browser safely too!)
  const token = authService.getAccessToken();

  let authReq = req;
  if (token && !req.url.includes('/auth/login') && !req.url.includes('/auth/refresh')) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/logout')) {
        
        // ONLY touch localStorage if we are in the browser
        if (isBrowser) {
          localStorage.removeItem('ambulance_token');
          localStorage.removeItem('ambulance_refresh_token');
          localStorage.removeItem('ambulance_user');
        }
        
        router.navigate(['/login']);
      }

      if (error.status === 403) {
        console.error('Access forbidden');
      }

      return throwError(() => error);
    })
  );
};