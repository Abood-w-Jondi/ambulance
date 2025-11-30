import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TripService } from '../../shared/services/trip.service';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { VehicleCookieService } from '../../shared/services/vehicle-cookie.service';
import { Trip, TransferStatus, FilterStatus } from '../../shared/models';

@Component({
  selector: 'app-trips-history',
  imports: [FormsModule, CommonModule],
  templateUrl: './trips-history.component.html',
  styleUrls: ['./trips-history.component.css']
})
export class TripsHistoryComponent implements OnInit {
  trips: Trip[] = [];
  filteredTrips: Trip[] = [];
  selectedStatus: FilterStatus = 'All';
  searchTerm: string = '';
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  
  // History view toggle
  historyView: 'vehicle' | 'driver' = 'vehicle';
  
  // IDs
  vehicleId: string = '';
  driverId: string = '';
  
  // Loading state
  isLoading: boolean = false;
  
  // Statistics
  totalTrips: number = 0;
  totalEarnings: number = 0;
  completedTrips: number = 0;
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  transferStatuses: TransferStatus[] = [
    'ميداني',
    'تم النقل',
    'بلاغ كاذب',
    'ينقل',
    'لم يتم النقل',
    'صيانة',
    'رفض النقل',
    'اخرى'
  ];

  months = [
    { value: 1, name: 'يناير' },
    { value: 2, name: 'فبراير' },
    { value: 3, name: 'مارس' },
    { value: 4, name: 'أبريل' },
    { value: 5, name: 'مايو' },
    { value: 6, name: 'يونيو' },
    { value: 7, name: 'يوليو' },
    { value: 8, name: 'أغسطس' },
    { value: 9, name: 'سبتمبر' },
    { value: 10, name: 'أكتوبر' },
    { value: 11, name: 'نوفمبر' },
    { value: 12, name: 'ديسمبر' }
  ];

  years: number[] = [];

  constructor(
    private tripService: TripService,
    private authService: AuthService,
    private toastService: ToastService,
    private vehicleCookieService: VehicleCookieService,
    private router: Router
  ) {
    const currentUser = this.authService.currentUser();
    this.driverId = currentUser?.id || '';
    this.vehicleId = this.vehicleCookieService.getSelectedVehicleId() || '';
  }

  ngOnInit(): void {
    this.generateYears();
    this.loadTrips();
  }

  generateYears(): void {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 5; i--) {
      this.years.push(i);
    }
  }

  toggleHistoryView(): void {
    this.historyView = this.historyView === 'vehicle' ? 'driver' : 'vehicle';
    this.loadTrips();
  }

  loadTrips(): void {
    this.isLoading = true;
    
    const observable = this.historyView === 'vehicle'
      ? this.tripService.getVehicleHistoricalTrips(this.vehicleId)
      : this.tripService.getDriverHistoricalTrips(this.driverId);
    
    observable.subscribe({
      next: (trips) => {
        this.trips = trips;
        this.applyFilters();
        this.calculateStatistics();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load trips:', error);
        this.toastService.error('فشل تحميل الرحلات السابقة');
        this.isLoading = false;
      }
    });
  }

  viewTripDetails(trip: Trip): void {
    this.router.navigate(['/user/trip-form', trip.id], {
      queryParams: { mode: 'view' }
    });
  }

  applyFilters(): void {
    this.filteredTrips = this.trips.filter(trip => {
      const statusMatch = this.selectedStatus === 'All' || trip.transferStatus === this.selectedStatus;
      const monthMatch = trip.month === this.selectedMonth;
      const yearMatch = trip.year === this.selectedYear;
      const searchMatch = this.searchTerm === '' || 
        trip.patientName.includes(this.searchTerm) ||
        trip.transferFrom.includes(this.searchTerm) ||
        trip.transferTo.includes(this.searchTerm);
      
      return statusMatch && monthMatch && yearMatch && searchMatch;
    });

    this.totalPages = Math.ceil(this.filteredTrips.length / this.itemsPerPage);
    this.currentPage = 1;
  }

  calculateStatistics(): void {
    this.totalTrips = this.filteredTrips.length;
    this.completedTrips = this.filteredTrips.filter(t => t.transferStatus === 'تم النقل').length;
    this.totalEarnings = this.filteredTrips.reduce((sum, trip) => sum + (trip.driverShare || 0), 0);
  }

  getPaginatedTrips(): Trip[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredTrips.slice(startIndex, endIndex);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }

  getStatusBadgeClass(status: TransferStatus): string {
    const statusClasses: { [key in TransferStatus]: string } = {
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

  getStatusColor(status: TransferStatus): string {
    const statusColors: { [key in TransferStatus]: string } = {
      'تم النقل': '#28A745',
      'ميداني': '#007BFF',
      'ينقل': '#17A2B8',
      'بلاغ كاذب': '#FFC107',
      'لم يتم النقل': '#DC3545',
      'صيانة': '#6C757D',
      'رفض النقل': '#343A40',
      'اخرى': '#6C757D'
    };
    return statusColors[status] || '#6C757D';
  }

  formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  formatDate(day: number, month: number, year: number): string {
    return `${day}/${month}/${year}`;
  }

  formatDistance(trip: Trip): number {
    return trip.end - trip.start;
  }
}