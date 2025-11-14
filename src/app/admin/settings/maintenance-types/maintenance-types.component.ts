import { Component, signal, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GlobalVarsService } from '../../../global-vars.service';
import { ToastService } from '../../../shared/services/toast.service';
import { MaintenanceTypeConfig } from '../../../shared/models';

@Component({
    selector: 'app-maintenance-types',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './maintenance-types.component.html',
    styleUrl: './maintenance-types.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenanceTypesComponent {
    // State
    searchTerm = signal('');
    isAddModalOpen = signal(false);
    isEditModalOpen = signal(false);
    selectedType = signal<MaintenanceTypeConfig | null>(null);

    // Form
    typeForm = {
        name: '',
        description: '',
        estimatedCost: 0,
        estimatedDuration: 0,
        isActive: true
    };

    // Data
    maintenanceTypes = signal<MaintenanceTypeConfig[]>([
        {
            id: '1',
            name: 'صيانة دورية',
            description: 'الفحص والصيانة الدورية للمركبة',
            estimatedCost: 500,
            estimatedDuration: 4,
            isActive: true,
            createdAt: new Date('2024-01-15')
        },
        {
            id: '2',
            name: 'تغيير زيت',
            description: 'تغيير زيت المحرك والفلاتر',
            estimatedCost: 200,
            estimatedDuration: 1,
            isActive: true,
            createdAt: new Date('2024-01-15')
        },
        {
            id: '3',
            name: 'فحص الفرامل',
            description: 'فحص وصيانة نظام الفرامل',
            estimatedCost: 300,
            estimatedDuration: 2,
            isActive: true,
            createdAt: new Date('2024-01-20')
        },
        {
            id: '4',
            name: 'تبديل إطارات',
            description: 'تبديل إطارات المركبة',
            estimatedCost: 800,
            estimatedDuration: 2,
            isActive: true,
            createdAt: new Date('2024-02-01')
        },
        {
            id: '5',
            name: 'فحص كهرباء',
            description: 'فحص النظام الكهربائي للمركبة',
            estimatedCost: 250,
            estimatedDuration: 3,
            isActive: true,
            createdAt: new Date('2024-02-05')
        },
        {
            id: '6',
            name: 'صيانة مكيف',
            description: 'فحص وصيانة نظام التكييف',
            estimatedCost: 350,
            estimatedDuration: 2,
            isActive: true,
            createdAt: new Date('2024-02-10')
        }
    ]);

    // Computed
    filteredTypes = computed(() => {
        const term = this.searchTerm().toLowerCase().trim();
        if (!term) return this.maintenanceTypes();

        return this.maintenanceTypes().filter(type =>
            type.name.toLowerCase().includes(term) ||
            type.description.toLowerCase().includes(term)
        );
    });

    constructor(
        private globalVars: GlobalVarsService,
        private router: Router,
        private toastService: ToastService
    ) {
        this.globalVars.setGlobalHeader('إدارة أنواع الصيانة');
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

        const newType: MaintenanceTypeConfig = {
            id: Date.now().toString(),
            name: this.typeForm.name,
            description: this.typeForm.description,
            estimatedCost: this.typeForm.estimatedCost,
            estimatedDuration: this.typeForm.estimatedDuration,
            isActive: this.typeForm.isActive,
            createdAt: new Date()
        };

        this.maintenanceTypes.update(types => [...types, newType]);
        this.toastService.success('تم إضافة نوع الصيانة بنجاح');
        this.closeAddModal();
    }

    updateType(): void {
        if (!this.validateForm()) return;

        const selected = this.selectedType();
        if (!selected) return;

        this.maintenanceTypes.update(types =>
            types.map(type =>
                type.id === selected.id
                    ? {
                        ...type,
                        name: this.typeForm.name,
                        description: this.typeForm.description,
                        estimatedCost: this.typeForm.estimatedCost,
                        estimatedDuration: this.typeForm.estimatedDuration,
                        isActive: this.typeForm.isActive
                    }
                    : type
            )
        );

        this.toastService.success('تم تحديث نوع الصيانة بنجاح');
        this.closeEditModal();
    }

    deleteType(type: MaintenanceTypeConfig): void {
        if (confirm(`هل أنت متأكد من حذف "${type.name}"؟`)) {
            this.maintenanceTypes.update(types =>
                types.filter(t => t.id !== type.id)
            );
            this.toastService.success('تم حذف نوع الصيانة بنجاح');
        }
    }

    toggleStatus(type: MaintenanceTypeConfig): void {
        this.maintenanceTypes.update(types =>
            types.map(t =>
                t.id === type.id
                    ? { ...t, isActive: !t.isActive }
                    : t
            )
        );
        const status = !type.isActive ? 'تم تفعيل' : 'تم تعطيل';
        this.toastService.success(`${status} نوع الصيانة`);
    }

    // Validation
    validateForm(): boolean {
        if (!this.typeForm.name.trim()) {
            this.toastService.error('الرجاء إدخال اسم نوع الصيانة');
            return false;
        }
        if (!this.typeForm.description.trim()) {
            this.toastService.error('الرجاء إدخال وصف نوع الصيانة');
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
