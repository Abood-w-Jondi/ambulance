import { Component, signal, ChangeDetectionStrategy, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GlobalVarsService } from '../../../global-vars.service';
import { ToastService } from '../../../shared/services/toast.service';
import { LocationService } from '../../../shared/services/location.service';
import { CommonLocation, LocationType, Location, LocationReference } from '../../../shared/models';

@Component({
    selector: 'app-common-locations',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './common-locations.component.html',
    styleUrl: './common-locations.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonLocationsComponent implements OnInit {
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
    commonLocations = signal<CommonLocation[]>([]);
    customLocations = signal<LocationReference[]>([]);
    selectedCustomLocationId: string = '';
    isLoading = signal(false);

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
        private toastService: ToastService,
        private locationService: LocationService
    ) {
        this.globalVars.setGlobalHeader('إدارة المواقع الشائعة');
    }

    ngOnInit(): void {
        this.loadLocations();
        this.loadCustomLocations();
    }

    loadLocations(): void {
        this.isLoading.set(true);
        this.locationService.getLocations({ locationType: 'common', limit: 1000 }).subscribe({
            next: (response) => {
                this.commonLocations.set(response.data.map((loc: Location) => ({
                    id: loc.id,
                    name: loc.name,
                    address: loc.address || '',
                    city: loc.city || '',
                    type: loc.type || 'other',
                    phoneNumber: loc.phoneNumber || '',
                    isActive: loc.isActive ?? true,
                    createdAt: loc.createdAt || new Date()
                })));
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading locations:', error);
                this.toastService.error('فشل تحميل المواقع');
                this.isLoading.set(false);
            }
        });
    }

    loadCustomLocations(): void {
        this.locationService.getCustomLocations().subscribe({
            next: (locations) => {
                this.customLocations.set(locations);
            },
            error: (error) => {
                console.error('Error loading custom locations:', error);
            }
        });
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
        this.selectedCustomLocationId = '';
        this.isAddModalOpen.set(true);
    }

    closeAddModal(): void {
        this.isAddModalOpen.set(false);
        this.resetForm();
        this.selectedCustomLocationId = '';
    }

    onCustomLocationSelected(locationId: string): void {
        if (!locationId) {
            this.resetForm();
            return;
        }

        // Find the selected custom location
        const customLoc = this.customLocations().find(loc => loc.id === locationId);
        if (customLoc) {
            this.locationForm.name = customLoc.name;
            // Other fields will be filled manually by the user
        }
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

        // If user selected a custom location from dropdown, convert it
        if (this.selectedCustomLocationId) {
            this.convertToCommonLocation(this.selectedCustomLocationId);
            return;
        }

        // Otherwise, search to see if this name exists as custom location
        this.locationService.searchLocations(this.locationForm.name).subscribe({
            next: (locations) => {
                const existingCustom = locations.find(loc =>
                    loc.name.toLowerCase() === this.locationForm.name.toLowerCase() &&
                    loc.locationType === 'custom'
                );

                if (existingCustom) {
                    // Convert custom location to common
                    this.convertToCommonLocation(existingCustom.id);
                } else {
                    // Create new common location
                    this.createCommonLocation();
                }
            },
            error: (error) => {
                console.error('Error searching locations:', error);
                // If search fails, just create new location
                this.createCommonLocation();
            }
        });
    }

    private convertToCommonLocation(locationId: string): void {
        this.locationService.updateLocation(locationId, {
            name: this.locationForm.name,
            locationType: 'common',
            address: this.locationForm.address,
            city: this.locationForm.city,
            type: this.locationForm.type,
            phoneNumber: this.locationForm.phoneNumber,
            isActive: this.locationForm.isActive
        }).subscribe({
            next: () => {
                this.toastService.success('تم تحويل الموقع إلى موقع شائع بنجاح');
                this.closeAddModal();
                this.loadLocations();
                this.loadCustomLocations(); // Reload custom locations
            },
            error: (error) => {
                console.error('Error converting location:', error);
                this.toastService.error('فشل تحويل الموقع');
            }
        });
    }

    private createCommonLocation(): void {
        this.locationService.createLocation({
            name: this.locationForm.name,
            locationType: 'common',
            address: this.locationForm.address,
            city: this.locationForm.city,
            type: this.locationForm.type,
            phoneNumber: this.locationForm.phoneNumber
        }).subscribe({
            next: () => {
                this.toastService.success('تم إضافة الموقع بنجاح');
                this.closeAddModal();
                this.loadLocations();
                this.loadCustomLocations(); // Reload in case name matched
            },
            error: (error) => {
                console.error('Error creating location:', error);
                this.toastService.error('فشل إضافة الموقع');
            }
        });
    }

    updateLocation(): void {
        if (!this.validateForm()) return;

        const selected = this.selectedLocation();
        if (!selected) return;

        this.locationService.updateLocation(selected.id, {
            name: this.locationForm.name,
            locationType: 'common',
            address: this.locationForm.address,
            city: this.locationForm.city,
            type: this.locationForm.type,
            phoneNumber: this.locationForm.phoneNumber,
            isActive: this.locationForm.isActive
        }).subscribe({
            next: () => {
                this.toastService.success('تم تحديث الموقع بنجاح');
                this.closeEditModal();
                this.loadLocations();
            },
            error: (error) => {
                console.error('Error updating location:', error);
                this.toastService.error('فشل تحديث الموقع');
            }
        });
    }

    deleteLocation(location: CommonLocation): void {
        if (confirm(`هل أنت متأكد من حذف "${location.name}"؟`)) {
            this.locationService.deleteLocation(location.id).subscribe({
                next: () => {
                    this.toastService.success('تم حذف الموقع بنجاح');
                    this.loadLocations();
                },
                error: (error) => {
                    console.error('Error deleting location:', error);
                    this.toastService.error('فشل حذف الموقع');
                }
            });
        }
    }

    toggleStatus(location: CommonLocation): void {
        this.locationService.toggleLocationStatus(location.id).subscribe({
            next: () => {
                const status = !location.isActive ? 'تم تفعيل' : 'تم تعطيل';
                this.toastService.success(`${status} الموقع`);
                this.loadLocations();
            },
            error: (error) => {
                console.error('Error toggling location status:', error);
                this.toastService.error('فشل تغيير حالة الموقع');
            }
        });
    }

    // Validation
    validateForm(): boolean {
        if (!this.locationForm.name.trim()) {
            this.toastService.error('الرجاء إدخال اسم الموقع');
            return false;
        }

        const phone = (this.locationForm.phoneNumber || '').replace(/\s/g, '');
        if (phone) {
            const phonePattern = /^[0-9]{10}$/;
            if (!phonePattern.test(phone)) {
                this.toastService.error('رقم الهاتف يجب أن يكون 10 أرقام');
                return false;
            }
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
