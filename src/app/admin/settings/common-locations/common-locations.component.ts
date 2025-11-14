import { Component, signal, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GlobalVarsService } from '../../../global-vars.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CommonLocation, LocationType } from '../../../shared/models';

@Component({
    selector: 'app-common-locations',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './common-locations.component.html',
    styleUrl: './common-locations.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonLocationsComponent {
    // State
    searchTerm = signal('');
    filterType = signal<string>('الكل');
    isAddModalOpen = signal(false);
    isEditModalOpen = signal(false);
    selectedLocation = signal<CommonLocation | null>(null);

    // Form
    locationForm = {
        name: '',
        address: '',
        city: '',
        type: 'hospital' as LocationType,
        phoneNumber: '',
        isActive: true
    };

    locationTypes = [
        { value: 'hospital' as LocationType, label: 'مستشفى' },
        { value: 'clinic' as LocationType, label: 'عيادة' },
        { value: 'emergency' as LocationType, label: 'طوارئ' },
        { value: 'other' as LocationType, label: 'أخرى' }
    ];

    filterTypes = ['الكل', 'مستشفى', 'عيادة', 'طوارئ', 'أخرى'];

    // Data
    commonLocations = signal<CommonLocation[]>([
        {
            id: '1',
            name: 'مستشفى الملك فيصل التخصصي',
            address: 'طريق الملك فهد',
            city: 'الرياض',
            type: 'hospital',
            phoneNumber: '0114647272',
            isActive: true,
            createdAt: new Date('2024-01-15')
        },
        {
            id: '2',
            name: 'مستشفى الملك خالد الجامعي',
            address: 'حي النخيل',
            city: 'الرياض',
            type: 'hospital',
            phoneNumber: '0114672222',
            isActive: true,
            createdAt: new Date('2024-01-15')
        },
        {
            id: '3',
            name: 'مركز الطوارئ المركزي',
            address: 'حي العليا',
            city: 'الرياض',
            type: 'emergency',
            phoneNumber: '0114563000',
            isActive: true,
            createdAt: new Date('2024-01-20')
        },
        {
            id: '4',
            name: 'عيادات الرعاية الأولية',
            address: 'حي الملز',
            city: 'الرياض',
            type: 'clinic',
            phoneNumber: '0114456789',
            isActive: true,
            createdAt: new Date('2024-02-01')
        },
        {
            id: '5',
            name: 'مستشفى الحرس الوطني',
            address: 'طريق الملك عبدالعزيز',
            city: 'الرياض',
            type: 'hospital',
            phoneNumber: '0118011111',
            isActive: true,
            createdAt: new Date('2024-02-05')
        }
    ]);

    // Computed
    filteredLocations = computed(() => {
        let locations = this.commonLocations();

        // Filter by type
        const type = this.filterType();
        if (type !== 'الكل') {
            const typeMap: { [key: string]: LocationType } = {
                'مستشفى': 'hospital',
                'عيادة': 'clinic',
                'طوارئ': 'emergency',
                'أخرى': 'other'
            };
            locations = locations.filter(loc => loc.type === typeMap[type]);
        }

        // Filter by search term
        const term = this.searchTerm().toLowerCase().trim();
        if (term) {
            locations = locations.filter(loc =>
                loc.name.toLowerCase().includes(term) ||
                loc.address.toLowerCase().includes(term) ||
                loc.city.toLowerCase().includes(term) ||
                loc.phoneNumber.includes(term)
            );
        }

        return locations;
    });

    constructor(
        private globalVars: GlobalVarsService,
        private router: Router,
        private toastService: ToastService
    ) {
        this.globalVars.setGlobalHeader('إدارة المواقع الشائعة');
    }

    // Helper methods
    getTypeLabel(type: LocationType): string {
        const typeMap: { [key in LocationType]: string } = {
            'hospital': 'مستشفى',
            'clinic': 'عيادة',
            'emergency': 'طوارئ',
            'other': 'أخرى'
        };
        return typeMap[type] || type;
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

    openEditModal(location: CommonLocation): void {
        this.selectedLocation.set(location);
        this.locationForm = {
            name: location.name,
            address: location.address,
            city: location.city,
            type: location.type,
            phoneNumber: location.phoneNumber,
            isActive: location.isActive
        };
        this.isEditModalOpen.set(true);
    }

    closeEditModal(): void {
        this.isEditModalOpen.set(false);
        this.selectedLocation.set(null);
        this.resetForm();
    }

    // CRUD operations
    addLocation(): void {
        if (!this.validateForm()) return;

        const newLocation: CommonLocation = {
            id: Date.now().toString(),
            name: this.locationForm.name,
            address: this.locationForm.address,
            city: this.locationForm.city,
            type: this.locationForm.type,
            phoneNumber: this.locationForm.phoneNumber,
            isActive: this.locationForm.isActive,
            createdAt: new Date()
        };

        this.commonLocations.update(locations => [...locations, newLocation]);
        this.toastService.success('تم إضافة الموقع بنجاح');
        this.closeAddModal();
    }

    updateLocation(): void {
        if (!this.validateForm()) return;

        const selected = this.selectedLocation();
        if (!selected) return;

        this.commonLocations.update(locations =>
            locations.map(location =>
                location.id === selected.id
                    ? {
                        ...location,
                        name: this.locationForm.name,
                        address: this.locationForm.address,
                        city: this.locationForm.city,
                        type: this.locationForm.type,
                        phoneNumber: this.locationForm.phoneNumber,
                        isActive: this.locationForm.isActive
                    }
                    : location
            )
        );

        this.toastService.success('تم تحديث الموقع بنجاح');
        this.closeEditModal();
    }

    deleteLocation(location: CommonLocation): void {
        if (confirm(`هل أنت متأكد من حذف "${location.name}"؟`)) {
            this.commonLocations.update(locations =>
                locations.filter(l => l.id !== location.id)
            );
            this.toastService.success('تم حذف الموقع بنجاح');
        }
    }

    toggleStatus(location: CommonLocation): void {
        this.commonLocations.update(locations =>
            locations.map(l =>
                l.id === location.id
                    ? { ...l, isActive: !l.isActive }
                    : l
            )
        );
        const status = !location.isActive ? 'تم تفعيل' : 'تم تعطيل';
        this.toastService.success(`${status} الموقع`);
    }

    // Validation
    validateForm(): boolean {
        if (!this.locationForm.name.trim()) {
            this.toastService.error('الرجاء إدخال اسم الموقع');
            return false;
        }
        if (!this.locationForm.address.trim()) {
            this.toastService.error('الرجاء إدخال العنوان');
            return false;
        }
        if (!this.locationForm.city.trim()) {
            this.toastService.error('الرجاء إدخال المدينة');
            return false;
        }
        if (!this.locationForm.phoneNumber.trim()) {
            this.toastService.error('الرجاء إدخال رقم الهاتف');
            return false;
        }
        // Basic phone validation
        const phonePattern = /^[0-9]{10}$/;
        if (!phonePattern.test(this.locationForm.phoneNumber.replace(/\s/g, ''))) {
            this.toastService.error('رقم الهاتف يجب أن يكون 10 أرقام');
            return false;
        }
        return true;
    }

    resetForm(): void {
        this.locationForm = {
            name: '',
            address: '',
            city: '',
            type: 'hospital',
            phoneNumber: '',
            isActive: true
        };
    }

    goBack(): void {
        this.router.navigate(['/admin/admin-dashboard']);
    }
}
