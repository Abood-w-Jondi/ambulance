import { Component, signal, ChangeDetectionStrategy, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GlobalVarsService } from '../../global-vars.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../shared/services/toast.service';
import { ValidationService } from '../../shared/services/validation.service';
import { ParamedicService } from '../../shared/services/paramedic.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { ConfirmationModalComponent, ConfirmationModalConfig } from '../../shared/confirmation-modal/confirmation-modal.component';
import { Paramedic, ParamedicFilterStatus, EducationLevel } from '../../shared/models';

type FilterStatus = ParamedicFilterStatus;

@Component({
    selector: 'app-paramedics-list',
    imports: [CommonModule, FormsModule, PaginationComponent, StatusBadgeComponent, ConfirmationModalComponent],
    templateUrl: './paramedics-list.component.html',
    styleUrl: './paramedics-list.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParamedicsListComponent implements OnInit {
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
        private paramedicService: ParamedicService
    ) {
        this.globalVarsService.setGlobalHeader('المسعفون');
    }

    viewUserProfile(paramedic: Paramedic) {
        // Navigate to the profile page with the paramedic's ID
        this.router.navigate(['/admin/profile', paramedic.id]);
    }

    viewTransactionHistory(paramedic: Paramedic) {
        // Navigate to the transaction history page with the paramedic's ID
        this.router.navigate(['/admin/transactions', paramedic.id], {
            queryParams: { type: 'paramedic', name: paramedic.arabicName }
        });
    }

    showFiltersOnMobile = signal(false);
    searchTerm = signal('');
    filterStatus = signal<FilterStatus>('all');
    minOwed = signal<number | null>(null);
    maxOwed = signal<number | null>(null);

    isAddModalOpen = signal(false);
    isEditModalOpen = signal(false);
    isDeleteModalOpen = signal(false);
    paramedicToEdit = signal<Paramedic | null>(null);
    paramedicToDelete = signal<Paramedic | null>(null);

    // Confirmation modal state
    confirmationModalConfig = signal<ConfirmationModalConfig>({
        type: 'delete',
        title: '',
        message: '',
        confirmButtonText: '',
        cancelButtonText: 'إلغاء'
    });

    newParamedic: {
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

    editParamedic: {
        arabicName: string;
        name: string;
        username: string;
        email: string;
        arabicStatus: 'متاح' | 'في رحلة' | 'غير متصل' | 'في إجازة';
        tripsToday: number;
        amountOwed: number;
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
        amountOwed: 0,
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

    paramedics = signal<Paramedic[]>([]);

    filteredParamedics = computed(() => {
        return this.paramedics();
    });

    getPaginatedParamedics(): Paramedic[] {
        return this.paramedics();
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

        this.paramedicService.getParamedics({
            page: this.currentPage,
            limit: this.itemsPerPage,
            search: this.searchTerm() || undefined,
            status: this.filterStatus() !== 'all' ? this.filterStatus() as any : undefined,
            minOwed: this.minOwed() || undefined,
            maxOwed: this.maxOwed() || undefined
        }).subscribe({
            next: (response) => {
                this.paramedics.set(response.data);
                this.totalRecords = response.total;
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading paramedics:', error);
                this.toastService.error('فشل تحميل بيانات المسعفين');
                this.isLoading.set(false);
            }
        });
    }

    addNewParamedic() {
        const validation = this.validationService.validateDriver(this.newParamedic);

        if (!validation.valid) {
            validation.errors.forEach(error => {
                this.toastService.error(error);
            });
            return;
        }

        this.paramedicService.createParamedic({
            arabicName: this.newParamedic.arabicName,
            name: this.newParamedic.name,
            username: this.newParamedic.username || undefined,
            email: this.newParamedic.email || undefined,
            password: this.newParamedic.password,
            amountOwed: this.newParamedic.amountOwed || 0,
            tripsToday: this.newParamedic.tripsToday || 0
        } as any).subscribe({
            next: (paramedic) => {
                this.toastService.success(`تمت إضافة مسعف جديد: ${paramedic.arabicName} (${paramedic.name})`, 3000);
                this.isAddModalOpen.set(false);
                this.newParamedic = { arabicName: '', name: '', username: '', email: '', password: '', amountOwed: 0, tripsToday: 0 };
                this.loadData();
            },
            error: (error) => {
                console.error('Error creating paramedic:', error);
                this.toastService.error('فشلت عملية إضافة المسعف');
            }
        });
    }

    openEditModal(paramedic: Paramedic) {
        this.paramedicToEdit.set(paramedic);
        this.editParamedic = {
            arabicName: paramedic.arabicName,
            name: paramedic.name,
            username: paramedic.username || '',
            email: paramedic.email || '',
            arabicStatus: paramedic.arabicStatus,
            tripsToday: paramedic.tripsToday,
            amountOwed: paramedic.amountOwed,
            newPassword: '',
            isActive: paramedic.isActive,
            jobTitle: paramedic.jobTitle || '',
            educationLevel: paramedic.educationLevel || '',
            phoneNumber: paramedic.phoneNumber || '',
            profileImageUrl: paramedic.profileImageUrl || ''
        };
        this.isEditModalOpen.set(true);
    }

    closeEditModal() {
        this.paramedicToEdit.set(null);
        this.isEditModalOpen.set(false);
        this.editParamedic = {
            arabicName: '',
            name: '',
            username: '',
            email: '',
            arabicStatus: 'متاح',
            tripsToday: 0,
            amountOwed: 0,
            newPassword: '',
            isActive: true,
            jobTitle: '',
            educationLevel: '',
            phoneNumber: '',
            profileImageUrl: ''
        };
    }

    saveEditParamedic() {
        const paramedic = this.paramedicToEdit();
        if (!paramedic) return;

        const validation = this.validationService.validateDriver(this.editParamedic);

        if (!validation.valid) {
            validation.errors.forEach(error => {
                this.toastService.error(error);
            });
            return;
        }

        const updateData: any = {
            arabicName: this.editParamedic.arabicName,
            name: this.editParamedic.name,
            username: this.editParamedic.username || undefined,
            email: this.editParamedic.email || undefined,
            arabicStatus: this.editParamedic.arabicStatus,
            tripsToday: this.editParamedic.tripsToday,
            amountOwed: this.editParamedic.amountOwed,
            isActive: this.editParamedic.isActive,
            jobTitle: this.editParamedic.jobTitle || undefined,
            educationLevel: this.editParamedic.educationLevel || undefined,
            phoneNumber: this.editParamedic.phoneNumber || undefined,
            profileImageUrl: this.editParamedic.profileImageUrl || undefined
        };

        if (this.editParamedic.newPassword && this.editParamedic.newPassword.trim() !== '') {
            updateData.password = this.editParamedic.newPassword;
        }

        this.paramedicService.updateParamedic(paramedic.id, updateData).subscribe({
            next: (updatedParamedic) => {
                // Merge: old paramedic -> updated data from form -> API response
                // This ensures form changes are visible even if API returns partial data
                const mergedParamedic = {
                    ...paramedic,
                    ...updateData,
                    ...(updatedParamedic && Object.keys(updatedParamedic).length > 0 ? updatedParamedic : {}),
                    id: paramedic.id // Always preserve the ID
                };
                this.paramedicToEdit.set(mergedParamedic);
                this.toastService.info(`تم تعديل بيانات المسعف: ${this.editParamedic.arabicName} (${this.editParamedic.name})`, 3000);
                if (this.editParamedic.newPassword && this.editParamedic.newPassword.trim() !== '') {
                    this.toastService.info(`تم تغيير كلمة مرور المسعف: ${this.editParamedic.arabicName}`, 3000);
                }
                this.closeEditModal();
                this.loadData();
            },
            error: (error) => {
                console.error('Error updating paramedic:', error);
                this.toastService.error('فشلت عملية تعديل المسعف');
            }
        });
    }

    showDeleteConfirmation(paramedic: Paramedic) {
        this.paramedicToDelete.set(paramedic);
        this.confirmationModalConfig.set({
            type: 'delete',
            title: 'تأكيد حذف المسعف',
            message: `هل أنت متأكد من أنك تريد حذف حساب المسعف ${paramedic.arabicName}؟<br>لا يمكن التراجع عن هذا الإجراء.`,
            confirmButtonText: 'حذف',
            cancelButtonText: 'إلغاء',
            highlightedText: paramedic.arabicName
        });
        this.isDeleteModalOpen.set(true);
    }

    closeDeleteConfirmation() {
        this.paramedicToDelete.set(null);
        this.isDeleteModalOpen.set(false);
    }

    confirmDeleteParamedic() {
        const paramedic = this.paramedicToDelete();
        if (paramedic) {
            this.paramedicService.deleteParamedic(paramedic.id).subscribe({
                next: () => {
                    this.toastService.success(`تم حذف المسعف: ${paramedic.arabicName} (${paramedic.name})`, 3000);
                    this.closeDeleteConfirmation();
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error deleting paramedic:', error);
                    this.toastService.error('فشلت عملية حذف المسعف');
                }
            });
        }
        this.isEditModalOpen.set(false);
    }

    clearIndividualBalance(paramedic: Paramedic) {
        this.paramedicService.clearBalance(paramedic.id).subscribe({
            next: () => {
                delete this.reductionAmounts[paramedic.id];
                this.toastService.success(`تم تصفير الرصيد للمسعف: ${paramedic.arabicName}`, 3000);
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
                this.searchTerm.set(params['filterValue']);
            }
        });
        this.loadData();
    }

    reduceBalance(paramedic: Paramedic, amount: number) {
        const validation = this.validationService.validateBalanceReduction(amount, paramedic.amountOwed);

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

        this.paramedicService.reduceBalance(paramedic.id, amount).subscribe({
            next: () => {
                delete this.reductionAmounts[paramedic.id];

                let message: string;
                if (amount > paramedic.amountOwed) {
                    // Overpayment - creates debt (they owe company)
                    const debtAmount = amount - paramedic.amountOwed;
                    message = `تم الدفع وتسجيل دين للمسعف: ${paramedic.arabicName} (دين: ₪${debtAmount.toFixed(2)})`;
                } else {
                    // Normal reduction
                    message = `تم خصم ₪${amount} من رصيد المسعف: ${paramedic.arabicName}`;
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
        this.minOwed.set(null);
        this.maxOwed.set(null);

        this.showFiltersOnMobile.set(false);
        this.toastService.info('تمت إعادة تعيين الفلاتر', 3000);
        this.currentPage = 1;
        this.loadData();
    }

    applyFiltersOnSearch() {
        this.currentPage = 1;
        this.loadData();
    }

    getStatusOptions(): Array<'متاح' | 'في رحلة' | 'غير متصل' | 'في إجازة'> {
        return ['متاح', 'في رحلة', 'غير متصل', 'في إجازة'];
    }

    isAddFormValid(): boolean {
        return !!(
            this.newParamedic.arabicName &&
            this.newParamedic.password &&
            (this.newParamedic.username || this.newParamedic.email)
        );
    }

    isEditFormValid(): boolean {
        return !!(
            this.editParamedic.arabicName &&
            (this.editParamedic.username || this.editParamedic.email)
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
                    this.editParamedic.profileImageUrl = e.target.result as string;
                }
            };
            reader.readAsDataURL(file);
        }
    }

    removeProfileImage(): void {
        this.editParamedic.profileImageUrl = '';
    }
}
