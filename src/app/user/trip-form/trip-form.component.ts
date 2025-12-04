import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TripService } from '../../shared/services/trip.service';
import { DriverService } from '../../shared/services/driver.service';
import { ParamedicService } from '../../shared/services/paramedic.service';
import { VehicleService } from '../../shared/services/vehicle.service';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { VehicleCookieService } from '../../shared/services/vehicle-cookie.service';
import { LocationSearchComponent, LocationSelection } from '../../shared/location-search/location-search.component';
import { TransportationTypeSearchComponent, TransportationTypeSelection } from '../../shared/transportation-type-search/transportation-type-search.component';
import { Trip, TripType, TransferStatus, DriverReference, ParamedicReference, VehicleReference } from '../../shared/models';

type FormMode = 'create' | 'edit' | 'view';

@Component({
  selector: 'app-trip-form',
  standalone: true,
  imports: [CommonModule, FormsModule, LocationSearchComponent, TransportationTypeSearchComponent],
  templateUrl: './trip-form.component.html',
  styleUrls: ['./trip-form.component.css']
})
export class TripFormComponent implements OnInit {
  mode: FormMode = 'create';
  tripId: string | null = null;
  isLoading: boolean = false;
  isSaving: boolean = false;
  
  // Form data
  tripForm = {
    day: new Date().getDate(),
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    driverId: '',
    paramedicId: '',
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
    diesel: null as number | null,
    patientName: '',
    patientContact: '',
    diagnosis: '',
    transportationTypeId: '',
    transportationTypeName: '',
    transferStatus: 'ينقل' as TransferStatus,
    tripType: null as TripType | null,
    otherExpenses: null as number | null,
    totalPrice: null as number | null,
    payedPrice: null as number | null,
    paramedicShare: null as number | null,
    driverShare: null as number | null,
    eqShare: null as number | null,
    ymdValue: null as number | null,
    ymdPeriod: ''
  };

  // Options
  drivers: DriverReference[] = [];
  paramedics: ParamedicReference[] = [];
  vehicles: VehicleReference[] = [];
  
  transferStatuses: TransferStatus[] = [
    'لم يتم النقل',
    'ينقل',
    'تم النقل',
    'رفض النقل',
    'بلاغ كاذب',
    'ميداني',
    'صيانة',
    'اخرى'
  ];

  tripTypes: TripType[] = ['داخلي', 'وسط', 'خارجي', 'اخرى'];
  ymdPeriods = ['يوم', 'اسبوع', 'شهر', 'سنة'];

  // Current trip data (for edit/view mode)
  currentTrip: Trip | null = null;
  
  // Close trip modal
  showCloseConfirmModal: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tripService: TripService,
    private driverService: DriverService,
    private paramedicService: ParamedicService,
    private vehicleService: VehicleService,
    private authService: AuthService,
    private toastService: ToastService,
    private vehicleCookieService: VehicleCookieService
  ) {}

  ngOnInit(): void {
    // Get mode from query params
    this.route.queryParams.subscribe(params => {
      this.mode = (params['mode'] || 'create') as FormMode;
      const vehicleId = params['vehicleId'];
      if (vehicleId) {
        this.tripForm.vehicleId = vehicleId;
      }
    });

    // Get trip ID from route params
    this.route.params.subscribe(params => {
      this.tripId = params['id'] || null;
    });

    // Load options
    this.loadOptions();

    // Initialize form based on mode
    if (this.mode === 'create') {
      this.initializeCreateMode();
    } else if (this.tripId) {
      this.loadTrip();
    }
  }

  initializeCreateMode(): void {
    // Auto-populate driver and vehicle for new trips
    // Get driver record ID (not user ID)
    this.driverService.getCurrentDriver().subscribe({
      next: (driver) => {
        this.tripForm.driverId = driver.id;
      },
      error: (error) => console.error('Failed to get driver record:', error)
    });
    
    const vehicleId = this.tripForm.vehicleId || this.vehicleCookieService.getSelectedVehicleId();
    if (vehicleId) {
      this.tripForm.vehicleId = vehicleId;
      // Load vehicle name
      this.vehicleService.getVehicleById(vehicleId).subscribe({
        next: (vehicle) => {
          this.tripForm.vehicleName = vehicle.vehicleName;
        },
        error: (error) => console.error('Failed to load vehicle:', error)
      });
    }
  }

  loadOptions(): void {
    // Load drivers
    this.driverService.getDrivers({ limit: 1000 }).subscribe({
      next: (response) => {
        this.drivers = response.data.map(d => ({
          id: d.id,
          name: d.name,
          arabicName: d.arabicName
        }));
      },
      error: (error) => console.error('Failed to load drivers:', error)
    });

    // Load paramedics
    this.paramedicService.getParamedics({ limit: 1000 }).subscribe({
      next: (response) => {
        this.paramedics = response.data.map(p => ({
          id: p.id,
          name: p.name,
          arabicName: p.arabicName
        }));
      },
      error: (error) => console.error('Failed to load paramedics:', error)
    });

    // Load vehicles
    this.vehicleService.getVehicles({ limit: 1000 }).subscribe({
      next: (response) => {
        this.vehicles = response.data.map(v => ({
          id: v.id,
          vehicleName: v.vehicleName,
          vehicleId: v.vehicleId
        }));
      },
      error: (error) => console.error('Failed to load vehicles:', error)
    });
  }

  loadTrip(): void {
    if (!this.tripId) return;
    
    this.isLoading = true;
    this.tripService.getTripById(this.tripId).subscribe({
      next: (trip) => {
        this.currentTrip = trip;
        this.populateForm(trip);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load trip:', error);
        this.toastService.error('فشل تحميل بيانات الرحلة');
        this.isLoading = false;
        this.router.navigate(['/user/my-trips']);
      }
    });
  }

  populateForm(trip: Trip): void {
    this.tripForm = {
      day: trip.day,
      month: trip.month,
      year: trip.year,
      driverId: trip.driverId || '',
      paramedicId: trip.paramedicId || '',
      vehicleId: trip.vehicleId || '',
      vehicleName: trip.vehicleName || '',
      transferFrom: trip.transferFrom,
      transferFromId: trip.transferFromId || '',
      transferFromTag: (trip.transferFromTag as 'common' | 'custom') || 'common',
      transferTo: trip.transferTo,
      transferToId: trip.transferToId || '',
      transferToTag: (trip.transferToTag as 'common' | 'custom') || 'common',
      start: trip.start,
      end: trip.end,
      diesel: trip.diesel,
      patientName: trip.patientName,
      patientContact: trip.patientContact || '',
      diagnosis: trip.diagnosis,
      transportationTypeId: trip.transportationTypeId || '',
      transportationTypeName: trip.transportationTypeName || '',
      transferStatus: trip.transferStatus,
      tripType: trip.tripType || null,
      otherExpenses: trip.otherExpenses,
      totalPrice: trip.totalPrice,
      payedPrice: trip.payedPrice,
      paramedicShare: trip.paramedicShare,
      driverShare: trip.driverShare,
      eqShare: trip.eqShare,
      ymdValue: trip.ymdValue || null,
      ymdPeriod: trip.ymdPeriod || ''
    };
  }

  onLocationFromSelected(selection: LocationSelection): void {
    this.tripForm.transferFrom = selection.name;
    this.tripForm.transferFromId = selection.id;
    this.tripForm.transferFromTag = selection.tag;
  }

  onLocationToSelected(selection: LocationSelection): void {
    this.tripForm.transferTo = selection.name;
    this.tripForm.transferToId = selection.id;
    this.tripForm.transferToTag = selection.tag;
  }

  onTransportationTypeSelected(selection: TransportationTypeSelection): void {
    this.tripForm.transportationTypeId = selection.id;
    this.tripForm.transportationTypeName = selection.name;
  }

  onVehicleChange(): void {
    const vehicle = this.vehicles.find(v => v.id === this.tripForm.vehicleId);
    if (vehicle) {
      this.tripForm.vehicleName = vehicle.vehicleName;
    }
  }

  // Calculate diesel automatically from odometer readings
  get calculatedDiesel(): number {
    const start = this.tripForm.start || 0;
    const end = this.tripForm.end || 0;
    return Math.max(0, end - start);
  }

  // Calculate shares based on payed price, paramedic share, and fuel cost
  // IMPORTANT: Must match backend logic (trips.php:927-932)
  private calculateShares(payedPrice: number, paramedicShare: number, fuelCost: number) {
    // Backend formula:
    // afterParamedic = payedPrice - paramedicShare
    // afterFuel = afterParamedic - fuelCost  (1 NIS per km)
    // driverShare = afterFuel / 3
    // eqShare = (afterFuel / 3) * 2
    const afterParamedic = payedPrice - paramedicShare;
    const afterFuel = afterParamedic - fuelCost;  // Deduct fuel BEFORE splitting
    const driverShare = afterFuel / 3;
    const eqShare = (afterFuel / 3) * 2;  // 2/3 of remaining
    return { paramedicShare, driverShare, eqShare };
  }

  // Calculate paramedic share based on trip type
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

  // Handle trip type change to auto-calculate paramedic share
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

  save(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isSaving = true;
    
    const tripData = this.prepareTripData();

    if (this.mode === 'create') {
      this.createTrip(tripData);
    } else if (this.mode === 'edit' && this.tripId) {
      this.updateTrip(tripData);
    }
  }

  createTrip(tripData: any): void {
    const vehicleId = this.tripForm.vehicleId;
    
    this.tripService.createVehicleTrip(vehicleId, tripData).subscribe({
      next: (response) => {
        this.toastService.success('تم إنشاء الرحلة بنجاح');
        this.isSaving = false;
        this.router.navigate(['/user/my-trips']);
      },
      error: (error) => {
        console.error('Failed to create trip:', error);
        this.toastService.error(error.message || 'فشل إنشاء الرحلة');
        this.isSaving = false;
      }
    });
  }

  updateTrip(tripData: any): void {
    if (!this.tripId) return;
    
    this.tripService.updateTrip(this.tripId, tripData).subscribe({
      next: (response) => {
        this.toastService.success('تم تحديث الرحلة بنجاح');
        this.isSaving = false;
        this.router.navigate(['/user/my-trips']);
      },
      error: (error) => {
        console.error('Failed to update trip:', error);
        this.toastService.error(error.message || 'فشل تحديث الرحلة');
        this.isSaving = false;
      }
    });
  }

  prepareTripData(): any {
    // Calculate shares automatically based on payedPrice, paramedicShare, and fuel cost
    const fuelCost = this.calculatedDiesel * 1.0;  // 1 NIS per km
    const shares = this.calculateShares(
      this.tripForm.payedPrice || 0,
      this.tripForm.paramedicShare || 0,
      fuelCost
    );

    return {
      day: this.tripForm.day,
      month: this.tripForm.month,
      year: this.tripForm.year,
      driverId: this.tripForm.driverId || null,
      paramedicId: this.tripForm.paramedicId || null,
      vehicleId: this.tripForm.vehicleId || null,
      transferFrom: this.tripForm.transferFrom,
      transferFromId: this.tripForm.transferFromId || null,
      transferFromTag: this.tripForm.transferFromTag,
      transferTo: this.tripForm.transferTo,
      transferToId: this.tripForm.transferToId || null,
      transferToTag: this.tripForm.transferToTag,
      start: this.tripForm.start || 0,
      end: this.tripForm.end || 0,
      diesel: this.calculatedDiesel,  // Use calculated diesel
      patientName: this.tripForm.patientName,
      patientContact: this.tripForm.patientContact || null,
      diagnosis: this.tripForm.diagnosis,
      transportationTypeId: this.tripForm.transportationTypeId || null,
      transferStatus: this.tripForm.transferStatus,
      tripType: this.tripForm.tripType || null,
      otherExpenses: this.tripForm.otherExpenses || 0,
      totalPrice: this.tripForm.totalPrice || 0,
      payedPrice: this.tripForm.payedPrice || 0,
      ...shares,  // Include calculated shares (paramedicShare, driverShare, eqShare)
      ymdValue: this.tripForm.ymdValue || null,
      ymdPeriod: this.tripForm.ymdPeriod || null
    };
  }

  validateForm(): boolean {
    // Basic validation
    if (!this.tripForm.vehicleId) {
      this.toastService.error('يرجى تحديد المركبة');
      return false;
    }
    
    if (!this.tripForm.patientName) {
      this.toastService.error('يرجى إدخال اسم المريض');
      return false;
    }

    return true;
  }

  openCloseConfirmModal(): void {
    this.showCloseConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showCloseConfirmModal = false;
  }

  confirmCloseTrip(): void {
    if (!this.tripId) return;
    
    this.tripService.closeTrip(this.tripId).subscribe({
      next: () => {
        this.toastService.success('تم إغلاق الرحلة بنجاح');
        this.closeConfirmModal();
        this.router.navigate(['/user/my-trips']);
      },
      error: (error) => {
        console.error('Failed to close trip:', error);
        this.toastService.error(error.message || 'فشل إغلاق الرحلة');
        this.closeConfirmModal();
      }
    });
  }

  canCloseTrip(): boolean {
    if (!this.currentTrip || this.mode !== 'edit') return false;
    const finalStatuses = ['تم النقل', 'رفض النقل', 'بلاغ كاذب'];
    return finalStatuses.includes(this.currentTrip.transferStatus) && !this.currentTrip.isClosed;
  }

  cancel(): void {
    this.router.navigate(['/user/my-trips']);
  }

  get isViewMode(): boolean {
    return this.mode === 'view';
  }

  get isEditMode(): boolean {
    return this.mode === 'edit';
  }

  get isCreateMode(): boolean {
    return this.mode === 'create';
  }

  get pageTitle(): string {
    if (this.isCreateMode) return 'إنشاء رحلة جديدة';
    if (this.isEditMode) return 'تعديل الرحلة';
    return 'عرض تفاصيل الرحلة';
  }
}

