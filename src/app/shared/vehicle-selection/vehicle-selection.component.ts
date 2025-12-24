import { Component, signal, computed, OnInit, ChangeDetectionStrategy, Inject, PLATFORM_ID } from '@angular/core'; // Added Inject, PLATFORM_ID
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VehicleService } from '../services/vehicle.service';
import { Vehicle } from '../models/vehicle.model';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';
import { VehicleCookieService } from '../services/vehicle-cookie.service';

@Component({
  selector: 'app-vehicle-selection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle-selection.component.html',
  styleUrls: ['./vehicle-selection.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehicleSelectionComponent implements OnInit {
  vehicles = signal<Vehicle[]>([]);
  isLoading = signal(false);
  searchTerm = signal('');
  selectedVehicleId = signal<string | null>(null);

  // Show skip button if user is not authenticated OR is admin
  canSkip = computed(() => !this.authService.isAuthenticated() || this.authService.isAdmin());

  // Pagination
  currentPage = signal(1);
  itemsPerPage = 10;

  // Make Math available in template
  Math = Math;

  filteredVehicles = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.vehicles();
    return this.vehicles().filter(v =>
      v.vehicleId.toLowerCase().includes(term) ||
      v.vehicleName.toLowerCase().includes(term)
    );
  });

  // Paginated vehicles
  paginatedVehicles = computed(() => {
    const filtered = this.filteredVehicles();
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return filtered.slice(start, end);
  });

  // Total pages
  totalPages = computed(() => {
    return Math.ceil(this.filteredVehicles().length / this.itemsPerPage);
  });

  // Has previous page
  hasPreviousPage = computed(() => {
    return this.currentPage() > 1;
  });

  // Has next page
  hasNextPage = computed(() => {
    return this.currentPage() < this.totalPages();
  });
  isBrowser: boolean;
  constructor(
    private vehicleService: VehicleService,
    private router: Router,
    private toastService: ToastService,
    public authService: AuthService,
    private vehicleCookieService: VehicleCookieService,
    @Inject(PLATFORM_ID) platformId: Object // Add this
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.isLoading.set(true);
    this.vehicleService.getVehicles({}).subscribe({
      next: (response) => {
        this.vehicles.set(response.data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading vehicles:', error);
        this.toastService.error('فشل تحميل قائمة المركبات');
        this.isLoading.set(false);
      }
    });
  }

  selectVehicle(vehicleId: string): void {
    this.selectedVehicleId.set(vehicleId);
  }

  onSearchChange(): void {
    // Reset to first page when search changes
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  previousPage(): void {
    if (this.hasPreviousPage()) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.hasNextPage()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  confirmSelection(): void {
  const vehicleId = this.selectedVehicleId();
  if (!vehicleId) {
    this.toastService.error('الرجاء اختيار مركبة');
    return;
  }

  // CHANGE THIS: Use the service we already protected!
  this.vehicleCookieService.setSelectedVehicleId(vehicleId); 

  const vehicle = this.vehicles().find(v => v.id === vehicleId);
  if (vehicle) {
    this.toastService.success(`تم اختيار المركبة: ${vehicle.vehicleName}`);
  }

  this.router.navigate(['/login']);
}

  skipSelection(): void {
    // Mark as skipped in cookie
    this.vehicleCookieService.setSkipSelection();

    // If not authenticated, go to login
    if (!this.authService.isAuthenticated()) {
      this.toastService.success('جاري الانتقال إلى صفحة تسجيل الدخول');
      this.router.navigate(['/login']);
      return;
    }

    // If authenticated as admin, go to admin dashboard
    if (this.authService.isAdmin()) {
      this.toastService.success('تم تخطي اختيار المركبة - وضع المدير');
      this.router.navigate(['/admin/admin-dashboard']);
      return;
    }

    // Non-admin authenticated users cannot skip
    this.toastService.error('غير مصرح لك بتخطي اختيار المركبة');
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'متاحة':
        return 'text-bg-success';
      case 'في الخدمة':
        return 'text-bg-info';
      case 'صيانة':
        return 'text-bg-warning';
      default:
        return 'text-bg-secondary';
    }
  }
}
