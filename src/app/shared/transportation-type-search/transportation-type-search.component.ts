import { Component, Input, Output, EventEmitter, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransportationTypeService, TransportationTypeReference } from '../services/transportation-type.service';

export interface TransportationTypeSelection {
  id: string;
  name: string;
}

@Component({
  selector: 'app-transportation-type-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transportation-type-search.component.html',
  styleUrls: ['./transportation-type-search.component.css']
})
export class TransportationTypeSearchComponent implements OnInit {
  @Input() label: string = 'التشخيص';
  @Input() placeholder: string = 'ابحث عن التشخيص...';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() selectedTypeId: string = '';
  @Input() selectedTypeName: string = '';

  @Output() typeSelected = new EventEmitter<TransportationTypeSelection>();

  searchTerm = signal('');
  transportationTypes = signal<TransportationTypeReference[]>([]);
  isDropdownOpen = signal(false);
  isLoading = signal(false);

  // Computed filtered types - only show if 1+ characters
  filteredTypes = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();

    // Don't show results if empty
    if (term.length < 1) {
      return [];
    }

    return this.transportationTypes();
  });

  constructor(private transportationTypeService: TransportationTypeService) {}

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
    this.transportationTypeService.searchTransportationTypes(term).subscribe({
      next: (types) => {
        this.transportationTypes.set(types);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error searching transportation types:', error);
        this.isLoading.set(false);
      }
    });
  }

  selectType(type: TransportationTypeReference): void {
    this.searchTerm.set(type.name);
    this.isDropdownOpen.set(false);

    this.typeSelected.emit({
      id: type.id,
      name: type.name
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
