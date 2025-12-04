import { Component, OnInit } from '@angular/core';
import { ToastService } from '../../shared/services/toast.service';
import { CommonModule } from '@angular/common';
import { GlobalVarsService } from '../../global-vars.service';
import { VehicleService } from '../../shared/services/vehicle.service';
import { DriverService } from '../../shared/services/driver.service';
import { VehicleStatus, DriverStatus } from '../../shared/models'; // Assuming VehicleStatus is defined in models
import {VehicleCookieService} from "../../shared/services/vehicle-cookie.service";

// Interface definition to represent each vehicle status button
interface StatusAction {
  label: string;
  icon: string;
  btnClass: string; // Bootstrap class for color
  textClass?: string; // Text color class (optional)
  status: VehicleStatus; // API status value
}

// Interface for driver status buttons
interface DriverStatusAction {
  label: string;
  icon: string;
  btnClass: string;
  textClass?: string;
  status: DriverStatus;
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
export class StatusUpdateComponent implements OnInit {
  constructor(
    private globalVarsService: GlobalVarsService,
    private toastService: ToastService,
    private vehicleService: VehicleService,
    private driverService: DriverService,
    private vehicleCookieService: VehicleCookieService
  ) {
    this.globalVarsService.setGlobalHeader('تحديث الحالة');
    this.vehicleId = this.vehicleCookieService.getSelectedVehicleId() || '';
  }
  private vehicleId: string = '';
  private driverId: string = '';

  // Driver personal status
  currentDriverStatus = {
    title: 'جاري التحميل...',
    description: 'جاري جلب حالتك الشخصية.',
    icon: 'fa-solid fa-spinner fa-spin',
    alertClass: 'alert-primary'
  };

  // Vehicle status
  currentVehicleStatus = {
    title: 'جاري التحميل...',
    description: 'جاري جلب حالة المركبة.',
    icon: 'fa-solid fa-spinner fa-spin',
    alertClass: 'alert-primary'
  };

  // Additional info - will be updated on load
  additionalInfo = {
    startTime: 'N/A',
    currentLocation: 'جاري التحديث'
  }

  // Driver status action buttons
  driverStatusActions: DriverStatusAction[] = [
    { label: 'متاح', icon: 'fa-solid fa-user-check', btnClass: 'btn-success', textClass: 'text-white', status: 'متاح' },
    { label: 'في رحلة', icon: 'fa-solid fa-truck-medical', btnClass: 'btn-info', textClass: 'text-white', status: 'في رحلة' },
    { label: 'غير متصل', icon: 'fa-solid fa-user-slash', btnClass: 'btn-secondary', textClass: 'text-white', status: 'غير متصل' }
  ];

  // Main action buttons array - **Updated with API status values (VehicleStatus)**
  mainActions: StatusAction[] = [
    { label: 'مُتاح', icon: 'fa-solid fa-shield-heart', btnClass: 'btn-success', textClass: 'text-white', status: 'متاحة' },
    { label: 'في الطريق للمريض', icon: 'fa-solid fa-route', btnClass: 'btn-warning', textClass: 'text-dark', status: 'في الطريق للمريض' },
    { label: 'في الموقع', icon: 'fa-solid fa-location-dot', btnClass: 'btn-info', textClass: 'text-white', status: 'في الموقع' },
    { label: 'في الطريق للمستشفى', icon: 'fa-solid fa-truck-medical', btnClass: 'btn-info', textClass: 'text-white', status: 'في الطريق للمستشفى' },
    { label: 'في الوجهة', icon: 'fa-solid fa-hospital', btnClass: 'btn-info', textClass: 'text-white', status: 'في الوجهة' }
  ];

  // Secondary action buttons array - **Updated with API status values (VehicleStatus)**
  offDutyActions: StatusAction[] = [
    { label: 'خارج الخدمة', icon: 'fa-solid fa-circle-xmark', btnClass: 'btn-secondary', status: 'خارج الخدمة' },
    { label: 'إنهاء المناوبة', icon: 'fa-solid fa-right-from-bracket', btnClass: 'btn-danger', status: 'إنهاء الخدمة' }
  ];



  ngOnInit(): void {
    this.loadDriverStatus();
    this.loadVehicleStatus();
  }

  // Load driver personal status
  loadDriverStatus(): void {
    this.driverService.getCurrentDriver().subscribe({
      next: (driver) => {
        this.driverId = driver.id;
        this.updateDriverUIStatus(driver.driver_status);
      },
      error: (err) => {
        console.error('Failed to load driver status:', err);
        this.currentDriverStatus = {
          title: 'فشل التحميل',
          description: 'تعذر جلب حالتك الشخصية من الخادم.',
          icon: 'fa-solid fa-wifi-slash',
          alertClass: 'alert-danger'
        };
        this.toastService.error('فشل جلب الحالة الشخصية.', 5000);
      }
    });
  }

  // Function to load the current vehicle status
  loadVehicleStatus(): void {
    if (!this.vehicleId) {
      this.currentVehicleStatus = {
        title: 'خطأ',
        description: 'لم يتم العثور على مُعرف المركبة.',
        icon: 'fa-solid fa-triangle-exclamation',
        alertClass: 'alert-danger'
      };
      this.toastService.error('Vehicle ID is missing.', 5000);
      return;
    }

    this.vehicleService.getVehicleById(this.vehicleId).subscribe({
      next: (vehicle) => {
        this.updateVehicleUIStatus(vehicle.status);
        // Note: Start time and location are simulated here as they are not returned
        // in the current getVehicleById API response.
        this.additionalInfo.startTime = '14:30';
        this.additionalInfo.currentLocation = 'مُحدد بواسطة GPS';
      },
      error: (err) => {
        console.error('Failed to load vehicle status:', err);
        this.currentVehicleStatus = {
          title: 'فشل التحميل',
          description: 'تعذر جلب حالة المركبة من الخادم.',
          icon: 'fa-solid fa-wifi-slash',
          alertClass: 'alert-danger'
        };
        this.toastService.error('فشل جلب حالة المركبة.', 5000);
      }
    });
  }

  // Helper to map driver status to UI display properties
  private getDriverStatusDisplayProps(status: DriverStatus): { title: string, icon: string, alertClass: string } {
    const action = this.driverStatusActions.find(a => a.status === status);

    if (action) {
      let alertClassMap = action.btnClass.replace('btn-', 'alert-');
      return {
        title: action.label,
        icon: action.icon,
        alertClass: alertClassMap
      };
    }

    return {
      title: status,
      icon: 'fa-solid fa-question-circle',
      alertClass: 'alert-secondary'
    };
  }

  // Updates driver UI status
  private updateDriverUIStatus(newStatus: DriverStatus): void {
    const props = this.getDriverStatusDisplayProps(newStatus);
    this.currentDriverStatus.title = props.title;
    this.currentDriverStatus.icon = props.icon;
    this.currentDriverStatus.alertClass = props.alertClass;

    switch(newStatus) {
      case 'متاح':
        this.currentDriverStatus.description = 'أنت متاح لاستقبال الرحلات.';
        break;
      case 'في رحلة':
        this.currentDriverStatus.description = 'أنت حالياً في رحلة نشطة.';
        break;
      case 'غير متصل':
        this.currentDriverStatus.description = 'أنت غير متصل حالياً.';
        break;
      default:
        this.currentDriverStatus.description = 'حالة غير معروفة.';
    }
  }

  // Helper to map vehicle status to UI display properties
  private getVehicleStatusDisplayProps(status: VehicleStatus): { title: string, icon: string, alertClass: string } {
    const allActions = [...this.mainActions, ...this.offDutyActions];
    const action = allActions.find(a => a.status === status);

    if (action) {
      let alertClassMap = action.btnClass.replace('btn-', 'alert-');
      return {
        title: action.label,
        icon: action.icon,
        alertClass: alertClassMap
      };
    }

    return {
      title: status,
      icon: 'fa-solid fa-question-circle',
      alertClass: 'alert-secondary'
    };
  }

  // Updates vehicle UI status
  private updateVehicleUIStatus(newStatus: VehicleStatus): void {
    const props = this.getVehicleStatusDisplayProps(newStatus);
    this.currentVehicleStatus.title = props.title;
    this.currentVehicleStatus.icon = props.icon;
    this.currentVehicleStatus.alertClass = props.alertClass;

    switch(newStatus) {
      case 'متاحة':
        this.currentVehicleStatus.description = 'المركبة جاهزة للاستجابة للحالات.';
        break;
      case 'في الطريق للمريض':
        this.currentVehicleStatus.description = 'المركبة في الطريق إلى مريض.';
        break;
      case 'في الموقع':
        this.currentVehicleStatus.description = 'المركبة متواجدة في موقع المريض.';
        break;
      case 'في الطريق للمستشفى':
        this.currentVehicleStatus.description = 'المركبة في الطريق للمستشفى/الوجهة.';
        break;
      case 'في الوجهة':
        this.currentVehicleStatus.description = 'المركبة وصلت إلى المستشفى/الوجهة.';
        break;
      case 'خارج الخدمة':
        this.currentVehicleStatus.description = 'المركبة غير متاحة مؤقتاً (استراحة، صيانة، إلخ).';
        break;
      case 'إنهاء الخدمة':
        this.currentVehicleStatus.description = 'تم إنهاء خدمة المركبة لهذا اليوم.';
        break;
      default:
        this.currentVehicleStatus.description = 'حالة غير معروفة.';
    }
  }


  // Update driver personal status
  updateDriverStatus(action: DriverStatusAction) {
    if (!this.driverId) {
      this.toastService.error('تعذر تحديث الحالة: مُعرف السائق مفقود.', 5000);
      return;
    }

    this.driverService.updateStatus(this.driverId, action.status).subscribe({
      next: () => {
        this.updateDriverUIStatus(action.status);
        this.toastService.success(`تم تحديث حالتك إلى: ${action.label}`, 3000);
      },
      error: (err) => {
        console.error('Driver status update failed:', err);
        this.toastService.error(`فشل تحديث الحالة إلى ${action.label}.`, 5000);
      }
    });
  }

  // Update vehicle status
  updateVehicleStatus(action: StatusAction) {
    if (!this.vehicleId) {
      this.toastService.error('تعذر تحديث الحالة: مُعرف المركبة مفقود.', 5000);
      return;
    }

    let manualOverride = ['خارج الخدمة', 'إنهاء الخدمة'].includes(action.status);

    this.vehicleService.updateStatus(this.vehicleId, action.status, manualOverride).subscribe({
      next: () => {
        this.updateVehicleUIStatus(action.status);
        this.toastService.success(`تم تحديث حالة المركبة إلى: ${action.label}`, 3000);
      },
      error: (err) => {
        console.error('Vehicle status update failed:', err);
        this.toastService.error(`فشل تحديث حالة المركبة إلى ${action.label}.`, 5000);
      }
    });
  }
}