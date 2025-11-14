import { Component, OnInit } from '@angular/core';
import { ToastService } from '../../shared/services/toast.service';
import { Router } from '@angular/router';
import { AddMaintenanceModalComponent } from '../add-maintenance-modal/add-maintenance-modal.component';
import { AddFuelModalComponent } from '../add-fuel-modal/add-fuel-modal.component';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-driver-dashboard',
  imports: [AddMaintenanceModalComponent, AddFuelModalComponent, CommonModule],
  templateUrl: './driver-dashboard.component.html',
  styleUrls: ['./driver-dashboard.component.css']
})
export class DriverDashboardComponent implements OnInit {
  driverName: string = 'جون دو';
  driverStatus: string = 'متاح';
  tripsCompleted: number = 4;
  totalEarnings: number = 320.50;
  currentLocation: string = 'شارع السوق 123، سان فرانسيسكو، كاليفورنيا';
  
  showFuelModal: boolean = false;
  showMaintenanceModal: boolean = false;

  constructor(private router: Router, private toastService: ToastService) { }

  ngOnInit(): void {
    // Load driver data from service
    this.loadDriverData();
  }

  loadDriverData(): void {
    // TODO: Implement service call to load driver data
  }

  startTrip(): void {
    this.router.navigate(['/user/accept-trips']);
  }

  endShift(): void {
    // TODO: Implement end shift logic
    this.driverStatus = 'غير متاح';
  }

  openFuelModal(): void {
  this.showFuelModal = true;
  this.toastService.info('فتح نافذة إضافة وقود', 3000);
  }

  closeFuelModal(): void {
  this.showFuelModal = false;
  this.toastService.info('تم إغلاق نافذة إضافة الوقود', 3000);
  }

  openMaintenanceModal(): void {
  this.showMaintenanceModal = true;
  this.toastService.info('فتح نافذة إضافة صيانة', 3000);
  }

  closeMaintenanceModal(): void {
  this.showMaintenanceModal = false;
  this.toastService.info('تم إغلاق نافذة إضافة الصيانة', 3000);
  }

  viewTrips(): void {
    this.router.navigate(['/user/trips-history']);
  }

  viewWallet(): void {
    this.router.navigate(['/user/wallet']);
  }

  refreshLocation(): void {
    // TODO: Implement location refresh
    console.log('تحديث الموقع...');
  }

  onFuelAdded(): void {
  this.closeFuelModal();
  this.toastService.success('تمت إضافة سجل وقود جديد', 3000);
  // Reload data if needed
  }

  onMaintenanceAdded(): void {
  this.closeMaintenanceModal();
  this.toastService.success('تمت إضافة سجل صيانة جديد', 3000);
  // Reload data if needed
  }
}