import { Component, EventEmitter, OnInit, Output, Input } from '@angular/core';
import { ToastService } from '../../shared/services/toast.service';
import { MaintenanceService } from '../../shared/services/maintenance.service';
import { VehicleService } from '../../shared/services/vehicle.service';
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
    day: new Date().getDate(),
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
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

  constructor(
    private toastService: ToastService,
    private maintenanceService: MaintenanceService,
    private vehicleService: VehicleService
  ) { }

  ngOnInit(): void {
    // Pre-populate vehicle from input
    this.recordForm.vehicleId = this.vehicleInternalId;

    // Load vehicle name if needed for display
    if (this.vehicleInternalId) {
      this.vehicleService.getVehicleById(this.vehicleInternalId).subscribe({
        next: (vehicle) => {
          // Vehicle loaded successfully (name not displayed in form, but available if needed)
        },
        error: (error) => console.error('Failed to load vehicle:', error)
      });
    }
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
        if (response.success && response.data.lastOdometerAfter !== null) {
          this.recordForm.odometerBefore = response.data.lastOdometerAfter;
        } else {
          // No previous record, leave empty (0)
          this.recordForm.odometerBefore = 0;
        }
      },
      error: (error) => {
        console.error('Error loading last odometer reading:', error);
        // Don't show error toast, just leave the field empty
        this.recordForm.odometerBefore = 0;
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

    // Format date as YYYY-MM-DD string to avoid timezone issues
    const year = this.recordForm.year;
    const month = String(this.recordForm.month).padStart(2, '0');
    const day = String(this.recordForm.day).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    console.log('Submitting maintenance record for date:', dateString);
    this.maintenanceService.createMaintenanceRecord({
      vehicleId: this.recordForm.vehicleId,
      date: dateString as any,
      maintenanceTypeId: this.recordForm.maintenanceTypeId,
      cost: this.recordForm.cost,
      serviceLocation: this.recordForm.serviceLocation,
      odometerBefore: this.recordForm.odometerBefore,
      odometerAfter: this.recordForm.odometerAfter,
      notes: this.recordForm.notes,
      status: this.recordForm.status
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

  getDaysInMonth(month: number, year: number): number[] {
    const days = new Date(year, month, 0).getDate();
    return Array.from({ length: days }, (_, i) => i + 1);
  }

  getMonths(): number[] {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }

  getYears(): number[] {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => currentYear - i);
  }
}