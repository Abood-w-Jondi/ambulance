import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import {
  MedicalForm,
  MedicalFormData,
  MEDICAL_FORM_SECTIONS
} from '../../shared/models/medical-form.model';
import { MedicalFormService } from '../../shared/services/medical-form.service';
import { ToastService } from '../../shared/services/toast.service';
import { AuthService } from '../../shared/services/auth.service';

// Configuration interfaces for JSON-driven form rendering
interface FieldConfig {
  type: 'text' | 'textarea' | 'checkbox' | 'checkboxGroup' | 'subsection' | 'table';
  key: string;
  label: string;
  placeholder?: string;
  colClass?: string;
  rows?: number;
  fields?: FieldConfig[];
  tableConfig?: TableConfig;
}

interface TableConfig {
  columns: string[];
  rows: TableRowConfig[];
  checklist ?: boolean
}

interface TableRowConfig {
  key: string;
  label: string;
}

interface SectionConfig {
  key: string;
  title: string;
  icon: string;
  fields: FieldConfig[];
}

@Component({
  selector: 'app-medical-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './medical-form.component.html',
  styleUrl: './medical-form.component.css'
})
export class MedicalFormComponent implements OnInit, OnDestroy {
  tripId: string = '';
  medicalForm: MedicalForm | null = null;
  formData: MedicalFormData = {};

  // Loading states
  isLoading: boolean = false;
  isSaving: boolean = false;
  isCompleting: boolean = false;

  // Form state
  isLocked: boolean = false;
  isComplete: boolean = false;
  completionPercentage: number = 0;
  canEdit: boolean = false;
  isAdmin: boolean = false;

  // UI state
  expandedSections: { [key: string]: boolean } = {};
  showCompleteConfirmModal: boolean = false;

  // Auto-save
  private saveSubject = new Subject<void>();
  private destroy$ = new Subject<void>();

  // Section metadata
  sections = MEDICAL_FORM_SECTIONS;

  // Neurovascular sites for multi-site assessment
  neurovascularSites = ['RA', 'LA', 'RL', 'LL'];

  // JSON Configuration for all form sections
  sectionConfigs: SectionConfig[] = [
    // Section 1: Patient Information
    {
      key: 'Patient_Information',
      title: 'معلومات المريض',
      icon: 'fa-user-injured',
      fields: [
        { type: 'text', key: 'Patient_Name', label: 'اسم المريض', colClass: 'col-md-6' },
        { type: 'text', key: 'Date', label: 'التاريخ', colClass: 'col-md-6' },
        { type: 'textarea', key: 'Patient_Complaint', label: 'شكوى المريض', colClass: 'col-12', rows: 3 },
        { type: 'text', key: 'Time_to_Treatment_Area', label: 'الوقت إلى منطقة العلاج', colClass: 'col-md-6' },
        { type: 'text', key: 'X_Ray', label: 'الأشعة السينية', colClass: 'col-md-6' },
        { type: 'textarea', key: 'Narrative', label: 'السرد', colClass: 'col-12', rows: 4 }
      ]
    },
    // Section 2: Vital Signs
    {
      key: 'Vital_Signs',
      title: 'العلامات الحيوية',
      icon: 'fa-heartbeat',
      fields: [
        { type: 'text', key: 'BP', label: 'ضغط الدم (BP)', placeholder: '120/80', colClass: 'col-md-3' },
        { type: 'text', key: 'Resp', label: 'التنفس (Resp)', colClass: 'col-md-3' },
        { type: 'text', key: 'Pulse', label: 'النبض (Pulse)', colClass: 'col-md-3' },
        { type: 'text', key: 'Temp', label: 'الحرارة (Temp)', colClass: 'col-md-3' }
      ]
    },
    // Section 3: History and Social
    {
      key: 'History_and_Social',
      title: 'التاريخ الطبي والاجتماعي',
      icon: 'fa-history',
      fields: [
        { type: 'text', key: 'Tetanus', label: 'التيتانوس', colClass: 'col-md-6' },
        { type: 'text', key: 'Flu_Shot', label: 'لقاح الإنفلونزا', colClass: 'col-md-6' },
        {
          type: 'subsection',
          key: 'Social_Status',
          label: 'الحالة الاجتماعية',
          colClass: 'col-12',
          fields: [
            {
              type: 'checkboxGroup',
              key: 'Social_Status',
              label: '',
              colClass: 'col-12',
              fields: [
                { type: 'checkbox', key: 'Single', label: 'أعزب' },
                { type: 'checkbox', key: 'Married', label: 'متزوج' },
                { type: 'checkbox', key: 'Widowed', label: 'أرمل' },
                { type: 'checkbox', key: 'Divorced', label: 'مطلق' }
              ]
            }
          ]
        },
        {
          type: 'subsection',
          key: 'Alcohol_Tobacco',
          label: 'التبغ والكحول',
          colClass: 'col-12',
          fields: [
            { type: 'text', key: 'Tobacco', label: 'التبغ', colClass: 'col-md-4' },
            { type: 'text', key: 'ETOH_Use', label: 'استخدام الكحول', colClass: 'col-md-4' },
            { type: 'text', key: 'Freq', label: 'التكرار', colClass: 'col-md-4' }
          ]
        },
        {
          type: 'subsection',
          key: 'Visual_Acuity',
          label: 'حدة البصر',
          colClass: 'col-12',
          fields: [
            { type: 'text', key: 'OU', label: 'OU', colClass: 'col-md-3' },
            { type: 'text', key: 'OD', label: 'OD', colClass: 'col-md-3' },
            { type: 'text', key: 'OS', label: 'OS', colClass: 'col-md-3' },
            { type: 'checkbox', key: 'Corrected', label: 'مصحح', colClass: 'col-md-3' }
          ]
        },
        {
          type: 'subsection',
          key: 'Family_History',
          label: 'التاريخ العائلي',
          colClass: 'col-12',
          fields: [
            {
              type: 'checkboxGroup',
              key: 'Family_History',
              label: '',
              colClass: 'col-12',
              fields: [
                { type: 'checkbox', key: 'Heart_Disease', label: 'أمراض القلب' },
                { type: 'checkbox', key: 'Cancer', label: 'السرطان' },
                { type: 'checkbox', key: 'Diabetes', label: 'السكري' }
              ]
            },
            { type: 'text', key: 'Other', label: 'أخرى (التاريخ العائلي)', colClass: 'col-12' }
          ]
        },
        {
          type: 'subsection',
          key: 'Past_Medical_History',
          label: 'التاريخ الطبي السابق',
          colClass: 'col-12',
          fields: [
            {
              type: 'checkboxGroup',
              key: 'Past_Medical_History',
              label: '',
              colClass: 'col-12',
              fields: [
                { type: 'checkbox', key: 'HTN', label: 'ارتفاع ضغط الدم' },
                { type: 'checkbox', key: 'Heart_Disease', label: 'أمراض القلب' },
                { type: 'checkbox', key: 'CVA', label: 'سكتة دماغية' },
                { type: 'checkbox', key: 'Cancer', label: 'السرطان' },
                { type: 'checkbox', key: 'Diabetes', label: 'السكري' }
              ]
            },
            { type: 'text', key: 'Other', label: 'أخرى (التاريخ الطبي)', colClass: 'col-12' }
          ]
        },
        {
          type: 'subsection',
          key: 'Past_Surgeries',
          label: 'العمليات الجراحية السابقة',
          colClass: 'col-12',
          fields: [
            {
              type: 'checkboxGroup',
              key: 'Past_Surgeries',
              label: '',
              colClass: 'col-12',
              fields: [
                { type: 'checkbox', key: 'Gall_Bladder', label: 'المرارة' },
                { type: 'checkbox', key: 'Appendix', label: 'الزائدة الدودية' },
                { type: 'checkbox', key: 'Heart', label: 'القلب' },
                { type: 'checkbox', key: 'Hysterectomy', label: 'استئصال الرحم' },
                { type: 'checkbox', key: 'Lung', label: 'الرئة' }
              ]
            },
            { type: 'text', key: 'Other', label: 'أخرى (العمليات الجراحية)', colClass: 'col-12' }
          ]
        },
        {
          type: 'subsection',
          key: 'Infectious_History',
          label: 'التاريخ المعدي',
          colClass: 'col-12',
          fields: [
            {
              type: 'checkboxGroup',
              key: 'Infectious_History',
              label: '',
              colClass: 'col-12',
              fields: [
                { type: 'checkbox', key: 'HIV', label: 'HIV' },
                { type: 'checkbox', key: 'COPD', label: 'COPD' },
                { type: 'checkbox', key: 'Asthma', label: 'الربو' },
                { type: 'checkbox', key: 'Seizures', label: 'النوبات' },
                { type: 'checkbox', key: 'Diabetes', label: 'السكري' }
              ]
            },
            { type: 'text', key: 'Other', label: 'أخرى (التاريخ المعدي)', colClass: 'col-12' }
          ]
        }
      ]
    },
    // Section 4: Medication and Allergies
    {
      key: 'Medication_and_Allergies',
      title: 'الأدوية والحساسية',
      icon: 'fa-pills',
      fields: [
        {
          type: 'subsection',
          key: 'Medication',
          label: 'الأدوية',
          colClass: 'col-12',
          fields: [
            {
              type: 'checkboxGroup',
              key: 'Medication',
              label: '',
              colClass: 'col-12',
              fields: [
                { type: 'checkbox', key: 'None', label: 'لا يوجد' },
                { type: 'checkbox', key: 'Unknown', label: 'غير معروف' }
              ]
            },
            { type: 'textarea', key: 'Details', label: 'تفاصيل الأدوية', colClass: 'col-12', rows: 3 }
          ]
        },
        {
          type: 'subsection',
          key: 'Allergies',
          label: 'الحساسية',
          colClass: 'col-12',
          fields: [
            {
              type: 'checkboxGroup',
              key: 'Allergies',
              label: '',
              colClass: 'col-12',
              fields: [
                { type: 'checkbox', key: 'None', label: 'لا يوجد' },
                { type: 'checkbox', key: 'Unknown', label: 'غير معروف' }
              ]
            },
            { type: 'textarea', key: 'Details', label: 'تفاصيل الحساسية', colClass: 'col-12', rows: 3 }
          ]
        }
      ]
    },
    // Section 5: Bleeding
    {
      key: 'Bleeding',
      title: 'النزيف',
      icon: 'fa-tint',
      fields: [
        {
          type: 'checkboxGroup',
          key: '',
          label: '',
          colClass: 'col-12',
          fields: [
            { type: 'checkbox', key: 'Present', label: 'موجود' },
            { type: 'checkbox', key: 'Absent', label: 'غير موجود' },
            { type: 'checkbox', key: 'OBO_Trauma', label: 'OBO صدمة' },
            { type: 'checkbox', key: 'Controlled', label: 'تحت السيطرة' },
            { type: 'checkbox', key: 'Moderate', label: 'معتدل' },
            { type: 'checkbox', key: 'Hemorrhage', label: 'نزيف حاد' }
          ]
        }
      ]
    },
    // Section 6: Physical Assessment
    {
      key: 'Physical_Assessment',
      title: 'التقييم الجسدي',
      icon: 'fa-stethoscope',
      fields: [
        {
          type: 'subsection',
          key: 'Mental_Status',
          label: 'الحالة العقلية',
          colClass: 'col-12',
          fields: [
            {
              type: 'checkboxGroup',
              key: 'Mental_Status',
              label: '',
              colClass: 'col-12',
              fields: [
                { type: 'checkbox', key: 'Alert_Oriented', label: 'متنبه وموجه' },
                { type: 'checkbox', key: 'Awake_Confused', label: 'مستيقظ مشوش' },
                { type: 'checkbox', key: 'Verbally_Responsive', label: 'يستجيب شفهيا' },
                { type: 'checkbox', key: 'Responds_to_Pain', label: 'يستجيب للألم' },
                { type: 'checkbox', key: 'Aphasic', label: 'فاقد النطق' },
                { type: 'checkbox', key: 'Combative', label: 'عدواني' },
                { type: 'checkbox', key: 'Unresponsive', label: 'غير مستجيب' }
              ]
            }
          ]
        },
        {
          type: 'subsection',
          key: 'Color',
          label: 'اللون',
          colClass: 'col-12',
          fields: [
            {
              type: 'checkboxGroup',
              key: 'Color',
              label: '',
              colClass: 'col-12',
              fields: [
                { type: 'checkbox', key: 'Pink', label: 'وردي' },
                { type: 'checkbox', key: 'Mottled', label: 'مرقط' },
                { type: 'checkbox', key: 'Cyanotic', label: 'زراق' },
                { type: 'checkbox', key: 'Jaundiced', label: 'يرقاني' },
                { type: 'checkbox', key: 'Pale', label: 'شاحب' }
              ]
            }
          ]
        },
        {
          type: 'subsection',
          key: 'Skin',
          label: 'الجلد',
          colClass: 'col-12',
          fields: [
            {
              type: 'checkboxGroup',
              key: 'Skin',
              label: '',
              colClass: 'col-12',
              fields: [
                { type: 'checkbox', key: 'Warm', label: 'دافئ' },
                { type: 'checkbox', key: 'Cool', label: 'بارد' },
                { type: 'checkbox', key: 'Hot', label: 'ساخن' },
                { type: 'checkbox', key: 'Dry', label: 'جاف' },
                { type: 'checkbox', key: 'Diaphoretic', label: 'متعرق' }
              ]
            }
          ]
        }
      ]
    },
    // Section 7: Skin Integrity
    {
      key: 'Skin_Integrity',
      title: 'سلامة الجلد',
      icon: 'fa-hand-paper',
      fields: [
        { type: 'checkbox', key: 'INTACT', label: 'سليم', colClass: 'col-12' },
        { type: 'textarea', key: 'OTHER', label: 'أخرى', colClass: 'col-12', rows: 3, placeholder: 'وصف أي مشاكل في سلامة الجلد...' }
      ]
    },
    // Section 8: Cardiovascular & Respiratory (Expanded)
    {
      key: 'Cardiovascular_Respiratory',
      title: 'القلب والجهاز التنفسي',
      icon: 'fa-lungs',
      fields: [
        {
          type: 'subsection',
          key: 'Shortness_of_Breath',
          label: 'ضيق التنفس (Shortness of Breath)',
          colClass: 'col-12',
          fields: [
            {
              type: 'checkboxGroup',
              key: 'Shortness_of_Breath',
              label: '',
              colClass: 'col-12',
              fields: [
                { type: 'checkbox', key: 'Yes', label: 'نعم' },
                { type: 'checkbox', key: 'No', label: 'لا' }
              ]
            },
            {
              type: 'checkboxGroup',
              key: 'Occurs',
              label: 'يحدث عند:',
              colClass: 'col-12',
              fields: [
                { type: 'checkbox', key: 'Ambulating', label: 'المشي/الحركة' },
                { type: 'checkbox', key: 'Resting', label: 'الراحة' },
                { type: 'checkbox', key: 'Eating', label: 'الأكل' }
              ]
            },
            { type: 'text', key: 'Freq', label: 'التكرار', colClass: 'col-md-12' },
            { type: 'text', key: 'Relieved_by', label: 'يرتاح عند', colClass: 'col-md-6' },
            { type: 'text', key: 'Worsens', label: 'ما يزيده سوءاً', colClass: 'col-md-6' },
            { type: 'text', key: 'How_Long', label: 'المدة', colClass: 'col-md-3' }
          ]
        },
        {
          type: 'subsection',
          key: 'Coughing',
          label: 'السعال (Coughing)',
          colClass: 'col-12',
          fields: [
            {
              type: 'checkboxGroup',
              key: 'Coughing',
              label: '',
              colClass: 'col-12',
              fields: [
                { type: 'checkbox', key: 'Yes', label: 'نعم' },
                { type: 'checkbox', key: 'No', label: 'لا' },
                { type: 'checkbox', key: 'Non_Productive', label: 'غير منتج (جاف)' },
                { type: 'checkbox', key: 'Productive', label: 'منتج (بلغم)' }
              ]
            },
            { type: 'text', key: 'Amount', label: 'الكمية', colClass: 'col-md-4' },
            { type: 'text', key: 'Color', label: 'اللون', colClass: 'col-md-4' },
            { type: 'text', key: 'How_Long', label: 'منذ متى', colClass: 'col-md-4' }
          ]
        },
        {
          type: 'subsection',
          key: 'Cardiac_Monitor',
          label: 'جهاز مراقبة القلب',
          colClass: 'col-12',
          fields: [
            { type: 'checkbox', key: 'N_A', label: 'غير متاح (N/A)', colClass: 'col-12' },
            { type: 'text', key: 'Rate', label: 'المعدل (Rate)', colClass: 'col-md-6' },
            { type: 'text', key: 'Rhythm', label: 'الإيقاع (Rhythm)', colClass: 'col-md-6' }
          ]
        },
        {
          type: 'subsection',
          key: 'SpO2',
          label: 'تشبع الأكسجين (SpO2)',
          colClass: 'col-12',
          fields: [
            { type: 'checkbox', key: 'N_A', label: 'غير متاح', colClass: 'col-md-12' },
            { type: 'text', key: 'O2_Sat_Pct', label: 'نسبة التشبع %', colClass: 'col-md-4' },
            {
              type: 'checkboxGroup',
              key: 'On_O2',
              label: 'على الأكسجين؟',
              colClass: 'col-md-8',
              fields: [
                { type: 'checkbox', key: 'Yes', label: 'نعم' },
                { type: 'checkbox', key: 'No', label: 'لا' }
              ]
            }
          ]
        },
        {
          type: 'subsection',
          key: 'Respirations',
          label: 'التنفس (Respirations)',
          colClass: 'col-12',
          fields: [
            {
              type: 'checkboxGroup',
              key: 'Respirations',
              label: '',
              colClass: 'col-12',
              fields: [
                { type: 'checkbox', key: 'Normal', label: 'طبيعي' },
                { type: 'checkbox', key: 'Apneic', label: 'انقطاع نفس' },
                { type: 'checkbox', key: 'Weak_Resp', label: 'تنفس ضعيف' },
                { type: 'checkbox', key: 'Dyspneic', label: 'عسر تنفس' },
                { type: 'checkbox', key: 'Coughing', label: 'سعال' },
                { type: 'checkbox', key: 'Wheezing', label: 'أزيز' },
                { type: 'checkbox', key: 'Retracting', label: 'انسحاب صدري' }
              ]
            }
          ]
        },
        {
          type: 'subsection',
          key: 'Lungs_Auscultation',
          label: 'تسمع الرئتين (Lungs Auscultation)',
          colClass: 'col-12',
          fields: [
            {
              type: 'checkboxGroup',
              key: 'Lungs_Auscultation',
              label: '',
              colClass: 'col-12',
              fields: [
                { type: 'checkbox', key: 'Clear', label: 'صافي' },
                { type: 'checkbox', key: 'Right', label: 'اليمين' },
                { type: 'checkbox', key: 'Left', label: 'اليسار' }
              ]
            },
            { type: 'text', key: 'Other', label: 'أخرى', colClass: 'col-md-6' },
            { type: 'text', key: 'Comments', label: 'ملاحظات', colClass: 'col-md-6' }
          ]
        }
      ]
    },
    // Section 9: Neurovascular
    {
      key: 'Neurovascular',
      title: 'التقييم العصبي الوعائي',
      icon: 'fa-brain',
      fields: [
        { type: 'checkbox', key: 'N_A', label: 'غير متاح', colClass: 'col-12' },
        {
          type: 'table',
          key: 'COLOR',
          label: 'اللون',
          colClass: 'col-12',
          tableConfig: {
            checklist:true,
            columns: ['RA', 'LA', 'RL', 'LL'],
            rows: [
              { key: 'PINK', label: 'وردي' },
              { key: 'PALE', label: 'شاحب' }
            ]
          }
        },
        {
          type: 'table',
          key: 'TEMP',
          label: 'الحرارة',
          colClass: 'col-12',
          tableConfig: {
            checklist:true,
            columns: ['RA', 'LA', 'RL', 'LL'],
            rows: [
              { key: 'WARM', label: 'دافئ' },
              { key: 'COOL', label: 'بارد' }
            ]
          }
        },
        {
          type: 'table',
          key: 'MOTION',
          label: 'الحركة',
          colClass: 'col-12',
          tableConfig: {
            checklist:true,
            columns: ['RA', 'LA', 'RL', 'LL'],
            rows: [
              { key: 'FULL', label: 'كامل' },
              { key: 'PARTIAL', label: 'جزئي' }
            ]
          }
        },
        {
          type: 'table',
          key: 'SENSATION',
          label: 'الإحساس',
          colClass: 'col-12',
          tableConfig: {
            checklist:true,
            columns: ['RA', 'LA', 'RL', 'LL'],
            rows: [
              { key: 'INTACT', label: 'سليم' },
              { key: 'NUMBNESS', label: 'خدر' },
              { key: 'PAIN', label: 'ألم' },
              { key: 'TINGLING', label: 'وخز' }
            ]
          }
        }
      ]
    },
    // Section 10: Abdomen
    {
      key: 'Abdomen',
      title: 'البطن',
      icon: 'fa-procedures',
      fields: [
        {
          type: 'checkboxGroup',
          key: '',
          label: '',
          colClass: 'col-12',
          fields: [
            { type: 'checkbox', key: 'Normal', label: 'طبيعي' },
            { type: 'checkbox', key: 'Flat', label: 'مسطح' },
            { type: 'checkbox', key: 'Distended', label: 'منتفخ' },
            { type: 'checkbox', key: 'Vomiting', label: 'قيء' },
            { type: 'checkbox', key: 'Diarrhea', label: 'إسهال' },
            { type: 'checkbox', key: 'Hematemesis', label: 'قيء دموي' },
            { type: 'checkbox', key: 'Melena', label: 'براز أسود' },
            { type: 'checkbox', key: 'Continuous', label: 'مستمر' },
            { type: 'checkbox', key: 'Intermittent', label: 'متقطع' },
            { type: 'checkbox', key: 'Present', label: 'موجود' },
            { type: 'checkbox', key: 'Absent', label: 'غير موجود' }
          ]
        },
        {
          type: 'subsection',
          key: 'Bowel_Sounds',
          label: 'أصوات الأمعاء',
          colClass: 'col-12',
          fields: [
            { type: 'checkbox', key: 'N_A', label: 'غير متاح (N/A)', colClass: 'col-12' },
            { type: 'textarea', key: 'Description', label: 'الوصف', colClass: 'col-12' }
          ]
        },
        { type: 'text', key: 'How_Long', label: 'كم من الوقت', colClass: 'col-md-6' },
        { type: 'text', key: 'Comments', label: 'تعليقات', colClass: 'col-md-6' }
      ]
    },
    // Section 11: OB/GYN
    {
      key: 'OB_GYN',
      title: 'النساء والتوليد',
      icon: 'fa-baby',
      fields: [
        { type: 'text', key: 'VAG_D_C', label: 'إفرازات مهبلية', colClass: 'col-md-6' },
        { type: 'text', key: 'COLOR', label: 'اللون', colClass: 'col-md-6' },
        { type: 'text', key: 'QUANT_PAD_CT', label: 'عدد الفوط', colClass: 'col-md-4' },
        { type: 'text', key: 'BLEEDING', label: 'النزيف', colClass: 'col-md-4' },
        { type: 'text', key: 'FHT', label: 'نبضات قلب الجنين (FHT)', colClass: 'col-md-4' }
      ]
    },
    // Section 12: Neurological
    {
      key: 'Neurological',
      title: 'الفحص العصبي',
      icon: 'fa-head-side-virus',
      fields: [
        { type: 'checkbox', key: 'NORMAL', label: 'طبيعي', colClass: 'col-12' },
        { type: 'text', key: 'PARALYSIS', label: 'الشلل', colClass: 'col-md-4' },
        { type: 'text', key: 'PUPILS', label: 'البؤبؤات', colClass: 'col-md-4' },
        { type: 'text', key: 'SENSORY_LOSS', label: 'فقدان الحس', colClass: 'col-md-4' }
      ]
    },
    // Section 13: General
    {
      key: 'General',
      title: 'عام',
      icon: 'fa-clipboard-list',
      fields: [
        { type: 'textarea', key: 'Comments', label: 'تعليقات', colClass: 'col-12', rows: 4, placeholder: 'أي ملاحظات أو تعليقات إضافية...' },
        { type: 'text', key: 'Time_Assessment_Completed', label: 'وقت إتمام التقييم', colClass: 'col-md-6', placeholder: 'مثال: 14:30' },
        { type: 'text', key: 'Signature', label: 'التوقيع', colClass: 'col-md-6', placeholder: 'اسم الضابط/المسعف' }
      ]
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private medicalFormService: MedicalFormService,
    private toastService: ToastService,
    private authService: AuthService
  ) {
    this.tripId = this.route.snapshot.paramMap.get('tripId') || '';
  }

  ngOnInit(): void {
    if (!this.tripId) {
      this.toastService.error('معرّف الرحلة مفقود');
      this.router.navigate(['/user/my-trips']);
      return;
    }

    this.isAdmin = this.authService.currentUser()?.role === 'admin';
    this.loadMedicalForm();
    this.setupAutoSave();

    // Expand first section by default
    if (this.sections.length > 0) {
      this.expandedSections[this.sections[0].key] = true;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMedicalForm(): void {
    this.isLoading = true;
    this.medicalFormService.getMedicalForm(this.tripId).subscribe({
      next: (form) => {
        this.medicalForm = form;
        this.formData = form.formData || {};
        this.isLocked = form.isLocked;
        this.isComplete = form.isComplete;
        this.completionPercentage = form.completionPercentage;
        this.canEdit = form.canEdit || false;
        this.isAdmin = form.isAdmin || false;

        // Initialize nested objects if they don't exist
        this.initializeFormStructure();

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load medical form:', error);
        this.toastService.error('فشل تحميل النموذج الطبي');
        this.isLoading = false;
      }
    });
  }

  initializeFormStructure(): void {
    // Initialize all sections if they don't exist
    if (!this.formData.Patient_Information) this.formData.Patient_Information = {};
    if (!this.formData.Vital_Signs) this.formData.Vital_Signs = {};
    if (!this.formData.History_and_Social) this.formData.History_and_Social = {};
    if (!this.formData.Medication_and_Allergies) this.formData.Medication_and_Allergies = {};
    if (!this.formData.Bleeding) this.formData.Bleeding = {};
    if (!this.formData.Physical_Assessment) this.formData.Physical_Assessment = {};
    if (!this.formData.Skin_Integrity) this.formData.Skin_Integrity = {};
    if (!this.formData.Cardiovascular_Respiratory) this.formData.Cardiovascular_Respiratory = {};
    if (!this.formData.Neurovascular) this.formData.Neurovascular = {};
    if (!this.formData.Abdomen) this.formData.Abdomen = {};
    if (!this.formData.OB_GYN) this.formData.OB_GYN = {};
    if (!this.formData.Neurological) this.formData.Neurological = {};
    if (!this.formData.General) this.formData.General = {};

    // Initialize nested objects in History and Social
    if (!this.formData.History_and_Social?.Social_Status) this.formData.History_and_Social.Social_Status = {};
    if (!this.formData.History_and_Social?.Alcohol_Tobacco) this.formData.History_and_Social.Alcohol_Tobacco = {};
    if (!this.formData.History_and_Social?.Visual_Acuity) this.formData.History_and_Social.Visual_Acuity = {};
    if (!this.formData.History_and_Social?.Family_History) this.formData.History_and_Social.Family_History = {};
    if (!this.formData.History_and_Social?.Past_Medical_History) this.formData.History_and_Social.Past_Medical_History = {};
    if (!this.formData.History_and_Social?.Past_Surgeries) this.formData.History_and_Social.Past_Surgeries = {};
    if (!this.formData.History_and_Social?.Infectious_History) this.formData.History_and_Social.Infectious_History = {};

    // Initialize Medication and Allergies
    if (!this.formData.Medication_and_Allergies?.Medication) this.formData.Medication_and_Allergies.Medication = {};
    if (!this.formData.Medication_and_Allergies?.Allergies) this.formData.Medication_and_Allergies.Allergies = {};

    // Initialize Physical Assessment
    if (!this.formData.Physical_Assessment?.Mental_Status) this.formData.Physical_Assessment.Mental_Status = {};
    if (!this.formData.Physical_Assessment?.Color) this.formData.Physical_Assessment.Color = {};
    if (!this.formData.Physical_Assessment?.Skin) this.formData.Physical_Assessment.Skin = {};

    // Initialize Cardiovascular Respiratory
    const cvr = this.formData.Cardiovascular_Respiratory;
    if (cvr) {
      if (!cvr.Shortness_of_Breath) cvr.Shortness_of_Breath = {};
      if (!cvr.Shortness_of_Breath?.Occurs) cvr.Shortness_of_Breath.Occurs = {};
      if (!cvr.Coughing) cvr.Coughing = {};
      if (!cvr.Cardiac_Monitor) cvr.Cardiac_Monitor = {};
      if (!cvr.SpO2) cvr.SpO2 = {};
      if (!cvr.SpO2?.On_O2) cvr.SpO2.On_O2 = {};
      if (!cvr.Respirations) cvr.Respirations = {};
      if (!cvr.Lungs_Auscultation) cvr.Lungs_Auscultation = {};
    }

    // Initialize Neurovascular arrays
    const nv = this.formData.Neurovascular;
    if (nv) {
      if (!nv.COLOR) nv.COLOR = {};
      if (!nv.COLOR.PINK) nv.COLOR.PINK = ['', '', '', ''];
      if (!nv.COLOR.PALE) nv.COLOR.PALE = ['', '', '', ''];
      if (!nv.TEMP) nv.TEMP = {};
      if (!nv.TEMP.WARM) nv.TEMP.WARM = ['', '', '', ''];
      if (!nv.TEMP.COOL) nv.TEMP.COOL = ['', '', '', ''];
      if (!nv.MOTION) nv.MOTION = {};
      if (!nv.MOTION.FULL) nv.MOTION.FULL = ['', '', '', ''];
      if (!nv.MOTION.PARTIAL) nv.MOTION.PARTIAL = ['', '', '', ''];
      if (!nv.SENSATION) nv.SENSATION = {};
      if (!nv.SENSATION.INTACT) nv.SENSATION.INTACT = ['', '', '', ''];
      if (!nv.SENSATION.NUMBNESS) nv.SENSATION.NUMBNESS = ['', '', '', ''];
      if (!nv.SENSATION.PAIN) nv.SENSATION.PAIN = ['', '', '', ''];
      if (!nv.SENSATION.TINGLING) nv.SENSATION.TINGLING = ['', '', '', ''];
    }

    // Initialize Abdomen
    if (!this.formData.Abdomen?.Bowel_Sounds) this.formData.Abdomen.Bowel_Sounds = {};
  }

  setupAutoSave(): void {
    this.saveSubject
      .pipe(
        debounceTime(2000), // Wait 2 seconds after last change
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.saveForm();
      });
  }

  onFieldChange(): void {
    if (!this.canEdit) return;

    this.isSaving = true;
    this.saveSubject.next();
  }

  saveForm(): void {
    if (!this.canEdit || this.isLocked) {
      this.isSaving = false;
      return;
    }

    this.medicalFormService.updateMedicalForm(this.tripId, this.formData).subscribe({
      next: (updatedForm) => {
        this.medicalForm = updatedForm;
        this.completionPercentage = updatedForm.completionPercentage;
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Failed to save medical form:', error);
        this.toastService.error('فشل حفظ النموذج');
        this.isSaving = false;
      }
    });
  }

  openCompleteConfirmModal(): void {
    this.showCompleteConfirmModal = true;
  }

  closeCompleteConfirmModal(): void {
    this.showCompleteConfirmModal = false;
  }

  confirmComplete(): void {
    this.isCompleting = true;

    this.medicalFormService.completeMedicalForm(this.tripId, this.formData).subscribe({
      next: (updatedForm) => {
        this.medicalForm = updatedForm;
        this.isLocked = true;
        this.isComplete = true;
        this.canEdit = false;
        this.completionPercentage = updatedForm.completionPercentage;
        this.isCompleting = false;
        this.closeCompleteConfirmModal();
        this.toastService.success('تم إغلاق النموذج الطبي بنجاح');
      },
      error: (error) => {
        console.error('Failed to complete medical form:', error);
        this.toastService.error('فشل إغلاق النموذج');
        this.isCompleting = false;
      }
    });
  }

  unlockForm(): void {
    if (!this.isAdmin) return;

    this.medicalFormService.unlockMedicalForm(this.tripId).subscribe({
      next: (updatedForm) => {
        this.medicalForm = updatedForm;
        this.isLocked = false;
        this.canEdit = true;
        this.toastService.success('تم فتح النموذج بنجاح');
      },
      error: (error) => {
        console.error('Failed to unlock medical form:', error);
        this.toastService.error('فشل فتح النموذج');
      }
    });
  }

  toggleSection(sectionKey: string): void {
    this.expandedSections[sectionKey] = !this.expandedSections[sectionKey];
  }

  goBack(): void {
    this.router.navigate(['/user/my-trips']);
  }

  getCompletionColor(): string {
    if (this.completionPercentage >= 75) return '#28a745'; // Green
    if (this.completionPercentage >= 50) return '#ffc107'; // Yellow
    if (this.completionPercentage >= 25) return '#fd7e14'; // Orange
    return '#dc3545'; // Red
  }

  // Helper methods for dynamic field access
  getFieldValue(sectionKey: string, fieldKey: string, subKey?: string): any {
    const section = this.formData[sectionKey as keyof MedicalFormData];
    if (!section) return undefined;

    if (subKey) {
      // For nested fields like History_and_Social.Social_Status.Single
      const subsection = (section as any)[fieldKey];
      return subsection ? subsection[subKey] : undefined;
    }

    return (section as any)[fieldKey];
  }

  setFieldValue(sectionKey: string, fieldKey: string, value: any, subKey?: string): void {
    const section = this.formData[sectionKey as keyof MedicalFormData];
    if (!section) return;

    if (subKey) {
      if (!(section as any)[fieldKey]) {
        (section as any)[fieldKey] = {};
      }
      (section as any)[fieldKey][subKey] = value;
    } else {
      (section as any)[fieldKey] = value;
    }
  }

  getTableValue(sectionKey: string, tableKey: string, rowKey: string, colIndex: number): any {
    const section = this.formData[sectionKey as keyof MedicalFormData];
    if (!section) return '';

    const table = (section as any)[tableKey];
    if (!table || !table[rowKey]) return '';

    return table[rowKey][colIndex] || '';
  }

  setTableValue(sectionKey: string, tableKey: string, rowKey: string, colIndex: number, value: any): void {
    const section = this.formData[sectionKey as keyof MedicalFormData];
    if (!section) return;

    if (!(section as any)[tableKey]) {
      (section as any)[tableKey] = {};
    }

    const table = (section as any)[tableKey];
    if (!table[rowKey]) {
      table[rowKey] = ['', '', '', ''];
    }

    table[rowKey][colIndex] = value;
  }
}
