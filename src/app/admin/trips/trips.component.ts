import { Component, signal, ChangeDetectionStrategy, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GlobalVarsService } from '../../global-vars.service';
import { ToastService } from '../../shared/services/toast.service';
import { ValidationService } from '../../shared/services/validation.service';
import { TripService } from '../../shared/services/trip.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { ConfirmationModalComponent, ConfirmationModalConfig } from '../../shared/confirmation-modal/confirmation-modal.component';
import { TRANSFER_STATUS } from '../../shared/constants/status.constants';
import { Trip, TransferStatus, FilterStatus, DriverReference, ParamedicReference } from '../../shared/models';

@Component({
    selector: 'app-trips',
    standalone: true,
    imports: [CommonModule, FormsModule, PaginationComponent, StatusBadgeComponent, ConfirmationModalComponent],
    templateUrl: './trips.component.html',
    styleUrl: './trips.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TripsComponent implements OnInit {
    // --- Filter Panel Toggle ---
    isFilterPanelVisible = signal(false);

    today = new Date();
    thisyear = this.today.getFullYear();
    thismonth = this.today.getMonth()
    thisday = this.today.getDate();
    
    // --- State Initialization (Signals) ---
    dateFilterType: 'single' | 'range' = 'single';
    dateFilterDay: number | null = null;
    dateFilterMonth: number | null = null;
    dateFilterYear: number | null = null;
    dateFilterDayFrom: number | null = null;
    dateFilterMonthFrom: number | null = null;
    dateFilterYearFrom: number | null = null;
    dateFilterDayTo: number | null = null;
    dateFilterMonthTo: number | null = null;
    dateFilterYearTo: number | null = null;
    
    driverFilterValue: string = '';
    paramedicFilterValue: string = '';
    patientFilterValue: string = '';
    locationFromFilterValue: string = '';
    locationToFilterValue: string = '';
    selectedStatus: FilterStatus = 'All';

    // Filters for computation
    filterStatus = signal<FilterStatus>('All');
    dateFilter = signal<{ type: 'single' | 'range', single?: Date, from?: Date, to?: Date }>({ type: 'single' });
    driverNameFilter = signal('');
    paramedicNameFilter = signal('');
    patientNameFilter = signal('');
    locationFromFilter = signal('');
    locationToFilter = signal('');

    // Modal Control
    isAddTripModalOpen = signal(false);
    isViewTripModalOpen = signal(false);
    isEditTripModalOpen = signal(false);
    isDeleteTripModalOpen = signal(false);
    selectedTrip = signal<Trip | null>(null);
    tripToDelete = signal<Trip | null>(null);

    // Confirmation modal state
    confirmationModalConfig = signal<ConfirmationModalConfig>({
        type: 'delete',
        title: '',
        message: '',
        confirmButtonText: '',
        cancelButtonText: 'إلغاء'
    });
    
    // Form values for new/edit trip
    tripForm = {
        day: this.thisday,
        month: this.thismonth,
        year: this.thisyear,
        driver: '',
        paramedic: '',
        transferFrom: '',
        transferTo: '',
        start: 0,
        end: 0,
        diesel: 0,
        patientName: '',
        patientAge: 0,
        ymdDay: 1,
        ymdMonth: 1,
        ymdYear: new Date().getFullYear(),
        transferStatus: 'تم النقل' as TransferStatus,
        diagnosis: '',
        totalAmount: 0,
        paramedicShare: 0
    };

    // Search filters for dropdowns
    driverSearchTerm = signal('');
    paramedicSearchTerm = signal('');
    driverFilterSearchTerm = signal('');
    paramedicFilterSearchTerm = signal('');

    driversList: DriverReference[] = [];
    paramedicsList: ParamedicReference[] = [];
    transferStatuses: TransferStatus[] = ['ميداني', 'تم النقل', 'بلاغ كاذب', 'ينقل', 'لم يتم النقل', 'صيانة', 'رفض النقل', 'اخرى'];

    // Computed filtered lists
    filteredDriversList = computed(() => {
        const term = this.driverSearchTerm().toLowerCase();
        return this.driversList.filter(d => d.name.toLowerCase().includes(term));
    });

    filteredParamedicsList = computed(() => {
        const term = this.paramedicSearchTerm().toLowerCase();
        return this.paramedicsList.filter(p => p.name.toLowerCase().includes(term));
    });

    filteredDriversListForFilter = computed(() => {
        const term = this.driverFilterSearchTerm().toLowerCase();
        return this.driversList.filter(d => d.name.toLowerCase().includes(term));
    });

    filteredParamedicsListForFilter = computed(() => {
        const term = this.paramedicFilterSearchTerm().toLowerCase();
        return this.paramedicsList.filter(p => p.name.toLowerCase().includes(term));
    });

    constructor(
        private globalVars: GlobalVarsService,
        private toastService: ToastService,
        private validationService: ValidationService,
        private tripService: TripService
    ) {
        this.globalVars.setGlobalHeader('الرحلات والنقليات');
        this.driversList = this.globalVars.driversList;
        this.paramedicsList = [
            { id: '1', name: 'ضابط أحمد' },
            { id: '2', name: 'ضابط محمد' },
            { id: '3', name: 'ضابط علي' }
        ];
    }

    ngOnInit(): void {
        this.loadData();
    }

    // Pagination
    currentPage = 1;
    itemsPerPage = 10;
    totalRecords = 0;
    isLoading = signal(false);
    
    // Calculate money distribution
    private calculateShares(totalAmount: number, paramedicShare: number) {
        const remaining = totalAmount - paramedicShare;
        const driverShare = remaining / 3;
        const eqShare = remaining - driverShare;
        return { paramedicShare, driverShare, eqShare };
    }

    // Helper to format date from separate fields
    private getDateString(day: number, month: number, year: number): string {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    trips = signal<Trip[]>([]);

    loadData(): void {
        this.isLoading.set(true);

        // Build query params
        const params: any = {
            page: this.currentPage,
            limit: this.itemsPerPage,
            status: this.filterStatus() !== 'All' ? this.filterStatus() : undefined
        };

        // Add date filters if set
        const dateFilterData = this.dateFilter();
        if (dateFilterData.type === 'single' && dateFilterData.single) {
            params.startDate = dateFilterData.single.toISOString().split('T')[0];
            params.endDate = dateFilterData.single.toISOString().split('T')[0];
        } else if (dateFilterData.type === 'range' && dateFilterData.from && dateFilterData.to) {
            params.startDate = dateFilterData.from.toISOString().split('T')[0];
            params.endDate = dateFilterData.to.toISOString().split('T')[0];
        }

        this.tripService.getTrips(params).subscribe({
            next: (response) => {
                this.trips.set(response.data);
                this.totalRecords = response.total;
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading trips:', error);
                this.toastService.error('فشل تحميل بيانات الرحلات');
                this.isLoading.set(false);
            }
        });
    }

    // --- Computed Property for Filtering ---
    filteredTrips = computed(() => {
        return this.trips();
    });

    getPaginatedTrips(): Trip[] {
        return this.trips();
    }

    onPageChange(page: number): void {
        this.currentPage = page;
        this.loadData();
    }

    onItemsPerPageChange(itemsPerPage: number): void {
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1;
        this.loadData();
    }

    // --- Component Methods ---

    toggleFilterPanel(): void {
        this.isFilterPanelVisible.update(v => !v);
    }

    // Quick filter methods (clickable fields)
    quickFilterByDriver(driverName: string): void {
        this.driverFilterValue = driverName;
        this.driverNameFilter.set(driverName);
        //this.isFilterPanelVisible.set(false);
    }

    quickFilterByParamedic(paramedicName: string): void {
        this.paramedicFilterValue = paramedicName;
        this.paramedicNameFilter.set(paramedicName);
        //this.isFilterPanelVisible.set(false);
    }

    quickFilterByPatient(patientName: string): void {
        this.patientFilterValue = patientName;
        this.patientNameFilter.set(patientName);
        //this.isFilterPanelVisible.set(false);
    }

    quickFilterByDate(day: number, month: number, year: number): void {
        this.dateFilterType = 'single';
        this.dateFilterDay = day;
        this.dateFilterMonth = month;
        this.dateFilterYear = year;
        const singleDate = new Date(year, month - 1, day);
        this.dateFilter.set({ type: 'single', single: singleDate });
        //this.isFilterPanelVisible.set(false);
    }

    quickFilterByLocation(location: string, type: 'from' | 'to'): void {
        if (type === 'from') {
            this.locationFromFilterValue = location;
            this.locationFromFilter.set(location);
        } else {
            this.locationToFilterValue = location;
            this.locationToFilter.set(location);
        }
        //this.isFilterPanelVisible.set(false);
    }

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
            case 'ينقل':
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
            case 'ينقل':
                return 'text-bg-warning';
            default:
                return 'text-bg-secondary';
        }
    }

    applyFilters(): void {
        this.filterStatus.set(this.selectedStatus);

        // Apply date filter
        if (this.dateFilterType === 'single' && this.dateFilterDay && this.dateFilterMonth && this.dateFilterYear) {
            const singleDate = new Date(this.dateFilterYear, this.dateFilterMonth - 1, this.dateFilterDay);
            this.dateFilter.set({ type: 'single', single: singleDate });
        } else if (this.dateFilterType === 'range' &&
                   this.dateFilterDayFrom && this.dateFilterMonthFrom && this.dateFilterYearFrom &&
                   this.dateFilterDayTo && this.dateFilterMonthTo && this.dateFilterYearTo) {
            const fromDate = new Date(this.dateFilterYearFrom, this.dateFilterMonthFrom - 1, this.dateFilterDayFrom);
            const toDate = new Date(this.dateFilterYearTo, this.dateFilterMonthTo - 1, this.dateFilterDayTo);
            this.dateFilter.set({ type: 'range', from: fromDate, to: toDate });
        } else {
            this.dateFilter.set({ type: 'single' });
        }

        this.driverNameFilter.set(this.driverFilterValue);
        this.paramedicNameFilter.set(this.paramedicFilterValue);
        this.patientNameFilter.set(this.patientFilterValue);
        this.locationFromFilter.set(this.locationFromFilterValue);
        this.locationToFilter.set(this.locationToFilterValue);

        this.currentPage = 1;
        this.loadData();
    }
    
    resetFilters(): void {
        this.dateFilterType = 'single';
        this.dateFilterDay = null;
        this.dateFilterMonth = null;
        this.dateFilterYear = null;
        this.dateFilterDayFrom = null;
        this.dateFilterMonthFrom = null;
        this.dateFilterYearFrom = null;
        this.dateFilterDayTo = null;
        this.dateFilterMonthTo = null;
        this.dateFilterYearTo = null;
        this.driverFilterValue = '';
        this.paramedicFilterValue = '';
        this.patientFilterValue = '';
        this.locationFromFilterValue = '';
        this.locationToFilterValue = '';
        this.selectedStatus = 'All';

        this.filterStatus.set('All');
        this.dateFilter.set({ type: 'single' });
        this.driverNameFilter.set('');
        this.paramedicNameFilter.set('');
        this.patientNameFilter.set('');
        this.locationFromFilter.set('');
        this.locationToFilter.set('');
        this.currentPage = 1;
        this.loadData();
    }

    selectStatus(status: FilterStatus): void {
        this.selectedStatus = status;
        this.filterStatus.set(status);
        this.currentPage = 1;
        this.loadData();
    }

    getStatusClass(status: FilterStatus): string {
        return this.selectedStatus === status ? 'btn-primary-custom' : 'btn-outline-secondary text-dark';
    }

    openAddTripModal(): void {
        this.tripForm = {
            day: this.thisday,
            month: this.thismonth + 1,
            year: this.thisyear,
            driver: '',
            paramedic: '',
            transferFrom: '',
            transferTo: '',
            start: 0,
            end: 0,
            diesel: 0,
            patientName: '',
            patientAge: 0,
            ymdDay: 1,
            ymdMonth: 1,
            ymdYear: new Date().getFullYear(),
            transferStatus: 'تم النقل',
            diagnosis: '',
            totalAmount: 0,
            paramedicShare: 0
        };
        this.driverSearchTerm.set('');
        this.paramedicSearchTerm.set('');
        this.isAddTripModalOpen.set(true);
    }

    addTrip(): void {
        const shares = this.calculateShares(this.tripForm.totalAmount, this.tripForm.paramedicShare);

        this.tripService.createTrip({
            day: this.tripForm.day,
            month: this.tripForm.month,
            year: this.tripForm.year,
            driver: this.tripForm.driver,
            paramedic: this.tripForm.paramedic,
            transferFrom: this.tripForm.transferFrom,
            transferTo: this.tripForm.transferTo,
            start: this.tripForm.start,
            end: this.tripForm.end,
            diesel: this.tripForm.diesel,
            patientName: this.tripForm.patientName,
            patientAge: this.tripForm.patientAge,
            ymdDay: this.tripForm.ymdDay,
            ymdMonth: this.tripForm.ymdMonth,
            ymdYear: this.tripForm.ymdYear,
            transferStatus: this.tripForm.transferStatus,
            diagnosis: this.tripForm.diagnosis,
            totalAmount: this.tripForm.totalAmount,
            ...shares
        }).subscribe({
            next: () => {
                this.isAddTripModalOpen.set(false);
                this.toastService.success('تمت إضافة الرحلة بنجاح');
                this.loadData();
            },
            error: (error) => {
                console.error('Error creating trip:', error);
                this.toastService.error('فشلت عملية إضافة الرحلة');
            }
        });
    }

    openEditTripModal(): void {
        const trip = this.selectedTrip();
        if (trip) {
            this.tripForm = {
                day: trip.day,
                month: trip.month,
                year: trip.year,
                driver: trip.driver,
                paramedic: trip.paramedic,
                transferFrom: trip.transferFrom,
                transferTo: trip.transferTo,
                start: trip.start,
                end: trip.end,
                diesel: trip.diesel,
                patientName: trip.patientName,
                patientAge: trip.patientAge,
                ymdDay: trip.ymdDay,
                ymdMonth: trip.ymdMonth,
                ymdYear: trip.ymdYear,
                transferStatus: trip.transferStatus,
                diagnosis: trip.diagnosis,
                totalAmount: trip.totalAmount,
                paramedicShare: trip.paramedicShare
            };
            this.driverSearchTerm.set('');
            this.paramedicSearchTerm.set('');
            this.isViewTripModalOpen.set(false);
            this.isEditTripModalOpen.set(true);
        }
    }

    saveEditTrip(): void {
        const trip = this.selectedTrip();
        if (trip) {
            const shares = this.calculateShares(this.tripForm.totalAmount, this.tripForm.paramedicShare);

            this.tripService.updateTrip(trip.id, {
                day: this.tripForm.day,
                month: this.tripForm.month,
                year: this.tripForm.year,
                driver: this.tripForm.driver,
                paramedic: this.tripForm.paramedic,
                transferFrom: this.tripForm.transferFrom,
                transferTo: this.tripForm.transferTo,
                start: this.tripForm.start,
                end: this.tripForm.end,
                diesel: this.tripForm.diesel,
                patientName: this.tripForm.patientName,
                patientAge: this.tripForm.patientAge,
                ymdDay: this.tripForm.ymdDay,
                ymdMonth: this.tripForm.ymdMonth,
                ymdYear: this.tripForm.ymdYear,
                transferStatus: this.tripForm.transferStatus,
                diagnosis: this.tripForm.diagnosis,
                totalAmount: this.tripForm.totalAmount,
                ...shares
            }).subscribe({
                next: (updatedTrip) => {
                    this.selectedTrip.set(updatedTrip);
                    this.isEditTripModalOpen.set(false);
                    this.isViewTripModalOpen.set(true);
                    this.toastService.success('تم تحديث الرحلة بنجاح');
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error updating trip:', error);
                    this.toastService.error('فشلت عملية تحديث الرحلة');
                }
            });
        }
    }

    viewTripDetails(trip: Trip): void {
        this.selectedTrip.set(trip);
        this.isViewTripModalOpen.set(true);
    }

    closeViewTripModal(): void {
        this.isViewTripModalOpen.set(false);
        this.selectedTrip.set(null);
    }

    closeEditTripModal(): void {
        this.isEditTripModalOpen.set(false);
    }

    showDeleteConfirmation(trip: Trip): void {
        this.tripToDelete.set(trip);
        this.confirmationModalConfig.set({
            type: 'delete',
            title: 'تأكيد حذف الرحلة',
            message: `هل أنت متأكد من أنك تريد حذف رحلة المريض ${trip.patientName}؟<br>لا يمكن التراجع عن هذا الإجراء.`,
            confirmButtonText: 'حذف',
            cancelButtonText: 'إلغاء',
            highlightedText: trip.patientName
        });
        this.isDeleteTripModalOpen.set(true);
    }

    closeDeleteConfirmation(): void {
        this.tripToDelete.set(null);
        this.isDeleteTripModalOpen.set(false);
    }

    confirmDeleteTrip(): void {
        const trip = this.tripToDelete();
        if (trip) {
            this.tripService.deleteTrip(trip.id).subscribe({
                next: () => {
                    this.toastService.success(`تم حذف رحلة المريض: ${trip.patientName}`);
                    this.closeDeleteConfirmation();
                    if (this.selectedTrip()?.id === trip.id) {
                        this.closeViewTripModal();
                    }
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error deleting trip:', error);
                    this.toastService.error('فشلت عملية حذف الرحلة');
                }
            });
        }
    }

    getFormattedDate(day: number, month: number, year: number): string {
        return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    }

    getDaysInMonth(month: number, year: number): number[] {
        const days = new Date(year, month, 0).getDate();
        return Array.from({ length: days }, (_, i) => i + 1);
    }

    getMonths(): number[] {
        return Array.from({ length: 12 }, (_, i) => i + 1);
    }

    getYears(): number[] {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 10 }, (_, i) => currentYear - i);
    }
}