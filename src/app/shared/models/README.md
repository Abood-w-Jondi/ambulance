# Centralized Data Models

This directory contains all centralized data models for the ambulance management system. These models ensure consistency across the application and are ready for backend integration.

## Key Principles

### 1. Complete Data Structures
Every entity model contains **ALL** properties that are actually used in the codebase:

- ✅ **Properties exist** even if not displayed everywhere
- ✅ **Essential IDs added** for backend relationships (e.g., `driverId`, `vehicleId`)
- ✅ **No unused properties** - only what's actually used in components
- ❌ **Don't remove properties** that exist in the codebase

### 2. Display Logic vs Data Structure
The separation between data and display:

```typescript
// Complete data structure with all properties used in the app
interface Driver {
  id: string;
  name: string;
  arabicName: string;
  username?: string;
  email?: string;
  arabicStatus: DriverStatus;
  statusColor: string;
  tripsToday: number;
  amountOwed: number;
  isAccountCleared: boolean;
  isActive: boolean;
  imageUrl: string;
  imageAlt: string;
}
```

In your component template, you decide what to display:
```html
<!-- Only display what's needed in this view -->
<div>{{ driver.name }}</div>
<div>{{ driver.arabicStatus }}</div>
<!-- Other properties still exist in the data, just not displayed here -->
```

## Available Models

### 1. Driver Model
**File:** `driver.model.ts`

Complete driver information including authentication, status, work metrics, and financial data.

**Properties:**
- `id`, `name`, `arabicName` - Identification
- `username?`, `email?` - Authentication
- `arabicStatus`, `statusColor`, `isActive` - Status
- `tripsToday`, `amountOwed`, `isAccountCleared` - Work & Financial
- `imageUrl`, `imageAlt` - Profile media

**Key Types:**
- `Driver` - Full driver entity
- `DriverReference` - Simplified reference for dropdowns (id, name, arabicName?)
- `DriverStatus` - Status union type
- `DriverFilterStatus` - Filter options including 'all'

### 2. Vehicle Model
**File:** `vehicle.model.ts`

Complete vehicle information including specifications, assignment, and status.

**Properties:**
- `id`, `vehicleId`, `vehicleName` - Identification
- `type` - Vehicle type
- `currentDriver`, `currentDriverId?` - Assignment
- `status` - Current status
- `notes` - Administrative notes

**Key Types:**
- `Vehicle` - Full vehicle entity
- `VehicleReference` - Simplified reference for dropdowns
- `VehicleType` - Type of ambulance
- `VehicleStatus` - Status union type
- `VehicleFilterStatus` - Filter options including 'All'

### 3. Trip Model
**File:** `trip.model.ts`

Complete trip/transfer information including patient data, personnel, and financial breakdown.

**Properties:**
- `id` - Identification
- `day`, `month`, `year` - Gregorian date
- `driver`, `driverId?`, `paramedic`, `paramedicId?` - Personnel
- `transferFrom`, `transferTo` - Locations
- `start`, `end` - Odometer readings
- `diesel` - Fuel used
- `patientName`, `patientAge` - Patient info
- `diagnosis` - Medical reason
- `ymdDay`, `ymdMonth`, `ymdYear` - Hijri date
- `transferStatus` - Status
- `totalAmount`, `paramedicShare`, `driverShare`, `eqShare` - Financial
- `vehicleId?` - Vehicle reference for backend

**Key Types:**
- `Trip` - Full trip entity
- `TransferStatus` - Status union type
- `FilterStatus` - Filter options including 'All'

### 4. Fuel Record Model
**File:** `fuel-record.model.ts`

Complete fuel record with vehicle, driver, odometer readings, and fuel details.

**Properties:**
- `id` - Identification
- `ambulanceName`, `ambulanceNumber`, `ambulanceId?` - Vehicle info
- `driverId`, `driverName`, `driverInternalId?` - Driver info
- `date` - Date of refueling
- `odometerBefore`, `odometerAfter` - Odometer readings
- `fuelAmount`, `cost` - Fuel details
- `notes?` - Additional information

### 5. Maintenance Record Model
**File:** `maintenance-record.model.ts`

Complete maintenance record with service details and costs.

**Properties:**
- `id` - Identification
- `vehicleId`, `vehicleInternalId?` - Vehicle info
- `date` - Service date
- `type` - Maintenance type (string - dynamic from database)
- `cost` - Total cost
- `serviceLocation` - Service center
- `odometerBefore`, `odometerAfter` - Odometer readings
- `notes` - Documentation
- `status` - Current status

**Key Types:**
- `MaintenanceRecord` - Full maintenance entity
- `MaintenanceStatus` - Status union type

**Note:** Maintenance types are stored as `string` because they are dynamic and will come from the database (can be added, removed, or changed by admins).

### 6. Paramedic Model
**File:** `paramedic.model.ts`

Paramedic information for use in dropdowns and references.

**Properties:**
- `id`, `name`, `arabicName?` - Identification
- `status?`, `isActive?`, `tripsToday?` - Optional status info

**Key Types:**
- `Paramedic` - Full paramedic entity (minimal for now)
- `ParamedicReference` - Simplified reference for dropdowns

## Usage Examples

### Example 1: Trips Component - Driver Selection
```typescript
// In trips.component.ts
import { Trip, DriverReference } from '../../shared/models';

// Use simplified reference for dropdown
driversList: DriverReference[] = [];

// Use complete Trip model with backend IDs
trips = signal<Trip[]>([
  {
    id: '1',
    driver: 'إليانور بينا',      // Display name
    driverId: 'd1',               // Backend ID
    paramedic: 'ضابط أحمد',
    paramedicId: 'p1',            // Backend ID
    vehicleId: 'v1',              // Backend vehicle reference
    // ... all other trip properties
  }
]);
```

### Example 2: Fleet Component - Complete Vehicle Data
```typescript
// In fleet.component.ts
import { Vehicle } from '../../shared/models';

vehicles = signal<Vehicle[]>([
  {
    id: '1',
    vehicleId: 'AMB-012',
    vehicleName: 'إسعاف النجوم',
    type: 'Type II Van',
    currentDriver: 'Jane Smith',
    currentDriverId: 'd2',  // Backend ID for relationship
    notes: 'مركبة جديدة',
    status: 'متاحة'
  }
]);
```

### Example 3: Backend Integration Ready
```typescript
// When backend is ready, just map the response:
import { Driver } from '@shared/models';

this.http.get<Driver[]>('/api/drivers').subscribe(drivers => {
  // Response matches our Driver interface
  this.drivers.set(drivers);
});

// For trips with relationships:
this.http.post('/api/trips', {
  driverId: trip.driverId,      // Send ID to backend
  paramedicId: trip.paramedicId,
  vehicleId: trip.vehicleId,
  // ... other trip data
});
```

## Import Path

All models can be imported from the centralized index:

```typescript
import {
  Driver,
  DriverReference,
  Vehicle,
  Trip,
  FuelRecord,
  MaintenanceRecord,
  Paramedic
} from '../../shared/models';
```

## Benefits of This Approach

1. **Consistency:** All components use the same data structure
2. **Type Safety:** TypeScript ensures correct property usage
3. **Backend Ready:** Essential IDs included for relationships
4. **Maintainability:** Single source of truth for data models
5. **Lean:** Only properties actually used in the codebase
6. **Flexible:** Components choose what to display, not what exists

## Guidelines for Developers

### ✅ DO:
- Use complete models with all currently used properties
- Add essential IDs for backend relationships (like `driverId`, `vehicleId`)
- Import models from centralized location
- Document property purposes

### ❌ DON'T:
- Create duplicate interfaces in components
- Remove properties that exist in the codebase
- Add unused optional properties "just in case"
- Create inconsistent property names across components
