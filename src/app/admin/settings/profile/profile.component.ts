import { Component, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GlobalVarsService } from '../../../global-vars.service';
import { ToastService } from '../../../shared/services/toast.service';
import { UserService, UserProfile, UpdateProfileRequest } from '../../../shared/services/user.service';

type EducationLevel = 'EMI' | 'B' | 'I' | 'P';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
    // State
    isChangePasswordModalOpen = signal(false);
    isLoading = signal(false);

    // Education level options for dropdown
    educationLevelOptions: { value: EducationLevel; label: string }[] = [
        { value: 'EMI', label: 'EMI - طوارئ طبية متوسطة' },
        { value: 'B', label: 'B - أساسي' },
        { value: 'I', label: 'I - متوسط' },
        { value: 'P', label: 'P - مسعف' }
    ];

    // User profile
    userProfile = signal<UserProfile | null>({
  "id": '',
  "username": '',
  "email": '',
  "fullName": '',
  "arabicName": '',
  "phoneNumber": '',
  "jobTitle": '',
  "educationLevel": null,
  "role": 'driver',
  "isActive": true,
  "isEmailVerified": false,
  "profileImageUrl": null,
  "createdAt": '',
  "updatedAt": '',
  // Role-specific read-only fields for drivers
  "driverId": '',
  "amountOwed": 0,
  "driverStatus": '',
  "isAccountCleared": false
});

    // Form for editing
    profileForm: {
        arabicName: string;
        fullName: string;
        username: string;
        email: string;
        phoneNumber: string;
        jobTitle: string;
        educationLevel: EducationLevel | '';
    } = {
        arabicName: '',
        fullName: '',
        username: '',
        email: '',
        phoneNumber: '',
        jobTitle: '',
        educationLevel: ''
    };

    // Password change form - User must provide current password
    passwordForm = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    };

    constructor(
        private userService: UserService,
        private globalVars: GlobalVarsService,
        private router: Router,
        private toastService: ToastService
    ) {
        this.globalVars.setGlobalHeader('معلومات الحساب');
    }

    ngOnInit(): void {
        this.loadCurrentUserProfile();
    }

    /**
     * Load current logged-in user's profile from API
     */
    loadCurrentUserProfile(): void {
        this.isLoading.set(true);
        this.userService.getCurrentUserProfile().subscribe({
            next: (profile) => {
                this.userProfile.set(profile);

                this.loadProfileToForm();
                this.isLoading.set(false);
            },
            error: (error) => {
                this.toastService.error(error.message);
                this.isLoading.set(false);
            }
        });
    }

    getRoleLabel(role: string): string {
        const roleMap: { [key: string]: string } = {
            'admin': 'مدير النظام',
            'driver': 'سائق'
        };
        return roleMap[role] || role;
    }

    loadProfileToForm(): void {
        const profile = this.userProfile();
        if (!profile) return;

        this.profileForm = {
            arabicName: profile.arabicName || '',
            fullName: profile.fullName || '',
            username: profile.username || '',
            email: profile.email || '',
            phoneNumber: profile.phoneNumber || '',
            jobTitle: profile.jobTitle || '',
            educationLevel: profile.educationLevel || ''
        };
    }

    cancelChanges(): void {
        this.loadProfileToForm();
        this.toastService.info('تم إلغاء التعديلات');
    }

    saveProfile(): void {
        
        if (!this.validateProfile()) return;

        this.isLoading.set(true);

        const updateData: UpdateProfileRequest = {
            arabicName: this.profileForm.arabicName,
            fullName: this.profileForm.fullName,
            username: this.profileForm.username,
            email: this.profileForm.email,
            phoneNumber: this.profileForm.phoneNumber,
            jobTitle: this.profileForm.jobTitle,
            educationLevel: this.profileForm.educationLevel as EducationLevel || undefined
        };

        this.userService.updateProfile(updateData).subscribe({
            next: (updatedProfile) => {
                this.userProfile.set(updatedProfile);
                this.loadProfileToForm();
                this.toastService.success('تم تحديث المعلومات بنجاح');
                this.isLoading.set(false);
            },
            error: (error) => {
                this.toastService.error(error.message);
                this.isLoading.set(false);
            }
        });
    }

    validateProfile(): boolean {
        if (!this.profileForm.arabicName.trim()) {
            this.toastService.error('الرجاء إدخال الاسم بالعربي');
            return false;
        }
        if (!this.profileForm.username.trim()) {
            this.toastService.error('الرجاء إدخال اسم المستخدم');
            return false;
        }
        return true;
    }

    // Password change
    openChangePasswordModal(): void {
        this.resetPasswordForm();
        this.isChangePasswordModalOpen.set(true);
    }

    closeChangePasswordModal(): void {
        this.isChangePasswordModalOpen.set(false);
        this.resetPasswordForm();
    }

    changePassword(): void {
        if (!this.validatePassword()) return;

        this.isLoading.set(true);

        this.userService.changePassword(
            this.passwordForm.currentPassword,
            this.passwordForm.newPassword
        ).subscribe({
            next: () => {
                this.toastService.success('تم تغيير كلمة المرور بنجاح');
                this.closeChangePasswordModal();
                this.isLoading.set(false);
            },
            error: (error) => {
                this.toastService.error(error.message);
                this.isLoading.set(false);
            }
        });
    }

    validatePassword(): boolean {
        if (!this.passwordForm.currentPassword) {
            this.toastService.error('الرجاء إدخال كلمة المرور الحالية');
            return false;
        }
        if (!this.passwordForm.newPassword) {
            this.toastService.error('الرجاء إدخال كلمة المرور الجديدة');
            return false;
        }
        if (this.passwordForm.newPassword.length < 6) {
            this.toastService.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            return false;
        }
        if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
            this.toastService.error('كلمة المرور الجديدة غير متطابقة');
            return false;
        }
        if (this.passwordForm.currentPassword === this.passwordForm.newPassword) {
            this.toastService.error('كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية');
            return false;
        }
        return true;
    }

    resetPasswordForm(): void {
        this.passwordForm = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        };
    }

    // Profile image
    onImageSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                this.toastService.error('الرجاء اختيار صورة صحيحة');
                return;
            }

            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                this.toastService.error('حجم الصورة يجب أن لا يتجاوز 2 ميجابايت');
                return;
            }

            this.isLoading.set(true);

            const reader = new FileReader();
            reader.onload = (e: any) => {
                const imageData = e.target.result;

                const updateData: UpdateProfileRequest = {
                    profileImageUrl: imageData,
                    arabicName: this.profileForm.arabicName,
                    fullName: this.profileForm.fullName,
                    username: this.profileForm.username,
                };

                this.userService.updateProfile(updateData).subscribe({
                    next: (updatedProfile) => {
                        this.userProfile.set(updatedProfile);
                        this.toastService.success('تم تحديث الصورة الشخصية');
                        this.isLoading.set(false);
                    },
                    error: (error) => {
                        this.toastService.error(error.message);
                        this.isLoading.set(false);
                    }
                });
            };
            reader.readAsDataURL(file);
        }
    }

    removeProfileImage(): void {
        this.isLoading.set(true);

        const updateData: UpdateProfileRequest = {
            profileImageUrl: null
        };

        this.userService.updateProfile(updateData).subscribe({
            next: (updatedProfile) => {
                this.userProfile.set(updatedProfile);
                this.toastService.info('تم إزالة الصورة الشخصية');
                this.isLoading.set(false);
            },
            error: (error) => {
                this.toastService.error(error.message);
                this.isLoading.set(false);
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/admin/admin-dashboard']);
    }
}
