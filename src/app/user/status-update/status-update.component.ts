import { Component } from '@angular/core';
import { ToastService } from '../../shared/services/toast.service';
import { CommonModule } from '@angular/common';
import { GlobalVarsService } from '../../global-vars.service';

// Interface definition to represent each status button
interface StatusAction {
  label: string;
  icon: string;
  btnClass: string; // Bootstrap class for color
  textClass?: string; // Text color class (optional)
}

@Component({
  selector: 'app-status-update',
  standalone: true,
  imports: [
    CommonModule // To enable *ngFor usage
  ],
  templateUrl: './status-update.component.html',
  styleUrls: ['./status-update.component.css']
})
export class StatusUpdateComponent {

  // Current status data
  currentStatus = {
    title: 'في الطريق',
    description: 'أنت حالياً في الطريق إلى مريض.',
    icon: 'fa-solid fa-route',
    alertClass: 'alert-warning' // Bootstrap class for background
  };

  // Main action buttons array
  mainActions: StatusAction[] = [
    { label: 'مُتاح', icon: 'fa-solid fa-shield-heart', btnClass: 'btn-success', textClass: 'text-white' },
    { label: 'في الطريق للمريض', icon: 'fa-solid fa-route', btnClass: 'btn-warning', textClass: 'text-dark' },
    { label: 'في الموقع', icon: 'fa-solid fa-location-dot', btnClass: 'btn-info', textClass: 'text-white' },
    { label: 'في الطريق للمستشفى', icon: 'fa-solid fa-truck-medical', btnClass: 'btn-info', textClass: 'text-white' },
    { label: 'في الوجهة', icon: 'fa-solid fa-hospital', btnClass: 'btn-info', textClass: 'text-white' }
  ];

  // Secondary action buttons array
  offDutyActions: StatusAction[] = [
    { label: 'خارج الخدمة', icon: 'fa-solid fa-circle-xmark', btnClass: 'btn-secondary' },
    { label: 'إنهاء المناوبة', icon: 'fa-solid fa-right-from-bracket', btnClass: 'btn-danger' }
  ];

  constructor(private globalVarsService: GlobalVarsService, private toastService: ToastService) {
    this.globalVarsService.setGlobalHeader('الحالة الحالية');
   }

  // تحديث الحالة مع إشعار Toast
  updateStatus(status: StatusAction) {
    this.currentStatus.title = status.label;
    this.toastService.info(`تم تحديث الحالة إلى: ${status.label}`, 3000);
  }
}