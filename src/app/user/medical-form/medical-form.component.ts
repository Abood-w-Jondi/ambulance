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
}
