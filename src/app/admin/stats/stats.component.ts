import { ChangeDetectionStrategy, Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GlobalVarsService } from '../../global-vars.service';
import { StatsService, StatisticsResponse } from '../../shared/services/stats.service';
import { ToastService } from '../../shared/services/toast.service';

// واجهة لبطاقات الملخص الإحصائي
interface StatCard {
  title: string;
  value: string;
  trend: string;
  trendClass: string;
}

// واجهة لبيانات الرسم البياني العمودي
interface TransportationDay {
  day: string;
  countPercentage: number; // ارتفاع العمود (0-100)
  isPeak: boolean;
}

// واجهة لتفاصيل التكلفة (الرسم البياني الدائري)
interface CostItem {
  label: string;
  value: string;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-stats',
  standalone: true,
  templateUrl: './stats.component.html',
  imports: [CommonModule, FormsModule],
  styleUrl: './stats.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsComponent implements OnInit {
  constructor(
    private globalVarsService: GlobalVarsService,
    private statsService: StatsService,
    private toastService: ToastService
  ) {
    this.globalVarsService.setGlobalHeader('الإحصائيات');
  }

  ngOnInit(): void {
    this.loadStats();
  }

  // --- الحالة والبيانات ---
  selectedRange = signal<'week' | 'month' | 'custom'>('week');
  customStartDate = signal<string>('');
  customEndDate = signal<string>('');
  isLoading = signal<boolean>(false);
  statsData = signal<StatisticsResponse | null>(null);

  // Load statistics from API
  loadStats(): void {
    this.isLoading.set(true);
    const range = this.selectedRange();

    let params: any = { period: range };

    if (range === 'custom') {
      const start = this.customStartDate();
      const end = this.customEndDate();

      if (!start || !end) {
        this.toastService.error('الرجاء تحديد تاريخ البداية والنهاية');
        this.isLoading.set(false);
        return;
      }

      params.startDate = start;
      params.endDate = end;
    }

    this.statsService.getStatistics(params).subscribe({
      next: (data) => {
        this.statsData.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
        this.toastService.error('فشل تحميل الإحصائيات');
        this.isLoading.set(false);
      }
    });
  }

  // بيانات محسوبة بناءً على البيانات الحقيقية من API
  stats = computed((): StatCard[] => {
    const data = this.statsData();
    if (!data) {
      return [
        { title: 'إجمالي الرحلات', value: '...', trend: '...', trendClass: 'text-secondary' },
        { title: 'إجمالي الإيرادات', value: '...', trend: '...', trendClass: 'text-secondary' },
        { title: 'إجمالي التكاليف', value: '...', trend: '...', trendClass: 'text-secondary' },
        { title: 'صافي الأرباح', value: '...', trend: '...', trendClass: 'text-secondary' },
      ];
    }

    const totalCosts = (data.fuel.totalCost || 0) + (data.maintenance.totalCost || 0);
    const netProfit = (data.revenue.totalPayed || 0) - totalCosts;

    return [
      {
        title: 'إجمالي الرحلات',
        value: (data.trips.total || 0).toString(),
        trend: 'N/A',
        trendClass: 'text-secondary'
      },
      {
        title: 'إجمالي الإيرادات',
        value: `₪${((data.revenue.totalRevenue || 0) / 1000).toFixed(1)}K`,
        trend: 'N/A',
        trendClass: 'text-secondary'
      },
      {
        title: 'إجمالي التكاليف',
        value: `₪${(totalCosts / 1000).toFixed(1)}K`,
        trend: 'N/A',
        trendClass: 'text-secondary'
      },
      {
        title: 'صافي الأرباح',
        value: `₪${(netProfit / 1000).toFixed(1)}K`,
        trend: 'N/A',
        trendClass: netProfit >= 0 ? 'text-success-up' : 'text-danger-down'
      },
    ];
  });

  transportations = computed((): TransportationDay[] => {
    // Placeholder for now - would need time-series data from backend
    return [];
  });

  costBreakdown = computed((): CostItem[] => {
    const data = this.statsData();
    if (!data) return [];

    const fuelCost = data.fuel.totalCost || 0;
    const maintenanceCost = data.maintenance.totalCost || 0;
    const salaryCost = (data.revenue.totalDriverShare || 0) + (data.revenue.totalParamedicShare || 0);
    const otherCost = 0; // Could include other expenses from trips

    const total = fuelCost + maintenanceCost + salaryCost + otherCost;
    if (total === 0) return [];

    return [
      {
        label: 'الوقود',
        value: `₪${(fuelCost / 1000).toFixed(1)}K`,
        percentage: Math.round((fuelCost / total) * 100),
        color: 'info'
      },
      {
        label: 'الصيانة',
        value: `₪${(maintenanceCost / 1000).toFixed(1)}K`,
        percentage: Math.round((maintenanceCost / total) * 100),
        color: 'success'
      },
      {
        label: 'الرواتب',
        value: `₪${(salaryCost / 1000).toFixed(1)}K`,
        percentage: Math.round((salaryCost / total) * 100),
        color: 'warning'
      },
      {
        label: 'أخرى',
        value: `₪${(otherCost / 1000).toFixed(1)}K`,
        percentage: Math.round((otherCost / total) * 100),
        color: 'secondary'
      }
    ].filter(item => item.percentage > 0);
  });

  // عنوان ديناميكي للرسم البياني العمودي
  transportationsTitle = computed(() => {
    switch (this.selectedRange()) {
      case 'month':
        return 'الرحلات حسب الأسبوع';
      case 'custom':
        return 'الرحلات خلال الفترة المخصصة';
      case 'week':
      default:
        return 'الرحلات حسب اليوم';
    }
  });
  
  // قيمة إجمالي التكاليف لعرضها في منتصف الرسم البياني الدائري
  totalCostValue = computed(() => {
      const costs = this.stats().find(s => s.title === 'إجمالي التكاليف');
      return costs ? costs.value : '₪0K';
  });

  // --- Methods ---

  /**
   * Called when user selects a different range (week/month/custom)
   */
  onRangeChange(range: 'week' | 'month' | 'custom'): void {
    this.selectedRange.set(range);
    if (range !== 'custom') {
      // Load stats immediately for week/month
      this.loadStats();
    }
    // For custom, wait for user to click "تطبيق" button
  }

  /**
   * Apply custom date range filter
   */
  applyCustomRange(): void {
    const start = this.customStartDate();
    const end = this.customEndDate();

    if (!start || !end) {
      this.toastService.error('الرجاء تحديد تاريخ البداية والنهاية');
      return;
    }

    if (new Date(start) > new Date(end)) {
      this.toastService.error('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
      return;
    }

    this.loadStats();
  }

  /**
   * Refresh current stats
   */
  refreshStats(): void {
    this.loadStats();
  }

  // --- دالة لحساب الإزاحة لـ SVG (stroke-dashoffset) ---
  /**
   * تحسب الإزاحة لـ stroke-dashoffset لكل جزء من الرسم البياني الدائري.
   */
  calculateOffset(label: string): string {
    const data = this.costBreakdown();
    let offset = 0;

    // إيجاد فهرس العنصر الحالي
    const currentIndex = data.findIndex(item => item.label === label);

    if (currentIndex === -1) return '0';

    // جمع نسب جميع العناصر السابقة
    for (let i = 0; i < currentIndex; i++) {
        offset += data[i].percentage;
    }

    // الإزاحة هي سالب النسبة المئوية التراكمية للأجزاء السابقة
    return '-' + offset;
  }
}