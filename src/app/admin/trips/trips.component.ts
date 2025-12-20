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
import { ExportService } from '../../shared/services/export.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { ConfirmationModalComponent, ConfirmationModalConfig } from '../../shared/confirmation-modal/confirmation-modal.component';
import { LocationSearchComponent, LocationSelection } from '../../shared/location-search/location-search.component';
import { TransportationTypeSearchComponent, TransportationTypeSelection } from '../../shared/transportation-type-search/transportation-type-search.component';
import { TRANSFER_STATUS } from '../../shared/constants/status.constants';
import { Trip, TransferStatus, FilterStatus, DriverReference, ParamedicReference, TripType, VehicleReference } from '../../shared/models';

@Component({
    selector: 'app-trips',
    standalone: true,
    imports: [CommonModule, FormsModule, PaginationComponent, StatusBadgeComponent, ConfirmationModalComponent, LocationSearchComponent, TransportationTypeSearchComponent],
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
    isAddingNewTrip = signal(false); // Track if we're in "add" mode (vs "edit" mode) for conditional field display
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
        date: this.getFormattedDateForInput(this.thisday, this.thismonth, this.thisyear),
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
        transportationTypeId: '',
        transportationTypeName: '',
        tripType: '' as TripType | '',
        otherExpenses: 0,
        totalPrice: 0,
        payedPrice: 0,
        paramedicShare: 0,
        tripNotes: ''
    };

    // Helper methods for date conversion
    private getFormattedDateForInput(day: number, month: number, year: number): string {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    private extractDateParts(dateString: string): { day: number, month: number, year: number } {
        const date = new Date(dateString + 'T00:00:00'); // Force local timezone
        return {
            day: date.getDate(),
            month: date.getMonth() + 1, // Convert 0-11 to 1-12
            year: date.getFullYear()
        };
    }

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
        private vehicleService: VehicleService,
        private exportService: ExportService
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
    isExporting = signal(false);

    // Calculate money distribution based on total price (full service value)
    // IMPORTANT: Must match backend logic (trips.php:1108-1127)
    // Loan amount (totalPrice - payedPrice) is tracked separately
    private calculateShares(totalPrice: number, paramedicShare: number, fuelCost: number) {
        // Backend formula:
        // afterParamedic = totalPrice - paramedicShare
        // afterFuel = afterParamedic - fuelCost  (1 NIS per km)
        // driverShare = afterFuel / 3
        // eqShare = (afterFuel / 3) * 2
        const afterParamedic = totalPrice - paramedicShare;
        const afterFuel = afterParamedic - fuelCost;  // Deduct fuel BEFORE splitting
        const afterOtherCosts = afterFuel - (this.tripForm.otherExpenses || 0); // Deduct other expenses BEFORE splitting
        const driverShare = afterOtherCosts / 3;
        const eqShare = (afterOtherCosts / 3) * 2;  // 2/3 of remaining
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

    closeAddTripModal(): void {
        this.isAddTripModalOpen.set(false);
        this.isAddingNewTrip.set(false); // Reset flag when closing modal
    }

    openAddTripModal(): void {
        this.isAddingNewTrip.set(true); // Set flag for conditional field display
        this.tripForm = {
            date: this.getFormattedDateForInput(this.thisday, this.thismonth + 1, this.thisyear),
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
            transferStatus: 'ينقل', // Changed default from 'لم يتم النقل' to 'ينقل'
            diagnosis: '',
            transportationTypeId: '',
            transportationTypeName: '',
            tripType: '',
            otherExpenses: 0,
            totalPrice: 0,
            payedPrice: 0,
            paramedicShare: 0,
            tripNotes: ''
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
            this.tripForm.start = null;
            return;
        }

        const vehicle = this.vehiclesList.find((v: any) => v.id === vehicleId);
        if (vehicle) {
            this.tripForm.vehicleId = vehicleId;
            this.tripForm.vehicleName = vehicle.vehicleName;
            /*
            // Auto-populate start odometer from vehicle's current_odometer
            this.vehicleService.getCurrentOdometer(vehicleId).subscribe({
                next: (response) => {
                    this.tripForm.start = response.currentOdometer;
                },
                error: (error) => console.error('Failed to load current odometer:', error)
            });
            */
        }
    }

    /**
     * Handle transfer from location selection
     * Note: New locations are NOT created here - only when the trip is saved
     */
    onTransferFromSelected(selection: LocationSelection): void {
        this.tripForm.transferFrom = selection.name;
        this.tripForm.transferFromTag = selection.tag;

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
        this.tripForm.transferToTag = selection.tag;

        if (selection.isNew) {
            // Store empty ID - location will be created when trip is submitted
            this.tripForm.transferToId = '';
        } else {
            this.tripForm.transferToId = selection.id;
        }
    }

    /**
     * Handle transportation type selection
     */
    onTransportationTypeSelected(selection: TransportationTypeSelection): void {
        this.tripForm.transportationTypeId = selection.id;
        this.tripForm.transportationTypeName = selection.name;
    }

    addTrip(): void {
        const fuelCost = this.calculatedDiesel * 1.0;  // 1 NIS per km
        const shares = this.calculateShares(this.tripForm.totalPrice, this.tripForm.paramedicShare, fuelCost);
        const { day, month, year } = this.extractDateParts(this.tripForm.date);

        this.tripService.createTrip({
            day,
            month,
            year,
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
            transportationTypeId: this.tripForm.transportationTypeId || undefined,
            transportationTypeName: this.tripForm.transportationTypeName || undefined,
            tripType: this.tripForm.tripType || undefined,
            otherExpenses: this.tripForm.otherExpenses,
            totalPrice: this.tripForm.totalPrice,
            payedPrice: this.tripForm.payedPrice,
            tripNotes: this.tripForm.tripNotes,
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
        this.isAddingNewTrip.set(false); // Set flag to false for edit mode
        const trip = this.selectedTrip();
        if (trip) {
            this.tripForm = {
                date: this.getFormattedDateForInput(trip.day, trip.month, trip.year),
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
                transportationTypeId: trip.transportationTypeId || '',
                transportationTypeName: trip.transportationTypeName || '',
                tripType: (trip.tripType as TripType | '') || '',
                otherExpenses: trip.otherExpenses || 0,
                totalPrice: trip.totalPrice,
                payedPrice: trip.payedPrice,
                paramedicShare: trip.paramedicShare,
                tripNotes: trip.tripNotes || ''
            };
            this.vehicleSearchTerm.set('');
            this.isViewTripModalOpen.set(false);
            this.isEditTripModalOpen.set(true);
        }
    }

    saveEditTrip(): void {
        const trip = this.selectedTrip();
        if (trip) {
            const fuelCost = this.calculatedDiesel * 1.0;  // 1 NIS per km
            const shares = this.calculateShares(this.tripForm.totalPrice, this.tripForm.paramedicShare, fuelCost);
            const { day, month, year } = this.extractDateParts(this.tripForm.date);

            const updatedData = {
                day,
                month,
                year,
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
                transportationTypeId: this.tripForm.transportationTypeId || undefined,
                transportationTypeName: this.tripForm.transportationTypeName || undefined,
                tripType: this.tripForm.tripType || undefined,
                otherExpenses: this.tripForm.otherExpenses,
                totalPrice: this.tripForm.totalPrice,
                payedPrice: this.tripForm.payedPrice,
                tripNotes: this.tripForm.tripNotes,
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
        this.isAddingNewTrip.set(false); // Reset flag when closing modal
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


    /**
     * Format timestamp for display in admin view (using Gregorian calendar)
     */
    formatTimestamp(date: Date | string | undefined): string {
        if (!date) return 'غير متاح';
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    /**
     * Calculate duration between accepted and closed timestamps
     */
    getTripDuration(acceptedAt: Date | string | undefined, closedAt: Date | string | undefined): string {
        if (!acceptedAt || !closedAt) return 'غير متاح';
        const accepted = typeof acceptedAt === 'string' ? new Date(acceptedAt) : acceptedAt;
        const closed = typeof closedAt === 'string' ? new Date(closedAt) : closedAt;
        const diffMs = closed.getTime() - accepted.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${hours}س ${mins}د`;
    }

    /**
     * Admin force-close a trip
     */
    forceCloseTrip(): void {
        const trip = this.selectedTrip();
        if (!trip) return;

        if (trip.isClosed) {
            this.toastService.error('الرحلة مغلقة بالفعل');
            return;
        }

        // Check if trip has a final status before allowing closure
        const finalStatuses: TransferStatus[] = ['تم النقل', 'رفض النقل', 'بلاغ كاذب'];
        if (!finalStatuses.includes(trip.transferStatus)) {
            this.toastService.error(`لا يمكن إغلاق الرحلة بحالة "${trip.transferStatus}". يرجى تغيير الحالة إلى حالة نهائية أولاً.`);
            return;
        }

        this.tripService.closeTrip(trip.id, trip.transferStatus).subscribe({
            next: () => {
                this.toastService.success('تم إغلاق الرحلة بنجاح');
                this.selectedTrip.update(t => t ? { ...t, isClosed: true } : null);
                this.loadData();
            },
            error: (error) => {
                console.error('Error closing trip:', error);
                this.toastService.error('فشل إغلاق الرحلة');
            }
        });
    }

    /**
     * Admin reopen a closed trip (unclose)
     */
    uncloseTrip(): void {
        const trip = this.selectedTrip();
        if (!trip) return;

        if (!trip.isClosed) {
            this.toastService.error('الرحلة غير مغلقة');
            return;
        }

        this.tripService.uncloseTrip(trip.id).subscribe({
            next: () => {
                this.toastService.success('تم إعادة فتح الرحلة بنجاح');
                this.selectedTrip.update(t => t ? { ...t, isClosed: false, closedAt: null, closedBy: null } : null);
                this.loadData();
            },
            error: (error) => {
                console.error('Error reopening trip:', error);
                this.toastService.error('فشل إعادة فتح الرحلة');
            }
        });
    }

    /**
     * Export filtered trips to Excel
     */
    exportToExcel(): void {
        this.isExporting.set(true);

        // Build query params - same as loadData() but without pagination
        const params: any = {
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
        } else {
            // Default to current month if no date filter
            const today = new Date();
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            params.startDate = firstDay.toISOString().split('T')[0];
            params.endDate = lastDay.toISOString().split('T')[0];
        }

        // Add other filters
        if (this.patientNameFilter()) {
            params.patientName = this.patientNameFilter();
        }

        if (this.filterTransferToId) {
            params.transferToId = this.filterTransferToId;
        }

        if (this.selectedLocationTag !== 'all') {
            params.locationTag = this.selectedLocationTag;
        }

        if (this.selectedLocationType !== 'all') {
            params.locationType = this.selectedLocationType;
        }

        // Fetch all trips matching the filters
        this.tripService.getAllTripsForExport(params).subscribe({
            next: (trips) => {
                if (trips.length === 0) {
                    this.toastService.error('لا توجد رحلات لتصديرها');
                    this.isExporting.set(false);
                    return;
                }

                // Define Arabic column headers
                const columns = [
                    { header: 'التاريخ', key: 'formattedDate', width: 12 },
                    { header: 'اسم المريض', key: 'patientName', width: 20 },
                    { header: 'هاتف المريض', key: 'patientContact', width: 15 },
                    { header: 'من', key: 'transferFrom', width: 20 },
                    { header: 'إلى', key: 'transferTo', width: 20 },
                    { header: 'المركبة', key: 'vehicleName', width: 15 },
                    { header: 'السائق', key: 'driver', width: 18 },
                    { header: 'المسعف', key: 'paramedic', width: 18 },
                    { header: 'نوع الرحلة', key: 'tripType', width: 12 },
                    { header: 'حالة النقل', key: 'transferStatus', width: 15 },
                    { header: 'التشخيص', key: 'transportationTypeName', width: 25 },
                    { header: 'السعر الكامل', key: 'totalPrice', width: 12 },
                    { header: 'المبلغ المدفوع', key: 'payedPrice', width: 12 },
                    { header: 'الديزل المستخدم', key: 'diesel', width: 12 },
                    { header: 'حصة المسعف', key: 'paramedicShare', width: 12 },
                    { header: 'حصة السائق', key: 'driverShare', width: 12 },
                    { header: 'حصة الشركة', key: 'companyShare', width: 12 },
                    { header: 'حصة المالك', key: 'ownerShare', width: 12 },
                    { header: 'مصاريف أخرى', key: 'otherExpenses', width: 12 },
                    { header: 'الملاحظات', key: 'tripNotes', width: 30 },
                    { header: 'تم القبول في', key: 'acceptedAt', width: 18 },
                    { header: 'تم الإغلاق في', key: 'closedAt', width: 18 },
                    { header: 'مغلقة؟', key: 'isClosedText', width: 10 }
                ];

                // Format data for export and calculate actual company/owner shares
                const exportData = trips.map(trip => {
                    // Calculate shares using the same logic as backend (trips.php:1150-1156)
                    const paramedicShare = trip.paramedicShare || 0;
                    const otherExpenses = trip.otherExpenses || 0;
                    const fuelCost = (trip.diesel || 0) * 1.0; // 1 NIS per km

                    const afterParamedic = trip.totalPrice - paramedicShare - otherExpenses;
                    const afterFuel = afterParamedic - fuelCost;
                    const eqShareTotal = (afterFuel / 3) * 2;
                    const companyShare = (eqShareTotal / 2) + fuelCost;
                    const ownerShare = eqShareTotal / 2;

                    return {
                        ...trip,
                        formattedDate: this.exportService.formatDate(trip.day, trip.month, trip.year),
                        diesel: trip.diesel || 0,
                        otherExpenses: otherExpenses,
                        companyShare: companyShare,
                        ownerShare: ownerShare,
                        tripNotes: trip.tripNotes || '',
                        acceptedAt: trip.acceptedAt ? new Date(trip.acceptedAt).toLocaleString('ar-EG') : '',
                        closedAt: trip.closedAt ? new Date(trip.closedAt).toLocaleString('ar-EG') : '',
                        isClosedText: this.exportService.formatBoolean(trip.isClosed)
                    };
                });

                // Calculate totals from the exportData (which has calculated shares)
                const totals = {
                    formattedDate: 'الإجمالي',
                    patientName: '',
                    patientContact: '',
                    transferFrom: '',
                    transferTo: '',
                    vehicleName: '',
                    driver: '',
                    paramedic: '',
                    tripType: '',
                    transferStatus: '',
                    transportationTypeName: '',
                    totalPrice: Number(exportData.reduce((sum, t) => sum + (Number(t.totalPrice) || 0), 0)).toFixed(2),
                    payedPrice: Number(exportData.reduce((sum, t) => sum + (Number(t.payedPrice) || 0), 0)).toFixed(2),
                    diesel: Number(exportData.reduce((sum, t) => sum + (Number(t.diesel) || 0), 0)).toFixed(2),
                    paramedicShare: Number(exportData.reduce((sum, t) => sum + (Number(t.paramedicShare) || 0), 0)).toFixed(2),
                    driverShare: Number(exportData.reduce((sum, t) => sum + (Number(t.driverShare) || 0), 0)).toFixed(2),
                    companyShare: Number(exportData.reduce((sum, t) => sum + (Number(t.companyShare) || 0), 0)).toFixed(2),
                    ownerShare: Number(exportData.reduce((sum, t) => sum + (Number(t.ownerShare) || 0), 0)).toFixed(2),
                    otherExpenses: Number(exportData.reduce((sum, t) => sum + (Number(t.otherExpenses) || 0), 0)).toFixed(2),
                    tripNotes: '',
                    acceptedAt: '',
                    closedAt: '',
                    isClosedText: ''
                };

                // Add totals row
                exportData.push(totals as any);

                // Generate filename
                const filename = this.exportService.generateFilenameWithDates(
                    'trips_export',
                    params.startDate,
                    params.endDate
                );

                // Export to Excel
                this.exportService.exportToExcel(
                    exportData,
                    columns,
                    filename,
                    'الرحلات'
                );

                this.toastService.success(`تم تصدير ${trips.length} رحلة بنجاح`);
                this.isExporting.set(false);
            },
            error: (error) => {
                console.error('Error exporting trips:', error);
                this.toastService.error('فشل تصدير الرحلات');
                this.isExporting.set(false);
            }
        });
    }

    /**
     * Helper method: Get days in month for date filtering
     */
    getDaysInMonth(month: number, year: number): number[] {
        const daysInMonth = new Date(year, month, 0).getDate();
        return Array.from({ length: daysInMonth }, (_, i) => i + 1);
    }

    /**
     * Helper method: Get months for date filtering
     */
    getMonths(): number[] {
        return Array.from({ length: 12 }, (_, i) => i + 1);
    }

    /**
     * Helper method: Get years for date filtering
     */
    getYears(): number[] {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 20 }, (_, i) => currentYear - 10 + i);
    }

}
