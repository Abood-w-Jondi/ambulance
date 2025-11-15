import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardStats } from '../../shared/services/dashboard.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  isLoading = signal(false);
  dashboardStats = signal<DashboardStats | null>(null);

  constructor(
    private dashboardService: DashboardService,
    private toastService: ToastService
  ) {}

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
}
