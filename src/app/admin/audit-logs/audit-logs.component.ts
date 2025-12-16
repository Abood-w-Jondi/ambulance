import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogService, AuditLog, AuditLogQueryParams } from '../../shared/services/audit-log.service';
import { ToastService } from '../../shared/services/toast.service';
import { GlobalVarsService } from '../../global-vars.service';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.css']
})
export class AuditLogsComponent implements OnInit {
  logs = signal<AuditLog[]>([]);
  loading = signal(false);
  public Math = Math;
  

  // Pagination
  currentPage = 1;
  limit = 50;
  total = 0;
  totalPages = 0;

  // Filters
  filters: AuditLogQueryParams = {
    startDate: this.getDateDaysAgo(7),
    endDate: this.getTodayDate(),
    entityType: '',
    actionType: '',
    isFinancialChange: undefined
  };

  // Expanded rows
  expandedRows = new Set<string>();

  // Label mappings
  entityTypeLabels: Record<string, string> = {
    'driver': 'سائق',
    'vehicle': 'مركبة',
    'trip': 'رحلة',
    'paramedic': 'مسعف',
    'user': 'مستخدم',
    'fuel_record': 'وقود',
    'maintenance_record' : 'صيانة'
  };

  actionTypeLabels: Record<string, string> = {
    'driver_login': 'تسجيل دخول السائق',
    'driver_logout': 'تسجيل خروج السائق',
    'status_change': 'تغيير الحالة',
    'create': 'إنشاء',
    'update': 'تعديل',
    'delete': 'حذف',
    'logout_without_checklist' : 'تسجيل خروج من دون التشكلست',
    'trip_accepted': 'قبول رحلة',
    'trip_closed': 'إنهاء رحلة',
    'checklist_completed': 'ادخال تشكلست',
    'trip_unclosed' : 'اعادة فتح رحلة من المدير',
    'update-trip' : 'تعديل على رحلة',
    'createM' : 'اضافة صيانة'
  };

  entityTypeKeys: string[] = Object.keys(this.entityTypeLabels);
actionTypeKeys: string[] = Object.keys(this.actionTypeLabels);

  constructor(
    private auditLogService: AuditLogService,
    private toastService: ToastService,
    private globalVarsService: GlobalVarsService
  ) {
    this.globalVarsService.setGlobalHeader('سجل التدقيق');
  }

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading.set(true);

    const params: AuditLogQueryParams = {
      ...this.filters,
      page: this.currentPage,
      limit: this.limit
    };

    this.auditLogService.getAuditLogs(params).subscribe({
      next: (response) => {
        this.logs.set(response.data);
        this.total = response.total;
        this.totalPages = response.totalPages;
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load audit logs:', err);
        this.toastService.error('فشل تحميل سجل التدقيق');
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadLogs();
  }

  resetFilters(): void {
    this.filters = {
      startDate: this.getDateDaysAgo(7),
      endDate: this.getTodayDate(),
      entityType: '',
      actionType: '',
      isFinancialChange: undefined
    };
    this.currentPage = 1;
    this.loadLogs();
  }

  toggleRow(logId: string): void {
    if (this.expandedRows.has(logId)) {
      this.expandedRows.delete(logId);
    } else {
      this.expandedRows.add(logId);
    }
  }

  isExpanded(logId: string): boolean {
    return this.expandedRows.has(logId);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadLogs();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadLogs();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadLogs();
    }
  }

  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  getEntityTypeLabel(type: string): string {
    return this.entityTypeLabels[type] || type;
  }

  getActionTypeLabel(type: string): string {
    return this.actionTypeLabels[type] || type;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getChangedFieldsDisplay(log: AuditLog): string {
    return log.changedFields.join(', ');
  }

  getValueDisplay(value: any): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }
}
