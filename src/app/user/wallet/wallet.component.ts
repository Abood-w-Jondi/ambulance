import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


interface Payment {
  id: string;
  date: Date;
  amount: number;
  type: 'إيداع' | 'سحب' | 'رحلة' | 'مكافأة';
  description: string;
  status: 'مكتمل' | 'معلق' | 'فاشل';
}

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
    currentBalance: 1250.75,
    pendingBalance: 320.50,
    totalEarnings: 5680.25,
    totalWithdrawals: 4500.00,
    lastPaymentDate: new Date()
  };
  public Math = Math;

  payments: Payment[] = [];
  filteredPayments: Payment[] = [];
  
  selectedType: string = 'All';
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  paymentTypes: Array<{value: string, label: string}> = [
    { value: 'All', label: 'جميع العمليات' },
    { value: 'رحلة', label: 'رحلة' },
    { value: 'إيداع', label: 'إيداع' },
    { value: 'سحب', label: 'سحب' },
    { value: 'مكافأة', label: 'مكافأة' }
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

  constructor() { }

  ngOnInit(): void {
    this.generateYears();
    this.loadPayments();
  }

  generateYears(): void {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 5; i--) {
      this.years.push(i);
    }
  }

  loadPayments(): void {
    // TODO: Load payments from service
    this.payments = this.generateMockPayments();
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredPayments = this.payments.filter(payment => {
      const typeMatch = this.selectedType === 'All' || payment.type === this.selectedType;
      const monthMatch = payment.date.getMonth() + 1 === this.selectedMonth;
      const yearMatch = payment.date.getFullYear() === this.selectedYear;
      
      return typeMatch && monthMatch && yearMatch;
    });

    this.totalPages = Math.ceil(this.filteredPayments.length / this.itemsPerPage);
    this.currentPage = 1;
  }

  getPaginatedPayments(): Payment[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredPayments.slice(startIndex, endIndex);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }

  getPaymentIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'رحلة': 'fa-route',
      'إيداع': 'fa-arrow-down',
      'سحب': 'fa-arrow-up',
      'مكافأة': 'fa-gift'
    };
    return icons[type] || 'fa-money-bill';
  }

  getPaymentColor(type: string): string {
    const colors: { [key: string]: string } = {
      'رحلة': 'text-primary',
      'إيداع': 'text-success',
      'سحب': 'text-danger',
      'مكافأة': 'text-warning'
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
      // TODO: Call service to process withdrawal
      console.log('طلب سحب:', {
        amount: this.withdrawAmount,
        method: this.withdrawMethod
      });
      this.closeWithdrawModal();
    }
  }

  private generateMockPayments(): Payment[] {
    const mockPayments: Payment[] = [];
    const types: Array<'إيداع' | 'سحب' | 'رحلة' | 'مكافأة'> = ['رحلة', 'إيداع', 'سحب', 'مكافأة'];
    const statuses: Array<'مكتمل' | 'معلق' | 'فاشل'> = ['مكتمل', 'معلق', 'فاشل'];
    
    for (let i = 1; i <= 30; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const status = statuses[Math.floor(Math.random() * 3)];
      const amount = Math.floor(Math.random() * 500) + 50;
      
      mockPayments.push({
        id: `payment_${i}`,
        date: new Date(this.selectedYear, this.selectedMonth - 1, Math.floor(Math.random() * 28) + 1),
        amount: type === 'سحب' ? -amount : amount,
        type: type,
        description: this.getPaymentDescription(type),
        status: status
      });
    }
    
    return mockPayments.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  private getPaymentDescription(type: string): string {
    const descriptions: { [key: string]: string[] } = {
      'رحلة': ['أجرة رحلة #123', 'أجرة رحلة #124', 'أجرة رحلة #125'],
      'إيداع': ['إيداع من الشركة', 'تحويل من الإدارة', 'مستحقات شهرية'],
      'سحب': ['سحب نقدي', 'تحويل بنكي', 'سحب إلى البطاقة'],
      'مكافأة': ['مكافأة الأداء', 'مكافأة شهرية', 'حافز تشجيعي']
    };
    const typeDescriptions = descriptions[type] || ['عملية'];
    return typeDescriptions[Math.floor(Math.random() * typeDescriptions.length)];
  }
}