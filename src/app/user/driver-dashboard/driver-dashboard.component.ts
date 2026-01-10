import { Component, OnInit, OnDestroy, AfterViewInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/services/toast.service';
import { DriverService } from '../../shared/services/driver.service';
import { TripService } from '../../shared/services/trip.service';
import { AuthService } from '../../shared/services/auth.service';
import { LocationTrackingService, GeoPosition } from '../../shared/services/location-tracking.service';
import { VehicleCookieService } from '../../shared/services/vehicle-cookie.service';
import { ChecklistService } from '../../shared/services/checklist.service';
import { AddMaintenanceModalComponent } from '../add-maintenance-modal/add-maintenance-modal.component';
import { AddFuelModalComponent } from '../add-fuel-modal/add-fuel-modal.component';
import { ChecklistReminderComponent } from '../../shared/checklist-reminder/checklist-reminder.component';
import { Driver } from '../../shared/models';
import { Subscription } from 'rxjs';
import { ConfirmationModalComponent , ConfirmationModalConfig } from '../../shared/confirmation-modal/confirmation-modal.component';
import * as L from 'leaflet';
import { UserService } from '../../shared/services/user.service';
import { GlobalVarsService } from '../../global-vars.service';
@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [AddMaintenanceModalComponent, AddFuelModalComponent, ChecklistReminderComponent, CommonModule , ConfirmationModalComponent],
  templateUrl: './driver-dashboard.component.html',
  styleUrls: ['./driver-dashboard.component.css']
})
export class DriverDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  // Driver data
  driver = signal<Driver | null>(null);
  driverName = signal<string>('...');
  driverStatus = signal<string>('جاري التحميل...');
driverShare = signal<number>(0);
paramedicShare = signal<number>(0);
centerShare = signal<number>(0);
totalKilometers = signal<number>(0);

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

  // Confirmation modal
  showEndShiftConfirmation = signal<boolean>(false);
 endShiftModalConfig = signal<ConfirmationModalConfig>({
  type: 'warning',
  title: 'إنهاء الدوام',
  message: 'هل أنت متأكد من إنهاء الدوام؟ سيتم تسجيل خروجك وتحديث حالتك إلى "غير متصل".',
  highlightedText: '"غير متصل"',
  confirmButtonText: 'نعم، إنهاء الدوام',
  cancelButtonText: 'إلغاء'
 });

  // Checklist reminder
  showChecklistReminder = signal(false);
  currentSessionId = signal<string | null>(null);
  currentVehicleName = signal<string>('');
  
  // Reminder check interval constant (in milliseconds)
  // For production: 600000ms (10 minutes)
  // For testing: 30000ms (30 seconds) or 60000ms (1 minute)
  private readonly REMINDER_CHECK_INTERVAL = 604000; // 10 minutes - change to 30000 for testing
  private reminderCheckTimer: any = null;

  // Subscriptions
  private subscriptions: Subscription[] = [];

  // Admin detection
  isAdmin = computed(() => this.authService.isAdmin());

  constructor(
    private router: Router,
    private toastService: ToastService,
    private driverService: DriverService,
    private tripService: TripService,
    private authService: AuthService,
    private locationTrackingService: LocationTrackingService,
    private vehicleCookieService: VehicleCookieService,
    private checklistService: ChecklistService,
    private userService : UserService,
    private globalVarsService : GlobalVarsService
  ) {
    this.globalVarsService.setGlobalHeader("الصفحة الرئيسية")
  }

  ngOnInit(): void {
    this.loadDriverData();
    this.subscribeToLocation();
    this.checkReminderStatus();
    this.startPeriodicReminderCheck();
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
    // Clear the reminder check timer
    if (this.reminderCheckTimer) {
      clearInterval(this.reminderCheckTimer);
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
      this.map.setView(latLng, 10);
    }
     this.map.panTo(latLng, { 
    animate: true, 
    duration: 0.5 
  });

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
      this.userService.getCurrentUserProfile().subscribe({
            next: ( ) => {
            },
            error: () => {
            }
        });
      
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
        
        // Load trips
        this.loadTodayStats(driver.id);
        
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
  const today = new Date().toISOString().split('T')[0];

  this.tripService.getTrips({
    driverId: driverId,
    startDate: today,
    endDate: today
  }).subscribe({
    next: (response) => {
      // 1. Filter trips first to include only 'تم النقل' and 'ميداني'
      const validTrips = (response.data || []).filter(t => 
        ['تم النقل', 'ميداني'].includes(t.transferStatus)
      );

      // 2. Calculate totals from the filtered list
      const totals = validTrips.reduce((acc, t) => {
        acc.dShare += (t.driverShare || 0);
        acc.pShare += (t.paramedicShare || 0);
        acc.cShare += (t.companyShare || 0) + (t.ownerShare || 0);

        const distance = (t.end || 0) - (t.start || 0);
        acc.kms += (distance > 0 ? distance : 0);

        return acc;
      }, { dShare: 0, pShare: 0, cShare: 0, kms: 0 });

      // 3. Update the signals
      this.driverShare.set(totals.dShare);
      this.paramedicShare.set(totals.pShare);
      this.centerShare.set(totals.cShare);
      this.totalKilometers.set(totals.kms);
    },
    error: (error) => {
      console.error('Error loading today stats:', error);
    }
  });
}

  refreshLocation(): void {
    this.isLocationLoading.set(true);
    this.locationError.set(null);
    
   this.locationTrackingService.getCurrentPosition()
  .subscribe(position => {
    if (position) {
      this.currentPosition.set(position);
      this.isLocationLoading.set(false);
      this.updateMapPosition(position);
    }
  });
  }

  startTrip(): void {
    this.router.navigate(['/user/my-trips']);
  }

  endShift(): void {
  this.showEndShiftConfirmation.set(true);
 }

// 💡 New method called when the user confirms the action
 confirmEndShift(): void {
  this.showEndShiftConfirmation.set(false); // Close the modal
  
  // Call logout API which will:
  // 1. Update driver status to غير متصل
  // 2. Log the action in audit logs
  // 3. Clear authentication tokens
  // 4. Redirect to login
  this.authService.logout().subscribe({
   next: () => {
    this.locationTrackingService.stopTracking();
    this.toastService.success('تم إنهاء الدوام بنجاح');
    // Router will handle redirect to login
   },
   error: (err) => {
    console.error('Logout failed:', err);
    this.toastService.error('فشل إنهاء الدوام');
   }
  });
 }

 // 💡 New method called when the user cancels the action
 cancelEndShift(): void {
  this.showEndShiftConfirmation.set(false); // Close the modal
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

  returnToAdmin(): void {
    this.router.navigate(['/admin/admin-dashboard']);
  }

  // Checklist reminder methods
  
  /**
   * Start periodic checking for checklist reminders
   * This will check every REMINDER_CHECK_INTERVAL (default: 10 minutes)
   */
  private startPeriodicReminderCheck(): void {
    // Skip for admins
    if (this.authService.isAdmin()) {
      return;
    }

    this.reminderCheckTimer = setInterval(() => {
      this.checkReminderStatus();
    }, this.REMINDER_CHECK_INTERVAL);
  }

  checkReminderStatus(): void {
    // Skip checklist reminder for admins (they don't have driver records)
    if (this.authService.isAdmin()) {
      return;
    }

    // Get vehicle ID from cookie
    const vehicleId = this.vehicleCookieService.getSelectedVehicleId();

    if (!vehicleId) {
      return;
    }

    this.checklistService.getCurrentSession(vehicleId).subscribe({
      next: (response : any) => {
        if (response) {
          this.currentSessionId.set(response.sessionId);
          this.currentVehicleName.set(response.vehicleName);

          if (response.canShowReminder && !response.checklistCompleted) {
            this.showChecklistReminder.set(true);
          } else {
          }
        }
      },
      error: (err) => {
        console.error('Failed to check reminder status:', err);
      }
    });
  }

  openChecklist(): void {
    this.showChecklistReminder.set(false);
    this.router.navigate(['/user/vehicle-checklist']);
  }

  dismissReminder(): void {
    const sessionId = this.currentSessionId();
    if (sessionId) {
      this.checklistService.dismissReminder(sessionId).subscribe({
        next: () => {
          this.showChecklistReminder.set(false);
          this.toastService.info(`سيظهر التذكير مرة أخرى بعد 10 دقائق`);
        },
        error: (err) => {
          console.error('Failed to dismiss reminder:', err);
          this.toastService.warning('حصل خطأ عند محاولة إغلاق التذكير');
        }
      });
    }
  }
}