
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { DriversListComponent } from './admin/drivers-list/drivers-list.component';
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

export const routes = [
	{
		path: 'admin',
		children: [
			{ path: 'admin-dashboard', component: AdminDashboardComponent },
			{ path: 'drivers-list', component: DriversListComponent },
			{ path: 'trips', component: TripsComponent },
			{ path: 'stats', component: StatsComponent },
			{ path: 'vehicles', component: FleetComponent },
			{ path: 'maintenance-history', component: MaintenanceHistoryComponent },
			{ path: 'fuel-history', component: FuelHistoryComponent },
			{ path: '**', component: AdminDashboardComponent },
		],
	},
	{
		path: 'user',
		children: [
			{ path: 'status-update', component: StatusUpdateComponent },
			{ path: 'accept-trips', component: AcceptTripsComponent },
			{ path: 'trips-history', component: TripsHistoryComponent },
			{ path: 'wallet', component: WalletComponent },
			{ path: 'driver-dashboard', component: DriverDashboardComponent },
		],
	},

	{ path: '**', component: LoginComponent },
];
