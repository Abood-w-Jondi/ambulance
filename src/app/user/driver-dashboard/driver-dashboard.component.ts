import { Component, OnInit, OnDestroy, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/services/toast.service';
import { DriverService } from '../../shared/services/driver.service';
import { TripService } from '../../shared/services/trip.service';
import { AuthService } from '../../shared/services/auth.service';
import { LocationTrackingService, GeoPosition } from '../../shared/services/location-tracking.service';
import { VehicleCookieService } from '../../shared/services/vehicle-cookie.service';
import { AddMaintenanceModalComponent } from '../add-maintenance-modal/add-maintenance-modal.component';
import { AddFuelModalComponent } from '../add-fuel-modal/add-fuel-modal.component';
import { Driver } from '../../shared/models';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [AddMaintenanceModalComponent, AddFuelModalComponent, CommonModule],
  templateUrl: './driver-dashboard.component.html',
  styleUrls: ['./driver-dashboard.component.css']
})
export class DriverDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  // Driver data
  driver = signal<Driver | null>(null);
  driverName = signal<string>('...');
  driverStatus = signal<string>('جاري التحميل...');
  tripsCompleted = signal<number>(0);
  totalEarnings = signal<number>(0);
  pendingLoansCount = signal<number>(0);
  pendingLoansAmount = signal<number>(0);
  
  // Location data
  currentPosition = signal<GeoPosition | null>(null);
  locationError = signal<string | null>(null);
  isLocationLoading = signal<boolean>(true);
  
  // Vehicle info
  vehicleId: string | null = null;
  
  // Map
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  
  // Modals
  showFuelModal: boolean = false;
  showMaintenanceModal: boolean = false;
  
  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private toastService: ToastService,
    private driverService: DriverService,
    private tripService: TripService,
    private authService: AuthService,
    private locationTrackingService: LocationTrackingService,
    private vehicleCookieService: VehicleCookieService
  ) {}

  ngOnInit(): void {
    this.loadDriverData();
    this.subscribeToLocation();
  }

  ngAfterViewInit(): void {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      this.initMap();
    }, 100);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    const mapElement = document.getElementById('driver-location-map');
    if (!mapElement) return;

    // Fix Leaflet default icon issue
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    // Default to Palestine center
    this.map = L.map('driver-location-map', {
      center: [31.5, 35.0],
      zoom: 8
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18
    }).addTo(this.map);
  }

  private updateMapPosition(position: GeoPosition): void {
    if (!this.map) return;

    const latLng: L.LatLngExpression = [position.latitude, position.longitude];

    if (this.marker) {
      this.marker.setLatLng(latLng);
    } else {
      const icon = L.divIcon({
        className: 'driver-marker',
        html: `
          <div class="marker-pulse"></div>
          <div class="marker-dot">
            <i class="fas fa-ambulance" style="font-size: 1.5rem;"></i>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      this.marker = L.marker(latLng, { icon }).addTo(this.map);
    }

    this.map.setView(latLng, 15);
  }

  private subscribeToLocation(): void {
    // Subscribe to position updates
    const posSub = this.locationTrackingService.getCurrentPosition().subscribe(position => {
      if (position) {
        this.currentPosition.set(position);
        this.isLocationLoading.set(false);
        this.updateMapPosition(position);
      }
    });
    this.subscriptions.push(posSub);

    // Subscribe to errors
    const errSub = this.locationTrackingService.getTrackingError().subscribe(error => {
      this.locationError.set(error);
      if (error) {
        this.isLocationLoading.set(false);
      }
    });
    this.subscriptions.push(errSub);
  }

  loadDriverData(): void {
    // Check if user is admin - admins don't have driver records
    if (this.authService.isAdmin()) {
      this.driverName.set('مسؤول النظام');
      this.driverStatus.set('مسؤول');
      this.isLocationLoading.set(false);
      
      // Still try to load vehicle for admin if they selected one
      const selectedVehicle = this.vehicleCookieService.getSelectedVehicleId();
      if (selectedVehicle) {
        this.vehicleId = selectedVehicle;
        this.locationTrackingService.startTracking(selectedVehicle);
      }
      return;
    }

    this.driverService.getCurrentDriver().subscribe({
      next: (driver) => {
        this.driver.set(driver);
        this.driverName.set(driver.arabicName || driver.name || 'السائق');
        this.driverStatus.set(driver.arabicStatus || 'متاح');
        
        // Load trips and loans data
        this.loadTodayStats(driver.id);
        this.loadPendingLoans(driver.id);
        
        // Get the selected vehicle from VehicleCookieService and start location tracking
        const selectedVehicle = this.vehicleCookieService.getSelectedVehicleId();
        if (selectedVehicle) {
          this.vehicleId = selectedVehicle;
          this.locationTrackingService.startTracking(selectedVehicle);
        } else {
          this.isLocationLoading.set(false);
          this.locationError.set('لم يتم تحديد المركبة');
        }
      },
      error: (error) => {
        console.error('Error loading driver data:', error);
        this.toastService.error('فشل تحميل بيانات السائق');
        this.driverStatus.set('خطأ في التحميل');
        this.isLocationLoading.set(false);
      }
    });
  }

  private loadTodayStats(driverId: string): void {
    // Get today's trips
    const today = new Date().toISOString().split('T')[0];
    
    this.tripService.getTrips({
      driverId: driverId,
      startDate: today,
      endDate: today
    }).subscribe({
      next: (response) => {
        const completedTrips = response.data.filter(t => 
          ['تم النقل', 'رفض النقل'].includes(t.transferStatus)
        );
        this.tripsCompleted.set(completedTrips.length);
        
        // Calculate today's earnings
        const earnings = completedTrips.reduce((sum, t) => sum + (t.driverShare || 0), 0);
        this.totalEarnings.set(earnings);
      },
      error: (error) => {
        console.error('Error loading today stats:', error);
      }
    });
  }

  private loadPendingLoans(driverId: string): void {
    this.tripService.getPatientLoans(driverId, { status: 'uncollected' }).subscribe({
      next: (loans) => {
        this.pendingLoansCount.set(loans.length);
        this.pendingLoansAmount.set(loans.reduce((sum, l) => sum + l.loanAmount, 0));
      },
      error: (error) => {
        console.error('Error loading pending loans:', error);
      }
    });
  }

  refreshLocation(): void {
    this.isLocationLoading.set(true);
    this.locationError.set(null);
    
    this.locationTrackingService.getCurrentPositionOnce()
      .then(position => {
        this.currentPosition.set(position);
        this.isLocationLoading.set(false);
        this.updateMapPosition(position);
        this.toastService.success('تم تحديث الموقع');
      })
      .catch(error => {
        this.locationError.set(error.message);
        this.isLocationLoading.set(false);
        this.toastService.error('فشل تحديث الموقع');
      });
  }

  startTrip(): void {
    this.router.navigate(['/user/my-trips']);
  }

  endShift(): void {
    this.driverStatus.set('غير متاح');
    this.locationTrackingService.stopTracking();
    this.toastService.info('تم إنهاء الدوام');
  }

  openFuelModal(): void {
    this.showFuelModal = true;
  }

  closeFuelModal(): void {
    this.showFuelModal = false;
  }

  openMaintenanceModal(): void {
    this.showMaintenanceModal = true;
  }

  closeMaintenanceModal(): void {
    this.showMaintenanceModal = false;
  }

  viewTrips(): void {
    this.router.navigate(['/user/my-trips']);
  }

  viewLoans(): void {
    this.router.navigate(['/user/loan-collection']);
  }

  viewWallet(): void {
    this.router.navigate(['/user/wallet']);
  }

  onFuelAdded(): void {
    this.closeFuelModal();
    this.toastService.success('تمت إضافة سجل وقود جديد');
  }

  onMaintenanceAdded(): void {
    this.closeMaintenanceModal();
    this.toastService.success('تمت إضافة سجل صيانة جديد');
  }

  getFormattedLocation(): string {
    const pos = this.currentPosition();
    if (!pos) return 'غير محدد';
    return `${pos.latitude.toFixed(6)}, ${pos.longitude.toFixed(6)}`;
  }
}
