import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TransactionService } from '../../shared/services/transaction.service';
import { Transaction } from '../../shared/models/transaction.model';
import { GlobalVarsService } from '../../global-vars.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './transaction-history.component.html',
  styleUrl: './transaction-history.component.css'
})
export class TransactionHistoryComponent implements OnInit {
  userId: string = '';
  userType: string = '';
  userName: string = '';

  transactions = signal<Transaction[]>([]);
  isLoading = signal(false);

  // Pagination
  currentPage = 1;
  itemsPerPage = 20;
  totalRecords = 0;

  // Filters
  filterType: string = '';
  filterStartDate: string = '';
  filterEndDate: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private transactionService: TransactionService,
    private globalVarsService: GlobalVarsService
  ) {
      this.globalVarsService.setGlobalHeader(`سجل المعاملات`);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.userId = params['id'];
    });

    this.route.queryParams.subscribe(params => {
      this.userType = params['type'] || '';
      this.userName = params['name'] || '';
      this.loadTransactions();
    });
  }

  loadTransactions() {
    this.isLoading.set(true);

    const params: any = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };

    if (this.filterType) params.type = this.filterType;
    if (this.filterStartDate) params.startDate = this.filterStartDate;
    if (this.filterEndDate) params.endDate = this.filterEndDate;

    this.transactionService.getUserTransactions(this.userId, params).subscribe({
      next: (response) => {
        this.transactions.set(response.data);
        this.totalRecords = response.total;
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.isLoading.set(false);
      }
    });
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadTransactions();
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadTransactions();
  }

  resetFilters() {
    this.filterType = '';
    this.filterStartDate = '';
    this.filterEndDate = '';
    this.currentPage = 1;
    this.loadTransactions();
  }

  goBack() {
    this.router.navigate([`/admin/${this.userType}s-list`]);
  }

  formatDate(dateString: string | Date): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  getEffectiveDirection(transaction: Transaction): string {
    const isNegative = transaction.amount < 0;
    let dir = transaction.transactionDirection || '';

    if (isNegative) {
      if (dir === 'payable') return 'receivable';
      if (dir === 'receivable') return 'payable';
    }
    return dir;
  }

  getTransactionTypeClass(type: string): string {
    switch (type) {
      case 'رحلة':
        return 'bg-success';
      case 'دفع':
        return 'bg-info';
      case 'سحب':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  }
getAmountPrefix(transaction: Transaction): string {
     const direction = this.getEffectiveDirection(transaction);
     return direction === 'receivable' ? '+' : '-';
  }
  getAmountClass(transaction: Transaction): string {
    const direction = this.getEffectiveDirection(transaction);
    return direction == 'receivable' ? 'text-success' : 'text-danger';
  }
  getamount(amount: number) {
    return Math.abs(amount);
  }

  viewTrip(tripId: string) {
    // Navigate to trip details
    this.router.navigate(['/admin/trips', tripId]);
  }

  /**
   * Get transaction direction label in Arabic
   * @param direction Transaction direction
   * @returns Arabic label
   */
getDirectionLabel(transaction: Transaction): string {
    const direction = this.getEffectiveDirection(transaction); 
    switch(direction) {
      case 'receivable': return 'دفع للشركة'; 
      case 'payable': return 'المستخدم مدين';   
      case 'neutral': return 'محايد';           
      default: return '';                       
    }
  }

  /**
   * Get CSS class for transaction direction badge
   * @param direction Transaction direction
   * @returns CSS class name
   */
getDirectionBadgeClass(transaction: Transaction): string {
    const direction = this.getEffectiveDirection(transaction);
    switch(direction) {
      case 'receivable': return 'badge bg-success';
      case 'payable': return 'badge bg-danger';
      case 'neutral': return 'badge bg-secondary';
      default: return '';
    }
  }
}
