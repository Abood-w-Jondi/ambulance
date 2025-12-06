import { Component, EventEmitter, OnInit, Output, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FuelService } from '../../shared/services/fuel.service';
import { VehicleService } from '../../shared/services/vehicle.service';
import { DriverService } from '../../shared/services/driver.service';
import { ToastService } from '../../shared/services/toast.service';
import { FuelRecord } from '../../shared/models';

@Component({
  selector: 'app-add-fuel-modal',
  imports: [FormsModule, CommonModule],
  templateUrl: './add-fuel-modal.component.html',
  styleUrls: ['./add-fuel-modal.component.css']
})
export class AddFuelModalComponent implements OnInit {
  @Input() vehicleId: string = '';
  @Input() vehicleInternalId: string = '';
  @Input() driverId: string = '';
  @Input() driverInternalId: string = '';

  @Output() close = new EventEmitter<void>();
  @Output() fuelAdded = new EventEmitter<FuelRecord>();

  recordForm = {
    day: new Date().getDate(),
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    ambulanceName: '',
    ambulanceNumber: '',
    ambulanceId: '',          // vehicleInternalId
    driverId: '',
    driverName: '',
    driverInternalId: '',     // driverInternalId
    odometerBefore: 0,
    odometerAfter: 0,
    fuelAmount: 0,
    cost: 0,
    notes: ''
  };

  isSubmitting: boolean = false;

  constructor(
    private fuelService: FuelService,
    private vehicleService: VehicleService,
    private driverService: DriverService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    // Pre-populate from inputs (vehicle and driver passed from parent)
    this.recordForm.ambulanceId = this.vehicleInternalId;
    this.recordForm.driverInternalId = this.driverInternalId;
    this.recordForm.driverId = this.driverId;

    // Load vehicle name using VehicleService
    if (this.vehicleInternalId) {
      this.vehicleService.getVehicleById(this.vehicleInternalId).subscribe({
        next: (vehicle) => {
          this.recordForm.ambulanceName = vehicle.vehicleName;
          this.recordForm.ambulanceNumber = vehicle.vehicleId;
        },
        error: (error) => console.error('Failed to load vehicle:', error)
      });
    }

    // Load driver name using DriverService
    if (this.driverInternalId) {
      this.driverService.getDriverById(this.driverInternalId).subscribe({
        next: (driver) => {
          this.recordForm.driverName = driver.arabicName || driver.name;
        },
        error: (error) => console.error('Failed to load driver:', error)
      });
    }
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

    // Prepare date
    let date: any = new Date(this.recordForm.year, this.recordForm.month - 1, this.recordForm.day);

    // Call FuelService.createFuelRecord()
    this.fuelService.createFuelRecord({
      ambulanceName: this.recordForm.ambulanceName,
      ambulanceNumber: this.recordForm.ambulanceNumber,
      ambulanceId: this.recordForm.ambulanceId,
      driverId: this.recordForm.driverId,
      driverName: this.recordForm.driverName,
      driverInternalId: this.recordForm.driverInternalId,
      date: date,
      odometerBefore: this.recordForm.odometerBefore,
      odometerAfter: this.recordForm.odometerAfter,
      fuelAmount: this.recordForm.fuelAmount,
      cost: this.recordForm.cost,
      notes: this.recordForm.notes
    }).subscribe({
      next: (record) => {
        this.isSubmitting = false;
        this.toastService.success('تمت إضافة سجل الوقود بنجاح');
        this.fuelAdded.emit(record);
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error creating fuel record:', error);
        this.toastService.error('فشل حفظ سجل الوقود');
      }
    });
  }

  isFormValid(): boolean {
    return !!(
      this.recordForm.ambulanceId &&
      this.recordForm.odometerBefore !== undefined &&
      this.recordForm.odometerAfter !== undefined &&
      this.recordForm.odometerAfter > this.recordForm.odometerBefore &&
      this.recordForm.fuelAmount &&
      this.recordForm.fuelAmount > 0 &&
      this.recordForm.cost &&
      this.recordForm.cost > 0
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