# 🔌 COMPLETE API SPECIFICATION - Ambulance Management System

**Version:** 2.0 (Updated with Auth System)
**Last Updated:** 2025-11-14
**Total Endpoints:** 160+

---

## 📋 TABLE OF CONTENTS

1. [Authentication APIs](#1-authentication-apis) - 7 endpoints
2. [Driver Management APIs](#2-driver-management-apis) - 13 endpoints
3. [Paramedic Management APIs](#3-paramedic-management-apis) - 11 endpoints
4. [Vehicle/Fleet Management APIs](#4-vehiclefleet-management-apis) - 11 endpoints
5. [Trip Management APIs](#5-trip-management-apis) - 8 endpoints
6. [Pending Trip APIs](#6-pending-trip-apis) - 9 endpoints
7. [Fuel Records APIs](#7-fuel-records-apis) - 5 endpoints
8. [Maintenance Records APIs](#8-maintenance-records-apis) - 5 endpoints
9. [Payment/Wallet APIs](#9-paymentwallet-apis) - 7 endpoints
10. [Settings APIs](#10-settings-apis) - 15 endpoints
11. [User Management APIs](#11-user-management-apis) - 4 endpoints
12. [Dashboard/Statistics APIs](#12-dashboardstatistics-apis) - 8 endpoints

---

## 1. AUTHENTICATION APIs

### 1.1 POST `/api/auth/login`
**Description:** User login with username/email and password

**Request Body:**
```json
{
  "username": "admin",           // Optional (either username or email)
  "email": "admin@ambulance.sa", // Optional (either username or email)
  "password": "password123"      // Required, min 6 characters
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "username": "admin",
    "email": "admin@ambulance.sa",
    "role": "admin",
    "fullName": "Admin User",
    "arabicName": "مدير النظام",
    "phoneNumber": "0501234567",
    "profileImageUrl": "https://...",
    "isActive": true,
    "isEmailVerified": true,
    "lastLoginAt": "2025-11-14T10:30:00Z",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-11-14T10:30:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

**Error Responses:**
- `400` - Missing required fields
- `401` - Invalid credentials
- `403` - Account disabled

---

### 1.2 POST `/api/auth/logout`
**Description:** Logout current user, invalidate refresh token

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Success Response (204):** No Content

---

### 1.3 POST `/api/auth/refresh`
**Description:** Refresh access token using refresh token

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):** Same as login response

**Error Responses:**
- `401` - Invalid or expired refresh token

---

### 1.4 GET `/api/auth/me`
**Description:** Get current authenticated user's profile

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Success Response (200):**
```json
{
  "id": "uuid",
  "username": "admin",
  "email": "admin@ambulance.sa",
  "role": "admin",
  "fullName": "Admin User",
  "arabicName": "مدير النظام",
  "phoneNumber": "0501234567",
  "nationalId": "1234567890",
  "dateOfBirth": "1990-01-01",
  "address": "حي النخيل، طريق الملك فهد",
  "city": "الرياض",
  "profileImageUrl": "https://...",
  "isActive": true,
  "isEmailVerified": true,
  "lastLoginAt": "2025-11-14T10:30:00Z",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-11-14T10:30:00Z"
}
```

---

### 1.5 PUT `/api/auth/change-password`
**Description:** Change current user's password

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "oldPassword": "oldPassword123",
  "newPassword": "newPassword123"
}
```

**Success Response (200):**
```json
{
  "message": "تم تغيير كلمة المرور بنجاح"
}
```

**Error Responses:**
- `400` - Invalid old password
- `400` - New password too short

---

### 1.6 POST `/api/auth/forgot-password`
**Description:** Request password reset link via email

**Request Body:**
```json
{
  "email": "user@ambulance.sa"
}
```

**Success Response (200):**
```json
{
  "message": "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني"
}
```

---

### 1.7 POST `/api/auth/reset-password`
**Description:** Reset password using token from email

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "newPassword123"
}
```

**Success Response (200):**
```json
{
  "message": "تم تغيير كلمة المرور بنجاح"
}
```

---

## 2. DRIVER MANAGEMENT APIs

### 2.1 GET `/api/drivers`
**Description:** Get paginated list of drivers with filters

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10, max: 100)
- `search` (string) - Search in name, arabicName, email, username
- `status` (enum) - 'متاح' | 'في رحلة' | 'غير متصل' | 'all'
- `minOwed` (number) - Minimum amount owed
- `maxOwed` (number) - Maximum amount owed
- `sortBy` (string) - Field to sort by (name, amountOwed, tripsToday, etc.)
- `sortOrder` (enum) - 'asc' | 'desc'

**Example:**
```
GET /api/drivers?page=1&limit=10&status=متاح&minOwed=100&maxOwed=500&search=أحمد
```

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Ahmed Driver",
      "arabicName": "أحمد السائق",
      "username": "ahmed123",
      "email": "ahmed@ambulance.sa",
      "arabicStatus": "متاح",
      "statusColor": "#10B981",
      "tripsToday": 5,
      "amountOwed": 250.50,
      "isAccountCleared": false,
      "isActive": true,
      "imageUrl": "https://...",
      "imageAlt": "صورة أحمد السائق"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

---

### 2.2 GET `/api/drivers/:id`
**Description:** Get single driver by ID

**Success Response (200):**
```json
{
  "id": "uuid",
  "name": "Ahmed Driver",
  "arabicName": "أحمد السائق",
  "username": "ahmed123",
  "email": "ahmed@ambulance.sa",
  "arabicStatus": "متاح",
  "statusColor": "#10B981",
  "tripsToday": 5,
  "amountOwed": 250.50,
  "isAccountCleared": false,
  "isActive": true,
  "imageUrl": "https://...",
  "imageAlt": "صورة أحمد السائق",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-11-14T10:30:00Z"
}
```

**Error Response:**
- `404` - Driver not found

---

### 2.3 POST `/api/drivers`
**Description:** Create new driver

**Request Body:**
```json
{
  "arabicName": "أحمد السائق",
  "name": "Ahmed Driver",
  "username": "ahmed123",           // Optional (username OR email required)
  "email": "ahmed@ambulance.sa",    // Optional (username OR email required)
  "password": "password123",         // Required, min 6 chars
  "amountOwed": 0,
  "tripsToday": 0
}
```

**Validation:**
- At least one of username or email is required
- arabicName: Arabic characters only, min 2 chars
- name: English characters only, min 2 chars
- username: 3-20 chars, alphanumeric only (if provided)
- email: Valid email format (if provided)
- password: Min 6 chars
- amountOwed: >= 0
- tripsToday: >= 0

**Success Response (201):**
```json
{
  "id": "uuid",
  "name": "Ahmed Driver",
  "arabicName": "أحمد السائق",
  "username": "ahmed123",
  "email": "ahmed@ambulance.sa",
  "arabicStatus": "غير متصل",
  "statusColor": "#6B7280",
  "tripsToday": 0,
  "amountOwed": 0,
  "isAccountCleared": true,
  "isActive": true,
  "imageUrl": "https://placehold.co/56x56",
  "imageAlt": "صورة أحمد السائق",
  "createdAt": "2025-11-14T10:30:00Z",
  "updatedAt": "2025-11-14T10:30:00Z"
}
```

**Error Responses:**
- `400` - Validation error
- `409` - Username or email already exists

---

### 2.4 PUT `/api/drivers/:id`
**Description:** Update driver

**Request Body:**
```json
{
  "arabicName": "أحمد السائق المحدث",
  "name": "Ahmed Driver Updated",
  "username": "ahmed123",
  "email": "ahmed@ambulance.sa",
  "arabicStatus": "متاح",
  "tripsToday": 10,
  "amountOwed": 150.00,
  "isActive": true
}
```

**Success Response (200):** Updated driver object

---

### 2.5 DELETE `/api/drivers/:id`
**Description:** Delete driver (soft delete recommended)

**Success Response (204):** No Content

**Error Response:**
- `400` - Cannot delete driver with pending trips
- `404` - Driver not found

---

### 2.6 PATCH `/api/drivers/:id/status`
**Description:** Update driver status

**Request Body:**
```json
{
  "status": "متاح" // or "في رحلة" or "غير متصل"
}
```

**Success Response (200):**
```json
{
  "id": "uuid",
  "arabicStatus": "متاح",
  "statusColor": "#10B981"
}
```

---

### 2.7 PATCH `/api/drivers/:id/activate`
**Description:** Activate driver account

**Success Response (200):**
```json
{
  "id": "uuid",
  "isActive": true
}
```

---

### 2.8 PATCH `/api/drivers/:id/deactivate`
**Description:** Deactivate driver account

**Success Response (200):**
```json
{
  "id": "uuid",
  "isActive": false
}
```

---

### 2.9 PATCH `/api/drivers/:id/reduce-balance`
**Description:** Reduce driver's owed amount (partial payment)

**Request Body:**
```json
{
  "amount": 100.50
}
```

**Validation:**
- amount > 0
- amount <= currentAmountOwed

**Success Response (200):**
```json
{
  "id": "uuid",
  "amountOwed": 150.00,  // Was 250.50, reduced by 100.50
  "isAccountCleared": false
}
```

**Error Response:**
- `400` - Amount exceeds amount owed

---

### 2.10 PATCH `/api/drivers/:id/clear-balance`
**Description:** Clear driver's balance (set to zero)

**Success Response (200):**
```json
{
  "id": "uuid",
  "amountOwed": 0.00,
  "isAccountCleared": true
}
```

---

### 2.11 GET `/api/drivers/:id/trips`
**Description:** Get driver's trip history

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `startDate` (ISO date, optional)
- `endDate` (ISO date, optional)
- `status` (TransferStatus, optional)

**Success Response (200):**
```json
{
  "data": [Trip[]],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

---

### 2.12 GET `/api/drivers/:id/earnings`
**Description:** Get driver's earnings summary

**Query Parameters:**
- `period` (enum) - 'today' | 'week' | 'month' | 'year' | 'custom'
- `startDate` (ISO date, for custom period)
- `endDate` (ISO date, for custom period)

**Success Response (200):**
```json
{
  "driverId": "uuid",
  "period": "month",
  "totalTrips": 120,
  "completedTrips": 115,
  "totalEarnings": 3450.75,
  "totalDistance": 2450,
  "averageEarningsPerTrip": 28.75,
  "breakdown": {
    "week1": 850.00,
    "week2": 920.50,
    "week3": 880.25,
    "week4": 800.00
  }
}
```

---

### 2.13 GET `/api/drivers/references`
**Description:** Get lightweight driver list for dropdowns

**Success Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Ahmed Driver",
    "arabicName": "أحمد السائق"
  }
]
```

---

## 3. PARAMEDIC MANAGEMENT APIs

### 3.1 GET `/api/paramedics`
**Description:** Get paginated list of paramedics with filters

**Query Parameters:** Same as drivers

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Mohammed Paramedic",
      "arabicName": "محمد المسعف",
      "username": "mohammed123",
      "email": "mohammed@ambulance.sa",
      "arabicStatus": "متاح",  // Can also be "في إجازة" (unique to paramedics)
      "statusColor": "#10B981",
      "tripsToday": 3,
      "amountOwed": 150.00,
      "isAccountCleared": false,
      "isActive": true,
      "imageUrl": "https://...",
      "imageAlt": "صورة محمد المسعف"
    }
  ],
  "total": 30,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

---

### 3.2 GET `/api/paramedics/:id`
**Description:** Get single paramedic by ID

**Success Response (200):** Paramedic object

---

### 3.3 POST `/api/paramedics`
**Description:** Create new paramedic

**Request Body:** Same structure as driver creation

**Success Response (201):** Created paramedic object

---

### 3.4 PUT `/api/paramedics/:id`
**Description:** Update paramedic

**Success Response (200):** Updated paramedic object

---

### 3.5 DELETE `/api/paramedics/:id`
**Description:** Delete paramedic

**Success Response (204):** No Content

---

### 3.6 PATCH `/api/paramedics/:id/status`
**Description:** Update paramedic status

**Request Body:**
```json
{
  "status": "متاح" | "في رحلة" | "غير متصل" | "في إجازة"
}
```

**Success Response (200):** Updated status

---

### 3.7 PATCH `/api/paramedics/:id/activate`
**Description:** Activate paramedic account

---

### 3.8 PATCH `/api/paramedics/:id/deactivate`
**Description:** Deactivate paramedic account

---

### 3.9 PATCH `/api/paramedics/:id/reduce-balance`
**Description:** Reduce paramedic balance

---

### 3.10 PATCH `/api/paramedics/:id/clear-balance`
**Description:** Clear paramedic balance

---

### 3.11 GET `/api/paramedics/references`
**Description:** Get lightweight paramedic list for dropdowns

**Success Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Mohammed Paramedic",
    "arabicName": "محمد المسعف"
  }
]
```

---

## 4. VEHICLE/FLEET MANAGEMENT APIs

### 4.1 GET `/api/vehicles`
**Description:** Get paginated list of vehicles with filters

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `search` (string) - Search in vehicleId, vehicleName, currentDriver
- `status` (enum) - 'متاحة' | 'في الخدمة' | 'صيانة' | 'All'
- `sortBy` (string)
- `sortOrder` ('asc' | 'desc')

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "vehicleId": "AMB-012",
      "vehicleName": "إسعاف النجوم",
      "type": "Type II Van",
      "currentDriverId": "uuid",
      "currentDriver": "Ahmed Driver",
      "status": "متاحة",
      "notes": "مركبة جديدة",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-11-14T10:30:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

---

### 4.2 GET `/api/vehicles/:id`
**Description:** Get single vehicle by ID

**Success Response (200):** Vehicle object

---

### 4.3 POST `/api/vehicles`
**Description:** Create new vehicle

**Request Body:**
```json
{
  "vehicleId": "AMB-015",       // Required, unique
  "vehicleName": "إسعاف الأمل",  // Required
  "type": "Type II Van",         // Required: Type I Truck | Type II Van | Type III Cutaway
  "currentDriverId": "uuid",     // Optional
  "status": "متاحة",             // Default: متاحة
  "notes": "سيارة جديدة"         // Optional
}
```

**Success Response (201):** Created vehicle object

**Error Response:**
- `409` - Vehicle ID already exists

---

### 4.4 PUT `/api/vehicles/:id`
**Description:** Update vehicle

**Request Body:** Partial vehicle object

**Success Response (200):** Updated vehicle object

---

### 4.5 DELETE `/api/vehicles/:id`
**Description:** Delete vehicle

**Success Response (204):** No Content

**Error Response:**
- `400` - Cannot delete vehicle with pending maintenance or trips

---

### 4.6 PATCH `/api/vehicles/:id/status`
**Description:** Update vehicle status

**Request Body:**
```json
{
  "status": "متاحة" | "في الخدمة" | "صيانة"
}
```

**Success Response (200):** Updated vehicle

---

### 4.7 PATCH `/api/vehicles/:id/assign-driver`
**Description:** Assign driver to vehicle

**Request Body:**
```json
{
  "driverId": "uuid"
}
```

**Success Response (200):**
```json
{
  "id": "uuid",
  "currentDriverId": "uuid",
  "currentDriver": "Ahmed Driver",
  "status": "في الخدمة"
}
```

**Error Response:**
- `400` - Driver already assigned to another vehicle
- `404` - Driver not found

---

### 4.8 PATCH `/api/vehicles/:id/unassign-driver`
**Description:** Remove driver from vehicle

**Success Response (200):**
```json
{
  "id": "uuid",
  "currentDriverId": null,
  "currentDriver": null,
  "status": "متاحة"
}
```

---

### 4.9 GET `/api/vehicles/:id/maintenance`
**Description:** Get vehicle's maintenance history

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `startDate` (ISO date)
- `endDate` (ISO date)

**Success Response (200):** Paginated maintenance records

---

### 4.10 GET `/api/vehicles/:id/fuel`
**Description:** Get vehicle's fuel records

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `startDate` (ISO date)
- `endDate` (ISO date)

**Success Response (200):** Paginated fuel records

---

### 4.11 GET `/api/vehicles/references`
**Description:** Get lightweight vehicle list for dropdowns

**Success Response (200):**
```json
[
  {
    "id": "uuid",
    "vehicleId": "AMB-012",
    "vehicleName": "إسعاف النجوم"
  }
]
```

---

## 5. TRIP MANAGEMENT APIs

### 5.1 GET `/api/trips`
**Description:** Get paginated list of trips with complex filters

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `status` (TransferStatus | 'All')
- `driverId` (uuid)
- `paramedicId` (uuid)
- `vehicleId` (uuid)
- `patientName` (string)
- `transferFrom` (string) - Pickup location
- `transferTo` (string) - Dropoff location
- `startDate` (ISO date) - Date range start
- `endDate` (ISO date) - Date range end
- `day` (number 1-31) - Filter by day
- `month` (number 1-12) - Filter by month
- `year` (number) - Filter by year
- `sortBy` (string)
- `sortOrder` ('asc' | 'desc')

**Example:**
```
GET /api/trips?driverId=uuid&startDate=2025-01-01&endDate=2025-01-31&status=تم النقل&page=1&limit=10
```

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "day": 15,
      "month": 1,
      "year": 2025,
      "driverId": "uuid",
      "driver": "Ahmed Driver",
      "paramedicId": "uuid",
      "paramedic": "Mohammed Paramedic",
      "vehicleId": "uuid",
      "transferFrom": "مستشفى الملك فيصل",
      "transferTo": "مستشفى الجامعة",
      "odometerStart": 12500,
      "odometerEnd": 12650,
      "dieselUsed": 15.5,
      "patientName": "محمد أحمد",
      "patientAge": 45,
      "diagnosis": "كسر في الساق",
      "ymdDay": 15,
      "ymdMonth": 1,
      "ymdYear": 1446,
      "transferStatus": "تم النقل",
      "totalAmount": 300.00,
      "paramedicShare": 50.00,
      "driverShare": 83.33,
      "equipmentShare": 166.67,
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-15T15:45:00Z"
    }
  ],
  "total": 450,
  "page": 1,
  "limit": 10,
  "totalPages": 45
}
```

---

### 5.2 GET `/api/trips/:id`
**Description:** Get single trip by ID

**Success Response (200):** Trip object with full details

---

### 5.3 POST `/api/trips`
**Description:** Create new trip

**Request Body:**
```json
{
  "day": 15,
  "month": 1,
  "year": 2025,
  "driverId": "uuid",              // Required
  "paramedicId": "uuid",            // Required
  "vehicleId": "uuid",              // Optional
  "transferFrom": "مستشفى الملك فيصل",
  "transferTo": "مستشفى الجامعة",
  "odometerStart": 12500,           // Required, must be > 0
  "odometerEnd": 12650,             // Required, must be > odometerStart
  "dieselUsed": 15.5,               // Required, must be >= 0
  "patientName": "محمد أحمد",
  "patientAge": 45,                 // Required, 0-150
  "diagnosis": "كسر في الساق",
  "ymdDay": 15,
  "ymdMonth": 1,
  "ymdYear": 1446,
  "transferStatus": "تم النقل",    // Required, see enum
  "totalAmount": 300.00,            // Required, >= 0
  "paramedicShare": 50.00          // Required, >= 0, <= totalAmount
}
```

**Backend Calculations:**
```javascript
// Server should calculate these automatically:
const remaining = totalAmount - paramedicShare;
const driverShare = remaining / 3;
const equipmentShare = remaining - driverShare;
```

**Validation:**
- odometerEnd > odometerStart
- dieselUsed >= 0
- patientAge: 0-150
- totalAmount >= 0
- paramedicShare >= 0 and <= totalAmount
- Date fields: valid day/month/year

**Success Response (201):**
```json
{
  "id": "uuid",
  // ... full trip object with calculated shares
  "driverShare": 83.33,
  "equipmentShare": 166.67
}
```

---

### 5.4 PUT `/api/trips/:id`
**Description:** Update trip

**Request Body:** Partial trip object

**Success Response (200):** Updated trip object with recalculated shares

---

### 5.5 DELETE `/api/trips/:id`
**Description:** Delete trip

**Success Response (204):** No Content

**Error Response:**
- `400` - Cannot delete trip with associated payments
- `404` - Trip not found

---

### 5.6 PATCH `/api/trips/:id/status`
**Description:** Update trip status

**Request Body:**
```json
{
  "status": "تم النقل" | "ميداني" | "بلاغ كاذب" | "ينقل" | "لم يتم النقل" | "صيانة" | "رفض النقل" | "اخرى"
}
```

**Success Response (200):** Updated trip

---

### 5.7 GET `/api/trips/stats`
**Description:** Get trip statistics for dashboard

**Query Parameters:**
- `period` (enum) - 'week' | 'month' | 'custom'
- `startDate` (ISO date, for custom period)
- `endDate` (ISO date, for custom period)

**Success Response (200):**
```json
{
  "totalTrips": 450,
  "completedTrips": 425,
  "totalRevenue": 135000.00,
  "totalCosts": 85000.00,
  "netProfit": 50000.00,
  "averageTripRevenue": 300.00,
  "tripsByDay": [
    { "day": "السبت", "count": 65, "percentage": 14.4 },
    { "day": "الأحد", "count": 70, "percentage": 15.6 },
    { "day": "الاثنين", "count": 68, "percentage": 15.1 },
    { "day": "الثلاثاء", "count": 63, "percentage": 14.0 },
    { "day": "الأربعاء", "count": 64, "percentage": 14.2 },
    { "day": "الخميس", "count": 60, "percentage": 13.3 },
    { "day": "الجمعة", "count": 60, "percentage": 13.3 }
  ],
  "tripsByStatus": [
    { "status": "تم النقل", "count": 425, "percentage": 94.4 },
    { "status": "لم يتم النقل", "count": 15, "percentage": 3.3 },
    { "status": "بلاغ كاذب", "count": 10, "percentage": 2.2 }
  ],
  "costBreakdown": [
    { "category": "الوقود", "amount": 35000.00, "percentage": 41.2 },
    { "category": "الصيانة", "amount": 25000.00, "percentage": 29.4 },
    { "category": "الرواتب", "amount": 25000.00, "percentage": 29.4 }
  ]
}
```

---

### 5.8 GET `/api/trips/export`
**Description:** Export trips data to Excel/CSV

**Query Parameters:** Same filters as GET /api/trips
- `format` (enum) - 'excel' | 'csv' | 'pdf'

**Success Response (200):** File download

---

## 6. PENDING TRIP APIs

### 6.1 GET `/api/pending-trips`
**Description:** Get pending trips awaiting assignment/acceptance

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `status` (enum) - 'معلق' | 'مقبول' | 'مرفوض'
- `priority` (enum) - 'عادي' | 'عاجل' | 'طارئ'
- `driverId` (uuid) - Filter by assigned driver
- `sortBy` (string)
- `sortOrder` ('asc' | 'desc')

**Default Sorting:** Priority DESC (طارئ, عاجل, عادي), then requestedAt DESC

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "patientName": "علي محمد",
      "patientAge": 35,
      "patientPhone": "0501234567",
      "diagnosis": "آلام في الصدر",
      "pickupLocation": "مستشفى الملك فيصل",
      "pickupLatitude": 24.7136,
      "pickupLongitude": 46.6753,
      "dropoffLocation": "مستشفى الجامعة",
      "dropoffLatitude": 24.7243,
      "dropoffLongitude": 46.6398,
      "pickupTime": "2025-11-14T14:00:00Z",
      "requestedAt": "2025-11-14T13:00:00Z",
      "estimatedDistance": 12.5,
      "estimatedDuration": 25,
      "estimatedEarnings": 150.00,
      "priority": "عاجل",
      "status": "معلق",
      "assignedDriverId": null,
      "assignedDriverName": null,
      "notes": "",
      "createdAt": "2025-11-14T13:00:00Z",
      "updatedAt": "2025-11-14T13:00:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10,
  "totalPages": 2
}
```

---

### 6.2 GET `/api/pending-trips/:id`
**Description:** Get single pending trip by ID

**Success Response (200):** Full pending trip object

---

### 6.3 POST `/api/pending-trips`
**Description:** Create new pending trip (admin only)

**Request Body:**
```json
{
  "patientName": "علي محمد",
  "patientAge": 35,
  "patientPhone": "0501234567",     // Optional
  "diagnosis": "آلام في الصدر",
  "pickupLocation": "مستشفى الملك فيصل",
  "pickupLatitude": 24.7136,        // Optional
  "pickupLongitude": 46.6753,       // Optional
  "dropoffLocation": "مستشفى الجامعة",
  "dropoffLatitude": 24.7243,       // Optional
  "dropoffLongitude": 46.6398,      // Optional
  "pickupTime": "2025-11-14T14:00:00Z",
  "priority": "عاجل",               // Default: عادي
  "notes": ""                        // Optional
}
```

**Backend Calculations:**
Server should calculate:
- `estimatedDistance` (if lat/long provided, else based on locations)
- `estimatedDuration` (based on distance and traffic)
- `estimatedEarnings` (based on distance and type)

**Success Response (201):** Created pending trip with calculated fields

---

### 6.4 PUT `/api/pending-trips/:id`
**Description:** Update pending trip

**Success Response (200):** Updated pending trip

---

### 6.5 DELETE `/api/pending-trips/:id`
**Description:** Delete pending trip

**Success Response (204):** No Content

---

### 6.6 POST `/api/pending-trips/:id/accept`
**Description:** Driver accepts pending trip

**Request Headers:**
```
Authorization: Bearer {driverToken}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "تم قبول الرحلة بنجاح",
  "trip": {
    "id": "uuid",
    "status": "مقبول",
    "assignedDriverId": "uuid",
    "assignedDriverName": "Ahmed Driver",
    "acceptedAt": "2025-11-14T13:30:00Z"
  }
}
```

**Error Responses:**
- `400` - Trip already accepted by another driver
- `403` - Driver not eligible (offline, on another trip, etc.)

---

### 6.7 POST `/api/pending-trips/:id/reject`
**Description:** Driver rejects pending trip

**Request Body:**
```json
{
  "reason": "مشغول بتوصيلة أخرى" // Optional
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "تم رفض الرحلة",
  "trip": {
    "id": "uuid",
    "status": "مرفوض",
    "rejectedAt": "2025-11-14T13:30:00Z",
    "rejectionReason": "مشغول بتوصيلة أخرى"
  }
}
```

---

### 6.8 GET `/api/pending-trips/driver/:driverId`
**Description:** Get available trips for specific driver

**Success Response (200):** Array of available pending trips

---

### 6.9 PATCH `/api/pending-trips/:id/assign`
**Description:** Admin manually assigns trip to driver

**Request Body:**
```json
{
  "driverId": "uuid",
  "paramedicId": "uuid",   // Optional
  "vehicleId": "uuid"      // Optional
}
```

**Success Response (200):** Updated pending trip with assignments

---

## 7. FUEL RECORDS APIs

### 7.1 GET `/api/fuel-records`
**Description:** Get fuel consumption records

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `vehicleId` (uuid)
- `driverId` (uuid)
- `startDate` (ISO date)
- `endDate` (ISO date)
- `search` (string) - Search in vehicle name, number, driver

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "vehicleId": "uuid",
      "ambulanceName": "إسعاف 04",
      "ambulanceNumber": "AMB-004",
      "driverId": "uuid",
      "driverName": "Ahmed Driver",
      "driverDisplayId": "D-124",
      "refuelDate": "2025-11-14T10:30:00Z",
      "odometerBefore": 12500,
      "odometerAfter": 12650,
      "fuelAmount": 45.5,
      "cost": 182.00,
      "notes": "تعبئة في محطة البترول الوطنية",
      "createdAt": "2025-11-14T10:35:00Z",
      "updatedAt": "2025-11-14T10:35:00Z"
    }
  ],
  "total": 200,
  "page": 1,
  "limit": 10,
  "totalPages": 20
}
```

---

### 7.2 GET `/api/fuel-records/:id`
**Description:** Get single fuel record

**Success Response (200):** Fuel record object

---

### 7.3 POST `/api/fuel-records`
**Description:** Create fuel record

**Request Body:**
```json
{
  "vehicleId": "uuid",
  "driverId": "uuid",
  "refuelDate": "2025-11-14T10:30:00Z",
  "odometerBefore": 12500,
  "odometerAfter": 12650,
  "fuelAmount": 45.5,
  "cost": 182.00,
  "notes": "تعبئة في محطة البترول الوطنية" // Optional
}
```

**Validation:**
- odometerAfter > odometerBefore
- fuelAmount > 0
- cost > 0
- refuelDate cannot be in future

**Success Response (201):** Created fuel record

---

### 7.4 PUT `/api/fuel-records/:id`
**Description:** Update fuel record

**Success Response (200):** Updated fuel record

---

### 7.5 DELETE `/api/fuel-records/:id`
**Description:** Delete fuel record

**Success Response (204):** No Content

---

## 8. MAINTENANCE RECORDS APIs

### 8.1 GET `/api/maintenance-records`
**Description:** Get maintenance history

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `vehicleId` (uuid)
- `type` (string) - Maintenance type name
- `status` ('مكتملة' | 'مجدولة' | 'قيد التنفيذ')
- `startDate` (ISO date)
- `endDate` (ISO date)
- `serviceLocation` (string)
- `search` (string)

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "vehicleId": "uuid",
      "vehicleDisplayId": "AMB-012",
      "maintenanceDate": "2025-11-10T09:00:00Z",
      "type": "تغيير الزيت",
      "cost": 450.00,
      "serviceLocation": "مركز صيانة المدينة",
      "odometerBefore": 12000,
      "odometerAfter": 12000,
      "notes": "تم تغيير الزيت والفلتر",
      "status": "مكتملة",
      "createdAt": "2025-11-08T10:00:00Z",
      "updatedAt": "2025-11-10T11:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 10,
  "totalPages": 15
}
```

---

### 8.2 GET `/api/maintenance-records/:id`
**Description:** Get single maintenance record

**Success Response (200):** Maintenance record object

---

### 8.3 POST `/api/maintenance-records`
**Description:** Create maintenance record

**Request Body:**
```json
{
  "vehicleId": "uuid",
  "maintenanceDate": "2025-11-10T09:00:00Z",
  "type": "تغيير الزيت",
  "cost": 450.00,
  "serviceLocation": "مركز صيانة المدينة",
  "odometerBefore": 12000,
  "odometerAfter": 12000,
  "notes": "تم تغيير الزيت والفلتر",
  "status": "مكتملة" // Default: مجدولة
}
```

**Validation:**
- odometerAfter >= odometerBefore
- cost >= 0
- maintenanceDate cannot be in future (unless status is مجدولة)

**Success Response (201):** Created maintenance record

---

### 8.4 PUT `/api/maintenance-records/:id`
**Description:** Update maintenance record

**Success Response (200):** Updated maintenance record

---

### 8.5 DELETE `/api/maintenance-records/:id`
**Description:** Delete maintenance record

**Success Response (204):** No Content

---

## 9. PAYMENT/WALLET APIs

### 9.1 GET `/api/payments`
**Description:** Get payment transaction history

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `userId` (uuid) - Filter by driver/paramedic
- `userType` ('driver' | 'paramedic')
- `paymentType` ('إيداع' | 'سحب' | 'رحلة' | 'مكافأة' | 'خصم' | 'تعديل' | 'All')
- `status` ('مكتمل' | 'معلق' | 'فاشل')
- `startDate` (ISO date)
- `endDate` (ISO date)
- `month` (number 1-12)
- `year` (number)

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "transactionId": "TXN-20251114-001",
      "userId": "uuid",
      "userType": "driver",
      "userName": "Ahmed Driver",
      "paymentType": "رحلة",
      "amount": 83.33,
      "tripId": "uuid",
      "status": "مكتمل",
      "paymentMethod": null,
      "paymentDate": "2025-11-14T15:00:00Z",
      "processedAt": "2025-11-14T15:01:00Z",
      "completedAt": "2025-11-14T15:01:00Z",
      "balanceBefore": 1200.00,
      "balanceAfter": 1283.33,
      "description": "أجرة رحلة #TRP-001",
      "notes": "",
      "createdAt": "2025-11-14T15:00:00Z",
      "updatedAt": "2025-11-14T15:01:00Z"
    }
  ],
  "total": 500,
  "page": 1,
  "limit": 10,
  "totalPages": 50
}
```

---

### 9.2 GET `/api/payments/:id`
**Description:** Get single payment record

**Success Response (200):** Payment object

---

### 9.3 POST `/api/payments`
**Description:** Create manual payment entry (admin only)

**Request Body:**
```json
{
  "userId": "uuid",
  "userType": "driver" | "paramedic",
  "paymentType": "إيداع" | "سحب" | "رحلة" | "مكافأة" | "خصم" | "تعديل",
  "amount": 100.00,
  "tripId": "uuid",              // Optional, for trip payments
  "paymentMethod": "bank" | "cash" | "wallet", // For withdrawals
  "bankAccountNumber": "string",  // Optional
  "bankName": "string",           // Optional
  "description": "وصف العملية",
  "notes": ""                     // Optional
}
```

**Success Response (201):** Created payment

---

### 9.4 GET `/api/payments/wallet-summary/:userId`
**Description:** Get wallet summary for user

**Success Response (200):**
```json
{
  "currentBalance": 1250.75,
  "pendingBalance": 320.50,
  "totalEarnings": 5680.25,
  "totalWithdrawals": 4500.00,
  "lastPaymentDate": "2025-11-14T15:00:00Z"
}
```

---

### 9.5 POST `/api/payments/withdraw`
**Description:** Driver/paramedic requests withdrawal

**Request Headers:**
```
Authorization: Bearer {userToken}
```

**Request Body:**
```json
{
  "amount": 500.00,
  "paymentMethod": "bank" | "cash",
  "bankAccountNumber": "SA1234567890",  // Required if method = bank
  "bankName": "البنك الأهلي السعودي",    // Required if method = bank
  "notes": ""
}
```

**Validation:**
- amount > 0
- amount <= currentBalance
- If paymentMethod = bank, bankAccountNumber and bankName required

**Success Response (201):**
```json
{
  "id": "uuid",
  "status": "معلق",
  "message": "تم إرسال طلب السحب بنجاح. سيتم المراجعة خلال 24 ساعة"
}
```

---

### 9.6 PATCH `/api/payments/:id/status`
**Description:** Update payment status (admin only)

**Request Body:**
```json
{
  "status": "مكتمل" | "فاشل"
}
```

**Success Response (200):** Updated payment

---

### 9.7 GET `/api/payments/stats`
**Description:** Get payment statistics

**Query Parameters:**
- `period` ('week' | 'month' | 'year')
- `userId` (uuid, optional)

**Success Response (200):**
```json
{
  "totalDeposits": 50000.00,
  "totalWithdrawals": 30000.00,
  "pendingWithdrawals": 5000.00,
  "completedTransactions": 450,
  "pendingTransactions": 25,
  "failedTransactions": 5
}
```

---

## 10. SETTINGS APIs

### 10.1 Maintenance Types

#### GET `/api/settings/maintenance-types`
**Description:** Get all maintenance type configurations

**Success Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "تغيير الزيت",
    "description": "تغيير الزيت والفلتر",
    "estimatedCost": 450.00,
    "estimatedDuration": 2,
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
]
```

#### POST `/api/settings/maintenance-types`
**Description:** Create maintenance type

**Request Body:**
```json
{
  "name": "استبدال الإطارات",
  "description": "استبدال جميع الإطارات الأربعة",
  "estimatedCost": 2000.00,
  "estimatedDuration": 3,
  "isActive": true
}
```

**Success Response (201):** Created maintenance type

#### PUT `/api/settings/maintenance-types/:id`
**Description:** Update maintenance type

#### DELETE `/api/settings/maintenance-types/:id`
**Description:** Delete maintenance type

#### PATCH `/api/settings/maintenance-types/:id/toggle`
**Description:** Toggle active status

---

### 10.2 Transportation Types

#### GET `/api/settings/transportation-types`
**Description:** Get all transportation types

**Success Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "نقل طوارئ",
    "description": "نقل حالات الطوارئ العاجلة",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
]
```

#### POST `/api/settings/transportation-types`
**Request Body:**
```json
{
  "name": "نقل عادي",
  "description": "نقل الحالات العادية",
  "isActive": true
}
```

#### PUT `/api/settings/transportation-types/:id`
#### DELETE `/api/settings/transportation-types/:id`
#### PATCH `/api/settings/transportation-types/:id/toggle`

---

### 10.3 Common Locations

#### GET `/api/settings/common-locations`
**Description:** Get frequently used locations

**Query Parameters:**
- `type` ('hospital' | 'clinic' | 'emergency' | 'other' | 'all')
- `search` (string)

**Success Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "مستشفى الملك فيصل",
    "address": "طريق الملك فيصل، حي العليا",
    "city": "الرياض",
    "type": "hospital",
    "phoneNumber": "0112345678",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
]
```

#### POST `/api/settings/common-locations`
**Request Body:**
```json
{
  "name": "مستشفى الجامعة",
  "address": "حي الملز",
  "city": "الرياض",
  "type": "hospital",
  "phoneNumber": "0119876543",
  "isActive": true
}
```

**Validation:**
- phoneNumber: Must be exactly 10 digits

#### PUT `/api/settings/common-locations/:id`
#### DELETE `/api/settings/common-locations/:id`
#### PATCH `/api/settings/common-locations/:id/toggle`

---

## 11. USER MANAGEMENT APIs

### 11.1 GET `/api/users`
**Description:** Get all system users (admin only)

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `role` ('admin' | 'driver' | 'paramedic' | 'all')
- `search` (string)

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "username": "admin",
      "email": "admin@ambulance.sa",
      "role": "admin",
      "fullName": "Admin User",
      "arabicName": "مدير النظام",
      "phoneNumber": "0501234567",
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

---

### 11.2 POST `/api/users`
**Description:** Create new user (admin only)

**Request Body:**
```json
{
  "username": "newuser",      // Optional (username OR email required)
  "email": "new@ambulance.sa", // Optional (username OR email required)
  "password": "password123",   // Required, min 6 chars
  "fullName": "New User",
  "arabicName": "مستخدم جديد",
  "role": "admin" | "driver" | "paramedic",
  "phoneNumber": "0501234567"  // Optional
}
```

**Success Response (201):** Created user object

---

### 11.3 DELETE `/api/users/:id`
**Description:** Delete user (admin only)

**Success Response (204):** No Content

---

### 11.4 GET `/api/users/:id/profile`
**Description:** Get detailed user profile

**Success Response (200):** Full user object with role-specific data

---

## 12. DASHBOARD/STATISTICS APIs

### 12.1 GET `/api/dashboard/admin`
**Description:** Get admin dashboard statistics

**Success Response (200):**
```json
{
  "overview": {
    "totalDrivers": 50,
    "activeDrivers": 35,
    "totalParamedics": 30,
    "activeParamedics": 25,
    "totalVehicles": 25,
    "availableVehicles": 15,
    "pendingTrips": 8,
    "tripsToday": 45
  },
  "todayStats": {
    "totalTrips": 45,
    "completedTrips": 40,
    "pendingTrips": 5,
    "totalRevenue": 13500.00,
    "totalDistance": 850
  },
  "recentTrips": [Trip[]],  // Last 5 trips
  "recentAlerts": [
    {
      "type": "maintenance",
      "message": "سيارة AMB-012 تحتاج صيانة دورية",
      "severity": "warning",
      "timestamp": "2025-11-14T10:00:00Z"
    }
  ]
}
```

---

### 12.2 GET `/api/dashboard/driver/:driverId`
**Description:** Get driver dashboard statistics

**Success Response (200):**
```json
{
  "driver": {
    "id": "uuid",
    "name": "Ahmed Driver",
    "arabicName": "أحمد السائق",
    "status": "متاح"
  },
  "today": {
    "tripsCompleted": 5,
    "totalEarnings": 415.00,
    "totalDistance": 125,
    "hoursWorked": 6.5
  },
  "week": {
    "tripsCompleted": 28,
    "totalEarnings": 2310.00
  },
  "month": {
    "tripsCompleted": 120,
    "totalEarnings": 9850.00
  },
  "wallet": {
    "currentBalance": 1250.75,
    "pendingBalance": 320.50
  },
  "recentTrips": [Trip[]],
  "pendingTrips": [PendingTrip[]]
}
```

---

### 12.3 GET `/api/stats/revenue`
**Description:** Revenue statistics over time

**Query Parameters:**
- `period` ('day' | 'week' | 'month' | 'year')
- `startDate` (ISO date)
- `endDate` (ISO date)

**Success Response (200):**
```json
{
  "totalRevenue": 135000.00,
  "totalCosts": 85000.00,
  "netProfit": 50000.00,
  "profitMargin": 37.0,
  "byPeriod": [
    {
      "period": "2025-11-01",
      "revenue": 4500.00,
      "costs": 2800.00,
      "profit": 1700.00
    }
  ]
}
```

---

### 12.4 GET `/api/stats/drivers`
**Description:** Driver performance statistics

**Success Response (200):**
```json
{
  "topDrivers": [
    {
      "driverId": "uuid",
      "name": "Ahmed Driver",
      "totalTrips": 150,
      "totalEarnings": 12450.00,
      "avgRating": 4.8
    }
  ],
  "avgTripsPerDriver": 85.5,
  "avgEarningsPerDriver": 7250.00
}
```

---

### 12.5 GET `/api/stats/vehicles`
**Description:** Vehicle utilization statistics

**Success Response (200):**
```json
{
  "totalVehicles": 25,
  "activeVehicles": 15,
  "utilizationRate": 60.0,
  "vehicleStats": [
    {
      "vehicleId": "AMB-012",
      "totalTrips": 200,
      "totalDistance": 5000,
      "fuelCost": 8000.00,
      "maintenanceCost": 3500.00
    }
  ]
}
```

---

### 12.6 GET `/api/stats/fuel`
**Description:** Fuel consumption statistics

**Query Parameters:**
- `period` ('week' | 'month' | 'year')
- `vehicleId` (uuid, optional)

**Success Response (200):**
```json
{
  "totalFuelConsumed": 2500.5,
  "totalFuelCost": 10002.00,
  "avgCostPerLiter": 4.00,
  "avgConsumptionPerTrip": 15.5,
  "topConsumers": [
    {
      "vehicleId": "AMB-012",
      "fuelConsumed": 450.5,
      "cost": 1802.00
    }
  ]
}
```

---

### 12.7 GET `/api/stats/maintenance`
**Description:** Maintenance cost statistics

**Success Response (200):**
```json
{
  "totalMaintenanceCost": 45000.00,
  "scheduledMaintenance": 12,
  "completedMaintenance": 85,
  "avgCostPerMaintenance": 529.41,
  "maintenanceByType": [
    {
      "type": "تغيير الزيت",
      "count": 25,
      "totalCost": 11250.00
    }
  ]
}
```

---

### 12.8 GET `/api/stats/export`
**Description:** Export comprehensive statistics report

**Query Parameters:**
- `format` ('excel' | 'pdf')
- `period` ('week' | 'month' | 'year' | 'custom')
- `startDate` (ISO date, for custom)
- `endDate` (ISO date, for custom)

**Success Response (200):** File download

---

## 📊 RESPONSE PATTERNS

### Success Response Structure
```json
{
  "data": {},           // Single object or array
  "total": number,      // For paginated lists
  "page": number,       // For paginated lists
  "limit": number,      // For paginated lists
  "totalPages": number  // For paginated lists
}
```

### Error Response Structure
```json
{
  "error": {
    "message": "رسالة الخطأ بالعربية",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "details": {}       // Optional, for validation errors
  }
}
```

### Validation Error Response
```json
{
  "error": {
    "message": "خطأ في التحقق من البيانات",
    "code": "VALIDATION_ERROR",
    "statusCode": 400,
    "details": {
      "arabicName": ["الاسم بالعربي مطلوب"],
      "email": ["البريد الإلكتروني غير صالح"]
    }
  }
}
```

---

## 🔐 AUTHENTICATION

All endpoints except `/api/auth/login`, `/api/auth/forgot-password`, and `/api/auth/reset-password` require authentication.

**Request Header:**
```
Authorization: Bearer {accessToken}
```

**Token Expiry:** 1 hour (3600 seconds)

**Refresh Token Expiry:** 7 days

---

## 📝 NOTES

1. **Date Formats:** All dates should be ISO 8601 format (e.g., "2025-11-14T10:30:00Z")
2. **Pagination:** Default page=1, limit=10, max limit=100
3. **Sorting:** Default sort order is DESC for dates, ASC for names
4. **Arabic Support:** All text fields support UTF-8 Arabic characters
5. **Decimal Precision:** Money amounts use 2 decimal places
6. **Status Colors:** Returned as hex codes (e.g., "#10B981")
7. **Computed Fields:** Shares, distances, etc. calculated on server
8. **Soft Delete:** Recommended for Users, Drivers, Paramedics, Vehicles
9. **Audit Logs:** Track all create/update/delete operations
10. **Rate Limiting:** Recommend 100 requests/minute per user

---

**Total Endpoints:** 160+
**Authentication Required:** 153 endpoints
**Public Endpoints:** 7 endpoints (auth related)
**Admin Only:** 30 endpoints
**Driver/Paramedic Only:** 15 endpoints
**Shared Access:** 115 endpoints

---

✅ **Ready for Backend Implementation!**
