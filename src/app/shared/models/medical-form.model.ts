/**
 * Medical Form Data Models
 * Based on H.json structure for paramedic medical assessments
 */

// ============================================================================
// Main Medical Form Interfaces
// ============================================================================

export interface MedicalForm {
  id: string;
  tripId: string;
  formData: MedicalFormData;
  completionPercentage: number;
  isComplete: boolean;
  completedAt?: Date | string;
  isLocked: boolean;
  lockedAt?: Date | string;
  lockedBy?: string;
  createdBy: string;
  lastUpdatedBy?: string;
  lastAdminEditAt?: Date | string;
  lastAdminEditBy?: string;
  createdAt: Date | string;
  updatedAt: Date | string;

  // Additional fields from API
  patientName?: string;
  day?: number;
  month?: number;
  year?: number;
  createdByName?: string;
  driverName?: string;
  canEdit?: boolean;
  isAdmin?: boolean;
}

export interface MedicalFormData {
  Patient_Information?: PatientInformation;
  Vital_Signs?: VitalSigns;
  History_and_Social?: HistoryAndSocial;
  Medication_and_Allergies?: MedicationAndAllergies;
  Bleeding?: Bleeding;
  Physical_Assessment?: PhysicalAssessment;
  Skin_Integrity?: SkinIntegrity;
  Cardiovascular_Respiratory?: CardiovascularRespiratory;
  Neurovascular?: Neurovascular;
  Abdomen?: Abdomen;
  OB_GYN?: ObGyn;
  Neurological?: Neurological;
  General?: General;
}

// ============================================================================
// Section 1: Patient Information
// ============================================================================

export interface PatientInformation {
  Patient_Name?: string;
  Date?: string;
  Patient_Complaint?: string;
  Time_to_Treatment_Area?: string;
  X_Ray?: string;
  Narrative?: string;
}

// ============================================================================
// Section 2: Vital Signs
// ============================================================================

export interface VitalSigns {
  BP?: string;
  Resp?: string;
  Pulse?: string;
  Temp?: string;
}

// ============================================================================
// Section 3: History and Social
// ============================================================================

export interface HistoryAndSocial {
  Tetanus?: string;
  Flu_Shot?: string;
  Social_Status?: SocialStatus;
  Alcohol_Tobacco?: AlcoholTobacco;
  Visual_Acuity?: VisualAcuity;
  Family_History?: FamilyHistory;
  Past_Medical_History?: PastMedicalHistory;
  Past_Surgeries?: PastSurgeries;
  Infectious_History?: InfectiousHistory;
}

export interface SocialStatus {
  Single?: boolean;
  Married?: boolean;
  Widowed?: boolean;
  Divorced?: boolean;
}

export interface AlcoholTobacco {
  Tobacco?: string;
  ETOH_Use?: string;
  Freq?: string;
}

export interface VisualAcuity {
  OU?: string;
  OD?: string;
  OS?: string;
  Corrected?: boolean;
}

export interface FamilyHistory {
  Heart_Disease?: boolean;
  Cancer?: boolean;
  Diabetes?: boolean;
  Other?: string;
}

export interface PastMedicalHistory {
  HTN?: boolean;
  Heart_Disease?: boolean;
  CVA?: boolean;
  Cancer?: boolean;
  Diabetes?: boolean;
  Other?: string;
}

export interface PastSurgeries {
  Gall_Bladder?: boolean;
  Appendix?: boolean;
  Heart?: boolean;
  Hysterectomy?: boolean;
  Lung?: boolean;
  Other?: string;
}

export interface InfectiousHistory {
  HIV?: boolean;
  COPD?: boolean;
  Asthma?: boolean;
  Seizures?: boolean;
  Diabetes?: boolean;
  Other?: string;
}

// ============================================================================
// Section 4: Medication and Allergies
// ============================================================================

export interface MedicationAndAllergies {
  Medication?: MedicationInfo;
  Allergies?: AllergyInfo;
}

export interface MedicationInfo {
  None?: boolean;
  Unknown?: boolean;
  Details?: string;
}

export interface AllergyInfo {
  None?: boolean;
  Unknown?: boolean;
  Details?: string;
}

// ============================================================================
// Section 5: Bleeding
// ============================================================================

export interface Bleeding {
  Present?: boolean;
  Absent?: boolean;
  OBO_Trauma?: boolean;
  Controlled?: boolean;
  Moderate?: boolean;
  Hemorrhage?: boolean;
}

// ============================================================================
// Section 6: Physical Assessment
// ============================================================================

export interface PhysicalAssessment {
  Mental_Status?: MentalStatus;
  Color?: ColorAssessment;
  Skin?: SkinAssessment;
}

export interface MentalStatus {
  Alert_Oriented?: boolean;
  Awake_Confused?: boolean;
  Verbally_Responsive?: boolean;
  Responds_to_Pain?: boolean;
  Aphasic?: boolean;
  Combative?: boolean;
  Unresponsive?: boolean;
}

export interface ColorAssessment {
  Pink?: boolean;
  Mottled?: boolean;
  Cyanotic?: boolean;
  Jaundiced?: boolean;
  Pale?: boolean;
}

export interface SkinAssessment {
  Warm?: boolean;
  Cool?: boolean;
  Hot?: boolean;
  Dry?: boolean;
  Diaphoretic?: boolean;
}

// ============================================================================
// Section 7: Skin Integrity
// ============================================================================

export interface SkinIntegrity {
  INTACT?: boolean;
  OTHER?: string;
}

// ============================================================================
// Section 8: Cardiovascular & Respiratory
// ============================================================================

export interface CardiovascularRespiratory {
  Shortness_of_Breath?: ShortnessOfBreath;
  Coughing?: Coughing;
  Cardiac_Monitor?: CardiacMonitor;
  SpO2?: SpO2;
  Respirations?: Respirations;
  Lungs_Auscultation?: LungsAuscultation;
}

export interface ShortnessOfBreath {
  Yes?: boolean;
  No?: boolean;
  Occurs?: ShortnessOfBreathOccurs;
  Relieved_by?: string;
  Freq?: string;
  How_Long?: string;
  Worsens?: string;
}

export interface ShortnessOfBreathOccurs {
  Ambulating?: boolean;
  Resting?: boolean;
  Eating?: boolean;
}

export interface Coughing {
  Yes?: boolean;
  No?: boolean;
  Non_Productive?: boolean;
  Productive?: boolean;
  Amount?: string;
  Color?: string;
  How_Long?: string;
}

export interface CardiacMonitor {
  N_A?: boolean;
  Rate?: string;
  Rhythm?: string;
}

export interface SpO2 {
  O2_Sat_Pct?: string;
  N_A?: boolean;
  On_O2?: OnO2;
}

export interface OnO2 {
  Yes?: boolean;
  No?: boolean;
}

export interface Respirations {
  Normal?: boolean;
  Apneic?: boolean;
  Weak_Resp?: boolean;
  Dyspneic?: boolean;
  Coughing?: boolean;
  Wheezing?: boolean;
  Retracting?: boolean;
}

export interface LungsAuscultation {
  Clear?: boolean;
  Right?: boolean;
  Left?: boolean;
  Other?: string;
  Comments?: string;
}

// ============================================================================
// Section 9: Neurovascular Assessment
// ============================================================================

export interface Neurovascular {
  N_A?: boolean;
  SITE?: string; // "RA LA RL LL"
  COLOR?: NeurovascularSiteArray;
  TEMP?: NeurovascularSiteArray;
  MOTION?: NeurovascularSiteArray;
  SENSATION?: NeurovascularSensationArray;
}

export interface NeurovascularSiteArray {
  PINK?: string[];
  PALE?: string[];
  WARM?: string[];
  COOL?: string[];
  FULL?: string[];
  PARTIAL?: string[];
}

export interface NeurovascularSensationArray {
  INTACT?: string[];
  NUMBNESS?: string[];
  PAIN?: string[];
  TINGLING?: string[];
}

// ============================================================================
// Section 10: Abdomen
// ============================================================================

export interface Abdomen {
  Normal?: boolean;
  Flat?: boolean;
  Distended?: boolean;
  Vomiting?: boolean;
  Diarrhea?: boolean;
  Hematemesis?: boolean;
  Melena?: boolean;
  Continuous?: boolean;
  Intermittent?: boolean;
  Present?: boolean;
  Absent?: boolean;
  How_Long?: string;
  Comments?: string;
  Bowel_Sounds?: BowelSounds;
}

export interface BowelSounds {
  N_A?: boolean;
  Description?: string;
}

// ============================================================================
// Section 11: OB/GYN
// ============================================================================

export interface ObGyn {
  VAG_D_C?: string;
  COLOR?: string;
  QUANT_PAD_CT?: string;
  BLEEDING?: string;
  FHT?: string;
}

// ============================================================================
// Section 12: Neurological
// ============================================================================

export interface Neurological {
  NORMAL?: boolean;
  PARALYSIS?: string;
  PUPILS?: string;
  SENSORY_LOSS?: string;
}

// ============================================================================
// Section 13: General
// ============================================================================

export interface General {
  Comments?: string;
  Time_Assessment_Completed?: string;
  Signature?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MedicalFormFilters {
  page?: number;
  limit?: number;
  isComplete?: boolean;
  isLocked?: boolean;
  startDate?: string;
  endDate?: string;
  dateFrom?: string;
  dateTo?: string;
  driverId?: string;
  driverName?: string;
  patientName?: string;
}

// ============================================================================
// Form Section Metadata (for UI rendering)
// ============================================================================

export interface FormSection {
  key: string;
  title: string;
  icon: string;
  fields: number; // Number of fields in this section
}

export const MEDICAL_FORM_SECTIONS: FormSection[] = [
  { key: 'Patient_Information', title: 'معلومات المريض', icon: 'fa-user-injured', fields: 6 },
  { key: 'Vital_Signs', title: 'العلامات الحيوية', icon: 'fa-heartbeat', fields: 4 },
  { key: 'History_and_Social', title: 'التاريخ الطبي والاجتماعي', icon: 'fa-history', fields: 50 },
  { key: 'Medication_and_Allergies', title: 'الأدوية والحساسية', icon: 'fa-pills', fields: 6 },
  { key: 'Bleeding', title: 'النزيف', icon: 'fa-tint', fields: 6 },
  { key: 'Physical_Assessment', title: 'التقييم الجسدي', icon: 'fa-stethoscope', fields: 17 },
  { key: 'Skin_Integrity', title: 'سلامة الجلد', icon: 'fa-hand-paper', fields: 2 },
  { key: 'Cardiovascular_Respiratory', title: 'القلب والجهاز التنفسي', icon: 'fa-lungs', fields: 40 },
  { key: 'Neurovascular', title: 'التقييم العصبي الوعائي', icon: 'fa-brain', fields: 25 },
  { key: 'Abdomen', title: 'البطن', icon: 'fa-procedures', fields: 14 },
  { key: 'OB_GYN', title: 'النساء والتوليد', icon: 'fa-baby', fields: 5 },
  { key: 'Neurological', title: 'الفحص العصبي', icon: 'fa-head-side-brain', fields: 4 },
  { key: 'General', title: 'عام', icon: 'fa-clipboard-list', fields: 3 }
];
