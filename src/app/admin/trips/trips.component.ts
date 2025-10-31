import { Component, signal, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GlobalVarsService } from '../../global-vars.service';

// --- Data Structures ---
interface Trip {
    id: string;
    date: string; // التاريخ
    driver: string; // السائق
    paramedic: string; // ضابط الاسعاف
    transferFrom: string; // نقل من
    transferTo: string; // نقل الى
    start: number; // بدء
    end: number; // نهاية
    diesel: number; // سولار (liters)
    patientName: string; // المريض
    patientAge: number; // العمر
    ymd: string; // YMD date
    transferStatus: TransferStatus; // النقل
    totalAmount: number; // المبلغ
    paramedicShare: number; // حصة الضابط
    driverShare: number; // حصة السائق
    eqShare: number; // حصة eq
}

type TransferStatus = 'ميداني' | 'تم النقل' | 'بلاغ كاذب' | 'يتقل' | 'لم يتم النقل' | 'صيانة' | 'رفض النقل' | 'اخرى';
type FilterStatus = 'All' | TransferStatus;

@Component({
    selector: 'app-trips',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './trips.component.html',
    styleUrl: './trips.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TripsComponent {
    // --- State Initialization (Signals) ---
    dateFilterValue: string = '';
    driverFilterValue: string = '';
    paramedicFilterValue: string = '';
    selectedStatus: FilterStatus = 'All';

    // Filters for computation
    filterStatus = signal<FilterStatus>('All');
    dateFilter = signal('');
    driverNameFilter = signal('');
    paramedicNameFilter = signal('');

    // Modal Control
    isAddTripModalOpen = signal(false);
    isViewTripModalOpen = signal(false);
    selectedTrip = signal<Trip | null>(null);
    
    // Form values for new trip
    newTrip = {
        date: '',
        driver: '',
        paramedic: '',
        transferFrom: '',
        transferTo: '',
        start: 0,
        end: 0,
        diesel: 0,
        patientName: '',
        patientAge: 0,
        ymd: '',
        transferStatus: 'تم النقل' as TransferStatus,
        totalAmount: 0,
        paramedicShare: 0
    };

    driversList: { id: string; name: string }[] = [];
    paramedicsList: { id: string; name: string }[] = [];
    transferStatuses: TransferStatus[] = ['ميداني', 'تم النقل', 'بلاغ كاذب', 'يتقل', 'لم يتم النقل', 'صيانة', 'رفض النقل', 'اخرى'];

    constructor(private globalVars: GlobalVarsService) {
        this.globalVars.setGlobalHeader('الرحلات والنقليات');
        this.driversList = this.globalVars.driversList;
        // Assuming you have a paramedics list in globalVars
        this.paramedicsList = [
            { id: '1', name: 'ضابط أحمد' },
            { id: '2', name: 'ضابط محمد' },
            { id: '3', name: 'ضابط علي' }
        ];
    }
    
    // Helper to generate IDs
    private generateId(): string {
        return Date.now().toString() + Math.random().toString(36).substring(2, 9);
    }

    // Calculate money distribution
    private calculateShares(totalAmount: number, paramedicShare: number) {
        const remaining = totalAmount - paramedicShare;
        const driverShare = remaining / 3;
        const eqShare = remaining - driverShare;
        return { paramedicShare, driverShare, eqShare };
    }
    
    // Dummy Data
    trips = signal<Trip[]>([
        {
            id: this.generateId(),
            date: '2023-10-26',
            driver: 'جين سميث',
            paramedic: 'ضابط أحمد',
            transferFrom: 'مستشفى سانت ماري',
            transferTo: 'دار رعاية أوكوود',
            start: 100,
            end: 150,
            diesel: 25.5,
            patientName: 'إيزابيلا رودريغز',
            patientAge: 65,
            ymd: '2023-10-26',
            transferStatus: 'تم النقل',
            totalAmount: 250.00,
            paramedicShare: 50,
            driverShare: 66.67,
            eqShare: 133.33
        },
        {
            id: this.generateId(),
            date: '2023-10-26',
            driver: 'روبرت براون',
            paramedic: 'ضابط محمد',
            transferFrom: 'عيادة المدينة العامة',
            transferTo: 'مقر إقامة المريض',
            start: 50,
            end: 85,
            diesel: 15.0,
            patientName: 'مايكل تشين',
            patientAge: 42,
            ymd: '2023-10-26',
            transferStatus: 'ميداني',
            totalAmount: 175.50,
            paramedicShare: 40,
            driverShare: 45.17,
            eqShare: 90.33
        }
    ]);

    // --- Computed Property for Filtering ---
    filteredTrips = computed(() => {
        const status = this.filterStatus();
        const date = this.dateFilter().trim();
        const driverName = this.driverNameFilter().toLowerCase().trim();
        const paramedicName = this.paramedicNameFilter().toLowerCase().trim();

        return this.trips().filter(trip => {
            // Status Filter
            const statusMatch = status === 'All' || trip.transferStatus === status;
            
            // Date Filter
            const dateMatch = date === '' || trip.date === date;
            
            // Driver Filter
            const driverMatch = driverName === '' || trip.driver.toLowerCase().includes(driverName);
            
            // Paramedic Filter
            const paramedicMatch = paramedicName === '' || trip.paramedic.toLowerCase().includes(paramedicName);
            
            return statusMatch && dateMatch && driverMatch && paramedicMatch;
        });
    });

    // --- Component Methods ---

    getStatusColor(status: TransferStatus): string {
        switch (status) {
            case 'تم النقل':
                return '#28A745';
            case 'ميداني':
                return '#17A2B8';
            case 'بلاغ كاذب':
            case 'لم يتم النقل':
            case 'رفض النقل':
                return '#DC3545';
            case 'صيانة':
                return '#6C757D';
            case 'يتقل':
                return '#FFC107';
            default:
                return '#6C757D';
        }
    }

    getStatusBadgeClass(status: TransferStatus): string {
        switch (status) {
            case 'تم النقل':
                return 'text-bg-success';
            case 'ميداني':
                return 'text-bg-info';
            case 'بلاغ كاذب':
            case 'لم يتم النقل':
            case 'رفض النقل':
                return 'text-bg-danger';
            case 'صيانة':
                return 'text-bg-secondary';
            case 'يتقل':
                return 'text-bg-warning';
            default:
                return 'text-bg-secondary';
        }
    }

    applyFilters(): void {
        this.filterStatus.set(this.selectedStatus);
        this.dateFilter.set(this.dateFilterValue);
        this.driverNameFilter.set(this.driverFilterValue);
        this.paramedicNameFilter.set(this.paramedicFilterValue);
    }
    
    resetFilters(): void {
        this.dateFilterValue = '';
        this.driverFilterValue = '';
        this.paramedicFilterValue = '';
        this.selectedStatus = 'All';
        
        this.filterStatus.set('All');
        this.dateFilter.set('');
        this.driverNameFilter.set('');
        this.paramedicNameFilter.set('');
    }

    selectStatus(status: FilterStatus): void {
        this.selectedStatus = status;
        this.filterStatus.set(status);
    }

    getStatusClass(status: FilterStatus): string {
        return this.selectedStatus === status ? 'btn-primary-custom' : 'btn-outline-secondary text-dark';
    }

    openAddTripModal(): void {
        this.newTrip = {
            date: '',
            driver: '',
            paramedic: '',
            transferFrom: '',
            transferTo: '',
            start: 0,
            end: 0,
            diesel: 0,
            patientName: '',
            patientAge: 0,
            ymd: '',
            transferStatus: 'تم النقل',
            totalAmount: 0,
            paramedicShare: 0
        };
        this.isAddTripModalOpen.set(true);
    }

    addTrip(): void {
        const shares = this.calculateShares(this.newTrip.totalAmount, this.newTrip.paramedicShare);
        
        const trip: Trip = {
            id: this.generateId(),
            date: this.newTrip.date,
            driver: this.newTrip.driver,
            paramedic: this.newTrip.paramedic,
            transferFrom: this.newTrip.transferFrom,
            transferTo: this.newTrip.transferTo,
            start: this.newTrip.start,
            end: this.newTrip.end,
            diesel: this.newTrip.diesel,
            patientName: this.newTrip.patientName,
            patientAge: this.newTrip.patientAge,
            ymd: this.newTrip.ymd,
            transferStatus: this.newTrip.transferStatus,
            totalAmount: this.newTrip.totalAmount,
            ...shares
        };

        this.trips.update(trips => [...trips, trip]);
        this.isAddTripModalOpen.set(false);
    }

    viewTripDetails(trip: Trip): void {
        this.selectedTrip.set(trip);
        this.isViewTripModalOpen.set(true);
    }

    closeViewTripModal(): void {
        this.isViewTripModalOpen.set(false);
        this.selectedTrip.set(null);
    }
}