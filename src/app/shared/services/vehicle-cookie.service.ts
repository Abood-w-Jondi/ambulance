import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VehicleCookieService {
  private readonly COOKIE_NAME = 'selected_vehicle_id';
  private readonly SKIP_COOKIE_NAME = 'vehicle_selection_skipped';
  private readonly SKIPPED_VALUE = 'true';

  constructor() {}

  /**
   * Get the selected vehicle ID from cookie
   */
  getSelectedVehicleId(): string | null {
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
   * @param vehicleId - The vehicle ID to store
   * @param days - Number of days until expiry (default: 36500 = ~100 years)
   */
  setSelectedVehicleId(vehicleId: string, days: number = 36500): void {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${this.COOKIE_NAME}=${vehicleId};${expires};path=/`;
    // Clear skip cookie when vehicle is selected
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
    document.cookie = `${this.COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }

  /**
   * Mark that the user has skipped vehicle selection
   */
  setSkipSelection(days: number = 36500): void {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${this.SKIP_COOKIE_NAME}=${this.SKIPPED_VALUE};${expires};path=/`;
    // Clear vehicle selection when skipping
    this.clearSelectedVehicle();
  }

  /**
   * Check if the user has skipped vehicle selection
   */
  hasSkippedSelection(): boolean {
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
    document.cookie = `${this.SKIP_COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }

  /**
   * Check if vehicle selection has been completed (either selected or skipped)
   */
  hasCompletedSelection(): boolean {
    return this.hasSelectedVehicle() || this.hasSkippedSelection();
  }
}
