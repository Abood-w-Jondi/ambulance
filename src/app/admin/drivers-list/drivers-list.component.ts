import { Component, signal, ChangeDetectionStrategy, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GlobalVarsService } from '../../global-vars.service';
import { ActivatedRoute } from '@angular/router';

// Define the Driver data structure
interface Driver {
    id: string;
    name: string;
    arabicName: string;
    username?: string;
    email?: string;
    arabicStatus: 'متاح' | 'في رحلة' | 'غير متصل';
    statusColor: string;
    tripsToday: number;
    amountOwed: number;
    isAccountCleared: boolean;
    isActive: boolean;
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
export class DriversListComponent implements OnInit {
    constructor(private globalVarsService: GlobalVarsService, private route: ActivatedRoute) {
        this.globalVarsService.setGlobalHeader('سائقي الإسعاف');
    }
    
    queryFilterValue = signal<string | null>(null);
    
    searchTermValue: string = '';
    filterStatusValue: FilterStatus = 'all';
    minOwedValue: number | null = null;
    maxOwedValue: number | null = null;

    showFiltersOnMobile = signal(false);
    searchTerm = signal('');
    filterStatus = signal<FilterStatus>('all');
    minOwed = signal<number | null>(null);
    maxOwed = signal<number | null>(null);

    isAddModalOpen = signal(false);
    isEditModalOpen = signal(false);
    isDeleteModalOpen = signal(false);
    driverToEdit = signal<Driver | null>(null);
    driverToDelete = signal<Driver | null>(null);

    newDriver: {
        arabicName: string;
        name: string;
        username: string;
        email: string;
        password: string;
        amountOwed: number;
        tripsToday: number;
    } = {
        arabicName: '',
        name: '',
        username: '',
        email: '',
        password: '',
        amountOwed: 0,
        tripsToday: 0,
    };

    editDriver: {
        arabicName: string;
        name: string;
        username: string;
        email: string;
        arabicStatus: 'متاح' | 'في رحلة' | 'غير متصل';
        tripsToday: number;
        amountOwed: number;
        newPassword: string;
        isActive: boolean;
    } = {
        arabicName: '',
        name: '',
        username: '',
        email: '',
        arabicStatus: 'متاح',
        tripsToday: 0,
        amountOwed: 0,
        newPassword: '',
        isActive: true
    };

    reductionAmounts: { [key: string]: number } = {};

    private generateId(): string {
        return Date.now().toString() + Math.random().toString(36).substring(2, 9);
    }

    drivers = signal<Driver[]>([
        {
            id: this.generateId(),
            name: 'Eleanor Pena',
            arabicName: 'إليانور بينا',
            username: 'epena',
            email: 'eleanor.pena@example.com',
            arabicStatus: 'متاح',
            statusColor: '#10B981',
            tripsToday: 8,
            amountOwed: 250.75,
            isAccountCleared: false,
            isActive: true,
            imageUrl: 'https://placehold.co/56x56/10B981/ffffff?text=EP',
            imageAlt: 'صورة ملف تعريف إليانور بينا',
        },
        {
            id: this.generateId(),
            name: 'Wade Warren',
            arabicName: 'ويد وارين',
            username: 'wwarren',
            email: '',
            arabicStatus: 'في رحلة',
            statusColor: '#3B82F6',
            tripsToday: 5,
            amountOwed: 150.00,
            isAccountCleared: false,
            isActive: true,
            imageUrl: 'https://placehold.co/56x56/3B82F6/ffffff?text=WW',
            imageAlt: 'صورة ملف تعريف ويد وارين',
        },
        {
            id: this.generateId(),
            name: 'Jacob Jones',
            arabicName: 'جاكوب جونز',
            username: '',
            email: 'jacob.jones@example.com',
            arabicStatus: 'متاح',
            statusColor: '#10B981',
            tripsToday: 12,
            amountOwed: 310.50,
            isAccountCleared: false,
            isActive: true,
            imageUrl: 'https://placehold.co/56x56/10B981/ffffff?text=JJ',
            imageAlt: 'صورة ملف تعريف جاكوب جونز',
        },
        {
            id: this.generateId(),
            name: 'Cameron Williamson',
            arabicName: 'كاميرون ويليامسون',
            username: 'cwilliamson',
            email: 'cameron.w@example.com',
            arabicStatus: 'غير متصل',
            statusColor: '#6B7280',
            tripsToday: 0,
            amountOwed: 0.00,
            isAccountCleared: true,
            isActive: false,
            imageUrl: 'https://placehold.co/56x56/6B7280/ffffff?text=CW',
            imageAlt: 'صورة ملف تعريف كاميرون ويليامسون',
        },
    ]);

    filteredDrivers = computed(() => {
        let driversList = this.drivers();
        const term = this.searchTerm().toLowerCase().trim();
        const status = this.filterStatus();
        const min = this.minOwed();
        const max = this.maxOwed();

        if (term) {
            driversList = driversList.filter(d =>
                d.arabicName.toLowerCase().includes(term) ||
                d.name.toLowerCase().includes(term) ||
                (d.email && d.email.toLowerCase().includes(term)) ||
                (d.username && d.username.toLowerCase().includes(term))
            );
        }

        if (status !== 'all') {
            driversList = driversList.filter(d => d.arabicStatus === status);
        }

        if (min !== null && !isNaN(min)) {
            driversList = driversList.filter(d => d.amountOwed >= min!);
        }
        if (max !== null && !isNaN(max)) {
            driversList = driversList.filter(d => d.amountOwed <= max!);
        }

        return driversList;
    });

    addNewDriver() {
        // Validation: Must have either username or email
        if ((!this.newDriver.username && !this.newDriver.email) || 
            !this.newDriver.arabicName || 
            !this.newDriver.name || 
            !this.newDriver.password ||
            this.newDriver.amountOwed < 0 || 
            this.newDriver.tripsToday < 0) {
            console.error('Please fill in all required fields correctly. Username or email is required, and password is required.');
            return;
        }

        const newDriver: Driver = {
            id: this.generateId(),
            arabicName: this.newDriver.arabicName,
            name: this.newDriver.name,
            username: this.newDriver.username || undefined,
            email: this.newDriver.email || undefined,
            arabicStatus: 'غير متصل',
            statusColor: '#6B7280',
            tripsToday: this.newDriver.tripsToday,
            amountOwed: this.newDriver.amountOwed,
            isAccountCleared: this.newDriver.amountOwed === 0,
            isActive: true,
            imageUrl: `https://placehold.co/56x56/9CA3AF/ffffff?text=${this.newDriver.name.charAt(0).toUpperCase()}`,
            imageAlt: `صورة ملف تعريف ${this.newDriver.arabicName}`,
        };

        this.drivers.update(list => [...list, newDriver]);
        console.log(`Action: Added new driver: ${newDriver.arabicName} with password: ${this.newDriver.password}`);
        this.isAddModalOpen.set(false);
        this.newDriver = { arabicName: '', name: '', username: '', email: '', password: '', amountOwed: 0, tripsToday: 0 };
    }

    openEditModal(driver: Driver) {
        this.driverToEdit.set(driver);
        this.editDriver = {
            arabicName: driver.arabicName,
            name: driver.name,
            username: driver.username || '',
            email: driver.email || '',
            arabicStatus: driver.arabicStatus,
            tripsToday: driver.tripsToday,
            amountOwed: driver.amountOwed,
            newPassword: '',
            isActive: driver.isActive
        };
        this.isEditModalOpen.set(true);
    }

    closeEditModal() {
        this.driverToEdit.set(null);
        this.isEditModalOpen.set(false);
        this.editDriver = {
            arabicName: '',
            name: '',
            username: '',
            email: '',
            arabicStatus: 'متاح',
            tripsToday: 0,
            amountOwed: 0,
            newPassword: '',
            isActive: true
        };
    }

    saveEditDriver() {
        const driver = this.driverToEdit();
        if (!driver) return;

        // Validation: Must have either username or email
        if ((!this.editDriver.username && !this.editDriver.email) ||
            !this.editDriver.arabicName || 
            !this.editDriver.name) {
            console.error('Please fill in all required fields correctly. Username or email is required.');
            return;
        }

        let statusColor = '#6B7280';
        if (this.editDriver.arabicStatus === 'متاح') {
            statusColor = '#10B981';
        } else if (this.editDriver.arabicStatus === 'في رحلة') {
            statusColor = '#3B82F6';
        }

        this.drivers.update(list => list.map(d => {
            if (d.id === driver.id) {
                return {
                    ...d,
                    arabicName: this.editDriver.arabicName,
                    name: this.editDriver.name,
                    username: this.editDriver.username || undefined,
                    email: this.editDriver.email || undefined,
                    arabicStatus: this.editDriver.arabicStatus,
                    statusColor: statusColor,
                    tripsToday: this.editDriver.tripsToday,
                    amountOwed: this.editDriver.amountOwed,
                    isAccountCleared: this.editDriver.amountOwed === 0,
                    isActive: this.editDriver.isActive
                };
            }
            return d;
        }));

        if (this.editDriver.newPassword && this.editDriver.newPassword.trim() !== '') {
            console.log(`Action: Password reset for ${this.editDriver.arabicName} to: ${this.editDriver.newPassword}`);
        }

        console.log(`Action: Updated driver: ${this.editDriver.arabicName}`);
        this.closeEditModal();
    }

    showDeleteConfirmation(driver: Driver) {
        this.driverToDelete.set(driver);
        this.isDeleteModalOpen.set(true);
    }

    closeDeleteConfirmation() {
        this.driverToDelete.set(null);
        this.isDeleteModalOpen.set(false);
    }

    confirmDeleteDriver() {
        const driver = this.driverToDelete();
        if (driver) {
            this.drivers.update(list => list.filter(d => d.id !== driver.id));
            console.log(`Action: Deleted driver: ${driver.arabicName}`);
            this.closeDeleteConfirmation();
        }
        this.isEditModalOpen.set(false);
    }

    toggleDriverStatus(driver: Driver) {
        this.drivers.update(list => list.map(d => {
            if (d.id === driver.id) {
                const newIsActive = !d.isActive;
                console.log(`Action: ${newIsActive ? 'Activated' : 'Deactivated'} account for ${d.arabicName}`);
                return {
                    ...d,
                    isActive: newIsActive
                };
            }
            return d;
        }));
    }

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
        delete this.reductionAmounts[driver.id];
        console.log(`Action: Cleared balance for ${driver.arabicName}`);
    }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            if (params['filterValue']) {
                this.queryFilterValue.set(params['filterValue']);
                this.searchTermValue = this.queryFilterValue() || '';
                this.searchTerm.set(this.searchTermValue);
            }
        });
    }

    reduceBalance(driver: Driver, amount: number) {
        if (!amount || amount <= 0 || amount > driver.amountOwed) {
            console.error('Invalid reduction amount or amount exceeds what is owed.');
            return;
        }

        const updatedDrivers = this.drivers().map(d => {
            if (d.id === driver.id) {
                const newAmount = Math.round((driver.amountOwed - amount) * 100) / 100;
                return {
                    ...d,
                    amountOwed: Math.max(0, newAmount),
                    isAccountCleared: newAmount <= 0.001
                };
            }
            return d;
        });

        this.drivers.set(updatedDrivers);
        delete this.reductionAmounts[driver.id];
        console.log(`Successfully reduced ${driver.arabicName}'s balance by ₪${amount}`);
    }

    toggleMobileFilters() {
        this.showFiltersOnMobile.update(val => !val);
    }

    resetFilters() {
        this.searchTerm.set('');
        this.filterStatus.set('all');
        this.minOwed.set(null);
        this.maxOwed.set(null);
        
        this.searchTermValue = '';
        this.filterStatusValue = 'all';
        this.minOwedValue = null;
        this.maxOwedValue = null;

        this.showFiltersOnMobile.set(false);
        console.log('Action: Filters reset.');
    }

    getStatusOptions(): Array<'متاح' | 'في رحلة' | 'غير متصل'> {
        return ['متاح', 'في رحلة', 'غير متصل'];
    }

    isAddFormValid(): boolean {
        return !!(
            this.newDriver.arabicName &&
            this.newDriver.name &&
            this.newDriver.password &&
            (this.newDriver.username || this.newDriver.email)
        );
    }

    isEditFormValid(): boolean {
        return !!(
            this.editDriver.arabicName &&
            this.editDriver.name &&
            (this.editDriver.username || this.editDriver.email)
        );
    }
}