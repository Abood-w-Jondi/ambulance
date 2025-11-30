import { Component, OnInit } from '@angular/core';
import { ToastService } from '../../shared/services/toast.service';
import { CommonModule } from '@angular/common';
import { GlobalVarsService } from '../../global-vars.service';
import { VehicleService } from '../../shared/services/vehicle.service';
import { VehicleStatus } from '../../shared/models'; // Assuming VehicleStatus is defined in models
import {VehicleCookieService} from "../../shared/services/vehicle-cookie.service";
// Interface definition to represent each status button
interface StatusAction {
  label: string;
  icon: string;
  btnClass: string; // Bootstrap class for color
  textClass?: string; // Text color class (optional)
  status: VehicleStatus; // API status value
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
    private vehicleService: VehicleService, // Inject the service
    private vehicleCookieService: VehicleCookieService
  ) {
    this.globalVarsService.setGlobalHeader('الحالة الحالية');
    this.vehicleId = this.vehicleCookieService.getSelectedVehicleId() || '';
  }
  private vehicleId: string = ''
  // ⚠️ Placeholder: In a real app, this ID would come from the Auth/Driver service
  // For demonstration, we'll use a hardcoded value.

  // Current status data
  currentStatus = {
    title: 'جاري التحميل...',
    description: 'جاري جلب الحالة الحالية للمركبة.',
    icon: 'fa-solid fa-spinner fa-spin',
    alertClass: 'alert-primary' // Bootstrap class for background
  };
  
  // Additional info - will be updated on load
  additionalInfo = {
    startTime: 'N/A',
    currentLocation: 'جاري التحديث'
  }

  // Main action buttons array - **Updated with API status values (VehicleStatus)**
  mainActions: StatusAction[] = [
    { label: 'مُتاح', icon: 'fa-solid fa-shield-heart', btnClass: 'btn-success', textClass: 'text-white', status: 'متاح' },
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
    this.loadCurrentStatus();
  }

  // Function to load the current vehicle status
  loadCurrentStatus(): void {
    if (!this.vehicleId) {
      this.currentStatus = {
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
        this.updateUIStatus(vehicle.status);
        // Note: Start time and location are simulated here as they are not returned 
        // in the current getVehicleById API response.
        this.additionalInfo.startTime = '14:30'; 
        this.additionalInfo.currentLocation = 'مُحدد بواسطة GPS';
      },
      error: (err) => {
        console.error('Failed to load vehicle status:', err);
        this.currentStatus = {
          title: 'فشل التحميل',
          description: 'تعذر جلب حالة المركبة من الخادم.',
          icon: 'fa-solid fa-wifi-slash',
          alertClass: 'alert-danger'
        };
        this.toastService.error('فشل جلب الحالة الحالية.', 5000);
      }
    });
  }

  // Helper to map API status to UI display properties
  private getStatusDisplayProps(status: VehicleStatus): { title: string, icon: string, alertClass: string } {
    const allActions = [...this.mainActions, ...this.offDutyActions];
    const action = allActions.find(a => a.status === status);
    
    if (action) {
      // Find the corresponding button and use its label, icon, and btnClass (as alertClass)
      let alertClassMap = action.btnClass.replace('btn-', 'alert-');
      if (alertClassMap === 'alert-warning') {
        alertClassMap = 'alert-warning'; // Keep the warning class for yellow
      } else if (alertClassMap === 'alert-info') {
        alertClassMap = 'alert-info'; // Keep info for blue
      } else if (alertClassMap === 'alert-danger') {
        alertClassMap = 'alert-danger';
      } else if (alertClassMap === 'alert-success') {
        alertClassMap = 'alert-success';
      } else {
         alertClassMap = 'alert-secondary'; // Default for secondary/other
      }
      
      return { 
        title: action.label, 
        icon: action.icon, 
        alertClass: alertClassMap
      };
    }
    
    // Default fallback if status is unknown
    return { 
      title: status, 
      icon: 'fa-solid fa-question-circle', 
      alertClass: 'alert-secondary' 
    };
  }

  // Updates the component's state based on the provided VehicleStatus
  private updateUIStatus(newStatus: VehicleStatus): void {
    const props = this.getStatusDisplayProps(newStatus);
    this.currentStatus.title = props.title;
    this.currentStatus.icon = props.icon;
    this.currentStatus.alertClass = props.alertClass;
    
    // Set description based on status title
    switch(newStatus) {
      case 'متاح':
        this.currentStatus.description = 'المركبة جاهزة للاستجابة للحالات.';
        break;
      case 'في الطريق للمريض':
        this.currentStatus.description = 'أنت حالياً في الطريق إلى مريض.';
        break;
      case 'في الموقع':
        this.currentStatus.description = 'أنت متواجد حالياً في موقع المريض.';
        break;
      case 'في الطريق للمستشفى':
        this.currentStatus.description = 'أنت حالياً في الطريق لنقل المريض إلى المستشفى/الوجهة.';
        break;
      case 'في الوجهة':
        this.currentStatus.description = 'وصلت إلى المستشفى/الوجهة.';
        break;
      case 'خارج الخدمة':
        this.currentStatus.description = 'المركبة غير متاحة مؤقتاً (استراحة، صيانة، إلخ).';
        break;
      case 'إنهاء الخدمة':
        this.currentStatus.description = 'تم إنهاء المناوبة لهذا اليوم.';
        break;
      default:
        this.currentStatus.description = 'حالة غير معروفة.';
    }
  }


  // تحديث الحالة مع إشعار Toast وباستدعاء الـ API
  updateStatus(action: StatusAction) {
    if (!this.vehicleId) {
      this.toastService.error('تعذر تحديث الحالة: مُعرف المركبة مفقود.', 5000);
      return;
    }
    
    // Determine if manualOverride is needed (e.g., for off-duty status that shouldn't affect a trip)
    // Here, we assume status updates in the UI are manual and should override automatic trip status logic 
    // for statuses like 'خارج الخدمة' or if an admin explicitly wants to control it.
    // For this implementation, we will use 'manualOverride = false' for trip statuses to allow backend logic,
    // and 'manualOverride = true' for end-of-shift statuses to explicitly decouple them from active trips.
    let manualOverride = ['خارج الخدمة', 'إنهاء الخدمة'].includes(action.status);
    
    this.vehicleService.updateStatus(this.vehicleId, action.status, manualOverride).subscribe({
      next: () => {
        // Update UI only after successful API call
        this.updateUIStatus(action.status);
        this.toastService.success(`تم تحديث الحالة إلى: ${action.label}`, 3000);
      },
      error: (err) => {
        console.error('Status update failed:', err);
        this.toastService.error(`فشل تحديث الحالة إلى ${action.label}.`, 5000);
      }
    });
  }
}