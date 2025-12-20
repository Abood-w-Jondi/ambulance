import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard - Protects routes that require authentication
 * Usage in routes: canActivate: [authGuard]
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // Check if token is expired
    if (authService.isTokenExpired()) {
      // Try to refresh token
      authService.refreshToken().subscribe({
        next: () => {
          return true;
        },
        error: () => {
          router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
          return false;
        }
      });
    }
    return true;
  }

  // Not authenticated, redirect to login
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

/**
 * Admin Guard - Protects admin-only routes
 * Usage in routes: canActivate: [adminGuard]
 */
export const adminGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  if (authService.isAdmin()) {
    
    return true;
  }

  // Not admin, redirect to appropriate dashboard
  if (authService.isDriver()) {
    router.navigate(['/user/driver-dashboard']);
  } else if (authService.isParamedic()) {
    router.navigate(['/user/driver-dashboard']);
  } else {
    router.navigate(['/login']);
  }

  return false;
};

/**
 * Driver Guard - Protects driver-only routes
 * Usage in routes: canActivate: [driverGuard]
 */
export const driverGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  if (authService.isDriver() || authService.isParamedic() || authService.isAdmin()) {
    return true;
  }

  // Not driver/paramedic, redirect to admin dashboard
  router.navigate(['/login']);
  return false;
};

/**
 * Guest Guard - Protects routes that should only be accessible to non-authenticated users
 * Usage in routes: canActivate: [guestGuard]
 */
export const guestGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated and token is not expired
  if (!authService.isAuthenticated() || authService.isTokenExpired()) {
    // Clear auth data if token is expired
    if (authService.isTokenExpired()) {
      authService.clearAuthData();
    }
    return true;
  }

  // Already authenticated with valid token, redirect to appropriate dashboard
  if (authService.isAdmin()) {
    router.navigate(['/admin/admin-dashboard']);
  } else if (authService.isDriver() || authService.isParamedic()) {
    router.navigate(['/user/driver-dashboard']);
  }

  return false;
};
