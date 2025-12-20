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
import { Driver, DriverFilterStatus, EducationLevel } from '../../shared/models';

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
    showFiltersOnMobile = signal(false);
    searchTerm = signal('');
    filterStatus = signal<FilterStatus>('all');

    isAddModalOpen = signal(false);
    isEditModalOpen = signal(false);
    isDeleteModalOpen = signal(false);
    isPaymentModalOpen = signal(false);
    isExpenseModalOpen = signal(false);
    isClearBalanceModalOpen = signal(false);

    driverToEdit = signal<Driver | null>(null);
    driverToDelete = signal<Driver | null>(null);
    driverForPayment = signal<Driver | null>(null);
    driverForExpense = signal<Driver | null>(null);
    driverForClearBalance = signal<Driver | null>(null);

    paymentAmount = signal<number>(0);
    expenseAmount = signal<number>(0);
    expenseDescription = signal<string>('');

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
    } = {
        arabicName: '',
        name: '',
        username: '',
        email: '',
        password: '',
    };

    editDriver: {
        arabicName: string;
        name: string;
        username: string;
        email: string;
        arabicStatus: 'متاح' | 'في رحلة' | 'غير متصل';
        tripsToday: number;
        newPassword: string;
        isActive: boolean;
        jobTitle: string;
        educationLevel: EducationLevel | '';
        phoneNumber: string;
        profileImageUrl: string;
    } = {
        arabicName: '',
        name: '',
        username: '',
        email: '',
        arabicStatus: 'متاح',
        tripsToday: 0,
        newPassword: '',
        isActive: true,
        jobTitle: '',
        educationLevel: '',
        phoneNumber: '',
        profileImageUrl: ''
    };

    // Education level options for dropdown
    educationLevelOptions: { value: EducationLevel; label: string }[] = [
        { value: 'EMI', label: 'EMI - طوارئ طبية متوسطة' },
        { value: 'B', label: 'B - أساسي' },
        { value: 'I', label: 'I - متوسط' },
        { value: 'P', label: 'P - مسعف' }
    ];

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
            status: this.filterStatus() !== 'all' ? this.filterStatus() as any : undefined
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
            password: this.newDriver.password
        } as any).subscribe({
            next: (driver) => {
                this.toastService.success(`تمت إضافة سائق جديد: ${driver.arabicName} (${driver.name})`, 3000);
                this.isAddModalOpen.set(false);
                this.newDriver = { arabicName: '', name: '', username: '', email: '', password: '' };
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
            newPassword: '',
            isActive: driver.isActive,
            jobTitle: driver.jobTitle || '',
            educationLevel: driver.educationLevel || '',
            phoneNumber: driver.phoneNumber || '',
            profileImageUrl: driver.profileImageUrl || ''
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
            newPassword: '',
            isActive: true,
            jobTitle: '',
            educationLevel: '',
            phoneNumber: '',
            profileImageUrl: ''
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
            isActive: this.editDriver.isActive,
            jobTitle: this.editDriver.jobTitle || undefined,
            educationLevel: this.editDriver.educationLevel || undefined,
            phoneNumber: this.editDriver.phoneNumber || undefined,
            profileImageUrl: this.editDriver.profileImageUrl || undefined
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

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            if (params['filterValue']) {
                this.queryFilterValue.set(params['filterValue']);
                this.searchTerm.set(this.queryFilterValue() || '');
            }
        });
        this.loadData();
    }

// This method is now replaced by recordPayment() which uses the new balance system
// Keeping for backwards compatibility but not used in the UI anymore
reduceBalance(driver: Driver, amount: number) {
    const balanceInfo = this.getDriverBalanceDisplay(driver);
    const currentBalance = balanceInfo.amount;

    // Use validation service
    const validation = this.validationService.validateBalanceReduction(amount, currentBalance);

    if (!validation.valid) {
        validation.errors.forEach(error => {
            this.toastService.error(error);
        });
        return;
    }

    // Show warnings for overpayment scenarios
    if (validation.warnings && validation.warnings.length > 0) {
        validation.warnings.forEach(warning => {
            this.toastService.warning(warning, 5000);  // 5 second display
        });
    }

    this.driverService.reduceBalance(driver.id, amount).subscribe({
        next: () => {
            delete this.reductionAmounts[driver.id];

            let message: string;
            if (amount > currentBalance) {
                // Overpayment - creates debt (they owe company)
                const debtAmount = amount - currentBalance;
                message = `تم الدفع وتسجيل دين للسائق: ${driver.arabicName} (دين: ₪${debtAmount.toFixed(2)})`;
            } else {
                // Normal reduction
                message = `تم خصم ₪${amount} من رصيد السائق: ${driver.arabicName}`;
            }

            this.toastService.success(message, 3000);
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

        this.showFiltersOnMobile.set(false);
        this.toastService.info('تمت إعادة تعيين الفلاتر', 3000);
        this.currentPage = 1;
        this.loadData();
    }

    applyFiltersOnSearch() {
        this.currentPage = 1;
        this.loadData();
    }

    applyFiltersAndToggleMobile() {
        this.applyFiltersOnSearch();
        this.toggleMobileFilters();
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

    onProfileImageSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];

            // Validate file type
            if (!file.type.startsWith('image/')) {
                this.toastService.error('الرجاء اختيار ملف صورة صحيح');
                return;
            }

            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                this.toastService.error('حجم الصورة يجب أن لا يتجاوز 2 ميجابايت');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                if (e.target?.result) {
                    this.editDriver.profileImageUrl = e.target.result as string;
                }
            };
            reader.readAsDataURL(file);
        }
    }

    removeProfileImage(): void {
        this.editDriver.profileImageUrl = '';
    }

    /**
     * Get simplified balance display for admin view
     * Shows single net amount instead of separate receivable/payable
     * Positive = Collect from driver (red)
     * Negative = Pay to driver (green)
     */
    getDriverBalanceDisplay(driver: Driver): {
        amount: number;
        label: string;
        colorClass: string;
        action: 'collect' | 'pay' | 'settled';
    } {
        const receivable = driver.amountReceivable || 0;
        const payable = driver.amountPayable || 0;
        const netAmount = payable - receivable;

        if (netAmount > 0) {
            return {
                amount: netAmount,
                label: 'اجمع من السائق',  // Collect from driver
                colorClass: 'text-danger',
                action: 'collect'
            };
        } else if (netAmount < 0) {
            return {
                amount: Math.abs(netAmount),
                label: 'ادفع للسائق',  // Pay to driver
                colorClass: 'text-success',
                action: 'pay'
            };
        } else {
            return {
                amount: 0,
                label: 'محسوب',  // Settled
                colorClass: 'text-muted',
                action: 'settled'
            };
        }
    }

    /**
     * Show payment modal (driver pays company)
     */
    recordPayment(driver: Driver): void {
        const balanceInfo = this.getDriverBalanceDisplay(driver);
        if (balanceInfo.action !== 'collect') {
            this.toastService.error('السائق لا يملك مبلغ مستحق للشركة');
            return;
        }

        this.driverForPayment.set(driver);
        this.paymentAmount.set(balanceInfo.amount);
        this.isPaymentModalOpen.set(true);
    }

    /**
     * Confirm and process payment from driver
     */
    confirmRecordPayment(): void {
        const driver = this.driverForPayment();
        const amount = this.paymentAmount();

        if (!driver || !amount || amount <= 0) {
            this.toastService.error('الرجاء إدخال مبلغ صحيح');
            return;
        }

        this.driverService.recordPayment(driver.id, amount, 'دفع من السائق للشركة').subscribe({
            next: () => {
                this.toastService.success(`تم تسجيل دفع من ${driver.arabicName}: ₪${amount.toFixed(2)}`, 3000);
                this.closePaymentModal();
                this.loadData();
            },
            error: (error: any) => {
                console.error('Error recording payment:', error);
                this.toastService.error('فشلت عملية تسجيل الدفع');
            }
        });
    }

    /**
     * Close payment modal
     */
    closePaymentModal(): void {
        this.isPaymentModalOpen.set(false);
        this.driverForPayment.set(null);
        this.paymentAmount.set(0);
    }

    /**
     * Show expense modal (company pays driver)
     */
    recordExpense(driver: Driver): void {
        const balanceInfo = this.getDriverBalanceDisplay(driver);
        if (balanceInfo.action !== 'pay') {
            this.toastService.error('الشركة لا تملك مبلغ مستحق للسائق');
            return;
        }

        this.driverForExpense.set(driver);
        this.expenseAmount.set(balanceInfo.amount);
        this.expenseDescription.set('');
        this.isExpenseModalOpen.set(true);
    }

    /**
     * Confirm and process expense to driver
     */
    confirmRecordExpense(): void {
        const driver = this.driverForExpense();
        const amount = this.expenseAmount();
        const description = this.expenseDescription();

        if (!driver || !amount || amount <= 0) {
            this.toastService.error('الرجاء إدخال مبلغ صحيح');
            return;
        }

        if (!description || description.trim() === '') {
            this.toastService.error('الرجاء إدخال وصف للعملية');
            return;
        }

        this.driverService.recordExpense(driver.id, amount, description).subscribe({
            next: () => {
                this.toastService.success(`تم صرف مبلغ لـ ${driver.arabicName}: ₪${amount.toFixed(2)}`, 3000);
                this.closeExpenseModal();
                this.loadData();
            },
            error: (error: any) => {
                console.error('Error recording expense:', error);
                this.toastService.error('فشلت عملية صرف المبلغ');
            }
        });
    }

    /**
     * Close expense modal
     */
    closeExpenseModal(): void {
        this.isExpenseModalOpen.set(false);
        this.driverForExpense.set(null);
        this.expenseAmount.set(0);
        this.expenseDescription.set('');
    }

    /**
     * Show clear balance confirmation
     */
    clearIndividualBalance(driver: Driver): void {
        this.driverForClearBalance.set(driver);
        this.confirmationModalConfig.set({
            type: 'warning',
            title: 'تأكيد تصفية الحساب',
            message: `هل أنت متأكد من تصفية حساب السائق ${driver.arabicName}؟<br>سيتم مسح جميع المبالغ المستحقة والمدفوعات.`,
            confirmButtonText: 'تصفية الحساب',
            cancelButtonText: 'إلغاء',
            highlightedText: driver.arabicName
        });
        this.isClearBalanceModalOpen.set(true);
    }

    /**
     * Confirm and clear driver balance
     */
    confirmClearBalance(): void {
        const driver = this.driverForClearBalance();
        if (!driver) return;

        this.driverService.clearBalance(driver.id, 'تصفية حساب من قبل المسؤول').subscribe({
            next: () => {
                this.toastService.success(`تم تصفية حساب السائق: ${driver.arabicName}`, 3000);
                this.closeClearBalanceModal();
                this.loadData();
            },
            error: (error: any) => {
                console.error('Error clearing balance:', error);
                this.toastService.error('فشلت عملية تصفية الحساب');
            }
        });
    }

    /**
     * Close clear balance modal
     */
    closeClearBalanceModal(): void {
        this.isClearBalanceModalOpen.set(false);
        this.driverForClearBalance.set(null);
    }
}