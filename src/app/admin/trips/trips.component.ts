import { Component, signal, ChangeDetectionStrategy, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GlobalVarsService } from '../../global-vars.service';
import { ToastService } from '../../shared/services/toast.service';
import { ValidationService } from '../../shared/services/validation.service';
import { TripService } from '../../shared/services/trip.service';
import { DriverService } from '../../shared/services/driver.service';
import { ParamedicService } from '../../shared/services/paramedic.service';
import { VehicleService } from '../../shared/services/vehicle.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { ConfirmationModalComponent, ConfirmationModalConfig } from '../../shared/confirmation-modal/confirmation-modal.component';
import { LocationSearchComponent, LocationSelection } from '../../shared/location-search/location-search.component';
import { TRANSFER_STATUS } from '../../shared/constants/status.constants';
import { Trip, TransferStatus, FilterStatus, DriverReference, ParamedicReference, TripType, VehicleReference } from '../../shared/models';

@Component({
    selector: 'app-trips',
    standalone: true,
    imports: [CommonModule, FormsModule, PaginationComponent, StatusBadgeComponent, ConfirmationModalComponent, LocationSearchComponent],
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

    patientFilterValue: string = '';
    locationToFilterValue: string = '';
    selectedStatus: FilterStatus = 'All';
    selectedLocationTag: string = 'all'; // 'all' | 'common' | 'custom'
    selectedLocationType: string = 'all'; // 'all' | 'hospital' | 'clinic' | 'emergency' | 'other'
    filterTransferToId: string = ''; // For location dropdown filter

    // Filters for computation
    filterStatus = signal<FilterStatus>('All');
    dateFilter = signal<{ type: 'single' | 'range', single?: Date, from?: Date, to?: Date }>({ type: 'single' });
    patientNameFilter = signal('');
    locationToFilter = signal('');
    locationTagFilter = signal<string>('all');

    // Location types for filtering
    locationTypes = [
        { value: 'hospital', label: 'مستشفى' },
        { value: 'clinic', label: 'عيادة' },
        { value: 'emergency', label: 'طوارئ' },
        { value: 'other', label: 'أخرى' }
    ];

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
        vehicleId: '',
        vehicleName: '',
        transferFrom: '',
        transferFromId: '',
        transferFromTag: 'common' as 'common' | 'custom',
        transferTo: '',
        transferToId: '',
        transferToTag: 'common' as 'common' | 'custom',
        start: null as number | null,
        end: null as number | null,
        patientName: '',
        patientContact: '',
        ymdNumber: null as number | null,
        ymdPeriod: 'يوم' as 'يوم' | 'اسبوع' | 'شهر' | 'سنة',
        transferStatus: 'لم يتم النقل' as TransferStatus,
        diagnosis: '',
        tripType: '' as TripType | '',
        otherExpenses: 0,
        totalPrice: 0,
        payedPrice: 0,
        paramedicShare: 0
    };

    // Computed diesel value based on end - start
    get calculatedDiesel(): number {
        const start = this.tripForm.start || 0;
        const end = this.tripForm.end || 0;
        return Math.max(0, end - start);
    }

    // Search filters for dropdowns
    vehicleSearchTerm = signal('');

    vehiclesList: VehicleReference[] = [];
    transferStatuses: TransferStatus[] = ['ميداني', 'تم النقل', 'بلاغ كاذب', 'ينقل', 'لم يتم النقل', 'صيانة', 'رفض النقل', 'اخرى'];
    tripTypes: TripType[] = ['داخلي', 'وسط', 'خارجي', 'اخرى'];

    // Computed filtered lists
    filteredVehiclesList = computed(() => {
        const term = this.vehicleSearchTerm().toLowerCase();
        return this.vehiclesList.filter((v: any) =>
            v.vehicleName?.toLowerCase().includes(term) ||
            v.vehicleId?.toLowerCase().includes(term)
        );
    });

    constructor(
        private globalVars: GlobalVarsService,
        private toastService: ToastService,
        private validationService: ValidationService,
        private tripService: TripService,
        private vehicleService: VehicleService
    ) {
        this.globalVars.setGlobalHeader('الرحلات والنقليات');
    }

    ngOnInit(): void {
        this.loadVehicles();
        this.loadData();
    }

    /**
     * Load vehicles from database
     */
    loadVehicles(): void {
        this.vehicleService.getVehicles({ limit: 1000 }).subscribe({
            next: (response) => {
                this.vehiclesList = response.data.map((vehicle: any) => ({
                    id: vehicle.id,
                    vehicleId: vehicle.vehicleId,
                    vehicleName: vehicle.vehicleName
                }));
            },
            error: (error) => {
                console.error('Error loading vehicles:', error);
                this.toastService.error('فشل تحميل قائمة المركبات');
            }
        });
    }

    // Pagination
    currentPage = 1;
    itemsPerPage = 10;
    totalRecords = 0;
    isLoading = signal(false);

    // Calculate money distribution based on payed price (not total price)
    private calculateShares(payedPrice: number, paramedicShare: number) {
        const remaining = payedPrice - paramedicShare;
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

        // Add other filters
        if (this.patientNameFilter()) {
            params.patientName = this.patientNameFilter();
        }

        // Use location ID filter instead of text-based search
        if (this.filterTransferToId) {
            params.transferToId = this.filterTransferToId;
        }

        // Add location tag filter (common/custom)
        const locationTag = this.locationTagFilter();
        if (locationTag && locationTag !== 'all') {
            params.locationTag = locationTag;
        }

        // Add location type filter (hospital/clinic/emergency/other)
        if (this.selectedLocationType && this.selectedLocationType !== 'all') {
            params.locationType = this.selectedLocationType;
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
    quickFilterByPatient(patientName: string): void {
        this.patientFilterValue = patientName;
        this.patientNameFilter.set(patientName);
    }

    quickFilterByDate(day: number, month: number, year: number): void {
        this.dateFilterType = 'single';
        this.dateFilterDay = day;
        this.dateFilterMonth = month;
        this.dateFilterYear = year;
        const singleDate = new Date(year, month - 1, day);
        this.dateFilter.set({ type: 'single', single: singleDate });
    }

    // Handler for location dropdown selection
    onTransferToFilterSelected(selection: LocationSelection | null): void {
        if (selection) {
            this.filterTransferToId = selection.id;
        } else {
            this.filterTransferToId = '';
        }
        this.currentPage = 1;
        this.loadData();
    }

    // Always filter by 'To' location when clicking any location
    quickFilterByLocation(location: string): void {
        this.locationToFilterValue = location;
        this.locationToFilter.set(location);
        this.currentPage = 1;
        this.loadData();
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

        this.patientNameFilter.set(this.patientFilterValue);
        this.locationToFilter.set(this.locationToFilterValue);
        this.locationTagFilter.set(this.selectedLocationTag);

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
        this.patientFilterValue = '';
        this.locationToFilterValue = '';
        this.selectedStatus = 'All';
        this.selectedLocationTag = 'all';

        this.filterStatus.set('All');
        this.dateFilter.set({ type: 'single' });
        this.patientNameFilter.set('');
        this.locationToFilter.set('');
        this.locationTagFilter.set('all');
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
            vehicleId: '',
            vehicleName: '',
            transferFrom: '',
            transferFromId: '',
            transferFromTag: 'common',
            transferTo: '',
            transferToId: '',
            transferToTag: 'common',
            start: null,
            end: null,
            patientName: '',
            patientContact: '',
            ymdNumber: null,
            ymdPeriod: 'يوم',
            transferStatus: 'لم يتم النقل',
            diagnosis: '',
            tripType: '',
            otherExpenses: 0,
            totalPrice: 0,
            payedPrice: 0,
            paramedicShare: 0
        };
        this.vehicleSearchTerm.set('');
        this.isAddTripModalOpen.set(true);
    }

    /**
     * Calculate paramedic share based on trip type
     */
    calculateParamedicShare(tripType: TripType | '', customShare?: number): number {
        const shares: Record<string, number> = {
            'داخلي': 20,
            'وسط': 60,
            'خارجي': 80
        };

        if (tripType === 'اخرى') {
            return customShare ?? 0;
        }

        return shares[tripType] ?? 0;
    }

    /**
     * Handle trip type change to auto-calculate paramedic share
     */
    onTripTypeChange(): void {
        if (this.tripForm.tripType && this.tripForm.tripType !== 'اخرى') {
            this.tripForm.paramedicShare = this.calculateParamedicShare(this.tripForm.tripType);
        } else if (this.tripForm.tripType === 'اخرى') {
            // Allow user to enter custom value for 'اخرى'
            // Keep the existing value or reset to 0 if needed
        } else {
            this.tripForm.paramedicShare = 0;
        }
    }

    /**
     * Handle vehicle selection from dropdown
     */
    onVehicleSelect(event: Event): void {
        const target = event.target as HTMLSelectElement;
        const vehicleId = target.value;

        if (!vehicleId) {
            this.tripForm.vehicleId = '';
            this.tripForm.vehicleName = '';
            return;
        }

        const vehicle = this.vehiclesList.find((v: any) => v.id === vehicleId);
        if (vehicle) {
            this.tripForm.vehicleId = vehicleId;
            this.tripForm.vehicleName = vehicle.vehicleName;
        }
    }

    /**
     * Handle transfer from location selection
     * Note: New locations are NOT created here - only when the trip is saved
     */
    onTransferFromSelected(selection: LocationSelection): void {
        this.tripForm.transferFrom = selection.name;
        this.tripForm.transferFromTag = selection.locationType;

        if (selection.isNew) {
            // Store empty ID - location will be created when trip is submitted
            this.tripForm.transferFromId = '';
        } else {
            this.tripForm.transferFromId = selection.id;
        }
    }

    /**
     * Handle transfer to location selection
     * Note: New locations are NOT created here - only when the trip is saved
     */
    onTransferToSelected(selection: LocationSelection): void {
        this.tripForm.transferTo = selection.name;
        this.tripForm.transferToTag = selection.locationType;

        if (selection.isNew) {
            // Store empty ID - location will be created when trip is submitted
            this.tripForm.transferToId = '';
        } else {
            this.tripForm.transferToId = selection.id;
        }
    }

    addTrip(): void {
        const shares = this.calculateShares(this.tripForm.payedPrice, this.tripForm.paramedicShare);

        this.tripService.createTrip({
            day: this.tripForm.day,
            month: this.tripForm.month,
            year: this.tripForm.year,
            vehicleId: this.tripForm.vehicleId,
            vehicleName: this.tripForm.vehicleName,
            driver: '', // Will be populated by driver
            paramedic: '', // Will be populated by driver
            transferFrom: this.tripForm.transferFrom,
            transferFromId: this.tripForm.transferFromId,
            transferFromTag: this.tripForm.transferFromTag,
            transferTo: this.tripForm.transferTo,
            transferToId: this.tripForm.transferToId,
            transferToTag: this.tripForm.transferToTag,
            start: this.tripForm.start || 0,
            end: this.tripForm.end || 0,
            diesel: this.calculatedDiesel,
            patientName: this.tripForm.patientName,
            patientContact: this.tripForm.patientContact || undefined,
            ymdValue: this.tripForm.ymdNumber || 0,
            ymdPeriod: this.tripForm.ymdPeriod,
            transferStatus: this.tripForm.transferStatus,
            diagnosis: this.tripForm.diagnosis,
            tripType: this.tripForm.tripType || undefined,
            otherExpenses: this.tripForm.otherExpenses,
            totalPrice: this.tripForm.totalPrice,
            payedPrice: this.tripForm.payedPrice,
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
                vehicleId: trip.vehicleId || '',
                vehicleName: trip.vehicleName || '',
                transferFrom: trip.transferFrom,
                transferFromId: trip.transferFromId || '',
                transferFromTag: (trip.transferFromTag as 'common' | 'custom') || 'common',
                transferTo: trip.transferTo,
                transferToId: trip.transferToId || '',
                transferToTag: (trip.transferToTag as 'common' | 'custom') || 'common',
                start: trip.start === 0 ? null : trip.start,
                end: trip.end === 0 ? null : trip.end,
                patientName: trip.patientName,
                patientContact: trip.patientContact || '',
                ymdNumber: (trip.ymdValue && trip.ymdValue > 0) ? trip.ymdValue : null,
                ymdPeriod: (trip.ymdPeriod as 'يوم' | 'اسبوع' | 'شهر' | 'سنة') || 'يوم',
                transferStatus: trip.transferStatus,
                diagnosis: trip.diagnosis,
                tripType: (trip.tripType as TripType | '') || '',
                otherExpenses: trip.otherExpenses || 0,
                totalPrice: trip.totalPrice,
                payedPrice: trip.payedPrice,
                paramedicShare: trip.paramedicShare
            };
            this.vehicleSearchTerm.set('');
            this.isViewTripModalOpen.set(false);
            this.isEditTripModalOpen.set(true);
        }
    }

    saveEditTrip(): void {
        const trip = this.selectedTrip();
        if (trip) {
            const shares = this.calculateShares(this.tripForm.payedPrice, this.tripForm.paramedicShare);

            const updatedData = {
                day: this.tripForm.day,
                month: this.tripForm.month,
                year: this.tripForm.year,
                vehicleId: this.tripForm.vehicleId,
                vehicleName: this.tripForm.vehicleName,
                transferFrom: this.tripForm.transferFrom,
                transferFromId: this.tripForm.transferFromId,
                transferFromTag: this.tripForm.transferFromTag,
                transferTo: this.tripForm.transferTo,
                transferToId: this.tripForm.transferToId,
                transferToTag: this.tripForm.transferToTag,
                start: this.tripForm.start || 0,
                end: this.tripForm.end || 0,
                diesel: this.calculatedDiesel,
                patientName: this.tripForm.patientName,
                patientContact: this.tripForm.patientContact || undefined,
                ymdValue: this.tripForm.ymdNumber || 0,
                ymdPeriod: this.tripForm.ymdPeriod,
                transferStatus: this.tripForm.transferStatus,
                diagnosis: this.tripForm.diagnosis,
                tripType: this.tripForm.tripType || undefined,
                otherExpenses: this.tripForm.otherExpenses,
                totalPrice: this.tripForm.totalPrice,
                payedPrice: this.tripForm.payedPrice,
                ...shares
            };

            this.tripService.updateTrip(trip.id, updatedData).subscribe({
                next: (updatedTrip) => {
                    // Merge: old trip -> updated data from form -> API response
                    // This ensures form changes are visible even if API returns partial data
                    const mergedTrip = {
                        ...trip,
                        ...updatedData,
                        ...(updatedTrip && Object.keys(updatedTrip).length > 0 ? updatedTrip : {}),
                        id: trip.id // Always preserve the ID
                    };
                    this.selectedTrip.set(mergedTrip);
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