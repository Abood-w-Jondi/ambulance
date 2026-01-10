import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { VehicleService } from './vehicle.service';
import { ToastService } from './toast.service';

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class LocationTrackingService implements OnDestroy {
  // CONFIGURATION
  private readonly UPDATE_INTERVAL_MS = 15 * 1000; // 15 seconds
  private readonly MIN_DISTANCE_METERS = 50;        // 50 meters

  private currentPosition$ = new BehaviorSubject<GeoPosition | null>(null);
  private isTracking$ = new BehaviorSubject<boolean>(false);
  private trackingError$ = new BehaviorSubject<string | null>(null);
  private destroy$ = new Subject<void>();
  private watchId: number | null = null;

  constructor(
    private vehicleService: VehicleService,
    private toast: ToastService
  ) {}

  /**
   * Start tracking driver's location
   * Sends initial position immediately, then only when vehicle moves 50m+ AND 15s have passed
   */
  startTracking(vehicleId: string): void {
    if (this.isTracking$.value) return;

    if (!this.isGeolocationSupported()) {
      const msg = 'خدمة الموقع غير مدعومة في هذا المتصفح';
      this.trackingError$.next(msg);
      this.toast.error(msg, 5000);
      return;
    }

    this.isTracking$.next(true);
    this.trackingError$.next(null);

    let lastSentTime = 0;

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const lastPos = this.currentPosition$.value;
        const now = Date.now();

        // Calculate distance from last sent position
        const distanceMoved = lastPos 
          ? this.calculateDistance(lastPos.latitude, lastPos.longitude, latitude, longitude) 
          : Infinity; // First position

        // Check conditions
        const isFirstPosition = lastPos === null;
        const enoughTimePassed = (now - lastSentTime) >= this.UPDATE_INTERVAL_MS;
        const enoughDistanceMoved = distanceMoved >= this.MIN_DISTANCE_METERS;

        // Logic: Send if it's the first position OR (moved enough AND enough time passed)
        const shouldUpdate = isFirstPosition || (enoughDistanceMoved && enoughTimePassed);

        if (shouldUpdate) {
          const geoPos: GeoPosition = {
            latitude,
            longitude,
            accuracy,
            timestamp: new Date(position.timestamp)
          };

          // Update local state
          this.currentPosition$.next(geoPos);
          lastSentTime = now;

          // Send to server
          this.vehicleService.updateLocation(vehicleId, latitude, longitude)
            .subscribe({
              error: (err) => {
                console.error('Database Sync Error:', err);
                // We don't stop tracking, but we log the server failure
              }
            });

          const logMsg = isFirstPosition 
            ? '📍 Initial Location Sent' 
            : `📍 Location Updated: Moved ${Math.round(distanceMoved)}m`;
          console.log(logMsg);
        } else {
          // Optional: Log why update was skipped
          const timeSinceLastUpdate = ((now - lastSentTime) / 1000).toFixed(0);
          console.log(`⏭️ Update Skipped: Moved ${Math.round(distanceMoved)}m, Time elapsed: ${timeSinceLastUpdate}s`);
        }
      },
      (error) => this.handleError(error),
      { 
        enableHighAccuracy: true, 
        maximumAge: 0, // Ensure we don't get cached/old data
        timeout: 30000 
      }
    );
  }

  /**
   * Stop tracking and cleanup
   */
  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking$.next(false);
    console.log('🛑 Location tracking stopped');
  }

  /**
   * Calculate distance between two points using Haversine Formula
   * @returns Distance in meters
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Handle geolocation errors
   */
  private handleError(error: GeolocationPositionError): void {
    if (error.code === error.POSITION_UNAVAILABLE) {
    // Don't set trackingError$ or show toast for this transient error
    return;
  }
    const errorMsg = this.getGeolocationErrorMessage(error);
    this.trackingError$.next(errorMsg);
    // If permission is denied, stop tracking immediately
    if (error.code === error.PERMISSION_DENIED) {
      this.stopTracking();
    }
  }

  /**
   * Check if geolocation API is supported
   */
  private isGeolocationSupported(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Convert geolocation error codes to Arabic messages
   */
  private getGeolocationErrorMessage(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'تم رفض إذن الوصول للموقع. يرجى تفعيل الموقع من إعدادات المتصفح';
      case error.POSITION_UNAVAILABLE:
        return 'معلومات الموقع غير متاحة حالياً';
      case error.TIMEOUT:
        return 'انتهت مهلة طلب الموقع. تأكد من جودة الإشارة';
      default:
        return 'حدث خطأ غير معروف أثناء تحديد الموقع';
    }
  }

  // Public getters for UI components
  getCurrentPosition(): Observable<GeoPosition | null> { 
    return this.currentPosition$.asObservable(); 
  }
  
  isTracking(): Observable<boolean> { 
    return this.isTracking$.asObservable(); 
  }
  
  getTrackingError(): Observable<string | null> { 
    return this.trackingError$.asObservable(); 
  }

  ngOnDestroy(): void {
    this.stopTracking();
    this.destroy$.next();
    this.destroy$.complete();
  }
}