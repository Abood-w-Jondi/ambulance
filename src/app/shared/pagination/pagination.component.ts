import { Component, Input, Output, EventEmitter, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css']
})
export class PaginationComponent {
  @Input() set currentPage(value: number) {
    this._currentPage.set(value);
  }
  @Input() set totalItems(value: number) {
    this._totalItems.set(value);
  }
  @Input() set itemsPerPage(value: number) {
    this._itemsPerPage.set(value);
  }
  @Input() maxVisiblePages: number = 5;

  @Output() pageChange = new EventEmitter<number>();
  @Output() itemsPerPageChange = new EventEmitter<number>();

  private _currentPage = signal(1);
  private _totalItems = signal(0);
  private _itemsPerPage = signal(10);

  totalPages = computed(() => {
    const total = Math.ceil(this._totalItems() / this._itemsPerPage());
    return total || 1;
  });

  visiblePages = computed(() => {
    const current = this._currentPage();
    const total = this.totalPages();
    const max = this.maxVisiblePages;
    const pages: number[] = [];

    if (total <= max) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      const half = Math.floor(max / 2);
      let start = Math.max(1, current - half);
      let end = Math.min(total, start + max - 1);

      if (end - start < max - 1) {
        start = Math.max(1, end - max + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  });

  showFirstPage = computed(() => {
    return this._currentPage() > Math.floor(this.maxVisiblePages / 2) + 1 && this.totalPages() > this.maxVisiblePages;
  });

  showLastPage = computed(() => {
    const current = this._currentPage();
    const total = this.totalPages();
    return current < total - Math.floor(this.maxVisiblePages / 2) && total > this.maxVisiblePages;
  });

  canGoPrevious = computed(() => this._currentPage() > 1);
  canGoNext = computed(() => this._currentPage() < this.totalPages());

  startItem = computed(() => {
    return (this._currentPage() - 1) * this._itemsPerPage() + 1;
  });

  endItem = computed(() => {
    return Math.min(this._currentPage() * this._itemsPerPage(), this._totalItems());
  });

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this._currentPage()) {
      this._currentPage.set(page);
      this.pageChange.emit(page);
    }
  }

  nextPage(): void {
    if (this.canGoNext()) {
      this.goToPage(this._currentPage() + 1);
    }
  }

  previousPage(): void {
    if (this.canGoPrevious()) {
      this.goToPage(this._currentPage() - 1);
    }
  }

  firstPage(): void {
    this.goToPage(1);
  }

  lastPage(): void {
    this.goToPage(this.totalPages());
  }

  changeItemsPerPage(newItemsPerPage: number): void {
    this._itemsPerPage.set(newItemsPerPage);
    this._currentPage.set(1);
    this.itemsPerPageChange.emit(newItemsPerPage);
    this.pageChange.emit(1);
  }

  get currentPageValue(): number {
    return this._currentPage();
  }

  get totalItemsValue(): number {
    return this._totalItems();
  }

  get itemsPerPageValue(): number {
    return this._itemsPerPage();
  }
}
