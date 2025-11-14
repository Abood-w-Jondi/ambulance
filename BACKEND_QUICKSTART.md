# 🚀 Backend Quick Start Guide

This guide helps you quickly implement the backend API for the ambulance system.

---

## 📋 Prerequisites

1. ✅ Frontend authentication system (DONE)
2. ✅ API services created (DONE)
3. ✅ Models defined (DONE)
4. 🔲 Choose your backend framework
5. 🔲 Set up database

---

## 🎯 Quick Implementation Order

### **Phase 1: Foundation (Day 1)**
#### Step 1.1: Set Up Database
```sql
-- Create database
CREATE DATABASE ambulance_system;

-- Create users table (see DATABASE_SCHEMA.md for full schema)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    -- ... more fields
);
```

#### Step 1.2: Implement Authentication Endpoints
**Priority: CRITICAL - Do this first!**

```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/me
```

**Example Response for Login:**
```json
{
  "user": {
    "id": "123",
    "username": "admin",
    "email": "admin@ambulance.sa",
    "role": "admin",
    "fullName": "أحمد محمد",
    "arabicName": "أحمد محمد",
    "isActive": true
  },
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "expiresIn": 3600
}
```

#### Step 1.3: Test Authentication
```bash
# Test login from frontend
# Update environment.ts with your backend URL
# Try logging in through the app
```

---

### **Phase 2: Core Entities (Days 2-3)**

#### Step 2.1: Drivers API (Day 2 Morning)
```
GET    /api/drivers
GET    /api/drivers/:id
POST   /api/drivers
PUT    /api/drivers/:id
DELETE /api/drivers/:id
PATCH  /api/drivers/:id/status
```

**Sample GET /api/drivers response:**
```json
{
  "data": [
    {
      "id": "d1",
      "username": "driver1",
      "arabicName": "أحمد السائق",
      "name": "Ahmed Driver",
      "arabicStatus": "متاح",
      "statusColor": "#10B981",
      "tripsToday": 5,
      "amountOwed": 250.50,
      "isAccountCleared": false,
      "isActive": true,
      "imageUrl": "https://...",
      "imageAlt": "صورة أحمد"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

#### Step 2.2: Vehicles API (Day 2 Afternoon)
```
GET    /api/vehicles
GET    /api/vehicles/:id
POST   /api/vehicles
PUT    /api/vehicles/:id
DELETE /api/vehicles/:id
```

#### Step 2.3: Paramedics API (Day 3 Morning)
Similar structure to Drivers API.

#### Step 2.4: Test Core Entities
```bash
# Test from frontend:
# 1. Navigate to /admin/drivers-list
# 2. Try creating a new driver
# 3. Update driver status
# 4. Filter and search
```

---

### **Phase 3: Trips (Days 4-5)**

#### Step 3.1: Trips API (Day 4)
```
GET    /api/trips
GET    /api/trips/:id
POST   /api/trips
PUT    /api/trips/:id
DELETE /api/trips/:id
```

**Critical: Support all filters**
```
?status=تم النقل
?driverId=123
?paramedicId=456
?startDate=2023-01-01&endDate=2023-12-31
?patientName=أحمد
?page=1&limit=10
```

#### Step 3.2: Pending Trips API (Day 5)
```
GET    /api/pending-trips
POST   /api/pending-trips/:id/accept
POST   /api/pending-trips/:id/reject
```

---

### **Phase 4: Supporting Features (Days 6-7)**

#### Fuel & Maintenance
```
GET    /api/fuel-records
POST   /api/fuel-records
GET    /api/maintenance-records
POST   /api/maintenance-records
```

#### Settings
```
GET    /api/settings/maintenance-types
POST   /api/settings/maintenance-types
GET    /api/settings/common-locations
POST   /api/settings/common-locations
```

---

## 🔧 Implementation Tips

### **1. Use This Response Format**
```json
{
  "data": [...],     // or single object
  "total": 100,      // for paginated lists
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

### **2. Error Response Format**
```json
{
  "error": {
    "message": "خطأ في المصادقة",
    "code": "AUTH_FAILED",
    "statusCode": 401
  }
}
```

### **3. JWT Token Payload**
```json
{
  "userId": "123",
  "role": "admin",
  "iat": 1234567890,
  "exp": 1234571490
}
```

### **4. Middleware Checklist**
- ✅ CORS enabled for frontend URL
- ✅ JWT verification middleware
- ✅ Role-based access control
- ✅ Request validation
- ✅ Error handling

---

## 🧪 Testing Checklist

### **Authentication**
- [ ] Can login with valid credentials
- [ ] Login fails with invalid credentials
- [ ] Token is returned in response
- [ ] Token refresh works
- [ ] Logout clears session

### **Authorization**
- [ ] Admin can access /api/drivers
- [ ] Driver cannot access /api/drivers
- [ ] Unauthenticated requests return 401

### **Drivers CRUD**
- [ ] Can fetch driver list
- [ ] Can create new driver
- [ ] Can update driver
- [ ] Can delete driver
- [ ] Filtering works
- [ ] Pagination works

### **Trips**
- [ ] Can create trip with financial calculations
- [ ] Date filters work
- [ ] Status filters work
- [ ] Can update trip status

---

## 📦 Sample Seed Data

```sql
-- Sample Admin User
INSERT INTO users (id, username, email, password_hash, role, full_name, arabic_name, is_active)
VALUES (
  gen_random_uuid(),
  'admin',
  'admin@ambulance.sa',
  '$2b$10$...',  -- Hash of 'password123'
  'admin',
  'Admin User',
  'مدير النظام',
  true
);

-- Sample Driver
INSERT INTO users (id, username, email, password_hash, role, full_name, arabic_name, is_active)
VALUES (
  gen_random_uuid(),
  'driver1',
  'driver1@ambulance.sa',
  '$2b$10$...',
  'driver',
  'Ahmed Driver',
  'أحمد السائق',
  true
);
```

---

## 🔍 Debugging Tips

### **Frontend is not receiving token:**
```javascript
// Check browser console
// Network tab -> Headers -> Authorization should be "Bearer ..."
```

### **CORS error:**
```javascript
// Backend must allow frontend origin
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));
```

### **401 Unauthorized:**
```javascript
// Check if token is being sent
// Check if token is valid and not expired
// Check if middleware is correctly verifying token
```

---

## 📚 Full API Documentation

See the main code review document for:
- ✅ Complete list of 150+ endpoints
- ✅ Full database schema (18 tables)
- ✅ Request/response formats
- ✅ Relationships diagram

---

## ⚡ Quick Backend Setup (Node.js Example)

```bash
# Create backend project
mkdir ambulance-backend
cd ambulance-backend
npm init -y

# Install dependencies
npm install express cors bcrypt jsonwebtoken pg

# Install dev dependencies
npm install -D typescript @types/node @types/express nodemon

# Create basic structure
mkdir src
mkdir src/routes
mkdir src/controllers
mkdir src/middleware
mkdir src/models

# Create .env file
echo "DATABASE_URL=postgresql://user:pass@localhost:5432/ambulance_system" > .env
echo "JWT_SECRET=your-super-secret-key" >> .env
echo "PORT=3000" >> .env
```

---

## 🎓 Learning Resources

- **JWT:** https://jwt.io/introduction
- **bcrypt:** For password hashing
- **PostgreSQL:** Official documentation
- **Express.js:** https://expressjs.com/

---

## ✅ Success Criteria

You'll know backend is working when:
1. ✅ You can login from the frontend app
2. ✅ Token is stored in localStorage
3. ✅ Admin can see the drivers list (fetched from DB)
4. ✅ Can create a new driver from the frontend
5. ✅ Driver appears in the database

---

**Start with authentication, test it thoroughly, then move to drivers API. Build incrementally!**

Good luck! 🚀
