import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GlobalVarsService } from '../../../global-vars.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ValidationService } from '../../../shared/services/validation.service';

interface User {
    id: string;
    name: string;
    email?: string;
    username?: string;
    role: 'admin' | 'driver' | 'officer';
    phone?: string;
    nationalId?: string;
    dateOfBirth?: Date;
    address?: string;
    city?: string;
    profileImage?: string;
}

type FilterRole = 'all' | 'admin' | 'driver' | 'officer';

@Component({
    selector: 'app-users-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './users-management.component.html',
    styleUrl: './users-management.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersManagementComponent {
    filterRole = signal<FilterRole>('all');
    isAddModalOpen = signal(false);
    isDeleteModalOpen = signal(false);
    userToDelete = signal<User | null>(null);

    newUser: {
        name: string;
        email: string;
        username: string;
        role: 'admin' | 'driver' | 'officer' | '';
        password: string;
    } = {
        name: '',
        email: '',
        username: '',
        role: '',
        password: ''
    };

    // Mock users database
    users = signal<User[]>([
        {
            id: this.generateId(),
            name: 'أحمد محمد العلي',
            email: 'admin@ambulance.sa',
            username: 'admin',
            role: 'admin',
            phone: '0501234567',
            nationalId: '1234567890',
            dateOfBirth: new Date('1990-01-01'),
            address: 'حي النخيل، طريق الملك فهد',
            city: 'الرياض',
            profileImage: undefined
        },
        {
            id: this.generateId(),
            name: 'إليانور بينا',
            email: 'eleanor.pena@example.com',
            username: 'epena',
            role: 'driver',
            profileImage: undefined
        },
        {
            id: this.generateId(),
            name: 'كاميرون ويليامسون',
            email: 'cameron.w@example.com',
            username: 'cwilliamson',
            role: 'driver',
            profileImage: undefined
        },
        {
            id: this.generateId(),
            name: 'جاكوب جونز',
            email: 'jacob.jones@example.com',
            username: '',
            role: 'driver',
            profileImage: undefined
        },
        {
            id: this.generateId(),
            name: 'محمد الأحمد',
            email: 'officer@ambulance.sa',
            username: 'officer1',
            role: 'officer',
            profileImage: undefined
        }
    ]);

    filteredUsers = computed(() => {
        const role = this.filterRole();
        if (role === 'all') {
            return this.users();
        }
        return this.users().filter(u => u.role === role);
    });

    constructor(
        private globalVars: GlobalVarsService,
        private router: Router,
        private toastService: ToastService,
        private validationService: ValidationService
    ) {
        this.globalVars.setGlobalHeader('إدارة المستخدمين');
    }

    private generateId(): string {
        return Date.now().toString() + Math.random().toString(36).substring(2, 9);
    }

    getRoleLabel(role: string): string {
        const roleMap: { [key: string]: string } = {
            'admin': 'مدير النظام',
            'driver': 'سائق',
            'officer': 'ضابط'
        };
        return roleMap[role] || role;
    }

    getUsersByRole(role: 'admin' | 'driver' | 'officer'): User[] {
        return this.users().filter(u => u.role === role);
    }

    addNewUser(): void {
        // Validate form
        if (!this.newUser.name.trim()) {
            this.toastService.error('الرجاء إدخال الاسم');
            return;
        }

        if (!this.newUser.role) {
            this.toastService.error('الرجاء اختيار الدور الوظيفي');
            return;
        }

        if (!this.newUser.username && !this.newUser.email) {
            this.toastService.error('يجب إدخال اسم المستخدم أو البريد الإلكتروني');
            return;
        }

        if (this.newUser.username) {
            const isValid = this.validationService.isValidUsername(this.newUser.username);
            if (!isValid) {
                this.toastService.error('اسم المستخدم غير صالح (3-20 حرف، أحرف وأرقام فقط)');
                return;
            }
        }

        if (this.newUser.email) {
            const isValid = this.validationService.isValidEmail(this.newUser.email);
            if (!isValid) {
                this.toastService.error('البريد الإلكتروني غير صالح');
                return;
            }
        }

        if (!this.newUser.password || this.newUser.password.length < 6) {
            this.toastService.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            return;
        }

        // Create new user
        const newUser: User = {
            id: this.generateId(),
            name: this.newUser.name,
            email: this.newUser.email || undefined,
            username: this.newUser.username || undefined,
            role: this.newUser.role as 'admin' | 'driver' | 'officer',
            profileImage: undefined
        };

        this.users.update(list => [...list, newUser]);
        this.toastService.success(`تمت إضافة مستخدم جديد: ${newUser.name} (${this.getRoleLabel(newUser.role)})`);
        this.isAddModalOpen.set(false);
        this.resetNewUserForm();
    }

    resetNewUserForm(): void {
        this.newUser = {
            name: '',
            email: '',
            username: '',
            role: '',
            password: ''
        };
    }

    isAddFormValid(): boolean {
        return !!(
            this.newUser.name &&
            this.newUser.role &&
            this.newUser.password &&
            (this.newUser.username || this.newUser.email)
        );
    }

    viewUserProfile(user: User): void {
        // Navigate to the profile page with the user's ID
        this.router.navigate(['/admin/profile', user.id]);
    }

    showDeleteConfirmation(user: User): void {
        this.userToDelete.set(user);
        this.isDeleteModalOpen.set(true);
    }

    closeDeleteConfirmation(): void {
        this.userToDelete.set(null);
        this.isDeleteModalOpen.set(false);
    }

    confirmDeleteUser(): void {
        const user = this.userToDelete();
        if (user) {
            this.users.update(list => list.filter(u => u.id !== user.id));
            this.toastService.success(`تم حذف المستخدم: ${user.name}`);
            this.closeDeleteConfirmation();
        }
    }
}
