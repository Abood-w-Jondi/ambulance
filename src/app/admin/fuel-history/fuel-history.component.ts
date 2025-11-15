import { Component, signal, ChangeDetectionStrategy, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { GlobalVarsService } from '../../global-vars.service';
import { ToastService } from '../../shared/services/toast.service';
import { ValidationService } from '../../shared/services/validation.service';
import { FuelService } from '../../shared/services/fuel.service';
import { VehicleService } from '../../shared/services/vehicle.service';
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
    filterDay: number | string = 'يوم';
    filterMonth: number | string = 'شهر';
    filterYear: number | string = 'سنة';
    selectedAmbulance: string = 'جميع المركبات';
    
    // Filters for computation
    dateFilter = signal<Date | null>(null);
    ambulanceFilter = signal<string>('جميع المركبات');
    
    // Query parameter filters
    queryFilterType = signal<string | null>(null);
    queryFilterValue = signal<string | null>(null);
    
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

    // Pagination
    currentPage = 1;
    itemsPerPage = 10;
    totalRecords = 0;
    isLoading = signal(false);

    constructor(
        private globalVars: GlobalVarsService,
        private router: Router,
        private route: ActivatedRoute,
        private toastService: ToastService,
        private validationService: ValidationService,
        private fuelService: FuelService,
        private vehicleService: VehicleService
    ) {
        this.globalVars.setGlobalHeader('سجل الوقود');
    }

    ngOnInit(): void {
        // Check for query parameters from fleet component
        this.route.queryParams.subscribe(params => {
            if (params['filterType'] && params['filterValue']) {
                this.queryFilterType.set(params['filterType']);
                this.queryFilterValue.set(params['filterValue']);
                this.searchTerm.set(params['filterValue']);
            }
        });
        this.toastService.info('يمكنك النقر على أسماء المركبات أو أرقامها أو معرفات السائقين للتنقل إلى المكونات ذات الصلة.', 3000);
        this.loadVehicles();
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
    
    records = signal<FuelRecord[]>([]);

    loadData(): void {
        this.isLoading.set(true);

        const params: any = {
            page: this.currentPage,
            limit: this.itemsPerPage
        };

        const filterDate = this.dateFilter();
        if (filterDate) {
            params.startDate = filterDate.toISOString().split('T')[0];
            params.endDate = filterDate.toISOString().split('T')[0];
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

    // --- Computed Property for Filtering ---
    filteredRecords = computed(() => {
        return this.records();
    });

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
        // Only create date filter if at least one date component is selected
        if (typeof this.filterDay === 'number' ||
            typeof this.filterMonth === 'number' ||
            typeof this.filterYear === 'number') {

            const day = typeof this.filterDay === 'number' ? this.filterDay : 1;
            const month = typeof this.filterMonth === 'number' ? this.filterMonth - 1 : 0;
            const year = typeof this.filterYear === 'number' ? this.filterYear : new Date().getFullYear();

            const filterDate = new Date(year, month, day);
            this.dateFilter.set(filterDate);
        } else {
            this.dateFilter.set(null);
        }

        this.ambulanceFilter.set(this.selectedAmbulance);
        this.currentPage = 1;
        this.loadData();
    }

    clearFilters(): void {
        this.filterDay = 'يوم';
        this.filterMonth = 'شهر';
        this.filterYear = 'سنة';
        this.selectedAmbulance = 'جميع المركبات';
        this.searchTerm.set('');

        this.dateFilter.set(null);
        this.ambulanceFilter.set('جميع المركبات');
        this.currentPage = 1;
        this.loadData();
    }

    formatDate(date: Date): string {
        return date.toLocaleDateString('ar-EG', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
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

            this.fuelService.updateFuelRecord(record.id, {
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
                next: (updatedRecord) => {
                    this.selectedRecord.set(updatedRecord);
                    this.isEditRecordModalOpen.set(false);
                    this.isViewRecordModalOpen.set(true);
                    this.toastService.info(`تم تعديل سجل الوقود (${updatedRecord.ambulanceNumber}) للسائق ${updatedRecord.driverName}`, 3000);
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

    // Navigation methods for clicking on ambulance properties
    navigateToFleet(filterType: 'name' | 'number' | 'driver' | 'driverId', value: string): void {
        // Navigate to fleet component with query params
        this.router.navigate(['admin/vehicles'], { 
            queryParams: { 
                filterType: filterType,
                filterValue: value 
            } 
        });
    }
    navigateToDriver(value: string): void {
        this.router.navigate(['admin/drivers-list'], { 
            queryParams: { 
                filterValue: value 
            } 
        });
    }

    getDaysInMonth(month: number | string, year: number | string): (number | string)[] {
        if (typeof month !== 'number' || typeof year !== 'number') {
            return ['يوم'];
        }
        const days = new Date(year, month, 0).getDate();
        return ['يوم', ...Array.from({ length: days }, (_, i) => i + 1)];
    }

    getMonths(): (number | string)[] {
        return ['شهر', ...Array.from({ length: 12 }, (_, i) => i + 1)];
    }

    getYears(): (number | string)[] {
        const currentYear = new Date().getFullYear();
        return ['سنة', ...Array.from({ length: 10 }, (_, i) => currentYear - i)];
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
}