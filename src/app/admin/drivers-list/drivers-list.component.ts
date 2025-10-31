import { Component, signal, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GlobalVarsService } from '../../global-vars.service';

// Define the Driver data structure
interface Driver {
    id: string; // Unique identifier for reliable updates/deletes
    name: string; // English/Original Name
    arabicName: string;
    arabicStatus: 'متاح' | 'في رحلة' | 'غير متصل';
    statusColor: string;
    tripsToday: number;
    amountOwed: number;
    isAccountCleared: boolean;
    imageUrl: string;
    imageAlt: string;
}

type FilterStatus = 'all' | 'متاح' | 'في رحلة' | 'غير متصل';

@Component({
    selector: 'app-drivers-list',
    imports: [CommonModule, FormsModule],
    templateUrl: './drivers-list.component.html',
    styleUrl: './drivers-list.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriversListComponent {
    constructor(private globalVarsService: GlobalVarsService) {
        this.globalVarsService.setGlobalHeader('سائقي الإسعاف');
    }
    // Input/Select values for ngModel binding to avoid direct signal assignment in template
    searchTermValue: string = '';
    filterStatusValue: FilterStatus = 'all';
    minOwedValue: number | null = null;
    maxOwedValue: number | null = null;

    // --- State Initialization (Signals) ---
    showFiltersOnMobile = signal(false);
    searchTerm = signal('');
    filterStatus = signal<FilterStatus>('all');
    minOwed = signal<number | null>(null);
    maxOwed = signal<number | null>(null);

    // Modal and Confirmation States
    isAddModalOpen = signal(false);
    isDeleteModalOpen = signal(false);
    driverToDelete = signal<Driver | null>(null);

    // New Driver Form Data
    newDriver: { arabicName: string; name: string; amountOwed: number; tripsToday: number } = {
        arabicName: '',
        name: '',
        amountOwed: 0,
        tripsToday: 0,
    };

    // State for Balance Reduction (Map to hold input values for each driver, keyed by ID)
    reductionAmounts: { [key: string]: number } = {};

    // Helper to generate a unique ID using timestamp (simpler alternative for frontend)
    private generateId(): string {
        return Date.now().toString() + Math.random().toString(36).substring(2, 9);
    }

    // Initial Data with unique IDs
    drivers = signal<Driver[]>([
        {
            id: this.generateId(),
            name: 'Eleanor Pena',
            arabicName: 'إليانور بينا',
            arabicStatus: 'متاح',
            statusColor: '#10B981', // Green
            tripsToday: 8,
            amountOwed: 250.75,
            isAccountCleared: false,
            imageUrl: 'https://placehold.co/56x56/10B981/ffffff?text=EP',
            imageAlt: 'صورة ملف تعريف إليانور بينا',
        },
        {
            id: this.generateId(),
            name: 'Wade Warren',
            arabicName: 'ويد وارين',
            arabicStatus: 'في رحلة',
            statusColor: '#3B82F6', // Blue
            tripsToday: 5,
            amountOwed: 150.00,
            isAccountCleared: false,
            imageUrl: 'https://placehold.co/56x56/3B82F6/ffffff?text=WW',
            imageAlt: 'صورة ملف تعريف ويد وارين',
        },
        {
            id: this.generateId(),
            name: 'Jacob Jones',
            arabicName: 'جاكوب جونز',
            arabicStatus: 'متاح',
            statusColor: '#10B981', // Green
            tripsToday: 12,
            amountOwed: 310.50,
            isAccountCleared: false,
            imageUrl: 'https://placehold.co/56x56/10B981/ffffff?text=JJ',
            imageAlt: 'صورة ملف تعريف جاكوب جونز',
        },
        {
            id: this.generateId(),
            name: 'Cameron Williamson',
            arabicName: 'كاميرون ويليامسون',
            arabicStatus: 'غير متصل',
            statusColor: '#6B7280', // Gray
            tripsToday: 0,
            amountOwed: 0.00,
            isAccountCleared: true,
            imageUrl: 'https://placehold.co/56x56/6B7280/ffffff?text=CW',
            imageAlt: 'صورة ملف تعريف كاميرون ويليامسون',
        },
    ]);

    // --- Filtering Logic (Computed Signal) ---

    filteredDrivers = computed(() => {
        let driversList = this.drivers();
        const term = this.searchTerm().toLowerCase().trim();
        const status = this.filterStatus();
        const min = this.minOwed();
        const max = this.maxOwed();

        // 1. Search by Name (Arabic or English/Original Name)
        if (term) {
            driversList = driversList.filter(d =>
                d.arabicName.toLowerCase().includes(term) || d.name.toLowerCase().includes(term)
            );
        }

        // 2. Filter by Status
        if (status !== 'all') {
            driversList = driversList.filter(d => d.arabicStatus === status);
        }

        // 3. Filter by Amount Owed Range
        if (min !== null && !isNaN(min)) {
            driversList = driversList.filter(d => d.amountOwed >= min!);
        }
        if (max !== null && !isNaN(max)) {
            driversList = driversList.filter(d => d.amountOwed <= max!);
        }

        return driversList;
    });

    // --- CRUD Operations ---

    /**
     * Creates and adds a new driver to the list.
     */
    addNewDriver() {
        if (!this.newDriver.arabicName || !this.newDriver.name || this.newDriver.amountOwed < 0 || this.newDriver.tripsToday < 0) {
            console.error('Please fill in all required fields correctly.');
            return;
        }

        const newDriver: Driver = {
            id: this.generateId(), // Using simplified ID generation
            arabicName: this.newDriver.arabicName,
            name: this.newDriver.name,
            arabicStatus: 'غير متصل', // Default status for new drivers
            statusColor: '#6B7280', // Gray
            tripsToday: this.newDriver.tripsToday,
            amountOwed: this.newDriver.amountOwed,
            isAccountCleared: this.newDriver.amountOwed === 0,
            imageUrl: `https://placehold.co/56x56/9CA3AF/ffffff?text=${this.newDriver.name.charAt(0).toUpperCase()}`,
            imageAlt: `صورة ملف تعريف ${this.newDriver.arabicName}`,
        };

        this.drivers.update(list => [...list, newDriver]);
        this.isAddModalOpen.set(false);
        this.newDriver = { arabicName: '', name: '', amountOwed: 0, tripsToday: 0 }; // Reset form
        console.log(`Action: Added new driver: ${newDriver.arabicName}`);
    }

    /**
     * Prepares the driver for deletion and opens the confirmation modal.
     */
    showDeleteConfirmation(driver: Driver) {
        this.driverToDelete.set(driver);
        this.isDeleteModalOpen.set(true);
    }

    /**
     * Closes the confirmation modal and clears the driverToDelete state.
     */
    closeDeleteConfirmation() {
        this.driverToDelete.set(null);
        this.isDeleteModalOpen.set(false);
    }

    /**
     * Executes the deletion of the selected driver.
     */
    confirmDeleteDriver() {
        const driver = this.driverToDelete();
        if (driver) {
            this.drivers.update(list => list.filter(d => d.id !== driver.id));
            console.log(`Action: Deleted driver: ${driver.arabicName}`);
            this.closeDeleteConfirmation();
        }
    }

    /**
     * Sets the amountOwed to zero for a single driver.
     */
    clearIndividualBalance(driver: Driver) {
        this.drivers.update(list => list.map(d => {
            if (d.id === driver.id) {
                return {
                    ...d,
                    amountOwed: 0.00,
                    isAccountCleared: true
                };
            }
            return d;
        }));
        // Clear any outstanding reduction amounts input for this driver
        delete this.reductionAmounts[driver.id];
        console.log(`Action: Cleared balance for ${driver.arabicName}`);
    }

    /**
     * Reduces the driver's balance by a specified amount. (Existing logic, updated to use ID)
     */
    reduceBalance(driver: Driver, amount: number) {
        if (!amount || amount <= 0 || amount > driver.amountOwed) {
            console.error('Invalid reduction amount or amount exceeds what is owed.');
            return;
        }

        const updatedDrivers = this.drivers().map(d => {
            if (d.id === driver.id) {
                const newAmount = Math.round((driver.amountOwed - amount) * 100) / 100; // Handle floating point math safely
                return {
                    ...d,
                    amountOwed: Math.max(0, newAmount),
                    isAccountCleared: newAmount <= 0.001 // Check close to zero
                };
            }
            return d;
        });

        this.drivers.set(updatedDrivers);
        // Clear the input field for the driver after action
        delete this.reductionAmounts[driver.id];
        console.log(`Successfully reduced ${driver.arabicName}'s balance by $${amount}`);
    }

    // --- UI Methods ---

    /**
     * Toggles the visibility of the filter sidebar on mobile screens.
     */
    toggleMobileFilters() {
        this.showFiltersOnMobile.update(val => !val);
    }

    /**
     * Resets all filter values.
     */
    resetFilters() {
        this.searchTerm.set('');
        this.filterStatus.set('all');
        this.minOwed.set(null);
        this.maxOwed.set(null);
        
        // Reset ngModel values for inputs
        this.searchTermValue = '';
        this.filterStatusValue = 'all';
        this.minOwedValue = null;
        this.maxOwedValue = null;

        this.showFiltersOnMobile.set(false); // Also close filters on mobile after reset
        console.log('Action: Filters reset.');
    }
}