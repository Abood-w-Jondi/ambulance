import { Component, Input, Output, EventEmitter, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaintenanceTypeService, MaintenanceTypeReference } from '../services/maintenance-type.service';

export interface MaintenanceTypeSelection {
  id: string;
  name: string;
  estimatedCost?: number;
  estimatedDuration?: number;
}

@Component({
  selector: 'app-maintenance-type-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './maintenance-type-search.component.html',
  styleUrls: ['./maintenance-type-search.component.css']
})
export class MaintenanceTypeSearchComponent implements OnInit {
  @Input() label: string = 'نوع الصيانة';
  @Input() placeholder: string = 'ابحث عن نوع الصيانة...';
  @Input() required: boolean = false;
  @Input() selectedTypeId: string = '';
  @Input() selectedTypeName: string = '';

  @Output() typeSelected = new EventEmitter<MaintenanceTypeSelection>();

  searchTerm = signal('');
  maintenanceTypes = signal<MaintenanceTypeReference[]>([]);
  isDropdownOpen = signal(false);
  isLoading = signal(false);

  // Computed filtered types - only show if 1+ characters
  filteredTypes = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();

    // Don't show results if empty
    if (term.length < 1) {
      return [];
    }

    return this.maintenanceTypes();
  });

  constructor(private maintenanceTypeService: MaintenanceTypeService) {}

  ngOnInit(): void {
    // Set initial search term if type is already selected
    if (this.selectedTypeName) {
      this.searchTerm.set(this.selectedTypeName);
    }
  }

  onSearchChange(): void {
    const term = this.searchTerm().trim();

    // Search and show dropdown if 1+ characters
    if (term.length >= 1) {
      this.performSearch(term);
      this.isDropdownOpen.set(true);
    } else {
      this.isDropdownOpen.set(false);
    }
  }

  performSearch(term: string): void {
    this.isLoading.set(true);
    this.maintenanceTypeService.searchMaintenanceTypes(term).subscribe({
      next: (types) => {
        this.maintenanceTypes.set(types);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error searching maintenance types:', error);
        this.isLoading.set(false);
      }
    });
  }

  selectType(type: MaintenanceTypeReference): void {
    this.searchTerm.set(type.name);
    this.isDropdownOpen.set(false);

    this.typeSelected.emit({
      id: type.id,
      name: type.name,
      estimatedCost: type.estimatedCost,
      estimatedDuration: type.estimatedDuration
    });
  }

  onFocus(): void {
    const term = this.searchTerm().trim();
    // Open dropdown if we have 1+ characters
    if (term.length >= 1 && this.filteredTypes().length > 0) {
      this.isDropdownOpen.set(true);
    }
  }

  onBlur(): void {
    // Delay to allow click events on dropdown items
    setTimeout(() => {
      this.isDropdownOpen.set(false);
    }, 200);
  }
}
