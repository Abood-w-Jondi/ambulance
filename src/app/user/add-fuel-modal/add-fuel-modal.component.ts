import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
interface FuelRecord {
  id: string;
  ambulanceName: string;
  ambulanceNumber: string;
  driverId: string;
  driverName: string;
  date: Date;
  odometerBefore: number;
  odometerAfter: number;
  fuelAmount: number;
  cost: number;
  notes?: string;
}

@Component({
  selector: 'app-add-fuel-modal',
  imports: [FormsModule, CommonModule],
  templateUrl: './add-fuel-modal.component.html',
  styleUrls: ['./add-fuel-modal.component.css']
})
export class AddFuelModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() fuelAdded = new EventEmitter<FuelRecord>();

  fuelRecord: Partial<FuelRecord> = {
    date: new Date(),
    odometerBefore: 0,
    odometerAfter: 0,
    fuelAmount: 0,
    cost: 0,
    notes: ''
  };

  ambulances: Array<{name: string, number: string}> = [
    { name: 'سيارة إسعاف 1', number: 'AMB-001' },
    { name: 'سيارة إسعاف 2', number: 'AMB-002' },
    { name: 'سيارة إسعاف 3', number: 'AMB-003' }
  ];

  selectedAmbulance: string = '';
  isSubmitting: boolean = false;

  constructor() { }

  ngOnInit(): void {
    // TODO: Load ambulances from service
  }

  onAmbulanceChange(): void {
    const ambulance = this.ambulances.find(a => a.number === this.selectedAmbulance);
    if (ambulance) {
      this.fuelRecord.ambulanceName = ambulance.name;
      this.fuelRecord.ambulanceNumber = ambulance.number;
    }
  }

  calculateDistance(): number {
    const before = this.fuelRecord.odometerBefore || 0;
    const after = this.fuelRecord.odometerAfter || 0;
    return Math.max(0, after - before);
  }

  onSubmit(): void {
    if (this.isFormValid()) {
      this.isSubmitting = true;
      
      const newFuelRecord: FuelRecord = {
        id: this.generateId(),
        ambulanceName: this.fuelRecord.ambulanceName!,
        ambulanceNumber: this.fuelRecord.ambulanceNumber!,
        driverId: 'current-driver-id', // TODO: Get from auth service
        driverName: 'السائق الحالي', // TODO: Get from auth service
        date: this.fuelRecord.date!,
        odometerBefore: this.fuelRecord.odometerBefore!,
        odometerAfter: this.fuelRecord.odometerAfter!,
        fuelAmount: this.fuelRecord.fuelAmount!,
        cost: this.fuelRecord.cost!,
        notes: this.fuelRecord.notes
      };

      // TODO: Call service to save fuel record
      console.log('إضافة سجل وقود:', newFuelRecord);
      
      setTimeout(() => {
        this.isSubmitting = false;
        this.fuelAdded.emit(newFuelRecord);
      }, 500);
    }
  }

  isFormValid(): boolean {
    return !!(
      this.fuelRecord.ambulanceNumber &&
      this.fuelRecord.date &&
      this.fuelRecord.odometerBefore !== undefined &&
      this.fuelRecord.odometerAfter !== undefined &&
      this.fuelRecord.odometerAfter > this.fuelRecord.odometerBefore &&
      this.fuelRecord.fuelAmount &&
      this.fuelRecord.fuelAmount > 0 &&
      this.fuelRecord.cost &&
      this.fuelRecord.cost > 0
    );
  }

  closeModal(): void {
    this.close.emit();
  }

  private generateId(): string {
    return 'fuel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}