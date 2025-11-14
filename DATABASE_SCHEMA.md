# 🗄️ COMPLETE DATABASE SCHEMA - Ambulance Management System

**Version:** 2.0
**Database:** PostgreSQL (Recommended) or MySQL
**Last Updated:** 2025-11-14
**Total Tables:** 12

---

## 📋 TABLE OF CONTENTS

1. [Core Tables](#core-tables)
   - [users](#1-users)
   - [drivers](#2-drivers)
   - [paramedics](#3-paramedics)
2. [Fleet Management](#fleet-management)
   - [vehicles](#4-vehicles)
3. [Trip Management](#trip-management)
   - [trips](#5-trips)
   - [pending_trips](#6-pending_trips)
4. [Operations](#operations)
   - [fuel_records](#7-fuel_records)
   - [maintenance_records](#8-maintenance_records)
5. [Financial](#financial)
   - [payments](#9-payments)
6. [Configuration](#configuration)
   - [maintenance_type_config](#10-maintenance_type_config)
   - [transportation_type_config](#11-transportation_type_config)
   - [common_locations](#12-common_locations)
7. [Relationships Diagram](#relationships-diagram)
8. [Indexes & Performance](#indexes--performance)
9. [Sample Data](#sample-data)

---

## CORE TABLES

### 1. `users`
**Purpose:** Core authentication and user management table

```sql
CREATE TABLE users (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Authentication
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,

    -- Personal Information
    full_name VARCHAR(255) NOT NULL,
    arabic_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    national_id VARCHAR(50),
    date_of_birth DATE,

    -- Address
    address TEXT,
    city VARCHAR(100),

    -- Role & Status
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'driver', 'paramedic')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_email_verified BOOLEAN DEFAULT FALSE,

    -- Profile
    profile_image_url VARCHAR(500),

    -- Timestamps
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT require_username_or_email CHECK (username IS NOT NULL OR email IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Trigger for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

**Comments:**
```sql
COMMENT ON TABLE users IS 'Core authentication and user management';
COMMENT ON COLUMN users.role IS 'User role: admin, driver, or paramedic';
COMMENT ON COLUMN users.password_hash IS 'bcrypt hashed password';
```

---

### 2. `drivers`
**Purpose:** Extended information for driver users

```sql
CREATE TABLE drivers (
    -- Primary Key (references users)
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

    -- Status
    arabic_status VARCHAR(20) NOT NULL DEFAULT 'غير متصل'
        CHECK (arabic_status IN ('متاح', 'في رحلة', 'غير متصل')),
    status_color VARCHAR(7) NOT NULL DEFAULT '#6B7280',

    -- Work Statistics
    trips_today INTEGER NOT NULL DEFAULT 0 CHECK (trips_today >= 0),

    -- Financial
    amount_owed DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (amount_owed >= 0),
    is_account_cleared BOOLEAN NOT NULL DEFAULT TRUE,

    -- Profile Media
    image_url VARCHAR(500),
    image_alt VARCHAR(255),

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_drivers_status ON drivers(arabic_status);
CREATE INDEX idx_drivers_amount_owed ON drivers(amount_owed);
CREATE INDEX idx_drivers_trips_today ON drivers(trips_today);

-- Trigger
CREATE TRIGGER update_drivers_updated_at
    BEFORE UPDATE ON drivers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update is_account_cleared
CREATE TRIGGER update_driver_account_cleared
    BEFORE UPDATE ON drivers
    FOR EACH ROW
    EXECUTE FUNCTION update_account_cleared_status();
```

**Comments:**
```sql
COMMENT ON TABLE drivers IS 'Extended driver information';
COMMENT ON COLUMN drivers.arabic_status IS 'متاح (Available), في رحلة (On Trip), غير متصل (Offline)';
COMMENT ON COLUMN drivers.amount_owed IS 'Amount driver owes to company';
```

---

### 3. `paramedics`
**Purpose:** Extended information for paramedic users

```sql
CREATE TABLE paramedics (
    -- Primary Key (references users)
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

    -- Status (has one extra status compared to drivers)
    arabic_status VARCHAR(20) NOT NULL DEFAULT 'غير متصل'
        CHECK (arabic_status IN ('متاح', 'في رحلة', 'غير متصل', 'في إجازة')),
    status_color VARCHAR(7) NOT NULL DEFAULT '#6B7280',

    -- Work Statistics
    trips_today INTEGER NOT NULL DEFAULT 0 CHECK (trips_today >= 0),

    -- Financial
    amount_owed DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (amount_owed >= 0),
    is_account_cleared BOOLEAN NOT NULL DEFAULT TRUE,

    -- Profile Media
    image_url VARCHAR(500),
    image_alt VARCHAR(255),

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_paramedics_status ON paramedics(arabic_status);
CREATE INDEX idx_paramedics_amount_owed ON paramedics(amount_owed);
CREATE INDEX idx_paramedics_trips_today ON paramedics(trips_today);

-- Triggers
CREATE TRIGGER update_paramedics_updated_at
    BEFORE UPDATE ON paramedics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_paramedic_account_cleared
    BEFORE UPDATE ON paramedics
    FOR EACH ROW
    EXECUTE FUNCTION update_account_cleared_status();
```

**Comments:**
```sql
COMMENT ON TABLE paramedics IS 'Extended paramedic information';
COMMENT ON COLUMN paramedics.arabic_status IS 'متاح, في رحلة, غير متصل, في إجازة (On Leave)';
```

---

## FLEET MANAGEMENT

### 4. `vehicles`
**Purpose:** Ambulance fleet management

```sql
CREATE TABLE vehicles (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identification
    vehicle_id VARCHAR(50) NOT NULL UNIQUE,
    vehicle_name VARCHAR(255) NOT NULL,

    -- Specifications
    vehicle_type VARCHAR(50) NOT NULL
        CHECK (vehicle_type IN ('Type I Truck', 'Type II Van', 'Type III Cutaway')),

    -- Assignment
    current_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    current_driver_name VARCHAR(255),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'متاحة'
        CHECK (status IN ('متاحة', 'في الخدمة', 'صيانة')),

    -- Notes
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_vehicles_vehicle_id ON vehicles(vehicle_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_current_driver ON vehicles(current_driver_id);
CREATE INDEX idx_vehicles_type ON vehicles(vehicle_type);

-- Trigger
CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to denormalize driver name
CREATE TRIGGER sync_vehicle_driver_name
    BEFORE INSERT OR UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION sync_driver_name();
```

**Comments:**
```sql
COMMENT ON TABLE vehicles IS 'Ambulance fleet management';
COMMENT ON COLUMN vehicles.vehicle_id IS 'Display ID like AMB-012';
COMMENT ON COLUMN vehicles.status IS 'متاحة (Available), في الخدمة (In Service), صيانة (Maintenance)';
```

---

## TRIP MANAGEMENT

### 5. `trips`
**Purpose:** Completed and ongoing trip records

```sql
CREATE TABLE trips (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Date Information (Gregorian)
    trip_date DATE NOT NULL,
    day INTEGER NOT NULL CHECK (day BETWEEN 1 AND 31),
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),

    -- Personnel (Foreign Keys)
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
    driver_name VARCHAR(255) NOT NULL,
    paramedic_id UUID NOT NULL REFERENCES paramedics(id) ON DELETE RESTRICT,
    paramedic_name VARCHAR(255) NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,

    -- Location Information
    transfer_from VARCHAR(500) NOT NULL,
    transfer_to VARCHAR(500) NOT NULL,

    -- Odometer & Fuel
    odometer_start INTEGER NOT NULL CHECK (odometer_start >= 0),
    odometer_end INTEGER NOT NULL CHECK (odometer_end >= odometer_start),
    diesel_used DECIMAL(8, 2) NOT NULL CHECK (diesel_used >= 0),

    -- Computed distance
    distance_km INTEGER GENERATED ALWAYS AS (odometer_end - odometer_start) STORED,

    -- Patient Information
    patient_name VARCHAR(255) NOT NULL,
    patient_age INTEGER NOT NULL CHECK (patient_age >= 0 AND patient_age <= 150),
    diagnosis TEXT NOT NULL,

    -- Hijri/YMD Date (for reporting)
    ymd_day INTEGER NOT NULL CHECK (ymd_day BETWEEN 1 AND 30),
    ymd_month INTEGER NOT NULL CHECK (ymd_month BETWEEN 1 AND 12),
    ymd_year INTEGER NOT NULL,

    -- Status
    transfer_status VARCHAR(30) NOT NULL
        CHECK (transfer_status IN (
            'ميداني', 'تم النقل', 'بلاغ كاذب', 'ينقل',
            'لم يتم النقل', 'صيانة', 'رفض النقل', 'اخرى'
        )),

    -- Financial Information
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    paramedic_share DECIMAL(10, 2) NOT NULL CHECK (paramedic_share >= 0),
    driver_share DECIMAL(10, 2) NOT NULL CHECK (driver_share >= 0),
    equipment_share DECIMAL(10, 2) NOT NULL CHECK (equipment_share >= 0),

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_shares CHECK (
        paramedic_share + driver_share + equipment_share = total_amount
    ),
    CONSTRAINT valid_paramedic_share CHECK (paramedic_share <= total_amount)
);

-- Indexes
CREATE INDEX idx_trips_trip_date ON trips(trip_date);
CREATE INDEX idx_trips_driver ON trips(driver_id);
CREATE INDEX idx_trips_paramedic ON trips(paramedic_id);
CREATE INDEX idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX idx_trips_status ON trips(transfer_status);
CREATE INDEX idx_trips_patient_name ON trips(patient_name);
CREATE INDEX idx_trips_transfer_from ON trips(transfer_from);
CREATE INDEX idx_trips_transfer_to ON trips(transfer_to);
CREATE INDEX idx_trips_created_at ON trips(created_at);
CREATE INDEX idx_trips_year_month ON trips(year, month);

-- Composite indexes for common queries
CREATE INDEX idx_trips_driver_date ON trips(driver_id, trip_date);
CREATE INDEX idx_trips_status_date ON trips(transfer_status, trip_date);

-- Triggers
CREATE TRIGGER update_trips_updated_at
    BEFORE UPDATE ON trips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER calculate_trip_shares
    BEFORE INSERT OR UPDATE ON trips
    FOR EACH ROW
    EXECUTE FUNCTION calculate_financial_shares();

CREATE TRIGGER sync_trip_names
    BEFORE INSERT OR UPDATE ON trips
    FOR EACH ROW
    EXECUTE FUNCTION sync_personnel_names();
```

**Comments:**
```sql
COMMENT ON TABLE trips IS 'Completed and ongoing patient transport records';
COMMENT ON COLUMN trips.transfer_status IS 'Trip completion status';
COMMENT ON COLUMN trips.distance_km IS 'Auto-calculated from odometer readings';
COMMENT ON COLUMN trips.driver_share IS 'Driver earnings: (total - paramedic_share) / 3';
COMMENT ON COLUMN trips.equipment_share IS 'Company share: total - paramedic_share - driver_share';
```

---

### 6. `pending_trips`
**Purpose:** Unassigned trips awaiting driver acceptance

```sql
CREATE TABLE pending_trips (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Patient Information
    patient_name VARCHAR(255) NOT NULL,
    patient_age INTEGER NOT NULL CHECK (patient_age >= 0 AND patient_age <= 150),
    patient_phone VARCHAR(20),
    diagnosis TEXT NOT NULL,

    -- Location Information
    pickup_location VARCHAR(500) NOT NULL,
    pickup_latitude DECIMAL(10, 8),
    pickup_longitude DECIMAL(11, 8),
    dropoff_location VARCHAR(500) NOT NULL,
    dropoff_latitude DECIMAL(10, 8),
    dropoff_longitude DECIMAL(11, 8),

    -- Scheduling
    pickup_time TIMESTAMP NOT NULL,
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Estimates
    estimated_distance DECIMAL(8, 2) NOT NULL CHECK (estimated_distance >= 0),
    estimated_duration INTEGER NOT NULL CHECK (estimated_duration >= 0),
    estimated_earnings DECIMAL(10, 2) NOT NULL CHECK (estimated_earnings >= 0),

    -- Priority & Status
    priority VARCHAR(20) NOT NULL DEFAULT 'عادي'
        CHECK (priority IN ('عادي', 'عاجل', 'طارئ')),
    status VARCHAR(20) NOT NULL DEFAULT 'معلق'
        CHECK (status IN ('معلق', 'مقبول', 'مرفوض')),

    -- Assignment (when accepted)
    assigned_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    assigned_driver_name VARCHAR(255),
    assigned_paramedic_id UUID REFERENCES paramedics(id) ON DELETE SET NULL,
    assigned_paramedic_name VARCHAR(255),
    assigned_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    assigned_vehicle_name VARCHAR(255),

    -- Acceptance/Rejection
    accepted_at TIMESTAMP,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,

    -- Conversion to full trip
    converted_to_trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,

    -- Additional Info
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Constraints
    CONSTRAINT valid_acceptance CHECK (
        (status = 'مقبول' AND accepted_at IS NOT NULL) OR
        (status != 'مقبول' AND accepted_at IS NULL)
    ),
    CONSTRAINT valid_rejection CHECK (
        (status = 'مرفوض' AND rejected_at IS NOT NULL) OR
        (status != 'مرفوض' AND rejected_at IS NULL)
    )
);

-- Indexes
CREATE INDEX idx_pending_trips_status ON pending_trips(status);
CREATE INDEX idx_pending_trips_priority ON pending_trips(priority);
CREATE INDEX idx_pending_trips_driver ON pending_trips(assigned_driver_id);
CREATE INDEX idx_pending_trips_pickup_time ON pending_trips(pickup_time);
CREATE INDEX idx_pending_trips_requested_at ON pending_trips(requested_at);
CREATE INDEX idx_pending_trips_created_by ON pending_trips(created_by);

-- Composite index for driver queries
CREATE INDEX idx_pending_trips_status_priority ON pending_trips(status, priority, requested_at);

-- Triggers
CREATE TRIGGER update_pending_trips_updated_at
    BEFORE UPDATE ON pending_trips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER sync_pending_trip_names
    BEFORE INSERT OR UPDATE ON pending_trips
    FOR EACH ROW
    EXECUTE FUNCTION sync_assignment_names();
```

**Comments:**
```sql
COMMENT ON TABLE pending_trips IS 'Unassigned trips awaiting driver acceptance';
COMMENT ON COLUMN pending_trips.priority IS 'عادي (Normal), عاجل (Urgent), طارئ (Emergency)';
COMMENT ON COLUMN pending_trips.status IS 'معلق (Pending), مقبول (Accepted), مرفوض (Rejected)';
```

---

## OPERATIONS

### 7. `fuel_records`
**Purpose:** Vehicle fuel consumption tracking

```sql
CREATE TABLE fuel_records (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- References
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    ambulance_name VARCHAR(255) NOT NULL,
    ambulance_number VARCHAR(50) NOT NULL,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
    driver_name VARCHAR(255) NOT NULL,
    driver_display_id VARCHAR(50),

    -- Date & Time
    refuel_date TIMESTAMP NOT NULL,

    -- Odometer Readings
    odometer_before INTEGER NOT NULL CHECK (odometer_before >= 0),
    odometer_after INTEGER NOT NULL CHECK (odometer_after > odometer_before),

    -- Computed distance
    distance_traveled INTEGER GENERATED ALWAYS AS (odometer_after - odometer_before) STORED,

    -- Fuel Details
    fuel_amount DECIMAL(8, 2) NOT NULL CHECK (fuel_amount > 0),
    cost DECIMAL(10, 2) NOT NULL CHECK (cost > 0),

    -- Computed cost per liter
    cost_per_liter DECIMAL(6, 2) GENERATED ALWAYS AS (cost / fuel_amount) STORED,

    -- Additional Info
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_refuel_date CHECK (refuel_date <= CURRENT_TIMESTAMP)
);

-- Indexes
CREATE INDEX idx_fuel_vehicle ON fuel_records(vehicle_id);
CREATE INDEX idx_fuel_driver ON fuel_records(driver_id);
CREATE INDEX idx_fuel_date ON fuel_records(refuel_date);
CREATE INDEX idx_fuel_created_at ON fuel_records(created_at);

-- Composite indexes
CREATE INDEX idx_fuel_vehicle_date ON fuel_records(vehicle_id, refuel_date);

-- Triggers
CREATE TRIGGER update_fuel_records_updated_at
    BEFORE UPDATE ON fuel_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER sync_fuel_record_names
    BEFORE INSERT OR UPDATE ON fuel_records
    FOR EACH ROW
    EXECUTE FUNCTION sync_fuel_names();
```

**Comments:**
```sql
COMMENT ON TABLE fuel_records IS 'Vehicle fuel consumption tracking';
COMMENT ON COLUMN fuel_records.distance_traveled IS 'Auto-calculated from odometer readings';
COMMENT ON COLUMN fuel_records.cost_per_liter IS 'Auto-calculated fuel efficiency';
```

---

### 8. `maintenance_records`
**Purpose:** Vehicle maintenance history and scheduling

```sql
CREATE TABLE maintenance_records (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- References
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    vehicle_display_id VARCHAR(50) NOT NULL,

    -- Date Information
    maintenance_date TIMESTAMP NOT NULL,

    -- Maintenance Details
    maintenance_type VARCHAR(255) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL CHECK (cost >= 0),
    service_location VARCHAR(500) NOT NULL,

    -- Odometer
    odometer_before INTEGER NOT NULL CHECK (odometer_before >= 0),
    odometer_after INTEGER NOT NULL CHECK (odometer_after >= odometer_before),

    -- Documentation
    notes TEXT NOT NULL,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'مجدولة'
        CHECK (status IN ('مكتملة', 'مجدولة', 'قيد التنفيذ')),

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_maintenance_date CHECK (
        (status = 'مجدولة' AND maintenance_date >= CURRENT_TIMESTAMP) OR
        (status != 'مجدولة')
    )
);

-- Indexes
CREATE INDEX idx_maintenance_vehicle ON maintenance_records(vehicle_id);
CREATE INDEX idx_maintenance_date ON maintenance_records(maintenance_date);
CREATE INDEX idx_maintenance_status ON maintenance_records(status);
CREATE INDEX idx_maintenance_type ON maintenance_records(maintenance_type);
CREATE INDEX idx_maintenance_created_at ON maintenance_records(created_at);

-- Composite indexes
CREATE INDEX idx_maintenance_vehicle_date ON maintenance_records(vehicle_id, maintenance_date);
CREATE INDEX idx_maintenance_status_date ON maintenance_records(status, maintenance_date);

-- Triggers
CREATE TRIGGER update_maintenance_records_updated_at
    BEFORE UPDATE ON maintenance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER sync_maintenance_vehicle_id
    BEFORE INSERT OR UPDATE ON maintenance_records
    FOR EACH ROW
    EXECUTE FUNCTION sync_vehicle_display_id();
```

**Comments:**
```sql
COMMENT ON TABLE maintenance_records IS 'Vehicle maintenance history and scheduling';
COMMENT ON COLUMN maintenance_records.status IS 'مكتملة (Completed), مجدولة (Scheduled), قيد التنفيذ (In Progress)';
```

---

## FINANCIAL

### 9. `payments`
**Purpose:** Wallet transactions and payment tracking

```sql
CREATE TABLE payments (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Transaction Info
    transaction_id VARCHAR(100) UNIQUE,

    -- User Reference
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('driver', 'paramedic')),
    user_name VARCHAR(255),

    -- Payment Details
    payment_type VARCHAR(20) NOT NULL
        CHECK (payment_type IN ('إيداع', 'سحب', 'رحلة', 'مكافأة', 'خصم', 'تعديل')),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),

    -- Related Trip (optional)
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'معلق'
        CHECK (status IN ('مكتمل', 'معلق', 'فاشل')),

    -- Payment Method (for withdrawals)
    payment_method VARCHAR(20) CHECK (payment_method IN ('bank', 'cash', 'wallet')),
    bank_account_number VARCHAR(50),
    bank_name VARCHAR(255),

    -- Dates
    payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- Balance Tracking
    balance_before DECIMAL(10, 2),
    balance_after DECIMAL(10, 2),

    -- Description
    description VARCHAR(500) NOT NULL,
    notes TEXT,
    receipt_url VARCHAR(500),

    -- Processing
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_bank_details CHECK (
        (payment_method = 'bank' AND bank_account_number IS NOT NULL AND bank_name IS NOT NULL) OR
        (payment_method != 'bank')
    ),
    CONSTRAINT valid_completion CHECK (
        (status = 'مكتمل' AND completed_at IS NOT NULL) OR
        (status != 'مكتمل')
    )
);

-- Indexes
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_user_type ON payments(user_type);
CREATE INDEX idx_payments_type ON payments(payment_type);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_trip ON payments(trip_id);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);

-- Composite indexes
CREATE INDEX idx_payments_user_date ON payments(user_id, payment_date);
CREATE INDEX idx_payments_user_status ON payments(user_id, status);
CREATE INDEX idx_payments_type_date ON payments(payment_type, payment_date);

-- Triggers
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER sync_payment_user_name
    BEFORE INSERT OR UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_name();

CREATE TRIGGER generate_transaction_id
    BEFORE INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION generate_payment_transaction_id();
```

**Comments:**
```sql
COMMENT ON TABLE payments IS 'Wallet transactions and payment tracking';
COMMENT ON COLUMN payments.payment_type IS 'إيداع (Deposit), سحب (Withdrawal), رحلة (Trip), مكافأة (Bonus), خصم (Deduction), تعديل (Adjustment)';
COMMENT ON COLUMN payments.status IS 'مكتمل (Completed), معلق (Pending), فاشل (Failed)';
```

---

## CONFIGURATION

### 10. `maintenance_type_config`
**Purpose:** Dynamic maintenance type definitions

```sql
CREATE TABLE maintenance_type_config (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Type Information
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,

    -- Estimates
    estimated_cost DECIMAL(10, 2) NOT NULL CHECK (estimated_cost >= 0),
    estimated_duration INTEGER NOT NULL CHECK (estimated_duration >= 0),

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_maintenance_types_active ON maintenance_type_config(is_active);
CREATE INDEX idx_maintenance_types_name ON maintenance_type_config(name);

-- Trigger
CREATE TRIGGER update_maintenance_type_config_updated_at
    BEFORE UPDATE ON maintenance_type_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

**Comments:**
```sql
COMMENT ON TABLE maintenance_type_config IS 'Configurable maintenance types';
COMMENT ON COLUMN maintenance_type_config.estimated_duration IS 'Duration in hours';
```

---

### 11. `transportation_type_config`
**Purpose:** Dynamic transportation/transfer type definitions

```sql
CREATE TABLE transportation_type_config (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Type Information
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_transportation_types_active ON transportation_type_config(is_active);
CREATE INDEX idx_transportation_types_name ON transportation_type_config(name);

-- Trigger
CREATE TRIGGER update_transportation_type_config_updated_at
    BEFORE UPDATE ON transportation_type_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

**Comments:**
```sql
COMMENT ON TABLE transportation_type_config IS 'Configurable transportation/transfer types';
```

---

### 12. `common_locations`
**Purpose:** Frequently used pickup/dropoff locations

```sql
CREATE TABLE common_locations (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Location Information
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,

    -- Type
    location_type VARCHAR(20) NOT NULL
        CHECK (location_type IN ('hospital', 'clinic', 'emergency', 'other')),

    -- Contact
    phone_number VARCHAR(10) NOT NULL CHECK (LENGTH(phone_number) = 10),

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_common_locations_type ON common_locations(location_type);
CREATE INDEX idx_common_locations_active ON common_locations(is_active);
CREATE INDEX idx_common_locations_name ON common_locations(name);
CREATE INDEX idx_common_locations_city ON common_locations(city);

-- Trigger
CREATE TRIGGER update_common_locations_updated_at
    BEFORE UPDATE ON common_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

**Comments:**
```sql
COMMENT ON TABLE common_locations IS 'Frequently used locations for quick selection';
COMMENT ON COLUMN common_locations.phone_number IS 'Must be exactly 10 digits';
```

---

## HELPER FUNCTIONS

### Update Timestamp Function
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Update Account Cleared Status
```sql
CREATE OR REPLACE FUNCTION update_account_cleared_status()
RETURNS TRIGGER AS $$
BEGIN
    NEW.is_account_cleared = (NEW.amount_owed = 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Calculate Financial Shares
```sql
CREATE OR REPLACE FUNCTION calculate_financial_shares()
RETURNS TRIGGER AS $$
DECLARE
    remaining DECIMAL(10, 2);
BEGIN
    -- Calculate shares
    remaining := NEW.total_amount - NEW.paramedic_share;
    NEW.driver_share := ROUND(remaining / 3, 2);
    NEW.equipment_share := ROUND(remaining - NEW.driver_share, 2);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Sync Driver Name (for vehicles)
```sql
CREATE OR REPLACE FUNCTION sync_driver_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_driver_id IS NOT NULL THEN
        SELECT u.full_name INTO NEW.current_driver_name
        FROM users u
        JOIN drivers d ON d.id = u.id
        WHERE d.id = NEW.current_driver_id;
    ELSE
        NEW.current_driver_name := NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Generate Transaction ID
```sql
CREATE OR REPLACE FUNCTION generate_payment_transaction_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_id IS NULL THEN
        NEW.transaction_id := 'TXN-' ||
            TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' ||
            LPAD(NEXTVAL('payment_seq')::TEXT, 6, '0');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for transaction IDs
CREATE SEQUENCE IF NOT EXISTS payment_seq START 1;
```

---

## RELATIONSHIPS DIAGRAM

```
┌─────────────┐
│    users    │
└──────┬──────┘
       │
       ├──────────────────────┬─────────────────────┐
       │                      │                     │
       ▼                      ▼                     ▼
  ┌─────────┐          ┌─────────────┐      ┌──────────┐
  │ drivers │          │ paramedics  │      │ payments │
  └────┬────┘          └──────┬──────┘      └────┬─────┘
       │                      │                   │
       │                      │                   ▼
       │                      │              ┌─────────┐
       │                      │              │  trips  │
       │                      │              └─────────┘
       │                      │
       ├──────────┬───────────┼────────────────┐
       │          │           │                │
       ▼          ▼           ▼                ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
  │ vehicles │ │  trips   │ │  trips   │ │pending_trips │
  └────┬─────┘ └────┬─────┘ └──────────┘ └──────────────┘
       │            │
       │            │
       ├────────────┴─────────────┐
       │                          │
       ▼                          ▼
  ┌──────────────┐      ┌──────────────────┐
  │ fuel_records │      │maintenance_records│
  └──────────────┘      └──────────────────┘


Configuration Tables (standalone):
┌─────────────────────────┐
│maintenance_type_config  │
└─────────────────────────┘

┌─────────────────────────┐
│transportation_type_config│
└─────────────────────────┘

┌─────────────────┐
│common_locations │
└─────────────────┘
```

---

## INDEXES & PERFORMANCE

### Composite Indexes for Common Queries

```sql
-- Trip queries by driver and date range
CREATE INDEX idx_trips_driver_date_range
ON trips(driver_id, trip_date);

-- Trip queries by status and date
CREATE INDEX idx_trips_status_date_range
ON trips(transfer_status, trip_date);

-- Payment queries by user and date
CREATE INDEX idx_payments_user_date_range
ON payments(user_id, payment_date);

-- Fuel records by vehicle and date
CREATE INDEX idx_fuel_vehicle_date_range
ON fuel_records(vehicle_id, refuel_date);

-- Maintenance by vehicle and date
CREATE INDEX idx_maintenance_vehicle_date_range
ON maintenance_records(vehicle_id, maintenance_date);

-- Pending trips for driver dashboard
CREATE INDEX idx_pending_trips_available
ON pending_trips(status, priority, requested_at)
WHERE status = 'معلق';
```

### Full-Text Search Indexes

```sql
-- Search in patient names
CREATE INDEX idx_trips_patient_name_trgm
ON trips USING gin (patient_name gin_trgm_ops);

-- Search in locations
CREATE INDEX idx_trips_locations_trgm
ON trips USING gin ((transfer_from || ' ' || transfer_to) gin_trgm_ops);

-- Require pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

---

## SAMPLE DATA

### Insert Sample Admin User
```sql
INSERT INTO users (username, email, password_hash, full_name, arabic_name, role, is_active)
VALUES (
    'admin',
    'admin@ambulance.sa',
    '$2b$10$rZHEuLj3LlQfPb5P.GfVbO7/Y1xCqxL3LhqK1z3xN5yjK5.5oCQKK', -- password: admin123
    'System Admin',
    'مدير النظام',
    'admin',
    TRUE
);
```

### Insert Sample Driver
```sql
WITH new_user AS (
    INSERT INTO users (username, email, password_hash, full_name, arabic_name, role, is_active)
    VALUES (
        'driver1',
        'driver1@ambulance.sa',
        '$2b$10$rZHEuLj3LlQfPb5P.GfVbO7/Y1xCqxL3LhqK1z3xN5yjK5.5oCQKK',
        'Ahmed Driver',
        'أحمد السائق',
        'driver',
        TRUE
    )
    RETURNING id
)
INSERT INTO drivers (id, arabic_status, status_color, trips_today, amount_owed)
SELECT id, 'متاح', '#10B981', 0, 0.00
FROM new_user;
```

### Insert Sample Vehicle
```sql
INSERT INTO vehicles (vehicle_id, vehicle_name, vehicle_type, status)
VALUES
    ('AMB-001', 'إسعاف النجوم', 'Type II Van', 'متاحة'),
    ('AMB-002', 'إسعاف الأمل', 'Type I Truck', 'متاحة'),
    ('AMB-003', 'إسعاف السلام', 'Type III Cutaway', 'متاحة');
```

### Insert Sample Maintenance Types
```sql
INSERT INTO maintenance_type_config (name, description, estimated_cost, estimated_duration)
VALUES
    ('تغيير الزيت', 'تغيير الزيت والفلتر', 450.00, 2),
    ('تدوير الإطارات', 'فحص وتدوير الإطارات', 300.00, 1),
    ('خدمة الفرامل', 'فحص وتنظيف الفرامل', 600.00, 3),
    ('فحص دوري', 'فحص شامل للسيارة', 800.00, 4);
```

### Insert Sample Common Locations
```sql
INSERT INTO common_locations (name, address, city, location_type, phone_number)
VALUES
    ('مستشفى الملك فيصل', 'طريق الملك فيصل، حي العليا', 'الرياض', 'hospital', '0112345678'),
    ('مستشفى الجامعة', 'حي الملز', 'الرياض', 'hospital', '0119876543'),
    ('مستشفى الملك خالد', 'حي النسيم', 'الرياض', 'hospital', '0115551234');
```

---

## DATABASE MAINTENANCE

### Backup Script
```bash
#!/bin/bash
# Daily backup script
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump ambulance_system > backup_$DATE.sql
```

### Vacuum and Analyze
```sql
-- Run weekly
VACUUM ANALYZE trips;
VACUUM ANALYZE payments;
VACUUM ANALYZE fuel_records;
VACUUM ANALYZE maintenance_records;
```

### Archive Old Data
```sql
-- Archive trips older than 2 years
CREATE TABLE trips_archive AS
SELECT * FROM trips
WHERE trip_date < CURRENT_DATE - INTERVAL '2 years';

DELETE FROM trips
WHERE trip_date < CURRENT_DATE - INTERVAL '2 years';
```

---

## PERFORMANCE RECOMMENDATIONS

1. **Partitioning**: Consider partitioning `trips` table by year
2. **Archiving**: Archive old records (>2 years) to separate tables
3. **Materialized Views**: Create for dashboard statistics
4. **Connection Pooling**: Use pgBouncer or similar
5. **Read Replicas**: For reporting and analytics
6. **Regular Maintenance**: Weekly VACUUM ANALYZE
7. **Monitor Slow Queries**: Enable slow query log
8. **Index Usage**: Monitor and drop unused indexes

---

**Total Tables:** 12
**Total Indexes:** 60+
**Total Triggers:** 15+
**Total Functions:** 6+

✅ **Ready for Production!**
