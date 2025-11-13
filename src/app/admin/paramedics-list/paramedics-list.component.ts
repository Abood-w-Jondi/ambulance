import { Component, signal, ChangeDetectionStrategy, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GlobalVarsService } from '../../global-vars.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../shared/services/toast.service';
import { ValidationService } from '../../shared/services/validation.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { ConfirmationModalComponent, ConfirmationModalConfig } from '../../shared/confirmation-modal/confirmation-modal.component';
import { Paramedic, ParamedicFilterStatus } from '../../shared/models';

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

    constructor(
        private globalVarsService: GlobalVarsService,
        private route: ActivatedRoute,
        private router: Router,
        private toastService: ToastService,
        private validationService: ValidationService
    ) {
        this.globalVarsService.setGlobalHeader('المسعفون');
    }

    viewUserProfile(paramedic: Paramedic) {
        // Navigate to the profile page with the paramedic's ID
        this.router.navigate(['/admin/profile', paramedic.id]);
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

    private generateId(): string {
        return Date.now().toString() + Math.random().toString(36).substring(2, 9);
    }

    paramedics = signal<Paramedic[]>([
        {
            id: this.generateId(),
            name: 'Ahmad Hassan',
            arabicName: 'أحمد حسن',
            username: 'ahassan',
            email: 'ahmad.hassan@example.com',
            arabicStatus: 'متاح',
            statusColor: '#10B981',
            tripsToday: 6,
            amountOwed: 180.50,
            isAccountCleared: false,
            isActive: true,
            imageUrl: 'https://placehold.co/56x56/10B981/ffffff?text=AH',
            imageAlt: 'صورة ملف تعريف أحمد حسن',
        },
        {
            id: this.generateId(),
            name: 'Sarah Mohammed',
            arabicName: 'سارة محمد',
            username: 'smohammed',
            email: '',
            arabicStatus: 'في رحلة',
            statusColor: '#3B82F6',
            tripsToday: 4,
            amountOwed: 120.00,
            isAccountCleared: false,
            isActive: true,
            imageUrl: 'https://placehold.co/56x56/3B82F6/ffffff?text=SM',
            imageAlt: 'صورة ملف تعريف سارة محمد',
        },
        {
            id: this.generateId(),
            name: 'Fatima Ali',
            arabicName: 'فاطمة علي',
            username: '',
            email: 'fatima.ali@example.com',
            arabicStatus: 'متاح',
            statusColor: '#10B981',
            tripsToday: 9,
            amountOwed: 275.25,
            isAccountCleared: false,
            isActive: true,
            imageUrl: 'https://placehold.co/56x56/10B981/ffffff?text=FA',
            imageAlt: 'صورة ملف تعريف فاطمة علي',
        },
        {
            id: this.generateId(),
            name: 'Omar Khalil',
            arabicName: 'عمر خليل',
            username: 'okhalil',
            email: 'omar.k@example.com',
            arabicStatus: 'في إجازة',
            statusColor: '#F59E0B',
            tripsToday: 0,
            amountOwed: 0.00,
            isAccountCleared: true,
            isActive: false,
            imageUrl: 'https://placehold.co/56x56/F59E0B/ffffff?text=OK',
            imageAlt: 'صورة ملف تعريف عمر خليل',
        },
    ]);

    filteredParamedics = computed(() => {
        let paramedicsList = this.paramedics();
        const term = this.searchTerm().toLowerCase().trim();
        const status = this.filterStatus();
        const min = this.minOwed();
        const max = this.maxOwed();

        if (term) {
            paramedicsList = paramedicsList.filter(p =>
                p.arabicName.toLowerCase().includes(term) ||
                p.name.toLowerCase().includes(term) ||
                (p.email && p.email.toLowerCase().includes(term)) ||
                (p.username && p.username.toLowerCase().includes(term))
            );
        }

        if (status !== 'all') {
            paramedicsList = paramedicsList.filter(p => p.arabicStatus === status);
        }

        if (min !== null && !isNaN(min)) {
            paramedicsList = paramedicsList.filter(p => p.amountOwed >= min!);
        }
        if (max !== null && !isNaN(max)) {
            paramedicsList = paramedicsList.filter(p => p.amountOwed <= max!);
        }

        return paramedicsList;
    });

    getPaginatedParamedics(): Paramedic[] {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.filteredParamedics().slice(startIndex, endIndex);
    }

    onPageChange(page: number): void {
        this.currentPage = page;
    }

    onItemsPerPageChange(itemsPerPage: number): void {
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1;
    }

    addNewParamedic() {
        const validation = this.validationService.validateDriver(this.newParamedic);

        if (!validation.valid) {
            validation.errors.forEach(error => {
                this.toastService.error(error);
            });
            return;
        }

        const newParamedic: Paramedic = {
            id: this.generateId(),
            arabicName: this.newParamedic.arabicName,
            name: this.newParamedic.name,
            username: this.newParamedic.username || undefined,
            email: this.newParamedic.email || undefined,
            arabicStatus: 'غير متصل',
            statusColor: '#6B7280',
            tripsToday: this.newParamedic.tripsToday,
            amountOwed: this.newParamedic.amountOwed,
            isAccountCleared: this.newParamedic.amountOwed === 0,
            isActive: true,
            imageUrl: `https://placehold.co/56x56/9CA3AF/ffffff?text=${this.newParamedic.name.charAt(0).toUpperCase()}`,
            imageAlt: `صورة ملف تعريف ${this.newParamedic.arabicName}`,
        };

        this.paramedics.update(list => [...list, newParamedic]);
        this.toastService.success(`تمت إضافة مسعف جديد: ${newParamedic.arabicName} (${newParamedic.name})`, 3000);
        this.isAddModalOpen.set(false);
        this.newParamedic = { arabicName: '', name: '', username: '', email: '', password: '', amountOwed: 0, tripsToday: 0 };
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
            isActive: paramedic.isActive
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
            isActive: true
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

        let statusColor = '#6B7280';
        if (this.editParamedic.arabicStatus === 'متاح') {
            statusColor = '#10B981';
        } else if (this.editParamedic.arabicStatus === 'في رحلة') {
            statusColor = '#3B82F6';
        } else if (this.editParamedic.arabicStatus === 'في إجازة') {
            statusColor = '#F59E0B';
        }

        this.paramedics.update(list => list.map(p => {
            if (p.id === paramedic.id) {
                return {
                    ...p,
                    arabicName: this.editParamedic.arabicName,
                    name: this.editParamedic.name,
                    username: this.editParamedic.username || undefined,
                    email: this.editParamedic.email || undefined,
                    arabicStatus: this.editParamedic.arabicStatus,
                    statusColor: statusColor,
                    tripsToday: this.editParamedic.tripsToday,
                    amountOwed: this.editParamedic.amountOwed,
                    isAccountCleared: this.editParamedic.amountOwed === 0,
                    isActive: this.editParamedic.isActive
                };
            }
            return p;
        }));

        if (this.editParamedic.newPassword && this.editParamedic.newPassword.trim() !== '') {
            this.toastService.info(`تم تغيير كلمة مرور المسعف: ${this.editParamedic.arabicName}`, 3000);
        }

        this.toastService.info(`تم تعديل بيانات المسعف: ${this.editParamedic.arabicName} (${this.editParamedic.name})`, 3000);
        this.closeEditModal();
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
            this.paramedics.update(list => list.filter(p => p.id !== paramedic.id));
            this.toastService.success(`تم حذف المسعف: ${paramedic.arabicName} (${paramedic.name})`, 3000);
            this.closeDeleteConfirmation();
        }
        this.isEditModalOpen.set(false);
    }

    clearIndividualBalance(paramedic: Paramedic) {
        this.paramedics.update(list => list.map(p => {
            if (p.id === paramedic.id) {
                return {
                    ...p,
                    amountOwed: 0.00,
                    isAccountCleared: true
                };
            }
            return p;
        }));
        delete this.reductionAmounts[paramedic.id];
        this.toastService.success(`تم تصفير الرصيد للمسعف: ${paramedic.arabicName}`, 3000);
    }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            if (params['filterValue']) {
                this.queryFilterValue.set(params['filterValue']);
                this.searchTermValue = this.queryFilterValue() || '';
                this.searchTerm.set(this.searchTermValue);
            }
        });
    }

    reduceBalance(paramedic: Paramedic, amount: number) {
        const validation = this.validationService.validateBalanceReduction(amount, paramedic.amountOwed);

        if (!validation.valid) {
            validation.errors.forEach(error => {
                this.toastService.error(error);
            });
            return;
        }

        const updatedParamedics = this.paramedics().map(p => {
            if (p.id === paramedic.id) {
                const newAmount = Math.round((paramedic.amountOwed - amount) * 100) / 100;
                return {
                    ...p,
                    amountOwed: Math.max(0, newAmount),
                    isAccountCleared: newAmount <= 0.001
                };
            }
            return p;
        });

        this.paramedics.set(updatedParamedics);
        delete this.reductionAmounts[paramedic.id];
        this.toastService.info(`تم خصم ₪${amount} من رصيد المسعف: ${paramedic.arabicName}`, 3000);
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
    }

    getStatusOptions(): Array<'متاح' | 'في رحلة' | 'غير متصل' | 'في إجازة'> {
        return ['متاح', 'في رحلة', 'غير متصل', 'في إجازة'];
    }

    isAddFormValid(): boolean {
        return !!(
            this.newParamedic.arabicName &&
            this.newParamedic.name &&
            this.newParamedic.password &&
            (this.newParamedic.username || this.newParamedic.email)
        );
    }

    isEditFormValid(): boolean {
        return !!(
            this.editParamedic.arabicName &&
            this.editParamedic.name &&
            (this.editParamedic.username || this.editParamedic.email)
        );
    }
}
