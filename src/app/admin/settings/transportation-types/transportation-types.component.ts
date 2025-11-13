import { Component, signal, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GlobalVarsService } from '../../../global-vars.service';
import { ToastService } from '../../../shared/services/toast.service';
import { TransportationTypeConfig } from '../../../shared/models';

@Component({
    selector: 'app-transportation-types',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './transportation-types.component.html',
    styleUrl: './transportation-types.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransportationTypesComponent {
    // State
    searchTerm = signal('');
    isAddModalOpen = signal(false);
    isEditModalOpen = signal(false);
    selectedType = signal<TransportationTypeConfig | null>(null);

    // Form
    typeForm = {
        name: '',
        description: '',
        isActive: true
    };

    // Data
    transportationTypes = signal<TransportationTypeConfig[]>([
        {
            id: '1',
            name: 'نقل طوارئ',
            description: 'نقل حالات الطوارئ الطبية العاجلة',
            isActive: true,
            createdAt: new Date('2024-01-15')
        },
        {
            id: '2',
            name: 'نقل عادي',
            description: 'نقل المرضى للمواعيد الطبية والفحوصات',
            isActive: true,
            createdAt: new Date('2024-01-15')
        },
        {
            id: '3',
            name: 'نقل حالات حرجة',
            description: 'نقل الحالات الحرجة بين المستشفيات',
            isActive: true,
            createdAt: new Date('2024-01-20')
        },
        {
            id: '4',
            name: 'نقل ولادة',
            description: 'نقل حالات الولادة الطارئة',
            isActive: true,
            createdAt: new Date('2024-02-01')
        },
        {
            id: '5',
            name: 'نقل كسور',
            description: 'نقل حالات الكسور والإصابات',
            isActive: true,
            createdAt: new Date('2024-02-10')
        }
    ]);

    // Computed
    filteredTypes = computed(() => {
        const term = this.searchTerm().toLowerCase().trim();
        if (!term) return this.transportationTypes();

        return this.transportationTypes().filter(type =>
            type.name.toLowerCase().includes(term) ||
            type.description.toLowerCase().includes(term)
        );
    });

    constructor(
        private globalVars: GlobalVarsService,
        private router: Router,
        private toastService: ToastService
    ) {
        this.globalVars.setGlobalHeader('إدارة أنواع النقليات');
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

        const newType: TransportationTypeConfig = {
            id: Date.now().toString(),
            name: this.typeForm.name,
            description: this.typeForm.description,
            isActive: this.typeForm.isActive,
            createdAt: new Date()
        };

        this.transportationTypes.update(types => [...types, newType]);
        this.toastService.success('تم إضافة نوع النقل بنجاح');
        this.closeAddModal();
    }

    updateType(): void {
        if (!this.validateForm()) return;

        const selected = this.selectedType();
        if (!selected) return;

        this.transportationTypes.update(types =>
            types.map(type =>
                type.id === selected.id
                    ? {
                        ...type,
                        name: this.typeForm.name,
                        description: this.typeForm.description,
                        isActive: this.typeForm.isActive
                    }
                    : type
            )
        );

        this.toastService.success('تم تحديث نوع النقل بنجاح');
        this.closeEditModal();
    }

    deleteType(type: TransportationTypeConfig): void {
        if (confirm(`هل أنت متأكد من حذف "${type.name}"؟`)) {
            this.transportationTypes.update(types =>
                types.filter(t => t.id !== type.id)
            );
            this.toastService.success('تم حذف نوع النقل بنجاح');
        }
    }

    toggleStatus(type: TransportationTypeConfig): void {
        this.transportationTypes.update(types =>
            types.map(t =>
                t.id === type.id
                    ? { ...t, isActive: !t.isActive }
                    : t
            )
        );
        const status = !type.isActive ? 'تم تفعيل' : 'تم تعطيل';
        this.toastService.success(`${status} نوع النقل`);
    }

    // Validation
    validateForm(): boolean {
        if (!this.typeForm.name.trim()) {
            this.toastService.error('الرجاء إدخال اسم نوع النقل');
            return false;
        }
        if (!this.typeForm.description.trim()) {
            this.toastService.error('الرجاء إدخال وصف نوع النقل');
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
