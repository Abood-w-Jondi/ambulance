import { Component, EventEmitter, OnInit, Output, Input } from '@angular/core';
import { ToastService } from '../../shared/services/toast.service';
import { MaintenanceService } from '../../shared/services/maintenance.service';
import { VehicleService } from '../../shared/services/vehicle.service';
import { DriverService } from '../../shared/services/driver.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaintenanceTypeSearchComponent, MaintenanceTypeSelection } from '../../shared/maintenance-type-search/maintenance-type-search.component';
import { MaintenanceRecord, MaintenanceStatus } from '../../shared/models';

@Component({
  selector: 'app-add-maintenance-modal',
  templateUrl: './add-maintenance-modal.component.html',
  imports: [FormsModule, CommonModule, MaintenanceTypeSearchComponent],
  styleUrls: ['./add-maintenance-modal.component.css']
})
export class AddMaintenanceModalComponent implements OnInit {
  @Input() vehicleId: string = '';
  @Input() vehicleInternalId: string = '';

  @Output() close = new EventEmitter<void>();
  @Output() maintenanceAdded = new EventEmitter<MaintenanceRecord>();

  recordForm = {
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    vehicleId: '',
    maintenanceTypeId: '',
    type: '', // Maintenance type name for display
    cost: 0,
    serviceLocation: '',
    odometerBefore: 0,
    odometerAfter: 0,
    notes: '',
    status: 'مكتملة' as MaintenanceStatus
  };

  maintenanceStatuses: MaintenanceStatus[] = ['مكتملة', 'مجدولة', 'قيد التنفيذ'];

  isSubmitting: boolean = false;
  kmSinceLast: number | null = null;

  // Driver properties
  currentDriverId: string = '';
  currentDriverName: string = '';
  isLoadingDriver: boolean = true;

  constructor(
    private toastService: ToastService,
    private maintenanceService: MaintenanceService,
    private vehicleService: VehicleService,
    private driverService: DriverService
  ) { }

  ngOnInit(): void {
    // Load current driver
    this.loadCurrentDriver();

    // Pre-populate vehicle from input
    this.recordForm.vehicleId = this.vehicleInternalId;

    // Load vehicle name and current odometer
    if (this.vehicleInternalId) {
      this.vehicleService.getVehicleById(this.vehicleInternalId).subscribe({
        next: (vehicle) => {
          // Vehicle loaded successfully (name not displayed in form, but available if needed)
        },
        error: (error) => console.error('Failed to load vehicle:', error)
      });

      // Auto-populate odometerBefore with vehicle's current odometer
      this.vehicleService.getCurrentOdometer(this.vehicleInternalId).subscribe({
        next: (response) => {
          this.recordForm.odometerBefore = response.currentOdometer;
        },
        error: (error) => console.error('Failed to load current odometer:', error)
      });
    }
  }

  loadCurrentDriver(): void {
    this.isLoadingDriver = true;
    this.driverService.getCurrentDriver().subscribe({
      next: (driver) => {
        this.currentDriverId = driver.id;
        this.currentDriverName = driver.arabicName || driver.name || 'السائق';
        this.isLoadingDriver = false;
      },
      error: (error) => {
        console.error('Error loading current driver:', error);
        this.isLoadingDriver = false;
      }
    });
  }

  onMaintenanceTypeSelected(selection: MaintenanceTypeSelection): void {
    this.recordForm.maintenanceTypeId = selection.id;
    this.recordForm.type = selection.name;

    // Auto-populate cost if available
    if (selection.estimatedCost) {
      this.recordForm.cost = selection.estimatedCost;
    }

    // Load last odometer reading
    if (this.recordForm.vehicleId && this.recordForm.maintenanceTypeId) {
      this.loadLastOdometerReading();
    }
  }

  loadLastOdometerReading(): void {
    if (!this.recordForm.vehicleId || !this.recordForm.maintenanceTypeId) {
      return;
    }

    this.maintenanceService.getLastOdometerReading(
      this.recordForm.vehicleId,
      this.recordForm.maintenanceTypeId
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Auto-populate with current odometer from vehicle
          this.recordForm.odometerBefore = response.data.currentOdometer;
          // Store km since last for display
          this.kmSinceLast = response.data.kmSinceLast;
        }
      },
      error: (error) => {
        console.error('Error loading last odometer reading:', error);
        // Don't show error toast, just leave the field empty
        this.kmSinceLast = null;
      }
    });
  }

  calculateDistance(): number {
    const before = this.recordForm.odometerBefore || 0;
    const after = this.recordForm.odometerAfter || 0;
    return Math.max(0, after - before);
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      return;
    }

    this.isSubmitting = true;

    // Date is already in YYYY-MM-DD format from HTML5 input
    const dateString = this.recordForm.date;

    this.maintenanceService.createMaintenanceRecord({
      vehicleId: this.recordForm.vehicleId,
      date: dateString as any,
      maintenanceTypeId: this.recordForm.maintenanceTypeId,
      cost: this.recordForm.cost,
      serviceLocation: this.recordForm.serviceLocation,
      odometerBefore: this.recordForm.odometerBefore,
      odometerAfter: this.recordForm.odometerAfter,
      notes: this.recordForm.notes,
      status: this.recordForm.status,
      driverId: this.currentDriverId
    }).subscribe({
      next: (record) => {
        this.isSubmitting = false;
        this.toastService.success('تمت إضافة سجل الصيانة بنجاح');
        this.maintenanceAdded.emit(record);
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error creating maintenance record:', error);
        this.toastService.error('فشل حفظ سجل الصيانة');
      }
    });
  }

  isFormValid(): boolean {
    return !!(
      this.recordForm.vehicleId &&
      this.recordForm.serviceLocation &&
      this.recordForm.odometerBefore !== undefined &&
      this.recordForm.odometerAfter !== undefined &&
      this.recordForm.odometerAfter >= this.recordForm.odometerBefore &&
      this.recordForm.cost !== undefined &&
      this.recordForm.cost >= 0 &&
      this.recordForm.status
    );
  }

  closeModal(): void {
    this.close.emit();
  }

}