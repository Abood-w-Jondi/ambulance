import { Component, signal, ChangeDetectionStrategy, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GlobalVarsService } from '../../global-vars.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../shared/services/toast.service';
import { ValidationService } from '../../shared/services/validation.service';
import { DriverService } from '../../shared/services/driver.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { ConfirmationModalComponent, ConfirmationModalConfig } from '../../shared/confirmation-modal/confirmation-modal.component';
import { DRIVER_STATUS } from '../../shared/constants/status.constants';
import { Driver, DriverFilterStatus } from '../../shared/models';

type FilterStatus = DriverFilterStatus;

@Component({
    selector: 'app-drivers-list',
    imports: [CommonModule, FormsModule, PaginationComponent, StatusBadgeComponent, ConfirmationModalComponent],
    templateUrl: './drivers-list.component.html',
    styleUrl: './drivers-list.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriversListComponent implements OnInit {
    // Pagination
    currentPage = 1;
    itemsPerPage = 10;
    totalRecords = 0;
    isLoading = signal(false);

    constructor(
        private globalVarsService: GlobalVarsService,
        private route: ActivatedRoute,
        private router: Router,
        private toastService: ToastService,
        private validationService: ValidationService,
        private driverService: DriverService
    ) {
        this.globalVarsService.setGlobalHeader('سائقي الإسعاف');
    }

    viewUserProfile(driver: Driver) {
        // Navigate to the profile page with the driver's ID
        this.router.navigate(['/admin/profile', driver.id]);
    }

    viewTransactionHistory(driver: Driver) {
        // Navigate to the transaction history page with the driver's ID
        this.router.navigate(['/admin/transactions', driver.id], {
            queryParams: { type: 'driver', name: driver.arabicName }
        });
    }
    
    queryFilterValue = signal<string | null>(null);
    
    searchTermValue: string = '';
    filterStatusValue: FilterStatus = 'all';
    minOwedValue: number | null = null;
    maxOwedValue: number | null = null;

    showFiltersOnMobile = signal(false);
    searchTerm = signal('');
    filterStatus = signal<FilterStatus>('all');
    minOwed = signal<number | null>(null);
    maxOwed = signal<number | null>(null);

    isAddModalOpen = signal(false);
    isEditModalOpen = signal(false);
    isDeleteModalOpen = signal(false);
    driverToEdit = signal<Driver | null>(null);
    driverToDelete = signal<Driver | null>(null);

    // Confirmation modal state
    confirmationModalConfig = signal<ConfirmationModalConfig>({
        type: 'delete',
        title: '',
        message: '',
        confirmButtonText: '',
        cancelButtonText: 'إلغاء'
    });

    newDriver: {
        arabicName: string;
        name: string;
        username: string;
        email: string;
        password: string;
        amountOwed: number;
        tripsToday: number;
    } = {
        arabicName: '',
        name: '',
        username: '',
        email: '',
        password: '',
        amountOwed: 0,
        tripsToday: 0,
    };

    editDriver: {
        arabicName: string;
        name: string;
        username: string;
        email: string;
        arabicStatus: 'متاح' | 'في رحلة' | 'غير متصل';
        tripsToday: number;
        amountOwed: number;
        newPassword: string;
        isActive: boolean;
    } = {
        arabicName: '',
        name: '',
        username: '',
        email: '',
        arabicStatus: 'متاح',
        tripsToday: 0,
        amountOwed: 0,
        newPassword: '',
        isActive: true
    };

    reductionAmounts: { [key: string]: number } = {};

    drivers = signal<Driver[]>([]);

    filteredDrivers = computed(() => {
        return this.drivers();
    });

    // Paginated drivers
    getPaginatedDrivers(): Driver[] {
        return this.drivers();
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

    loadData(): void {
        this.isLoading.set(true);

        this.driverService.getDrivers({
            page: this.currentPage,
            limit: this.itemsPerPage,
            search: this.searchTerm() || undefined,
            status: this.filterStatus() !== 'all' ? this.filterStatus() as any : undefined,
            minOwed: this.minOwed() || undefined,
            maxOwed: this.maxOwed() || undefined
        }).subscribe({
            next: (response) => {
                this.drivers.set(response.data);
                this.totalRecords = response.total;
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading drivers:', error);
                this.toastService.error('فشل تحميل بيانات السائقين');
                this.isLoading.set(false);
            }
        });
    }

    addNewDriver() {
        // Use validation service
        const validation = this.validationService.validateDriver(this.newDriver);

        if (!validation.valid) {
            validation.errors.forEach(error => {
                this.toastService.error(error);
            });
            return;
        }

        this.driverService.createDriver({
            arabicName: this.newDriver.arabicName,
            name: this.newDriver.name,
            username: this.newDriver.username || undefined,
            email: this.newDriver.email || undefined,
            password: this.newDriver.password,
            amountOwed: this.newDriver.amountOwed || 0,
            tripsToday: this.newDriver.tripsToday || 0
        } as any).subscribe({
            next: (driver) => {
                this.toastService.success(`تمت إضافة سائق جديد: ${driver.arabicName} (${driver.name})`, 3000);
                this.isAddModalOpen.set(false);
                this.newDriver = { arabicName: '', name: '', username: '', email: '', password: '', amountOwed: 0, tripsToday: 0 };
                this.loadData();
            },
            error: (error) => {
                console.error('Error creating driver:', error);
                this.toastService.error('فشلت عملية إضافة السائق');
            }
        });
    }

    openEditModal(driver: Driver) {
        this.driverToEdit.set(driver);
        this.editDriver = {
            arabicName: driver.arabicName,
            name: driver.name,
            username: driver.username || '',
            email: driver.email || '',
            arabicStatus: driver.arabicStatus,
            tripsToday: driver.tripsToday,
            amountOwed: driver.amountOwed,
            newPassword: '',
            isActive: driver.isActive
        };
        this.isEditModalOpen.set(true);
    }

    closeEditModal() {
        this.driverToEdit.set(null);
        this.isEditModalOpen.set(false);
        this.editDriver = {
            arabicName: '',
            name: '',
            username: '',
            email: '',
            arabicStatus: 'متاح',
            tripsToday: 0,
            amountOwed: 0,
            newPassword: '',
            isActive: true
        };
    }

    saveEditDriver() {
        const driver = this.driverToEdit();
        if (!driver) return;

        // Use validation service
        const validation = this.validationService.validateDriver(this.editDriver);

        if (!validation.valid) {
            validation.errors.forEach(error => {
                this.toastService.error(error);
            });
            return;
        }

        const updateData: any = {
            arabicName: this.editDriver.arabicName,
            name: this.editDriver.name,
            username: this.editDriver.username || undefined,
            email: this.editDriver.email || undefined,
            arabicStatus: this.editDriver.arabicStatus,
            tripsToday: this.editDriver.tripsToday,
            amountOwed: this.editDriver.amountOwed,
            isActive: this.editDriver.isActive
        };

        if (this.editDriver.newPassword && this.editDriver.newPassword.trim() !== '') {
            updateData.password = this.editDriver.newPassword;
        }

        this.driverService.updateDriver(driver.id, updateData).subscribe({
            next: (updatedDriver) => {
                // Merge: old driver -> updated data from form -> API response
                // This ensures form changes are visible even if API returns partial data
                const mergedDriver = {
                    ...driver,
                    ...updateData,
                    ...(updatedDriver && Object.keys(updatedDriver).length > 0 ? updatedDriver : {}),
                    id: driver.id // Always preserve the ID
                };
                this.driverToEdit.set(mergedDriver);
                this.toastService.info(`تم تعديل بيانات السائق: ${this.editDriver.arabicName} (${this.editDriver.name})`, 3000);
                if (this.editDriver.newPassword && this.editDriver.newPassword.trim() !== '') {
                    this.toastService.info(`تم تغيير كلمة مرور السائق: ${this.editDriver.arabicName}`, 3000);
                }
                this.closeEditModal();
                this.loadData();
            },
            error: (error) => {
                console.error('Error updating driver:', error);
                this.toastService.error('فشلت عملية تعديل السائق');
            }
        });
    }

    showDeleteConfirmation(driver: Driver) {
        this.driverToDelete.set(driver);
        this.confirmationModalConfig.set({
            type: 'delete',
            title: 'تأكيد حذف السائق',
            message: `هل أنت متأكد من أنك تريد حذف حساب السائق ${driver.arabicName}؟<br>لا يمكن التراجع عن هذا الإجراء.`,
            confirmButtonText: 'حذف',
            cancelButtonText: 'إلغاء',
            highlightedText: driver.arabicName
        });
        this.isDeleteModalOpen.set(true);
    }

    closeDeleteConfirmation() {
        this.driverToDelete.set(null);
        this.isDeleteModalOpen.set(false);
    }

    confirmDeleteDriver() {
        const driver = this.driverToDelete();
        if (driver) {
            this.driverService.deleteDriver(driver.id).subscribe({
                next: () => {
                    this.toastService.success(`تم حذف السائق: ${driver.arabicName} (${driver.name})`, 3000);
                    this.closeDeleteConfirmation();
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error deleting driver:', error);
                    this.toastService.error('فشلت عملية حذف السائق');
                }
            });
        }
        this.isEditModalOpen.set(false);
    }

    toggleDriverStatus(driver: Driver) {
        const newIsActive = !driver.isActive;
        const serviceCall = newIsActive
            ? this.driverService.activateDriver(driver.id)
            : this.driverService.deactivateDriver(driver.id);

        serviceCall.subscribe({
            next: () => {
                this.toastService.info(`تم ${newIsActive ? 'تفعيل' : 'تعطيل'} حساب السائق: ${driver.arabicName}`, 3000);
                this.loadData();
            },
            error: (error) => {
                console.error('Error toggling driver status:', error);
                this.toastService.error('فشلت عملية تغيير حالة السائق');
            }
        });
    }

    clearIndividualBalance(driver: Driver) {
        this.driverService.clearBalance(driver.id).subscribe({
            next: () => {
                delete this.reductionAmounts[driver.id];
                this.toastService.success(`تم تصفير الرصيد للسائق: ${driver.arabicName}`, 3000);
                this.loadData();
            },
            error: (error) => {
                console.error('Error clearing balance:', error);
                this.toastService.error('فشلت عملية تصفير الرصيد');
            }
        });
    }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            if (params['filterValue']) {
                this.queryFilterValue.set(params['filterValue']);
                this.searchTermValue = this.queryFilterValue() || '';
                this.searchTerm.set(this.searchTermValue);
            }
        });
        this.loadData();
    }

    reduceBalance(driver: Driver, amount: number) {
        // Use validation service
        const validation = this.validationService.validateBalanceReduction(amount, driver.amountOwed);

        if (!validation.valid) {
            validation.errors.forEach(error => {
                this.toastService.error(error);
            });
            return;
        }

        this.driverService.reduceBalance(driver.id, amount).subscribe({
            next: () => {
                delete this.reductionAmounts[driver.id];
                this.toastService.info(`تم خصم ₪${amount} من رصيد السائق: ${driver.arabicName}`, 3000);
                this.loadData();
            },
            error: (error) => {
                console.error('Error reducing balance:', error);
                this.toastService.error('فشلت عملية خصم الرصيد');
            }
        });
    }

    toggleMobileFilters() {
        this.showFiltersOnMobile.update(val => !val);
    }

    resetFilters() {
        this.searchTerm.set('');
        this.filterStatus.set('all');
        this.minOwed.set(null);
        this.maxOwed.set(null);

        this.searchTermValue = '';
        this.filterStatusValue = 'all';
        this.minOwedValue = null;
        this.maxOwedValue = null;

        this.showFiltersOnMobile.set(false);
        this.toastService.info('تمت إعادة تعيين الفلاتر', 3000);
        this.currentPage = 1;
        this.loadData();
    }

    applyFiltersOnSearch() {
        this.currentPage = 1;
        this.loadData();
    }

    getStatusOptions(): Array<'متاح' | 'في رحلة' | 'غير متصل'> {
        return ['متاح', 'في رحلة', 'غير متصل'];
    }

    isAddFormValid(): boolean {
        return !!(
            this.newDriver.arabicName &&
            this.newDriver.password &&
            (this.newDriver.username || this.newDriver.email)
        );
    }

    isEditFormValid(): boolean {
        return !!(
            this.editDriver.arabicName &&
            (this.editDriver.username || this.editDriver.email)
        );
    }
}