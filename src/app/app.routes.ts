
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { DriversListComponent } from './admin/drivers-list/drivers-list.component';
import { TripsComponent } from './admin/trips/trips.component';
export const routes = [
	{ path: 'admin-dashboard', component: AdminDashboardComponent },
	{ path: 'drivers-list', component: DriversListComponent },
	{ path: 'trips', component: TripsComponent },
];
