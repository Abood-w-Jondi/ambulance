import { Injectable } from '@angular/core';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ValidationService {

  // Email validation
  isValidEmail(email: string): boolean {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Username validation (alphanumeric, underscore, dash, 3-20 chars)
  isValidUsername(username: string): boolean {
    if (!username) return false;
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    return usernameRegex.test(username);
  }

  // Password validation (minimum 6 characters)
  isValidPassword(password: string): boolean {
    return password && password.length >= 6;
  }

  // Phone number validation (Saudi format: 05XXXXXXXX)
  isValidPhone(phone: string): boolean {
    if (!phone) return false;
    const phoneRegex = /^05\d{8}$/;
    return phoneRegex.test(phone);
  }

  // Arabic name validation (Arabic characters and spaces)
  isValidArabicName(name: string): boolean {
    if (!name) return false;
    const arabicRegex = /^[\u0600-\u06FF\s0-9]+$/;
    return arabicRegex.test(name.trim()) && name.trim().length >= 2;
  }

  // English name validation (English characters and spaces)
  isValidEnglishName(name: string): boolean {
    if (!name) return true;
    const englishRegex = /^[a-zA-Z\s0-9]+$/;
    return englishRegex.test(name.trim()) && name.trim().length >= 2;
  }

  // Positive number validation
  isPositiveNumber(value: number | null | undefined): boolean {
    return value !== null && value !== undefined && value > 0;
  }

  // Non-negative number validation
  isNonNegativeNumber(value: number | null | undefined): boolean {
    return value !== null && value !== undefined && value >= 0;
  }

  // Number range validation
  isInRange(value: number | null | undefined, min: number, max: number): boolean {
    if (value === null || value === undefined) return false;
    return value >= min && value <= max;
  }

  // String length validation
  isValidLength(str: string, min: number, max: number): boolean {
    if (!str) return false;
    const length = str.trim().length;
    return length >= min && length <= max;
  }

  // Required field validation
  isRequired(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return true;
    if (typeof value === 'boolean') return true;
    return false;
  }

  // Validate driver form
  validateDriver(driver: any): ValidationResult {
    const errors: string[] = [];

    if (!this.isRequired(driver.arabicName)) {
      errors.push('الاسم بالعربي مطلوب');
    } else if (!this.isValidArabicName(driver.arabicName)) {
      errors.push('الاسم بالعربي يجب أن يحتوي على أحرف عربية فقط');
    }

    if (!this.isValidEnglishName(driver.name)) {
      errors.push('الاسم بالإنجليزي يجب أن يحتوي على أحرف إنجليزية فقط');
    }

    if (!driver.username && !driver.email) {
      errors.push('يجب إدخال اسم المستخدم أو البريد الإلكتروني');
    }

    if (driver.username && !this.isValidUsername(driver.username)) {
      errors.push('اسم المستخدم غير صالح (3-20 حرف، أحرف وأرقام فقط)');
    }

    if (driver.email && !this.isValidEmail(driver.email)) {
      errors.push('البريد الإلكتروني غير صالح');
    }

    if (driver.password && !this.isValidPassword(driver.password)) {
      errors.push('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    }

    if (driver.phoneNumber && !this.isValidPhone(driver.phoneNumber)) {
      errors.push('رقم الهاتف غير صالح (يجب أن يبدأ بـ 05)');
    }

    if (driver.tripsToday !== undefined && !this.isNonNegativeNumber(driver.tripsToday)) {
      errors.push('عدد الرحلات يجب أن يكون رقم موجب أو صفر');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }


  // Validate trip form
  validateTrip(trip: any): ValidationResult {
    const errors: string[] = [];

    if (!this.isRequired(trip.from)) {
      errors.push('موقع الانطلاق مطلوب');
    }

    if (!this.isRequired(trip.to)) {
      errors.push('موقع الوصول مطلوب');
    }

    if (!this.isRequired(trip.driverId)) {
      errors.push('يجب اختيار سائق');
    }

    if (!this.isRequired(trip.ambulanceId)) {
      errors.push('يجب اختيار سيارة إسعاف');
    }

    if (trip.distance && !this.isPositiveNumber(trip.distance)) {
      errors.push('المسافة يجب أن تكون رقم موجب');
    }

    if (trip.cost !== undefined && !this.isNonNegativeNumber(trip.cost)) {
      errors.push('التكلفة يجب أن تكون رقم موجب أو صفر');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Validate fuel record
  validateFuelRecord(fuel: any): ValidationResult {
    const errors: string[] = [];

    if (!this.isRequired(fuel.ambulanceId)) {
      errors.push('يجب اختيار سيارة إسعاف');
    }

    if (!this.isPositiveNumber(fuel.liters)) {
      errors.push('كمية الوقود يجب أن تكون رقم موجب');
    }

    if (!this.isPositiveNumber(fuel.cost)) {
      errors.push('التكلفة يجب أن تكون رقم موجب');
    }


    if (fuel.mileage !== undefined && !this.isNonNegativeNumber(fuel.mileage)) {
      errors.push('عداد الكيلومترات يجب أن يكون رقم موجب أو صفر');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Validate maintenance record
  validateMaintenanceRecord(maintenance: any): ValidationResult {
    const errors: string[] = [];

    if (!this.isRequired(maintenance.ambulanceId)) {
      errors.push('يجب اختيار سيارة إسعاف');
    }

    if (!this.isRequired(maintenance.type)) {
      errors.push('نوع الصيانة مطلوب');
    }


    if (!this.isPositiveNumber(maintenance.cost)) {
      errors.push('التكلفة يجب أن تكون رقم موجب');
    }

    if (!this.isRequired(maintenance.date)) {
      console.log(maintenance.date , '<<');
      errors.push('التاريخ مطلوب');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Validate withdrawal amount
  validateWithdrawal(amount: number, currentBalance: number): ValidationResult {
    const errors: string[] = [];

    if (!this.isPositiveNumber(amount)) {
      errors.push('المبلغ يجب أن يكون رقم موجب');
    } else if (amount > currentBalance) {
      errors.push('المبلغ المطلوب أكبر من الرصيد المتاح');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Validate balance reduction
  validateBalanceReduction(amount: number, amountOwed: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (amount > amountOwed) {
      if(amountOwed <= 0) {

      }
      else{
        const debtAmount = amount - amountOwed;
        warnings.push(`تحذير: هذا الدفع (${amount} ₪) يتجاوز المبلغ المستحق (${amountOwed} ₪). سيتم تسجيل دين بمبلغ ${debtAmount} ₪`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}
