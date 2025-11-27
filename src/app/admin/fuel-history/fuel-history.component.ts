import { Component, signal, ChangeDetectionStrategy, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GlobalVarsService } from '../../global-vars.service';
import { ToastService } from '../../shared/services/toast.service';
import { ValidationService } from '../../shared/services/validation.service';
import { FuelService } from '../../shared/services/fuel.service';
import { VehicleService } from '../../shared/services/vehicle.service';
import { DriverService } from '../../shared/services/driver.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { FuelRecord, Vehicle } from '../../shared/models';

@Component({
    selector: 'app-fuel-history',
    standalone: true,
    imports: [CommonModule, FormsModule, PaginationComponent],
    templateUrl: './fuel-history.component.html',
    styleUrl: './fuel-history.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FuelHistoryComponent implements OnInit {
    // --- State Initialization (Signals) ---
    searchTerm = signal('');
    startDay: number = 1;
    startMonth: number = 1;
    startYear: number = 2020;
    endDay: number = new Date().getDate();
    endMonth: number = new Date().getMonth() + 1;
    endYear: number = new Date().getFullYear();
    selectedVehicle: string = 'جميع المركبات';

    // Filters for computation
    dateFilterFrom = signal<Date | null>(null);
    dateFilterTo = signal<Date | null>(null);
    vehicleFilter = signal<string>('جميع المركبات');
    
    // Modal Control
    isAddRecordModalOpen = signal(false);
    isViewRecordModalOpen = signal(false);
    isEditRecordModalOpen = signal(false);
    selectedRecord = signal<FuelRecord | null>(null);
    
    // Form values for new/edit record
    recordForm = {
        day: 1,
        month: 1,
        year: new Date().getFullYear(),
        ambulanceName: '',
        ambulanceNumber: '',
        ambulanceId: '',          // Internal ID for backend
        driverId: '',
        driverName: '',
        driverInternalId: '',     // Internal ID for backend
        odometerBefore: 0,
        odometerAfter: 0,
        fuelAmount: 0,
        cost: 0,
        notes: ''
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

    driversList: any[] = [];
    driverSearchTerm = signal('');
    filteredDrivers = computed(() => {
        const term = this.driverSearchTerm().toLowerCase();
        if (!term) return this.driversList;
        return this.driversList.filter((d: any) =>
            d.arabicName?.toLowerCase().includes(term) ||
            d.name?.toLowerCase().includes(term)
        );
    });

    // Pagination
    currentPage = 1;
    itemsPerPage = 10;
    totalRecords = 0;
    isLoading = signal(false);

    private searchDebounceTimer: any = null;

    constructor(
        private globalVars: GlobalVarsService,
        private router: Router,
        private toastService: ToastService,
        private validationService: ValidationService,
        private fuelService: FuelService,
        private vehicleService: VehicleService,
        private driverService: DriverService
    ) {
        this.globalVars.setGlobalHeader('سجل الوقود');

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
        this.loadDrivers();
        this.loadData();
    }

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

    loadDrivers(): void {
        // Load all drivers with a high limit for the dropdown
        this.driverService.getDrivers({ limit: 1000 }).subscribe({
            next: (res) => {
                this.driversList = res.data;
            },
            error: (error) => {
                console.error('Error loading drivers:', error);
                this.toastService.error('فشل تحميل السائقين');
            }
        });
    }
    
    records = signal<FuelRecord[]>([]);

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

        // Add search parameter
        if (this.searchTerm().trim()) {
            params.search = this.searchTerm().trim();
        }

        this.fuelService.getFuelRecords(params).subscribe({
            next: (response) => {
                this.records.set(response.data);
                this.totalRecords = response.total;
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading fuel records:', error);
                this.toastService.error('فشل تحميل سجلات الوقود');
                this.isLoading.set(false);
            }
        });
    }

    // --- Pagination Methods ---
    getPaginatedFuelRecords() {
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
        this.searchTerm.set('');

        this.dateFilterFrom.set(null);
        this.dateFilterTo.set(null);
        this.vehicleFilter.set('جميع المركبات');
        this.currentPage = 1;
        this.loadData();
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
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            ambulanceName: '',
            ambulanceNumber: '',
            ambulanceId: '',
            driverId: '',
            driverName: '',
            driverInternalId: '',
            odometerBefore: 0,
            odometerAfter: 0,
            fuelAmount: 0,
            cost: 0,
            notes: ''
        };
        this.isAddRecordModalOpen.set(true);
    }

    addRecord(): void {
         let date : any= new Date(this.recordForm.year, this.recordForm.month - 1, this.recordForm.day)
        const validationData = {
            ambulanceId: this.recordForm.ambulanceName,
            liters: this.recordForm.fuelAmount,
            cost: this.recordForm.cost,
            date: date,
            mileage: this.recordForm.odometerAfter
        };

        const validationResult = this.validationService.validateFuelRecord(validationData);

        if (!validationResult.valid) {
            // Show validation errors using toast
            validationResult.errors.forEach(error => {
                this.toastService.error(error, 3000);
            });
            return;
        }

        // Additional validation for odometer readings
        if (this.recordForm.odometerAfter <= this.recordForm.odometerBefore) {
            this.toastService.error('عداد المسافات (بعد) يجب أن يكون أكبر من عداد المسافات (قبل)', 3000);
            return;
        }

        this.fuelService.createFuelRecord({
            ambulanceName: this.recordForm.ambulanceName,
            ambulanceNumber: this.recordForm.ambulanceNumber,
            ambulanceId: this.recordForm.ambulanceId,
            driverId: this.recordForm.driverId,
            driverName: this.recordForm.driverName,
            driverInternalId: this.recordForm.driverInternalId,
            date: date,
            odometerBefore: this.recordForm.odometerBefore,
            odometerAfter: this.recordForm.odometerAfter,
            fuelAmount: this.recordForm.fuelAmount,
            cost: this.recordForm.cost,
            notes: this.recordForm.notes
        }).subscribe({
            next: (record) => {
                this.isAddRecordModalOpen.set(false);
                this.toastService.success(`سجل وقود جديد (${record.ambulanceNumber}) تمت إضافته بنجاح`, 3000);
                this.loadData();
            },
            error: (error) => {
                console.error('Error creating fuel record:', error);
                this.toastService.error('فشلت عملية إضافة سجل الوقود');
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
                ambulanceName: record.ambulanceName,
                ambulanceNumber: record.ambulanceNumber,
                ambulanceId: record.ambulanceId || '',
                driverId: record.driverId,
                driverName: record.driverName,
                driverInternalId: record.driverInternalId || '',
                odometerBefore: record.odometerBefore,
                odometerAfter: record.odometerAfter,
                fuelAmount: record.fuelAmount,
                cost: record.cost,
                notes: record.notes || ''
            };
            this.isViewRecordModalOpen.set(false);
            this.isEditRecordModalOpen.set(true);
        }
    }

    saveEditRecord(): void {
         let date : any= new Date(this.recordForm.year, this.recordForm.month - 1, this.recordForm.day)
        const record = this.selectedRecord();
        if (record) {
            // Validate fuel record using ValidationService
            const validationData = {
                ambulanceId: this.recordForm.ambulanceName,
                liters: this.recordForm.fuelAmount,
                cost: this.recordForm.cost,
                date: date,
                mileage: this.recordForm.odometerAfter
            };

            const validationResult = this.validationService.validateFuelRecord(validationData);

            if (!validationResult.valid) {
                // Show validation errors using toast
                validationResult.errors.forEach(error => {
                    this.toastService.error(error, 3000);
                });
                return;
            }

            // Additional validation for odometer readings
            if (this.recordForm.odometerAfter <= this.recordForm.odometerBefore) {
                this.toastService.error('عداد المسافات (بعد) يجب أن يكون أكبر من عداد المسافات (قبل)', 3000);
                return;
            }

            const updatePayload = {
                ambulanceName: this.recordForm.ambulanceName,
                ambulanceNumber: this.recordForm.ambulanceNumber,
                ambulanceId: this.recordForm.ambulanceId,
                driverId: this.recordForm.driverId,
                driverName: this.recordForm.driverName,
                driverInternalId: this.recordForm.driverInternalId,
                date: date,
                odometerBefore: this.recordForm.odometerBefore,
                odometerAfter: this.recordForm.odometerAfter,
                fuelAmount: this.recordForm.fuelAmount,
                cost: this.recordForm.cost,
                notes: this.recordForm.notes
            };

            this.fuelService.updateFuelRecord(record.id, updatePayload).subscribe({
                next: (updatedRecord) => {
                    // Merge: old record -> updated data from form -> API response
                    // This ensures form changes are visible even if API returns partial data
                    const mergedRecord = {
                        ...record,
                        ...updatePayload,
                        ...(updatedRecord && Object.keys(updatedRecord).length > 0 ? updatedRecord : {}),
                        id: record.id // Always preserve the ID
                    };
                    this.selectedRecord.set(mergedRecord);
                    this.isEditRecordModalOpen.set(false);
                    this.isViewRecordModalOpen.set(true);
                    this.toastService.info(`تم تعديل سجل الوقود (${this.recordForm.ambulanceNumber}) للسائق ${this.recordForm.driverName}`, 3000);
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error updating fuel record:', error);
                    this.toastService.error('فشلت عملية تحديث سجل الوقود');
                }
            });
        }
    }

    viewRecordDetails(record: FuelRecord): void {
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
            const deleted = this.records().find(r => r.id === recordId);
            this.fuelService.deleteFuelRecord(recordId).subscribe({
                next: () => {
                    this.closeViewRecordModal();
                    if (deleted) {
                        this.toastService.success(`تم حذف سجل الوقود (${deleted.ambulanceNumber}) للسائق ${deleted.driverName}`, 3000);
                    } else {
                        this.toastService.success('تم حذف سجل وقود', 3000);
                    }
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error deleting fuel record:', error);
                    this.toastService.error('فشلت عملية حذف سجل الوقود');
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
     * Navigate to driver page
     */
    navigateToDriver(value: string): void {
        this.router.navigate(['admin/drivers-list'], {
            queryParams: {
                filterValue: value
            }
        });
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
     * Filter by clicking on driver name
     */
    filterByDriver(driverName: string, event?: Event): void {
        if (event) {
            event.stopPropagation();
        }
        this.searchTerm.set(driverName);
    }

    /**
     * Handle vehicle selection from dropdown
     */
    onVehicleSelect(event: Event): void {
        const target = event.target as HTMLSelectElement;
        const vehicleId = target.value;

        if (!vehicleId) {
            this.recordForm.ambulanceId = '';
            this.recordForm.ambulanceName = '';
            this.recordForm.ambulanceNumber = '';
            return;
        }

        const vehicle = this.vehiclesList.find(v => v.id === vehicleId);
        if (vehicle) {
            this.recordForm.ambulanceId = vehicle.id;
            this.recordForm.ambulanceName = vehicle.vehicleName;
            this.recordForm.ambulanceNumber = vehicle.vehicleId;
        }
    }

    /**
     * Handle driver selection from dropdown
     */
    onDriverSelect(event: Event): void {
        const target = event.target as HTMLSelectElement;
        const driverId = target.value;

        if (!driverId) {
            this.recordForm.driverInternalId = '';
            this.recordForm.driverId = '';
            this.recordForm.driverName = '';
            return;
        }

        const driver = this.driversList.find((d: any) => d.id === driverId);
        if (driver) {
            this.recordForm.driverInternalId = driver.id;
            this.recordForm.driverId = driver.driver_code;
            this.recordForm.driverName = driver.arabicName;
        }
    }
}