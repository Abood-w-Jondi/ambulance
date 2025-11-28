import { Component, Input, Output, EventEmitter, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocationService } from '../services/location.service';
import { LocationReference, LocationTag } from '../models/location.model';

export interface LocationSelection {
  id: string;
  name: string;
  locationType: LocationTag;
  isNew: boolean;
}

@Component({
  selector: 'app-location-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './location-search.component.html',
  styleUrls: ['./location-search.component.css']
})
export class LocationSearchComponent implements OnInit {
  @Input() label: string = 'الموقع';
  @Input() placeholder: string = 'ابحث عن موقع...';
  @Input() required: boolean = false;
  @Input() selectedLocationId: string = '';
  @Input() selectedLocationName: string = '';

  @Output() locationSelected = new EventEmitter<LocationSelection>();

  searchTerm = signal('');
  commonLocations = signal<LocationReference[]>([]);
  customLocations = signal<LocationReference[]>([]);
  isDropdownOpen = signal(false);
  isLoading = signal(false);

  // Computed filtered locations - only show if 3+ characters
  filteredLocations = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();

    // Don't show results if less than 3 characters
    if (term.length < 3) {
      return [];
    }

    const common = this.commonLocations().filter(loc =>
      loc.name.toLowerCase().includes(term)
    );

    const custom = this.customLocations().filter(loc =>
      loc.name.toLowerCase().includes(term)
    );

    return [...common, ...custom];
  });

  constructor(private locationService: LocationService) {}

  ngOnInit(): void {
    // Don't load all locations on init - wait for search
    // Set initial search term if location is already selected
    if (this.selectedLocationName) {
      this.searchTerm.set(this.selectedLocationName);
    }
  }

  onSearchChange(): void {
    const term = this.searchTerm().trim();

    // Only search and show dropdown if 3+ characters
    if (term.length >= 3) {
      this.performSearch(term);
      this.isDropdownOpen.set(true);
    } else {
      this.isDropdownOpen.set(false);
    }
  }

  performSearch(term: string): void {
    this.isLoading.set(true);
    this.locationService.searchLocations(term).subscribe({
      next: (locations) => {
        // Separate common and custom locations
        const common = locations.filter(loc => loc.locationType === 'common');
        const custom = locations.filter(loc => loc.locationType === 'custom');
        this.commonLocations.set(common);
        this.customLocations.set(custom);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error searching locations:', error);
        this.isLoading.set(false);
      }
    });
  }

  selectLocation(location: LocationReference): void {
    this.searchTerm.set(location.name);
    this.isDropdownOpen.set(false);

    this.locationSelected.emit({
      id: location.id,
      name: location.name,
      locationType: location.locationType,
      isNew: false
    });
  }

  onFocus(): void {
    const term = this.searchTerm().trim();
    // Only open dropdown if we have 3+ characters
    if (term.length >= 3 && this.filteredLocations().length > 0) {
      this.isDropdownOpen.set(true);
    }
  }

  onBlur(): void {
    // Delay to allow click events on dropdown items
    setTimeout(() => {
      this.isDropdownOpen.set(false);

      // When user leaves the field, emit the current value as custom if not matched
      const term = this.searchTerm().trim();
      if (term) {
        // Check if it matches an existing location
        const allLocations = [...this.commonLocations(), ...this.customLocations()];
        const existing = allLocations.find(loc =>
          loc.name.toLowerCase() === term.toLowerCase()
        );

        if (!existing) {
          // Custom location - will be created when trip is saved
          this.locationSelected.emit({
            id: '',
            name: term,
            locationType: 'custom',
            isNew: true
          });
        }
      }
    }, 200);
  }

  getLocationTypeLabel(locationType: LocationTag): string {
    return locationType === 'common' ? 'موقع شائع' : 'موقع مخصص';
  }

  getLocationTypeBadgeClass(locationType: LocationTag): string {
    return locationType === 'common' ? 'badge bg-primary' : 'badge bg-secondary';
  }
}
