import { Component, signal, ChangeDetectionStrategy, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GlobalVarsService } from '../../global-vars.service';
import { ToastService } from '../../shared/services/toast.service';
import { ValidationService } from '../../shared/services/validation.service';
import { MaintenanceService } from '../../shared/services/maintenance.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { MAINTENANCE_STATUS } from '../../shared/constants/status.constants';
import { MaintenanceRecord, MaintenanceStatus } from '../../shared/models';
import { VehicleService } from '../../shared/services/vehicle.service';
import { Vehicle } from '../../shared/models/vehicle.model';
@Component({
    selector: 'app-maintenance-history',
    standalone: true,
    imports: [CommonModule, FormsModule, PaginationComponent, StatusBadgeComponent],
    templateUrl: './maintenance-history.component.html',
    styleUrl: './maintenance-history.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenanceHistoryComponent implements OnInit {
    // --- State Initialization (Signals) ---
    searchTerm = signal('');
    maintenanceTypeFilter = signal('');
    startDay: number = 1;
    startMonth: number = 1;
    startYear: number = 2020;
    endDay: number = new Date().getDate();
    endMonth: number = new Date().getMonth() + 1;
    endYear: number = new Date().getFullYear() + 10;
    selectedVehicle: string = 'جميع المركبات';
    selectedMaintenanceType: string = 'جميع الأنواع';
    
    // Filters for computation
    dateFilterFrom = signal<Date | null>(null);
    dateFilterTo = signal<Date | null>(null);
    vehicleFilter = signal<string>('جميع المركبات');
    serviceLocationFilter = signal<string>('');
    
    // Modal Control
    isAddRecordModalOpen = signal(false);
    isViewRecordModalOpen = signal(false);
    isEditRecordModalOpen = signal(false);
    selectedRecord = signal<MaintenanceRecord | null>(null);
    
    // Form values for new/edit record
    recordForm = {
        day: 1,
        month: 1,
        year: new Date().getFullYear(),
        vehicleId: '',
        type: '',
        cost: 0,
        serviceLocation: '',
        odometerBefore: 0,
        odometerAfter: 0,
        notes: '',
        status: 'مجدولة' as MaintenanceStatus
    };

    vehiclesList: Vehicle[] = [];
    vehicleSearchTerm = signal('');
    filteredVehicles = computed(() => {
        const term = this.vehicleSearchTerm().toLowerCase();
        if (!term) return this.vehiclesList;
        return this.vehiclesList.filter(v =>
            v.vehicleName.toLowerCase().includes(term) ||
            v.vehicleId.toLowerCase().includes(term)
        );
    });
    // Maintenance types will come from database/API in the future
    maintenanceTypes: string[] = [
        'تغيير الزيت',
        'تدوير الإطارات',
        'خدمة الفرامل',
        'إصلاح المحرك',
        'فحص دوري',
        'صيانة كهربائية',
        'صيانة نظام التبريد',
        'استبدال البطارية',
        'أخرى'
    ];
    maintenanceStatuses: MaintenanceStatus[] = ['مكتملة', 'مجدولة', 'قيد التنفيذ'];

    // Pagination
    currentPage = 1;
    itemsPerPage = 10;
    totalRecords = 0;
    isLoading = signal(false);

    private searchDebounceTimer: any = null;

    constructor(
        private globalVars: GlobalVarsService,
        private toastService: ToastService,
        private validationService: ValidationService,
        private maintenanceService: MaintenanceService,
        private vehicleService: VehicleService,
        private router: Router
    ) {
        this.globalVars.setGlobalHeader('سجل الصيانة');

        // Watch search term changes and trigger search with debounce
        effect(() => {
            this.searchTerm(); // Track dependency

            if (this.searchDebounceTimer) {
                clearTimeout(this.searchDebounceTimer);
            }

            this.searchDebounceTimer = setTimeout(() => {
                this.currentPage = 1;
                this.loadData();
            }, 500);
        });
    }

    ngOnInit(): void {
        this.loadVehicles();
        this.loadData();
    }
    
    records = signal<MaintenanceRecord[]>([]);

    loadVehicles(): void {
        // Load all vehicles with a high limit for the dropdown
        this.vehicleService.getVehicles({ limit: 1000 }).subscribe({
            next: (res) => {
                this.vehiclesList = res.data;
            },
            error: (error) => {
                console.error('Error loading vehicles:', error);
                this.toastService.error('فشل تحميل المركبات');
            }
        });
    }

    loadData(): void {
        this.isLoading.set(true);

        const params: any = {
            page: this.currentPage,
            limit: this.itemsPerPage,
            vehicleInternalId: this.vehicleFilter() !== 'جميع المركبات' ? this.vehicleFilter() : undefined,
        };

        const fromDate = this.dateFilterFrom();
        const toDate = this.dateFilterTo();
        if (fromDate && toDate) {
            params.startDate = fromDate.toISOString().split('T')[0];
            params.endDate = toDate.toISOString().split('T')[0];
        }

        // Add maintenance type filter
        if (this.maintenanceTypeFilter() && this.maintenanceTypeFilter() !== 'جميع الأنواع') {
            params.maintenanceType = this.maintenanceTypeFilter();
        }

        // Add search parameter
        if (this.searchTerm().trim()) {
            params.search = this.searchTerm().trim();
        }

        this.maintenanceService.getMaintenanceRecords(params).subscribe({
            next: (response) => {
                this.records.set(response.data);
                this.totalRecords = response.total;
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading maintenance records:', error);
                this.toastService.error('فشل تحميل سجلات الصيانة');
                this.isLoading.set(false);
            }
        });
    }

    // --- Pagination Methods ---
    getPaginatedMaintenanceRecords() {
        return this.records();
    }

    onPageChange(page: number): void {
        this.currentPage = page;
        this.loadData();
    }

    onItemsPerPageChange(itemsPerPage: number): void {
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1;
        this.loadData();
    }

    // --- Component Methods ---

    applyFilters(): void {
        const fromDate = new Date(this.startYear, this.startMonth - 1, this.startDay);
        const toDate = new Date(this.endYear, this.endMonth - 1, this.endDay);

        this.dateFilterFrom.set(fromDate);
        this.dateFilterTo.set(toDate);
        this.vehicleFilter.set(this.selectedVehicle);
        this.maintenanceTypeFilter.set(this.selectedMaintenanceType);
        this.currentPage = 1;
        this.loadData();
    }

    clearFilters(): void {
        this.startDay = 1;
        this.startMonth = 1;
        this.startYear = new Date().getFullYear();
        this.endDay = 31;
        this.endMonth = 12;
        this.endYear = new Date().getFullYear();
        this.selectedVehicle = 'جميع المركبات';
        this.selectedMaintenanceType = 'جميع الأنواع';
        this.searchTerm.set('');

        this.dateFilterFrom.set(null);
        this.dateFilterTo.set(null);
        this.vehicleFilter.set('جميع المركبات');
        this.serviceLocationFilter.set('');
        this.maintenanceTypeFilter.set('');
        this.currentPage = 1;
        this.loadData();
    }

    getStatusColor(status: MaintenanceStatus): string {
        switch (status) {
            case 'مكتملة':
                return '#34C759';
            case 'مجدولة':
                return '#007AFF';
            case 'قيد التنفيذ':
                return '#FF9500';
            default:
                return '#6C757D';
        }
    }

    getStatusBadgeClass(status: MaintenanceStatus): string {
        switch (status) {
            case 'مكتملة':
                return 'text-bg-success';
            case 'مجدولة':
                return 'text-bg-primary';
            case 'قيد التنفيذ':
                return 'text-bg-warning';
            default:
                return 'text-bg-secondary';
        }
    }

    getStatusIcon(status: MaintenanceStatus): string {
        switch (status) {
            case 'مكتملة':
                return 'fa-circle-check';
            case 'مجدولة':
                return 'fa-calendar-check';
            case 'قيد التنفيذ':
                return 'fa-hourglass-half';
            default:
                return 'fa-circle';
        }
    }

    // 🛠️ AFTER: Robust null/invalid date check
formatDate(date: Date | string | null | undefined): string {
    // 1. Check if the input is truthy (not null, undefined, or empty string)
    if (!date) {
        return '---'; // Placeholder for missing date
    }
    
    let dateObject: Date;

    // 2. If it's a string, convert it to Date (if Step 1 didn't catch it, this is a fallback)
    if (typeof date === 'string') {
        dateObject = new Date(date);
    } else if (date instanceof Date) {
        dateObject = date;
    } else {
        return 'تاريخ غير صالح'; // Catch unexpected types
    }

    // 3. Check if the resulting Date object is valid
    if (isNaN(dateObject.getTime())) {
        return 'تاريخ غير صالح';
    }

    // 4. Return the formatted date string
    return dateObject.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
}

    openAddRecordModal(): void {
        this.recordForm = {
            day: 1,
            month: 1,
            year: new Date().getFullYear(),
            vehicleId: '',
            type: '',
            cost: 0,
            serviceLocation: '',
            odometerBefore: 0,
            odometerAfter: 0,
            notes: '',
            status: 'مجدولة'
        };
        this.isAddRecordModalOpen.set(true);
    }

    addRecord(): void {
        let date : any= new Date(this.recordForm.year, this.recordForm.month - 1, this.recordForm.day)
        date = date.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
       console.log('Adding record with date:', date);
        const validationData = {
            ambulanceId: this.recordForm.vehicleId,
            type: this.recordForm.type,
            description: this.recordForm.notes,
            cost: this.recordForm.cost,
            date: date
        };

        const validationResult = this.validationService.validateMaintenanceRecord(validationData);

        if (!validationResult.valid) {
            // Show validation errors
            validationResult.errors.forEach(error => {
                this.toastService.error(error);
            });
            return;
        }

        this.maintenanceService.createMaintenanceRecord({
            vehicleId: this.recordForm.vehicleId,
            date: date,
            type: this.recordForm.type,
            cost: this.recordForm.cost,
            serviceLocation: this.recordForm.serviceLocation,
            odometerBefore: this.recordForm.odometerBefore,
            odometerAfter: this.recordForm.odometerAfter,
            notes: this.recordForm.notes,
            status: this.recordForm.status
        }).subscribe({
            next: () => {
                this.isAddRecordModalOpen.set(false);
                this.toastService.success('تم إضافة سجل الصيانة بنجاح');
                this.loadData();
            },
            error: (error) => {
                console.error('Error creating maintenance record:', error);
                this.toastService.error('فشلت عملية إضافة سجل الصيانة');
            }
        });
    }

    openEditRecordModal(): void {
        const record = this.selectedRecord();
        if (record) {
            this.recordForm = {
                day: record.date.getDate(),
                month: record.date.getMonth() + 1,
                year: record.date.getFullYear(),
                vehicleId: record.vehicleId,
                type: record.type,
                cost: record.cost,
                serviceLocation: record.serviceLocation,
                odometerBefore: record.odometerBefore,
                odometerAfter: record.odometerAfter,
                notes: record.notes,
                status: record.status
            };
            this.isViewRecordModalOpen.set(false);
            this.isEditRecordModalOpen.set(true);
        }
    }

    saveEditRecord(): void {
        const record = this.selectedRecord();
        if (record) {
            // Validate the maintenance record
            const validationData = {
                ambulanceId: this.recordForm.vehicleId,
                type: this.recordForm.type,
                description: this.recordForm.notes,
                cost: this.recordForm.cost,
                date: new Date(this.recordForm.year, this.recordForm.month - 1, this.recordForm.day)
            };

            const validationResult = this.validationService.validateMaintenanceRecord(validationData);

            if (!validationResult.valid) {
                // Show validation errors
                validationResult.errors.forEach(error => {
                    this.toastService.error(error);
                });
                return;
            }

            this.maintenanceService.updateMaintenanceRecord(record.id, {
                vehicleId: this.recordForm.vehicleId,
                date: new Date(this.recordForm.year, this.recordForm.month - 1, this.recordForm.day),
                type: this.recordForm.type,
                cost: this.recordForm.cost,
                serviceLocation: this.recordForm.serviceLocation,
                odometerBefore: this.recordForm.odometerBefore,
                odometerAfter: this.recordForm.odometerAfter,
                notes: this.recordForm.notes,
                status: this.recordForm.status
            }).subscribe({
                next: (updatedRecord) => {
                    this.selectedRecord.set(updatedRecord);
                    this.isEditRecordModalOpen.set(false);
                    this.isViewRecordModalOpen.set(true);
                    this.toastService.success('تم تحديث سجل الصيانة بنجاح');
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error updating maintenance record:', error);
                    this.toastService.error('فشلت عملية تحديث سجل الصيانة');
                }
            });
        }
    }

    viewRecordDetails(record: MaintenanceRecord): void {
        this.selectedRecord.set(record);
        this.isViewRecordModalOpen.set(true);
    }

    closeViewRecordModal(): void {
        this.isViewRecordModalOpen.set(false);
        this.selectedRecord.set(null);
    }

    closeEditRecordModal(): void {
        this.isEditRecordModalOpen.set(false);
    }

    deleteRecord(recordId: string): void {
        if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
            this.maintenanceService.deleteMaintenanceRecord(recordId).subscribe({
                next: () => {
                    this.closeViewRecordModal();
                    this.toastService.success('تم حذف سجل الصيانة بنجاح');
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error deleting maintenance record:', error);
                    this.toastService.error('فشلت عملية حذف سجل الصيانة');
                }
            });
        }
    }

    getDaysInMonth(month: number, year: number): number[] {
        const days = new Date(year, month, 0).getDate();
        return Array.from({ length: days }, (_, i) => i + 1);
    }

    getMonths(): number[] {
        return Array.from({ length: 12 }, (_, i) => i + 1);
    }

    getYears(): number[] {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 10 }, (_, i) => currentYear - i);
    }

    /**
     * Navigate to fleet page filtered by vehicle
     */
    navigateToFleet(vehicleInternalId?: string): void {
        if (vehicleInternalId) {
            this.router.navigate(['admin/vehicles'], {
                queryParams: {
                    filterType: 'id',
                    filterValue: vehicleInternalId
                }
            });
        }
    }

    /**
     * Filter by clicking on vehicle name
     */
    filterByVehicle(vehicleId: string, event?: Event): void {
        if (event) {
            event.stopPropagation();
        }
        this.selectedVehicle = vehicleId;
        this.vehicleFilter.set(vehicleId);
        this.currentPage = 1;
        this.loadData();
    }

    /**
     * Filter by clicking on maintenance type
     */
    filterByMaintenanceType(type: string, event?: Event): void {
        if (event) {
            event.stopPropagation();
        }
        this.selectedMaintenanceType = type;
        this.maintenanceTypeFilter.set(type);
        this.currentPage = 1;
        this.loadData();
    }

    /**
     * Filter by clicking on service location
     */
    filterByServiceLocation(location: string, event?: Event): void {
        if (event) {
            event.stopPropagation();
        }
        this.searchTerm.set(location);
    }
}