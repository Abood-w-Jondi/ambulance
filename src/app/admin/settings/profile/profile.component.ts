import { Component, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { GlobalVarsService } from '../../../global-vars.service';
import { ToastService } from '../../../shared/services/toast.service';

interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: 'admin' | 'driver' | 'officer';
    nationalId: string;
    dateOfBirth: Date;
    address: string;
    city: string;
    profileImage?: string;
}

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
    isAdminView = signal(false); // True when admin is viewing/editing another user's profile
    currentUserId = signal<string | null>(null);

    // Mock database of all users (would come from backend in real app)
    private allUsers = signal<UserProfile[]>([
        {
            id: '1',
            name: 'أحمد محمد العلي',
            email: 'admin@ambulance.sa',
            phone: '0501234567',
            role: 'admin',
            nationalId: '1234567890',
            dateOfBirth: new Date('1990-01-01'),
            address: 'حي النخيل، طريق الملك فهد',
            city: 'الرياض',
            profileImage: undefined
        }
    ]);

    // User profile (would come from auth service in real app)
    userProfile = signal<UserProfile>({
        id: '1',
        name: 'أحمد محمد العلي',
        email: 'admin@ambulance.sa',
        phone: '0501234567',
        role: 'admin',
        nationalId: '1234567890',
        dateOfBirth: new Date('1990-01-01'),
        address: 'حي النخيل، طريق الملك فهد',
        city: 'الرياض',
        profileImage: undefined
    });

    // Form for editing
    profileForm = {
        name: '',
        email: '',
        phone: '',
        nationalId: '',
        dateOfBirth: '',
        address: '',
        city: ''
    };

    // Password change form - Admin doesn't need current password
    passwordForm = {
        newPassword: '',
        confirmPassword: ''
    };

    constructor(
        private globalVars: GlobalVarsService,
        private router: Router,
        private route: ActivatedRoute,
        private toastService: ToastService
    ) {
        this.globalVars.setGlobalHeader('معلومات الحساب');
    }

    ngOnInit(): void {
        // Check if there's a userId in the route
        this.route.params.subscribe(params => {
            const userId = params['userId'];
            if (userId) {
                this.currentUserId.set(userId);
                this.isAdminView.set(true);
                this.loadUserById(userId);
            } else {
                // Load current logged-in user's profile
                this.loadProfileToForm();
            }
        });
    }

    loadUserById(userId: string): void {
        // In a real app, this would fetch from backend
        // For now, we'll check if it's a known user or create a mock profile
        const user = this.allUsers().find(u => u.id === userId);

        if (user) {
            this.userProfile.set(user);
        } else {
            // Create a mock user for demonstration (in real app, fetch from backend)
            const mockUser: UserProfile = {
                id: userId,
                name: 'مستخدم تجريبي',
                email: `user${userId}@ambulance.sa`,
                phone: '05012345678',
                role: 'driver',
                nationalId: '9876543210',
                dateOfBirth: new Date('1995-01-01'),
                address: 'عنوان تجريبي',
                city: 'الرياض',
                profileImage: undefined
            };
            this.userProfile.set(mockUser);
        }

        this.loadProfileToForm();
        this.globalVars.setGlobalHeader(`معلومات المستخدم: ${this.userProfile().name}`);
    }

    getRoleLabel(role: string): string {
        const roleMap: { [key: string]: string } = {
            'admin': 'مدير النظام',
            'driver': 'سائق',
            'officer': 'ضابط'
        };
        return roleMap[role] || role;
    }

    loadProfileToForm(): void {
        const profile = this.userProfile();
        this.profileForm = {
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            nationalId: profile.nationalId,
            dateOfBirth: profile.dateOfBirth.toISOString().split('T')[0],
            address: profile.address,
            city: profile.city
        };
    }

    cancelChanges(): void {
        this.loadProfileToForm();
        this.toastService.info('تم إلغاء التعديلات');
    }

    saveProfile(): void {
        if (!this.validateProfile()) return;

        this.userProfile.update(profile => ({
            ...profile,
            name: this.profileForm.name,
            email: this.profileForm.email,
            phone: this.profileForm.phone,
            nationalId: this.profileForm.nationalId,
            dateOfBirth: new Date(this.profileForm.dateOfBirth),
            address: this.profileForm.address,
            city: this.profileForm.city
        }));

        // In real app, save to backend here
        // TODO: Implement backend API call

        this.toastService.success('تم تحديث المعلومات بنجاح');
    }

    validateProfile(): boolean {
        if (!this.profileForm.name.trim()) {
            this.toastService.error('الرجاء إدخال الاسم');
            return false;
        }
        if (!this.profileForm.email.trim()) {
            this.toastService.error('الرجاء إدخال البريد الإلكتروني');
            return false;
        }
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(this.profileForm.email)) {
            this.toastService.error('البريد الإلكتروني غير صحيح');
            return false;
        }
        if (!this.profileForm.phone.trim()) {
            this.toastService.error('الرجاء إدخال رقم الهاتف');
            return false;
        }
        const phonePattern = /^[0-9]{10}$/;
        if (!phonePattern.test(this.profileForm.phone.replace(/\s/g, ''))) {
            this.toastService.error('رقم الهاتف يجب أن يكون 10 أرقام');
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

        // Admin can change password without knowing the current one
        // In real app, call backend API to change password
        // TODO: Implement backend API call
        this.toastService.success(`تم تغيير كلمة المرور بنجاح للمستخدم: ${this.userProfile().name}`);
        this.closeChangePasswordModal();
    }

    validatePassword(): boolean {
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
        return true;
    }

    resetPasswordForm(): void {
        this.passwordForm = {
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

            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.userProfile.update(profile => ({
                    ...profile,
                    profileImage: e.target.result
                }));
                this.toastService.success('تم تحديث الصورة الشخصية');
            };
            reader.readAsDataURL(file);
        }
    }

    goBack(): void {
        this.router.navigate(['/admin/admin-dashboard']);
    }
}
