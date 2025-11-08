import { Component, signal, ChangeDetectionStrategy, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { GlobalVarsService } from '../../global-vars.service';
import { ToastService } from '../../shared/services/toast.service';
import { ValidationService } from '../../shared/services/validation.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

// --- Data Structures ---
interface FuelRecord {
    id: string;
    ambulanceName: string;
    ambulanceNumber: string;
    driverId: string;
    driverName: string;
    date: Date;
    odometerBefore: number;
    odometerAfter: number;
    fuelAmount: number; // in liters
    cost: number;
    notes?: string;
}

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
        driverId: '',
        driverName: '',
        odometerBefore: 0,
        odometerAfter: 0,
        fuelAmount: 0,
        cost: 0,
        notes: ''
    };

    ambulanceList: string[] = [
        'جميع المركبات',
        'إسعاف 01',
        'إسعاف 04',
        'إسعاف 07',
        'إسعاف 12',
        'إسعاف 25'
    ];

    // Pagination
    currentPage = 1;
    itemsPerPage = 10;

    constructor(
        private globalVars: GlobalVarsService,
        private router: Router,
        private route: ActivatedRoute,
        private toastService: ToastService,
        private validationService: ValidationService
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
    }
    
    // Helper to generate IDs
    private generateId(): string {
        return Date.now().toString() + Math.random().toString(36).substring(2, 9);
    }
    
    // Dummy Data (fuel amounts now in liters)
    records = signal<FuelRecord[]>([
        {
            id: this.generateId(),
            ambulanceName: 'إسعاف 04',
            ambulanceNumber: 'AMB-004',
            driverId: 'D-124',
            driverName: 'أحمد محمود',
            date: new Date(2023, 9, 26), // October 26
            odometerBefore: 125400,
            odometerAfter: 125750,
            fuelAmount: 57.5, // liters (15.2 gallons converted)
            cost: 75.50,
            notes: ''
        },
        {
            id: this.generateId(),
            ambulanceName: 'إسعاف 04',
            ambulanceNumber: 'AMB-004',
            driverId: 'D-124',
            driverName: 'أحمد محمود',
            date: new Date(2023, 9, 19), // October 19
            odometerBefore: 125015,
            odometerAfter: 125400,
            fuelAmount: 56.0, // liters (14.8 gallons converted)
            cost: 72.30,
            notes: 'المضخة رقم 3 كانت بطيئة. تم الإبلاغ عن ذلك لموظف المحطة.'
        },
        {
            id: this.generateId(),
            ambulanceName: 'إسعاف 04',
            ambulanceNumber: 'AMB-004',
            driverId: 'D-124',
            driverName: 'أحمد محمود',
            date: new Date(2023, 9, 12), // October 12
            odometerBefore: 124650,
            odometerAfter: 125015,
            fuelAmount: 58.7, // liters (15.5 gallons converted)
            cost: 78.10,
            notes: ''
        },
        {
            id: this.generateId(),
            ambulanceName: 'إسعاف 07',
            ambulanceNumber: 'AMB-007',
            driverId: 'D-089',
            driverName: 'محمد علي',
            date: new Date(2023, 9, 25), // October 25
            odometerBefore: 98200,
            odometerAfter: 98550,
            fuelAmount: 60.5, // liters (16.0 gallons converted)
            cost: 80.00,
            notes: ''
        },
        {
            id: this.generateId(),
            ambulanceName: 'إسعاف 01',
            ambulanceNumber: 'AMB-001',
            driverId: 'D-045',
            driverName: 'خالد حسن',
            date: new Date(2023, 9, 20), // October 20
            odometerBefore: 142300,
            odometerAfter: 142680,
            fuelAmount: 54.9, // liters (14.5 gallons converted)
            cost: 71.25,
            notes: 'تم التزود بالوقود في المحطة الشمالية'
        }
    ]);

    // --- Computed Property for Filtering ---
    filteredRecords = computed(() => {
        const filterDate = this.dateFilter();
        const ambulance = this.ambulanceFilter();
        const search = this.searchTerm().toLowerCase().trim();

        return this.records().filter(record => {
            // Date Filter - only applies if specific date is selected (not default placeholders)
            let dateMatch = true;
            if (filterDate) {
                // If day is selected, match exact date
                if (typeof this.filterDay === 'number') {
                    dateMatch = record.date.getDate() === filterDate.getDate() &&
                               record.date.getMonth() === filterDate.getMonth() &&
                               record.date.getFullYear() === filterDate.getFullYear();
                }
                // If only month/year selected, match month and year
                else if (typeof this.filterMonth === 'number' && typeof this.filterYear === 'number') {
                    dateMatch = record.date.getMonth() === filterDate.getMonth() &&
                               record.date.getFullYear() === filterDate.getFullYear();
                }
                // If only year selected, match year
                else if (typeof this.filterYear === 'number') {
                    dateMatch = record.date.getFullYear() === filterDate.getFullYear();
                }
            }

            // Ambulance Filter
            const ambulanceMatch = ambulance === 'جميع المركبات' ||
                                  record.ambulanceName === ambulance;

            // Search Filter (searches through all ambulance properties)
            const searchMatch = search === '' ||
                record.ambulanceName.toLowerCase().includes(search) ||
                record.ambulanceNumber.toLowerCase().includes(search) ||
                record.driverId.toLowerCase().includes(search) ||
                record.driverName.toLowerCase().includes(search) ||
                (record.notes && record.notes.toLowerCase().includes(search));

            return dateMatch && ambulanceMatch && searchMatch;
        });
    });

    // --- Pagination Methods ---
    getPaginatedFuelRecords() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.filteredRecords().slice(startIndex, endIndex);
    }

    onPageChange(page: number): void {
        this.currentPage = page;
    }

    onItemsPerPageChange(itemsPerPage: number): void {
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1;
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
    }

    clearFilters(): void {
        this.filterDay = 'يوم';
        this.filterMonth = 'شهر';
        this.filterYear = 'سنة';
        this.selectedAmbulance = 'جميع المركبات';
        this.searchTerm.set('');
        
        this.dateFilter.set(null);
        this.ambulanceFilter.set('جميع المركبات');
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
            driverId: '',
            driverName: '',
            odometerBefore: 0,
            odometerAfter: 0,
            fuelAmount: 0,
            cost: 0,
            notes: ''
        };
        this.isAddRecordModalOpen.set(true);
    }

    addRecord(): void {
        // Validate fuel record using ValidationService
        const validationData = {
            ambulanceId: this.recordForm.ambulanceName,
            liters: this.recordForm.fuelAmount,
            cost: this.recordForm.cost,
            date: new Date(this.recordForm.year, this.recordForm.month - 1, this.recordForm.day),
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

        const record: FuelRecord = {
            id: this.generateId(),
            ambulanceName: this.recordForm.ambulanceName,
            ambulanceNumber: this.recordForm.ambulanceNumber,
            driverId: this.recordForm.driverId,
            driverName: this.recordForm.driverName,
            date: new Date(this.recordForm.year, this.recordForm.month - 1, this.recordForm.day),
            odometerBefore: this.recordForm.odometerBefore,
            odometerAfter: this.recordForm.odometerAfter,
            fuelAmount: this.recordForm.fuelAmount,
            cost: this.recordForm.cost,
            notes: this.recordForm.notes
        };

        this.records.update(records => [...records, record]);
        this.isAddRecordModalOpen.set(false);
        this.toastService.success(`سجل وقود جديد (${record.ambulanceNumber}) تمت إضافته بنجاح`, 3000);
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
                driverId: record.driverId,
                driverName: record.driverName,
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
        const record = this.selectedRecord();
        if (record) {
            // Validate fuel record using ValidationService
            const validationData = {
                ambulanceId: this.recordForm.ambulanceName,
                liters: this.recordForm.fuelAmount,
                cost: this.recordForm.cost,
                date: new Date(this.recordForm.year, this.recordForm.month - 1, this.recordForm.day),
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

            const updatedRecord: FuelRecord = {
                ...record,
                ambulanceName: this.recordForm.ambulanceName,
                ambulanceNumber: this.recordForm.ambulanceNumber,
                driverId: this.recordForm.driverId,
                driverName: this.recordForm.driverName,
                date: new Date(this.recordForm.year, this.recordForm.month - 1, this.recordForm.day),
                odometerBefore: this.recordForm.odometerBefore,
                odometerAfter: this.recordForm.odometerAfter,
                fuelAmount: this.recordForm.fuelAmount,
                cost: this.recordForm.cost,
                notes: this.recordForm.notes
            };

            this.records.update(records => records.map(r => r.id === record.id ? updatedRecord : r));
            this.selectedRecord.set(updatedRecord);
            this.isEditRecordModalOpen.set(false);
            this.isViewRecordModalOpen.set(true);
            this.toastService.info(`تم تعديل سجل الوقود (${updatedRecord.ambulanceNumber}) للسائق ${updatedRecord.driverName}`, 3000);
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
            this.records.update(records => records.filter(r => r.id !== recordId));
            this.closeViewRecordModal();
            if (deleted) {
                this.toastService.success(`تم حذف سجل الوقود (${deleted.ambulanceNumber}) للسائق ${deleted.driverName}`, 3000);
            } else {
                this.toastService.success('تم حذف سجل وقود', 3000);
            }
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
}