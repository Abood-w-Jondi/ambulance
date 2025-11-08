import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ToastService } from '../../shared/services/toast.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

type MaintenanceStatus = 'مكتملة' | 'مجدولة' | 'قيد التنفيذ';

interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  date: Date;
  type: string;
  cost: number;
  serviceLocation: string;
  odometerBefore: number;
  odometerAfter: number;
  notes: string;
  status: MaintenanceStatus;
}

@Component({
  selector: 'app-add-maintenance-modal',
  templateUrl: './add-maintenance-modal.component.html',
  imports: [FormsModule, CommonModule],
  styleUrls: ['./add-maintenance-modal.component.css']
})
export class AddMaintenanceModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() maintenanceAdded = new EventEmitter<MaintenanceRecord>();

  maintenanceRecord: Partial<MaintenanceRecord> = {
    date: new Date(),
    type: '',
    cost: 0,
    serviceLocation: '',
    odometerBefore: 0,
    odometerAfter: 0,
    notes: '',
    status: 'مكتملة'
  };

  ambulances: Array<{id: string, name: string, number: string}> = [
    { id: 'AMB-001', name: 'سيارة إسعاف 1', number: 'AMB-001' },
    { id: 'AMB-002', name: 'سيارة إسعاف 2', number: 'AMB-002' },
    { id: 'AMB-003', name: 'سيارة إسعاف 3', number: 'AMB-003' }
  ];

  maintenanceTypes: string[] = [
    'تغيير زيت',
    'فحص دوري',
    'إصلاح محرك',
    'تغيير إطارات',
    'صيانة فرامل',
    'صيانة كهربائية',
    'صيانة تكييف',
    'صيانة نظام التعليق',
    'أخرى'
  ];

  maintenanceStatuses: MaintenanceStatus[] = ['مكتملة', 'مجدولة', 'قيد التنفيذ'];

  selectedVehicle: string = '';
  isSubmitting: boolean = false;

  constructor(private toastService: ToastService) { }

  ngOnInit(): void {
    // TODO: Load ambulances from service
  }

  onVehicleChange(): void {
    this.maintenanceRecord.vehicleId = this.selectedVehicle;
  }

  calculateDistance(): number {
    const before = this.maintenanceRecord.odometerBefore || 0;
    const after = this.maintenanceRecord.odometerAfter || 0;
    return Math.max(0, after - before);
  }

  onSubmit(): void {
    if (this.isFormValid()) {
      this.isSubmitting = true;
      const newMaintenanceRecord: MaintenanceRecord = {
        id: this.generateId(),
        vehicleId: this.maintenanceRecord.vehicleId!,
        date: this.maintenanceRecord.date!,
        type: this.maintenanceRecord.type!,
        cost: this.maintenanceRecord.cost!,
        serviceLocation: this.maintenanceRecord.serviceLocation!,
        odometerBefore: this.maintenanceRecord.odometerBefore!,
        odometerAfter: this.maintenanceRecord.odometerAfter!,
        notes: this.maintenanceRecord.notes!,
        status: this.maintenanceRecord.status!
      };

      // TODO: Call service to save maintenance record
      console.log('إضافة سجل صيانة:', newMaintenanceRecord);
      this.toastService.success(`تمت إضافة سجل صيانة (${newMaintenanceRecord.type}) للمركبة ${newMaintenanceRecord.vehicleId}`, 3000);
      setTimeout(() => {
        this.isSubmitting = false;
        this.maintenanceAdded.emit(newMaintenanceRecord);
      }, 500);
    }
  }

  isFormValid(): boolean {
    return !!(
      this.maintenanceRecord.vehicleId &&
      this.maintenanceRecord.date &&
      this.maintenanceRecord.type &&
      this.maintenanceRecord.serviceLocation &&
      this.maintenanceRecord.odometerBefore !== undefined &&
      this.maintenanceRecord.odometerAfter !== undefined &&
      this.maintenanceRecord.odometerAfter >= this.maintenanceRecord.odometerBefore &&
      this.maintenanceRecord.cost !== undefined &&
      this.maintenanceRecord.cost >= 0 &&
      this.maintenanceRecord.status
    );
  }

  closeModal(): void {
    this.close.emit();
  }

  private generateId(): string {
    return 'maint_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}