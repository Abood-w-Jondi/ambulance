import { Component, Input, Output, EventEmitter, signal, computed, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransportationTypeService, TransportationTypeReference } from '../services/transportation-type.service';

export interface TransportationTypeSelection {
  id: string;
  name: string;
  isNew?: boolean;
}

@Component({
  selector: 'app-transportation-type-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transportation-type-search.component.html',
  styleUrls: ['./transportation-type-search.component.css']
})
export class TransportationTypeSearchComponent implements OnInit, OnChanges {
  @Input() label: string = 'التشخيص';
  @Input() placeholder: string = 'ابحث عن التشخيص...';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() selectedTypeName: string = '';

  @Output() typeSelected = new EventEmitter<TransportationTypeSelection>();

  searchTerm = signal('');
  transportationTypes = signal<TransportationTypeReference[]>([]);
  isDropdownOpen = signal(false);
  isLoading = signal(false);
  isCreatingNew = signal(false);
  selectedTypeId = signal('');

  // Computed filtered types - only show if 1+ characters
  filteredTypes = computed(() => {
    const term = this.searchTerm().trim();

    // Don't show results if empty
    if (term.length < 1) {
      return [];
    }

    return this.transportationTypes();
  });

  constructor(
    private transportationTypeService: TransportationTypeService
  ) {}

  ngOnInit(): void {
    // Set initial search term if type is already selected
    if (this.selectedTypeName) {
      this.searchTerm.set(this.selectedTypeName);
      // Mark as selected to prevent it from being treated as new on blur
      this.selectedTypeId.set('existing'); // Non-empty value indicates existing type
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle when selectedTypeName changes after initialization (e.g., edit modal)
    if (changes['selectedTypeName'] && changes['selectedTypeName'].currentValue) {
      this.searchTerm.set(changes['selectedTypeName'].currentValue);
      // Mark as selected to prevent it from being treated as new on blur
      this.selectedTypeId.set('existing'); // Non-empty value indicates existing type
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
    this.selectedTypeId.set(type.id);
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
      const term = this.searchTerm().trim();

      // If user typed something but no selection was made
      if (term && !this.selectedTypeId()) {
        // Check if exact match exists (case-insensitive)
        const exactMatch = this.transportationTypes().find(
          t => t.name.toLowerCase() === term.toLowerCase()
        );

        if (exactMatch) {
          // Select the existing match
          this.selectType(exactMatch);
        } else {
          // DON'T CREATE - just emit with isNew flag
          // Transportation type will be created when the trip form is submitted
          this.selectedTypeId.set(''); // Empty ID indicates new type
          this.typeSelected.emit({
            id: '',
            name: term,
            isNew: true
          });
        }
      }

      this.isDropdownOpen.set(false);
    }, 200);
  }
}
