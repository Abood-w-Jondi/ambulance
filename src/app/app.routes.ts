
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { DriversListComponent } from './admin/drivers-list/drivers-list.component';
import { ParamedicsListComponent } from './admin/paramedics-list/paramedics-list.component';
import { TripsComponent } from './admin/trips/trips.component';
import { StatsComponent } from './admin/stats/stats.component';
import { FleetComponent } from './admin/fleet/fleet.component';
import { MaintenanceHistoryComponent } from './admin/maintenance-history/maintenance-history.component';
import { FuelHistoryComponent } from './admin/fuel-history/fuel-history.component';
import { LoginComponent } from './admin/login/login.component';
import { StatusUpdateComponent } from './user/status-update/status-update.component';
import { AcceptTripsComponent } from './user/accept-trips/accept-trips.component';
import { TripsHistoryComponent } from './user/trips-history/trips-history.component';
import { WalletComponent } from './user/wallet/wallet.component';
import { DriverDashboardComponent } from './user/driver-dashboard/driver-dashboard.component';
import { MaintenanceTypesComponent } from './admin/settings/maintenance-types/maintenance-types.component';
import { TransportationTypesComponent } from './admin/settings/transportation-types/transportation-types.component';
import { CommonLocationsComponent } from './admin/settings/common-locations/common-locations.component';
import { UsersManagementComponent } from './admin/settings/users-management/users-management.component';
import { ProfileComponent } from './admin/settings/profile/profile.component';
import { adminGuard, driverGuard, guestGuard } from './shared/guards/auth.guard';

export const routes = [
	// Default redirect to login
	{ path: '', redirectTo: 'login', pathMatch: 'full' as const },

	// Login route (guest only - authenticated users will be redirected)
	{
		path: 'login',
		component: LoginComponent,
		canActivate: [guestGuard]
	},

	// Admin routes (admin only)
	{
		path: 'admin',
		canActivate: [adminGuard],
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
			{ path: 'transportation-types', component: TransportationTypesComponent },
			{ path: 'maintenance-types', component: MaintenanceTypesComponent },
			{ path: 'common-locations', component: CommonLocationsComponent },
			{ path: 'users-management', component: UsersManagementComponent },
			{ path: 'profile', component: ProfileComponent },
		],
	},

	// User/Driver routes (drivers and paramedics only)
	{
		path: 'user',
		canActivate: [driverGuard],
		children: [
			{ path: '', redirectTo: 'driver-dashboard', pathMatch: 'full' as const },
			{ path: 'driver-dashboard', component: DriverDashboardComponent },
			{ path: 'status-update', component: StatusUpdateComponent },
			{ path: 'accept-trips', component: AcceptTripsComponent },
			{ path: 'trips-history', component: TripsHistoryComponent },
			{ path: 'wallet', component: WalletComponent },
			{ path: 'profile', component: ProfileComponent },
		],
	},

	// Wildcard route - redirect to login for any unknown paths
	{ path: '**', redirectTo: 'login' }
];
