
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { DriversListComponent } from './admin/drivers-list/drivers-list.component';
import { TripsComponent } from './admin/trips/trips.component';
import { StatsComponent } from './admin/stats/stats.component';
import { FleetComponent } from './admin/fleet/fleet.component';
import { MaintenanceHistoryComponent } from './admin/maintenance-history/maintenance-history.component';
import { FuelHistoryComponent } from './admin/fuel-history/fuel-history.component';
import { LoginComponent } from './admin/login/login.component';

export const routes = [
	{ path: 'admin-dashboard', component: AdminDashboardComponent },
	{ path: 'drivers-list', component: DriversListComponent },
	{ path: 'trips', component: TripsComponent },
	{ path: 'stats', component: StatsComponent },
	{ path: 'vehicles', component: FleetComponent },
	{ path: 'maintenance-history', component: MaintenanceHistoryComponent },
	{ path: 'fuel-history', component: FuelHistoryComponent },
	{ path: '**', component: LoginComponent },
];
