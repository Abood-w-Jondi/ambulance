
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { DriversListComponent } from './admin/drivers-list/drivers-list.component';
import { ParamedicsListComponent } from './admin/paramedics-list/paramedics-list.component';
import { TripsComponent } from './admin/trips/trips.component';
import { StatsComponent } from './admin/stats/stats.component';
import { FleetComponent } from './admin/fleet/fleet.component';
import { MaintenanceHistoryComponent } from './admin/maintenance-history/maintenance-history.component';
import { FuelHistoryComponent } from './admin/fuel-history/fuel-history.component';
import { TransactionHistoryComponent } from './admin/transaction-history/transaction-history.component';
import { LoginComponent } from './admin/login/login.component';
import { VehicleMapComponent } from './admin/vehicle-map/vehicle-map.component';
import { AuditLogsComponent } from './admin/audit-logs/audit-logs.component';
import { VehicleChecklistsComponent } from './admin/vehicle-checklists/vehicle-checklists.component';
import { StatusUpdateComponent } from './user/status-update/status-update.component';
import { AcceptTripsComponent } from './user/accept-trips/accept-trips.component';
import { TripsHistoryComponent } from './user/trips-history/trips-history.component';
import { WalletComponent } from './user/wallet/wallet.component';
import { DriverDashboardComponent } from './user/driver-dashboard/driver-dashboard.component';
import { MyTripsComponent } from './user/my-trips/my-trips.component';
import { TripFormComponent } from './user/trip-form/trip-form.component';
import { LoanCollectionComponent } from './user/loan-collection/loan-collection.component';
import { VehicleChecklistComponent } from './user/vehicle-checklist/vehicle-checklist.component';
import { MedicalFormComponent } from './user/medical-form/medical-form.component';
import { MedicalFormsComponent } from './admin/medical-forms/medical-forms.component';
import { MaintenanceTypesComponent } from './admin/settings/maintenance-types/maintenance-types.component';
import { TransportationTypesComponent } from './admin/settings/transportation-types/transportation-types.component';
import { CommonLocationsComponent } from './admin/settings/common-locations/common-locations.component';
import { UsersManagementComponent } from './admin/settings/users-management/users-management.component';
import { ProfileComponent } from './admin/settings/profile/profile.component';
import { VehicleSelectionComponent } from './shared/vehicle-selection/vehicle-selection.component';
import { adminGuard, driverGuard, guestGuard } from './shared/guards/auth.guard';
import { vehicleSelectionGuard, vehicleSelectionPageGuard } from './shared/guards/vehicle-selection.guard';

export const routes = [
	// Default redirect to vehicle selection
	{ path: '', redirectTo: 'select-vehicle', pathMatch: 'full' as const },

	// Vehicle Selection route (first-time setup)
	{
		path: 'select-vehicle',
		component: VehicleSelectionComponent,
		canActivate: [vehicleSelectionPageGuard]
	},

	// Login route (guest only - authenticated users will be redirected)
	{
		path: 'login',
		component: LoginComponent,
		canActivate: [guestGuard, vehicleSelectionGuard]
	},

	// Admin routes (admin only)
	{
		path: 'admin',
		canActivate: [adminGuard, vehicleSelectionGuard],
		children: [
			{ path: '', redirectTo: 'admin-dashboard', pathMatch: 'full' as const },
			{ path: 'admin-dashboard', component: AdminDashboardComponent },
			{ path: 'drivers-list', component: DriversListComponent },
			{ path: 'paramedics-list', component: ParamedicsListComponent },
			{ path: 'trips', component: TripsComponent },
			{ path: 'stats', component: StatsComponent },
			{ path: 'vehicles', component: FleetComponent },
			{ path: 'maintenance-history', component: MaintenanceHistoryComponent },
			{ path: 'fuel-history', component: FuelHistoryComponent },
			{ path: 'transactions/:id', component: TransactionHistoryComponent },
			{ path: 'transportation-types', component: TransportationTypesComponent },
			{ path: 'maintenance-types', component: MaintenanceTypesComponent },
			{ path: 'common-locations', component: CommonLocationsComponent },
			{ path: 'users-management', component: UsersManagementComponent },
			{ path: 'vehicle-map', component: VehicleMapComponent },
			{ path: 'audit-logs', component: AuditLogsComponent },
			{ path: 'vehicle-checklists', component: VehicleChecklistsComponent },
			{ path: 'medical-forms', component: MedicalFormsComponent },
			{ path: 'profile/:id', component: ProfileComponent },
			{ path: 'profile', component: ProfileComponent },
		],
	},

	// User/Driver routes (drivers and paramedics only)
	{
		path: 'user',
		canActivate: [driverGuard, vehicleSelectionGuard],
		children: [
			{ path: '', redirectTo: 'driver-dashboard', pathMatch: 'full' as const },
			{ path: 'driver-dashboard', component: DriverDashboardComponent },
			{ path: 'status-update', component: StatusUpdateComponent },
			{ path: 'trips-history', component: TripsHistoryComponent },
			{ path: 'my-trips', component: MyTripsComponent },
			{ path: 'trip-form', component: TripFormComponent },
			{ path: 'trip-form/:id', component: TripFormComponent },
			{ path: 'wallet', component: WalletComponent },
			{ path: 'loan-collection', component: LoanCollectionComponent },
			{ path: 'vehicle-checklist', component: VehicleChecklistComponent },
			{ path: 'medical-form/:tripId', component: MedicalFormComponent },
			{ path: 'profile', component: ProfileComponent },
		],
	},

	// Wildcard route - redirect to vehicle selection for any unknown paths
	{ path: '**', redirectTo: 'select-vehicle' }
];
