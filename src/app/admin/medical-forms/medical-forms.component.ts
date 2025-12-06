import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MedicalFormService } from '../../shared/services/medical-form.service';
import { ToastService } from '../../shared/services/toast.service';
import { MedicalForm, MedicalFormFilters } from '../../shared/models/medical-form.model';

interface FilterConfig {
  key: keyof MedicalFormFilters;
  label: string;
  type: 'text' | 'select' | 'date';
  placeholder?: string;
  colClass: string;
  options?: { value: any; label: string }[];
}

interface ColumnConfig {
  key: string;
  label: string;
  type: 'text' | 'badge' | 'progress' | 'date' | 'actions';
  getValue?: (form: MedicalForm) => any;
  getClass?: (form: MedicalForm) => string;
  render?: (form: MedicalForm) => string;
}

@Component({
  selector: 'app-medical-forms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './medical-forms.component.html',
  styleUrl: './medical-forms.component.css'
})
export class MedicalFormsComponent implements OnInit {
  medicalForms: MedicalForm[] = [];
  isLoading: boolean = false;

  // Configuration for filters
  filterConfigs: FilterConfig[] = [
    {
      key: 'patientName',
      label: 'اسم المريض',
      type: 'text',
      placeholder: 'ابحث باسم المريض...',
      colClass: 'col-md-3'
    },
    {
      key: 'driverName',
      label: 'اسم السائق',
      type: 'text',
      placeholder: 'ابحث باسم السائق...',
      colClass: 'col-md-3'
    },
    {
      key: 'isComplete',
      label: 'حالة الاكتمال',
      type: 'select',
      colClass: 'col-md-2',
      options: [
        { value: undefined, label: 'الكل' },
        { value: true, label: 'مكتمل' },
        { value: false, label: 'غير مكتمل' }
      ]
    },
    {
      key: 'isLocked',
      label: 'حالة القفل',
      type: 'select',
      colClass: 'col-md-2',
      options: [
        { value: undefined, label: 'الكل' },
        { value: true, label: 'مقفل' },
        { value: false, label: 'مفتوح' }
      ]
    },
    {
      key: 'dateFrom',
      label: 'من تاريخ',
      type: 'date',
      colClass: 'col-md-2'
    },
    {
      key: 'dateTo',
      label: 'إلى تاريخ',
      type: 'date',
      colClass: 'col-md-2'
    }
  ];

  // Configuration for table columns
  columnConfigs: ColumnConfig[] = [
    {
      key: 'tripId',
      label: 'معرّف الرحلة',
      type: 'text',
      getValue: (form) => form.tripId
    },
    {
      key: 'patientName',
      label: 'اسم المريض',
      type: 'text',
      getValue: (form) => form.patientName || 'غير محدد'
    },
    {
      key: 'driverName',
      label: 'السائق',
      type: 'text',
      getValue: (form) => form.driverName || 'غير محدد'
    },
    {
      key: 'completionPercentage',
      label: 'نسبة الاكتمال',
      type: 'progress',
      getValue: (form) => form.completionPercentage
    },
    {
      key: 'isComplete',
      label: 'الحالة',
      type: 'badge',
      getValue: (form) => form.isComplete,
      getClass: (form) => form.isComplete ? 'bg-success' : 'bg-warning',
      render: (form) => form.isComplete ? 'مكتمل' : 'غير مكتمل'
    },
    {
      key: 'isLocked',
      label: 'القفل',
      type: 'badge',
      getValue: (form) => form.isLocked,
      getClass: (form) => form.isLocked ? 'bg-danger' : 'bg-success',
      render: (form) => form.isLocked ? 'مقفل' : 'مفتوح'
    },
    {
      key: 'updatedAt',
      label: 'آخر تحديث',
      type: 'date',
      getValue: (form) => form.updatedAt
    },
    {
      key: 'actions',
      label: 'الإجراءات',
      type: 'actions',
      getValue: () => null
    }
  ];

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 20;
  totalItems: number = 0;
  totalPages: number = 0;

  // Filters
  filters: MedicalFormFilters = {
    page: 1,
    limit: 20,
    isComplete: undefined,
    isLocked: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    driverName: undefined,
    patientName: undefined
  };

  showFilters: boolean = false;

  // Selected form for viewing
  selectedForm: MedicalForm | null = null;
  showViewModal: boolean = false;

  constructor(
    private medicalFormService: MedicalFormService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMedicalForms();
  }

  loadMedicalForms(): void {
    this.isLoading = true;
    this.filters.page = this.currentPage;
    this.filters.limit = this.itemsPerPage;

    this.medicalFormService.getMedicalForms(this.filters).subscribe({
      next: (response) => {
        this.medicalForms = response.data;
        this.totalItems = response.total;
        this.totalPages = response.totalPages;
        this.currentPage = response.page;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load medical forms:', error);
        this.toastService.error('فشل تحميل النماذج الطبية');
        this.isLoading = false;
      }
    });
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadMedicalForms();
  }

  resetFilters(): void {
    this.filters = {
      page: 1,
      limit: 20,
      isComplete: undefined,
      isLocked: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      driverName: undefined,
      patientName: undefined
    };
    this.currentPage = 1;
    this.loadMedicalForms();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadMedicalForms();
    }
  }

  viewForm(form: MedicalForm): void {
    this.selectedForm = form;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedForm = null;
  }

  editForm(form: MedicalForm): void {
    this.router.navigate(['/user/medical-form', form.tripId]);
  }

  unlockForm(form: MedicalForm): void {
    if (!confirm(`هل أنت متأكد من رغبتك في فتح النموذج الطبي للرحلة ${form.tripId}؟`)) {
      return;
    }

    this.medicalFormService.unlockMedicalForm(form.tripId).subscribe({
      next: () => {
        this.toastService.success('تم فتح النموذج بنجاح');
        this.loadMedicalForms();
      },
      error: (error) => {
        console.error('Failed to unlock form:', error);
        this.toastService.error('فشل فتح النموذج');
      }
    });
  }

  getCompletionColor(percentage: number): string {
    if (percentage >= 75) return '#28a745';
    if (percentage >= 50) return '#ffc107';
    if (percentage >= 25) return '#fd7e14';
    return '#dc3545';
  }

  formatDate(dateInput: string | Date): string {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPaginationArray(): number[] {
    const maxVisible = 5;
    const pages: number[] = [];

    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }
}
