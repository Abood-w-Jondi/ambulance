# Ambulance Management System

A comprehensive ambulance fleet management system built with Angular 19 and PHP backend. This system manages ambulance operations, drivers, paramedics, trips, and vehicle tracking with a vehicle-specific device configuration.

## Key Features

### Vehicle-Specific Configuration
- **First-Time Setup**: On first launch, users must select a vehicle from the fleet
- **Admin Bypass**: Admins can skip vehicle selection to access admin panel without vehicle binding
- **Persistent Assignment**: Selected vehicle is stored in a persistent cookie (no expiry)
- **Device Binding**: Each device instance is permanently bound to a specific vehicle (for non-admin users)
- **Multi-Driver Support**: Multiple drivers can use the same vehicle without reassignment
- **Conditional UI**: Bottom navigation bar only appears when a vehicle is selected

### Fleet Management
- Vehicle tracking and status monitoring (Available, In Service, Maintenance)
- Real-time vehicle status updates
- Vehicle search and filtering capabilities
- Comprehensive vehicle information management

### User Management
- Role-based access control (Admin, Driver, Paramedic)
- JWT-based authentication with token refresh
- User activity tracking and status management

### Trip Management
- Trip creation and assignment
- Real-time trip status tracking
- Trip history and reporting
- Financial tracking (driver share, paramedic share, equipment share)

### Maintenance & Fuel Tracking
- Maintenance history logging
- Fuel consumption tracking
- Maintenance type management
- Service scheduling

### Settings & Configuration
- Dynamic transportation types
- Maintenance types management
- Common locations configuration
- User management interface

## System Architecture

### Frontend
- **Framework**: Angular 19 (Standalone Components)
- **State Management**: Angular Signals & RxJS
- **Styling**: Bootstrap 5 with custom CSS
- **Change Detection**: OnPush strategy for optimal performance

### Backend
- **Language**: PHP
- **Database**: MySQL
- **Authentication**: JWT tokens
- **API**: RESTful architecture

## Installation & Setup

### Prerequisites
- Node.js (v20 or higher)
- Angular CLI (v19.2.9)
- PHP (v7.4 or higher)
- MySQL Server
- Composer (for PHP dependencies)

### Frontend Setup

1. Navigate to the ambulance directory:
```bash
cd ambulance
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
ng serve
```

4. Access the application at `http://localhost:4200/`

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Configure database connection in `config/database.php`

3. Import the database schema from `database/schema.sql`

4. Start the PHP server:
```bash
php -S localhost:8000
```

### Quick Start (Windows)

Run the included batch file:
```bash
START_EVERYTHING.bat
```

This will start both frontend and backend servers automatically.

## Application Flow

### Initial Setup

**For Regular Users (Drivers/Paramedics):**
1. **Vehicle Selection**: First-time users are directed to vehicle selection page
2. **Vehicle Cookie**: Selected vehicle ID is stored in a persistent cookie
3. **Login**: After vehicle selection, users can log in with their credentials
4. **Dashboard**: Users are directed to driver dashboard with bottom navigation bar

**For Admins:**
1. **Vehicle Selection**: Admins see a "Skip (Admin Mode)" button on vehicle selection page
2. **Admin Bypass**: Admins can skip vehicle selection entirely
3. **Login**: Admins can proceed directly to login without selecting a vehicle
4. **Dashboard**: Admins access admin dashboard with sidebar navigation

### Vehicle Selection Guard
- Non-admin routes are protected by vehicle selection guard
- Users without selected vehicle are redirected to vehicle selection page
- Admins can bypass vehicle selection and access admin panel
- Vehicle selection page can be re-accessed by admins at any time

### Bottom Navigation Bar
- Only visible on user/driver routes (`/user/*`)
- Only shown when a vehicle has been selected
- Hidden when no vehicle is selected or on admin routes
- Provides quick access to: Dashboard, Status, Trips, Profile

### Authentication Flow
1. User logs in with username/password
2. Server validates credentials and returns JWT tokens
3. Access token included in all subsequent API requests
4. Refresh token used to obtain new access token when expired
5. Role-based routing (Admin → Admin Dashboard, Driver/Paramedic → Driver Dashboard)

## Project Structure

```
ambulance/
├── src/
│   ├── app/
│   │   ├── admin/              # Admin-only components
│   │   │   ├── admin-dashboard/
│   │   │   ├── drivers-list/
│   │   │   ├── paramedics-list/
│   │   │   ├── fleet/          # Vehicle management (no driver assignment)
│   │   │   ├── trips/
│   │   │   ├── stats/
│   │   │   ├── maintenance-history/
│   │   │   ├── fuel-history/
│   │   │   ├── settings/
│   │   │   └── login/
│   │   ├── user/               # Driver/Paramedic components
│   │   │   ├── driver-dashboard/
│   │   │   ├── status-update/
│   │   │   ├── accept-trips/
│   │   │   ├── trips-history/
│   │   │   └── wallet/
│   │   ├── shared/             # Shared components & services
│   │   │   ├── vehicle-selection/  # Vehicle selection component
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── vehicle.service.ts
│   │   │   │   ├── vehicle-cookie.service.ts  # Cookie management
│   │   │   │   └── ...
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── vehicle-selection.guard.ts  # Vehicle selection guard
│   │   │   ├── models/
│   │   │   └── components/
│   │   └── app.routes.ts       # Route configuration
│   └── environments/
└── ...

backend/
├── api/                        # API endpoints
│   ├── auth.php
│   ├── vehicles.php
│   ├── drivers.php
│   ├── trips.php
│   └── ...
├── config/                     # Configuration files
├── database/                   # Database schema
├── middleware/                 # Authentication middleware
└── utils/                      # Utility functions
```

## Key Changes from Standard Setup

### Vehicle Management
- **No Driver Assignment**: Removed driver assignment from fleet management
- **No Vehicle Types**: Removed vehicle type selection (types still stored in database)
- **Device-Vehicle Binding**: Each device is permanently associated with one vehicle (except for admins)

### Admin Privileges
- **Bypass Vehicle Selection**: Admins can skip vehicle selection and access admin panel
- **No Vehicle Requirement**: Admin panel accessible without vehicle binding
- **Full Access**: Admins can manage all vehicles, drivers, and operations
- **Optional Vehicle Selection**: Admins can still select a vehicle if needed

### Cookie-Based Vehicle Storage
- Vehicle ID stored in persistent cookie (`selected_vehicle_id`)
- Cookie has 100-year expiry (effectively permanent)
- No server-side session management required
- Works across browser restarts
- Not required for admin users

### Route Protection
- User routes protected by `vehicleSelectionGuard` (requires vehicle selection)
- Admin routes allow bypass of vehicle selection guard
- Vehicle selection page accessible by admins at any time via `vehicleSelectionPageGuard`
- Authentication guards work in conjunction with vehicle selection guards

### Conditional UI Elements
- **Bottom Navigation Bar**: Only shown on user routes when vehicle is selected
- **Sidebar Navigation**: Only shown on admin routes
- **Dynamic Layout**: UI adapts based on user role and vehicle selection status

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token

### Vehicles
- `GET /api/vehicles` - List all vehicles
- `GET /api/vehicles/{id}` - Get vehicle details
- `POST /api/vehicles` - Create new vehicle (admin)
- `PUT /api/vehicles/{id}` - Update vehicle (admin)
- `DELETE /api/vehicles/{id}` - Delete vehicle (admin)

### Drivers & Paramedics
- `GET /api/drivers` - List all drivers
- `GET /api/paramedics` - List all paramedics
- Admin-only endpoints for CRUD operations

### Trips
- `GET /api/trips` - List trips (with filters)
- `POST /api/trips` - Create new trip
- `PUT /api/trips/{id}` - Update trip status

## Building for Production

To build the project for production:

```bash
ng build --configuration production
```

Build artifacts will be stored in the `dist/` directory, optimized for performance and speed.

## Testing

### Unit Tests
```bash
ng test
```

### End-to-End Tests
```bash
ng e2e
```

Note: E2E testing framework needs to be configured separately.

## Configuration

### Environment Variables
Configure API endpoints in `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000'
};
```

### Database Configuration
Configure database settings in `backend/config/database.php`:
```php
return [
    'host' => 'localhost',
    'dbname' => 'ambulance_system',
    'username' => 'root',
    'password' => ''
];
```

## Security Features

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Protected API endpoints with middleware
- HTTP-only cookie support (can be enabled)
- CORS configuration for API security

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Edge (latest)
- Safari (latest)

## Additional Resources

- [Angular CLI Documentation](https://angular.dev/tools/cli)
- [Angular Signals Guide](https://angular.dev/guide/signals)
- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.0/)

## License

This project is proprietary software for ambulance fleet management.

## Support

For issues and feature requests, please contact the development team.
