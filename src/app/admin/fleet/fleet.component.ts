import { Component, signal, ChangeDetectionStrategy, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GlobalVarsService } from '../../global-vars.service';
import { ToastService } from '../../shared/services/toast.service';
import { VehicleService } from '../../shared/services/vehicle.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { ConfirmationModalComponent, ConfirmationModalConfig } from '../../shared/confirmation-modal/confirmation-modal.component';
import { Vehicle, VehicleStatus, VehicleFilterStatus } from '../../shared/models';

type FilterStatus = VehicleFilterStatus;

@Component({
  selector: 'app-fleet',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, StatusBadgeComponent, ConfirmationModalComponent],
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
    isDeleteVehicleModalOpen = signal(false);
    selectedVehicle = signal<Vehicle | null>(null);
    vehicleToDelete = signal<Vehicle | null>(null);

    // Confirmation modal state
    confirmationModalConfig = signal<ConfirmationModalConfig>({
        type: 'delete',
        title: '',
        message: '',
        confirmButtonText: '',
        cancelButtonText: 'إلغاء'
    });
    
    // Form values for new/edit vehicle
    vehicleForm = {
        vehicleId: '',
        vehicleName: '',
        notes: '',
        status: 'متاحة' as VehicleStatus
    };

    // Pagination
    currentPage = 1;
    itemsPerPage = 10;
    totalRecords = 0;
    isLoading = signal(false);

    vehicleStatuses: VehicleStatus[] = ['متاحة', 'في الخدمة', 'صيانة'];
    colors: string[] = ['White', 'Red', 'Yellow', 'Silver', 'Blue'];

    constructor(
        private globalVars: GlobalVarsService,
        private route: ActivatedRoute,
        private toastService: ToastService,
        private vehicleService: VehicleService
    ) {
        this.globalVars.setGlobalHeader('أسطول المركبات');
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
        this.loadData();
    }

    vehicles = signal<Vehicle[]>([]);

    loadData(): void {
        this.isLoading.set(true);

        this.vehicleService.getVehicles({
            page: this.currentPage,
            limit: this.itemsPerPage,
            search: this.searchTerm() || undefined,
            status: this.filterStatus() !== 'All' ? this.filterStatus() : undefined
        }).subscribe({
            next: (response) => {
                this.vehicles.set(response.data);
                this.totalRecords = response.total;
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading vehicles:', error);
                this.toastService.error('فشل تحميل بيانات المركبات');
                this.isLoading.set(false);
            }
        });
    }

    // --- Computed Property for Filtering ---
    filteredVehicles = computed(() => {
        return this.vehicles();
    });

    getPaginatedAmbulances() {
        return this.vehicles();
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

    // --- Component Methods ---

    selectStatus(status: FilterStatus): void {
        this.selectedStatus = status;
        this.filterStatus.set(status);
        this.currentPage = 1;
        this.loadData();
    }

    onSearchChange(): void {
        this.currentPage = 1;
        this.loadData();
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
            notes: '',
            status: 'متاحة'
        };
        this.isAddVehicleModalOpen.set(true);
    }

    addVehicle(): void {

        this.vehicleService.createVehicle({
            vehicleId: this.vehicleForm.vehicleId,
            vehicleName: this.vehicleForm.vehicleName,
            type: 'Type I Truck',
            currentDriver: null,
            notes: this.vehicleForm.notes,
            status: this.vehicleForm.status
        }).subscribe({
            next: () => {
                this.isAddVehicleModalOpen.set(false);
                this.toastService.success('تم إضافة المركبة بنجاح');
                this.loadData();
            },
            error: (error) => {
                console.error('Error creating vehicle:', error);
                this.toastService.error('فشلت عملية إضافة المركبة');
            }
        });
    }

    openEditVehicleModal(): void {
        const vehicle = this.selectedVehicle();
        if (vehicle) {
            this.vehicleForm = {
                vehicleId: vehicle.vehicleId,
                vehicleName: vehicle.vehicleName,
                notes: vehicle.notes,
                status: vehicle.status
            };
            this.isViewVehicleModalOpen.set(false);
            this.isEditVehicleModalOpen.set(true);
        }
    }

    saveEditVehicle(): void {
        const vehicle = this.selectedVehicle();
        if (vehicle) {

            this.vehicleService.updateVehicle(vehicle.id, {
                vehicleId: this.vehicleForm.vehicleId,
                vehicleName: this.vehicleForm.vehicleName,
                type: vehicle.type,
                currentDriver: null,
                notes: this.vehicleForm.notes,
                status: this.vehicleForm.status
            }).subscribe({
                next: (updatedVehicle) => {
                    this.selectedVehicle.set(updatedVehicle);
                    this.isEditVehicleModalOpen.set(false);
                    this.isViewVehicleModalOpen.set(true);
                    this.toastService.success('تم تحديث المركبة بنجاح');
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error updating vehicle:', error);
                    this.toastService.error('فشلت عملية تحديث المركبة');
                }
            });
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

    showDeleteConfirmation(vehicle: Vehicle): void {
        this.vehicleToDelete.set(vehicle);
        this.confirmationModalConfig.set({
            type: 'delete',
            title: 'تأكيد حذف المركبة',
            message: `هل أنت متأكد من أنك تريد حذف المركبة ${vehicle.vehicleName} (${vehicle.vehicleId})؟<br>لا يمكن التراجع عن هذا الإجراء.`,
            confirmButtonText: 'حذف',
            cancelButtonText: 'إلغاء',
            highlightedText: vehicle.vehicleName
        });
        this.isDeleteVehicleModalOpen.set(true);
    }

    closeDeleteConfirmation(): void {
        this.vehicleToDelete.set(null);
        this.isDeleteVehicleModalOpen.set(false);
    }

    confirmDeleteVehicle(): void {
        const vehicle = this.vehicleToDelete();
        if (vehicle) {
            this.vehicleService.deleteVehicle(vehicle.id).subscribe({
                next: () => {
                    this.toastService.success(`تم حذف المركبة: ${vehicle.vehicleName}`);
                    this.closeDeleteConfirmation();
                    if (this.selectedVehicle()?.id === vehicle.id) {
                        this.closeViewVehicleModal();
                    }
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error deleting vehicle:', error);
                    this.toastService.error('فشلت عملية حذف المركبة');
                }
            });
        }
    }
}