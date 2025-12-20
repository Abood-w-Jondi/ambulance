import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { VehicleCookieService } from '../services/vehicle-cookie.service';
import { AuthService } from '../services/auth.service';

/**
 * Guard to check if a vehicle has been selected or selection has been skipped
 * Redirects to vehicle selection page if no vehicle is selected and not skipped
 * Admins can bypass vehicle selection
 */
export const vehicleSelectionGuard = () => {
  const vehicleCookieService = inject(VehicleCookieService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // Allow admins to bypass vehicle selection
  if (authService.isAdmin()) {
    return true;
  }

  // Check if vehicle selection has been completed (selected or skipped)
  if (!vehicleCookieService.hasCompletedSelection()) {
    router.navigate(['/select-vehicle']);
    return false;
  }

  return true;
};

/**
 * Guard to prevent accessing vehicle selection page if already completed
 * Redirects to login if vehicle selection has been completed (selected or skipped)
 * Admins can always access to bypass or select if needed
 */
export const vehicleSelectionPageGuard = () => {
  const vehicleCookieService = inject(VehicleCookieService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // Admins can always access vehicle selection page
  if (authService.isAdmin()) {
    return true;
  }

  // Non-admin users redirected to login if vehicle selection already completed
  if (vehicleCookieService.hasCompletedSelection()) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};
