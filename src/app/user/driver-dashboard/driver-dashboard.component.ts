import { Component, OnInit } from '@angular/core';
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

  constructor(private router: Router) { }

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
  }

  closeFuelModal(): void {
    this.showFuelModal = false;
  }

  openMaintenanceModal(): void {
    this.showMaintenanceModal = true;
  }

  closeMaintenanceModal(): void {
    this.showMaintenanceModal = false;
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
    // Reload data if needed
  }

  onMaintenanceAdded(): void {
    this.closeMaintenanceModal();
    // Reload data if needed
  }
}