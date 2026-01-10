import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TripService } from '../../shared/services/trip.service';
import { DriverService } from '../../shared/services/driver.service';
import { ToastService } from '../../shared/services/toast.service';
import { AuthService } from '../../shared/services/auth.service';
import { PatientLoan } from '../../shared/models/patient-loan.model';

interface LoanStats {
  totalLoans: number;
  uncollectedCount: number;
  collectedCount: number;
  totalUncollectedAmount: number;
  totalCollectedAmount: number;
}

type FilterStatus = 'all' | 'uncollected' | 'collected';
type SortBy = 'date' | 'amount' | 'patient';
type SortOrder = 'asc' | 'desc';

@Component({
  selector: 'app-loan-collection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './loan-collection.component.html',
  styleUrls: ['./loan-collection.component.css']
})
export class LoanCollectionComponent implements OnInit {
  // Data
  loans = signal<PatientLoan[]>([]);// Master copy from DB
  searchQuery = signal<string>('');    // Search input value
  isLoading = signal(false);
  driverId = signal<string | null>(null);

// Filters
  filterStatus = signal<FilterStatus>('all');
  sortBy = signal<SortBy>('date');
  sortOrder = signal<SortOrder>('desc');

  // Modal state
  isEditModalOpen = signal(false);
  isCollectModalOpen = signal(false);
  selectedLoan = signal<PatientLoan | null>(null);

  // Form values
  editAmount = 0;
  editNotes = '';
  collectNotes = '';

  // Computed statistics
  stats = signal<LoanStats>({
    totalLoans: 0,
    uncollectedCount: 0,
    collectedCount: 0,
    totalUncollectedAmount: 0,
    totalCollectedAmount: 0,
  });

  private updateStats(): void {
    const allLoans = this.loans();
    const uncollected = allLoans.filter(l => !l.isCollected);
    const collected = allLoans.filter(l => l.isCollected);
    
    this.stats.set({
      totalLoans: allLoans.length,
      uncollectedCount: uncollected.length,
      collectedCount: collected.length,
      totalUncollectedAmount: uncollected.reduce((sum, l) => sum + l.totalPrice - l.payedPrice, 0),
      totalCollectedAmount: collected.reduce((sum, l) => sum + l.totalPrice - l.payedPrice, 0)
    });
  }

  // Quick filters
  quickFilters = [
    { label: 'الكل', value: 'all' as FilterStatus },
    { label: 'غير محصّل', value: 'uncollected' as FilterStatus },
    { label: 'محصّل', value: 'collected' as FilterStatus }
  ];

  sortOptions = [
    { label: 'الأحدث', sortBy: 'date' as SortBy, sortOrder: 'desc' as SortOrder },
    { label: 'الأقدم', sortBy: 'date' as SortBy, sortOrder: 'asc' as SortOrder },
    { label: 'الأعلى مبلغ', sortBy: 'amount' as SortBy, sortOrder: 'desc' as SortOrder },
    { label: 'الأقل مبلغ', sortBy: 'amount' as SortBy, sortOrder: 'asc' as SortOrder }
  ];

  constructor(
    private tripService: TripService,
    private driverService: DriverService,
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDriverAndLoans(true);
  }
  filteredLoans = computed(() => {
  const allData = this.loans(); // This looks at your master signal
  const query = this.searchQuery().toLowerCase().trim();
  const status = this.filterStatus();

  return allData.filter(loan => {
    // A. Status Filter
    const matchesStatus = 
      status === 'all' || 
      (status === 'uncollected' && !loan.isCollected) || 
      (status === 'collected' && loan.isCollected);

    // B. Search Filter
    const matchesSearch = !query || 
      loan.patientName?.toLowerCase().includes(query) ||
      loan.patientContact?.includes(query) ||
      loan.dname?.toLowerCase().includes(query) ||
      loan.transferFrom?.toLowerCase().includes(query) ||
      loan.transferTo?.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });
});

  loadDriverAndLoans(init: boolean = false): void {
    this.isLoading.set(true);
        this.driverId.set('all');
        this.loadLoans(init);
  }

 loadLoans(init: boolean = false): void {
    this.isLoading.set(true);
    this.tripService.getPatientLoans('all', {
      status: 'all', // Fetch everything for frontend filtering
      sortBy: 'date',
      sortOrder: 'desc'
    } as any).subscribe({
      next: (loans) => {
        this.loans.set(loans); // Store in master signal
        this.isLoading.set(false);
        this.updateStats(); // Calculate stats from the master list
      },
      error: (error) => {
        this.toastService.error('فشل تحميل قائمة الديون');
        this.isLoading.set(false);
      }
    });
  }
  // Instant UI handlers
  onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  onFilterChange(status: FilterStatus): void {
    this.filterStatus.set(status);
    // No loadLoans() call needed anymore!
  }

  onSortChange(option: { sortBy: SortBy; sortOrder: SortOrder }): void {
    this.sortBy.set(option.sortBy);
    this.sortOrder.set(option.sortOrder);
    this.loadLoans();
  }

  getCurrentSortLabel(): string {
    const currentSort = this.sortOptions.find(
      o => o.sortBy === this.sortBy() && o.sortOrder === this.sortOrder()
    );
    return currentSort?.label || 'ترتيب';
  }

  // Edit loan amount
  openEditModal(loan: PatientLoan): void {
    this.selectedLoan.set(loan);
    this.editAmount = loan.loanAmount;
    this.editNotes = '';
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.selectedLoan.set(null);
    this.editAmount = 0;
    this.editNotes = '';
  }

  saveEditAmount(): void {
    const loan = this.selectedLoan();
    if (!loan) return;

    if (this.editAmount < 0) {
      this.toastService.error('المبلغ لا يمكن أن يكون سالباً');
      return;
    }

    this.tripService.updateLoanAmount(loan.tripId, this.editAmount, this.editNotes).subscribe({
      next: (response) => {
        if (this.editAmount === 0) {
          this.toastService.success('تم تحصيل الدين بالكامل');
        } else {
          this.toastService.success('تم تحديث المبلغ بنجاح');
        }
        this.closeEditModal();
        this.loadLoans();
      },
      error: (error) => {
        console.error('Error updating loan amount:', error);
        this.toastService.error('فشل تحديث المبلغ');
      }
    });
  }
  isDeleteModalOpen = signal(false);
  deleteNotes = '';
  openDeleteModal(loan: PatientLoan): void {
    this.selectedLoan.set(loan);
    this.deleteNotes = '';
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.selectedLoan.set(null);
    this.deleteNotes = '';
  }

  confirmDelete(): void {
    const loan = this.selectedLoan();
    if (!loan) return;

    if (!this.deleteNotes.trim()) {
      this.toastService.error('يرجى إدخال سبب الحذف');
      return;
    }

    this.tripService.deleteLoan(loan.tripId, this.deleteNotes).subscribe({
      next: () => {
        this.toastService.success('تم حذف الدين وتعديل سعر الرحلة');
        this.closeDeleteModal();
        this.loadLoans();
      },
      error: (error) => {
        console.error('Error deleting loan:', error);
        this.toastService.error('فشل حذف الدين');
      }
    });
  }

  // Collect loan
  openCollectModal(loan: PatientLoan): void {
    this.selectedLoan.set(loan);
    this.collectNotes = '';
    this.isCollectModalOpen.set(true);
  }

  closeCollectModal(): void {
    this.isCollectModalOpen.set(false);
    this.selectedLoan.set(null);
    this.collectNotes = '';
  }

  confirmCollect(): void {
    const loan = this.selectedLoan();
    if (!loan) return;

    if (!this.collectNotes.trim()) {
      this.toastService.error('يرجى إدخال ملاحظات التحصيل');
      return;
    }

    this.tripService.updateLoanAmount(loan.tripId, 0, this.collectNotes).subscribe({
      next: () => {
        this.toastService.success(`تم تحصيل ${loan.loanAmount} ₪ من ${loan.patientName}`);
        this.closeCollectModal();
        this.loadLoans();
      },
      error: (error) => {
        console.error('Error marking loan collected:', error);
        this.toastService.error('فشل تسجيل التحصيل');
      }
    });
  }

  // Helper methods
  getAgingClass(daysSinceLoan: number): string {
    if (daysSinceLoan > 30) return 'text-danger';
    if (daysSinceLoan > 14) return 'text-warning';
    return 'text-muted';
  }

  getAgingLabel(daysSinceLoan: number): string {
    if (daysSinceLoan === 0) return 'اليوم';
    if (daysSinceLoan === 1) return 'أمس';
    if (daysSinceLoan < 7) return `منذ ${daysSinceLoan} أيام`;
    if (daysSinceLoan < 30) return `منذ ${Math.floor(daysSinceLoan / 7)} أسابيع`;
    return `منذ ${Math.floor(daysSinceLoan / 30)} شهور`;
  }

  formatDate(dateStr: string | Date): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  goBack(): void {
    this.router.navigate(['/user/driver-dashboard']);
  }

  callPatient(phone: string | undefined): void {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  }
}

