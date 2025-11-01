import { ChangeDetectionStrategy, Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalVarsService } from '../../global-vars.service';

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
  imports: [CommonModule],
  styleUrl: './stats.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsComponent {
  constructor(private globalVarsService: GlobalVarsService) {
    this.globalVarsService.setGlobalHeader('الإحصائيات');
  }

  // --- الحالة والبيانات ---
  selectedRange = signal<'week' | 'month' | 'custom'>('week');
  
  // بيانات الأسبوع (البيانات الأصلية)
  private statsWeek: StatCard[] = [
    { title: 'إجمالي الرحلات', value: '1,204', trend: '+5%', trendClass: 'text-success-up' },
    { title: 'إجمالي الإيرادات', value: '₪180.6K', trend: '+8%', trendClass: 'text-success-up' },
    { title: 'إجمالي التكاليف', value: '₪95.5K', trend: '-2%', trendClass: 'text-danger-down' },
    { title: 'صافي الأرباح', value: '₪85.1K', trend: '+15%', trendClass: 'text-success-up' },
  ];

  private transportationsWeek: TransportationDay[] = [
    { day: 'أحد', countPercentage: 70, isPeak: false },
    { day: 'إثن', countPercentage: 80, isPeak: false },
    { day: 'ثلث', countPercentage: 60, isPeak: false },
    { day: 'أرب', countPercentage: 90, isPeak: false },
    { day: 'خم', countPercentage: 40, isPeak: false },
    { day: 'جمعة', countPercentage: 100, isPeak: true }, // الذروة
    { day: 'سبت', countPercentage: 80, isPeak: false },
  ];

  private costBreakdownWeek: CostItem[] = [
    { label: 'الوقود', value: '₪42.9K', percentage: 45, color: 'info' },
    { label: 'الصيانة', value: '₪28.6K', percentage: 30, color: 'success' },
    { label: 'الرواتب', value: '₪14.3K', percentage: 15, color: 'warning' },
    { label: 'أخرى', value: '₪9.7K', percentage: 10, color: 'secondary' }
  ];
  
  // بيانات الشهر (بيانات وهمية للتجربة)
  private statsMonth: StatCard[] = [
    { title: 'إجمالي الرحلات', value: '4,500', trend: '+12%', trendClass: 'text-success-up' },
    { title: 'إجمالي الإيرادات', value: '₪720.5K', trend: '+18%', trendClass: 'text-success-up' },
    { title: 'إجمالي التكاليف', value: '₪380.1K', trend: '+5%', trendClass: 'text-danger-down' },
    { title: 'صافي الأرباح', value: '₪340.4K', trend: '+30%', trendClass: 'text-success-up' },
  ];

  private transportationsMonth: TransportationDay[] = [
    // بيانات شهرية وهمية
    { day: 'أسب1', countPercentage: 70, isPeak: false },
    { day: 'أسب2', countPercentage: 85, isPeak: false },
    { day: 'أسب3', countPercentage: 95, isPeak: true }, 
    { day: 'أسب4', countPercentage: 65, isPeak: false },
  ];

  private costBreakdownMonth: CostItem[] = [
    { label: 'الوقود', value: '₪171.1K', percentage: 40, color: 'info' }, 
    { label: 'الصيانة', value: '₪114.0K', percentage: 25, color: 'success' },
    { label: 'الرواتب', value: '₪76.0K', percentage: 20, color: 'warning' },
    { label: 'أخرى', value: '₪19.0K', percentage: 15, color: 'secondary' }
  ];

  // بيانات مخصصة (قابلة للتغيير عند تحديد نطاق مخصص)
  private statsCustom: StatCard[] = [
    { title: 'إجمالي الرحلات', value: 'N/A', trend: 'N/A', trendClass: 'text-secondary' },
    // ...
  ];
  
  // بيانات محسوبة بناءً على النطاق المحدد
  stats = computed(() => {
    switch (this.selectedRange()) {
      case 'month':
        return this.statsMonth;
      case 'custom':
        // يمكنك هنا استدعاء خدمة لجلب بيانات مخصصة بناءً على مدخلات المستخدم
        return this.statsCustom;
      case 'week':
      default:
        return this.statsWeek;
    }
  });

  transportations = computed(() => {
    switch (this.selectedRange()) {
      case 'month':
        return this.transportationsMonth;
      case 'custom':
        return []; // بيانات مخصصة فارغة افتراضياً
      case 'week':
      default:
        return this.transportationsWeek;
    }
  });

  costBreakdown = computed(() => {
    switch (this.selectedRange()) {
      case 'month':
        return this.costBreakdownMonth;
      case 'custom':
        return []; // بيانات مخصصة فارغة افتراضياً
      case 'week':
      default:
        return this.costBreakdownWeek;
    }
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