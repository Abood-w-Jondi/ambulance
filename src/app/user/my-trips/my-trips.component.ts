import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TripService } from '../../shared/services/trip.service';
import { AuthService } from '../../shared/services/auth.service';
import { DriverService } from '../../shared/services/driver.service';
import { ToastService } from '../../shared/services/toast.service';
import { VehicleCookieService } from '../../shared/services/vehicle-cookie.service';
import { MedicalFormService } from '../../shared/services/medical-form.service';
import { Trip, TransferStatus } from '../../shared/models/trip.model';

@Component({
  selector: 'app-my-trips',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-trips.component.html',
  styleUrls: ['./my-trips.component.css']
})
export class MyTripsComponent implements OnInit, OnDestroy {
  // Tab selection
  selectedTab: 'available' | 'mytrips' = 'available';

  // My Trips view toggle
  historyView: 'vehicle' | 'driver' = 'vehicle';

  // Trip lists
  availableTrips: Trip[] = [];
  myTrips: Trip[] = [];
  allMyTrips: Trip[] = []; // Unfiltered list for client-side filtering

  // Loading states
  isLoadingAvailable: boolean = false;
  isLoadingHistory: boolean = false;
  
  // History filters
  historyFilters = {
    dateType: 'all' as 'all' | 'today' | 'week' | 'month' | 'custom',
    dateFrom: '',
    dateTo: '',
    status: 'all' as 'all' | TransferStatus,
    location: '',
    showFilters: false
  };
  
  // Available transfer statuses for filtering
  transferStatuses: TransferStatus[] = [
    'تم النقل',
    'ميداني',
    'بلاغ كاذب',
    'لم يتم النقل',
    'رفض النقل',
    'صيانة',
    'ينقل',
    'اخرى'
  ];
  
  // Pagination for history
  currentPage: number = 1;
  itemsPerPage: number = 10;
  
  // IDs
  vehicleId: string = '';
  driverId: string = '';  // Driver record ID (from drivers table)
  userId: string = '';    // User ID (from users table)
  
  // Auto-refresh
  private refreshInterval: any = null;
  
  // Modal states
  showCloseConfirmModal: boolean = false;
  showMedicalFormWarningModal: boolean = false;
  selectedTripForClose: Trip | null = null;
  medicalFormCompletionPercentage: number = 0;
  isMedicalFormComplete: boolean = false;

  constructor(
    private tripService: TripService,
    private authService: AuthService,
    private driverService: DriverService,
    private toastService: ToastService,
    private vehicleCookieService: VehicleCookieService,
    private medicalFormService: MedicalFormService,
    private router: Router
  ) {
    const currentUser = this.authService.currentUser();
    this.userId = currentUser?.id || '';
    this.vehicleId = this.vehicleCookieService.getSelectedVehicleId() || '';
  }

  ngOnInit(): void {
    if (!this.vehicleId) {
      this.toastService.error('لم يتم تحديد مركبة. يرجى تحديد مركبة أولاً.');
      this.router.navigate(['/select-vehicle']);
      return;
    }
    
    // Get driver record ID from current user
    this.driverService.getCurrentDriver().subscribe({
      next: (driver) => {
        this.driverId = driver.id;
        this.loadData();
        this.startAutoRefresh();
      },
      error: (error) => {
        console.error('Failed to get driver record:', error);
        this.toastService.error('فشل تحميل بيانات السائق');
      }
    });
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadData(): void {
    this.loadAvailableTrips();
    this.loadMyTrips();
  }

  startAutoRefresh(): void {
    // Refresh available trips every 30 seconds
    this.refreshInterval = setInterval(() => {
      if (this.selectedTab === 'available') {
        this.loadAvailableTrips();
      }
    }, 30000);
  }

  switchTab(tab: 'available' | 'mytrips'): void {
    this.selectedTab = tab;

    // Load data if not already loaded
    if (tab === 'available' && this.availableTrips.length === 0) {
      this.loadAvailableTrips();
    } else if (tab === 'mytrips' && this.myTrips.length === 0) {
      this.loadMyTrips();
    }
  }

  toggleHistoryView(): void {
    this.historyView = this.historyView === 'vehicle' ? 'driver' : 'vehicle';
    this.loadMyTrips();
  }

  loadAvailableTrips(): void {
    this.isLoadingAvailable = true;
    this.tripService.getAvailableTrips(this.vehicleId).subscribe({
      next: (trips) => {
        this.availableTrips = trips;
        this.isLoadingAvailable = false;
      },
      error: (error) => {
        console.error('Failed to load available trips:', error);
        this.toastService.error('فشل تحميل الرحلات المتاحة');
        this.isLoadingAvailable = false;
      }
    });
  }

  loadMyTrips(): void {
    this.isLoadingHistory = true;
    this.currentPage = 1; // Reset to first page
    const observable = this.historyView === 'vehicle'
      ? this.tripService.getVehicleTrips(this.vehicleId)
      : this.tripService.getDriverTrips(this.driverId);

    observable.subscribe({
      next: (trips) => {
        this.allMyTrips = trips;
        this.applyHistoryFilters();
        this.isLoadingHistory = false;
      },
      error: (error) => {
        console.error('Failed to load trips:', error);
        this.toastService.error('فشل تحميل الرحلات');
        this.isLoadingHistory = false;
      }
    });
  }

  applyHistoryFilters(): void {
    let filtered = [...this.allMyTrips];
    
    // Filter by status
    if (this.historyFilters.status !== 'all') {
      filtered = filtered.filter(trip => trip.transferStatus === this.historyFilters.status);
    }
    
    // Filter by location (transferTo)
    if (this.historyFilters.location.trim()) {
      const searchTerm = this.historyFilters.location.toLowerCase();
      filtered = filtered.filter(trip => 
        trip.transferTo?.toLowerCase().includes(searchTerm) ||
        trip.transferFrom?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filter by date
    if (this.historyFilters.dateType !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(trip => {
        const tripDate = new Date(trip.year, trip.month - 1, trip.day);
        tripDate.setHours(0, 0, 0, 0);
        
        switch (this.historyFilters.dateType) {
          case 'today':
            return tripDate.getTime() === today.getTime();
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            return tripDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(today.getMonth() - 1);
            return tripDate >= monthAgo;
          case 'custom':
            if (this.historyFilters.dateFrom && this.historyFilters.dateTo) {
              const from = new Date(this.historyFilters.dateFrom);
              from.setHours(0, 0, 0, 0);
              const to = new Date(this.historyFilters.dateTo);
              to.setHours(23, 59, 59, 999);
              return tripDate >= from && tripDate <= to;
            }
            return true;
          default:
            return true;
        }
      });
    }

    // Sort: Unclosed trips first, then closed trips (both newest first)
    filtered.sort((a, b) => {
      // First sort by closed status (unclosed first)
      if (a.isClosed !== b.isClosed) {
        return a.isClosed ? 1 : -1;
      }
      // Then sort by date (newest first)
      const dateA = new Date(a.year, a.month - 1, a.day).getTime();
      const dateB = new Date(b.year, b.month - 1, b.day).getTime();
      return dateB - dateA;
    });

    this.myTrips = filtered;
    this.currentPage = 1; // Reset to first page after filtering
  }

  resetHistoryFilters(): void {
    this.historyFilters = {
      dateType: 'all',
      dateFrom: '',
      dateTo: '',
      status: 'all',
      location: '',
      showFilters: false
    };
    this.applyHistoryFilters();
  }

  toggleHistoryFilters(): void {
    this.historyFilters.showFilters = !this.historyFilters.showFilters;
  }

  getPaginatedHistory(): Trip[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.myTrips.slice(startIndex, endIndex);
  }

  get totalHistoryPages(): number {
    return Math.ceil(this.myTrips.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalHistoryPages) {
      this.currentPage = page;
    }
  }

  getStatusColor(status: TransferStatus): string {
    const statusColors: { [key: string]: string } = {
      'تم النقل': '#28A745',
      'ميداني': '#17A2B8',
      'ينقل': '#FFC107',
      'بلاغ كاذب': '#DC3545',
      'لم يتم النقل': '#DC3545',
      'صيانة': '#6C757D',
      'رفض النقل': '#DC3545',
      'اخرى': '#6C757D'
    };
    return statusColors[status] || '#6C757D';
  }

  getFormattedDate(day: number, month: number, year: number): string {
    return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
  }

  acceptTrip(trip: Trip): void {
    if (!this.driverId) {
      this.toastService.error('معرّف السائق غير موجود');
      return;
    }

    this.tripService.acceptTrip(trip.id, this.driverId).subscribe({
      next: () => {
        this.toastService.success(`تم قبول الرحلة للمريض ${trip.patientName}`);
        this.loadAvailableTrips();
        this.loadMyTrips();
      },
      error: (error) => {
        console.error('Failed to accept trip:', error);
        this.toastService.error(error.message || 'فشل قبول الرحلة');
      }
    });
  }

  createNewTrip(): void {
    this.router.navigate(['/user/trip-form'], {
      queryParams: { vehicleId: this.vehicleId, mode: 'create' }
    });
  }

  editTrip(trip: Trip): void {
    if (trip.isClosed) {
      this.toastService.error('لا يمكن تعديل رحلة مغلقة');
      return;
    }
    this.router.navigate(['/user/trip-form', trip.id], {
      queryParams: { mode: 'edit' }
    });
  }

  viewTripDetails(trip: Trip): void {
    this.router.navigate(['/user/trip-form', trip.id], {
      queryParams: { mode: 'view' }
    });
  }

  openMedicalForm(trip: Trip): void {
    this.router.navigate(['/user/medical-form', trip.id]);
  }

  openCloseConfirmModal(trip: Trip): void {
    this.selectedTripForClose = trip;

    // Check if medical form is complete before showing close modal
    this.medicalFormService.getCompletionStatus(trip.id).subscribe({
      next: (status) => {
        this.isMedicalFormComplete = status.isComplete;
        this.medicalFormCompletionPercentage = status.percentage;

        if (!status.isComplete) {
          // Show medical form warning modal
          this.showMedicalFormWarningModal = true;
        } else {
          // Show regular close confirmation modal
          this.showCloseConfirmModal = true;
        }
      },
      error: (error) => {
        console.error('Failed to check medical form status:', error);
        // If error, just show close modal (form might not exist yet)
        this.showCloseConfirmModal = true;
      }
    });
  }

  closeConfirmModal(): void {
    this.showCloseConfirmModal = false;
    this.selectedTripForClose = null;
  }

  closeMedicalFormWarningModal(): void {
    this.showMedicalFormWarningModal = false;
    this.selectedTripForClose = null;
    this.medicalFormCompletionPercentage = 0;
    this.isMedicalFormComplete = false;
  }

  fillMedicalFormNow(): void {
    if (!this.selectedTripForClose) return;
    this.closeMedicalFormWarningModal();
    this.openMedicalForm(this.selectedTripForClose);
  }

  skipAndCloseTrip(): void {
    if (!this.selectedTripForClose) return;

    const tripId = this.selectedTripForClose.id;
    const patientName = this.selectedTripForClose.patientName;

    this.tripService.closeTrip(tripId).subscribe({
      next: () => {
        this.toastService.success(`تم إغلاق الرحلة للمريض ${patientName}`);
        this.closeMedicalFormWarningModal();
        this.loadMyTrips();
      },
      error: (error) => {
        console.error('Failed to close trip:', error);
        this.toastService.error(error.message || 'فشل إغلاق الرحلة');
        this.closeMedicalFormWarningModal();
      }
    });
  }

  confirmCloseTrip(): void {
    if (!this.selectedTripForClose) return;

    const tripId = this.selectedTripForClose.id;
    const patientName = this.selectedTripForClose.patientName;

    this.tripService.closeTrip(tripId).subscribe({
      next: () => {
        this.toastService.success(`تم إغلاق الرحلة للمريض ${patientName}`);
        this.closeConfirmModal();
        this.loadMyTrips();
      },
      error: (error) => {
        console.error('Failed to close trip:', error);
        this.toastService.error(error.message || 'فشل إغلاق الرحلة');
        this.closeConfirmModal();
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'تم النقل': 'bg-success',
      'ميداني': 'bg-primary',
      'ينقل': 'bg-info',
      'بلاغ كاذب': 'bg-warning',
      'لم يتم النقل': 'bg-danger',
      'صيانة': 'bg-secondary',
      'رفض النقل': 'bg-dark',
      'اخرى': 'bg-secondary'
    };
    return statusClasses[status] || 'bg-secondary';
  }

  canCloseTrip(trip: Trip): boolean {
    // Can close if not already closed (allow closing at any status)
    return !trip.isClosed;
  }

  formatDate(trip: Trip): string {
    return `${trip.day}/${trip.month}/${trip.year}`;
  }

  formatDistance(trip: Trip): number {
    return trip.end - trip.start;
  }
}

