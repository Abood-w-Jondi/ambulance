import { Component, signal, ChangeDetectionStrategy, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GlobalVarsService } from '../../global-vars.service';
import { ToastService } from '../../shared/services/toast.service';
import { ValidationService } from '../../shared/services/validation.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { VEHICLE_STATUS } from '../../shared/constants/status.constants';
import { Vehicle, VehicleStatus, VehicleFilterStatus, VehicleType, DriverReference } from '../../shared/models';

type FilterStatus = VehicleFilterStatus;

@Component({
  selector: 'app-fleet',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, StatusBadgeComponent],
  templateUrl: './fleet.component.html',
  styleUrls: ['./fleet.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FleetComponent implements OnInit {
    // --- State Initialization (Signals) ---
    searchTerm = signal('');
    selectedStatus: FilterStatus = 'All';
    filterStatus = signal<FilterStatus>('All');
    
    // Query parameter filters
    queryFilterType = signal<string | null>(null);
    queryFilterValue = signal<string | null>(null);
    
    // Modal Control
    isAddVehicleModalOpen = signal(false);
    isViewVehicleModalOpen = signal(false);
    isEditVehicleModalOpen = signal(false);
    selectedVehicle = signal<Vehicle | null>(null);
    
    // Form values for new/edit vehicle
    vehicleForm = {
        vehicleId: '',
        vehicleName: '',
        type: '' as VehicleType | '',
        currentDriver: '',
        notes: '',
        status: 'متاحة' as VehicleStatus
    };

    // Search for driver assignment
    driverSearchTerm = signal('');

    // Pagination
    currentPage = 1;
    itemsPerPage = 10;

    vehicleStatuses: VehicleStatus[] = ['متاحة', 'في الخدمة', 'صيانة'];
    vehicleTypes: VehicleType[] = ['Type I Truck', 'Type II Van', 'Type III Cutaway'];
    colors: string[] = ['White', 'Red', 'Yellow', 'Silver', 'Blue'];

    // Computed filtered drivers list
    filteredDriversList = computed(() => {
        const term = this.driverSearchTerm().toLowerCase();
        return this.driversList.filter(d => d.name.toLowerCase().includes(term));
    });

    driversList: DriverReference[] = [];

    constructor(
        private globalVars: GlobalVarsService,
        private route: ActivatedRoute,
        private toastService: ToastService,
        private validationService: ValidationService
    ) {
        this.globalVars.setGlobalHeader('أسطول المركبات');
        this.driversList = this.globalVars.driversList;
    }

    ngOnInit(): void {
        // Check for query parameters from fuel history component
        this.route.queryParams.subscribe(params => {
            if (params['filterType'] && params['filterValue']) {
                this.queryFilterType.set(params['filterType']);
                this.queryFilterValue.set(params['filterValue']);
                
                // Apply the filter based on the type
                // For simplicity, we'll use the search term to filter
                this.searchTerm.set(params['filterValue']);
            }
        });
    }
    
    // Helper to generate IDs
    private generateId(): string {
        return Date.now().toString() + Math.random().toString(36).substring(2, 9);
    }
    
    // Dummy Data
    vehicles = signal<Vehicle[]>([
        {
            id: this.generateId(),
            vehicleId: 'AMB-012',
            vehicleName: 'إسعاف النجوم',
            type: 'Type II Van',
            currentDriver: null,
            notes: 'مركبة جديدة، تم استلامها في يناير 2023',
            status: 'متاحة'
        },
        {
            id: this.generateId(),
            vehicleId: 'AMB-025',
            vehicleName: 'إسعاف الأمل',
            type: 'Type III Cutaway',
            currentDriver: 'Jane Smith',
            notes: 'مجهزة بمعدات طبية متقدمة',
            status: 'في الخدمة'
        },
        {
            id: this.generateId(),
            vehicleId: 'AMB-007',
            vehicleName: 'إسعاف السلام',
            type: 'Type I Truck',
            currentDriver: 'David Chen',
            notes: 'تحتاج إلى صيانة دورية',
            status: 'صيانة'
        },
        {
            id: this.generateId(),
            vehicleId: 'AMB-031',
            vehicleName: 'إسعاف النور',
            type: 'Type II Van',
            currentDriver: null,
            notes: 'جاهزة للاستخدام الفوري',
            status: 'متاحة'
        }
    ]);

    // --- Computed Property for Filtering ---
    filteredVehicles = computed(() => {
        const status = this.filterStatus();
        const search = this.searchTerm().toLowerCase().trim();

        return this.vehicles().filter(vehicle => {
            // Status Filter
            const statusMatch = status === 'All' || vehicle.status === status;

            // Search Filter - now includes all vehicle properties
            const searchMatch = search === '' ||
                vehicle.vehicleId.toLowerCase().includes(search) ||
                vehicle.vehicleName.toLowerCase().includes(search) ||
                (vehicle.currentDriver && vehicle.currentDriver.toLowerCase().includes(search));

            return statusMatch && searchMatch;
        });
    });

    getPaginatedAmbulances() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.filteredVehicles().slice(startIndex, endIndex);
    }

    onPageChange(page: number): void {
        this.currentPage = page;
    }

    onItemsPerPageChange(itemsPerPage: number): void {
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1;
    }

    // --- Component Methods ---

    selectStatus(status: FilterStatus): void {
        this.selectedStatus = status;
        this.filterStatus.set(status);
    }

    getStatusClass(status: FilterStatus): string {
        return this.selectedStatus === status ? 'btn-primary-custom' : 'btn-outline-secondary';
    }

    getStatusColor(status: VehicleStatus): string {
        switch (status) {
            case 'متاحة':
                return '#28A745';
            case 'في الخدمة':
                return '#17A2B8';
            case 'صيانة':
                return '#FD7E14';
            default:
                return '#6C757D';
        }
    }

    getStatusBadgeClass(status: VehicleStatus): string {
        switch (status) {
            case 'متاحة':
                return 'text-bg-success';
            case 'في الخدمة':
                return 'text-bg-info';
            case 'صيانة':
                return 'text-bg-warning';
            default:
                return 'text-bg-secondary';
        }
    }

    getStatusIcon(status: VehicleStatus): string {
        switch (status) {
            case 'متاحة':
                return 'fa-circle-check';
            case 'في الخدمة':
                return 'fa-truck-medical';
            case 'صيانة':
                return 'fa-wrench';
            default:
                return 'fa-circle';
        }
    }

    openAddVehicleModal(): void {
        this.vehicleForm = {
            vehicleId: '',
            vehicleName: '',
            type: '',
            currentDriver: '',
            notes: '',
            status: 'متاحة'
        };
        this.driverSearchTerm.set('');
        this.isAddVehicleModalOpen.set(true);
    }

    addVehicle(): void {
        // Validate the vehicle form
        const validation = this.validationService.validateVehicle({
            vehicleId: this.vehicleForm.vehicleId,
            vehicleName: this.vehicleForm.vehicleName,
            type: this.vehicleForm.type,
            status: this.vehicleForm.status
        });

        if (!validation.valid) {
            this.toastService.error(validation.errors.join(', '));
            return;
        }

        const vehicle: Vehicle = {
            id: this.generateId(),
            vehicleId: this.vehicleForm.vehicleId,
            vehicleName: this.vehicleForm.vehicleName,
            type: this.vehicleForm.type as VehicleType,
            currentDriver: this.vehicleForm.currentDriver || null,
            notes: this.vehicleForm.notes,
            status: this.vehicleForm.status
        };

        this.vehicles.update(vehicles => [...vehicles, vehicle]);
        this.isAddVehicleModalOpen.set(false);
        this.toastService.success('تم إضافة المركبة بنجاح');
    }

    openEditVehicleModal(): void {
        const vehicle = this.selectedVehicle();
        if (vehicle) {
            this.vehicleForm = {
                vehicleId: vehicle.vehicleId,
                vehicleName: vehicle.vehicleName,
                type: vehicle.type,
                currentDriver: vehicle.currentDriver || '',
                notes: vehicle.notes,
                status: vehicle.status
            };
            this.driverSearchTerm.set('');
            this.isViewVehicleModalOpen.set(false);
            this.isEditVehicleModalOpen.set(true);
        }
    }

    saveEditVehicle(): void {
        const vehicle = this.selectedVehicle();
        if (vehicle) {
            // Validate the vehicle form
            const validation = this.validationService.validateVehicle({
                vehicleId: this.vehicleForm.vehicleId,
                vehicleName: this.vehicleForm.vehicleName,
                type: this.vehicleForm.type,
                status: this.vehicleForm.status
            });

            if (!validation.valid) {
                this.toastService.error(validation.errors.join(', '));
                return;
            }

            const updatedVehicle: Vehicle = {
                ...vehicle,
                vehicleId: this.vehicleForm.vehicleId,
                vehicleName: this.vehicleForm.vehicleName,
                type: this.vehicleForm.type as VehicleType,
                currentDriver: this.vehicleForm.currentDriver || null,
                notes: this.vehicleForm.notes,
                status: this.vehicleForm.status
            };

            this.vehicles.update(vehicles => vehicles.map(v => v.id === vehicle.id ? updatedVehicle : v));
            this.selectedVehicle.set(updatedVehicle);
            this.isEditVehicleModalOpen.set(false);
            this.isViewVehicleModalOpen.set(true);
            this.toastService.success('تم تحديث المركبة بنجاح');
        }
    }

    viewVehicleDetails(vehicle: Vehicle): void {
        this.selectedVehicle.set(vehicle);
        this.isViewVehicleModalOpen.set(true);
    }

    closeViewVehicleModal(): void {
        this.isViewVehicleModalOpen.set(false);
        this.selectedVehicle.set(null);
    }

    closeEditVehicleModal(): void {
        this.isEditVehicleModalOpen.set(false);
    }
}