import { Component, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GlobalVarsService } from '../../../global-vars.service';
import { ToastService } from '../../../shared/services/toast.service';
import { TransportationTypeService } from '../../../shared/services/transportation-type.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { TransportationTypeConfig } from '../../../shared/models';

@Component({
    selector: 'app-transportation-types',
    standalone: true,
    imports: [CommonModule, FormsModule, PaginationComponent],
    templateUrl: './transportation-types.component.html',
    styleUrl: './transportation-types.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransportationTypesComponent implements OnInit {
    // State
    searchTerm = signal('');
    isAddModalOpen = signal(false);
    isEditModalOpen = signal(false);
    selectedType = signal<TransportationTypeConfig | null>(null);
    isLoading = signal(false);

    // Form
    typeForm = {
        name: '',
        description: '',
        isActive: true
    };

    // Data
    transportationTypes = signal<TransportationTypeConfig[]>([]);

    // Pagination
    currentPage = 1;
    itemsPerPage = 12; // 3 rows × 4 cards
    totalRecords = 0;

    constructor(
        private globalVars: GlobalVarsService,
        private router: Router,
        private toastService: ToastService,
        private transportationTypeService: TransportationTypeService
    ) {
        this.globalVars.setGlobalHeader('إدارة أنواع النقليات');
    }

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.isLoading.set(true);

        const params: any = {
            page: this.currentPage,
            limit: this.itemsPerPage
        };

        this.transportationTypeService.getTransportationTypes(params).subscribe({
            next: (response) => {
                this.transportationTypes.set(response.data);
                this.totalRecords = response.total;
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading transportation types:', error);
                this.toastService.error('فشل تحميل أنواع النقليات');
                this.isLoading.set(false);
            }
        });
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

    // Modal methods
    openAddModal(): void {
        this.resetForm();
        this.isAddModalOpen.set(true);
    }

    closeAddModal(): void {
        this.isAddModalOpen.set(false);
        this.resetForm();
    }

    openEditModal(type: TransportationTypeConfig): void {
        this.selectedType.set(type);
        this.typeForm = {
            name: type.name,
            description: type.description,
            isActive: type.isActive
        };
        this.isEditModalOpen.set(true);
    }

    closeEditModal(): void {
        this.isEditModalOpen.set(false);
        this.selectedType.set(null);
        this.resetForm();
    }

    // CRUD operations
    addType(): void {
        if (!this.validateForm()) return;

        const newType = {
            name: this.typeForm.name,
            description: this.typeForm.description,
            isActive: this.typeForm.isActive
        };

        this.transportationTypeService.createTransportationType(newType).subscribe({
            next: () => {
                this.toastService.success('تم إضافة التشخيص بنجاح');
                this.closeAddModal();
                this.loadData();
            },
            error: (error) => {
                console.error('Error creating transportation type:', error);
                this.toastService.error('فشلت عملية إضافة التشخيص');
            }
        });
    }

    updateType(): void {
        if (!this.validateForm()) return;

        const selected = this.selectedType();
        if (!selected) return;

        const updateData = {
            name: this.typeForm.name,
            description: this.typeForm.description,
            isActive: this.typeForm.isActive
        };

        this.transportationTypeService.updateTransportationType(selected.id, updateData).subscribe({
            next: () => {
                this.toastService.success('تم تحديث التشخيص بنجاح');
                this.closeEditModal();
                this.loadData();
            },
            error: (error) => {
                console.error('Error updating transportation type:', error);
                this.toastService.error('فشلت عملية تحديث التشخيص');
            }
        });
    }

    deleteType(type: TransportationTypeConfig): void {
        if (confirm(`هل أنت متأكد من حذف "${type.name}"؟`)) {
            this.transportationTypeService.deleteTransportationType(type.id).subscribe({
                next: () => {
                    this.toastService.success('تم حذف التشخيص بنجاح');
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error deleting transportation type:', error);
                    this.toastService.error('فشلت عملية حذف التشخيص');
                }
            });
        }
    }

    toggleStatus(type: TransportationTypeConfig): void {
        const updateData = {
            isActive: !type.isActive
        };

        this.transportationTypeService.updateTransportationType(type.id, updateData).subscribe({
            next: () => {
                const status = !type.isActive ? 'تم تفعيل' : 'تم تعطيل';
                this.toastService.success(`${status} التشخيص`);
                this.loadData();
            },
            error: (error) => {
                console.error('Error toggling status:', error);
                this.toastService.error('فشلت عملية تحديث الحالة');
            }
        });
    }

    // Validation
    validateForm(): boolean {
        if (!this.typeForm.name.trim()) {
            this.toastService.error('الرجاء إدخال اسم التشخيص');
            return false;
        }
        return true;
    }

    resetForm(): void {
        this.typeForm = {
            name: '',
            description: '',
            isActive: true
        };
    }

    goBack(): void {
        this.router.navigate(['/admin/admin-dashboard']);
    }
}
