# 🗺️ COMPONENT-TO-API MAPPING - Ambulance Management System

**Purpose:** Complete mapping of frontend components to required backend APIs
**Last Updated:** 2025-11-14

---

## 📋 TABLE OF CONTENTS

1. [Admin Components](#admin-components)
2. [User/Driver Components](#userdriver-components)
3. [Shared Components](#shared-components)
4. [Component Data Flow](#component-data-flow)

---

## ADMIN COMPONENTS

### 1. Login Component
**File:** `src/app/admin/login/login.component.ts`

**APIs Required:**
```
POST   /api/auth/login
```

**Data Flow:**
```
User Input (email/password)
    ↓
POST /api/auth/login
    ↓
Receive: { user, accessToken, refreshToken, expiresIn }
    ↓
Store token in localStorage
    ↓
Redirect to dashboard based on role
```

**Implementation Notes:**
- Uses `AuthService.login()`
- Stores token via `AuthService`
- Redirects admin → `/admin/admin-dashboard`
- Redirects driver/paramedic → `/user/driver-dashboard`

---

### 2. Admin Dashboard Component
**File:** `src/app/admin/admin-dashboard/admin-dashboard.component.ts`

**APIs Required:**
```
GET    /api/dashboard/admin
```

**Data Displayed:**
- Total drivers (active/inactive count)
- Total paramedics (active/inactive count)
- Total vehicles (available/in-service/maintenance)
- Pending trips count
- Today's trips count
- Today's revenue
- Recent trips (last 5)
- System alerts

**Implementation:**
```typescript
ngOnInit() {
  this.loadDashboardStats();
}

loadDashboardStats() {
  this.http.get('/api/dashboard/admin').subscribe(data => {
    this.stats = data;
  });
}
```

---

### 3. Drivers List Component
**File:** `src/app/admin/drivers-list/drivers-list.component.ts`

**APIs Required:**
```
GET    /api/drivers?page=1&limit=10&search=&status=&minOwed=&maxOwed=
POST   /api/drivers
PUT    /api/drivers/:id
DELETE /api/drivers/:id
PATCH  /api/drivers/:id/reduce-balance
PATCH  /api/drivers/:id/clear-balance
PATCH  /api/drivers/:id/activate
PATCH  /api/drivers/:id/deactivate
```

**Operations:**

#### Load Drivers
```typescript
loadDrivers() {
  const params = {
    page: this.currentPage,
    limit: this.itemsPerPage,
    search: this.searchTerm(),
    status: this.filterStatus(),
    minOwed: this.minOwed(),
    maxOwed: this.maxOwed()
  };

  this.driverService.getDrivers(params).subscribe(response => {
    this.drivers.set(response.data);
    this.totalPages = response.totalPages;
  });
}
```

#### Add New Driver
```typescript
addDriver() {
  this.driverService.createDriver(this.newDriver).subscribe({
    next: (driver) => {
      this.toastService.success('تم إضافة السائق بنجاح');
      this.loadDrivers(); // Refresh list
    },
    error: (error) => {
      this.toastService.error(error.message);
    }
  });
}
```

#### Edit Driver
```typescript
saveEditDriver() {
  this.driverService.updateDriver(this.driverToEdit().id, this.editDriver)
    .subscribe({
      next: (driver) => {
        this.toastService.success('تم تحديث بيانات السائق');
        this.loadDrivers();
      },
      error: (error) => {
        this.toastService.error(error.message);
      }
    });
}
```

#### Delete Driver
```typescript
confirmDeleteDriver() {
  this.driverService.deleteDriver(this.driverToDelete().id)
    .subscribe({
      next: () => {
        this.toastService.success('تم حذف السائق');
        this.loadDrivers();
      }
    });
}
```

#### Reduce Balance
```typescript
reduceBalance(driver: Driver, amount: number) {
  this.driverService.reduceBalance(driver.id, amount)
    .subscribe({
      next: (updatedDriver) => {
        this.toastService.info(`تم خصم ₪${amount} من رصيد السائق`);
        this.loadDrivers();
      }
    });
}
```

---

### 4. Paramedics List Component
**File:** `src/app/admin/paramedics-list/paramedics-list.component.ts`

**APIs Required:**
```
GET    /api/paramedics?page=1&limit=10&search=&status=
POST   /api/paramedics
PUT    /api/paramedics/:id
DELETE /api/paramedics/:id
PATCH  /api/paramedics/:id/reduce-balance
PATCH  /api/paramedics/:id/clear-balance
```

**Implementation:** Same pattern as Drivers List (create ParamedicService)

---

### 5. Fleet/Vehicles Component
**File:** `src/app/admin/fleet/fleet.component.ts`

**APIs Required:**
```
GET    /api/vehicles?page=1&limit=10&search=&status=
GET    /api/drivers/references  (for assignment dropdown)
POST   /api/vehicles
PUT    /api/vehicles/:id
DELETE /api/vehicles/:id
PATCH  /api/vehicles/:id/assign-driver
PATCH  /api/vehicles/:id/unassign-driver
```

**Operations:**

#### Load Vehicles with Filters
```typescript
loadVehicles() {
  const params = {
    page: this.currentPage,
    limit: this.itemsPerPage,
    search: this.searchTerm(),
    status: this.filterStatus()
  };

  this.vehicleService.getVehicles(params).subscribe(response => {
    this.vehicles.set(response.data);
  });
}
```

#### Assign Driver to Vehicle
```typescript
assignDriver(vehicleId: string, driverId: string) {
  this.vehicleService.assignDriver(vehicleId, driverId)
    .subscribe({
      next: (vehicle) => {
        this.toastService.success('تم تعيين السائق للمركبة');
        this.loadVehicles();
      }
    });
}
```

---

### 6. Trips Component
**File:** `src/app/admin/trips/trips.component.ts`

**APIs Required:**
```
GET    /api/trips?page=1&limit=10&status=&driverId=&paramedicId=&patientName=&startDate=&endDate=
GET    /api/drivers/references  (for dropdown)
GET    /api/paramedics/references  (for dropdown)
GET    /api/vehicles/references  (for dropdown)
POST   /api/trips
PUT    /api/trips/:id
DELETE /api/trips/:id
```

**Complex Filtering:**
```typescript
loadTrips() {
  const params = {
    page: this.currentPage,
    limit: this.itemsPerPage,
    status: this.filterStatus(),
    driverId: this.driverFilter(),
    paramedicId: this.paramedicFilter(),
    patientName: this.patientFilter(),
    transferFrom: this.locationFromFilter(),
    transferTo: this.locationToFilter(),
    startDate: this.buildStartDate(),
    endDate: this.buildEndDate()
  };

  this.tripService.getTrips(params).subscribe(response => {
    this.trips.set(response.data);
  });
}
```

**Create Trip:**
```typescript
addTrip() {
  // Note: Backend calculates driver_share and equipment_share
  const tripData = {
    ...this.tripForm,
    // Backend will calculate:
    // driverShare = (totalAmount - paramedicShare) / 3
    // equipmentShare = totalAmount - paramedicShare - driverShare
  };

  this.tripService.createTrip(tripData).subscribe({
    next: (trip) => {
      this.toastService.success('تمت إضافة الرحلة بنجاح');
      this.loadTrips();
    }
  });
}
```

---

### 7. Fuel History Component
**File:** `src/app/admin/fuel-history/fuel-history.component.ts`

**APIs Required:**
```
GET    /api/fuel-records?page=1&limit=10&vehicleId=&driverId=&search=&startDate=&endDate=
GET    /api/vehicles/references  (for filter dropdown)
POST   /api/fuel-records
PUT    /api/fuel-records/:id
DELETE /api/fuel-records/:id
```

**Date Filtering:**
```typescript
loadFuelRecords() {
  const params = {
    page: this.currentPage,
    limit: this.itemsPerPage,
    vehicleId: this.selectedVehicleId(),
    search: this.searchTerm(),
    startDate: this.buildDate(this.startDay, this.startMonth, this.startYear),
    endDate: this.buildDate(this.endDay, this.endMonth, this.endYear)
  };

  this.http.get('/api/fuel-records', { params }).subscribe(response => {
    this.records.set(response.data);
  });
}
```

**Navigate to Fleet (with query params):**
```typescript
navigateToFleet(vehicleId: string) {
  this.router.navigate(['/admin/vehicles'], {
    queryParams: { filterType: 'vehicle', filterValue: vehicleId }
  });
}
```

---

### 8. Maintenance History Component
**File:** `src/app/admin/maintenance-history/maintenance-history.component.ts`

**APIs Required:**
```
GET    /api/maintenance-records?page=1&limit=10&vehicleId=&type=&status=&startDate=&endDate=
GET    /api/maintenance-types  (for type dropdown)
GET    /api/vehicles/references  (for filter dropdown)
POST   /api/maintenance-records
PUT    /api/maintenance-records/:id
DELETE /api/maintenance-records/:id
```

**Load Maintenance Types:**
```typescript
loadMaintenanceTypes() {
  this.http.get('/api/maintenance-types').subscribe(types => {
    this.maintenanceTypes = types;
  });
}
```

---

### 9. Stats Component
**File:** `src/app/admin/stats/stats.component.ts`

**APIs Required:**
```
GET    /api/trips/stats?period=week|month|custom&startDate=&endDate=
```

**Load Statistics:**
```typescript
loadStats() {
  const params = {
    period: this.selectedPeriod,
    startDate: this.customStartDate,
    endDate: this.customEndDate
  };

  this.tripService.getTripStats(params).subscribe(stats => {
    this.totalTrips = stats.totalTrips;
    this.totalRevenue = stats.totalRevenue;
    this.totalCosts = stats.totalCosts;
    this.netProfit = stats.netProfit;

    // For charts
    this.tripsByDay = stats.tripsByDay;
    this.costBreakdown = stats.costBreakdown;
  });
}
```

---

### 10. Users Management Component
**File:** `src/app/admin/settings/users-management/users-management.component.ts`

**APIs Required:**
```
GET    /api/users?page=1&limit=10&role=all|admin|driver|paramedic
POST   /api/users
DELETE /api/users/:id
```

**Filter by Role:**
```typescript
loadUsers() {
  const params = {
    role: this.filterRole()
  };

  this.http.get('/api/users', { params }).subscribe(response => {
    this.users.set(response.data);
  });
}
```

**Create User:**
```typescript
addNewUser() {
  this.http.post('/api/users', this.newUser).subscribe({
    next: (user) => {
      this.toastService.success('تم إضافة المستخدم بنجاح');
      this.loadUsers();
    },
    error: (error) => {
      this.toastService.error(error.message);
    }
  });
}
```

---

### 11. Settings Components

#### Maintenance Types
**File:** `src/app/admin/settings/maintenance-types/maintenance-types.component.ts`

**APIs Required:**
```
GET    /api/settings/maintenance-types
POST   /api/settings/maintenance-types
PUT    /api/settings/maintenance-types/:id
DELETE /api/settings/maintenance-types/:id
PATCH  /api/settings/maintenance-types/:id/toggle
```

#### Transportation Types
**File:** `src/app/admin/settings/transportation-types/transportation-types.component.ts`

**APIs Required:**
```
GET    /api/settings/transportation-types
POST   /api/settings/transportation-types
PUT    /api/settings/transportation-types/:id
DELETE /api/settings/transportation-types/:id
```

#### Common Locations
**File:** `src/app/admin/settings/common-locations/common-locations.component.ts`

**APIs Required:**
```
GET    /api/settings/common-locations?type=all|hospital|clinic|emergency
POST   /api/settings/common-locations
PUT    /api/settings/common-locations/:id
DELETE /api/settings/common-locations/:id
```

---

## USER/DRIVER COMPONENTS

### 12. Driver Dashboard Component
**File:** `src/app/user/driver-dashboard/driver-dashboard.component.ts`

**APIs Required:**
```
GET    /api/auth/me  (get current driver info)
GET    /api/dashboard/driver/:driverId
```

**Load Dashboard:**
```typescript
ngOnInit() {
  this.authService.currentUser$.subscribe(user => {
    if (user && user.role === 'driver') {
      this.loadDriverDashboard(user.id);
    }
  });
}

loadDriverDashboard(driverId: string) {
  this.http.get(`/api/dashboard/driver/${driverId}`).subscribe(data => {
    this.stats = data;
    this.tripsToday = data.today.tripsCompleted;
    this.earningsToday = data.today.totalEarnings;
    this.currentBalance = data.wallet.currentBalance;
  });
}
```

---

### 13. Accept Trips Component
**File:** `src/app/user/accept-trips/accept-trips.component.ts`

**APIs Required:**
```
GET    /api/pending-trips?status=معلق  (auto-refresh every 30s)
GET    /api/pending-trips?driverId={currentDriver}&status=مقبول
POST   /api/pending-trips/:id/accept
POST   /api/pending-trips/:id/reject
```

**Auto-Refresh Pending Trips:**
```typescript
startAutoRefresh() {
  interval(30000).subscribe(() => {
    this.loadPendingTrips();
  });
}

loadPendingTrips() {
  this.pendingTripService.getPendingTrips({ status: 'معلق' })
    .subscribe(response => {
      this.pendingTrips = response.data;
      // Play notification sound if new trips
      if (response.data.length > this.previousCount) {
        this.playNotificationSound();
      }
    });
}
```

**Accept Trip:**
```typescript
acceptTrip(trip: PendingTrip) {
  this.pendingTripService.acceptTrip(trip.id).subscribe({
    next: (response) => {
      this.toastService.success(response.message);
      this.loadPendingTrips();
      this.loadAcceptedTrips();
    },
    error: (error) => {
      this.toastService.error(error.message);
    }
  });
}
```

**Reject Trip:**
```typescript
rejectTrip(trip: PendingTrip) {
  this.pendingTripService.rejectTrip(trip.id, this.rejectionReason)
    .subscribe({
      next: (response) => {
        this.toastService.info(response.message);
        this.loadPendingTrips();
      }
    });
}
```

---

### 14. Trips History Component
**File:** `src/app/user/trips-history/trips-history.component.ts`

**APIs Required:**
```
GET    /api/trips?driverId={currentDriver}&month=&year=&status=&search=
```

**Load Driver's Trips:**
```typescript
loadTripsHistory() {
  this.authService.currentUser$.subscribe(user => {
    const params = {
      driverId: user.id,
      month: this.selectedMonth,
      year: this.selectedYear,
      status: this.selectedStatus,
      search: this.searchTerm,
      page: this.currentPage,
      limit: this.itemsPerPage
    };

    this.tripService.getTrips(params).subscribe(response => {
      this.trips = response.data;
      this.calculateStats(response.data);
    });
  });
}

calculateStats(trips: Trip[]) {
  this.totalTrips = trips.length;
  this.completedTrips = trips.filter(t => t.transferStatus === 'تم النقل').length;
  this.totalEarnings = trips.reduce((sum, t) => sum + t.driverShare, 0);
}
```

---

### 15. Wallet Component
**File:** `src/app/user/wallet/wallet.component.ts`

**APIs Required:**
```
GET    /api/payments/wallet-summary/:userId
GET    /api/payments?userId={currentUser}&month=&year=&paymentType=
POST   /api/payments/withdraw
```

**Load Wallet Summary:**
```typescript
loadWalletSummary() {
  this.authService.currentUser$.subscribe(user => {
    this.http.get(`/api/payments/wallet-summary/${user.id}`)
      .subscribe(summary => {
        this.walletSummary = summary;
      });
  });
}
```

**Load Payment History:**
```typescript
loadPayments() {
  const params = {
    userId: this.currentUser.id,
    month: this.selectedMonth,
    year: this.selectedYear,
    paymentType: this.selectedType,
    page: this.currentPage,
    limit: this.itemsPerPage
  };

  this.http.get('/api/payments', { params }).subscribe(response => {
    this.payments = response.data;
  });
}
```

**Request Withdrawal:**
```typescript
requestWithdrawal() {
  const withdrawalData = {
    amount: this.withdrawAmount,
    paymentMethod: this.withdrawMethod,
    bankAccountNumber: this.bankAccountNumber,
    bankName: this.bankName
  };

  this.http.post('/api/payments/withdraw', withdrawalData)
    .subscribe({
      next: (response) => {
        this.toastService.success('تم إرسال طلب السحب بنجاح');
        this.loadWalletSummary();
        this.loadPayments();
      },
      error: (error) => {
        this.toastService.error(error.message);
      }
    });
}
```

---

### 16. Add Fuel Modal Component
**File:** `src/app/user/add-fuel-modal/add-fuel-modal.component.ts`

**APIs Required:**
```
GET    /api/vehicles/references  (for dropdown)
POST   /api/fuel-records
```

**Submit Fuel Record:**
```typescript
submitFuelRecord() {
  this.authService.currentUser$.subscribe(user => {
    const fuelData = {
      vehicleId: this.selectedVehicleId,
      driverId: user.id,
      refuelDate: new Date(),
      odometerBefore: this.odometerBefore,
      odometerAfter: this.odometerAfter,
      fuelAmount: this.fuelAmount,
      cost: this.cost,
      notes: this.notes
    };

    this.http.post('/api/fuel-records', fuelData).subscribe({
      next: () => {
        this.toastService.success('تم تسجيل التعبئة بنجاح');
        this.closeModal();
      },
      error: (error) => {
        this.toastService.error(error.message);
      }
    });
  });
}
```

---

### 17. Add Maintenance Modal Component
**File:** `src/app/user/add-maintenance-modal/add-maintenance-modal.component.ts`

**APIs Required:**
```
GET    /api/vehicles/references
GET    /api/maintenance-types
POST   /api/maintenance-records
```

**Submit Maintenance Record:**
```typescript
submitMaintenanceRecord() {
  const maintenanceData = {
    vehicleId: this.selectedVehicleId,
    maintenanceDate: this.maintenanceDate,
    type: this.selectedType,
    cost: this.cost,
    serviceLocation: this.serviceLocation,
    odometerBefore: this.odometerBefore,
    odometerAfter: this.odometerAfter,
    notes: this.notes,
    status: 'مكتملة'
  };

  this.http.post('/api/maintenance-records', maintenanceData)
    .subscribe({
      next: () => {
        this.toastService.success('تم تسجيل الصيانة بنجاح');
        this.closeModal();
      }
    });
}
```

---

## SHARED COMPONENTS

### 18. Pagination Component
**File:** `src/app/shared/pagination/pagination.component.ts`

**Events Emitted:**
```typescript
@Output() pageChange = new EventEmitter<number>();
@Output() itemsPerPageChange = new EventEmitter<number>();
```

**Usage in Parent:**
```typescript
<app-pagination
  [totalItems]="filteredItems().length"
  [currentPage]="currentPage"
  [itemsPerPage]="itemsPerPage"
  (pageChange)="onPageChange($event)"
  (itemsPerPageChange)="onItemsPerPageChange($event)"
/>
```

---

## COMPONENT DATA FLOW

### Authentication Flow
```
┌─────────────────┐
│ Login Component │
└────────┬────────┘
         │ POST /api/auth/login
         ▼
┌─────────────────┐
│  Auth Service   │ ← Stores token, manages state
└────────┬────────┘
         │
         ├─────────────────────┬──────────────────────┐
         │                     │                      │
         ▼                     ▼                      ▼
┌──────────────┐    ┌──────────────────┐   ┌─────────────────┐
│ Admin Routes │    │ Driver Dashboard │   │   Auth Guard    │
│ (if admin)   │    │ (if driver)      │   │ (protects all)  │
└──────────────┘    └──────────────────┘   └─────────────────┘
```

### Driver Dashboard Flow
```
┌────────────────────┐
│ Driver Dashboard   │
└─────────┬──────────┘
          │ GET /api/dashboard/driver/:id
          ▼
┌────────────────────┐
│  Display Stats:    │
│  - Trips today     │
│  - Earnings        │
│  - Wallet balance  │
│  - Recent trips    │
└────────────────────┘
```

### Trip Management Flow (Admin)
```
┌─────────────────┐
│ Trips Component │
└────────┬────────┘
         │
         ├─── GET /api/trips?filters... → Display trip list
         │
         ├─── GET /api/drivers/references → Populate driver dropdown
         ├─── GET /api/paramedics/references → Populate paramedic dropdown
         ├─── GET /api/vehicles/references → Populate vehicle dropdown
         │
         ├─── POST /api/trips → Create new trip
         ├─── PUT /api/trips/:id → Update trip
         └─── DELETE /api/trips/:id → Delete trip
```

### Pending Trips Flow (Driver)
```
┌─────────────────────┐
│ Accept Trips Comp.  │
└──────────┬──────────┘
           │
           ├─── Auto-refresh every 30s
           │    GET /api/pending-trips?status=معلق
           │
           ├─── POST /api/pending-trips/:id/accept
           │    → Updates status to مقبول
           │    → Assigns driver
           │
           └─── POST /api/pending-trips/:id/reject
                → Updates status to مرفوض
                → Adds rejection reason
```

### Wallet Flow
```
┌────────────────┐
│ Wallet Comp.   │
└────────┬───────┘
         │
         ├─── GET /api/payments/wallet-summary/:userId
         │    → Current balance, pending, earnings, withdrawals
         │
         ├─── GET /api/payments?userId=&filters...
         │    → Payment history with pagination
         │
         └─── POST /api/payments/withdraw
              → Create withdrawal request (status: معلق)
              → Admin processes later
```

---

## API CALL PATTERNS

### Pattern 1: Load List with Pagination
```typescript
loadData() {
  const params = {
    page: this.currentPage,
    limit: this.itemsPerPage,
    ...this.getFilters()
  };

  this.service.getData(params).subscribe({
    next: (response) => {
      this.items.set(response.data);
      this.totalPages = response.totalPages;
    },
    error: (error) => {
      this.toastService.error(error.message);
    }
  });
}
```

### Pattern 2: Create with Form
```typescript
createItem() {
  const validation = this.validationService.validate(this.formData);

  if (!validation.valid) {
    validation.errors.forEach(error => {
      this.toastService.error(error);
    });
    return;
  }

  this.service.create(this.formData).subscribe({
    next: (item) => {
      this.toastService.success('تم الإضافة بنجاح');
      this.closeModal();
      this.loadData();
    },
    error: (error) => {
      this.toastService.error(error.message);
    }
  });
}
```

### Pattern 3: Update with Optimistic UI
```typescript
updateItem(id: string, changes: Partial<Item>) {
  // Optimistic update
  this.items.update(list =>
    list.map(item => item.id === id ? { ...item, ...changes } : item)
  );

  this.service.update(id, changes).subscribe({
    next: (updated) => {
      this.toastService.success('تم التحديث بنجاح');
    },
    error: (error) => {
      this.toastService.error(error.message);
      this.loadData(); // Revert on error
    }
  });
}
```

### Pattern 4: Delete with Confirmation
```typescript
showDeleteConfirmation(item: Item) {
  this.itemToDelete.set(item);
  this.confirmationModalConfig.set({
    type: 'delete',
    title: 'تأكيد الحذف',
    message: `هل أنت متأكد من حذف ${item.name}؟`,
    confirmButtonText: 'حذف',
    cancelButtonText: 'إلغاء'
  });
  this.isDeleteModalOpen.set(true);
}

confirmDelete() {
  const item = this.itemToDelete();

  this.service.delete(item.id).subscribe({
    next: () => {
      this.toastService.success('تم الحذف بنجاح');
      this.loadData();
      this.closeDeleteModal();
    },
    error: (error) => {
      this.toastService.error(error.message);
    }
  });
}
```

---

## SUMMARY

### Total Components: 18+
### Total API Endpoints Used: 160+
### Total Services Needed: 12+

**Services to Create:**
1. ✅ `AuthService` (created)
2. ✅ `DriverService` (created)
3. ✅ `TripService` (created)
4. ✅ `VehicleService` (created)
5. ✅ `PendingTripService` (created)
6. `ParamedicService` (to create)
7. `FuelRecordService` (to create)
8. `MaintenanceRecordService` (to create)
9. `PaymentService` (to create)
10. `UserService` (to create)
11. `SettingsService` (to create)
12. `DashboardService` (to create)

✅ **Complete Mapping Ready for Implementation!**
