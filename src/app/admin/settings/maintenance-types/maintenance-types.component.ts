import { Component, signal, ChangeDetectionStrategy, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GlobalVarsService } from '../../../global-vars.service';
import { ToastService } from '../../../shared/services/toast.service';
import { MaintenanceTypeService } from '../../../shared/services/maintenance-type.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { MaintenanceTypeConfig } from '../../../shared/models';

@Component({
    selector: 'app-maintenance-types',
    standalone: true,
    imports: [CommonModule, FormsModule, PaginationComponent],
    templateUrl: './maintenance-types.component.html',
    styleUrl: './maintenance-types.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenanceTypesComponent implements OnInit {
    // State
    searchTerm = signal('');
    isAddModalOpen = signal(false);
    isEditModalOpen = signal(false);
    selectedType = signal<MaintenanceTypeConfig | null>(null);
    isLoading = signal(false);

    // Form
    typeForm = {
        name: '',
        description: '',
        estimatedCost: 0,
        estimatedDuration: 0,
        isActive: true
    };

    // Data
    maintenanceTypes = signal<MaintenanceTypeConfig[]>([]);

    // Pagination
    currentPage = 1;
    itemsPerPage = 12; // 3 rows × 4 cards
    totalRecords = 0;

    constructor(
        private globalVars: GlobalVarsService,
        private router: Router,
        private toastService: ToastService,
        private maintenanceTypeService: MaintenanceTypeService
    ) {
        this.globalVars.setGlobalHeader('إدارة أنواع الصيانة');
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

        this.maintenanceTypeService.getMaintenanceTypes(params).subscribe({
            next: (response) => {
                this.maintenanceTypes.set(response.data);
                this.totalRecords = response.total;
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading maintenance types:', error);
                this.toastService.error('فشل تحميل أنواع الصيانة');
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

    openEditModal(type: MaintenanceTypeConfig): void {
        this.selectedType.set(type);
        this.typeForm = {
            name: type.name,
            description: type.description,
            estimatedCost: type.estimatedCost,
            estimatedDuration: type.estimatedDuration,
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
            estimatedCost: this.typeForm.estimatedCost,
            estimatedDuration: this.typeForm.estimatedDuration,
            isActive: this.typeForm.isActive
        };

        this.maintenanceTypeService.createMaintenanceType(newType).subscribe({
            next: () => {
                this.toastService.success('تم إضافة نوع الصيانة بنجاح');
                this.closeAddModal();
                this.loadData();
            },
            error: (error) => {
                console.error('Error creating maintenance type:', error);
                this.toastService.error('فشلت عملية إضافة نوع الصيانة');
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
            estimatedCost: this.typeForm.estimatedCost,
            estimatedDuration: this.typeForm.estimatedDuration,
            isActive: this.typeForm.isActive
        };

        this.maintenanceTypeService.updateMaintenanceType(selected.id, updateData).subscribe({
            next: () => {
                this.toastService.success('تم تحديث نوع الصيانة بنجاح');
                this.closeEditModal();
                this.loadData();
            },
            error: (error) => {
                console.error('Error updating maintenance type:', error);
                this.toastService.error('فشلت عملية تحديث نوع الصيانة');
            }
        });
    }

    deleteType(type: MaintenanceTypeConfig): void {
        if (confirm(`هل أنت متأكد من حذف "${type.name}"؟`)) {
            this.maintenanceTypeService.deleteMaintenanceType(type.id).subscribe({
                next: () => {
                    this.toastService.success('تم حذف نوع الصيانة بنجاح');
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error deleting maintenance type:', error);
                    this.toastService.error('فشلت عملية حذف نوع الصيانة');
                }
            });
        }
    }

    toggleStatus(type: MaintenanceTypeConfig): void {
        const updateData = {
            isActive: !type.isActive
        };

        this.maintenanceTypeService.updateMaintenanceType(type.id, updateData).subscribe({
            next: () => {
                const status = !type.isActive ? 'تم تفعيل' : 'تم تعطيل';
                this.toastService.success(`${status} نوع الصيانة`);
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
            this.toastService.error('الرجاء إدخال اسم نوع الصيانة');
            return false;
        }
        if (this.typeForm.estimatedCost < 0) {
            this.toastService.error('التكلفة المتوقعة يجب أن تكون صفر أو أكثر');
            return false;
        }
        if (this.typeForm.estimatedDuration < 0) {
            this.toastService.error('المدة المتوقعة يجب أن تكون صفر أو أكثر');
            return false;
        }
        return true;
    }

    resetForm(): void {
        this.typeForm = {
            name: '',
            description: '',
            estimatedCost: 0,
            estimatedDuration: 0,
            isActive: true
        };
    }

    goBack(): void {
        this.router.navigate(['/admin/admin-dashboard']);
    }
}
