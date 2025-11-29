import { Component, OnInit } from '@angular/core';
import { ToastService } from '../../shared/services/toast.service';
import { TransactionService } from '../../shared/services/transaction.service';
import { AuthService } from '../../shared/services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Transaction, CollectionSummary } from '../../shared/models/transaction.model';

interface WalletSummary {
  currentBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  totalWithdrawals: number;
  lastPaymentDate: Date | null;
}

@Component({
  selector: 'app-wallet',
  imports: [FormsModule, CommonModule],
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit {

  walletSummary: WalletSummary = {
    currentBalance: 0,
    pendingBalance: 0,
    totalEarnings: 0,
    totalWithdrawals: 0,
    lastPaymentDate: null
  };
  public Math = Math;

  collectionSummary: CollectionSummary | null = null;
  payments: Transaction[] = [];
  filteredPayments: Transaction[] = [];

  selectedType: string = 'All';
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();

  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  totalItems: number = 0;

  loading: boolean = false;
  userId: string | null = null;

  paymentTypes: Array<{value: string, label: string}> = [
    { value: 'All', label: 'جميع العمليات' },
    { value: 'رحلة', label: 'رحلة' },
    { value: 'دفع', label: 'دفع' },
    { value: 'سحب', label: 'سحب' },
    { value: 'تعديل', label: 'تعديل' },
    { value: 'وقود', label: 'وقود' },
    { value: 'صيانة', label: 'صيانة' },
    { value: 'مكافأة', label: 'مكافأة' },
    { value: 'خصم', label: 'خصم' }
  ];

  months = [
    { value: 1, name: 'يناير' },
    { value: 2, name: 'فبراير' },
    { value: 3, name: 'مارس' },
    { value: 4, name: 'أبريل' },
    { value: 5, name: 'مايو' },
    { value: 6, name: 'يونيو' },
    { value: 7, name: 'يوليو' },
    { value: 8, name: 'أغسطس' },
    { value: 9, name: 'سبتمبر' },
    { value: 10, name: 'أكتوبر' },
    { value: 11, name: 'نوفمبر' },
    { value: 12, name: 'ديسمبر' }
  ];

  years: number[] = [];

  showWithdrawModal: boolean = false;
  withdrawAmount: number = 0;
  withdrawMethod: string = 'bank';

  constructor(
    private toastService: ToastService,
    private transactionService: TransactionService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.generateYears();

    // Get current user ID
    const user = this.authService.currentUser();
    if (user) {
      this.userId = user.id;
      this.loadWalletData();
      this.loadCollectionSummary();
      this.loadPayments();
    }
  }

  loadWalletData(): void {
    if (!this.userId) return;

    this.loading = true;
    // Get latest transaction to determine current balance
    this.transactionService.getUserTransactions(this.userId, { page: 1, limit: 1 })
      .subscribe({
        next: (response) => {
          if (response.data.length > 0) {
            this.walletSummary.currentBalance = response.data[0].balanceAfter;
            this.walletSummary.lastPaymentDate = response.data[0].createdAt;
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to load wallet data:', error);
          this.toastService.error('فشل تحميل بيانات المحفظة');
          this.loading = false;
        }
      });
  }

  loadCollectionSummary(): void {
    if (!this.userId) return;

    this.transactionService.getCollectionSummary(this.userId)
      .subscribe({
        next: (summary) => {
          this.collectionSummary = summary;
          this.walletSummary.pendingBalance = summary.pendingCollection;
        },
        error: (error) => {
          console.error('Failed to load collection summary:', error);
        }
      });
  }

  generateYears(): void {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 5; i--) {
      this.years.push(i);
    }
  }

  loadPayments(): void {
    if (!this.userId) return;

    this.loading = true;

    // Build date range from selected month/year
    const startDate = `${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
    const endDate = `${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}-${lastDay}`;

    this.transactionService.getUserTransactions(this.userId, {
      page: this.currentPage,
      limit: this.itemsPerPage,
      type: this.selectedType !== 'All' ? this.selectedType : undefined,
      startDate,
      endDate
    }).subscribe({
      next: (response) => {
        this.payments = response.data;
        this.totalItems = response.total;
        this.totalPages = Math.ceil(response.total / this.itemsPerPage);
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load payments:', error);
        this.toastService.error('فشل تحميل سجل العمليات');
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadPayments();
  }

  getPaginatedPayments(): Transaction[] {
    return this.payments; // Already paginated from backend
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadPayments();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadPayments();
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadPayments();
  }

  getPaymentIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'رحلة': 'fa-route',
      'دفع': 'fa-arrow-down',
      'سحب': 'fa-arrow-up',
      'مكافأة': 'fa-gift',
      'تعديل': 'fa-edit',
      'وقود': 'fa-gas-pump',
      'صيانة': 'fa-wrench',
      'خصم': 'fa-minus-circle'
    };
    return icons[type] || 'fa-money-bill';
  }

  getPaymentColor(type: string): string {
    const colors: { [key: string]: string } = {
      'رحلة': 'text-primary',
      'دفع': 'text-success',
      'سحب': 'text-danger',
      'مكافأة': 'text-warning',
      'تعديل': 'text-info',
      'وقود': 'text-secondary',
      'صيانة': 'text-secondary',
      'خصم': 'text-danger'
    };
    return colors[type] || 'text-secondary';
  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'مكتمل': 'bg-success',
      'معلق': 'bg-warning',
      'فاشل': 'bg-danger'
    };
    return classes[status] || 'bg-secondary';
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  openWithdrawModal(): void {
    this.showWithdrawModal = true;
    this.withdrawAmount = 0;
  }

  closeWithdrawModal(): void {
    this.showWithdrawModal = false;
  }

  submitWithdraw(): void {
    if (this.withdrawAmount > 0 && this.withdrawAmount <= this.walletSummary.currentBalance) {
      // TODO: Implement withdrawal request functionality
      console.log('طلب سحب:', {
        amount: this.withdrawAmount,
        method: this.withdrawMethod
      });
      this.toastService.success(`تم طلب سحب مبلغ ₪${this.withdrawAmount} (${this.withdrawMethod === 'bank' ? 'تحويل بنكي' : 'سحب نقدي'})`, 3000);
      this.closeWithdrawModal();
    }
  }
}