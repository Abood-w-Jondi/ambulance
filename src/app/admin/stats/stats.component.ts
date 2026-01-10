import { ChangeDetectionStrategy, Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GlobalVarsService } from '../../global-vars.service';
import { StatsService, StatisticsResponse, MonthlyBreakdownResponse } from '../../shared/services/stats.service';
import { ToastService } from '../../shared/services/toast.service';
import { ExportService, ExportSheet } from '../../shared/services/export.service';
import { VehicleService } from '../../shared/services/vehicle.service';

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
    private toastService: ToastService,
    private exportService: ExportService,
    private vehicleService: VehicleService
  ) {
    this.globalVarsService.setGlobalHeader('الإحصائيات');
  }

  ngOnInit(): void {
    this.loadStats();
    this.loadVehicles();
  }

  // --- الحالة والبيانات ---
  selectedRange = signal<'week' | 'month' | 'custom'>('week');
  customStartDate = signal<string>('');
  customEndDate = signal<string>('');
  isLoading = signal<boolean>(false);
  statsData = signal<StatisticsResponse | null>(null);

  // Export state
  isExportModalOpen = signal<boolean>(false);
  isExporting = signal<boolean>(false);
  exportYear = signal<number>(new Date().getFullYear());
  exportStartDate = signal<string>('');
  exportEndDate = signal<string>('');
  exportVehicleId = signal<string>('');
  exportPeriodType = signal<'yearly' | 'custom'>('yearly');
  vehicles = signal<any[]>([]);

  // --- Helper Methods ---

  // Helper to format currency (e.g., 1532 -> "1,532₪")
  private formatCurrency(value: number): string {
    return `${Math.round(value).toLocaleString('en-US')}₪`;
  }

  // Load statistics from API
  loadStats(): void {
    this.isLoading.set(true);
    const range = this.selectedRange();

    let params: any = { period: range , _cached : 'false' };

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
        console.log(data)
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
        { title: 'حصة المالك', value: '...', trend: '...', trendClass: 'text-secondary' },
        { title: 'حصة الشركة', value: '...', trend: '...', trendClass: 'text-secondary' },
      ];
    }

    // 1. Calculate Total Costs
    const totalCosts = (data.fuel.totalCost || 0) +
                       (data.maintenance.totalCost || 0) +
                       (data.revenue.totalDriverShare || 0) +
                       (data.revenue.totalParamedicShare || 0) +
                       (data.revenue.totalOtherExpenses || 0);

    // 2. Calculate Base Values
    const netProfit = (data.revenue.payedRevenue || 0) - totalCosts;
    
    // 3. New shares logic
    const ownerShare = data.revenue.totalDriverShare || 0; // Owner = Driver
    const companyShare = netProfit - ownerShare;           // Company = Net - Owner

    return [
      {
        title: 'إجمالي الرحلات',
        value: (data.trips.total || 0).toLocaleString('en-US'),
        trend: 'N/A',
        trendClass: 'text-secondary'
      },
      {
        title: 'إجمالي الإيرادات',
        value: this.formatCurrency(data.revenue.payedRevenue || 0),
        trend: 'N/A',
        trendClass: 'text-secondary'
      },
      {
        title: 'إجمالي التكاليف',
        value: this.formatCurrency(totalCosts),
        trend: 'N/A',
        trendClass: 'text-secondary'
      },
      {
        title: 'صافي الأرباح',
        value: this.formatCurrency(netProfit),
        trend: 'N/A',
        trendClass: netProfit >= 0 ? 'text-success-up' : 'text-danger-down'
      },
      /* Added Cards */
      {
        title: 'حصة المالك',
        value: this.formatCurrency(ownerShare),
        trend: 'N/A',
        trendClass: 'text-info'
      },
      {
        title: 'حصة الشركة',
        value: this.formatCurrency(companyShare),
        trend: 'الصافي بعد الوقود المدفوع و ليس المفترض',
        trendClass: companyShare >= 0 ? 'text-primary' : 'text-danger'
      }
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
    const driverShare = data.revenue.totalDriverShare || 0;
    const paramedicShare = data.revenue.totalParamedicShare || 0;
    const otherExpenses = data.revenue.totalOtherExpenses || 0;

    const total = fuelCost + maintenanceCost + driverShare + paramedicShare + otherExpenses;
    if (total === 0) return [];

    return [
      {
        label: 'الوقود',
        value: this.formatCurrency(fuelCost),
        percentage: Math.round((fuelCost / total) * 100),
        color: 'info'
      },
      {
        label: 'الصيانة',
        value: this.formatCurrency(maintenanceCost),
        percentage: Math.round((maintenanceCost / total) * 100),
        color: 'success'
      },
      {
        label: 'حصة السائقين',
        value: this.formatCurrency(driverShare),
        percentage: Math.round((driverShare / total) * 100),
        color: 'warning'
      },
      {
        label: 'حصة المسعفين',
        value: this.formatCurrency(paramedicShare),
        percentage: Math.round((paramedicShare / total) * 100),
        color: 'danger'
      },
      {
        label: 'مصاريف أخرى',
        value: this.formatCurrency(otherExpenses),
        percentage: Math.round((otherExpenses / total) * 100),
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
      return costs ? costs.value : '0₪';
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

  // Load vehicles for vehicle-specific export
  loadVehicles(): void {
    this.vehicleService.getVehicles({ limit: 1000 }).subscribe({
      next: (response) => {
        this.vehicles.set(response.data);
      },
      error: (error) => {
        console.error('Error loading vehicles:', error);
      }
    });
  }

  // Open export modal
  openExportModal(): void {
    this.isExportModalOpen.set(true);
  }

  // Close export modal
  closeExportModal(): void {
    this.isExportModalOpen.set(false);
  }

  // Export annual statement to Excel
  exportAnnualStatement(): void {
    const periodType = this.exportPeriodType();
    const vehicleId = this.exportVehicleId();

    // Validate inputs
    if (periodType === 'yearly') {
      const year = this.exportYear();
      if (!year || year < 2020 || year > 2100) {
        this.toastService.error('الرجاء إدخال سنة صحيحة');
        return;
      }
    } else if (periodType === 'custom') {
      const startDate = this.exportStartDate();
      const endDate = this.exportEndDate();
      if (!startDate || !endDate) {
        this.toastService.error('الرجاء تحديد تاريخ البداية والنهاية');
        return;
      }
    }

    this.isExporting.set(true);

    // Fetch monthly breakdown data
    const observable = periodType === 'yearly'
      ? this.statsService.getYearlyBreakdown(this.exportYear(), vehicleId || undefined)
      : this.statsService.getCustomRangeBreakdown(this.exportStartDate(), this.exportEndDate(), vehicleId || undefined);

    observable.subscribe({
      next: (data) => {
        this.generateExcelReport(data);
        this.isExporting.set(false);
        this.closeExportModal();
      },
      error: (error) => {
        console.error('Error fetching monthly breakdown:', error);
        this.toastService.error('فشل جلب البيانات للتصدير');
        this.isExporting.set(false);
      }
    });
  }

  // Generate multi-sheet Excel report
  private generateExcelReport(data: MonthlyBreakdownResponse): void {
    const sheets: ExportSheet[] = [];

    // Sheet 1: Monthly Summary
    const summaryColumns = [
      { header: 'الشهر', key: 'monthName', width: 12 },
      { header: 'السنة', key: 'year', width: 10 },
      { header: 'عدد الرحلات', key: 'totalTrips', width: 12 },
      { header: 'الإيرادات (₪)', key: 'totalRevenue', width: 15 },
      { header: 'الوقود (لتر)', key: 'fuelLiters', width: 12 },
      { header: 'تكلفة الوقود (₪)', key: 'fuelCost', width: 15 },
      { header: 'الصيانة (₪)', key: 'maintenanceCost', width: 15 },
      { header: 'حصة المسعفين (₪)', key: 'paramedicShare', width: 15 },
      { header: 'حصة السائقين (₪)', key: 'driverShare', width: 15 },
      { header: 'حصة الشركة (₪)', key: 'companyShare', width: 15 },
      { header: 'حصة المالك (₪)', key: 'ownerShare', width: 15 }
    ];

    // Add odometer columns for vehicle-specific exports
    if (data.vehicleId) {
      summaryColumns.push(
        { header: 'قراءة العداد (بداية)', key: 'odometerStart', width: 18 },
        { header: 'قراءة العداد (نهاية)', key: 'odometerEnd', width: 18 },
        { header: 'إجمالي الكيلومترات', key: 'totalKm', width: 18 }
      );
    }
 //come back here later
    const summaryData = data.monthlyBreakdown.map(month => ({
      monthName: month.monthName,
      year: month.year,
      totalTrips: month.trips.total,
      totalRevenue: month.revenue.totalRevenue.toFixed(2),
      fuelLiters: month.fuel.totalLiters.toFixed(2),
      fuelCost: month.fuel.totalCost.toFixed(2),
      maintenanceCost: month.maintenance.totalCost.toFixed(2),
      paramedicShare: month.revenue.totalParamedicShare.toFixed(2),
      driverShare: month.revenue.totalDriverShare.toFixed(2),
      companyShare: month.revenue.totalCompanyShare.toFixed(2),
      ownerShare: month.revenue.totalOwnerShare.toFixed(2),
      ...(month.odometer ? {
        odometerStart: month.odometer.startReading,
        odometerEnd: month.odometer.endReading,
        totalKm: month.odometer.totalKm
      } : {})
    }));

    // Add totals row
    summaryData.push({
      monthName: 'الإجمالي',
      year: '',
      totalTrips: data.totals.trips.total,
      totalRevenue: data.totals.revenue.totalRevenue.toFixed(2),
      fuelLiters: data.totals.fuel.totalLiters.toFixed(2),
      fuelCost: data.totals.fuel.totalCost.toFixed(2),
      maintenanceCost: data.totals.maintenance.totalCost.toFixed(2),
      paramedicShare: data.totals.revenue.totalParamedicShare.toFixed(2),
      driverShare: data.totals.revenue.totalDriverShare.toFixed(2),
      companyShare: data.totals.revenue.totalCompanyShare.toFixed(2),
      ownerShare: data.totals.revenue.totalOwnerShare.toFixed(2)
    } as any);

    sheets.push({
      name: 'ملخص شهري',
      data: summaryData,
      columns: summaryColumns
    });

    // Sheet 2: Trip Status Breakdown
    const statusColumns = [
      { header: 'الشهر', key: 'monthName', width: 12 },
      { header: 'السنة', key: 'year', width: 10 }
    ];

    // Dynamically add columns for each status
    const allStatuses = new Set<string>();
    data.monthlyBreakdown.forEach(month => {
      Object.keys(month.trips.statusBreakdown).forEach(status => allStatuses.add(status));
    });

    allStatuses.forEach(status => {
      statusColumns.push({ header: status, key: status, width: 12 });
    });

    const statusData = data.monthlyBreakdown.map(month => {
      const row: any = {
        monthName: month.monthName,
        year: month.year
      };
      allStatuses.forEach(status => {
        row[status] = month.trips.statusBreakdown[status] || 0;
      });
      return row;
    });

    // Add totals row for status breakdown
    const statusTotalsRow: any = {
      monthName: 'الإجمالي',
      year: ''
    };
    allStatuses.forEach(status => {
      statusTotalsRow[status] = data.totals.trips.statusBreakdown[status] || 0;
    });
    statusData.push(statusTotalsRow);

    sheets.push({
      name: 'حالات الرحلات',
      data: statusData,
      columns: statusColumns
    });

    // Sheet 3: Financial Distribution
    const financialColumns = [
      { header: 'الشهر', key: 'monthName', width: 12 },
      { header: 'السنة', key: 'year', width: 10 },
      { header: 'المسعفين (₪)', key: 'paramedicShare', width: 15 },
      { header: 'السائقين (₪)', key: 'driverShare', width: 15 },
      { header: 'الشركة (₪)', key: 'companyShare', width: 15 },
      { header: 'المالك (₪)', key: 'ownerShare', width: 15 },
      { header: 'القروض (₪)', key: 'loanAmount', width: 15 }
    ];

    const financialData = data.monthlyBreakdown.map(month => ({
      monthName: month.monthName,
      year: month.year,
      paramedicShare: month.revenue.totalParamedicShare.toFixed(2),
      driverShare: month.revenue.totalDriverShare.toFixed(2),
      companyShare: month.revenue.totalCompanyShare.toFixed(2),
      ownerShare: month.revenue.totalOwnerShare.toFixed(2),
      loanAmount: month.revenue.loanAmount.toFixed(2)
    }));

    // Add totals row
    financialData.push({
      monthName: 'الإجمالي',
      year: '',
      paramedicShare: data.totals.revenue.totalParamedicShare.toFixed(2),
      driverShare: data.totals.revenue.totalDriverShare.toFixed(2),
      companyShare: data.totals.revenue.totalCompanyShare.toFixed(2),
      ownerShare: data.totals.revenue.totalOwnerShare.toFixed(2),
      loanAmount: data.totals.revenue.loanAmount.toFixed(2)
    } as any);

    sheets.push({
      name: 'التوزيع المالي',
      data: financialData,
      columns: financialColumns
    });

    // Generate filename
    const filename = data.vehicleId
      ? `annual_statement_vehicle_${data.vehicleId}_${data.period.startDate}`
      : `annual_statement_${data.period.startDate}`;

    // Export to Excel
    this.exportService.exportToExcelMultiSheet(sheets, filename);
    this.toastService.success('تم تصدير التقرير السنوي بنجاح');
  }
}