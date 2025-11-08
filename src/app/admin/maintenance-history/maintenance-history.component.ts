import { Component, signal, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GlobalVarsService } from '../../global-vars.service';
import { ToastService } from '../../shared/services/toast.service';
import { ValidationService } from '../../shared/services/validation.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { MAINTENANCE_STATUS } from '../../shared/constants/status.constants';

// --- Data Structures ---
interface MaintenanceRecord {
    id: string;
    vehicleId: string;
    date: Date;
    type: string;
    cost: number;
    serviceLocation: string;
    odometerBefore: number;
    odometerAfter: number;
    notes: string;
    status: MaintenanceStatus;
}

type MaintenanceStatus = 'مكتملة' | 'مجدولة' | 'قيد التنفيذ';

@Component({
    selector: 'app-maintenance-history',
    standalone: true,
    imports: [CommonModule, FormsModule, PaginationComponent, StatusBadgeComponent],
    templateUrl: './maintenance-history.component.html',
    styleUrl: './maintenance-history.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenanceHistoryComponent {
    // --- State Initialization (Signals) ---
    searchTerm = signal('');
    maintenanceTypeFilter = signal('');
    startDay: number = 1;
    startMonth: number = 8;
    startYear: number = 2023;
    endDay: number = 31;
    endMonth: number = 8;
    endYear: number = 2023;
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
        status: 'Completed' as MaintenanceStatus
    };

    vehiclesList: string[] = ['جميع المركبات', 'الوحدة 05', 'إسعاف 01', 'الوحدة 02', 'AMB-012', 'AMB-025'];
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

    constructor(
        private globalVars: GlobalVarsService,
        private toastService: ToastService,
        private validationService: ValidationService
    ) {
        this.globalVars.setGlobalHeader('سجل الصيانة');
    }
    
    // Helper to generate IDs
    private generateId(): string {
        return Date.now().toString() + Math.random().toString(36).substring(2, 9);
    }
    
    // Dummy Data
    records = signal<MaintenanceRecord[]>([
        {
            id: this.generateId(),
            vehicleId: 'الوحدة 05',
            date: new Date(2023, 7, 28),
            type: 'تغيير الزيت',
            cost: 150.75,
            serviceLocation: 'مركز صيانة المدينة',
            odometerBefore: 125450,
            odometerAfter: 125452,
            notes: 'تم إجراء خدمة 5000 ميل القياسية. تم فحص جميع مستويات السوائل وضغط الإطارات. لم يتم الإبلاغ عن أي مشاكل.',
            status: 'مكتملة'
        },
        {
            id: this.generateId(),
            vehicleId: 'الوحدة 05',
            date: new Date(2023, 7, 12),
            type: 'تدوير الإطارات',
            cost: 85.00,
            serviceLocation: 'مركز صيانة الأسطول',
            odometerBefore: 120110,
            odometerAfter: 120110,
            notes: 'تم تدوير جميع الإطارات الأربعة حسب الجدول الزمني.',
            status: 'مكتملة'
        },
        {
            id: this.generateId(),
            vehicleId: 'AMB-012',
            date: new Date(2023, 8, 15),
            type: 'خدمة الفرامل',
            cost: 425.50,
            serviceLocation: 'مركز الخدمة المتميز',
            odometerBefore: 98500,
            odometerAfter: 98502,
            notes: 'استبدال وسادات الفرامل الأمامية وإعادة تسطيح الأقراص.',
            status: 'مجدولة'
        }
    ]);

    // --- Computed Property for Filtering ---
    filteredRecords = computed(() => {
        const fromDate = this.dateFilterFrom();
        const toDate = this.dateFilterTo();
        const vehicle = this.vehicleFilter();
        const serviceLocation = this.serviceLocationFilter().toLowerCase().trim();
        const search = this.searchTerm().toLowerCase().trim();
        const maintenanceType = this.maintenanceTypeFilter();

        return this.records().filter(record => {
            // Date Filter
            let dateMatch = true;
            if (fromDate && toDate) {
                dateMatch = record.date >= fromDate && record.date <= toDate;
            }

            // Vehicle Filter
            const vehicleMatch = vehicle === 'جميع المركبات' || record.vehicleId === vehicle;

            // Service Location Filter
            const locationMatch = serviceLocation === '' || record.serviceLocation.toLowerCase().includes(serviceLocation);

            // Search Filter (searches in vehicle ID, service location, and notes)
            const searchMatch = search === '' ||
                record.vehicleId.toLowerCase().includes(search) ||
                record.serviceLocation.toLowerCase().includes(search) ||
                record.notes.toLowerCase().includes(search) ||
                record.type.toLowerCase().includes(search);

            // Maintenance Type Filter
            const typeMatch = maintenanceType === '' || maintenanceType === 'جميع الأنواع' || record.type === maintenanceType;

            return dateMatch && vehicleMatch && locationMatch && searchMatch && typeMatch;
        });
    });

    // --- Pagination Methods ---
    getPaginatedMaintenanceRecords() {
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
        const fromDate = new Date(this.startYear, this.startMonth - 1, this.startDay);
        const toDate = new Date(this.endYear, this.endMonth - 1, this.endDay);
        
        this.dateFilterFrom.set(fromDate);
        this.dateFilterTo.set(toDate);
        this.vehicleFilter.set(this.selectedVehicle);
        this.maintenanceTypeFilter.set(this.selectedMaintenanceType);
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

    formatDate(date: Date): string {
        return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
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

        const record: MaintenanceRecord = {
            id: this.generateId(),
            vehicleId: this.recordForm.vehicleId,
            date: new Date(this.recordForm.year, this.recordForm.month - 1, this.recordForm.day),
            type: this.recordForm.type,
            cost: this.recordForm.cost,
            serviceLocation: this.recordForm.serviceLocation,
            odometerBefore: this.recordForm.odometerBefore,
            odometerAfter: this.recordForm.odometerAfter,
            notes: this.recordForm.notes,
            status: this.recordForm.status
        };

        this.records.update(records => [...records, record]);
        this.isAddRecordModalOpen.set(false);
        this.toastService.success('تم إضافة سجل الصيانة بنجاح');
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

            const updatedRecord: MaintenanceRecord = {
                ...record,
                vehicleId: this.recordForm.vehicleId,
                date: new Date(this.recordForm.year, this.recordForm.month - 1, this.recordForm.day),
                type: this.recordForm.type,
                cost: this.recordForm.cost,
                serviceLocation: this.recordForm.serviceLocation,
                odometerBefore: this.recordForm.odometerBefore,
                odometerAfter: this.recordForm.odometerAfter,
                notes: this.recordForm.notes,
                status: this.recordForm.status
            };

            this.records.update(records => records.map(r => r.id === record.id ? updatedRecord : r));
            this.selectedRecord.set(updatedRecord);
            this.isEditRecordModalOpen.set(false);
            this.isViewRecordModalOpen.set(true);
            this.toastService.success('تم تحديث سجل الصيانة بنجاح');
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
            this.records.update(records => records.filter(r => r.id !== recordId));
            this.closeViewRecordModal();
            this.toastService.success('تم حذف سجل الصيانة بنجاح');
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
}