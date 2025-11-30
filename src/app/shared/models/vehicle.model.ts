/**
 * Complete Vehicle model with properties actually used in the application
 */
export interface Vehicle {
    // Basic Identification
    id: string;
    vehicleId: string;         // External/display ID (e.g., 'AMB-012')
    vehicleName: string;       // Arabic name (e.g., 'إسعاف النجوم')

    // Vehicle Specifications
    type: VehicleType;

    // Assignment & Status
    currentDriver: string | null;  // Driver name or null if unassigned
    currentDriverId?: string;      // Driver ID for backend reference
    status: VehicleStatus;

    // Administrative
    notes: string;
}

export type VehicleType = 'Type I Truck' | 'Type II Van' | 'Type III Cutaway';
export type VehicleStatus = 
  | 'متاح' 
  | 'في الطريق للمريض' 
  | 'في الموقع' 
  | 'في الطريق للمستشفى' 
  | 'في الوجهة' 
  | 'خارج الخدمة' 
  | 'إنهاء الخدمة'
  | 'صيانة' // يمكن إضافة صيانة إذا كانت حالة يدوية
  | 'في الخدمة'; // يمكن إضافة "في الخدمة" كحالة عامة تغطي معظم الحالات التشغيلية
export type VehicleFilterStatus = 'All' | VehicleStatus;

/**
 * Simplified vehicle reference for use in dropdowns and references
 */
export interface VehicleReference {
    id: string;
    vehicleId: string;
    vehicleName: string;
}
