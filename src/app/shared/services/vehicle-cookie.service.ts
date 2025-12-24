import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class VehicleCookieService {
  private readonly COOKIE_NAME = 'selected_vehicle_id';
  private readonly SKIP_COOKIE_NAME = 'vehicle_selection_skipped';
  private readonly SKIPPED_VALUE = 'true';
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /**
   * Get the selected vehicle ID from cookie
   */
  getSelectedVehicleId(): string | null {
    if (!this.isBrowser) return null; // Safe guard

    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === this.COOKIE_NAME) {
        return value;
      }
    }
    return null;
  }

  /**
   * Set the selected vehicle ID in a persistent cookie
   */
  setSelectedVehicleId(vehicleId: string, days: number = 36500): void {
    if (!this.isBrowser) return; // Safe guard

    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${this.COOKIE_NAME}=${vehicleId};${expires};path=/`;
    this.clearSkipSelection();
  }

  /**
   * Check if a vehicle has been selected
   */
  hasSelectedVehicle(): boolean {
    return this.getSelectedVehicleId() !== null;
  }

  /**
   * Clear the selected vehicle cookie
   */
  clearSelectedVehicle(): void {
    if (this.isBrowser) {
      document.cookie = `${this.COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    }
  }

  /**
   * Mark that the user has skipped vehicle selection
   */
  setSkipSelection(days: number = 36500): void {
    if (!this.isBrowser) return;

    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${this.SKIP_COOKIE_NAME}=${this.SKIPPED_VALUE};${expires};path=/`;
    this.clearSelectedVehicle();
  }

  /**
   * Check if the user has skipped vehicle selection
   */
  hasSkippedSelection(): boolean {
    if (!this.isBrowser) return false;

    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === this.SKIP_COOKIE_NAME && value === this.SKIPPED_VALUE) {
        return true;
      }
    }
    return false;
  }

  /**
   * Clear the skip selection cookie
   */
  clearSkipSelection(): void {
    if (this.isBrowser) {
      document.cookie = `${this.SKIP_COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    }
  }

  /**
   * Check if vehicle selection has been completed
   */
  hasCompletedSelection(): boolean {
    return this.hasSelectedVehicle() || this.hasSkippedSelection();
  }
}