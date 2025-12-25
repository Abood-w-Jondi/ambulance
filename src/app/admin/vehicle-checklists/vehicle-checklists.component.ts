import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChecklistService } from '../../shared/services/checklist.service';
import { VehicleService } from '../../shared/services/vehicle.service';
import { DriverService } from '../../shared/services/driver.service';
import { ToastService } from '../../shared/services/toast.service';
import { VehicleChecklist, ChecklistItem } from '../../shared/models/checklist.model';

@Component({
  selector: 'app-vehicle-checklists',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle-checklists.component.html',
  styleUrl: './vehicle-checklists.component.css'
})
export class VehicleChecklistsComponent implements OnInit {
  checklists = signal<VehicleChecklist[]>([]);
  loading = signal(false);
  itemsFilter: 'all' | 'available' | 'unavailable' = 'all';

  // Pagination
  currentPage = 1;
  limit = 20;
  total = 0;
  totalPages = 0;
  Math = Math;

  // Filters
  filters = {
    startDate: this.getDateDaysAgo(30),
    endDate: this.getDateTomorrow(), // get date tomorrow to include today
    vehicleId: '',
    driverId: '',
    completionStatus: 'all' as 'completed' | 'pending' | 'all'
  };
  getDateTomorrow(): string {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  }

  // For dropdowns
  vehicles = signal<any[]>([]);
  drivers = signal<any[]>([]);

  // Detail modal
  selectedChecklist = signal<VehicleChecklist | null>(null);
  showDetailModal = signal(false);

  constructor(
    private checklistService: ChecklistService,
    private vehicleService: VehicleService,
    private driverService: DriverService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadVehicles();
    this.loadDrivers();
    this.loadChecklists();
  }

  loadVehicles(): void {
    this.vehicleService.getVehicles({}).subscribe({
      next: (response) => {
        this.vehicles.set(response.data);
      },
      error: (err) => {
        console.error('Failed to load vehicles:', err);
      }
    });
  }

  getFilteredItems(): ChecklistItem[] {
    const checklist = this.selectedChecklist();
    if (!checklist) {
      return [];
    }

    const items = checklist.items || [];

    switch (this.itemsFilter) {
      case 'available':
        return items.filter(item => item.isAvailable === true);
      case 'unavailable':
        return items.filter(item => item.isAvailable === false);
      case 'all':
      default:
        return items;
    }
  }

  loadDrivers(): void {
    this.driverService.getDrivers({}).subscribe({
      next: (response) => {
        this.drivers.set(response.data);
      },
      error: (err) => {
        console.error('Failed to load drivers:', err);
      }
    });
  }

  loadChecklists(): void {
    this.loading.set(true);

    this.checklistService.getChecklists({
      ...this.filters,
      page: this.currentPage,
      limit: this.limit
    }).subscribe({
      next: (response) => {
        this.checklists.set(response.data);
        this.total = response.total;
        this.totalPages = response.totalPages;
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load checklists:', err);
        this.toastService.error('فشل تحميل قوائم الفحص');
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadChecklists();
  }

  resetFilters(): void {
    this.filters = {
      startDate: this.getDateDaysAgo(30),
      endDate: this.getTodayDate(),
      vehicleId: '',
      driverId: '',
      completionStatus: 'all'
    };
    this.currentPage = 1;
    this.loadChecklists();
  }

  viewDetails(checklistId: string): void {
    this.itemsFilter = 'all';
    this.checklistService.getChecklistById(checklistId).subscribe({
      next: (response:any) => {
        if (response.id) {
          this.selectedChecklist.set(response);
          this.showDetailModal.set(true);
        }
      },
      error: (err) => {
        console.error('Failed to load checklist details:', err);
        this.toastService.error('فشل تحميل تفاصيل الفحص');
      }
    });
  }

  closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.selectedChecklist.set(null);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadChecklists();
    }
  }

  getPaginationPages(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusBadgeClass(checklist: VehicleChecklist): string {
    if (checklist.unavailableItems === 0) {
      return 'bg-success';
    } else if (checklist.unavailableItems <= 5) {
      return 'bg-warning';
    } else {
      return 'bg-danger';
    }
  }

  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
