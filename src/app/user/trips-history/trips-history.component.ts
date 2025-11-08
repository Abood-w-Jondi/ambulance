import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

type TransferStatus = 'ميداني' | 'تم النقل' | 'بلاغ كاذب' | 'ينقل' | 'لم يتم النقل' | 'صيانة' | 'رفض النقل' | 'اخرى';
type FilterStatus = 'All' | TransferStatus;

interface Trip {
  id: string;
  day: number;
  month: number;
  year: number;
  driver: string;
  paramedic: string;
  transferFrom: string;
  transferTo: string;
  start: number;
  end: number;
  diesel: number;
  patientName: string;
  patientAge: number;
  ymdDay: number;
  ymdMonth: number;
  ymdYear: number;
  transferStatus: TransferStatus;
  diagnosis: string;
  totalAmount: number;
  paramedicShare: number;
  driverShare: number;
  eqShare: number;
}

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

  constructor() { }

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

  loadTrips(): void {
    // TODO: Load trips from service
    // Mock data for demonstration
    this.trips = this.generateMockTrips();
    this.applyFilters();
    this.calculateStatistics();
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
    this.totalEarnings = this.filteredTrips.reduce((sum, trip) => sum + trip.driverShare, 0);
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

  formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  formatDate(day: number, month: number, year: number): string {
    return `${day}/${month}/${year}`;
  }

  private generateMockTrips(): Trip[] {
    // Generate mock data
    const mockTrips: Trip[] = [];
    for (let i = 1; i <= 50; i++) {
      mockTrips.push({
        id: `trip_${i}`,
        day: Math.floor(Math.random() * 28) + 1,
        month: this.selectedMonth,
        year: this.selectedYear,
        driver: 'جون دو',
        paramedic: 'أحمد محمد',
        transferFrom: 'مستشفى الملك فيصل',
        transferTo: 'مستشفى الجامعة',
        start: Math.floor(Math.random() * 1440),
        end: Math.floor(Math.random() * 1440),
        diesel: Math.floor(Math.random() * 50) + 10,
        patientName: `مريض ${i}`,
        patientAge: Math.floor(Math.random() * 80) + 1,
        ymdDay: Math.floor(Math.random() * 28) + 1,
        ymdMonth: this.selectedMonth,
        ymdYear: this.selectedYear,
        transferStatus: this.transferStatuses[Math.floor(Math.random() * this.transferStatuses.length)],
        diagnosis: 'كسر في الساق',
        totalAmount: Math.floor(Math.random() * 500) + 100,
        paramedicShare: Math.floor(Math.random() * 100) + 50,
        driverShare: Math.floor(Math.random() * 100) + 50,
        eqShare: Math.floor(Math.random() * 100) + 50
      });
    }
    return mockTrips;
  }
}