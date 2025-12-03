import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DashboardService, DashboardStats } from '../../shared/services/dashboard.service';
import { ToastService } from '../../shared/services/toast.service';
import { GlobalVarsService } from '../../global-vars.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  isLoading = signal(false);
  dashboardStats = signal<DashboardStats | null>(null);

  constructor(
    private dashboardService: DashboardService,
    private toastService: ToastService,
    private globalVars: GlobalVarsService,
    private router: Router,
    private authService: AuthService
  ) {
    this.globalVars.setGlobalHeader('لوحة التحكم');
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);

    this.dashboardService.getDashboardStats().subscribe({
      next: (stats) => {
        this.dashboardStats.set(stats);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        this.toastService.error('فشل تحميل إحصائيات لوحة التحكم');
        this.isLoading.set(false);
      }
    });
  }

  navigateToTrips(): void {
    this.router.navigate(['/admin/trips']);
  }

  navigateToDrivers(): void {
    this.router.navigate(['/admin/drivers-list']);
  }

  navigateToVehicleMap(): void {
    this.router.navigate(['/admin/vehicle-map']);
  }

  switchToDriverView(): void {
    this.router.navigate(['/user/driver-dashboard']);
  }

  logout(): void {
    const confirmed = confirm('هل أنت متأكد من تسجيل الخروج؟');
    if (!confirmed) return;

    this.authService.logout().subscribe({
      next: () => this.toastService.success('تم تسجيل الخروج بنجاح'),
      error: (err) => {
        console.error('Logout failed:', err);
        this.toastService.error('فشل تسجيل الخروج');
      }
    });
  }

  getRecentTripIcon(status: string): string {
    switch (status) {
      case 'تم النقل':
        return 'fa-check';
      case 'ينقل':
        return 'fa-clock';
      case 'بلاغ كاذب':
      case 'رفض النقل':
        return 'fa-times';
      default:
        return 'fa-ambulance';
    }
  }

  getRecentTripColor(status: string): string {
    switch (status) {
      case 'تم النقل':
        return '#28A745';
      case 'ينقل':
        return '#FFC107';
      case 'بلاغ كاذب':
      case 'رفض النقل':
        return '#DC3545';
      default:
        return '#6C757D';
    }
  }

  formatTripDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return `منذ ${diffDays} يوم`;
  }
}
