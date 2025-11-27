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
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.userId = params['id'];
    });

    this.route.queryParams.subscribe(params => {
      this.userType = params['type'] || '';
      this.userName = params['name'] || '';
      this.globalVarsService.setGlobalHeader(`سجل المعاملات - ${this.userName}`);
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

  getAmountClass(amount: number): string {
    return amount >= 0 ? 'text-success' : 'text-danger';
  }

  viewTrip(tripId: string) {
    // Navigate to trip details
    this.router.navigate(['/admin/trips', tripId]);
  }
}
