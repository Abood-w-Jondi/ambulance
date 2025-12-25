import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, interval, Subscription } from 'rxjs';
import { takeUntil, switchMap, filter } from 'rxjs/operators';
import { VehicleService } from './vehicle.service';
import { AuthService } from './auth.service';

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
  private readonly UPDATE_INTERVAL_MS = 15 * 1000; // 2 minutes
  
  private currentPosition$ = new BehaviorSubject<GeoPosition | null>(null);
  private isTracking$ = new BehaviorSubject<boolean>(false);
  private trackingError$ = new BehaviorSubject<string | null>(null);
  private destroy$ = new Subject<void>();
  private trackingSubscription: Subscription | null = null;
  private watchId: number | null = null;

  constructor(
    private vehicleService: VehicleService,
    private authService: AuthService
  ) {}

  /**
   * Get current position as observable
   */
  getCurrentPosition(): Observable<GeoPosition | null> {
    return this.currentPosition$.asObservable();
  }

  /**
   * Get tracking status
   */
  isTracking(): Observable<boolean> {
    return this.isTracking$.asObservable();
  }

  /**
   * Get tracking errors
   */
  getTrackingError(): Observable<string | null> {
    return this.trackingError$.asObservable();
  }

  /**
   * Start tracking driver's location
   * Updates position every 2 minutes and sends to server
   */
  startTracking(vehicleId: string): void {
    if (this.isTracking$.value) {
      return;
    }

    if (!this.isGeolocationSupported()) {
      this.trackingError$.next('خدمة الموقع غير متاحة في هذا المتصفح');
      return;
    }

    this.isTracking$.next(true);
    this.trackingError$.next(null);

    // Get initial position
    this.updatePosition(vehicleId);

    // Set up interval for periodic updates
    this.trackingSubscription = interval(this.UPDATE_INTERVAL_MS)
      .pipe(
        takeUntil(this.destroy$),
        filter(() => this.authService.isAuthenticated())
      )
      .subscribe(() => {
        this.updatePosition(vehicleId);
      });

  }

  /**
   * Stop tracking location
   */
  stopTracking(): void {
    if (this.trackingSubscription) {
      this.trackingSubscription.unsubscribe();
      this.trackingSubscription = null;
    }

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    this.isTracking$.next(false);
  }

  /**
   * Get current position once (not continuous tracking)
   */
  getCurrentPositionOnce(): Promise<GeoPosition> {
    return new Promise((resolve, reject) => {
      if (!this.isGeolocationSupported()) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const geoPos: GeoPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp)
          };
          this.currentPosition$.next(geoPos);
          resolve(geoPos);
        },
        (error) => {
          const errorMsg = this.getGeolocationErrorMessage(error);
          this.trackingError$.next(errorMsg);
          reject(new Error(errorMsg));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000 // Accept cached position up to 1 minute old
        }
      );
    });
  }

  /**
   * Update current position and send to server
   */
  private updatePosition(vehicleId: string): void {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const geoPos: GeoPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp)
        };

        this.currentPosition$.next(geoPos);
        this.trackingError$.next(null);

        // Send to server
        this.vehicleService.updateLocation(vehicleId, geoPos.latitude, geoPos.longitude)
          .subscribe({
            next: () => {
            },
            error: (err) => {
              console.error('Failed to update location on server:', err);
              // Don't set tracking error for server errors, only for geolocation errors
            }
          });
      },
      (error) => {
        const errorMsg = this.getGeolocationErrorMessage(error);
        this.trackingError$.next(errorMsg);
        console.error('Geolocation error:', errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }

  /**
   * Check if geolocation is supported
   */
  private isGeolocationSupported(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Convert geolocation error code to Arabic message
   */
  private getGeolocationErrorMessage(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'تم رفض إذن الوصول للموقع. يرجى تفعيل خدمة الموقع في إعدادات المتصفح';
      case error.POSITION_UNAVAILABLE:
        return 'معلومات الموقع غير متاحة حالياً';
      case error.TIMEOUT:
        return 'انتهت مهلة طلب الموقع. يرجى المحاولة مرة أخرى';
      default:
        return 'حدث خطأ غير معروف أثناء تحديد الموقع';
    }
  }

  ngOnDestroy(): void {
    this.stopTracking();
    this.destroy$.next();
    this.destroy$.complete();
  }
}

